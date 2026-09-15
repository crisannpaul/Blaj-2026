/**
 * Source photos -> web assets, for BOTH consumers.
 *
 *   npm run photos       (from the repo root, then rebuild and restart :3000)
 *
 * It was `ateliere-photos.js` until it grew the landing pass on 9 Sep; the file
 * is named for the command now, because a script called "ateliere" that also
 * writes `public/landing/` is a name that will mislead someone later.
 *
 * No image library is installed and none is added: the crop and the WebP
 * encode happen on a <canvas> inside the headless Chromium the verification
 * harness already ships. Sources are passed in as data: URLs on purpose — a
 * file:// page drawing a file:// image taints the canvas and `toBlob` throws.
 *
 * ── The two source folders ───────────────────────────────────────────────────
 *   docs/ateliere/poze-raw/   what the organizers sent. Wrong ratios, collages,
 *                             posters with baked-in titles. Cut by hand: each
 *                             entry in RAW below names its own window.
 *   docs/ateliere/poze-org/   settled artwork, generated or chosen by the user
 *                             and ALREADY 3:4. Not cropped, only resized.
 *   docs/poze-landing/        the two branch panels on `/`. 5:4. Stem is the
 *                             output name; see the LANDING block below.
 *
 * **poze-org wins.** A slug present there is taken from there and its RAW entry
 * is skipped, so replacing a card is a matter of dropping a file in and
 * re-running this. Neither folder ships: `docs/` is gitignored and
 * vercelignored (it also holds the treasure-hunt answer key), and only the
 * outputs under `public/ateliere/` reach the build.
 *
 * ── Naming in poze-org ───────────────────────────────────────────────────────
 * A file is matched to a workshop by its leading token, then by its role:
 *
 *   "Atelier 1 - Thumbnail.jpg"    position in the list, 1..10 -> card
 *   "A2 - Thumbnail.jpg"           the ORGANIZERS' number      -> card
 *   "masina-timpului - Thumbnail"  the slug, unambiguous       -> card
 *   "<any of those> - 2.jpg"       anything not "Thumbnail"    -> gallery image
 *
 * `Atelier 6` (position, = A7) and `A6` (organizers', = position 5) are
 * different workshops, which is why every run prints the resolved title next
 * to the file. **Read that line.** Naming by slug avoids the trap entirely.
 *
 * THE POSITION FORM IS A TRAP AND IT SPRANG. The folder held "Atelier 1..7 -
 * Thumbnail.jpg" from 8 Sep. A8 arrived on 14 Sep and took position 7, so the
 * next run silently handed `voluntari-in-misiune`'s artwork to
 * `pescari-de-oameni` and dropped voluntari back onto a raw cut — no error,
 * correct-looking output, wrong pictures. Every file in poze-org was renamed
 * to its slug that day. Name new ones by slug; positions move.
 *
 * ── Sizes ────────────────────────────────────────────────────────────────────
 * Cards are 3:4. The stage crops to that ratio and anchors clipped neighbours
 * at 50% 26%, so a card must BE 3:4 — handing a wide frame to `object-fit:
 * cover` crops it to a sliver in the browser instead of deliberately here.
 *
 * 720x960 is the working size: the largest a card renders is ~270px wide at
 * 1440 (540 device px), and the same file blown up as the graded backdrop sits
 * under a 68% wash that hides any softness. The strip loads all ten up
 * front, so the set has a budget — at 960x1280 the mosaic alone was 329KB.
 * An org source finer than that keeps its own resolution up to CARD_MAX,
 * because artwork with linework and lettering suffers more from downscaling
 * than a photograph does; it is never upscaled.
 */
const fs = require("fs");
const path = require("path");

/**
 * playwright-core lives in the verification harness's node_modules, not the
 * app's — nothing the site ships needs a browser. Resolve it from there too, so
 * this runs as `npm run photos` from the repo root instead of only from inside
 * the skill directory with NODE_PATH set by hand. The user re-runs this every
 * time they settle a new thumbnail; it should not need a ritual to remember.
 */
const { chromium } = (() => {
  try {
    return require("playwright-core");
  } catch {
    const harness = path.join(
      __dirname,
      "..",
      ".claude",
      "skills",
      "web-verify",
      "node_modules",
      "playwright-core",
    );
    try {
      return require(harness);
    } catch {
      console.error(
        "playwright-core not found. It ships with the verification harness:\n" +
          "  cd .claude/skills/web-verify && npm install",
      );
      process.exit(1);
    }
  }
})();

