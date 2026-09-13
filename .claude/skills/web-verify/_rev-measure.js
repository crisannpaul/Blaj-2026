const { chromium } = require('playwright-core');

const URL = 'http://localhost:3002/glass';

async function launch() {
  for (const opts of [{}, { channel: 'chrome' }, { channel: 'msedge' }]) {
    try { return await chromium.launch(opts); } catch (e) {}
  }
  throw new Error('no browser');
}

const SIZES = [
  [320, 568], [390, 844], [768, 1024], [1440, 900], [844, 390], [195, 422],
];

(async () => {
  const browser = await launch();
  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 1,
      isMobile: w < 900,
      hasTouch: w < 900,
      reducedMotion: 'reduce',
      colorScheme: 'light',
    });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    const data = await page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
      const fs = (el) => el ? { size: getComputedStyle(el).fontSize, lh: getComputedStyle(el).lineHeight, weight: getComputedStyle(el).fontWeight } : null;
      const sheet = q('.glass-frost.glass-rim');
      const h1 = q('h1');
      const kicker = h1 && h1.querySelectorAll('span')[1];
      const title = h1 && h1.querySelectorAll('span')[2];
      const meta = q('h1 + p');
      const lead = q('h1 + p + p');
      const ul = q('ul');
      const lis = [...document.querySelectorAll('ul > li')];
      // gather every text node size on the page
      const sizes = {};
      document.querySelectorAll('*').forEach(el => {
        const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        if (!hasText) return;
        const cs = getComputedStyle(el);
        const k = cs.fontSize + '/' + cs.fontWeight;
        sizes[k] = (sizes[k] || 0) + 1;
      });
      return {
        vw: innerWidth, vh: innerHeight,
        scrollH: document.documentElement.scrollHeight,
        sheet: box(sheet),
        kicker: { box: box(kicker), ...fs(kicker) },
        title: { box: box(title), ...fs(title) },
        meta: { box: box(meta), ...fs(meta) },
        lead: { box: box(lead), ...fs(lead), chars: lead ? lead.textContent.length : 0 },
        ul: box(ul),
        lis: lis.map(l => box(l)),
        sizes,
        sheetPad: sheet ? getComputedStyle(sheet).padding : null,
        gapKickerTitle: title && kicker ? Math.round(title.getBoundingClientRect().top - kicker.getBoundingClientRect().bottom) : null,
        gapTitleMeta: meta && title ? Math.round(meta.getBoundingClientRect().top - title.getBoundingClientRect().bottom) : null,
        gapMetaLead: lead && meta ? Math.round(lead.getBoundingClientRect().top - meta.getBoundingClientRect().bottom) : null,
        gapLeadUl: ul && lead ? Math.round(ul.getBoundingClientRect().top - lead.getBoundingClientRect().bottom) : null,
        sheetBottomPad: sheet ? Math.round(sheet.getBoundingClientRect().bottom - ul.getBoundingClientRect().bottom) : null,
        sheetTopPad: sheet ? Math.round(h1.getBoundingClientRect().top - sheet.getBoundingClientRect().top) : null,
      };
    });
    console.log('=== ' + w + 'x' + h + ' ===');
    console.log(JSON.stringify(data, null, 1));
    await ctx.close();
  }
  await browser.close();
})();
