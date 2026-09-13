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

(async () => {
  const browser = await launch();
  const shot = async (o) => {
    const ctx = await browser.newContext({
      viewport: { width: o.w, height: o.h }, deviceScaleFactor: o.dsf || 2,
      isMobile: o.w < 900, hasTouch: o.w < 900,
      reducedMotion: 'reduce', colorScheme: 'light',
    });
    const page = await ctx.newPage();
    await page.goto(o.url || URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    for (let i = 0; i < (o.tabs || 0); i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(400); }
    if (o.scroll) { await page.evaluate(y => scrollTo(0, y), o.scroll); await page.waitForTimeout(400); }
    await page.screenshot({ path: path.join(OUT, o.name + '.png'), clip: o.clip });
    console.log('wrote', o.name);
    await ctx.close();
  };

  // 1. pane mottle behind the copy, 390
  await shot({ name: 'c1-pane-mottle-390', w: 390, h: 844, clip: { x: 0, y: 252, width: 390, height: 330 } });
  // 2. both cards at 390, state A
  await shot({ name: 'c2-cards-390', w: 390, h: 844, clip: { x: 16, y: 586, width: 358, height: 230 } });
  // 3. gold chip magnified
  await shot({ name: 'c3-gold-chip', w: 390, h: 844, dsf: 3, clip: { x: 284, y: 590, width: 90, height: 220 } });
  // 3b. same chip on the flat landing, for comparison
  await shot({ name: 'c3b-gold-chip-flat', w: 390, h: 844, dsf: 3, url: 'http://localhost:3002/', clip: { x: 284, y: 590, width: 90, height: 220 } });
  // 4. lip hard edge, magnified
  await shot({ name: 'c4-lip-edge', w: 390, h: 844, dsf: 3, clip: { x: 24, y: 716, width: 260, height: 92 } });
  // 5. 320 whole fold
  await shot({ name: 'c5-320-fold', w: 320, h: 568 });
  // 5b. 320 scrolled to bottom
  await shot({ name: 'c5b-320-bottom', w: 320, h: 568, scroll: 200 });
  // 6. 195x422 (200% zoom) fold + scrolled
  await shot({ name: 'c6-zoom200-fold', w: 195, h: 422, dsf: 3 });
  await shot({ name: 'c6b-zoom200-cards', w: 195, h: 422, dsf: 3, scroll: 400 });
  // 7. 1440 left vignette + card edge
  await shot({ name: 'c7-1440-vignette', w: 1440, h: 900, dsf: 1, clip: { x: 0, y: 0, width: 1100, height: 620 } });
  // 8. sky chip state B at 390
  await shot({ name: 'c8-sky-chip', w: 390, h: 844, dsf: 3, tabs: 2, clip: { x: 18, y: 590, width: 90, height: 220 } });
  // 9. landscape 844x390 - empty pane right of cards
  await shot({ name: 'c9-land-fold', w: 844, h: 390, dsf: 1.4, scroll: 101 });
  // 10. 768 pane right gutter
  await shot({ name: 'c10-768-pane', w: 768, h: 1024, dsf: 1.5, clip: { x: 24, y: 351, width: 576, height: 660 } });
  await browser.close();
})();