const ROOT = path.resolve(__dirname, "..");
const SRC_RAW = path.join(ROOT, "docs", "ateliere", "poze-raw");
// Overridable so the pipeline can be exercised against scratch inputs without
// writing into the curated folder or the live public/ tree. `--check` resolves
// a list of sample filenames and exits, touching no disk at all.
const SRC_ORG = process.env.ATELIERE_ORG || path.join(ROOT, "docs", "ateliere", "poze-org");
const OUT = process.env.ATELIERE_OUT || path.join(ROOT, "public", "ateliere");

/**
 * The LANDING pair. Same pipeline, different shape and a different reason.
 *
 * "docs/poze-landing/" is where the artwork for the two branch panels on "/"
 * lands, and it is the same trap as the folders above: "docs/" is gitignored
 * AND vercelignored and sits outside "public/", so a panel pointed straight at
 * a file in there works in dev and 404s in production. Nothing reaches the
 * build except what this writes into "public/landing/".
 *
 * A file's stem is its output name -- workshops.jpg -> workshops.webp, which is
 * what BRANCHES in src/app/page.tsx references. Drop a replacement in under the
 * same name and re-run. Anything else found is converted too and reported as
 * unreferenced rather than refused, so trying a new panel costs nothing.
 */
const SRC_LANDING = process.env.LANDING_SRC || path.join(ROOT, "docs", "poze-landing");
const OUT_LANDING = process.env.LANDING_OUT || path.join(ROOT, "public", "landing");

/**
 * 5:4, measured rather than chosen. An open branch panel is not one ratio -- it
 * runs 1.08 at 390 to 1.35 at lg -- and "object-cover" centre-crops, so the
 * surviving fraction of a source at ratio S in a box at ratio B is
 * min(S,B)/max(S,B). The geometric mean of that range is 1.21, and 5:4 is the
 * nearest ratio an image generator will actually emit: it keeps >=86% at 390
 * and >=92% at lg. See the export-geometry table in SPEC.
 *
 * 1200x960 is a CEILING, not a target: "native" keeps a source at its own
 * resolution and never upscales. The largest a panel is ever painted is 390x288
 * CSS px, i.e. 1170x864 on a 3x phone, so 1200 covers it with nothing wasted.
 */
const LANDING = { w: 1200, h: 960, quality: 0.82 };

/** Stems src/app/page.tsx actually points at. Anything else is spare. */
const LANDING_USED = ["workshops", "blajhunt"];

const CARD = { w: 720, h: 960, quality: 0.82 };
/** Ceiling for an org card that arrives finer than the working size. */
const CARD_MAX = { w: 960, h: 1280 };
/**
 * Gallery images for the detail pages. Native ratio, sized by HEIGHT.
 *
 * The strip they sit in is height-driven — 240 CSS px below `sm`, 288 at `sm`,
 * 320 at `lg` — and each image's width follows from its own ratio. So the long
 * edge is the wrong axis to size on, and it was wrong in both directions at
 * once: a portrait's long edge IS its height, so 1200 was ~2x over-spec, while
 * a landscape's long edge is its displayed WIDTH, so the 3.78:1 mosaic lunette
 * rendered 908 CSS px wide on a phone and was being fed 1200 — 0.66x, visibly
 * soft on the one image whose whole point is its sweep.
 *
 * `height` is in DEVICE pixels: 720 covers 240 CSS at 3x (a phone) and 320 at
 * 2.25x (a retina laptop). Never upscales — a source shorter than this keeps
 * its own height. `maxLong` is a stop for an extreme panorama, which at this
 * height would otherwise want to be thousands of pixels wide.
 */
const GALLERY = { height: 720, maxLong: 1800, quality: 0.8 };

/**
 * The backdrop tier. The stage paints the focused card's image a second time,
 * full-bleed and scaled 1.28, as the graded field behind everything — and at
 * 1440 that is a ~2.5x enlargement in which any lettering inside a source
 * becomes legible. The A2 collage put "Palatul Cultural" and "Discover!"
 * across the fold behind Romanian copy; the A4 collage's caption band did the
 * same before its window was moved off it.
 *
 * So the backdrop gets its OWN file, 120px wide. Upscaled ~15x by the browser
 * it is a soft field of the card's colours and large shapes — the blur is the
 * enlargement, so there is no `filter` to re-rasterise on every frame of the
 * 6s scale, which is what made a CSS blur the wrong answer on a phone. ~1KB
 * each, and it makes the backdrop what it was always meant to be: a colour
 * field, not a second copy of the picture.
 */
