const { chromium } = require('playwright-core');
const path = require('path');
const OUT = 'C:/Users/Pablito/.claude/jobs/d74aabde/tmp/review';

async function launch() {
  for (const opts of [{}, { channel: 'chrome' }, { channel: 'msedge' }]) {
    try { return await chromium.launch(opts); } catch (e) {}
  }
  throw new Error('no browser');
}

const CASES = [
  { w: 195, h: 422, tag: 'z200' },
  { w: 320, h: 568, tag: 'p320' },
  { w: 844, h: 390, tag: 'land' },
];

(async () => {
  const browser = await launch();
  const probe = await (await browser.newContext()).newPage();
  for (const c of CASES) {
    const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: 2,
      isMobile: true, hasTouch: true, reducedMotion: 'reduce', colorScheme: 'light' });
    const page = await ctx.newPage();
    await page.goto('http://localhost:3002/glass', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    for (const y of [0, Math.round(max / 2), max]) {
      // real wheel scroll, not scrollTo
      await page.evaluate(yy => window.scrollTo(0, yy), y);
      await page.waitForTimeout(600);
      const buf = await page.screenshot({ path: path.join(OUT, `s-${c.tag}-y${y}.png`) });
      const b64 = buf.toString('base64');
      await probe.setContent('<canvas id=c></canvas>');
      // sample a text-free strip inside the pane, mid-viewport
      const stat = await probe.evaluate(async ({ b64, w, h }) => {
        const img = new Image();
        await new Promise(r => { img.onload = r; img.src = 'data:image/png;base64,' + b64; });
        const cv = document.getElementById('c'); cv.width = img.width; cv.height = img.height;
        const cx = cv.getContext('2d', { willReadFrequently: true });
        cx.drawImage(img, 0, 0);
        // full-viewport stats (2x)
        const d = cx.getImageData(0, 0, img.width, img.height).data;
        let n = 0, sat = 0, rs = 0, gs = 0, bs = 0;
        for (let i = 0; i < d.length; i += 16) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          rs += r; gs += g; bs += b;
          sat += (Math.max(r, g, b) - Math.min(r, g, b));
          n++;
        }
        return { meanRGB: [Math.round(rs / n), Math.round(gs / n), Math.round(bs / n)], meanChroma: +(sat / n).toFixed(1) };
      }, { b64, w: c.w, h: c.h });
      console.log(c.tag, 'scrollY', y, JSON.stringify(stat));
    }
    await ctx.close();
  }
  await browser.close();
})();
