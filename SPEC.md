# Blaj 2026 — Platforma Întâlnirii Tineretului Greco-Catolic

> Living spec. Everything we decide, plan, build or worry about goes here.
> Working language of this doc: EN. Working language of the product: RO.
> Last updated: 2026-09-05

---

## 1. Context

| | |
|---|---|
| **Event** | Întâlnirea Inter-eparhială a Tineretului Greco-Catolic |
| **Place** | Blaj ("Mica Romă"), Transylvania, RO |
| **Date** | 19 September 2026 |
| **Audience** | Youth from the Greek-Catholic eparchies. Phones, mixed hardware, mobile data. |
| **Lifetime** | Throwaway. Must work ~1 week before the event and on the day. Not a long-lived production system. |
| **Timezone** | Europe/Bucharest |

### What changed

Until now this was a **presentation-only** site (one static page describing the Blajhunt treasure
hunt). It now becomes a **common trunk**: a landing page for the whole meeting, with the treasure
hunt as one branch and workshops as another — and both branches need **real backend logic, a
database, and hosting**.

### Design constraints (non-negotiable)

1. **Mobile first.** Not "responsive". Designed at 390px, upgraded for desktop. Every flow must be
   completable one-handed on a phone over 3G.
2. **Low ops.** Nobody is on-call. It has to survive the day without babysitting.
3. **Least-complexity security.** Enough to stop a bored teenager, not a nation state (see 7).
4. **Graceful paper fallback.** If the platform dies at 11:00 on the 19th, the event still runs.

---

## 2. Current state (2026-09-04)

Next.js 16.3.4 app at the repo root, App Router, TypeScript, Tailwind v4, shadcn/ui.
`npm run dev` / `npm run build`. Turbopack is the default in 16 — no flag needed.

```
src/app/                      layout.tsx (fonts, metadata, viewport), page.tsx, globals.css
                              ateliere/page.tsx — workshops carousel
                              blajhunt/ — the hunt ROADMAP (route only, no rules), the
                                horizontal one-stop-per-screen carousel that won D14:
                                page.tsx + trail-swipe.tsx + trail-swipe.module.css
                              blajhunt/[slug]/page.tsx — one page per stop (10, static)
                              blajhunt-legacy/page.tsx — the vertical roadmap D14 replaced.
                                Unlinked, kept for reference, due for deletion
src/components/ui/            diagonal-marquee-carousel.tsx (landing background)
                              hero-carousel.tsx (workshops stage)
                              how-it-works.tsx (the numbered trail on /blajhunt)
                              adisyon-shader.tsx (the sky field behind the hunt hero)
                              stop-glyphs.tsx (one line drawing per stop, D13)
public/placeholder/           1.jpg 2.jpg 3.jpg — Unsplash landscapes, PLACEHOLDER (A1/A2)
public/ateliere/              1-6.jpg — Unsplash portraits, PLACEHOLDER (A3)
public/blajhunt.html          the old static guide, still served at /blajhunt.html
legacy/                       the pre-React landing page and guide sources, kept for reference
docs/                         the three .docx sources — gitignored, see section 13
.claude/skills/               web-dev (design rubric) and web-verify (screenshot harness + reviewer)
```

| Piece | State |
|---|---|
| Landing page | one fold: marquee background, title, description, and the **two branch actions** — a filled row to `/ateliere`, an outlined row to `/blajhunt`. Placeholders throughout |
| `/ateliere` | **built** — full-bleed light stage carousel, 6 placeholder workshops, one per card |
| `/blajhunt` | **built** — roadmap only: the ten stops, their points and what each hands in. No rules, no hints, no answers. Horizontal, one stop per screen, since D14 |
| `/blajhunt-legacy` | **built, dead** — the vertical roadmap `/blajhunt` used to be, kept only so the two can still be compared. Nothing links to it; delete once nobody wants it |
| Blajhunt guide | still the static file at `/blajhunt.html`. It and `/blajhunt` now list **different stops** — see section 10.1 |
| Backend | not started. Nothing below section 5 exists yet |

**Reset on 4 Sep (later).** The first React landing page — header, gallery, six workshop cards,
Blajhunt band, info block, action bar, dual palettes, dark mode — was deleted on request and
rebuilt from one fold up. The old components are gone from `src/`; the reasoning that produced
them survives in this document and in the changelog. Build the rest back one section at a time.

**Next.js 16 is newer than most model training data.** `AGENTS.md` points at the version-matched
docs bundled in `node_modules/next/dist/docs/`. Read them before writing app code — that is where
`LayoutProps<"/">`, the `viewport` export and Turbopack-by-default are documented.

### Defects fixed along the way

- The old `blajhunt.html` shipped with no `<!doctype>`, no `<meta charset>` and **no viewport
  meta**, so every phone rendered it at ~980px. Wrapper added before it moved into `public/`.
- Tailwind v4 treats `--font-*` as a theme namespace, so `@theme { --font-display: var(--font-display) }`
  is a self-reference that silently resolves to nothing. Palette font vars are named `--face-*`.
- The hero marquee needs one copy per row wider than the row itself or the loop shows a gap, and
  the rotated band must be tall enough to cover the viewport — 3 rows of 96px did not.

---

## 3. Target site map

Target, not current. Today only `/` and the `/ateliere` stub exist — everything else is unbuilt.

```
/                     landing (common trunk)           static   BUILT
  #galerie            photo carousel (past meetings)   static
  #ateliere           workshop list                    static + link to signup
  #blajhunt           band linking to the guide        static
/ateliere             workshop carousel                static   BUILT
/blajhunt             hunt roadmap: the ten stops,     static   BUILT
                      one per screen, swipeable (D14)
                      the RULES half is still the old static page at /blajhunt.html
/blajhunt-legacy      the vertical roadmap D14         static   BUILT, UNLINKED
                      replaced. Reference only
/blajhunt/[slug]      one page per stop: what the      static   BUILT (10 pages)
                      place is + a Maps link. Context
                      only — never any part of a probă
/ateliere/inscriere   workshop signup                  DYNAMIC
/blajhunt/echipa      team + captain enrollment        DYNAMIC
/joc                  in-game: tasks, answers, upload  DYNAMIC (captain only)
/panou                staff panel: scoring, overrides  DYNAMIC (staff auth)
```

Legacy URLs `https://blajhunt.prietenicuistoria.ro/` and `/panou` are printed in the official
Regulament. Whatever we build must live at those URLs or 301 to the new ones. (!)

---

## 4. Stack — DECIDED 2026-09-04

| Layer | Choice |
|---|---|
| Framework | **Next.js 16 App Router**, TypeScript, React 19 |
| Styling | **Tailwind v4 + shadcn/ui** (`radix` base, `neutral` scale) |
| Hosting | **Vercel** |
| Database | **Vercel Postgres** (Neon underneath), provisioned from the Vercel dashboard so
  `DATABASE_URL` is injected automatically — no second account to wire up |
| ORM | **Drizzle** — schema and migrations are TypeScript in the repo |
| Uploads | **Vercel Blob** |
| Validation | **Zod** on every server action |
| Rate limiting | a Postgres table, not Redis. One fewer service for ~300 users on one day |
| Fonts | `next/font` (**Outfit** display + **Inter** body, `latin-ext` for ș/ț). No runtime font requests |

**Why React at all.** Not for the carousel — the diagonal marquee is CSS keyframes and would have
shipped fine in the static file. The reasons are: (1) the sign-up, enrollment, game and staff
screens need a backend, and Next puts server actions and DB access in one deployable unit;
(2) everything we want to pull from 21st.dev is React + Tailwind + shadcn, so staying vanilla makes
every import a manual port; (3) the form-heavy screens are the hard part — the Vercel baseline has
about twenty MUST rules for forms alone.

**What it costs.** The landing page went from a 45KB double-clickable file to a build step and a
bundle. Mitigated by keeping it server components with almost no client JS. Not free, and worth
re-checking on a real phone on real mobile data before the 19th.

### Deployment — LIVE since 2026-09-04

| | |
|---|---|
| Project | `geneous/blaj2026` (Vercel, org `Geneous`, account `crisannpaul`) |
| URL | https://blaj2026-rjw9derml-geneous.vercel.app |
| Region | `iad1` · Next.js preset · Node 24.x |
| Custom domain | none yet (D2 still open) |
| Protection | **Vercel Authentication turned OFF** so the link opens for anyone. Re-enable at Project → Settings → Deployment Protection if it should go private again |

**The deployed build is not the repo.** It lags until someone redeploys, and it
has already caused a real bug report: the `/ateliere` back link was fixed
locally and stayed broken on the live URL, which is the URL being tested. After
any fix worth looking at, redeploy — or say plainly that the live link is
behind. Check with:

```
curl -s https://<deployment>/ateliere | grep -o 'class="absolute inset-x-0[^"]*"' | head -1
```

**Redeploy:**

```
npx vercel deploy --prod --yes          # from the repo root
```

**What that command actually ships — read this before running it.** Vercel is NOT connected to a
git repo. The CLI uploads **the working tree as it exists on disk at that moment**, uncommitted
edits included, then builds on Vercel's Linux infrastructure. Consequences:

- Whatever you have half-finished in the editor goes live. There is no staging gate.
- Nothing is committed, so **the only history is Vercel's deployment list.** Rolling back means
  promoting an older deployment from the dashboard, not `git revert`. Commit before big changes.
- The build runs on Vercel, not here — which matters, because a **local** build cannot work on
  this machine at all: `vercel build` / `--temporary` needs symlinks, and Windows refuses those
  without Developer Mode or admin (`EPERM: operation not permitted, symlink`). Developer Mode is
  off and enabling it needs admin. Remote builds sidestep it entirely, so never pass `--prebuilt`.

**What is excluded from the upload**, via `.vercelignore` — verified against the deployed file
tree, where uploaded files carry a content-hash `uid` and these appear as empty directory nodes:

```
docs/       # Treasurehunt.docx has the ANSWER to every task. Verified absent. Section 13
legacy/     # pre-React sources, dead weight
.claude/    # skills and harness
SPEC.md     # this file
```

Vercel's own built-ins also drop `node_modules`, `.next`, `.git` and `.vercel`, and `.env*` is
covered by `.gitignore`. Note `vercel link` wrote a **`.env.local` holding a `VERCEL_OIDC_TOKEN`** —
that is a live credential; it is gitignored and must stay that way.

Sanity check after any deploy (unauthenticated, so it proves the link works for other people):