const BACKDROP = { w: 120, h: 160, quality: 0.72 };

/**
 * Everything with a card on the /ateliere strip, in strip order: the Blajhunt
 * (A1, from HUNT_CARD) then the ten workshops in the order
 * `src/lib/ateliere.ts` lists them. `no` is the ORGANIZERS' number, and since
 * the hunt joined the strip it is also the site's — A1–A11 throughout.
 *
 * The position in this array is what "Atelier N" in a filename means, and it
 * has now shifted TWICE: A8 arrived on 14 Sep and took position 7, then the
 * hunt took position 1 and pushed everything down again. A file named
 * "Atelier 3 - Thumbnail.jpg" has meant three different workshops in one week.
 * Name by slug. Everything in poze-org already is.
 */
const WORKSHOPS = [
  // A1. Not an entry in ATELIERE — it is HUNT_CARD, a card on the same strip
  // whose page is /blajhunt. It is here because it needs the same two assets
  // as everything else: a 3:4 card and a 120px backdrop.
  { slug: "blajhunt", no: 1, title: "Blajhunt (A1, the hunt)" },
  { slug: "masina-timpului", no: 2, title: "Cu mașina timpului prin Blaj" },
  { slug: "episcopul-tinerilor", no: 3, title: "În vizită la Episcopul Tinerilor" },
  { slug: "curajul-de-a-ti-urma-inima", no: 4, title: "Curajul de a-ți urma inima" },
  { slug: "iconar", no: 5, title: "Iconar pentru o zi" },
  { slug: "mozaicar", no: 6, title: "Artist mozaicar pentru o zi" },
  { slug: "curajul-de-a-ti-conduce-viata", no: 7, title: "Curajul de a-ți conduce propria viață" },
  { slug: "pescari-de-oameni", no: 8, title: "Pescari de oameni în lumea digitală" },
  { slug: "voluntari-in-misiune", no: 9, title: "Voluntari în misiune" },
  { slug: "inima-misiunilor", no: 10, title: "Expediție în Inima Misiunilor" },
  { slug: "salvator-de-vieti", no: 11, title: "Salvator de vieți" },
  { slug: "escape-mode", no: 12, title: "ESCAPE MODE" },
];

/**
 * Hand-cut windows into the raw deliveries. `focal` places the window, 0..1
 * per axis; `zoom` shrinks it below the largest 3:4 that fits (1 = largest),
 * which is how a card gets cut out of one panel of a collage. By eye, never
 * by centre. Each of these is superseded the moment poze-org carries the slug.
 */
const RAW = [
  // A poster with its title baked across the top. Cut below the title band, on
  // the cathedral and the rose window, so the card carries buildings not type.
  { slug: "masina-timpului", src: "Atelie_2_Unica.jpeg", focal: { x: 0, y: 1 }, zoom: 0.72 },
  // The street door of the Suciu house, the bishop's portrait in the right
  // pane. Near-square source; the window hugs the door.
  { slug: "episcopul-tinerilor", src: "Atelier_3_A.jpeg", focal: { x: 0.42, y: 0.5 } },
  // A collage with a caption band through the middle that came through the
  // backdrop wash as legible text at 1440. Bottom-left panel alone: the
  // sisters with the children in folk dress.
  { slug: "curajul-de-a-ti-urma-inima", src: "Atelier_4_A.jpeg", focal: { x: 0, y: 1 }, zoom: 0.5 },
  // Framed glass Madonna, already 0.78. Trim the width, keep the frame.
  { slug: "iconar", src: "Atelier_5_A.jpeg", focal: { x: 0.5, y: 0.5 } },
  // Tesserae are high-frequency detail and encode heavy: 424KB at 0.82/960.
  { slug: "mozaicar", src: "Atelier_6_B.jpeg", focal: { x: 0.5, y: 0.5 }, quality: 0.7 },
  // A DIMORA volunteer on the ground with two kids. Exactly 3:4 already.
  { slug: "voluntari-in-misiune", src: "Atelier_9_B.jpeg", focal: { x: 0.5, y: 0.5 } },
  // A7 has no photograph. It stays on a stock frame in src/lib/ateliere.ts and
  // says so on the card; there is deliberately no entry here for it — its
  // thumbnail was generated and lives in poze-org, which wins anyway.
];

