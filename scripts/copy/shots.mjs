/**
 * Walkthrough screenshots for the copy-review document (scripts/copy/README.md).
 *
 *   node scripts/copy/shots.mjs [baseUrl]        default http://localhost:3000
 *
 * One 390px phone frame per page TYPE — the fold for the two carousels, the
 * whole page for the three that scroll — written to docs/copy/shots/. Uses the
 * web-verify harness's own playwright-core, so there is nothing to install.
 * Motion is reduced so the marquee and the branch panels hold still.
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";

const require = createRequire(
  path.resolve(".claude/skills/web-verify/package.json"),
);
const { chromium } = require("playwright-core");

const base = process.argv[2] ?? "http://localhost:3000";
const out = "docs/copy/shots";
mkdirSync(out, { recursive: true });

const PAGES = [
  { name: "acasa", path: "/", fullPage: false },
  { name: "ateliere", path: "/ateliere", fullPage: false },
  { name: "atelier", path: "/ateliere/masina-timpului", fullPage: true },
  { name: "blajhunt", path: "/blajhunt", fullPage: true },
  { name: "oprire", path: "/blajhunt/catedrala", fullPage: true },
];

let browser;
for (const opts of [{}, { channel: "chrome" }, { channel: "msedge" }]) {
  try {
    browser = await chromium.launch(opts);
    break;
  } catch {
    /* try the next channel */
  }
}
if (!browser) throw new Error("No Chromium found for playwright-core");

const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  reducedMotion: "reduce",
  locale: "ro-RO",
});

for (const p of PAGES) {
  const page = await ctx.newPage();
  await page.goto(base + p.path, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  const file = path.join(out, `${p.name}.png`);
  await page.screenshot({ path: file, fullPage: p.fullPage });
  console.log(`${p.path} -> ${file}`);
  await page.close();
}
await browser.close();
