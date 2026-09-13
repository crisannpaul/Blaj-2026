const { chromium } = require('playwright-core');

async function launch() {
  for (const opts of [{}, { channel: 'chrome' }, { channel: 'msedge' }]) {
    try { return await chromium.launch(opts); } catch (e) {}
  }
  throw new Error('no browser');
}

// regions are in CSS px at dsf 1
const JOBS = [
  { url: 'http://localhost:3002/glass', w: 390, h: 844, tag: 'glass390', regions: {
      paneGapRow:   [0, 578, 390, 14],      // pane between lead and cards, no text
      paneBehindH1: [150, 330, 216, 10],    // pane right of "Blaj 2026" glyphs
      goldChip:     [296, 640, 64, 100],    // inside collapsed gold chip, above letters? letters centred
      goldChipTop:  [296, 604, 64, 26],     // chip top, above the B
    } },
  { url: 'http://localhost:3002/', w: 390, h: 844, tag: 'flat390', regions: {
      paneGapRow:   [0, 578, 390, 14],
      goldChip:     [296, 640, 64, 100],
    } },
];

(async () => {
  const browser = await launch();
  const probe = await (await browser.newContext()).newPage();
  for (const j of JOBS) {
    const ctx = await browser.newContext({
      viewport: { width: j.w, height: j.h }, deviceScaleFactor: 1,
      isMobile: true, hasTouch: true, reducedMotion: 'reduce', colorScheme: 'light',
    });
    const page = await ctx.newPage();
    const resp = await page.goto(j.url, { waitUntil: 'networkidle' }).catch(e => null);
    if (!resp || !resp.ok()) { console.log(j.tag, 'NOT OK', resp && resp.status()); await ctx.close(); continue; }
    await page.waitForTimeout(900);
    const buf = await page.screenshot();
    const b64 = buf.toString('base64');
    await probe.setContent('<canvas id=c></canvas>');
    const out = await probe.evaluate(async ({ b64, regions }) => {
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = 'data:image/png;base64,' + b64; });
      const c = document.getElementById('c');
      c.width = img.width; c.height = img.height;
      const cx = c.getContext('2d', { willReadFrequently: true });
      cx.drawImage(img, 0, 0);
      const res = {};
      for (const [name, [x, y, w, h]] of Object.entries(regions)) {
        const d = cx.getImageData(x, y, w, h).data;
        const L = [];
        let rs = 0, gs = 0, bs = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) {
          const [r, g, b] = [d[i], d[i + 1], d[i + 2]];
          rs += r; gs += g; bs += b; n++;
          const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
          L.push(0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b));
        }
        L.sort((a, b2) => a - b2);
        const mean = L.reduce((a, b2) => a + b2, 0) / L.length;
        const sd = Math.sqrt(L.reduce((a, b2) => a + (b2 - mean) ** 2, 0) / L.length);
        res[name] = {
          n, meanRGB: [Math.round(rs / n), Math.round(gs / n), Math.round(bs / n)],
          Lmin: +L[0].toFixed(4), Lp05: +L[Math.floor(L.length * 0.05)].toFixed(4),
          Lmed: +L[Math.floor(L.length * 0.5)].toFixed(4),
          Lp95: +L[Math.floor(L.length * 0.95)].toFixed(4), Lmax: +L[L.length - 1].toFixed(4),
          Lsd: +sd.toFixed(4),
          spread95: +(L[Math.floor(L.length * 0.95)] - L[Math.floor(L.length * 0.05)]).toFixed(4),
        };
      }
      return res;
    }, { b64, regions: j.regions });
    console.log('=== ' + j.tag + ' ===');
    console.log(JSON.stringify(out, null, 1));
    await ctx.close();
  }
  await browser.close();
})();
