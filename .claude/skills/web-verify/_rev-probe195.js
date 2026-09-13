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
  const ctx = await browser.newContext({ viewport: { width: 195, height: 422 }, deviceScaleFactor: 1,
    isMobile: true, hasTouch: true, reducedMotion: 'reduce', colorScheme: 'light' });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3002/glass', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  for (const y of [0, 60, 120, 180, 240, 300, 374]) {
    await page.mouse.wheel(0, 0);
    await page.evaluate(yy => window.scrollTo(0, yy), y);
    await page.waitForTimeout(500);
    const geo = await page.evaluate(() => {
      const s = document.querySelector('.glass-frost.glass-rim');
      const r = s.getBoundingClientRect();
      const cs = getComputedStyle(s);
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), bg: cs.backgroundColor,
        bf: cs.backdropFilter || cs.webkitBackdropFilter, sy: Math.round(scrollY),
        elAt100: (() => { const e = document.elementFromPoint(97, 100); return e ? e.className.toString().slice(0, 40) : null; })() };
    });
    const buf = await page.screenshot();
    const b64 = buf.toString('base64');
    await probe.setContent('<canvas id=c></canvas>');
    const px = await probe.evaluate(async (b64) => {
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = 'data:image/png;base64,' + b64; });
      const cv = document.getElementById('c'); cv.width = img.width; cv.height = img.height;
      const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
      const sample = (x, y, w, h) => {
        const d = cx.getImageData(x, y, w, h).data;
        let rs=0,gs=0,bs=0,n=0,ch=0;
        for (let i=0;i<d.length;i+=4){rs+=d[i];gs+=d[i+1];bs+=d[i+2];ch+=Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2]);n++;}
        return { rgb:[Math.round(rs/n),Math.round(gs/n),Math.round(bs/n)], chroma:+(ch/n).toFixed(1) };
      };
      return { strip: sample(4, 40, 12, 300) };   // left gutter of the pane, no text
    }, b64);
    console.log('scrollY', String(y).padStart(3), JSON.stringify(geo), JSON.stringify(px));
  }
  await page.evaluate(() => window.scrollTo(0, 374));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, 'c11-z200-scrolled-frost-lost.png') });
  await browser.close();
})();
