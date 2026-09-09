import fs from "node:fs";
import path from "node:path";

/**
 * Gallery images for `/ateliere/[slug]`, discovered from disk at build time.
 *
 * `scripts/ateliere-photos.js` writes a workshop's extra photographs to
 * `public/ateliere/<slug>-1.webp`, `<slug>-2.webp`, … in the order the user
 * numbered them in `docs/ateliere/poze-org/`. This reads that folder back, so
 * there is no manifest to keep in sync: drop photos in, run the script, build.
 *
 * It also reads each file's pixel size out of the WebP header so every `<img>`
 * ships with width and height and the strip cannot shift as it loads
 * (GUIDELINES 6). Server-only — it touches the filesystem — and the pages that
 * call it are statically prerendered, so this runs once per slug at build.
 */

export interface GalleryImage {
  /** Public URL. */
  src: string;
  width: number;
  height: number;
}

const DIR = path.join(process.cwd(), "public", "ateliere");

/** Pixel size from a WebP header — simple (VP8), lossless (VP8L) or extended (VP8X). */
function webpSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 30 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") {
    return null;
  }
  const chunk = buf.toString("ascii", 12, 16);
  if (chunk === "VP8 ") {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === "VP8L") {
    const bits = buf.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X") {
    return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
  }
  return null;
}

export function galleryFor(slug: string): GalleryImage[] {
  if (!fs.existsSync(DIR)) return [];
  const re = new RegExp(`^${slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d+)\\.webp$`);
  return fs
    .readdirSync(DIR)
    .map((file) => ({ file, m: file.match(re) }))
    .filter((x): x is { file: string; m: RegExpMatchArray } => x.m !== null)
    .sort((a, b) => Number(a.m[1]) - Number(b.m[1]))
    .flatMap(({ file }) => {
      const size = webpSize(fs.readFileSync(path.join(DIR, file)));
      // A file the header parser cannot read is a broken asset, not a page
      // without a gallery. Fail the build rather than ship an <img> with no size.
      if (!size) throw new Error(`ateliere-gallery: cannot read WebP size of public/ateliere/${file}`);
      return [{ src: `/ateliere/${file}`, ...size }];
    });
}
