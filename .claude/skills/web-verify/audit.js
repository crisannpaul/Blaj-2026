/**
 * Deterministic visual audit. Tier 1 of web-verify: no model, no judgement.
 * Run this on every save. It is free, instant, and catches everything a
 * measurement can catch, so the reviewer agent never wastes tokens on it.
 *
 *   node audit.js <url> <outDir> [--crop "<selector>" --name <label>]
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const url = process.argv[2];
const outDir = process.argv[3] || 'shots';
const argv = process.argv.slice(4);
const cropSel = argv.includes('--crop') ? argv[argv.indexOf('--crop') + 1] : null;
const cropName = argv.includes('--name') ? argv[argv.indexOf('--name') + 1] : 'crop';

const VIEWPORTS = [
  { name: 'mobile',  width: 390,  height: 844, mobile: true },
  { name: 'tablet',  width: 768,  height: 1024, mobile: true },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
];

const IN_PAGE = () => {
  const out = { overflow: 0, wide: [], small_targets: [], tiny_text: [], contrast: [],
                contrast_skipped_over_art: 0, no_dims: [] };
  const de = document.documentElement;
  const fold = de.clientHeight;
  out.overflow = de.scrollWidth - de.clientWidth;

  const sig = el => {
    const cls = (typeof el.className === 'string' ? el.className : '').trim().split(/\s+/)[0];
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : cls ? '.' + cls : '');
  };

  // Luminance.
  //
  // Do NOT parse the colour string. Chromium serialises computed colours in
  // whatever space they were authored in: rgb()/rgba() in 0-255, color(srgb ...)
  // in 0-1, and — the one that bites — oklab() for anything Tailwind v4 emits as
  // an alpha, because `bg-card/90` compiles to `color-mix(in oklab, ...)`. Read
  // as 0-255 sRGB, a near-white `oklab(0.99 0.001 -0.002)` gives luminance
  // 0.000064, i.e. black, and every element over it is reported as a contrast
  // failure. That produced 33 false failures on one page before it was caught.
  //
  // Let the browser do the conversion instead: canvas normalises any CSS colour
  // it can parse to sRGB bytes, in every colour space, now and for whatever gets
  // added next.
  const _cx = (() => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 1;
    return cv.getContext('2d', { willReadFrequently: true });
  })();
  const lum = c => {
    if (!c) return null;
    // An unparseable value leaves fillStyle at its previous setting, so seed a
    // sentinel and detect the no-op rather than silently measuring the old colour.
    _cx.fillStyle = '#010203';
    _cx.fillStyle = c;
    if (_cx.fillStyle === '#010203' && !/^#010203$/i.test(String(c).trim())) return null;
    // Composite over WHITE before measuring. A translucent colour
    // (`bg-brand/5` -> oklab(... / 0.05)) is not its own luminance: what the
    // eye gets is that colour over whatever is behind it. Measuring it neat
    // reports the undiluted ink and fails text that is fine — a 5% sky wash on
    // a white card read as 2.56:1 where the RENDERED value is 5.89:1.
    // White is the right backdrop to assume here and not a guess: this project
    // is light-theme-only by rule (one :root, no .dark), and the surfaces these
    // washes sit on are --card and --background, both #ffffff.
    // A fully opaque colour is unaffected — it covers the white completely.
    _cx.clearRect(0, 0, 1, 1);
    _cx.fillStyle = "#ffffff";
    _cx.fillRect(0, 0, 1, 1);
    _cx.fillStyle = c;
    _cx.fillRect(0, 0, 1, 1);
    const d = _cx.getImageData(0, 0, 1, 1).data;
    if (d[3] === 0) return null;
    const [r, g, b] = [d[0], d[1], d[2]].map(v => {
      v = v / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  // Text over a photo/gradient cannot be judged from CSS alone. Detect backdrops that
  // background-walking misses: absolutely positioned art layers (.hero-media, <img>) and
  // ::before/::after art. Page-level texture on <body>/<html> is ignored on purpose --
  // a grain overlay is not a backdrop and would otherwise disqualify every element.
  const overArt = el => {
    const r1 = el.getBoundingClientRect();
    let n = el;
    while (n && n !== document.body && n.nodeType === 1) {
      const nh = n.getBoundingClientRect().height;
      for (const pe of ['::before', '::after']) {
        const cs = getComputedStyle(n, pe);
        if (!cs || !cs.backgroundImage || cs.backgroundImage === 'none') continue;
        // a 3px accent bar is not a backdrop; only a layer that covers the host is
        const ph = parseFloat(cs.height);
        if (!isNaN(ph) && nh > 0 && ph < nh * 0.6) continue;
        return true;
      }
      for (const c of n.children) {
        if (c === el || c.contains(el)) continue;
        const cs = getComputedStyle(c);
        if (!/absolute|fixed/.test(cs.position)) continue;
        const art = cs.backgroundImage !== 'none' || /^(IMG|VIDEO|CANVAS|SVG)$/.test(c.tagName);
        if (!art) continue;
        const r2 = c.getBoundingClientRect();
        if (r1.left < r2.right && r1.right > r2.left && r1.top < r2.bottom && r1.bottom > r2.top) return true;
      }
      n = n.parentElement;
    }
    return false;
  };

  const bgOf = el => {
    let n = el;
    while (n && n.nodeType === 1) {
      const c = getComputedStyle(n).backgroundColor;
      if (c && !/^rgba\(0, 0, 0, 0\)$|transparent/.test(c)) return c;
      n = n.parentElement;
    }
    return 'rgb(255, 255, 255)';
  };

  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width > de.clientWidth + 1 && r.height > 0) {
      out.wide.push(sig(el) + ' w=' + Math.round(r.width) + ' vw=' + de.clientWidth);
    }
  });

  document.querySelectorAll('a,button,summary,input,select,[role="button"]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    if (r.height < 44 || r.width < 44) out.small_targets.push(sig(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
  });

  document.querySelectorAll('p,span,a,li,h1,h2,h3,h4,h5,h6,dt,dd,small,button,summary,figcaption,b,strong,em').forEach(el => {
    if (!el.textContent.trim()) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize);
    if (size < 12) out.tiny_text.push(sig(el) + ' ' + size.toFixed(1) + 'px');
    if (overArt(el)) { out.contrast_skipped_over_art++; return; }
    const l1 = lum(cs.color), l2 = lum(bgOf(el));
    if (l1 == null || l2 == null) return;
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const floor = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
    if (ratio < floor) out.contrast.push(sig(el) + ' ' + ratio.toFixed(2) + ':1 (needs ' + floor + ') ' + size.toFixed(0) + 'px');
  });

  document.querySelectorAll('img').forEach(i => {
    if (!i.getAttribute('width') || !i.getAttribute('height')) out.no_dims.push(i.getAttribute('src') || '(no src)');
  });

  // Hollow-fold check. Only leaf content counts -- a container "contains text" and spans
  // the whole screen, which is why measuring containers always returns 100%.
  const leaves = Array.prototype.filter.call(document.querySelectorAll('body *'), el => {
    if (/^(IMG|SVG|VIDEO)$/.test(el.tagName)) return true;
    if (!el.textContent.trim()) return false;
    return !Array.prototype.some.call(el.children, c => c.textContent.trim());
  });
  const bands = [];
  leaves.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.height === 0 || r.bottom <= 0 || r.top >= fold) return;
    bands.push([Math.max(0, r.top), Math.min(fold, r.bottom)]);
  });
  bands.sort((a, b) => a[0] - b[0]);
  let gap = 0, gapAt = 0, cursor = 0;
  bands.forEach(([t, b]) => {
    if (t - cursor > gap) { gap = t - cursor; gapAt = cursor; }
    cursor = Math.max(cursor, b);
  });
  if (fold - cursor > gap) { gap = fold - cursor; gapAt = cursor; }
  out.largest_empty_band_pct = Math.round((gap / fold) * 100);
  out.largest_empty_band_at_pct = Math.round((gapAt / fold) * 100);
  return out;
};

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  let browser;
  for (const opts of [{}, { channel: 'chrome' }, { channel: 'msedge' }]) {
    try { browser = await chromium.launch(opts); break; } catch (e) { /* try next */ }
  }
  if (!browser) { console.error('FATAL: no chromium available'); process.exit(1); }

  const report = { url, generated: new Date().toISOString(), viewports: {} };

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2, isMobile: vp.mobile, hasTouch: vp.mobile,
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
    page.on('pageerror', e => errors.push('pageerror: ' + e.message.slice(0, 200)));

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    // scroll-triggered content would otherwise screenshot blank
    await page.evaluate(() => {
      document.querySelectorAll('.reveal,[data-reveal]').forEach(el => el.classList.add('in'));
    });
    await page.waitForTimeout(250);

    if (cropSel) {
      const loc = page.locator(cropSel).first();
      if (await loc.count()) {
        const p = path.join(outDir, `${cropName}-${vp.name}.png`);
        await loc.screenshot({ path: p });
        console.log('crop ->', p);
      } else {
        console.log('crop selector not found at', vp.name, ':', cropSel);
      }
      await ctx.close();
      continue;
    }

    const a = await page.evaluate(IN_PAGE);
    a.console_errors = errors;
    report.viewports[vp.name] = a;

    await page.screenshot({ path: path.join(outDir, `${vp.name}-fold.png`) });
    await page.screenshot({ path: path.join(outDir, `${vp.name}-full.png`), fullPage: true });

    const fail = a.overflow > 0 || a.wide.length || a.contrast.length || a.tiny_text.length || errors.length;
    console.log(`\n### ${vp.name}  ${vp.width}x${vp.height}   ${fail ? 'ISSUES' : 'clean'}`);
    console.log('  horizontal overflow :', a.overflow, a.overflow > 0 ? '<-- FAIL' : 'ok');
    console.log('  oversized elements  :', a.wide.length ? a.wide.slice(0, 5) : 'none');
    console.log('  contrast failures   :', a.contrast.length ? a.contrast.slice(0, 6) : 'none');
    console.log('  text under 12px     :', a.tiny_text.length ? a.tiny_text.slice(0, 5) : 'none');
    console.log('  tap targets < 44px  :', a.small_targets.length, a.small_targets.slice(0, 6));
    console.log('  img without w/h     :', a.no_dims.length);
    console.log('  console errors      :', errors.length ? errors.slice(0, 3) : 'none');
    console.log('  largest empty band:', a.largest_empty_band_pct + '% of the first screen, starting at ' + a.largest_empty_band_at_pct + '%',
                a.largest_empty_band_pct > 30 ? '<-- hollow fold, check composition' : '');
    console.log('  contrast skipped  :', a.contrast_skipped_over_art, '(text over image/gradient - needs eyes)');
    await ctx.close();
  }

  await browser.close();
  if (!cropSel) {
    fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
    console.log('\nreport ->', path.join(outDir, 'report.json'));
  }
})();