```
curl -o /dev/null -w "%{http_code}
" https://blaj2026-rjw9derml-geneous.vercel.app/
curl -o /dev/null -w "%{http_code}
" https://blaj2026-rjw9derml-geneous.vercel.app/docs/Treasurehunt.docx   # must be 404
```

### Open dependency

The previous Blajhunt platform source is with a friend and has not been handed over.
**Assume a full rewrite.** If it arrives, treat it as reference only. Do not block on it.

---

## 5. Data model (draft)

```
codes(id, code UNIQUE, kind[participant|staff], bound_name, bound_parish,
      bound_at, disabled, created_at)

teams(id, name UNIQUE, round, created_by_code, join_code, created_at, locked_at)
team_members(team_id, code_id UNIQUE, role[captain|member], joined_at)

workshops(id, slug, title, description, location, starts_at, capacity, taken, is_open)
workshop_registrations(id, workshop_id, code_id UNIQUE, changed_count, created_at)

tasks(id, stop_no, slug, title, kind[text|photo|video], points, answer_norm, is_open)
submissions(id, team_id, task_id, kind, value_text, file_key,
            status[pending|accepted|partial|rejected], points,
            reviewed_by, reviewed_at, created_at)
attempts(id, team_id, task_id, value, correct, created_at)
hints(id, team_id, task_id, granted_by, created_at)

audit_log(id, at, code_id, ip, ua, action, entity, before, after)
event_state(signups_open, workshops_open, game_open, read_only)
```

**Invariants enforced in the database, not only in app code:**

- `team_members.code_id UNIQUE` — a person is in at most one team.
- partial unique index on `(team_id) WHERE role = 'captain'` — exactly one captain per team.
- team size <= 6 — checked inside a transaction with `SELECT ... FOR UPDATE` on the team row.
- `workshop_registrations.code_id UNIQUE` — one workshop per person.
- workshop capacity — `taken` counter with a `CHECK`, incremented in the same transaction.
- unique accepted submission per `(team_id, task_id)`.

Scoring: 1000 points total, 100 per stop, three stops are 2x50, each hint costs 20.

---

## 6. Theming

Everything lives in **`src/app/globals.css`**, and the contract is **shadcn's** on purpose:
`--background`, `--foreground`, `--card`, `--primary`, `--muted`, `--border`, `--radius` and the
rest. That is what anything pulled from 21st.dev or ui.shadcn.com expects, so components drop in
already themed instead of fighting us.

**Sunlit Sky is the palette. There is no second palette and no dark mode** (decided 4 Sep, D8).
One `:root` block, `color-scheme: light`. Adding a `.dark` block is a decision to be taken
deliberately, not a tweak — the previous build carried two palettes across two schemes and every
serious defect the cold reviewer found was a token that flipped in a scheme nobody was looking at.

21st.dev / @serafimcloud — sky-400 on a neutral scale, Outfit display + Inter body, `--radius:
0.625rem`, no texture. On top of shadcn's set there is a small **brand layer**:

| Token | Value | Why |
|---|---|---|
| `--brand` | `#00bcff` | sky-400, the signature |
| `--brand-text` | `#00698f` | sky-400 fails as text (2.2:1 on white). This is 6.15:1 |
| `--contrast` | `#fdc700` | yellow-400, accent two — decorative only |
| `--contrast-text` | `#6f5600` | 6.98:1, for when yellow has to carry words |
| `--border` | `#e5e5e5` | hairline divider, 1.26:1, decorative by design |
| `--border-strong` | `#8c8c8c` | 3.36:1 — the only one allowed to carry a component edge |
| `--primary-foreground` | `#04212c` | **ink on sky, never white.** White on sky-400 is 2.18:1 |
| `--scrim` | `10 20 28` | shadow tint, pulled toward the sky hue, unwrapped rgb so it takes an alpha |

The type ramp is **exactly five steps** (`--text-display / h2 / h3 / body / ui`) registered in
`@theme`. A sixth is a defect. The landing page uses four. Nothing renders below 12px.

**A raw colour value outside `globals.css` is a defect.** Same for a font stack. And a token used
in a component must be registered in the `@theme inline` block — an unregistered `--color-*` makes
the utility resolve to nothing, silently. That is exactly how the yellow accent rule rendered
invisible for three builds.

### 6.1 Design references

