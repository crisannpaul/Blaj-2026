const { chromium } = require('playwright-core');

async function launch() {
  for (const opts of [{}, { channel: 'chrome' }, { channel: 'msedge' }]) {
    try { return await chromium.launch(opts); } catch (e) {}
  }
  throw new Error('no browser');
}

const REG = {
  // collapsed chip at 390 is li#2 x290..366 y596..804 (state A: gold collapsed)
  chipLeftStrip: [292, 610, 12, 180],
  chipRightStrip: [352, 610, 12, 180],
  chipRim: [290, 690, 4, 20],        // the 2px rim + edge on the chip's left
  chipInner: [300, 690, 10, 20],
  // open card at 390 state A: li#1 x24..282 y596..804; lip is bottom 56px => y748..804
  lipStrip: [200, 752, 70, 20],      // inside lip, right of the word "Ateliere"
  aboveLip: [200, 726, 70, 18],      // photo just above the lip's hard edge
  // sheet
  sheetTopEdge: [150, 258, 90, 6],
  aboveSheet: [150, 246, 90, 8],
};

(async () => {
  const browser = await launch();
  const probe = await (await browser.newContext()).newPage();
  async function shoot(page, tag, regions) {
    const buf = await page.screenshot();
    const b64 = buf.toString('base64');
    await probe.setContent('<canvas id=c></canvas>');
    const out = await probe.evaluate(async ({ b64, regions }) => {
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = 'data:image/png;base64,' + b64; });
      const c = document.getElementById('c'); c.width = img.width; c.height = img.height;
      const cx = c.getContext('2d', { willReadFrequently: true });
      cx.drawImage(img, 0, 0);
      const res = {};
      for (const [name, [x, y, w, h]] of Object.entries(regions)) {
        const d = cx.getImageData(x, y, w, h).data;
        const L = []; let rs = 0, gs = 0, bs = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) {
          const [r, g, b] = [d[i], d[i+1], d[i+2]];
          rs += r; gs += g; bs += b; n++;
          const f = v => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
          L.push(0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b));
        }
        L.sort((a,b2)=>a-b2);
        const mean = L.reduce((a,b2)=>a+b2,0)/L.length;
        const sd = Math.sqrt(L.reduce((a,b2)=>a+(b2-mean)**2,0)/L.length);
        res[name] = { rgb: [Math.round(rs/n), Math.round(gs/n), Math.round(bs/n)],
          Lp05: +L[Math.floor(L.length*0.05)].toFixed(4), Lmed: +L[Math.floor(L.length*0.5)].toFixed(4),
          Lp95: +L[Math.floor(L.length*0.95)].toFixed(4), Lsd: +sd.toFixed(4) };
      }
      return res;
    }, { b64, regions });
    console.log('=== ' + tag + ' ===');
    console.log(JSON.stringify(out));
  }

  for (const url of ['http://localhost:3002/glass', 'http://localhost:3002/']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1,
      isMobile: true, hasTouch: true, reducedMotion: 'reduce', colorScheme: 'light' });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    await shoot(page, url + ' stateA', REG);
    await page.keyboard.press('Tab'); await page.waitForTimeout(300);
    await page.keyboard.press('Tab'); await page.waitForTimeout(600);
    // now card1 collapsed (sky chip) at x24..100, card2 open
    await shoot(page, url + ' stateB', {
      skyChipLeft: [28, 610, 12, 180],
      skyChipRight: [86, 610, 12, 180],
      openLip: [400, 752, 70, 20],
      abovePhoto: [400, 726, 70, 18],
    });
    await ctx.close();
  }
  await browser.close();
})();
