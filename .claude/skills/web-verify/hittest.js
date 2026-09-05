// Hit-test every interactive element: is the thing you would tap actually the
// thing that receives the tap?
//
// This exists because a link can be present, focusable, correctly sized, pass
// every contrast and tap-target check, and still be dead — because a later
// sibling with no pointer-events:none paints over it. Nothing else in the
// harness catches that. `elementFromPoint` at each element's centre does.
//
//   node .claude/skills/web-verify/hittest.js <baseUrl> [route,route,...]
//
// ON WINDOWS, RUN THIS FROM POWERSHELL, not Git Bash. MSYS rewrites any value
// that looks like a POSIX path before it reaches node.exe - as an argument AND
// inside an env var - so "/,/ateliere" arrives as "C:/Program Files/Git/".
//
//   $env:ROUTES = "/,/ateliere"; node .claude/skills/web-verify/hittest.js http://localhost:3000
const path = require("path");
const { chromium } = require(path.join(__dirname, "node_modules", "playwright-core"));

const BASE = process.argv[2] || "http://localhost:3000";
const ROUTES = (process.env.ROUTES || process.argv[3] || "/")
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);

(async () => {
  const browser = await (async () => {
    for (const o of [{}, { channel: "chrome" }, { channel: "msedge" }]) {
      try { return await chromium.launch(o); } catch { /* try next */ }
    }
    throw new Error("no browser");
  })();

  let problems = 0;

  for (const route of ROUTES) {
    for (const [w, h] of [[390, 844], [1440, 900]]) {
      const page = await browser.newPage({ viewport: { width: w, height: h } });
      await page.goto(BASE + route, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);

      const results = await page.evaluate(() =>
        [...document.querySelectorAll("a[href], button, [role=button], input, select")]
          .map((el) => {
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height) return null;
            const cx = r.x + r.width / 2;
            const cy = r.y + r.height / 2;
            if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) return null;
            const hit = document.elementFromPoint(cx, cy);
            const ok = hit === el || el.contains(hit);
            return {
              name: (el.getAttribute("aria-label") || el.textContent.trim()).slice(0, 24) || el.tagName,
              ok,
              blockedBy: ok ? null : hit ? hit.tagName + "." + String(hit.className).slice(0, 50) : "nothing",
            };
          })
          .filter(Boolean)
      );

      const dead = results.filter((r) => !r.ok);
      problems += dead.length;
      console.log(`${route.padEnd(12)} ${w}x${h}  ${results.length} interactive, ${dead.length} unreachable`);
      dead.forEach((d) => console.log(`    BLOCKED  "${d.name}"  covered by ${d.blockedBy}`));
      await page.close();
    }
  }

  await browser.close();
  console.log(problems === 0 ? "\nOK - every interactive element receives its own clicks"
                             : `\n${problems} unreachable element(s)`);
  process.exit(problems === 0 ? 0 : 1);
})();
