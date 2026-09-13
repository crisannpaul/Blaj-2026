const { chromium } = require('playwright-core');

async function launch() {
  for (const opts of [{}, { channel: 'chrome' }, { channel: 'msedge' }]) {
    try { return await chromium.launch(opts); } catch (e) {}
  }
  throw new Error('no browser');
}

(async () => {
  const browser = await launch();
  for (const rate of [1, 6]) {
    for (const url of ['http://localhost:3002/', 'http://localhost:3002/glass']) {
      const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
        isMobile: true, hasTouch: true, colorScheme: 'light',
      });
      const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate });
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      const r = await page.evaluate(() => new Promise(res => {
        const t = []; let last = performance.now(); const t0 = last;
        function tick(now) { t.push(now - last); last = now; if (now - t0 < 4000) requestAnimationFrame(tick); else finish(); }
        function finish() {
          t.shift();
          const s = [...t].sort((a, b) => a - b);
          res({
            frames: t.length,
            fps: +(1000 / (t.reduce((a, b) => a + b, 0) / t.length)).toFixed(1),
            medianMs: +s[Math.floor(s.length / 2)].toFixed(1),
            p95Ms: +s[Math.floor(s.length * 0.95)].toFixed(1),
            maxMs: +s[s.length - 1].toFixed(1),
            over33: t.filter(x => x > 33).length,
          });
        }
        requestAnimationFrame(tick);
      }));
      console.log('cpu/' + rate + 'x  ' + url.padEnd(32), JSON.stringify(r));
      await ctx.close();
    }
  }
  await browser.close();
})();
