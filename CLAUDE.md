@AGENTS.md

# Blaj 2026 — working agreement

A throwaway platform for a Greek-Catholic youth meeting in Transylvania. It has
to work the week before the event and on the day, then be deleted. Read
`SPEC.md` before doing anything of substance — it is the living record of what
was decided, what was measured and what is still open.

## Docs ↔ code ping-pong (keep specs true)

`SPEC.md`, `CLAUDE.md` and `AGENTS.md` are a **living contract, not write-once
docs**. After implementing anything of substance: check the change against them,
**report any drift to the user** (what changed vs. what the docs claimed), and
fix the docs to match reality **in the same pass** — consulting the user on
anything non-obvious. Never leave a doc describing a system that no longer
exists. Fixing drift is part of "done", not follow-up.

This is not hypothetical. Real drift found so far: `SPEC.md` claimed EB Garamond
after the fonts moved to Outfit; and a parallel session deployed to Vercel and
recorded it, so the spec described a live site this session did not know about
while the live site served a build two fixes behind. **Both were found by
checking, not by remembering.** When something looks off, verify it against the
running system before you trust either the doc or your own memory.

## Verify by looking, not by asserting

The rubric and the harness live in `.claude/skills/web-dev` and
`.claude/skills/web-verify`. Read **both** rubric files before writing UI.

```
node .claude/skills/web-verify/audit.js <url> <outDir>     # every change
node .claude/skills/web-verify/ink.js <url> 390 844        # text over art
$env:ROUTES="/,/ateliere"; node .claude/skills/web-verify/hittest.js <baseUrl>
```

Then **open `mobile-fold.png` yourself**. Every serious defect in this project so
far was either invisible to the harness or introduced by trusting a number:

- Contrast over a photo cannot be computed from CSS. `audit.js` reports
  `contrast failures: none` on text sitting over imagery. Measure the **rendered**
  ink with `ink.js`: it screenshots twice, once normally and once with the ink set
  to `transparent`, and reads both at the same glyph-core pixels. The declared
  colour hides `opacity`, colour alpha and blend modes. See SPEC 6.2.
- That glyph-mask is code too, so **calibrate it before believing it**. Point it
  at a control whose two colours are flat and known and check it reproduces the
  arithmetic. Its cutoff decides everything: at 75% of the strongest per-box
  difference it admits antialiased edge pixels and reads a known 7.43:1 as
  4.86:1 — low enough to fail text that is fine. 98% is right.
- A scrim gradient must reach transparent **inside its own box**, or its edge
  draws a hard line across the layout. This shipped twice.
- An element can pass every check and still be dead, because a later sibling
  paints over it. That is what `hittest.js` is for.
- `hover:` compiles under `@media (hover: hover)` and **does not exist on a
  phone**. Never signal a state with it alone.

## Always redeploy :3000 after a change

**Port 3000 is the URL the user actually looks at** — on this machine and from
their phone at `http://192.168.0.229:3000` over the local Wi-Fi. It is bound to
`0.0.0.0` for that reason. After **every** change worth looking at, rebuild and
restart it. Not at the end of the task — every time.

```bash
npm run build
for pid in $(netstat -ano | grep LISTENING | grep ":3000 " | awk '{print $5}' | sort -u); do
  taskkill //PID $pid //F
done
sleep 1
(npx next start -H 0.0.0.0 -p 3000 > /dev/null 2>&1 &)
sleep 6
curl -s -o /dev/null -w "%{http_code}\n" http://192.168.0.229:3000/
```

`next start` reads `.next` **at runtime**, so rebuilding under a running server
leaves it serving stale or mixed content — it does not pick the new build up and
it does not error. Kill the process and start it again; a "restart" on the same
port can also silently fail with exit 1 while the old process keeps the port.

**Confirm the served build actually changed**, do not assume it. Grep the
response for something only the new build has:

```bash
curl -s http://localhost:3000/ateliere | grep -q 'bg-stage/\[0.68\]' && echo current || echo STALE
```

This has already cost real time twice: a fix that worked locally was reported as
broken because the URL under test was behind, and a verification pass ran against
a stale build and produced misleading numbers. If you iterate on a scratch port,
:3000 drifts — restart it before telling the user anything is ready.

**Vercel is separate and is not yours to run.** The live deployment lags until
someone ships it, the deploy command needs the user's approval, and a local fix
is not a shipped fix. When you finish something, say plainly whether the live URL
is behind.

## Non-negotiables

- **Mobile first at 390px.** Not "responsive". If it only works at 1440 it does
  not work. 320px must not break.
- **Light theme only, everywhere.** One `:root`, no `.dark` block, no `dark:`
  variant. The workshops stage has its own `--stage` / `--on-stage` tokens so it
  can carry a faint sky cast, but it is light and its ink is near-black. It was
  briefly dark; that was reverted because the luminance flip between pages read
  as two different products.
- **Pick the surface's luminance first, then the ink to match — never the
  reverse.** Dark ink needs a backdrop luminance of >= 0.19, near-white ink needs
  <= 0.17. They do not overlap, so "bright background + white text" cannot be
  tuned into working. On the workshops stage this also governs the accents: they
  are sky-400 and yellow-400 only because the stage is light. See SPEC 6.1b.
- **A raw colour or font stack outside `src/app/globals.css` is a defect.** And a
  token used in a component must be registered in `@theme inline`, or the utility
  silently resolves to nothing. Tailwind v4 raises no error for this.
- **Never pass a type-ramp size and a text colour through `cn()` together.**
  `cn("text-h3", "text-card-foreground")` returns `"text-card-foreground"` alone:
  tailwind-merge does not know `--text-h3` exists, reads `text-h3` as a colour,
  and drops one of them. The element silently inherits 16px. Put the size and a
  conditional colour in a template literal instead — plain `className` strings
  are never merged, so they are safe. This shipped once already.
- **`docs/` contains the treasure-hunt answers.** Never commit it to a public
  repo, never serve it, never let it near a client bundle. It is in `.gitignore`
  and `.vercelignore`; verify after any deploy config change.
- **Do not rate-limit primarily by IP.** Everyone at the event shares the venue
  Wi-Fi or one carrier NAT, so a tight IP limit locks out the whole event.
- Read the version-matched Next docs in `node_modules/next/dist/docs/` before
  writing app code. Next 16 differs from most training data.

## Known deviations — deliberate, do not "fix" silently

Both are recorded in `SPEC.md` with reasoning. Changing either is a decision for
the user, not a tidy-up.

- **No marquee pause control** (D10), against a Vercel MUST and WCAG 2.2.2.
  `prefers-reduced-motion` carries the case instead.
- **No skip-to-content link** (D9), because there is no navigation to skip and it
  would be the only sr-only control. This lapses the moment a header exists.