/**
 * Slugs with no source of their own, whose CARD is a stock frame already
 * sitting in public/ateliere/. No card is written — the file is the card — but
 * a backdrop still is, because a stage where most slides fade to a soft field
 * and one snaps into a sharp photograph reads as a bug.
 *
 * EMPTY, for the fourth time in eight days. It held A7 until 8 Sep, A8/A10/A11
 * for six hours on 14 Sep, the Blajhunt for about an hour that evening, and
 * A12 overnight into 15 Sep. Every time, the artwork followed — which is the
 * argument for keeping the mechanism and the 1.jpg-6.jpg frames around rather
 * than deleting them the moment the list empties.
 *
 * TO USE IT: add { slug, src } naming a file already in public/ateliere/ (the
 * 1.jpg-6.jpg stock frames are kept there for exactly this) and set
 * `imagePlaceholder: true` on the entry in src/lib/ateliere.ts, which is what
 * puts "foto în curând" on the card. TO RETIRE ONE: drop
 * "<slug> - Thumbnail.jpg" into poze-org, remove both, re-run. poze-org wins
 * over this list anyway, so a leftover line would be dead config that nothing
 * warns about — which is why they are removed rather than left.
 */
const STOCK = [];

/**
 * Detail-page images from the raw deliveries, in display order. Same
 * relationship as RAW has to the cards: this is the fallback, and a slug that
 * gets `<slug> - N` files in poze-org is taken from there instead.
 *
 * It exists so the ten images the detail page ships with are REPRODUCIBLE. The
 * parallel session generated them by dropping renamed copies of raw photos
 * into its own worktree's poze-org — correct output, but the sources lived
 * only in that worktree, so the main tree would have gained ten binaries no
 * checkout could rebuild. Assets whose source of truth is a deleted directory
 * are exactly the drift CLAUDE.md is about.
 *
 * poze-org is the USER's curation folder and raw copies do not belong in it,
 * which is why this is a table here rather than files there.
 *
 * A4's three are institutional collages with captions baked in — the CMD
 * sisters, the intereparchial seminary, the Basilian sisters — and they were
 * held back on the grounds that a page of them says nothing about the
 * workshop. The user overruled that, and is right: the workshop is about
 * choosing between marriage, priesthood and consecrated life, so one panel per
 * community is the subject rather than decoration around it.
 *
 * Keyed by SLUG, never by number. The filenames carry the ORGANIZERS'
 * numbering (Atelier_4_* is A4) while the site now counts 01–10, so A4's
 * photographs belong to the workshop the site calls 03. Matching on slug is
 * what keeps that reorder from silently repointing a gallery.
 */
const GALLERY_RAW = [
  { slug: "episcopul-tinerilor", src: ["Atelier_3_B.jpeg", "Atelier_3_C.jpeg", "Atelier_3_D.jpeg"] },
  // ── The 14 Sep three. Their CARDS are stock placeholders, but the
  //    photographs the organizers sent are real and belong on the detail page,
  //    so the galleries are not held back waiting for artwork.
  // A8, site 07: the live broadcast desk overlooking the cathedral leads —
  // it is the workshop's whole argument, a liturgy going out over the air —
  // then the radio desk, then the studio with the station's own lettering.
  { slug: "pescari-de-oameni", src: ["Atelier_8_A.jpeg", "Atelier_8_B.jpeg", "Atelier_8_C.jpeg"] },
  // A10, site 09: Romanian children in Missio shirts ("Copiii ajută copiii",
  // named in the document), then the mission field, then a baptism there.
  { slug: "inima-misiunilor", src: ["Atelier_10_B.jpeg", "Atelier_10_E.jpeg", "Atelier_10_D.jpeg"] },
  // A11, site 10: the CPR session with the manikin is the subject; then hands
  // on with children at a public stand; then the ambulance. Atelier_11B is
  // 2.22:1, the widest source in the set — height-fitted like the mosaic
  // lunette, so it renders ~1600 CSS px wide and scrolls inside the strip.
  { slug: "salvator-de-vieti", src: ["Atelier_11A.jpeg", "Atelier_11C.jpeg", "Atelier_11B.jpeg"] },
  // Site 03. Every card now comes from poze-org, so the frames that used to be
  // consumed as card sources are free to be gallery images — this whole set
  // was, which is why the workshop had no gallery at all.
  { slug: "curajul-de-a-ti-urma-inima", src: ["Atelier_4_A.jpeg", "Atelier_4_B.jpeg", "Atelier_4_C.jpeg"] },
  // Atelier_5_A is the framed icon, and it leads: it is the only frame in the
  // set that shows the thing the workshop actually makes.
  { slug: "iconar", src: ["Atelier_5_A.jpeg", "Atelier_5_B.jpeg", "Atelier_5_C.jpeg"] },
  // Mosaic photographs are tesserae edge to edge — the densest thing in the
  // set and the most expensive to encode. At the shared 0.8 these three came
  // to 742KB between them, over half the gallery, on pages read outdoors on
  // mobile data. The same trade the mosaic CARD already makes at 0.7.
  { slug: "mozaicar", src: ["Atelier_6_A.png", "Atelier_6_C.jpeg", "Atelier_6_D.jpeg"], quality: 0.66 },
  { slug: "voluntari-in-misiune", src: ["Atelier_9_A.jpeg", "Atelier_9_C.jpeg"] },
];

