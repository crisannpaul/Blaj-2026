/**
 * Glyph-masked rendered-ink contrast (SPEC 6.2).
 *
 * audit.js reports "contrast skipped" for text sitting over art, because the
 * declared colour tells you nothing once opacity, colour alpha and blend modes
 * are in play. This measures what actually got painted: screenshot twice, once
 * normally and once with the ink forced transparent, keep only the pixels that
 * changed a lot (the glyph cores), and compare rendered ink against rendered
 * backdrop at those exact coordinates.
 *
 *   node .claude/skills/web-verify/ink.js <url> <width> <height> [scrollY]
 *
 * The 98% glyph-core cutoff below is calibrated, not a guess. If you ever
 * change it, re-calibrate against a control whose two colours are flat and
 * known: 13px #525252 on #f4fafe is 7.43:1 by arithmetic.
 */
const { chromium } = require("playwright-core");

const url = process.argv[2];
const W = parseInt(process.argv[3] || "390", 10);
const H = parseInt(process.argv[4] || "844", 10);
const SCROLL = parseInt(process.argv[5] || "0", 10);

const COLLECT = () => {
  // Only leaves: an element whose own text nodes carry the glyphs. Measuring a
  // container would mask its children's glyphs too and report a blend.
  const out = [];
  document.querySelectorAll("body *").forEach((el) => {
    const own = Array.from(el.childNodes).some(
      (n) => n.nodeType === 3 && n.textContent.trim(),
    );
    if (!own) return;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    if (r.bottom < 0 || r.top > innerHeight) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") return;
    el.setAttribute("data-ink-id", String(out.length));
    out.push({
      id: out.length,
      tag: el.tagName.toLowerCase(),
      text: el.textContent.trim().slice(0, 44),
      size: parseFloat(cs.fontSize),
      weight: parseInt(cs.fontWeight, 10) || 400,
      declared: cs.color,
      box: {
        x: Math.max(0, Math.floor(r.left)),
        y: Math.max(0, Math.floor(r.top)),
        w: Math.ceil(Math.min(r.width, innerWidth - r.left)),
        h: Math.ceil(Math.min(r.height, innerHeight - r.top)),
      },
    });
  });
  return out;
};

const MEASURE = async ({ pngA, pngB, items, dpr }) => {
  const load = (b64) =>
    new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = "data:image/png;base64," + b64;
    });
  const [ia, ib] = await Promise.all([load(pngA), load(pngB)]);
  const grab = (img) => {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext("2d").drawImage(img, 0, 0);
    return c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
  };
  const A = grab(ia);
  const B = grab(ib);
  const stride = ia.naturalWidth * 4;

  const chan = (v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const lum = (r, g, b) =>
    0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
  const ratio = (l1, l2) =>
    (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  return items.map((it) => {
    const x0 = Math.round(it.box.x * dpr);
    const y0 = Math.round(it.box.y * dpr);
    const x1 = Math.min(ia.naturalWidth, Math.round((it.box.x + it.box.w) * dpr));
    const y1 = Math.min(ia.naturalHeight, Math.round((it.box.y + it.box.h) * dpr));

    let maxDiff = 0;
    const diffs = [];
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const p = y * stride + x * 4;
        const d =
          Math.abs(A[p] - B[p]) +
          Math.abs(A[p + 1] - B[p + 1]) +
          Math.abs(A[p + 2] - B[p + 2]);
        if (d > 0) {
          diffs.push([p, d]);
          if (d > maxDiff) maxDiff = d;
        }
      }
    }
    if (maxDiff === 0) return { ...it, glyphPixels: 0 };

    // Glyph CORE only, and "core" has to mean FULLY covered.
    //
    // A 75% cutoff (what this started at) still admits pixels that are only
    // three-quarters ink, and their measured contrast is a blend. Calibrated
    // against a control whose colours are both flat and known --- 13px
    // #525252 on #f4fafe, 7.43:1 by arithmetic --- a 75% cutoff read 4.86:1,
    // i.e. it under-reported by a third and would have failed text that is
    // fine. 98% of the strongest change reproduces the arithmetic.
    const cut = maxDiff * 0.98;
    const ratios = [];
    for (const [p, d] of diffs) {
      if (d < cut) continue;
      const li = lum(A[p], A[p + 1], A[p + 2]); // ink as painted
      const lb = lum(B[p], B[p + 1], B[p + 2]); // backdrop at the same pixel
      ratios.push(ratio(li, lb));
    }
    if (!ratios.length) return { ...it, glyphPixels: 0 };
    ratios.sort((a, b) => a - b);
    return {
      ...it,
      glyphPixels: ratios.length,
      min: ratios[0],
      p05: ratios[Math.floor(ratios.length * 0.05)],
      median: ratios[Math.floor(ratios.length / 2)],
    };
  });
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
    isMobile: W < 700,
    hasTouch: W < 700,
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(900); // let the shader paint its one frame
  if (SCROLL) {
    await page.evaluate((y) => window.scrollTo(0, y), SCROLL);
    await page.waitForTimeout(400);
  }

  const items = await page.evaluate(COLLECT);
  const pngA = (await page.screenshot()).toString("base64");
  await page.evaluate(() => {
    document.querySelectorAll("[data-ink-id]").forEach((el) => {
      el.style.setProperty("color", "transparent", "important");
      el.style.setProperty("-webkit-text-fill-color", "transparent", "important");
    });
  });
  await page.waitForTimeout(200);
  const pngB = (await page.screenshot()).toString("base64");

  const rows = await page.evaluate(MEASURE, { pngA, pngB, items, dpr: 2 });
  await browser.close();

  const floor = (r) =>
    r.size >= 24 || (r.size >= 18.66 && r.weight >= 700) ? 3 : 4.5;
  rows.sort((a, b) => (a.median ?? 99) - (b.median ?? 99));
  console.log(`\n${url}  ${W}x${H}   rendered-ink contrast at glyph cores`);
  console.log("  median  min   px    floor size  element / text");
  let bad = 0;
  for (const r of rows) {
    if (!r.glyphPixels) continue;
    const f = floor(r);
    const fail = r.median < f;
    if (fail) bad++;
    console.log(
      `  ${fail ? "FAIL" : "ok  "} ${r.median.toFixed(2)}  ${r.min.toFixed(2)}  ${String(r.glyphPixels).padStart(4)}  ${f}    ${r.size.toFixed(0)}px  <${r.tag}> ${JSON.stringify(r.text)}`,
    );
  }
  const noGlyph = rows.filter((r) => !r.glyphPixels);
  if (noGlyph.length)
    console.log(
      `  (${noGlyph.length} element(s) produced no glyph pixels: ${noGlyph.map((r) => r.tag).join(", ")})`,
    );
  console.log(bad ? `\n${bad} FAILING` : "\nall pass");
})();
