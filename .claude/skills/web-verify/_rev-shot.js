const { chromium } = require('playwright-core');
const path = require('path');

const OUT = 'C:/Users/Pablito/.claude/jobs/d74aabde/tmp/review';
const URL = 'http://localhost:3002/glass';

async function launch() {
  for (const opts of [{}, { channel: 'chrome' }, { channel: 'msedge' }]) {
    try { return await chromium.launch(opts); } catch (e) {}
  }
  throw new Error('no browser');
}

const SHOTS = [
  { name: 'w320', w: 320, h: 568, mobile: true },
  { name: 'w390', w: 390, h: 844, mobile: true },
  { name: 'w768', w: 768, h: 1024, mobile: true },
  { name: 'w1440', w: 1440, h: 900, mobile: false },
  { name: 'land390', w: 844, h: 390, mobile: true },
  { name: 'zoom200', w: 195, h: 422, mobile: true },
];

(async () => {
  const browser = await launch();
  for (const s of SHOTS) {
    const ctx = await browser.newContext({
      viewport: { width: s.w, height: s.h },
      deviceScaleFactor: 2,
      isMobile: s.mobile,
      hasTouch: s.mobile,
      reducedMotion: 'reduce',
      colorScheme: 'light',
    });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, s.name + '-fold.png') });
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    console.log(s.name, 'scrollHeight', h, 'viewport', s.h);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, s.name + '-tab1.png') });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, s.name + '-tab2.png') });
    await ctx.close();
  }
  await browser.close();
})();