const IMAGE = /\.(jpe?g|png|webp)$/i;
const mime = (f) =>
  f.toLowerCase().endsWith(".png")
    ? "image/png"
    : f.toLowerCase().endsWith(".webp")
      ? "image/webp"
      : "image/jpeg";

/**
 * "Atelier 1 - Thumbnail.jpg" -> { w, role: "card" }. Null when unmatched.
 *
 * Matches a known PREFIX rather than splitting the stem on dashes. Splitting
 * was wrong and shipped: eight of the ten slugs contain dashes, so
 * "episcopul-tinerilor - 1.jpg" split to head "episcopul" and went unmatched,
 * and the "<slug> - Thumbnail" convention in the header only ever worked for
 * the two single-word slugs. Prefix matching also accepts "Atelier 1-Thumb"
 * with no spaces, which splitting could not.
 */
const SLUGS_LONGEST_FIRST = WORKSHOPS.map((w) => w.slug).sort((a, b) => b.length - a.length);

function matchOrg(file) {
  const stem = file.replace(IMAGE, "").trim();
  const lower = stem.toLowerCase();

  let w = null;
  let how = "";
  let rest = "";

  const byPosition = lower.match(/^atelier\s*0*(\d+)/);
  const byNumber = !byPosition && lower.match(/^a\s*0*(\d+)(?!\w)/);
  // Longest first, so "curajul-de-a-ti-urma-inima" cannot be shadowed by a
  // shorter slug sharing its head.
  const bySlug = SLUGS_LONGEST_FIRST.find((s) => lower.startsWith(s));

  if (byPosition) {
    w = WORKSHOPS[Number(byPosition[1]) - 1] ?? null;
    how = `position ${byPosition[1]}`;
    rest = stem.slice(byPosition[0].length);
  } else if (byNumber) {
    w = WORKSHOPS.find((x) => x.no === Number(byNumber[1])) ?? null;
    how = `organizers' A${byNumber[1]}`;
    rest = stem.slice(byNumber[0].length);
  } else if (bySlug) {
    w = WORKSHOPS.find((x) => x.slug === bySlug) ?? null;
    how = "slug";
    rest = stem.slice(bySlug.length);
  }
  if (!w) return null;

  const tail = rest.replace(/^[\s._-]+/, "").trim();
  // No tail at all is a card too: "iconar.jpg" is the obvious way to name one.
  const role = tail === "" || /thumb/i.test(tail) ? "card" : "gallery";
  // Two cards for one workshop is normal while the user is still choosing —
  // "Atelier 1 - Thumbnail.jpg" beside "Atelier 1 - Thumbnail Alternativ.jpg".
  // Without a rank the winner is whichever name sorts first, and a space sorts
  // before a dot, so the ALTERNATIVE would have won silently. The plain name
  // wins; the other is reported as an unused alternative, not as an error.
  const rank = tail === "" || /^thumbnail$/i.test(tail) ? 2 : 1;
  return { w, role, rank, tail, how };
}

