---
name: web-dev
description: Build and change web UI - pages, components, layouts, stylesheets - with a design rubric applied while authoring and a cold visual review delegated after meaningful changes. Use whenever writing or editing HTML/CSS/JSX that a human will look at, or when asked whether something looks right. Not for logic-only or backend work.
---

# web-dev

Writing CSS without looking at the result is coding open-loop. This skill is the loop.

**Before writing UI code, read both files in this directory:**

1. `vercel-web-interface-guidelines.md` — Vercel Labs' MUST/SHOULD/NEVER baseline, vendored
   verbatim (MIT). Interactions, keyboard, forms, animation, content handling, performance,
   hydration, theming. Especially load-bearing for anything with inputs.
2. `GUIDELINES.md` — the layer on top: composition, hierarchy, spacing and type rhythm, accent
   economy, and the ten landing-page failure modes.

The reviewer audits against the same two files. Author and reviewer share one standard on
purpose — that is what makes its findings actionable rather than a matter of opinion.

## Workflow

1. **Author** against `GUIDELINES.md`. Tokens first, mobile first, 390px.
2. **Look** — run tier 1 after every meaningful change and open `mobile-fold.png` yourself:
   ```
   node .claude/skills/web-verify/audit.js <url> <outDir>
   ```
   One image is cheap. Never claim a page looks right without having seen it.
3. **Delegate a cold review** at the trigger points below.
4. **Fix** BLOCKING first, then SHOULD-FIX. Nits last or never. Re-run tier 1 to confirm.

## When to delegate the reviewer

**Do delegate:** composition or layout changed; a new page or component exists; both palettes
or dark mode were touched; before showing it to anyone; before calling it done; on request.

**Do not delegate:** copy edits, token value tweaks, content swapped into an existing layout,
logic-only changes. It is slow and costs real money — tier 1 covers these.

## How to delegate

Spawn a subagent on a **strong model**, **cold every time** — never continue a previous
reviewer. Its value is that it does not know what you intended, so it sees what is there.

Prompt template:

```
You are a cold visual reviewer. Read and follow EXACTLY the contract in:
  <abs path>/.claude/skills/web-verify/REVIEWER.md
Audit against BOTH rubrics:
  <abs path>/.claude/skills/web-dev/vercel-web-interface-guidelines.md   (baseline)
  <abs path>/.claude/skills/web-dev/GUIDELINES.md                        (composition layer)
Obey the output contract literally: the finding cap, "no image no finding",
the crop size limit, and the ban on proposing code.

Page:    <url>   (plus any alternate palette/theme URLs)
Source:  <abs path to the file(s) it is built from>
Crops:   <abs scratch dir, create it>
Run the harness from <project root> so node resolves playwright-core.

Acceptance criteria:
  <audience, primary device, tone, what "done" means>
  <what is a DELIBERATE placeholder and therefore not a finding -- but say so if a
   placeholder is rendered in a way that looks broken or cheap>

Already measured by tier 1, DO NOT re-report:
  <paste the audit.js summary>

Be aggressive and specific. I would rather hear that it looks cheap than be flattered.
```

The "already measured, do not re-report" block is not optional. Without it the reviewer spends
its budget rediscovering numbers instead of making the judgements only it can make.

## Rules that hold regardless

- Tokens, never raw values. A hex outside the token block is a defect.
- Mobile is the target, not an adaptation. If it only works at 1440 it does not work.
- Force scroll-triggered elements visible before screenshotting or the shots are blank.
- **The harness is code, and code is wrong until verified.** Sanity-check any new assertion
  against a page you have actually looked at before trusting its numbers. A confidently wrong
  measurement is worse than no measurement, because you stop questioning it.
- If the reviewer starts returning prose without images, or proposing code, the boundary has
  collapsed and its output is worth less than doing the review yourself.