| Ref | Idea | Status |
|---|---|---|
| [Sunlit Sky](https://21st.dev/@serafimcloud/themes/sunlit-sky) | sky-400 + yellow-400 on a neutral scale, geometric sans, soft radii | **live**, the only palette |
| [Diagonal marquee carousel](https://21st.dev/@saurabh-2607/components/great-ui-diagonal-marquee-carousel) | slow diagonal marquee of photos behind the hero | **live**, `src/components/ui/diagonal-marquee-carousel.tsx` |
| crafterui / 21st.dev editorial hero carousel | filmstrip sharing one top edge, focused card at full height, backdrop graded to the focused photo | **live**, `src/components/ui/hero-carousel.tsx` — the workshops page |

What changed from the 21st.dev carousel original, and why — all recorded in the file header too:

- Keyframes moved to `globals.css`. The original injected a `<style>` tag with
  `dangerouslySetInnerHTML` on every mount; in the stylesheet they parse once and
  `prefers-reduced-motion` can reach them.
- **No pause control** (D10). The Vercel baseline makes one a MUST for autoplay motion over 5s
  alongside content, and WCAG 2.2.2 (Pause, Stop, Hide, Level A) says the same. Removed on
  request on 4 Sep. **This is a knowingly accepted deviation, not an oversight.** What still
  carries the case: `prefers-reduced-motion: reduce` stops the loop dead, verified. What is lost:
  a visitor who finds looping motion distracting but has not set that OS preference has no way to
  stop it. Revisit if the site ever has to satisfy a formal accessibility requirement. If it comes
  back, it must not be hover-only — `hover:` does not exist on the target device.
- One wash over the band instead of an overlay `<div>` per card — same picture, ~90 fewer nodes.
- The wash is **directional**: it lifts from the bottom below `lg` and from the left above it,
  because that is where the copy sits. A centred pool would centre the composition.
- Cards size up in four steps from 168px. The original's flat 400x300 put 2.3 cards across a
  390px phone, which reads as sliding wallpaper rather than a carousel.
- Every colour reads `--background`; the original hard-coded `from-white dark:from-neutral-950`.

**Marquee geometry, the part that is easy to get wrong.** Each animated track is two identical
halves and the keyframes translate exactly `-50%`, so copy 2 lands where copy 1 began. One half
must be **wider than the row** or the seam opens as a visible gap. Nine cards per half clears the
220vw row at every breakpoint: 9x184px = 1656 at 390px, 9x432px = 3888 at 1440px.

**Budget the real photos.** Three placeholders at ~100KB is nothing; 10-14 archive photos at
~120KB each is 1.5MB on the critical path. Only the first row is `fetchPriority="high"`; the rest
lazy-load.

### 6.1b The workshops stage

`/ateliere` is light, like the rest of the site. It was briefly a dark section;
that was **reverted on 4 Sep** because the luminance flip between a white landing
and a near-black workshops page broke the site's continuity — it read as two
different products.

| Token | Value | Note |
|---|---|---|
| `--stage` | `#f4fafe` | a hair of sky in the white, so the page is related to the landing rather than identical |
| `--on-stage` | `#0a0a0a` | the same ink as `--foreground` |

**The grade lifts, it does not darken.** Three layers over the focused photo:
the accent at `mix-blend-mode: color` (hue only), a `--stage` wash at 68% which
is what guarantees the luminance floor, then the accent again at 19% `multiply`
to put back the tint the wash desaturates. Worst case — a pure black photo —
still lands around 7:1 against near-black ink.

**Accents are the real palette here: sky-400 and yellow-400, alternating.** They
can be this bright *because* the stage is light and the ink is dark. The floor no
longer depends on the accent being dark.

> **If anyone ever flips this stage back to dark, the accents must go dark with
> it.** On a dark stage with white type, yellow-400 as an accent measured
> **1.63:1** on an 11px label. The two directions do not overlap: dark ink needs a
> backdrop luminance of **>= 0.19**, near-white ink needs **<= 0.17**. Pick a
> luminance for the stage, then pick the ink to match it — never the reverse.

Consequences of a light stage, all of them handled:

- Cards need `--border-strong` and `--shadow-card`. On a dark field bright
  photos separated themselves; on a light one they dissolve into it.
- Unfocused cards recede by washing *toward* `--stage` at 30%, not by darkening.
- The scrims lift rather than darken. They were tuned to protect white type, and
  left at those strengths they bleach patches of the field to near-white — the
  page looked blotchy until they came down to 40/55/46/75%.
- `--muted-foreground` is **not** safe on this stage: 7.8:1 on pure white but
  3.5:1 over the graded field. The disabled control uses `--on-stage` at 80%.

**Scrim gradients must reach transparent inside their own box.** Twice a scrim
whose ramp did not finish before its box ended drew a hard line straight across
the layout — once on the landing page (a `140% 125%` radial is still fully opaque
at its box edge, which sits at 0.5H) and once on this stage. Both were invisible
to every number and obvious in the screenshot. Look at the picture.

### 6.1c The sky field (`/blajhunt`)

The hunt hero sits on a generated field rather than a photograph, because there
is no photograph of the hunt yet and a bare CSS gradient standing in for one
reads as a smear (GUIDELINES 6). It is the 21st.dev Shader Builder "Waves"
shader in `src/components/ui/adisyon-shader.tsx`, adapted on four points:

- **Its ramp is four tokens, not four hard-coded floats.** `--field-0 … --field-3`
  live in `globals.css` with every other colour, and the component reads them
  off `<html>` at mount. The 21st.dev original bottomed out at `#031c26`, a
  near-black this site has no surface for.
- **Every stop is pale on purpose.** Near-black ink sits directly on this field,
  so the same rule as 6.1b applies: backdrop luminance >= 0.19. The darkest
  stop, `--field-3` (`#86d5fd`), is 0.58. Darkening any stop is the same
  decision as flipping a surface's ink, not a colour tweak. `vignette` went
  0.21 -> 0 for exactly this reason: it darkened the edges of a field the ink
  has to survive on.
- **It does not animate.** `animated` defaults to false and
  `prefers-reduced-motion` forces it off regardless. Two reasons: the platform
  is used outdoors on phones by people walking Blaj for hours, and a five-octave
  fbm at 60fps is battery spent on a backdrop; and a running field would be a
  *second* WCAG 2.2.2 autoplay deviation on top of D10. A still frame keeps the
  whole look. Static mode needs `preserveDrawingBuffer: true` — a browser may
  clear an unpreserved drawing buffer after compositing, which would blank a
  canvas drawn only once.
- **It always has something behind it.** The canvas sits on a `field-fallback`
  utility painting the same four stops as a linear gradient in the same
  direction. No WebGL, a failed shader link (now checked — the original silently
  drew nothing) and the frame before first paint all show the same picture with
  fewer clouds, rather than a hole. Verified by stubbing `getContext('webgl')`
  to null.

**The field does not stop at the fold.** It used to: the hero handed over to a
flat `--stage` slab that ran for the ~4000px the reader actually scrolls, so the
page went from alive to inert exactly where the scrolling starts. The trail now
carries a `trail-field` gradient built from the *same* four `--field-*` tokens.
It begins on `--field-0`, the warm gold the hero's own bottom edge already ends
on, and then **cycles gold -> white -> sky -> stage three times** on the way
down. The hero's bottom fade (`field-seam`) was retargeted from `--stage` to
`--field-0` so the two are one continuous ramp with no seam to hide.

**Thirteen stops, not four, and the count is the whole point.** The first
version walked the ramp once. Over 4000px that is about one step of luminance
per screenful — so slow that it read as a flat tint and the change was not worth
having. What makes a field feel alive is how *often* it changes, not how
strongly: this varies frequently and stays pale. Reaching for stronger colour
instead is the move that breaks the ink rule, so it is the one not taken.

It is not a second palette and must not become one. The luminance bound from
above still governs every stop: the darkest here is `--field-2` at 0.87, far
above the 0.19 floor, which is what lets near-black ink sit on it directly.

### 6.1d The route

The trail is a dotted curve that meanders past the stops, and it is drawn
**without measuring anything** — measurement would make `how-it-works.tsx` a
client component that recomputes on every reflow, and the roadmap would stop
being pure HTML.

The trick: each row owns its own slice of the curve, in a `viewBox="0 0 100 100"`
with `preserveAspectRatio="none"`, so the slice stretches to whatever height that
row's content turned out to be. Every slice enters at x=50 and leaves at x=50
with a vertical tangent and bulges to its own node at half height, so adjacent
slices meet at the same point with the same tangent and twelve separate SVGs read
as one unbroken line. Alternate the node side row by row and that line is a
smooth zig-zag.

`vector-effect="non-scaling-stroke"` is load-bearing, not decoration: the x scale
ends up several times the y scale, and without it the dots smear into ellipses and
their spacing goes uneven. The dots themselves are a zero-length dash
(`stroke-dasharray: 0.01 7`) under a round cap.

**Phones get a different geometry, because they have no room for that one.** The
card is the full width of the column there — it has to be, see the changelog — so
a curve running *past* it would be running *behind* it. Instead the curve lives in
the fixed-height gap BETWEEN cards, and the numbered disc straddles the card's top
edge where the curve lands on it. The gap height is the curve's whole character:
the swing is ~260px of width on a 390px phone, so at 96px of height it draws as a
straight diagonal with a kink at each end. 112px is where it reads as an S.

**The arch is not the same twice.** One bend repeated twelve times reads as
machine-drawn, so the route cycles a table of five arches that vary where the
line crosses the row boundary, how deep the node sits, whether the bend leans
early or late, and (on phones) how tall the gap is. Five, not four: the sides
already alternate on a period of 2, and 4 would lock in phase with that and give
each side the same two bends over and over. 5 is coprime with 2, so the pattern
only comes back around every 10 rows and a ten-stop trail never repeats an arch
on the same side.

`cross` is the one field with a cross-row constraint and the one that breaks
silently if edited carelessly: a row ENTERS at its own arch's `cross` and LEAVES
at the NEXT arch's. That shared value is the whole reason twelve SVGs read as one
line — index it wrong and the route gets a step at every boundary that no test
would catch. **Assert it:** parse the last x of each row's `d` and the first x of
the next, and require the difference to be 0. It is, on all eleven boundaries.

Two more numbers worth keeping: the `lg` gutter is `gap-x-48` because `gap-x-40`
left the disc 0–2px from the card edge, with the 1.25deg card tilt already
overlapping it by a pixel on three rows; with the arch table's node jitter it now
runs 8–23px, tightest where an arch reaches furthest. And content at `lg` is
always 960px (max-w-5xl minus `sm:px-8`, at every width from 1024 up), which is
why a single measurement at 1440 covers the whole range.

**Each stop carries a line glyph, and it lives inside its own card.** Ten
hand-drawn 48x48 SVGs in `src/components/ui/stop-glyphs.tsx`, one per stop,
stroke-only on `currentColor`. On wide screens the drawing sits in the empty
column opposite the card, which is the mockup (`creatives/Roadmap Glyphs.png`).
On a phone there is no empty column, and the first placement — centred on the
curve in the gap between two cards — was **wrong in a way no measurement
caught**: a drawing equidistant from two cards reads as a stop of its own, an
intermediary on the way to the next objective rather than a picture of one. On
a route where every other mark is a numbered destination that is a real
misreading, and it was the first thing seen on a phone.

The glyph is now a 44px tile inside the card, pinned to the **right** on every
row. Mirroring it to dodge the numbered disc was tried and rejected: a tile on
the left pushes the title in while the description below it stays put, and the
card loses its left margin. It does not need to dodge anyway — the disc
straddles the card's top edge (y -16..16) and the tile starts below the padding
(y 24..68), so they never touch even when the curve puts both on the same side.
Cost: the trail is 5046px at 390px against 4839px flat, +4.3%, all of it the
tile being taller than a one-line title. The mid-gap placement cost +8.1%, so
the correct answer was also the cheaper one.

**The palette does the work the greys were doing.** Points pills are
`--contrast` (gold) with near-black ink, every one of them and not just the
finale; proof chips are `--brand-text` on a 5% `--brand` wash inside a
`--brand/45` border; the route's dots and the drawings are `--brand-text/45` and
`--contrast-text/60`. Measured rendered contrast: chips 5.89:1, pills 12.58:1,
card copy 7.81:1. The page's worst value is still the hero kicker at 5.17:1
(1440) / 5.56:1 (390), which is inherited from the sky field and not from any
of this.

The drawings are **invented archetypes, not portraits** — nobody has checked
whether Casa Maniu has a balcony. That is deliberate twice over: mismatched
stock reads as a lie, and several stops *are* "find this building", where a
photorealistic render would hand over the answer. A line glyph says "a church
with a graveyard" and nothing more, which is the amount the roadmap is allowed
to say.

Still no motion library, and still **no JavaScript at all** on this page outside
the canvas.

### Page transitions

React's `<ViewTransition>`, which Next 16 supports in the App Router with no
config. `<Link transitionTypes={["nav-forward"]}>` going in, `["nav-back"]`
coming out; the CSS lives at the end of `globals.css`. Timing is asymmetric on
purpose — the old page leaves in 160ms so it stops competing, the new one
arrives over 260/460ms so it can be read. `prefers-reduced-motion` kills it.
Note `ViewTransition` is not exported by the top-level `react` package; it comes
from the canary React that Next vendors for the App Router, so it type-checks and
builds but `node -p "require('react').ViewTransition"` shows undefined. That is
expected, not a broken install.

### 6.2 The verification loop

Design work goes through `.claude/skills/web-dev`. Read both rubrics before writing UI code —
`vercel-web-interface-guidelines.md` (MUST/SHOULD/NEVER baseline) and `GUIDELINES.md`
(composition, and the ten named landing-page failure modes). Then two tiers:

```
node .claude/skills/web-verify/audit.js <url> <outDir>            # tier 1, every change
$env:ROUTES="/,/ateliere,/blajhunt"; node .claude/skills/web-verify/hittest.js <baseUrl>
```

`hittest.js` asks one question the rest of the harness cannot: **is the element
you would tap the one that actually receives the tap?** It runs
`document.elementFromPoint` at each interactive element's centre. It exists
because the `/ateliere` back link was present, focusable, 84x44, correctly
coloured and completely dead — a later sibling with no `pointer-events: none`
was painting over it. Run it from **PowerShell** on Windows: MSYS rewrites
`"/,/ateliere"` into a Windows path, as an argument and inside an env var.

measures overflow, contrast, sub-12px text, tap targets, console errors — then **look at
`mobile-fold.png` yourself**. Tier 2 is a cold reviewer subagent, run at milestones only, always
cold. `chromium.launch()` on this machine needs the channel fallback `[{}, {channel:'chrome'},
{channel:'msedge'}]` that `audit.js` already uses.

**Tier 1 cannot see contrast through a scrim over photographs.** It reports `contrast skipped: 0`
and `failures: none` on this page, which is not the same as passing — it resolved the CSS
background and never looked at the pixels. The honest measurement is a **glyph mask**: screenshot
the page twice, once normally and once with the ink set to `transparent`, diff the two to find the
pixels the glyphs actually occupy, then sample the backdrop at exactly those coordinates. It also
kills the rounded-corner false positive that made the CTA read 1.15:1 when it is really 7.65:1.

**The glyph-core cutoff is the whole measurement, and it needs calibrating.** "Pixels the glyph
occupies" is not a set — coverage is a gradient, and antialiased edge pixels are part ink, part
backdrop. Admitting them drags the number down uniformly. Calibrate against a control whose two
colours are flat and known: 13px `#525252` on `#f4fafe`, which is **7.43:1** by arithmetic. A
cutoff at 75% of the strongest per-box difference reads that control as 4.86:1 — a third low,
enough to fail text that is fine. **98% reproduces the arithmetic (7.42:1).** Re-measured with the
calibrated cutoff:

| Page | Worst glyph contrast | Where |
|---|---|---|
| `/` | **6.15:1** | the sky kicker at 390px (this is the number that used to read 5.02:1) |
| `/ateliere` | **9.62:1** | the disabled "Înscrieri în curând" label |
| `/blajhunt` | **5.56:1** | the sky kicker over the sky field, at 390px |

Checked at 320x568, 390x844, 844x390 (landscape) and 1440x900, and at three scroll depths.

**`audit.js` was reading every Tailwind v4 alpha colour as black.** Its `lum()`
parsed the colour string and assumed 0-255 unless it saw `color(`. But Chromium
serialises a computed colour in whatever space it was authored in, and
`bg-card/90` compiles to `color-mix(in oklab, ...)`, which computes as
`oklab(0.999994 0.0000455678 0.0000200868 / 0.9)` — a near-white. Read as
0-255 sRGB that is luminance **0.000064**, i.e. black, so everything on top of it
was reported as a contrast failure. It produced **33 false failures** on one page.
`lum()` now normalises through a 1x1 canvas, which converts any CSS colour in any
space, and returns `null` on an unparseable value instead of measuring the
previous one. Verified against arithmetic: white 1, black 0, `oklab(1 0 0)` 1, and
the 6.2 calibration control still reads **7.4239:1** against its known 7.43:1.
This is the same family of trap as `cn()` and `@theme inline` — **a false negative
from a measuring tool is worse than no tool**, because it is trusted.

**The glyph mask is now a tool, not a technique you re-implement.** It lived in a
job temp directory that is deleted with the job, which is a bad home for the only
honest contrast measurement this project has. It is at
`.claude/skills/web-verify/ink.js`, beside the rest of the harness:

```
node .claude/skills/web-verify/ink.js <url> <width> <height> [scrollY]
```

It prints, per text leaf, the median and minimum rendered contrast at the glyph
cores against the WCAG floor for that element's own size and weight. Run it
wherever text sits over art — over the sky field, over a photograph, over a
scrim — because `audit.js` reports `contrast failures: none` there and means
nothing by it. **The 98% cutoff inside it is calibrated; re-calibrate against
13px `#525252` on `#f4fafe` = 7.43:1 before believing any change to it.**

**`cn()` silently deletes this project's type-ramp sizes.** tailwind-merge has no idea
`--text-ui` exists, reads `text-ui` as a text *colour*, and drops whichever of
`text-ui` / `text-brand-text` came first. `cn("text-h3", "text-card-foreground")` returns
`"text-card-foreground"` alone; the element then inherits 16px and nothing warns. It hit three
spots on `/blajhunt` and shipped 16px where 13px was written. Plain `className` strings are
unaffected because nothing merges them — so a ramp size and a conditional colour go in a template
literal, never through `cn()`. Same family as the `@theme inline` registration trap: Tailwind v4
raises no error for either.

Known false positives on this page — do not chase:

- `oversized elements: div.flex w=3054 vw=390`. That is the marquee band, which must be wider
  than the viewport to cover a rotated diagonal. Horizontal overflow is separately measured at 0.
- `tap targets < 44px: 7` on `/blajhunt-legacy` (and on `/blajhunt` before D14 moved it).
  Those are the stop-card title links, which use the
  **stretched-link** pattern: the `<a>` wraps only the title, and an `::after { position:absolute;
  inset:0 }` expands the hit area to the whole card. `audit.js` measures the `<a>`'s own box
  (~216x26 for a one-line title) and cannot see the pseudo-element, so it reports seven of the ten
  as small. **Verified by hit-testing, not by argument**: nine probe points spread across a
  350x247 card all resolve to that card's link, 9/9. `hittest.js` reports 0 unreachable.
  The pattern is deliberate — wrapping the whole `<article>` in an `<a>` would pull the
  description, the proof chips and the points into the link's accessible name and read all of it
  out on every card, where the stretched link's name is the stop's title alone.
  A trap while checking this: `globals.css` sets `scroll-behavior: smooth`, so a probe that calls
  `scrollIntoView()` and reads `getBoundingClientRect()` in the same tick measures mid-scroll and
  every point misses. That produced a confident 0/9 before the wait was added.

- `oversized elements: li.…slide w=491 vw=390` on `/blajhunt`. The snap unit there is
  `--card + --gap` and is deliberately WIDER than a phone viewport: the card centres inside it and
  what fills the rest of the screen is gap with the route sweeping through. Horizontal overflow is
  separately measured at 0 — the track scrolls, which is the point. Same class as the marquee
  above.

- `tap targets < 44px: 7` on `/blajhunt` — same class, **but it was not purely a false
  positive and checking is what found the difference.** That page scopes the stretched link to the
  `<h3>` rather than the card (the card is a destination there, holding its own Maps button, so a
  card-wide overlay would swallow it). Hit-testing said all ten links receive clicks, which is the
  answer the `/blajhunt` case trained you to expect — but the same probe *measured* the target at
  **41px**, under the floor. The overlay is sized off the H3's line box, which is **21px**, not the
  25px the anchor reports and not the 25px `audit.js` prints; `-inset-y-2.5` therefore gave 41 and
  only `-inset-y-3` gives 45. Neither number is visible from the CSS.
  **The lesson is not "trust the pattern", it is "measure the pattern each time":** a probe that
  had only asked *does it receive clicks* would have confirmed a defect as fine.
  And the smooth-scroll trap above bit again, in a new place — the track sets its own
  `scroll-behavior: smooth` in the CSS module, so the first run of the probe returned `nothing` at
  **every** point including on the text. That reading was self-refuting (a probe that cannot find
  the text it is standing on is broken, not reporting) and is the reason to always probe a control
  point you already know the answer to.

---

## 7. Content and assets we still need

| # | Item | From | Blocks |
|---|---|---|---|
| A1 | 8-12 photos from past meetings, landscape, min 1600px | organizers | **the landing page marquee — top priority** |
| A2 | 1 hero photo, wide, safe to crop hard on mobile | organizers | reserve, if the marquee ever gets a still fallback |
| A3 | Workshop list: title, leader, description, location, time, capacity | organizers | ateliere + signup |
| A4 | Confirmed event name — "Inter-eparhială" or "Arhieparhială"? | organizers | every heading (!) |
| A5 | Nothing, for the roadmap — the ten stop glyphs are **drawn and shipped** (`src/components/ui/stop-glyphs.tsx`). Listed so it is on the record that this page has no outstanding asset dependency, unlike the two variants that lost. They are invented archetypes; if anyone ever wants them checked against the real buildings that is a nice-to-have, not a blocker | — | done |
| A6 | **Fact-check the ten stop pages.** `src/lib/blajhunt-places.ts` carries a paragraph or three of history per stop, written from general knowledge by Claude — not from a source in this repo and not by anyone who has stood in front of the buildings. Each entry is flagged `confidence: "solid"` or `"check"`, and every `"check"` entry has a `verify` line naming exactly what to confirm. **8 of 10 are `check`.** | organizers | **before the site is public** (!) |
| A7 | Real coordinates for the ten stops, if wanted. The Maps buttons currently run a *search* for the building's name rather than dropping a pin, because a wrong pin sends a team across town on the day. A search is safe but imprecise | organizers | nice-to-have |
| A5 | Program / schedule of the day | organizers | new section |
| A6 | Contact — phone and email for the day | organizers | footer |
| A7 | Logos (eparchy / event) | organizers | header, favicon |
| A8 | Expected participant count | organizers | code count, capacity, hosting tier |

**The three photos in `public/placeholder/` are Unsplash landscapes and MUST NOT ship.** They are
generic scenery with no people in them, which is exactly wrong for a page about a youth gathering —
the design leans on photographs of *faces*, and it will only really land once A1 arrives. Drop the
real files in and edit `DEFAULT_CARDS` in `diagonal-marquee-carousel.tsx`; nothing else changes.

Every placeholder string on the landing page lives in the `CONTENT` object at the top of
`src/app/page.tsx` — one place to edit, all of it provisional (A3/A4/A5).

**Workshop photos (A3) are portraits, not landscapes.** The stage crops cards to
3:4 and anchors at `50% 26%`, so a clipped neighbour still shows a face. Give it
tall frames with people in them; a wide landscape will be cropped to a sliver.

**Photos:** resize to max 1600px, convert to WebP, keep a JPEG fallback only if needed. Do **not**
inline them as data URIs — a phone on 3G must not download 6MB to see the fold.

---

## 8. Security model

The foundation is physical: **codes are handed out in person at check-in.** Possession of a code is
proof of attendance. Everything else is a thin layer that stops opportunistic messing about.

### Participant codes

- Format `BLAJ-XXXXX`, Crockford base32 (no I/L/O/U), **plus one check character**.
- 32^5 is about 33.5M combinations. With ~500 codes live a blind guess hits roughly 1 in 67,000.
- The check character rejects typos client-side without a DB round trip and without burning a
  rate-limit slot. Kids will mistype.
- Pre-generated, not derived from names. Printed on the badge or bracelet.
- **First use binds the code** to a name and parish. That name is shown on every later screen
  ("Bună, Andrei") so a borrowed code is visible to whoever is holding it.
- Participants cannot re-bind. Staff can reset a code from `/panou`.

### Rate limiting

- **Per code:** 30 req/min, 300/hour. This is the primary control.
- **Per IP: loose ceiling only.** (!) At a physical event everyone sits behind the venue Wi-Fi or
  the same carrier NAT. A tight IP limit locks out the entire event. IP is an anti-bot backstop
  (~600/min), never the main defence.
- **Wrong answers:** 5 per task per team, then a 10-minute cooldown and a volunteer unlock.
  Answers like "verde" are short and guessable — this is the limit that actually matters.

### Abuse cases

| Someone tries to... | Stopped by |
|---|---|
| Sign up for three workshops | `code_id UNIQUE` on registrations |
| Be in two teams | `code_id UNIQUE` on team_members |
| Make themselves a second captain | partial unique index on the captain role |
| Stuff a team with 12 people | size check inside a `FOR UPDATE` transaction |
| Overbook a full workshop | capacity counter plus `CHECK`, same transaction |
| Brute-force a short answer | 5 attempts per task per team, then cooldown |
| Guess someone else's code | 33.5M space, per-code rate limit, check character |
| Submit answers for another team | session bound to the code, captain-only check server-side |
| Script the signup form | per-code limit; add Turnstile **only if** it actually happens |
| Rename or delete another team | ownership check, and everything lands in `audit_log` |
| General chaos | `event_state` kill switches, and the audit log lets us undo anything |

### Sessions

The code establishes a signed httpOnly cookie that expires at end of day, so it is not retyped on
every action. The session binds to the code, **never to the IP** — phones roam between Wi-Fi and
mobile data mid-event.

### Locks

- Workshop changes allowed until T-24h or workshop start, `changed_count` capped at 2.
- Team composition locked at game start.
- `/panou` staff auth is a **separate credential space** from participant codes. Never overlap.

### Data protection

Minors' names and photos. Store the minimum — name and parish, no birthdate, no email unless truly
needed. Image consent is covered by the event's general rules. **Delete the database after the
event:** put 2026-10-19 in the calendar.

---

## 9. Flows

**Workshop signup** — enter code, bind name and parish if first use, see workshops with live
remaining seats, pick one, confirm. Change allowed twice, until lock.

**Team enrollment** — captain enters code, creates the team, picks a name, receives a **join code**
for the team. Members enter their own code plus the join code. Server checks: not already in a
team, team not full, team not locked.

**In-game, captain only** — task list in order, open task, read clue, submit text / photo / video,
status goes `pending`, staff scores it in `/panou`, points appear.

**Staff panel** — queue of pending submissions, accept / partial / reject with points, grant hints,
reset a code, toggle kill switches, live leaderboard.

---

## 10. Inconsistencies found in the source documents (!)

1. **The ten stops do not match between documents.** `Treasurehunt.docx` lists *Muzeul Curiei*.
   `Regulament.docx` lists *Protopopiatul Blaj* instead and drops Muzeul Curiei — then mentions
   Protopopiatul again in the points paragraph with a stray parenthesis, as if pasted in late. The
   two pages now disagree with each other: the old static `/blajhunt.html` follows
   `Treasurehunt.docx` (Muzeul Curiei), and the new `/blajhunt` roadmap follows `Regulament.docx`
   (Protopopiatul Blaj). The roadmap follows the regulation because it is the participant-facing
   document and it is the only one whose ten stops **add up to the stated 1000 points**; Muzeul
   Curiei's task would make it 1100. Note also that the regulation lists Câmpia Libertății ninth
   although its task is plainly the finale, and Protopopiatul Blaj has no task written anywhere.
   **Ask which list is final** — it changes both pages, the DB seed and the printed rules. Until
   then `/blajhunt` says "Detaliile probei se anunță la start" for Protopopiatul, which is true
   either way. Changing the list is one edit to `STOPS` in `src/app/blajhunt/page.tsx`.
2. `Regulament.docx` calls stop 9 "Colegiul Național Inochentie Micu Clain **și Capela Arhiereilor**".
   `Treasurehunt.docx` omits the chapel.
3. The folder is named `Arhieparhiala`, the documents say "**Inter**-eparhială". Which is it? (A4)
4. `Regulament.docx`: "Materialele realizate pentru probe **vot** fi utilizate" — typo for "vor".
5. The Muzeul Curiei task is still undecided in the source document (reverendă *or* antimis — the
   author was not sure what the museum actually holds). Needs an on-site check before the 19th.

---

## 11. Timeline

The event is **19 September 2026** — 15 days out from 2026-09-04. Tight but fine.

| When | Milestone | State |
|---|---|---|
| 4-6 Sep | Landing page v1 and this spec. Chase organizers for section 7. Chase the old source. | landing done |
| 7-9 Sep | Stack decision, repo, hosting, DB, schema, code generator, printable code sheet | |
| 10-12 Sep | Workshop signup, team and captain enrollment, staff panel skeleton | |
| **12 Sep** | **Freeze for the presentation.** Everything shown has to work. | |
| 13-17 Sep | Game flow: tasks, answers, uploads, scoring. Dry run in Blaj on three real phones on mobile data. | |
| 18 Sep | Print codes, seed the DB, rehearsal, prepare the paper fallback | |
| 19 Sep | Event day. Staff on `/panou`, kill switches ready. | |
| 19 Oct | **Delete the database.** | |

---

## 12. Open decisions

| # | Question | Owner | Needed by |
|---|---|---|---|
| ~~D1~~ | ~~Stack and hosting~~ — **decided 4 Sep**, see section 4 | us | done |
| D2 | Domain: keep `blajhunt.prietenicuistoria.ro`, or a new one with redirects? Live on `blaj2026-rjw9derml-geneous.vercel.app` until decided | user | 7 Sep |
| D3 | Which list of ten stops is final? (10.1) — now blocking two pages that disagree | organizers | 10 Sep |
| D11 | Route name: the roadmap is at `/blajhunt` (the regulation's own name for the game, and the printed domain). Keep it, or `/treasure-hunt`? One directory rename | user | 10 Sep |
| D12 | `/blajhunt` is the roadmap only. Do the rules from `Regulament.docx` go on the same page further down, or at `/blajhunt/regulament`? The static `/blajhunt.html` has to retire either way | user | 12 Sep |
| ~~D13~~ | ~~Which creative dresses the roadmap~~ — **decided 5 Sep**: the **glyphs**, merged into `/blajhunt`. The images variant was too revealing and cost +40.5% scroll; the background variant's photographs were unreadable behind full-width cards on a phone. Its *gradient* was kept and its photographs dropped — see 6.1c | user | done |
| D14 | Does the roadmap go horizontal? `/blajhunt-swipe` is the same route as a one-stop-per-screen swipeable carousel, which buys enough room to fold `/blajhunt/[slug]` back into the card. Compare the two on a phone; merge it into `/blajhunt` or delete it. **Temporary scaffolding reverts either way** — see the changelog | user | 12 Sep |
| D4 | Do workshops need capacity limits, or is it just "tell us where you'll be"? | organizers | 9 Sep |
| D5 | Are participants pre-registered, so we have names in advance, or walk-in? Changes the code flow. | organizers | 9 Sep |
| D6 | One round or two ("două ture")? The schema has `round`, but the UI differs. | organizers | 12 Sep |
| D7 | Final video: uploaded through the platform, or handed to staff on site? (13.1) | organizers | 13 Sep |
| ~~D8~~ | ~~Palette~~ — **decided 4 Sep**: Sunlit Sky, light only, no second palette | user | done |
| D9 | Skip-to-content link is a Vercel MUST but there is no nav to skip yet. Add it with the header, or now? | us | with the header |
| ~~D10~~ | ~~Marquee pause control~~ — **decided 4 Sep**: removed on request. Accepted deviation, see below | user | done |

---

## 13. Risks — things to look out for

1. **Video uploads will be the thing that breaks.** (!) Ten-plus teams uploading 1-2 minute phone
   videos simultaneously from Câmpia Libertății, on mobile data, at the end of the game. That is
   hundreds of MB over a congested cell. **Recommendation: the final video is shown or handed to a
   volunteer on site, not uploaded.** If it must be uploaded, compress client-side and queue retries.
2. **Connectivity.** Every page tiny and cached. Optimistic UI, retry on failure, and never lose a
   typed answer to a dropped request.
3. **Shared NAT.** Do not rate-limit primarily by IP (section 8).
4. **Photo uploads** — cap at 10MB, compress client-side on a canvas before sending.
5. **The whole thing happens in a four-hour window.** No time to debug. Rehearse on real phones, on
   real mobile data, in Blaj, before the 19th.
6. **Paper fallback.** Print the task list and a scoring grid. If the platform dies the game
   continues on paper and staff enter results afterwards.
7. **The old source may never arrive.** Plan for a rewrite; anything else is a bonus.
8. **Legacy URLs are already printed** in the official rules document (section 3). (!)
9. **`Treasurehunt.docx` contains the answers.** Never commit it to a public repo, never serve it,
   never let it near a client bundle.
10. **Two rounds** means teams start at different times, so the leaderboard must not leak answers
    between them. If round 1 finishes before round 2 starts, hide the leaderboard until the end.

---

## 14. Changelog

- **2026-09-05 (the roadmap, sideways)** — `/blajhunt-swipe`, a fourth creative
  variant and **D14**: the same route as a horizontal snap carousel, one stop
  per screen. The premise is that the vertical trail shows six things at once
  and can only give each ~150px, which is why the history had to move to
  `/blajhunt/[slug]` in the first place; turning the route sideways buys a
  538px card and folds most of that page back in — glyph at 80px, standfirst,
  a clamped paragraph of context, proofs, points and the Maps link.
  Everything above the trail is unchanged from `/blajhunt`, and the content
  still comes from the shared read-only modules.
  - **Continuity across a swipe is structural, not tuned.** Slides are
    adjacent (the peek comes from slide width, never from a gap) and each
    draws its own slice of one curve, with both control points beside every
    boundary carrying that boundary's y. Equal value plus equal slope is a C1
    join, so no seam is findable at any width and re-tuning the `CROSS` table
    cannot reopen one. Verified by eye at 1440, where three seams are in frame
    at once.
  - **The route dips to touch each card** rather than passing overhead, so the
    numbered disc is a point *on* the line and the node-to-content distance is
    just the card's padding — no connector to draw or keep in sync.
  - **Two failures worth keeping.** The terminals carry 160px of content in a
    track the 538px cards size, so 378px of the Start slide was empty: the
    first thing you saw on reaching the route was a void. Centring the block
    was *worse* — it halved the void but pushed the waypoint 180px from its own
    label, and on a page about a connected route that is the one thing that
    must not happen. The fix was to let the decorative plate take the slack
    (`flex-1`), giving a card-height terminal with no void anywhere. Then the
    128px pin had to be redrawn as a **stroke on the glyph set's ground line**,
    because `Pin` is a fill that reads fine at 16px in the disc and reads as a
    heavy silhouette at 128px beside ten line drawings.
  - Tap targets: see the new bullet in 6.2. The heading-scoped stretched link
    measured 41px, not the 45 it looks like, and only measuring caught it.
  - **The arrows were broken, and the cause is worth keeping.** `prev` moved
    *forward* and `next` jumped ~3 stops on a desktop. Both came from reading
    `entry.isIntersecting` in an IntersectionObserver with `threshold: 0.6` and
    assuming it meant "at least 60% visible". It does not — it is true for ANY
    overlap above zero, and the threshold only decides when the callback fires.
    So every neighbour showing a 27px sliver counted, the last entry won, and
    `active` sat one ahead of centre on a phone and two or three ahead on a
    desktop where three slides are always in view. Replaced by measuring which
    slide's centre is nearest the track's centre — the only definition that
    survives slides being different distances apart and the middle card being
    scaled. The arrows also re-measure at click time rather than trusting React
    state, which lags a smooth scroll still in flight. Regression test asserts
    ±1 per click at 390 and 1440.
  - **The motion is driven by scroll position, not by state.** The travel felt
    mechanical because two separate things were discrete: the arrows used
    `scrollIntoView({behavior:"smooth"})`, whose duration is short and not
    tunable, and the centre card's lift was a boolean that flipped at the
    midpoint with a 300ms CSS transition behind it — so the size change had
    nothing to do with where the swipe actually was. Now a per-frame pass
    writes `--t` (how centred each slide is, 0-1) straight onto each element,
    and the scale and shadow interpolate off it in CSS; the arrows animate
    `scrollLeft` themselves over 620ms of ease-in-out. Measured: **33 frames of
    travel and 29 distinct scale values**, against the two it had before.
    - `--t` is written by direct DOM style, never through React state: it
      changes every frame of every swipe, and reconciling twelve components at
      60fps for a number only CSS reads would be pure waste. The integer
      `active` stays state, because the counter and the arrows need it and it
      changes rarely.
    - `scroll-snap-type` is suspended for the duration of an arrow's travel —
      mandatory snapping fights a `scrollLeft` written frame by frame — and is
      restored on landing or on any pointer/wheel/touch event, so a swipe
      during the travel takes over instead of fighting it for 620ms.
    - `scroll-behavior: smooth` is gone from the track, so **reduced motion is
      no longer verifiable from computed style** — that assertion silently
      became vacuous. It is handled at the call site (`scrollLeft` set
      directly) and verified by behaviour: under `reduce` a click is 100% of
      the way there after 60ms, against 0% normally.
  - The route is **light grey** (`--border-strong` at 65%), not sky blue. It was
    competing with the CTA and the proof chips for the same attention.
  - **The middle card is scaled up, and the first version of that failed the
    contrast floor.** Off-centre cards were also dimmed to `opacity-70`. It
    looked right; `ink.js` measured the rendered result at **3.28:1** on the
    proof chips, **3.57:1** on the Maps button and **3.73:1** on the body, all
    under 4.5, on cards a desktop reader can perfectly well read — while
    `audit.js` said `contrast failures: none` throughout, because opacity is
    invisible to a CSS-derived number. Emphasis now comes from scale and shadow
    only (`scale-[1.06]`, `origin-top` so the numbered disc keeps its place on
    the line) and everything measures 5.89:1 or better. **This is the clearest
    case yet for 6.2's rule: a declared colour is not a rendered one.**
  - The scaled card also painted over its own numbered disc — equal `z-10`, and
    the card is the later sibling, so the one node you are meant to be looking
    at was the one that vanished. Disc lifted to `z-20`.
  - Cosmetic, on request: the route is dotted with **six** irregular gap
    lengths rather than one repeated value, so it reads as drawn rather than
    generated, and a `BEND` table varies each slice's control points so the
    arcs wander.
  - **The road moved UNDER the cards** (user-supplied reference drawing). It
    was a wave in an 80px band above them, dipping to touch each card's top
    edge so the numbered disc sat exactly on the line. It is now one continuous
    wave painted beneath the cards, which are opaque and hide the stretch they
    stand on — so what you see is the arc crossing each gap, and the disc is a
    station number rather than a point on the route. That trade was deliberate:
    a band 80px deep can only ripple, and a route that never leaves the top of
    the page does not read as a road.
    - This is what forced the gaps wide. `--card` and `--gap` are now sized
      separately and `--slide` is their sum, because one variable could not be
      both the card and the room the road needs to be visible in. On a phone
      `--slide` is deliberately **wider than the viewport**; the card still
      centres and the rest of the screen is gap with the route sweeping
      through. The edge spacers take `max(0px, …)` for that case.
    - **The wave's depth had to become proportional, not fixed.** At a constant
      280px it crossed the desktop's 272px gap at a comfortable ~25° and the
      phone's 156px gap at nearly twice that — two steep blue slashes at the
      screen edges, which is what it looked like before anyone measured why.
      `--field: calc(var(--gap) * 0.72)` holds the slope constant at every
      width.
    - **The dashes: three measurements, two of them wrong, and the line was
      solid the whole time.** Worth keeping in full, because every failure here
      is a different way to be confidently wrong.
      - The line rendered as one unbroken stroke while the code said
        `stroke-dasharray: "5.5 3.8 …"`. Two compounding causes, neither
        visible in the CSS: with `vector-effect: non-scaling-stroke` the dash
        pattern is in **screen pixels**, not the path's user units, so the
        viewBox stretch does not scale it up; and `stroke-linecap: round` adds
        **half a stroke-width of ink at each end of every dash**, so at width 5
        every gap loses 5px. A 3.8px gap therefore renders as nothing at all.
        Rendered ink is `dash + strokeWidth`; rendered gap is
        `gap - strokeWidth`. Values are now 22/22-ish, measured at **24px of
        ink and 17px of gap**.
      - Measurement 1 asked the wrong question: it computed the screen distance
        covered by N units of user-space arc length and reported "26px dashes"
        for a solid line. A real number, precisely computed, about something
        else. **It was used to overrule a correct visual judgement** — the line
        was called finished on the strength of it.
      - Measurement 2 read real pixels but cropped a partly off-screen slide
        down to a **16x16 sliver** and reported run lengths from it without
        noticing. A measurement tool must report *unusable input* as unusable;
        this one had no floor, so it returned confident nonsense.
      - Measurement 3 crops the gap between two cards — the only place the road
        is visible — refuses to report on a crop under 80px wide, and prints
        the raw run lengths, not just a median. That last part is what made the
        16x16 failure obvious the moment it recurred.
      - The general rule, third time it has bitten this project: **a number
        from a tool you wrote is evidence about the tool until you have
        cross-checked what it measures.** `audit.js` colour, the `ink.js`
        cutoff, and now this.
  - **Temporary scaffolding, reverts on the D14 decision** (same shape as the
    D13 run): `next.config.ts` takes `distDir` from `NEXT_DIST_DIR` again —
    unset it is the plain config, so `:3000` is unaffected — the variant builds
    to `.next-swipe` and serves on **:3104** so a parallel session keeps `:3000`
    and the default `.next`, and `next build` appended `.next-swipe/types` to
    `tsconfig.json`. Scoped CSS is a **CSS Module** this time, not a
    `theme.css` under a wrapper class: Next's own CSS guide notes a route-level
    global sheet is *not* removed on navigation, so the D13 approach would have
    leaked the variant's rules onto `/blajhunt` for the rest of the session.
    The variant adds **no new colour token** — same bar the glyphs merge cleared.

- **2026-09-05 (a page per stop)** — `/blajhunt/[slug]`, ten statically
  prerendered pages, one per objective: what the place is, and a
  "Deschide în Maps" button. The roadmap keeps its one-line teasers and its
  measure; the history that would have crushed a card lives a tap away.
  Three things worth knowing:
  - **The content is written, and 8 of the 10 entries are unverified.** The
    history came from general knowledge, not from any source in this repo.
    Every entry carries a `confidence` flag and the `"check"` ones carry a
    `verify` line naming what to confirm. Tracked as **A6**, and it blocks
    going public — not the build.
  - **No part of a probă is on these pages**, by rule stated at the top of
    `blajhunt-places.ts`. The line is easy to cross by accident: "Casa Maniu
    has a balcony" is context, "look at the balcony" is the answer to stop 05.
    The pages repeat the proof chips and the points because those are already
    public on the roadmap, and say so explicitly: *"Proba se anunță pe teren.
    Pagina asta nu o conține."*
  - Cards link via the **stretched-link** pattern, which `audit.js` reports as
    seven small tap targets and which hit-testing shows is one card-sized
    target. Recorded under the false positives in 6.2 with the evidence.
    The affordance is a gold **↗** after each title, not an underline: a rule
    under a 20px semibold heading, in a language this full of descenders and
    cedillas, reads as a strike-through. The arrow is `--contrast-text`
    (6.98:1 measured on the card), not the bright `--contrast`, which is
    **1.57:1 on white** and would have been an invisible affordance.
  Two defects caught by looking rather than by the harness: `text-h1` does not
  exist as a token, so the detail-page `<h1>` was silently inheriting 16px
  (the exact `@theme inline` trap CLAUDE.md warns about — Tailwind v4 raises no
  error); and the glyph tile beside the heading squeezed a four-word cathedral
  name into four lines on a phone, so the tile now stacks above the title below
  `sm`.

- **2026-09-05 (the glyphs win, and the field carries past the fold)** — D13
  decided. `/blajhunt` is now the glyphs variant, and the other two routes,
  their components and their plates are deleted. What each contributed:
  - **glyphs — merged.** With the placement fixed: the drawing moved out of the
    gap between two cards and into its own card, because floating between two
    stops it read as an intermediary rather than as a picture of one (6.1d).
    That also gave back the 391px the mid-gap placement cost, so the trail is
    +4.3% over flat rather than +8.1%. Six of the ten drawings were redrawn:
    `school` had a lollipop tree that read as a balloon on a string,
    `chapel`'s grave cross floated detached at the height of the church,
    `townhouse` read as a barn, `archive`'s document read as a second
    building, and `college`/`office` were near-duplicates of each other.
  - **images — dropped.** Correctly predicted by its own agent: +40.5% scroll
    and 423KB, and a photograph of a stop gives away stops that are "find this
    building". If a photo per objective ever happens it belongs somewhere the
    reader chooses to go, not on the roadmap.
  - **background — photographs dropped, gradient kept.** Its backdrop was
    unintelligible on a phone (full-width cards leave it 20px gutters), but it
    showed what the page loses by going inert below the fold. `trail-field`
    keeps that idea using the four `--field-*` tokens and no photographs at
    all (6.1c).
  Also: the theme's own colours now do the work a stack of greys was doing —
  gold points pills, sky proof chips, a sky route and gold drawings (6.1d).
  And the temporary scaffolding is gone: `next.config.ts` is a plain config
  again, `/.next-*/` is out of `.gitignore`, and no variant keeps a
  `theme.css` — the merge needed **no new colour token at all**, only two
  gradient utilities built from tokens that already existed.

- **2026-09-05 (`audit.js` stops lying about colour)** — Two defects in the same
  function, both of which made it report failures that were not real, which is
  the worst thing a measuring tool can do. It now normalises through a 1x1
  canvas and composites over white. Full account in 6.2. Cross-checked against
  `ink.js`, which measures rendered pixels independently: the chip the harness
  called 2.56:1 renders at 5.89:1, and after the fix the two agree.

- **2026-09-04 (three creatives, built side by side)** — The user wrote three
  directions for dressing up the roadmap (`creatives/`) and asked for one page
  per direction rather than a description of each, so they can be compared on a
  phone and two thrown away. They are at `/blajhunt-glyphs`, `/blajhunt-images`
  and `/blajhunt-background`; the choice is **D13**.
  The route itself moved to `src/lib/blajhunt-stops.ts` first, read-only and
  shared, so that comparing two variants compares their treatment and not a
  drifted copy of the copy. Three deliberate, **temporary** deviations carry the
  run and all three revert once one variant wins:
  - `next.config.ts` takes `distDir` from `NEXT_DIST_DIR`. `next dev` and
    `next start` both read *and write* `.next` and the loser serves mixed
    content without erroring, so each variant got its own dist dir and port
    (3101-3103) while **:3000 kept the default `.next`** as the stable view.
  - New colour went in a per-variant `src/app/blajhunt-<slug>/theme.css`, scoped
    under a wrapper class, rather than `globals.css`. The rule is one declared
    place for colour; three parallel writers to one file would have clobbered
    each other, so it was one declared place *per variant*. The winner's tokens
    fold back into `globals.css`.
  - Each variant copied `how-it-works.tsx` to its own `trail.tsx` instead of
    editing the shared component.
  One consequence the plan did not anticipate: **`next dev` rewrites
  `tsconfig.json`**, appending `<distDir>/types/**/*.ts` to `include` for
  whichever dist dir it was started with (and reformatting the file). Three
  servers therefore added six entries pointing at `.next-glyphs`,
  `.next-images` and `.next-background`. Reverting them is part of the
  teardown, not optional tidying — they would outlive the directories they
  name.
  Also promoted the glyph-mask contrast harness out of a job temp directory into
  `.claude/skills/web-verify/ink.js`, because two of the three creatives put text
  over photographs and that is the only measurement that can see it (6.2).

- **2026-09-04 (the arches stop repeating)** — The curve drew the same bend on
  every row, which reads as machine-drawn however nice the bend is. It now
  cycles five arches that vary the crossing point, the node depth, the lean and
  the phone gap height. Continuity is the risk this introduces and it fails
  silently, so it is asserted rather than eyeballed: the last x of each row's
  path must equal the first x of the next, and it does on all eleven boundaries.
  Disc-to-card clearance moved from a flat 15–18px to 8–23px as a result, which
  is still clear. Details in 6.1d.

- **2026-09-04 (the route becomes a curve)** — The trail was a straight dashed
  line down a 48px gutter. It is now a dotted curve that meanders past the
  stops, per a reference the user drew from their own desktop view. Both halves
  of that change came from **opening it on a phone**: the gutter was what made
  the cards 302px wide ("narrow as fuck"), and a curve needs room to curve into
  that a phone does not have.
  So the phone layout was inverted: cards go full width (302px -> 350px, ~34 to
  ~41 characters a line) and the curve moved into the gaps between them, with the
  numbered disc straddling each card's top edge where the curve lands. Wide
  screens keep the alternating columns and get the continuous line from the
  reference. Geometry and the two measured numbers behind it in 6.1d.
  Also: the card tilt is now `lg:` only — a full-bleed card sitting crooked
  against the screen edges reads as a mistake, where a floating one reads as
  hand-placed; and the terminals' text no longer hangs indented past its disc,
  which looked like a stray indent beside ten full-width cards.

- **2026-09-04 (`/blajhunt` roadmap)** — The hunt route as a page: ten numbered
  stops on a dashed trail, each with its points and what the team hands in
  (Răspuns / Foto / Video / Căutare). **Roadmap only** — no rules, no hint
  texts, and nothing lifted from `Treasurehunt.docx` beyond a stop's name and
  the kind of proof, because that file is the answer key. Two 21st.dev
  components went in and both needed real surgery, recorded in their file
  headers: the "How it works" pinned cards had no trail below `md` at all (five
  hard-coded `md:absolute` slots against a five-step SVG path), hard-coded
  `bg-orange-50` / `#D3D3D3` / Comic Sans, `dark:` on every rule, and an
  8-degree tilt that overflows a 390px viewport; the Waves shader shipped a
  near-black ramp, a vignette, and a forever rAF loop. See 6.1c.
  Found along the way:
  - **`cn()` deletes the type-ramp sizes.** `cn("text-h3", "text-card-foreground")`
    returns the colour alone. Three spots shipped 16px where 13px was written,
    silently. Ramp size + conditional colour now go in a template literal (6.2).
  - **The glyph-mask harness was under-reporting by a third.** Its glyph-core
    cutoff was admitting antialiased edge pixels. Calibrated against a control
    with known flat colours; the landing page's worst contrast is 6.15:1, not
    the 5.02:1 this document claimed (6.2).
  - The two source documents disagree about the ten stops in three ways, not
    one. The roadmap follows `Regulament.docx` because it is the only list that
    sums to 1000 points (10.1, D3).

- **2026-09-04 (workshops stage flipped to light)** — The dark stage was breaking
  the site's continuity: bright landing with black type, then a near-black
  workshops page with white type, reading as two different products. Flipped the
  stage to light with near-black ink, and put the **real palette accents back**
  — sky-400 and yellow-400, alternating per workshop, which is what the theme
  wanted in the first place.
  The important part is *why the accents could come back*. On the dark stage the
  accent had to be dark, because the grade's `multiply` was the only thing
  holding the backdrop's luminance down for white type. Now the grade **lifts**
  instead: hue via `mix-blend-mode: color`, a `--stage` wash at 68% that
  guarantees the floor, then the accent again at 19% to restore the tint. The
  floor no longer depends on the accent at all, so it can be as bright as the
  palette. Dark ink needs backdrop luminance >= 0.19; near-white needs <= 0.17.
  **Those never overlap** — which is exactly why "bright backdrop + white text"
  was never going to be tunable, and why flipping the ink was the fix rather than
  softening the colour.
  Fixed along the way:
  - The scrims were still tuned to *darken* for white type. Left at those
    strengths on a light stage they bleached patches to near-white and the field
    read as blotchy. Down from 70/92/82/95% to 40/55/46/75%, which also lets the
    photograph and the tint through evenly.
  - Cards gained `--border-strong` and `--shadow-card`: bright photos separated
    themselves against a dark field and dissolved into a light one. Unfocused
    cards now recede by washing *toward* `--stage` rather than darkening.
  - **`--muted-foreground` is not safe on this stage** — 7.8:1 on pure white,
    3.5:1 over the graded field. It was the disabled control's label, carrying
    real information ("Înscrieri în curând"). Now `--on-stage` at 80%: 5.03:1.
  Verified: worst rendered-ink contrast across 5 viewports x 2 slides is
  **5.03:1**, no failures. Tier 1 clean on both pages at 390/768/1440, and
  `hittest.js` reports all 14 interactive elements reachable.
  Docs reconciled in the same pass: SPEC 6.1b was titled "the one dark surface"
  and carried an "accents must be DARK" rule that this change inverts — rewritten,
  with the old numbers kept as a warning for anyone who flips it back. The
  matching non-negotiable in `CLAUDE.md` was updated too.

- **2026-09-04 (dead back link + docs reconciliation)** — The `/ateliere` back
  link did nothing. Not a link bug: the headline block is a **later sibling** that
  spans the top of the stage with no `pointer-events: none`, so it painted over
  the top bar and swallowed every click. `elementFromPoint` at the link's centre
  returned the headline block, not the link. Fixed with `z-30` on the top bar.
  The link had passed every check we run — present, focusable, 84x44, good
  contrast — because **nothing in the harness asked whether it could be clicked**.
  Added `.claude/skills/web-verify/hittest.js`, which hit-tests every interactive
  element on every route. All 14 across both pages now reachable.
  **Why it looked unfixed:** the bug was reported against the live Vercel URL,
  and the deployed build was two fixes behind the repo. Recorded in section 4 —
  the deployed build is not the repo, and a local fix is not a shipped fix.
  Docs reconciled against reality in the same pass:
  - `SPEC.md` still said the display font was **EB Garamond**. It has been
    **Outfit** since the Sunlit Sky switch. Fixed.
  - A parallel session deployed to Vercel and wrote section 4's deployment block.
    Verified independently rather than taken on trust: `.vercel/project.json`
    exists, the URL returns 200, and — the part that actually matters —
    `docs/Treasurehunt.docx` returns **404** on the live site, with an explicit
    `.vercelignore` excluding `docs/`. The answers are not exposed.
  - Added `CLAUDE.md`: the docs-ping-pong contract, the verify-by-looking rules,
    the non-negotiables, and the two deliberate accessibility deviations (D9, D10)
    so a future agent does not silently "fix" them.

- **2026-09-04 (workshops page)** — Built `/ateliere` as a full-bleed carousel:
  six placeholder workshops, each with a name, a portrait, a description and a
  (disabled) sign-up button. Adapted from the crafterui / 21st.dev editorial hero
  carousel into `src/components/ui/hero-carousel.tsx`. Added `framer-motion`
  (13.2.0) — the first runtime dependency beyond Next, React and lucide.
  **Route is `/ateliere`, not `/workshops`** — the site is in Romanian, the
  landing CTA already pointed there and the spec's site map already used it. One
  line to change if the English slug is wanted.
  What the adaptation changed from the original:
  - **Responsive ratios.** The original had one set tuned for a wide stage; at
    390px it put the strip at 50% with a two-line headline crushed above it and a
    dead band below. Two sets now, chosen off the measured width at 720px.
  - **A copy band** under the strip carrying the description and the action, with
    a scrim of its own — body copy over a graded photo needs more cover than a
    mono label. That band is why the phone ratios lift the strip to 36%.
  - Colour from `--stage` / `--on-stage` instead of hard-coded black and white;
    the back control is a real `<Link>` with `transitionTypes`; `select-none`
    dropped so the description can actually be selected; images carry width and
    height.
  - Credit and meta stack left under the title below 720px instead of being
    pushed right, where they collided with the second title line.
  Defects found and fixed in this pass, all by looking rather than by tier 1:
  - **Light accents put an 11px label at 1.63:1** at 1440. Fixed by darkening
    every accent, raising the multiply to 0.62 and adding a `--stage/35` floor.
    Worst rendered-ink contrast across 5 viewports x 2 slides is now **6.74:1**.
  - **The headline scrim drew a hard line across the stage** — its ramp did not
    complete inside its box. Same class of bug as the landing page's copy scrim,
    reintroduced within the hour. Written up in section 6.1b so it stops
    happening.
  - **My own label floor was `Math.max(11, …)`** — under the 12px hard rule, and
    these are letterspaced caps, which the rubric says need *more* size. Now 13.
  Measurement note: the contrast pass now samples the **rendered** ink rather than
  the declared colour, by diffing a normal shot against one with the ink made
  transparent and reading both at the same glyph-core pixels. The declared colour
  hides `opacity`, colour alpha and blend modes — all three are in play here.
  Verified: keyboard (Arrow/Home/End), touch swipe with velocity, tap-to-focus,
  the disabled CTA, reduced motion, and client-side navigation with
  `document.startViewTransition` available. Tier 1 clean on both pages at
  390/768/1440.

- **2026-09-04 (deployed)** — Live on Vercel as `geneous/blaj2026`, production, public. See
  section 4 for the redeploy command and, more importantly, for what that command ships: the CLI
  uploads the **working tree from disk**, not a git commit, so uncommitted edits go straight to
  production and rollback exists only as Vercel's deployment history.
  Three things had to be worked through to get there:
  1. `vercel deploy --temporary` (the no-login path) builds **locally** and died on
     `EPERM: operation not permitted, symlink`. Windows blocks symlink creation without Developer
     Mode or admin; Developer Mode is `0` here and the toggle needs admin. Logging in and letting
     Vercel build remotely avoids it completely.
  2. The project name defaults to the directory name, `Arhieparhiala`, which Vercel rejects for
     having capitals — the same trap `create-next-app` sprang earlier. Fixed with
     `vercel link --project blaj2026`.
  3. Vercel created the project with `ssoProtection: all_except_custom_domains`, so every request
     302'd to `vercel.com/sso-api` and only the owner could see it. Turned off by hand in
     Deployment Protection. **A deploy that returns 200 for you is not proof it is public** —
     check it unauthenticated.
  `.vercelignore` added and verified against the deployed file tree: `docs/` is present only as an
  empty directory node with no content hash, so `Treasurehunt.docx` never reached the build.

- **2026-09-04 (pause control removed)** — Dropped the marquee pause button on request; the
  carousel now runs unconditionally. Accepted deviation from a Vercel MUST and WCAG 2.2.2,
  recorded as D10 and in section 6.1. `prefers-reduced-motion: reduce` still pauses it (verified:
  `reduce` -> paused, `no-preference` -> running).
  Side effect worth keeping: with no state and no handlers left, the carousel dropped
  `"use client"` and the whole landing page is server-rendered — no component JS ships to the
  phone. Zero `<button>` elements in the served HTML. The dead `.marquee-paused` rule is gone
  from `globals.css`; the `prefers-reduced-motion` block is untouched.
  Tab order is now a single stop: the CTA, with a visible ink focus ring. Tier 1 still clean at
  390/768/1440 — 0 overflow, 0 tap targets under 44px, 0 console errors, 0% empty band.

- **2026-09-04 (cold review pass)** — Reviewer verdict *fix-first*: 3 BLOCKING, 4 should-fix,
  1 nit. All 8 addressed. The three blocking ones were each invisible to tier 1:
  1. **The kicker lost its scrim on short viewports** — 2.24:1 in landscape, 1.96:1 at 200%
     zoom, 4.42:1 at 360x640. Root cause: the wash's stops were *viewport-height* percentages
     while the copy is positioned by its own height, so shortening the viewport slid the copy
     off the opaque zone onto raw photography. The copy now carries its own scrim, anchored to
     the copy block. Worst glyph contrast across 11 viewports incl. both landscapes and 200%
     zoom: **5.16:1**.
  2. **The CTA had no press state on touch.** Tailwind compiles `hover:` under
     `@media (hover: hover)`, which is false on a phone, so `hover:-translate-y-0.5` never fired
     and `active:translate-y-0` cancelled a lift that never happened — while
     `-webkit-tap-highlight-color: transparent` had removed the native flash. Zero of 82,080
     pixels changed on press. Now `active:` carries its own colour and scale: verified on a
     forced touch context (`hover: hover` = false) as `rgb(0,188,255)` -> `rgb(0,153,214)`.
     **Never signal a state with `hover:` alone — it does not exist on the target device.**
  3. **The focus ring was `--ring: #00bcff`, the same hue as `--primary`** — 1.00:1 against the
     button it outlines and 2.18:1 against the page. Tier 1 confirmed a ring was *present*;
     presence is not the 3:1 floor. `--ring` is now ink `#04212c`: 16.68:1 on the page, 7.65:1
     on the button.
  Should-fix, also done: the marquee never ran *under* the copy below lg (flat white panel with
  a photo strip stacked on top — the fix in (1) solved this too, and `audit.js` now reports
  `contrast skipped: 6` where it reported 0, which is the harness itself confirming the copy
  moved onto imagery); rows now deal from rotated slices and every third frame runs wider, so a
  frame is never directly above a copy of itself; the yellow rule is a block above the kicker
  rather than a flex sibling under `items-center`, where it centred on the whole two-line block
  and aligned to neither line; `/ateliere` was an unstyled default between two 39.5% empty bands
  and now carries the site's identity at 29% (32% on tablet, marginal).
  Found while fixing, not in the report: the copy scrim's *own* radial drew a hard line across
  the fold, because a `140% 125%` radial is still fully opaque where its box ends (the edge sits
  at 0.5H, the radius at 1.25H). Any scrim gradient must reach transparent **inside** its own box.
  **Skip link stays omitted** and the reviewer agreed: WCAG 2.4.1 exists to bypass repeated
  blocks, the first tab stop is already the primary action, and it would be the page's only
  sr-only control. This lapses the moment a header or nav exists — see D9.

- **2026-09-04 (reset)** — Wiped the React landing page back to one fold on request: marquee
  background, title, description, one CTA, nothing else. Deleted `src/components/site/*`, the
  theme provider, the palette switch and `next-themes`.
  **Sunlit Sky is now the only palette and there is no dark mode** (D8 closed). Fonts moved to
  Outfit + Inter; paper grain dropped. Rebuilt the 21st.dev diagonal marquee as
  `src/components/ui/diagonal-marquee-carousel.tsx` with three Unsplash landscape placeholders.
  Ran the web-dev loop properly this time — both rubrics read before authoring, `audit.js` at
  390/768/1440, and a cold reviewer. Composition changes it forced:
  1. **Copy is left-aligned and bottom-anchored, not centred.** GUIDELINES section 2 ("centred
     paragraphs beyond two lines are a defect") and failure mode 2. It moves to a left column at
     `lg`, leaving the photographs the right half — asymmetry is what makes it look authored.
  2. **Pause control added.** Vercel baseline: autoplay motion over 5s alongside other content
     MUST have pause/stop/hide. Verified running -> paused, `aria-pressed` and label both flip.
  3. **Carousel moved after the content in the DOM** so a keyboard reaches the CTA before the
     decorative pause control. Paint order is z-index, not source order.
  Defects found and fixed in this pass:
  - `bg-contrast` rendered nothing for three builds. `--color-contrast` was never registered in
    `@theme inline`, so the utility silently resolved to nothing and the yellow accent rule was
    invisible. **Tailwind v4 raises no error for this.** See section 6.
  - Layout flipped to the desktop composition at `md`, which pushed the copy past the left
    scrim's solid zone on a 768 tablet — the kicker measured 4.50:1, exactly the floor. Moved the
    switch to `lg` and widened the scrim: now 5.74:1 there, 5.02:1 worst anywhere.
  - The pause control's border was `--border` at 1.26:1 — invisible, and below the 3:1 floor for
    UI borders. Moved to `--border-strong`, and hover now goes to `--foreground` rather than
    staying flat (Vercel Design: increase contrast on hover/active/focus).

- **2026-09-04** — Spec created. Landing page `index.html` v1: hero, photo carousel with six
  placeholder frames, six placeholder workshop cards, Blajhunt band, info block, sticky mobile
  action bar. Two-layer theming with `blaj` and `sunlit-sky` palettes (section 6). Fixed the
  missing doctype / charset / viewport on `blajhunt.html` and `blajhunt.src.html`, and linked
  the guide back to the trunk through its brand mark. Extracted the three `.docx` sources and
  logged their inconsistencies (section 10).
- **2026-09-04** — Logged design references from 21st.dev (section 6.1): Sunlit Sky palette
  wired in as a switchable palette, diagonal marquee hero parked until real photos arrive.
- **2026-09-04 (later)** — Went to React. Scaffolded Next.js 16 + Tailwind v4 + shadcn/ui at the
  repo root, ported the landing page into components, rebuilt the hero around the diagonal photo
  marquee, and moved the token contract onto shadcn's names so 21st.dev components drop in.
  Adopted the project's `web-dev` / `web-verify` skills as the working loop. Tier-1 audit on the
  ported page: no horizontal overflow, no sub-12px text, no console errors, tap targets clean.
  Stack decision recorded in section 4; D1 closed.
- **2026-09-04 (review pass)** — Cold visual review across 320/390/768/1440, both palettes, light
  and dark. Eight findings, all fixed:
  1. *(blocking)* The hero painted its backdrop with `bg-foreground`, so in dark mode it inverted to
     cream and the photo frames vanished — 1.59:1. Added `--dark-surface`, identical in both
     schemes, for the two sections that are always dark.
  2. *(blocking)* `--brand-soft` was used as text on those always-dark sections and flipped to dark
     brown in dark mode: the Blajhunt stats measured 1.93:1. Added `--on-dark`, scheme-independent.
     Now 11.41:1 (blaj) / 11.82:1 (sunlit).
  3. *(blocking)* The mobile menu had no focus trap — Tab walked behind the opaque panel. The toggle
     sits before the panel in DOM order, so the first fix still leaked; the cycle is now explicit
     and verified to wrap without escaping.
  4. The "provizoriu" chips measured 1.44:1 in sunlit light (yellow-400 on white). Added
     `--contrast-text`, 6.41:1.
  5. Cards had no elevation anywhere (1.01–1.16:1 surface, borders ~1.3:1). Split the token:
     `--border` stays a subtle divider, `--border-strong` (~3.06:1) carries card edges, plus a
     layered `--shadow-card`.
  6. The lead workshop card was gated behind `sm:`, so at 390px — the stated design target — all six
     cards were identical. It now leads at every width.
  7. The mobile menu was 56% empty with every target above the thumb zone. Content moved to the
     lower two-thirds.
  8. Ten distinct type sizes on the page. Now exactly five (13 / 16 / 20 / 29.3 / 50.7), matching
     the ramp `globals.css` declares.
  Also replaced the disclosure `+` with a chevron that rotates on open, and dropped the
  `PUBLIC/FOTO/01.JPG` label from the gallery frames — an engineering artefact to show an organiser.