/** Sample names resolved and printed by `--check`, so the rules stay honest. */
const CHECK_SAMPLES = [
  "Atelier 1 - Thumbnail.jpg",
  "Atelier 7 - Thumbnail.png",
  "A6 - Thumbnail.jpg",
  "A9 - 2.jpeg",
  "iconar.jpg",
  "mozaicar - Thumbnail.webp",
  "episcopul-tinerilor - 1.jpeg",
  "voluntari-in-misiune - 3.jpg",
  "curajul-de-a-ti-urma-inima - Thumbnail.jpg",
  "curajul-de-a-ti-conduce-viata - 1.jpg",
  "Atelier 1-Thumbnail.jpg",
  "Atelier 12 - Thumbnail.jpg",
  "random holiday snap.jpg",
];

function readOrg() {
  if (!fs.existsSync(SRC_ORG))
    return { cards: new Map(), gallery: new Map(), skipped: [], alternates: [] };
  const cards = new Map();
  const gallery = new Map();
  const skipped = [];
  const alternates = [];
  for (const file of fs.readdirSync(SRC_ORG).sort()) {
    if (!IMAGE.test(file)) continue;
    const m = matchOrg(file);
    if (!m) {
      skipped.push(file);
      continue;
    }
    if (m.role === "card") {
      const held = cards.get(m.w.slug);
      if (!held) {
        cards.set(m.w.slug, { file, ...m });
      } else if (m.rank > held.rank) {
        cards.set(m.w.slug, { file, ...m });
        alternates.push(`${held.file} -> ${m.w.slug} (alternative, unused)`);
      } else {
        alternates.push(`${file} -> ${m.w.slug} (alternative, unused)`);
      }
    } else {
      gallery.set(m.w.slug, [...(gallery.get(m.w.slug) ?? []), { file, ...m }]);
    }
  }
  return { cards, gallery, skipped, alternates };
}

/**
 * Draws one window and returns the encoded bytes plus what it did. Two modes,
 * because the two consumers constrain different axes, and neither crops to a
 * square — which is what the gallery did for one build, calling the ratio mode
 * with w === h and cutting the 1818x481 lunette down to 481x481.
 *
 *   fit: "ratio"   crop to w:h. What a CARD needs — the stage's 3:4 is a
 *                  contract, so the window is chosen here rather than by the
 *                  browser's `object-fit: cover`.
 *   fit: "height"  keep the source ratio, scale to `h` device px tall, with
 *                  `w` as a stop on the long edge. What a GALLERY image needs,
 *                  because the strip it sits in fixes the height and lets the
 *                  width follow.
 *
 * Never upscales in either mode: a source with less than is asked for keeps
 * what it has.
 */
const CUT = async ({ data, w, h, quality, focal, zoom, native, fit }) => {
  const img = new Image();
  await new Promise((ok, err) => {
    img.onload = ok;
    img.onerror = err;
    img.src = data;
  });

  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  let sx = 0;
  let sy = 0;
  let outW;
  let outH;

  if (fit === "height") {
    // h is the target height in device px, w the ceiling on the long edge.
    // Never upscale; whichever limit binds first wins.
    const scale = Math.min(1, h / sh, w / Math.max(sw, sh));
    outW = Math.round(sw * scale);
    outH = Math.round(sh * scale);
  } else {
    // Largest window of the target ratio that fits, shrunk by `zoom`, placed
    // by `focal`. With zoom 1 and a source already at the ratio this is a
    // no-op beyond rounding.
    const ratio = w / h;
    if (sw / sh > ratio) sw = Math.round(sh * ratio);
    else sh = Math.round(sw / ratio);
    sw = Math.round(sw * zoom);
    sh = Math.round(sh * zoom);
    sx = Math.round((img.naturalWidth - sw) * focal.x);
    sy = Math.round((img.naturalHeight - sh) * focal.y);
    // `native` keeps a fine source at its own resolution rather than throwing
    // it away, but never upscales past what the source actually holds.
    outW = native ? Math.min(w, sw) : w;
    outH = Math.round(outW / ratio);
  }

  const c = document.createElement("canvas");
  c.width = outW;
  c.height = outH;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
  const blob = await new Promise((ok) => c.toBlob(ok, "image/webp", quality));
  const buf = new Uint8Array(await blob.arrayBuffer());
  let s = "";
  for (const b of buf) s += String.fromCharCode(b);
  return {
    b64: btoa(s),
    src: `${img.naturalWidth}x${img.naturalHeight}`,
    crop: `${sw}x${sh}@${sx},${sy}`,
    out: `${outW}x${outH}`,
  };
};

