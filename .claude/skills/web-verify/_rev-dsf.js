const { chromium } = require('playwright-core');
const path = require('path');
const OUT = 'C:/Users/Pablito/.claude/jobs/d74aabde/tmp/review';

async function launch() {
  for (const opts of [{}, { channel: 'chrome' }, { channel: 'msedge' }]) {
    try { return await chromium.launch(opts); } catch (e) {}
  }
  throw new Error('no browser');
}

(async () => {
  const browser = await launch();
  const probe = await (await browser.newContext()).newPage();
  const stats = async (buf, dsf) => {
    const b64 = buf.toString('base64');
    await probe.setContent('<canvas id=c></canvas>');
    return probe.evaluate(async ({ b64, dsf }) => {
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = 'data:image/png;base64,' + b64; });
      const cv = document.getElementById('c'); cv.width = img.width; cv.height = img.height;
      const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
      const d = cx.getImageData(2 * dsf, 30 * dsf, 12 * dsf, 150 * dsf).data;
      let rs = 0, gs = 0, bs = 0, n = 0, ch = 0;
      for (let i = 0; i < d.length; i += 4) { rs += d[i]; gs += d[i+1]; bs += d[i+2]; ch += Math.max(d[i],d[i+1],d[i+2]) - Math.min(d[i],d[i+1],d[i+2]); n++; }
      return { rgb: [Math.round(rs/n), Math.round(gs/n), Math.round(bs/n)], chroma: +(ch/n).toFixed(1) };
    }, { b64, dsf });
  };

  for (const [w, h, sy] of [[195, 422, 374], [320, 568, 80], [844, 390, 101], [390, 844, 0]]) {
    for (const dsf of [1, 2, 3]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf,
        isMobile: true, hasTouch: true, reducedMotion: 'reduce', colorScheme: 'light' });
      const page = await ctx.newPage();
      await page.goto('http://localhost:3002/glass', { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      await page.evaluate(y => window.scrollTo(0, y), sy);
      await page.waitForTimeout(600);
      const buf = await page.screenshot();
      console.log(`${w}x${h} dsf${dsf} scroll${sy}`, JSON.stringify(await stats(buf, dsf)));
      if (w === 195 && dsf === 2) await page.screenshot({ path: path.join(OUT, 'c11b-z200-dsf2-scrolled.png') });
      await ctx.close();
    }
  }
  await browser.close();
})();
