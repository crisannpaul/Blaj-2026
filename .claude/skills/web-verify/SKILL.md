---
name: web-verify
description: Verify a web page visually before calling it done - deterministic screenshot audit plus a cold reviewer subagent. Use whenever building or changing a page, component, layout or stylesheet, or when asked whether something "looks right". Not for logic-only changes.
---

# web-verify

Writing CSS without looking at the result is coding open-loop. This closes the loop.

## Setup (once per machine)

```
npm install playwright-core        # ~600ms, browsers already cached in ~/AppData/Local/ms-playwright
```
If browsers are missing: `npx playwright install chromium`.

## Two tiers — use both, at different cadences

### Tier 1 — assertions. Every save. Free.

```
node .claude/skills/web-verify/audit.js file:///abs/path/page.html shots/
```

Screenshots at 390 / 768 / 1440 and measures: horizontal overflow, elements wider than the
viewport, WCAG contrast ratios, text under 12px, tap targets under 44px, images missing
width/height, console errors, and how far down the first screen content actually reaches.

**Never ask a model to check any of these.** They are measurements. A model is slower, costs
tokens, and is less reliable at them than a `getBoundingClientRect()` call.

Look at `shots/mobile-fold.png` yourself after every meaningful change. One image is cheap.

### Tier 2 — cold reviewer subagent. At milestones. Expensive.

Spawn a subagent on a strong model with `REVIEWER.md` as its prompt, filling in the URL,
the source path, and the acceptance criteria. It runs its own screenshot sweep, burns *its*
context on twenty images, and returns at most 8 ranked findings, each with a tight crop.

Run it when composition changed, before showing anyone, and before calling a page done.
Not on every save — it is slow and costs real money.

**Always cold.** Never continue a reviewer across iterations. The value is that it does not
know what you meant, so it sees what is there instead of what you intended.

## Why the division

The reviewer exists to keep the heavy half out of the author's context. It loads the full-page
screenshots; the author loads four crops and a fix list. If the reviewer starts returning
prose without images, or proposing code, that boundary has collapsed and the output is worth
less than doing it yourself.

## Rules that matter

- Force `.reveal`-style scroll-triggered elements visible before screenshotting, or the shots
  are blank and the review is worthless. `audit.js` already does this.
- Judge mobile first and at 390px. If it only works at 1440 it does not work.
- Contrast over a background *image or gradient* cannot be computed from CSS — `audit.js`
  skips those rather than emitting false alarms. Those need a human or the reviewer's eye.
- A hollow fold (content reaching under ~55% of the first screen) is usually a real
  composition problem, not a stylistic choice. Check it before shipping.
- Fix BLOCKING findings before anything else. Nits last, or never.