(async () => {
  if (process.argv.includes("--check")) {
    console.log("\nfilename resolution (no files touched)\n");
    for (const s of CHECK_SAMPLES) {
      const m = matchOrg(s);
      console.log(
        `  ${s.padEnd(44)} ${m ? `${m.role.padEnd(8)} ${m.w.slug.padEnd(30)} [${m.how}]` : "UNMATCHED"}`,
      );
    }
    console.log("");
    return;
  }

  fs.mkdirSync(OUT, { recursive: true });
  const org = readOrg();

  let browser;
  for (const o of [{}, { channel: "chrome" }, { channel: "msedge" }]) {
    try {
      browser = await chromium.launch(o);
      break;
    } catch {
      /* next */
    }
  }
  if (!browser) throw new Error("no chromium");
  const page = await browser.newPage();
  await page.setContent("<!doctype html><title>cut</title>");

  const run = async (dir, file, out, opts, outDir = OUT) => {
    const data = `data:${mime(file)};base64,${fs.readFileSync(path.join(dir, file)).toString("base64")}`;
    const res = await page.evaluate(CUT, { data, ...opts });
    fs.writeFileSync(path.join(outDir, out), Buffer.from(res.b64, "base64"));
    return { ...res, kb: Math.round(fs.statSync(path.join(outDir, out)).size / 1024) };
  };

  let bytes = 0;

  console.log("\nCARDS");
  for (const w of WORKSHOPS) {
    const hit = org.cards.get(w.slug);
    const out = `${w.slug}.webp`;
    // Whichever source wins the card also cuts the backdrop, from the same
    // window, so the field behind a slide is that slide's own colours.
    let win;

    if (hit) {
      win = { dir: SRC_ORG, file: hit.file, focal: { x: 0.5, y: 0.5 }, zoom: 1 };
      const r = await run(SRC_ORG, hit.file, out, {
        focal: win.focal,
        zoom: win.zoom,
        w: CARD_MAX.w,
        h: CARD_MAX.h,
        quality: CARD.quality,
        native: true,
      });
      bytes += r.kb;
      console.log(
        `  org  ${hit.file.padEnd(30)} -> ${out.padEnd(32)} ${r.src.padEnd(10)} -> ${r.out.padEnd(10)} ${String(r.kb).padStart(4)}KB   [${hit.how}: ${w.title}]`,
      );
    } else if (STOCK.some((s) => s.slug === w.slug)) {
      const stock = STOCK.find((s) => s.slug === w.slug);
      win = { dir: OUT, file: stock.src, focal: { x: 0.5, y: 0.5 }, zoom: 1 };
      console.log(`  stock ${stock.src.padEnd(29)} -> ${"(card unchanged)".padEnd(32)} backdrop only — ${w.title}`);
    } else {
      const raw = RAW.find((r) => r.slug === w.slug);
      if (!raw) {
        console.log(`  --   ${"(no source)".padEnd(30)}    ${w.slug} — ${w.title}`);
        continue;
      }
      win = { dir: SRC_RAW, file: raw.src, focal: raw.focal, zoom: raw.zoom ?? 1 };
      const r = await run(SRC_RAW, raw.src, out, {
        focal: win.focal,
        zoom: win.zoom,
        w: CARD.w,
        h: CARD.h,
        quality: raw.quality ?? CARD.quality,
        native: false,
      });
      bytes += r.kb;
      console.log(
        `  raw  ${raw.src.padEnd(30)} -> ${out.padEnd(32)} ${r.src.padEnd(10)} cut ${r.crop.padEnd(18)} -> ${r.out.padEnd(10)} ${String(r.kb).padStart(4)}KB`,
      );
    }

    const bg = `${w.slug}-bg.webp`;
    const rb = await run(win.dir, win.file, bg, {
      focal: win.focal,
      zoom: win.zoom,
      w: BACKDROP.w,
      h: BACKDROP.h,
      quality: BACKDROP.quality,
      native: false,
    });
    bytes += rb.kb;
    console.log(`       ${"".padEnd(30)} -> ${bg.padEnd(32)} ${"backdrop".padEnd(10)} -> ${rb.out.padEnd(10)} ${String(rb.kb).padStart(4)}KB`);
  }

  // Detail-page images. Nothing emits until poze-org carries files that are
  // not thumbnails; the shape is here so dropping them in is the whole job.
  // Detail-page images. poze-org wins per slug, exactly as it does for cards,
  // so settling real artwork for a workshop replaces its whole gallery.
  const gallerySources = new Map();
  for (const g of GALLERY_RAW) {
    gallerySources.set(g.slug, { dir: SRC_RAW, files: g.src, quality: g.quality });
  }
  for (const [slug, items] of org.gallery) {
    gallerySources.set(slug, { dir: SRC_ORG, files: items.map((i) => i.file) });
  }

  if (gallerySources.size) {
    console.log("\nGALLERY");
    for (const w of WORKSHOPS) {
      const g = gallerySources.get(w.slug);
      if (!g) continue;
      for (const [i, file] of g.files.entries()) {
        const out = `${w.slug}-${i + 1}.webp`;
        const r = await run(g.dir, file, out, {
          fit: "height",
          w: GALLERY.maxLong,
          h: GALLERY.height,
          quality: g.quality ?? GALLERY.quality,
          focal: { x: 0.5, y: 0.5 },
          zoom: 1,
          native: true,
        });
        bytes += r.kb;
        const from = g.dir === SRC_ORG ? "org" : "raw";
        console.log(
          `  ${from}  ${file.padEnd(30)} -> ${out.padEnd(32)} ${r.src.padEnd(10)} -> ${r.out.padEnd(10)} ${String(r.kb).padStart(4)}KB`,
        );
      }
    }
  }

  if (org.alternates.length) {
    console.log("\nALTERNATIVES in poze-org — a second card for a workshop that");
    console.log("already has a plainly-named 'Thumbnail'. Nothing was written from these:");
    for (const f of org.alternates) console.log(`  ${f}`);
    console.log("  To use one, make it the plain name and rename the current card.");
  }

  if (org.skipped.length) {
    console.log("\nUNMATCHED in poze-org — these produced NOTHING:");
    for (const f of org.skipped) console.log(`  ${f}`);
    console.log("  Name them 'Atelier <1-7> - Thumbnail.ext', 'A<number> - Thumbnail.ext'");
    console.log("  or '<slug> - Thumbnail.ext'. Anything after the dash that is not");
    console.log("  'Thumbnail' is treated as a gallery image.");
  }

  console.log(`\n${bytes}KB written to ${path.relative(ROOT, OUT) || OUT}\n`);
  // -- LANDING ---------------------------------------------------------------
  let landingBytes = 0;
  const landingFiles = fs.existsSync(SRC_LANDING)
    ? fs.readdirSync(SRC_LANDING).filter((x) => IMAGE.test(x)).sort()
    : [];

  if (!landingFiles.length) {
    console.log("");
    console.log("LANDING - nothing in " + path.relative(ROOT, SRC_LANDING) + ", skipped");
  } else {
    fs.mkdirSync(OUT_LANDING, { recursive: true });
    console.log("");
    console.log("LANDING  (5:4 branch panels)");
    const spare = [];
    for (const file of landingFiles) {
      const stem = file.replace(IMAGE, "");
      const out = stem + ".webp";
      const r = await run(
        SRC_LANDING,
        file,
        out,
        {
          focal: { x: 0.5, y: 0.5 },
          zoom: 1,
          w: LANDING.w,
          h: LANDING.h,
          quality: LANDING.quality,
          native: true,
        },
        OUT_LANDING,
      );
      landingBytes += r.kb;
      const used = LANDING_USED.includes(stem);
      if (!used) spare.push(out);
      console.log(
        "  " + file.padEnd(30) + " -> " + out.padEnd(28) + r.src.padEnd(10) +
          " -> " + r.out.padEnd(10) + String(r.kb).padStart(4) + "KB" +
          (used ? "" : "   [not referenced by page.tsx]"),
      );
    }
    if (spare.length) {
      console.log("");
      console.log("  Converted but UNUSED - the landing page references only");
      console.log("  " + LANDING_USED.map((x) => x + ".webp").join(", ") + ". To use one of these,");
      console.log("  point BRANCHES in src/app/page.tsx at it, or rename the source.");
    }
    console.log("");
    console.log(
      landingBytes + "KB written to " + (path.relative(ROOT, OUT_LANDING) || OUT_LANDING),
    );
  }

  await browser.close();
})();
