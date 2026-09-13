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
      const d = cx.getImageData(2*dsf, 30*dsf, 12*dsf, 150*dsf).data;
      let rs=0,gs=0,bs=0,n=0,ch=0;
      for (let i=0;i<d.length;i+=4){rs+=d[i];gs+=d[i+1];bs+=d[i+2];ch+=Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2]);n++;}
      return { rgb:[Math.round(rs/n),Math.round(gs/n),Math.round(bs/n)], chroma:+(ch/n).toFixed(1) };
    }, { b64, dsf });
  };
  const dsf = 2;
  let fails = 0;
  for (let i = 0; i < 6; i++) {
    const ctx = await browser.newContext({ viewport: { width: 195, height: 422 }, deviceScaleFactor: dsf,
      isMobile: true, hasTouch: true, reducedMotion: 'reduce', colorScheme: 'light' });
    const page = await ctx.newPage();
    await page.goto('http://localhost:3002/glass', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    for (const y of [0, 187, 374]) {
      await page.evaluate(yy => window.scrollTo(0, yy), y);
      await page.waitForTimeout(600);
      const buf = await page.screenshot();
      const s = await stats(buf, dsf);
      const bad = s.chroma > 12;
      if (bad) { fails++; await page.screenshot({ path: path.join(OUT, `c11d-flake-${i}-${y}.png`) }); }
      console.log('run', i, 'y', y, JSON.stringify(s), bad ? 'FROST LOST' : 'ok');
    }
    await ctx.close();
  }
  console.log('fails', fails);
  await browser.close();
})();
