# Blaj 2026 — Platforma Întâlnirii Tineretului Greco-Catolic

> Living spec. Everything we decide, plan, build or worry about goes here.
> Working language of this doc: EN. Working language of the product: RO.
> Last updated: 2026-09-13

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
                              ateliere/page.tsx — workshops carousel, reads src/lib/ateliere.ts
                              ateliere/[slug]/page.tsx — one page per workshop (7, static)
                              blajhunt/ — the hunt ROADMAP (route only, no rules), the
                                horizontal one-stop-per-screen carousel that won D14:
                                page.tsx + trail-swipe.tsx + trail-swipe.module.css
                              blajhunt/[slug]/page.tsx — one page per stop (10, static)
                              blajhunt-legacy/page.tsx — the vertical roadmap D14 replaced.
                                Unlinked, kept for reference, due for deletion
src/components/ui/            branch-panels.tsx (the landing fold's two branches)
                              welcome-letter.tsx (the organizers' welcome letter, the paper)
                              letter-bell.tsx (the bell and the iOS-style notification on /
                                that delivers the letter and expands into it)
                              diagonal-marquee-carousel.tsx (landing background)
                              hero-carousel.tsx (workshops stage)
                              how-it-works.tsx (the numbered trail on /blajhunt)
                              adisyon-shader.tsx (the sky field behind the hunt hero)
                              stop-glyphs.tsx (one line drawing per stop, D13)
src/lib/                      ateliere.ts — the eleven workshops, typed in from the
                                organizers' documents (A3; seven on 8 Sep, A8/A10/A11 on
                                14 Sep, A12 on 15 Sep), plus HUNT_CARD, the Blajhunt's card
                                on the same strip (A1).
                                ateliere-gallery.ts — reads
                                public/ateliere/<slug>-N.webp and each WebP's size at build; the
                                gallery has no manifest. blajhunt-stops.ts and blajhunt-places.ts —
                                the route and the per-stop context, shared and read-only
scripts/photos.js             cuts the workshop cards to 3:4 WebP, a 120px backdrop tier, AND
                                the landing branch panels to 5:4, on a canvas in the harness's
                                Chromium. Reads poze-org first and poze-raw as the fallback;
                                docs/poze-landing/ -> public/landing/ by filename stem.
                                `--check` resolves filenames and exits. Re-run when a photo
                                arrives. Was ateliere-photos.js until 9 Sep. Vercel-ignored
scripts/copy/                 the copy-review round trip (13 Sep): inventory.mjs lists every
                                visitor-facing string with a stable ID and its place in the
                                code; shots.mjs screenshots the five page types; build_docx.py
                                writes the organizers' fill-in .docx; parse_docx.py reads the
                                returned file into changes.json. Outputs go to docs/copy/, so
                                they are gitignored with the rest of docs/. See its README
public/arhiva/                01-11, two WebP tiers each (-800, -1120) — the REAL archive (A1)
public/placeholder/           1.jpg 2.jpg 3.jpg — Unsplash landscapes, PLACEHOLDER. Only 2.jpg
                              is still referenced, by the Blajhunt branch panel
public/ateliere/              <slug>.webp — the REAL workshop cards (A3), 720x960, or the
                              source's own size up to 960x1280 when it comes from poze-org.
                              All twelve are settled artwork since 15 Sep. 1.jpg-6.jpg are
                              Unsplash stock frames, unreferenced now but kept for the next
                              gap — STOCK in scripts/photos.js has emptied and refilled four
                              times in eight days, so they are not dead weight.
                              <slug>-bg.webp — the 120x160 backdrop tier, one per workshop.
                              <slug>-N.webp — the detail-page galleries, all ten workshops.
                              <slug>-N.webp — detail-page gallery images, native ratio, sized to
                              720 device px TALL. Ten, from poze-raw via the GALLERY_RAW table.
                              1-6.jpg Unsplash portraits: 2.jpg is the landing page's
                              workshops panel. 5.jpg stood in for A7 until its
                              photo arrives, 2.jpg is the landing's workshops panel; 1, 3, 4
                              and 6 are referenced by nothing and can be deleted
public/blajhunt.html          the old static guide, still served at /blajhunt.html
legacy/                       the pre-React landing page and guide sources, kept for reference
docs/                         the three .docx sources, and docs/ateliere/ — ten workshop
                              .docx plus poze-raw/ (what the organizers sent) and poze-org/
                              (settled artwork, already 3:4, named BY SLUG since 14 Sep) —
                              gitignored, see section 13
.claude/skills/               web-dev (design rubric) and web-verify (screenshot harness + reviewer)
```

| Piece | State |
|---|---|
| Landing page | one fold: marquee background — **real archive photography since 8 Sep** — title, description, and the **two branch panels** — one open, one a spine, alternating until the visitor touches anything. **Copy is the organizers' own since 14 Sep** (copy-review round trip); **and since 15 Sep the organizers' welcome letter is behind a bell** in the top-right corner — a badge until read, tap to open the letter as a modal sheet, tap to close; the fold itself is one unscrollable screen again (it carried the letter as a card for one evening, 14 Sep — D15). The **Blajhunt panel got its own artwork on 14 Sep**, the same treasure-map illustration as the hunt's card so the two read as one thing; the workshops panel is still placeholder |
| `/ateliere` | **built** — full-bleed light stage carousel, **twelve cards**: the **Blajhunt at the head as Atelier 01** (A1, `HUNT_CARD`) and then the eleven workshops, numbered **01–12 — the organizers' own numbering**, which the site prints directly since the hunt joined the strip and closed the last offset. Real titles, durations, seats and hooks, and **twelve settled thumbnails** from `poze-org/` — no card is a stock frame. The CTA is *Detalii* → the workshop's own page, except the hunt's, which reads *Vezi traseul* and leaves for `/blajhunt`. The focused card is mirrored into the URL hash |
| `/ateliere/[slug]` | **built** — the workshop sheet: photograph first, then kicker, title, tagline, hook, a ruled facts list with a Maps search link, the disabled signup control with its note, the full description, tags, a native-ratio photo strip, prev/next and a route back to the list. Two-column with a sticky photograph above lg |
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

Target, not current. The BUILT rows are live; everything marked DYNAMIC is unbuilt.

```
/                     landing (common trunk)           static   BUILT
  #galerie            photo carousel (past meetings)   static
  #ateliere           workshop list                    static + link to signup
  #blajhunt           band linking to the guide        static
/ateliere             workshop carousel                static   BUILT
/ateliere/[slug]      one page per workshop: the full   static   BUILT (7 pages)
                      description, coordinators,
                      sessions, location + Maps, the
                      rest of the photos, signup
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
- Cards size up in four steps. The original's flat 400x300 put 2.3 cards across a 390px phone,
  which reads as sliding wallpaper rather than a carousel. The phone step was then raised again on
  **8 Sep** — 124px tall to **176px**, +86% frame area, ~1.8 cards across instead of 2.3 — because
  once the archive was real, small frames read as texture rather than as photographs of people.
  Fewer, bigger, each one large enough to see a face in. Desktop was already right: only the base
  and `sm` steps moved, `lg` and `xl` are untouched.
- Every colour reads `--background`; the original hard-coded `from-white dark:from-neutral-950`.

**Marquee geometry, the part that is easy to get wrong.** Each animated track is two identical
halves and the keyframes translate exactly `-50%`, so copy 2 lands where copy 1 began. One half
must be **wider than the row** or the seam opens as a visible gap.

`MIN_PER_HALF` is **12** and it is a measured number, not a taste. With `wide` on every third
frame a half measures 8x400 + 4x544 + 12x32 = **5761px** at `xl`, against a row of 220vw — so it
clears every viewport up to **2618px wide**. The nine it carried while the deck was three
placeholders measured only 6x400 + 3x544 + 9x32 = 4320px — a ceiling of **1963px**, so every
1920px monitor was one step from the seam and every 2560px one was showing it. Nobody had looked.
Measured, deck at 12 frames:

| Viewport | Row (220vw) | Half | Margin |
|---|---|---|---|
| 320 | 704 | 3056 | +2352 |
| 390 | 858 | 3056 | +2198 |
| 640 | 1408 | 3488 | +2080 |
| 1024 | 2253 | 4416 | +2163 |
| 1440 | 3168 | 5760 | +2592 |
| 2560 | 5632 | 5760 | +128 |
| **2618** | 5760 | 5760 | **0 — the ceiling** |

The base and `sm` halves grew with the 8 Sep card bump; `lg` and `xl` are unchanged, so the
2618px ceiling is set by `xl` and did not move.

**Measure this with `offsetWidth`, not `getBoundingClientRect()`.** The band is
`rotate(-25deg)`, so a rect is the axis-aligned box `w·cos25 + h·sin25` — it reports the 1440px
half as 5347 instead of 5760 and the row as 2998 instead of 3168. The pass/fail comparison
survives that (both terms scale identically, so the ratio and therefore the 2618px ceiling are
unaffected), but every absolute number is wrong by ~9%, which cost a confused detour here.

**The photo budget, as shipped.** Eleven archive photographs, two WebP tiers behind a `srcset` —
**800w and 1120w**. Every phone pulls **351KB** for the whole archive; the source JPEGs are 3.5MB.
The recipe is `sharp`, `.blur(0.75)` then `quality: 55`. The pre-blur is the lever that pays:
these are dense crowd shots and fine detail is what costs bits, so quality alone only took the
worst frame from 54KB to 40KB, while blur-then-quality took it to 33KB. It is invisible at a
card's real size — 228x124 on a phone — behind a wash, on a band that is rotated and moving;
checked by rendering frames at their true card sizes and looking. Only the first row is
`fetchPriority="high"`; the rest lazy-load, and because all five rows deal from the same eleven
files, everything after the first row is a cache hit.

`sizes` must be the width a frame is **painted** at, not its box width. The sources are 3:2 under
`object-cover`, so a narrow card fills by height and overflows sideways — it paints 1.5x its own
height, wider than its box at every breakpoint. Feed the browser the box width and it picks the
small tier for a card that needs more.

**Why 800w and not 640w — the tier-straddle trap.** Every photograph is dealt into narrow slots
*and* wide slots, so it has two painted widths at once. Put a tier boundary between them and the
browser fetches **both** files for **every** photograph, and the deck doubles. At 640w a DPR3
phone wanted 558 narrow / 684 wide, either side of the boundary, and pulled 848KB of a 270KB
archive — on the one device class this whole site is built for. 700w fixed DPR3 and still split
DPR3.5 (Pixel Pro) at 880KB.

Since the 8 Sep card bump the phone step paints **both** widths at the same 264px, because the
wide card is now exactly 1.5x the card height — the width a 3:2 source occupies at that height —
so a base-breakpoint straddle is impossible at any DPR. 800w is what keeps DPR2 and DPR3 phones
on the small tier regardless: 264x3 = 792, just inside it. Measured transfer, not arithmetic:

| Device | Files | Transfer | Tiers |
|---|---|---|---|
| phone 320 / 390, DPR2 and DPR3 | 11 | **351KB** | 800 |
| phone 390 DPR3.5 | 11 | 578KB | 1120 |
| tablet 768 DPR2, `sm` 700 DPR2 | 11 | 351KB | 800 |
| laptop 1024 DPR2 | 22 | **930KB** | 800 + 1120 — known, see below |
| laptop 1280 DPR2, desktop 1440 DPR2 | 11 | 578KB | 1120 |
| desktop 1440 / 2560 DPR1 | 11 | 351KB | 800 |

The 1024-1279px-at-DPR2 band still splits (338 vs 408 painted, so 676 vs 816) and pays 930KB.
That is a retina tablet or a small retina laptop, not the target device, and closing it would mean
shipping every phone a bigger tier. **Left open knowingly.** **A card size change is also a tier
change**: if either a tier or a card step moves, re-measure the real transfer per device class.
This trap is invisible to every other check and is not something to re-derive on paper.

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

**Scrim gradients must reach transparent inside their own box — on every axis
the box has.** Three times now a scrim's own edge has drawn a hard line across
the layout. Once on the landing page (a `140% 125%` radial is still fully opaque
at its box edge, which sits at 0.5H), once on the workshops stage, and once more
on the landing page **sideways**: the replacement was `linear-gradient(to
bottom, …)`, whose top and bottom ramps were reasoned about carefully and in
writing — and a `to bottom` gradient has no horizontal ramp at all, so its left
and right edges were square cuts. Below 592px both hung off the screen; from
592px to `lg` the right edge sat inside the viewport and sliced whatever
photograph it landed on, a **95.9/255 luminance step** at 768 wide.

The lesson is the comment, not the gradient. The code carried a careful
paragraph about the two edges it had thought about, and that paragraph is
exactly why nobody looked at the other two. **A note explaining why an edge is
safe should name every edge, or it is an argument that the unnamed ones do not
exist.** The fix is `-inset-x-[50vw]`: the wash does not need the width, it
needs its vertical edges to be the only edges it has.

All three were invisible to every number `audit.js` produces, and all three were
obvious the moment someone looked. Look at the picture. The scan that confirmed
this one is worth keeping: mean luminance per column over the lower band, then
the largest step between adjacent columns — and **run it against the broken
version first**, because a probe that reports "no edge" is worthless until it
has reported a real edge you put there on purpose.

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

**Past the fold, the two roadmaps now do different things, and this section
described only the one that is dead.** Read the split before touching either.

`/blajhunt-legacy` — the vertical roadmap — carries the `trail-field` utility in
`globals.css`: thirteen stops **cycling gold -> white -> sky -> stage three
times** over the ~4000px that page scrolls. The reasoning that produced it still
stands *for that page*: the first version walked the ramp once, which over
4000px is about one step of luminance per screenful, so slow it read as a flat
tint. What makes a field feel alive is how *often* it changes, not how strongly.
`trail-field` has no other caller — grep before assuming otherwise.

`/blajhunt` — the live horizontal carousel — has never used it. Its trail
section paints `.field` in `trail-swipe.module.css`, and **since 9 Sep that is a
handover and then plain white**: `--field-0` at 0%, `--background` by 20%, white
the rest of the way. It walked the four `--field-*` stops once until then, and
that pale sky wash was the bottom layer of three blues stacked inside the same
400px — field, then the sky glyph plate on each card, then the sky-tinted proof
chips, with the sky CTA on top of all of it and no longer reading as an accent.
The carousel is one screen tall, not 4000px, so the frequency argument above
buys nothing here; accent economy (GUIDELINES 5) does. Sky is now spent on
actions only.

What both share is the seam: each begins on `--field-0`, the warm gold the
hero's own bottom edge ends on, and the hero's bottom fade (`field-seam`) was
retargeted from `--stage` to `--field-0` so the two are one continuous ramp with
no line to hide.

Neither is a second palette and neither must become one. The luminance bound
from above governs every stop: the darkest anywhere here is `--field-2` at 0.87,
far above the 0.19 floor, which is what lets near-black ink sit on it directly.

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
stroke-only. On wide screens the drawing sits in the empty
column opposite the card, which is the mockup (`creatives/Roadmap Glyphs.png`).
On a phone there is no empty column, and the first placement — centred on the
curve in the gap between two cards — was **wrong in a way no measurement
caught**: a drawing equidistant from two cards reads as a stop of its own, an
intermediary on the way to the next objective rather than a picture of one. On
a route where every other mark is a numbered destination that is a real
misreading, and it was the first thing seen on a phone.

On the **vertical** trail the glyph became a 44px tile inside the card, pinned
to the **right** on every row. Mirroring it to dodge the numbered disc was tried
and rejected: a tile on the left pushes the title in while the description below
it stays put, and the card loses its left margin. It does not need to dodge
anyway — the disc straddles the card's top edge (y -16..16) and the tile starts
below the padding (y 24..68), so they never touch even when the curve puts both
on the same side. Cost: the trail was 5046px at 390px against 4839px flat,
+4.3%, all of it the tile being taller than a one-line title. The mid-gap
placement cost +8.1%, so the correct answer was also the cheaper one.

**That paragraph is the legacy route's.** D14 moved `/blajhunt` to the
horizontal one-stop-per-screen carousel, and there is no cramped row to fit a
tile into: each card owns a screen. Since **9 Sep** the drawing sits on a full
plate at **88px in a 112px plate**, stroke 1.5 (was 72 in 96 at 1.3), and the
stop detail page's tile is **56px in 80px**, stroke 1.8 (was 44 in 64 at 1.6).
Because the carousel is one screen tall the extra 16px is paid **once, not once
per card**: measured 1808 -> 1824px at 390px (+0.88%) and 1686 -> 1702px at 1440
(+0.95%). `how-it-works.tsx` draws the set twice more, at 32px and 112px, but
only on `/blajhunt-legacy`; it is kept in step, not designed against.

**The palette does the work the greys were doing.** Points pills are
`--contrast` (gold) with near-black ink, every one of them and not just the
finale; proof chips are `--brand-text` on a 5% `--brand` wash inside a
`--brand/45` border; the route's dots are `--brand-text/45`. Measured rendered
contrast: chips 5.89:1, pills 12.58:1, card copy 7.81:1. The page's worst value
is still the hero kicker at 5.17:1 (1440) / 5.56:1 (390), which is inherited
from the sky field and not from any of this.

**The drawings are gilt, and that is the one place a gradient earns its keep.**
They were `--contrast-text` at 70% opacity, which over the near-white plate
composites to about **#97874b — olive, not gold**, and it was the flattest thing
on a page whose whole accent budget is a warm one. Since 9 Sep they carry a
vertical ramp from `--glyph-gold-lit` **#ad8010** at the spires to
`--glyph-gold-deep` **#5f4703** at the ground line. Rendered contrast on the
plate's darkest ground (`--muted`, #f4f4f5) is **3.26:1** at the lit end and
**7.5:1** at the deep end; on the detail page's `--contrast/25` tile the lit end
is 3.21:1. Both clear the 3:1 floor for a graphic, and the lit end is the one to
re-check if anyone brightens it — **#b8880e is already under, at 2.9:1**.

Two traps, both found by rendering rather than by reading the markup:

- **`gradientUnits` must be `userSpaceOnUse`.** The default,
  `objectBoundingBox`, resolves the gradient against the bbox of each element
  that *references* it — and since the stroke is inherited from the `<svg>`,
  that is **every path separately**. The ground line, 0 units tall, comes out
  flat and light; a churchyard cross low in the frame gets its own full
  light-to-dark ramp instead of the dark it should be at that height. The glyph
  reads patchy rather than lit, and nothing in the source says so.
- **The stops take `var()` through `style`, not through `stop-color`.**
  Presentation attributes do not accept `var()`; the CSS property does. The two
  tokens are deliberately **not** in `@theme inline` — they are consumed as raw
  `var()` inside the gradient, never as a utility, so a `--color-*` alias would
  only manufacture two utilities nobody calls.

The drawings are **invented archetypes, not portraits** — nobody has checked
whether Casa Maniu has a balcony. That is deliberate twice over: mismatched
stock reads as a lie, and several stops *are* "find this building", where a
photorealistic render would hand over the answer. A line glyph says "a church
with a graveyard" and nothing more, which is the amount the roadmap is allowed
to say.

**All ten were redrawn on 9 Sep, and the rule that came out of it is: NOTHING
MAY CROSS ANYTHING.** These are stroke-only with no fill, so there is no paint
order and no occlusion — a line drawn "in front" does not hide the line behind
it, it crosses it. That is a rendering fact, not a style choice, and it is what
the user reported on `shop`: the facade ran from y=18 while the awning band sat
at y=21..27, so both shop walls were drawn straight **through** the awning and
the awning read as a transparent smear over the storefront. The fix is
geometric — where two parts meet they now share an endpoint (the shop's walls
start at x=6 and x=42, exactly where the scalloped edge ends; the cathedral's
nave roof springs from the towers' inner faces; the college's tower walls stop
dead on the cornice). An eave that overhangs must clear the wall top entirely
rather than nick it: **a 0.3-unit crossing is invisible in review and visible on
a phone.**

The other two the user named, and four nobody had named:

| Glyph | What was wrong | Now |
| --- | --- | --- |
| `shop` | awning drawn over its own facade — the crossing above | signboard, awning bar, scalloped awning, then the shopfront, stacked so nothing crosses |
| `archive` | a full-height **sheet of paper** standing beside the house, dog-eared corner and all. Meant as a document outliving the man; read as a stray icon that had wandered in | memorial house — chimney, gable roundel, paned window, and a landscape plaque **on the wall** beside the door |
| `office` | a bare 5-unit **dash floating beside the door**, no referent, at a height nothing else shared | deep arched entrance with a moulded surround; a columned portico was tried first and read as a tent pitched inside the building |
| `townhouse` | **a face** — two square windows for eyes over a slatted balcony for a mouth | an arched French window between the upper pair: three openings on that floor, not two |
| `school` | the tree was a **balloon on a stick** | five-lobed canopy (arcs at r=3.2 against a 6.11 chord, bulging 2.25 proud) and a forked trunk that stops at the foliage instead of running through it |
| `monument` | two free-floating ground arcs that read as **eyebrows**, under an obelisk that is not the monument that stands there | redrawn from a photograph — see below |
| `chapel` | grave marker went through three drafts — a cross on a mound read as eyebrows, a round-topped slab as a door, a splayed plinth as an easel | a cross on a plain stone block, which is what reads as stone |

The redraw also spends the extra size: `college` now carries four arches under
four windows where it had three arches and nothing else. **Detail that cannot be
resolved is noise**, which is why the 32px tile in `how-it-works.tsx` went to
32px from 28 — 28 was already below this set's own legibility floor.

**`monument` is the one portrait in the set, and the one place legibility beat
fidelity.** The user supplied a photograph of what actually stands on Câmpia
Libertății: a modernist concrete trilithon — two slab piers under one deep
cantilevered beam, on a plaza behind a long low inscription wall. The obelisk
was simply the wrong building. Drawing from life is safe *here* and nowhere
else in this set: it is an open park with one monument in it, named in the
page's own section title, and per `blajhunt-stops.ts` it is "listed ninth but
its task is plainly the finale" — nobody is hunting for it.

The brief was "must not look like a Japanese shrine", and fixing that ran
straight into a second failure that is worse:

- **Too narrow a slot and it is a fluted column.** Outline-only art cannot say
  *solid* or *void*, only *line*. Four verticals at roughly even spacing group
  as ONE shaft with flutes — which is exactly what the photograph's own
  proportions give, since the real slot is about half a pier's width. A stepped
  plinth underneath compounds it: it reads as a column base and welds the piers
  into one object. Six variants at photo proportions all read as a column.
  Shipped instead: piers land straight on the ground, slot 8 against piers of
  4, and the wall pushed out to the sides as wings. **A deliberate departure
  from the photograph**, and the only one in the set.
- **What keeps it off the torii is everything except the slot.** A torii has
  two crossbeams, a kasagi sweeping up at the ends, poles battered inward and a
  central plaque. This has one straight square-cut beam, tapered so its
  underside is *narrower* than its top (a torii's is the reverse), vertical
  piers, the inscription wings, and the bronze group standing in the slot — a
  torii's opening is empty by definition. Verified by rendering an actual torii
  beside the candidates rather than by asserting it.

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
| `/` | **6.09:1** | the sky kicker at 390px. Re-measured 8 Sep against the real archive; it read 6.15:1 over the Unsplash placeholders, so eleven real photographs cost it 0.06 and nothing else moved |
| `/ateliere` | **9.62:1** | the disabled "Înscrieri în curând" label |
| `/blajhunt` | **5.56:1** | the sky kicker over the sky field, at 390px |

Checked at 320x568, 390x844, 844x390 (landscape) and 1440x900, and at three scroll depths.

**The glyph mask cannot measure text that is moving, and it does not say so.** `ink.js` takes
*two* screenshots and diffs them; if anything animates between the two, the diff is the motion
rather than the glyph. On the landing fold the branch panels alternate every 1.5s forever until
someone touches the page, so on 8 Sep it reported one letter of "Ateliere" at **1.37:1** — a hard
fail — from an 816px "glyph core", three times the area of the identical `e` beside it at 269px.
Re-run under `reducedMotion: "reduce"`, which stops the alternation dead, and the same three
`e`s report a consistent 267-270px core at **8.8:1** and the whole page passes.

The tell is the core area, not the ratio: a letter whose core is wildly out of line with its own
twin is measuring something that moved. Runs were bit-stable across three attempts, so *stable is
not the same as correct* — the animation phase is deterministic relative to load. **Freeze motion
before believing a number on this page**, and note that the harness has no flag for it: copy
`ink.js` and add `reducedMotion: "reduce"` to `newPage`.

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

**A focus ring on an inline link is drawn once PER LINE FRAGMENT.** A stretched link that wraps
gets one ring around each fragment, the fragments overlap, and on `/blajhunt` both 4px edges
landed on top of the words — focusing a card made its own title the hardest thing on it to read,
on three of the ten cards at 390px. Nothing about the CSS is wrong, so `audit.js` sees a pass and
`hittest.js` sees a reachable link; only looking at a focused, wrapping title finds it. **Put the
ring on the `::after` overlay** — it is already one absolutely positioned box covering the whole
hit area, so it gives exactly one rectangle around exactly what is clickable. Drop
`ring-offset-*` while doing it: on an overlay the offset separates the ring from nothing and its
2px band lands on the text below.

Found 9 Sep by a cold reviewer, on a page whose tier-1 numbers were already clean. It is the
clearest case so far of why the reviewer exists.

**A local CSS variable named after a theme token silently voids that token's utility.** Third
member of the same family, found 9 Sep and the worst of the three, because it had been shipping
for as long as the carousel has existed. `trail-swipe.module.css` sized its layout with
`--card: min(82vw, 23rem)` **on the track**. Custom properties inherit, `--card` is also the
shadcn surface colour, and `bg-card` compiles to `background-color: var(--card)` — so every stop
card in that track resolved its own background to a *length*, which is invalid at computed-value
time, which drops the declaration with no error. **The cards were transparent**, measured
`rgba(0, 0, 0, 0)`, and the dashed route was showing straight through them and across the glyph
plates — against the component's whole documented premise that the road runs *under* the cards.
It was nearly invisible because the field behind them was pale, and it survived a
`contrast failures: none` because a CSS-derived number cannot see it either.

The variables are now `--card-w`, `--gap-w`, `--slide-w`, `--field-h`. **Never name a local
custom property after a token in `:root`** — check `globals.css` first, and prefer a suffix that
says what the value is. The cheap detector is a one-line probe:
`getComputedStyle(el).backgroundColor` on a surface you believe is opaque.

Known false positives on this page — do not chase:

- `oversized elements: div.flex w=2271 vw=390`. That is the marquee band, which must be wider
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

- `oversized elements: li.…slide w=452 vw=390` on `/blajhunt` (491 before 9 Sep, when the gap
  was trimmed from 44vw to 34vw; the card is still 82vw — it was cut to 74vw on the way and put
  back, see below). The snap unit there is
  `--card-w + --gap-w` and is deliberately WIDER than a phone viewport: the card centres inside it and
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

- **`ink.js` on `/` is not deterministic while the branch panels alternate, and it will not tell
  you so.** It works by screenshotting twice — once normally, once with the ink forced
  transparent — and keeping the pixels that changed. The pair swaps every 2.6s, so a swap landing
  *between* those two shots makes the whole panel a "changed pixel" and the glyph mask becomes
  meaningless. Nothing errors; you get numbers.
  To measure it, freeze the component first: set `SWAP_MS` to something enormous, and set the
  initial `active` index to 0 or 1 for whichever state you want. Build, measure, revert. Both
  states have to be measured — they are not symmetric, because each carries a different accent
  behind a different photograph. Doing exactly that is where the numbers in the 5 Sep changelog
  entry come from.

- `contrast failures: span.font-ui 4.10:1 (needs 4.5)` on `/` at 1440, for the hint line inside
  the landing page's sky CTA row. **`audit.js` is wrong here, and the arithmetic says so.** The
  ink is `--primary-foreground` at 80% alpha sitting on a `--primary` fill. `audit.js` composites
  that alpha over the *page's* white and then compares the result against the *sky* tile — a pair
  that exists nowhere on screen. Composited over the fill it actually sits on, it is **5.15:1**.
  Confirmed twice, independently: `ink.js` read 5.15 off the rendered glyph cores, and the WCAG
  formula worked by hand gives 5.147. Reproducing the bogus number takes the wrong pairing
  exactly — ink-over-white vs. sky is 4.07, which is the 4.10 it printed.
  The alpha was lifted to 85% (**5.77:1** measured) anyway, but on its own merits: 5.15 is thin
  headroom for a 13px line. That is the distinction worth keeping — the value moved because a
  number about the page justified it, not because a number about the tool demanded it.
  **Fourth time in this project that a tool's number was evidence about the tool.** The other
  three are above and in the D14 notes: `audit.js` colour on rounded corners, the `ink.js` cutoff,
  and the dash-length probe. The habit that catches all four is the same one — reproduce the
  measurement a second way before you believe it, especially when it disagrees with your eyes.

---

## 7. Content and assets we still need

| # | Item | From | Blocks |
|---|---|---|---|
| ~~A1~~ | ~~8-12 photos from past meetings, landscape, min 1600px~~ — **delivered 8 Sep**: eleven 2048x1367 photographs, in `docs/poze-intc/`, re-encoded to `public/arhiva/`. Live in the marquee | organizers | done |
| A2 | 1 hero photo, wide, safe to crop hard on mobile | organizers | reserve, if the marquee ever gets a still fallback |
| ~~A3~~ | ~~Workshop list: title, leader, description, location, time, capacity~~ — **delivered 8 Sep** for A2–A7 and A9, then **A8, A10 and A11 on 14 Sep**, closing the gap: ten .docx in `docs/ateliere/` plus 31 photographs in `docs/ateliere/poze-raw/`, typed into `src/lib/ateliere.ts`. **A12 (ESCAPE MODE) followed on 15 Sep**, alone and with no photographs of any kind. A1 is the hunt, which since 14 Sep has its own card at the head of the strip, so the site's numbering and the organizers' are now the same thing: A1–A12 = 01–12. **All ten resent 14 Sep 17:2x with a room and a `[GPS: ...]` link**, which closes everything this row had been owed since 8 Sep: every room is named (A7 and A10 had no location at all before), coordinates arrived for eight of ten, A8's seat count was corrected to 40, A11's slots cut to 50 minutes and A10 moved off 13:30. All twelve card thumbnails are in, A12's arriving the morning after its document. **Still owed:** photographs OF A12 — it is the one workshop with no gallery on its page, because none were ever sent; plus two small source gaps — A11 has a GPS link but no `Locația:` line, so its room name is read off the link (section 10.9), and A10's document still ends on "Întâlnire la ??" although its room is now named (section 10.8) | organizers | A12 gallery, 2 minor |
| A4 | Confirmed event name — "Inter-eparhială" or "Arhieparhială"? — now asked as row AC-01 of the copy-review document (A9) | organizers | every heading (!) |
| A9 | **The real copy, everywhere.** The organizers want the placeholder text replaced site-wide, so every visitor-facing string — 209 rows — went out on 13 Sep as `docs/copy/Blaj 2026 - Textele site-ului.docx`, a fill-in form generated by `scripts/copy/` (keep / replace / delete per row, new text in a shaded cell, the page's phone screenshot beside each chapter). Everything the site cannot answer itself is flagged ⚠ on its row: A4, the two "Sala ...." rooms, A7's missing location, the Maps searches that could be coordinates, the eight `check` stop histories (A6), the tenth stop with no task. When it comes back, `parse_docx.py` reads it into `changes.json` and the changes are applied from there | organizers | every page |
| A5 | Nothing, for the roadmap — the ten stop glyphs are **drawn and shipped** (`src/components/ui/stop-glyphs.tsx`). Listed so it is on the record that this page has no outstanding asset dependency, unlike the two variants that lost. They are invented archetypes; if anyone ever wants them checked against the real buildings that is a nice-to-have, not a blocker | — | done |
| A6 | **Fact-check the ten stop pages.** `src/lib/blajhunt-places.ts` carries a paragraph or three of history per stop, written from general knowledge by Claude — not from a source in this repo and not by anyone who has stood in front of the buildings. Each entry is flagged `confidence: "solid"` or `"check"`, and every `"check"` entry has a `verify` line naming exactly what to confirm. **8 of 10 are `check`.** | organizers | **before the site is public** (!) |
| A7 | Real coordinates for the ten stops, if wanted. The Maps buttons currently run a *search* for the building's name rather than dropping a pin, because a wrong pin sends a team across town on the day. A search is safe but imprecise | organizers | nice-to-have |
| A5 | Program / schedule of the day | organizers | new section |
| A6 | Contact — phone and email for the day | organizers | footer |
| A7 | Logos (eparchy / event) | organizers | header, favicon |
| A8 | Expected participant count | organizers | code count, capacity, hosting tier |

**The marquee now runs on real photography (A1, 8 Sep)** and the page landed exactly as predicted
— crowds, raised hands, the stage, a hall mid-dance. The order in `ARCHIVE` is deliberate: mean
luminance alternates high/low and no two neighbours share a subject, because every row is a
rotation of that one list and an uninterleaved deck reads as tiled wallpaper.

**Two Unsplash placeholders are still on the fold**, and they are now the only generic images on
it: the branch panels' own photographs, `/ateliere/2.jpg` (sky) and `/placeholder/2.jpg` (gold).
They sit under a heavy tint so they read as texture rather than as pictures, which is why they
survive next to the real archive — but they are still stock, and they should be swapped for two
frames from `public/arhiva/` or from A3 when someone decides which. `public/placeholder/1.jpg`
and `3.jpg` are now referenced by nothing and can be deleted.

Every string on the landing page lives in the `CONTENT` object at the top of
`src/app/page.tsx` and, for the letter, in `LETTER` at the top of
`src/components/ui/welcome-letter.tsx` — the organizers' own since 14 Sep, pinned in the
copy inventory as AC-01…AC-13.

**Workshop photos (A3) have to become 3:4 portraits, and the delivered ones were
not.** The stage crops cards to 3:4 and anchors clipped neighbours at the MIDDLE, so
a half-height card is the middle half of its own picture, 25%–75%. **Put the
subject in the vertical middle** and treat the top and bottom quarters as
margin that only the focused card will show. What arrived on 8 Sep was eighteen files from 0.67
to 7.2:1 — collages with captions baked in, a poster with its title in the pixels,
framed icons, room interiors — and not one face of a young person. The cards are
therefore **cut by hand**, one window per photo, by `scripts/photos.js`
(`focal` + `zoom`; 720x960 WebP; sources stay in `docs/`). Two windows were
forced by the backdrop, not the card: the same file is blown up behind the
headline, and both the A2 poster's title and the A4 collage's caption came
through the wash as legible text at 1440. Cut below the title band and from one
panel of the collage respectively. The user's direction is a consistent,
generated set once the creative is settled; until then these are honest crops.
The photos that did not make a card belong on the detail pages at native ratio.

**The generated replacements land in `docs/ateliere/poze-org/`, and that
folder wins.** A slug present there is taken from there and its hand-cut
window in `poze-raw` is skipped, so replacing a card is dropping a file in and
re-running the script. Files are matched by a leading `Atelier <1-7>` (position
in the list), `A<n>` (the organizers' number) or the slug; `- Thumbnail` is the
card, anything else is a gallery image. **`Atelier 6` and `A6` are different
workshops** — the first is position 6, which is A7 — which is why every run
prints the resolved title beside the file and why naming by slug is safest.

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
6. ~~**A8 cannot seat what it says it seats**~~ — "Locuri: 60 (2 grupe)" over groups of 20 + 20.
   **Resolved 14 Sep: it is 40.** The header was the error; the groups were right.
7. ~~**A11's duration and its slots disagree**~~ — "Durata: 50 de minute" over two 60-minute
   slots. **Resolved 14 Sep:** the slots were re-cut to 13:45–14:35 and 14:45–15:35.
8. **A10's document still ends on "Întâlnire la ??"** — but no longer has no location: the
   14 Sep resend named the room (Sala clasei a V-a – Liceu) twelve lines above that line and left
   it standing. Reads as leftover draft text rather than a live question, and the site prints
   nothing from it. Worth one sentence of confirmation: if the group actually gathers somewhere
   other than the room, nobody has said where.
9. **A11 has a GPS pin but no `Locația:` line.** It is the only one of the ten documents with no
   location text at all — the 14 Sep resend added `[GPS: .../place/Biblioteca+de+Teologie+
   Greco-Catolic%C4%83+Blaj/]` and nothing else. The site prints "Biblioteca de Teologie
   Greco-Catolică", **read off that link rather than stated by the organizers**. The pin is
   theirs; the words on the page are ours. Confirm the room, since a library is a building and
   the workshop is presumably in one room of it.

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
| ~~D14~~ | ~~Does the roadmap go horizontal?~~ — **decided 5 Sep: yes.** The swipeable one-stop-per-screen carousel *is* `/blajhunt` now; the vertical original is parked unlinked at `/blajhunt-legacy` and is due for deletion. `/blajhunt/[slug]` stays — it is shared content, not scaffolding, and both treatments deep-link to it. Temporary scaffolding reverted, see the changelog | user | done |
| ~~D4~~ | ~~Do workshops need capacity limits?~~ — **answered 8 Sep by the documents, restated 14 Sep**: every workshop states its seats (20–70, **465 in total**) and seven of eleven split into timed groups of 15–35 — A3 runs **three** groups since the 14 Sep resend, the only one that does. All eleven run in parallel inside **13:40–15:45** (A10's 13:30 start was corrected to 13:45 in that resend), so one workshop per person stands (section 5). A12 is the only one with a stated age *recommendation* rather than levels: 14–16 | organizers | done |
| D5 | Are participants pre-registered, so we have names in advance, or walk-in? Changes the code flow. | organizers | 9 Sep |
| D6 | One round or two ("două ture")? The schema has `round`, but the UI differs. | organizers | 12 Sep |
| D7 | Final video: uploaded through the platform, or handed to staff on site? (13.1) | organizers | 13 Sep |
| ~~D8~~ | ~~Palette~~ — **decided 4 Sep**: Sunlit Sky, light only, no second palette | user | done |
| D9 | Skip-to-content link is a Vercel MUST but there is no nav to skip yet. Add it with the header, or now? | us | with the header |
| ~~D10~~ | ~~Marquee pause control~~ — **decided 4 Sep**: removed on request. Accepted deviation, see below. (Its scope grew for one evening, 14 Sep, when the band was a sticky backdrop behind the letter card; the 15 Sep revert put it back to the fold alone. Behind the open letter sheet it is dimmed by the backdrop and inert) | user | done |
| D15 | ~~The organizers' welcome letter (948 ch) does not fit the hero slot; where does the rest go?~~ — **14 Sep, late: a card of its own on `/`** (beside the copy from `xl`, under the fold on a phone, sticky marquee), built as `/scrisoare`, promoted and deployed. **Reverted 15 Sep by the user:** „useless, no one's gonna read it, the mobile version looks completely ass.” The letter is a **notification** now — a bell with a badge in the top-right of the fold (`letter-bell.tsx`), which opens `welcome-letter.tsx` in a native modal sheet; the fold is one unscrollable screen again. **Phase two, 15 Sep: the user picked the iOS-style notification** — a banner drops in from the top edge on first visit (sender, two-line preview, „acum”), a tap expands it in place into the letter, ✕ / Esc / swipe-up put it away; the bell re-delivers it. Built on `:3000` for the user's eye; the plain sheet is gone | user | user's eye |
| ~~D16~~ | ~~«Intereparhială» or «Arhieparhială»?~~ — **decided 14 Sep by the user: Intereparhială.** The returned copy sheet had changed „Tineretului” to „Tinerilor” and left „Intereparhială” untouched, which was not the same as confirming it; the user confirmed it separately. The supratitlu reads **Întâlnirea Intereparhială a Tinerilor** | user | done |

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

- **2026-09-15, evening (the title becomes a weight pair; a handle was tried
  and rejected)** — the user, with the home page done: „is there anything nice
  we can sprinkle on it design wise to make it look more professional… very
  minimal, it has to respect the current layout.” Three moves were built on
  branch `worktree-landing-polish` and shown on :3004. **One shipped.** The
  user's verdict on the rest, on sight: „the only thing i like is the title
  style. i like it, the rest is ass.” So master carries the title and nothing
  else, and this entry records the other two so they are not re-proposed.

  **Shipped — the title is a weight pair.** „Blaj” is Outfit 500
  (`font-medium`) and „2026” is Outfit 300 (`font-light`); the variable font
  is already loaded, so neither costs a request. **The word shipped at 600 and
  came down the same evening** — „that Blaj is a lil too bold”. 500 against 300
  keeps the 200-step gap the pair needs to read as two voices; 450 was rendered
  and rejected here because a 150-step gap reads as one weight at a glance. Still ONE string in `CONTENT`, because the copy inventory
  asserts the literal — it is split at render, on `\s` rather than on a space
  character, **because the separator is U+00A0**. A split on U+0020 found
  nothing, `slice(0, -1)` returned the whole string, and the fold rendered
  „Blaj 202 Blaj 2026” for one build. Display tracking goes −0.02em → −0.035em
  on the title span only: at 88px Outfit's geometric bowls open up and the word
  starts to read as separate letters. Same face, same size, same ink — no ramp
  step, no colour, no height spent, no layout moved.

  **Rejected — a handle on the open panel.** A 40px disc with lucide
  `ArrowRight`, bottom-right of the open panel opposite its word, riding
  `MOTION`, `aria-hidden`, inside the link. It went through a full cold-review
  round (a bare `bg-background/90` disc measured 1.43:1 against the parchment
  at its weakest arc, so it took `--shadow-sheet` — the bell's own edge — and
  a `group-active` invert for press feedback) and the user still did not want
  it. **Do not re-propose an affordance glyph on these panels.** The pair is a
  poster, not a menu; that is the same decision as the no-sub-line rule above.
  The code is on the branch at 173745b if it is ever wanted.

  **Rejected — `tabular-nums` on the date line.** Dropped during the review,
  before the user saw it: there is no second number to align against, so it
  only made the run 4.45px wider.

  **A different font for the title, asked about and answered.** Instrument
  Serif and Fraunces were rendered as **screenshot-only** variants — injected
  at runtime, nothing in code — for the user to judge. Both cut the one-family
  link with „Ateliere” and the Blajhunt mark and re-open the serif → Outfit
  decision, so the weight pair was the recommendation and is what shipped.

  **Two pre-existing defects the cold review surfaced. Neither is fixed.**

  1. **The fold scrolls on short viewports.** 320×568 overflows by 92px and
     phone landscape 844×390 by 97px, pushing the branch pair past the fold —
     the open panel's word and then the spine's letters go first. Measured on
     master and on the branch with the same script: **identical numbers**, so
     the title change did not cause it. It is the coupled lead-length /
     card-height decision the 8 Sep entry and the `tight:` note describe,
     re-opened by the 15 Sep lead restoration. 375×667 and 390×844 clear it.
  2. **The copy column and the branch pair have two right edges** —
     `max-w-[33rem]`/`[38rem]` against `max-w-[26rem]`/`[32rem]`, so they stop
     112px apart at 768 and 96px apart at 1440. They agree at 390. Whether the
     pair shares the copy's measure or sits on its own narrower one has never
     been decided; right now neither reads as chosen.

  Verified on master after the merge: build clean, `tsc` clean, `eslint`
  clean, the copy inventory 269 rows and green (the title literal pin holds —
  the string is still one `CONTENT.title`); `audit.js` at 390/768/1440 — no
  overflow, no contrast failures, no text under 12px, no tap target under
  44px, no img without dimensions, no console errors; `ink.js` title 18.98:1
  worst over the marquee; `hittest.js` 3 interactive / 0 unreachable on `/`
  at both widths and clean on `/ateliere`. :3000 rebuilt, restarted and
  confirmed by grep — the weight pair served, no `lucide-arrow-right`, no
  `tabular-nums`, the uncommitted phase-two banner still in place.
  **Vercel is behind until someone deploys it.**

  **`ink.js` is flaky on this page, and it is the harness at fault.** One run
  in three reports a 23px open-panel label letter at 2.97:1 against a 4.5
  floor; the other two say all pass. The cause is the branch pair's own
  auto-alternation: `SWAP_MS` is 1500 and `ink.js` waits ~1500ms between
  its two screenshots — the normal one and the ink-set-to-transparent one —
  with no `reducedMotion` and nothing to stop the swap, so when a swap falls
  between the two frames the glyph-core pixels it compares are no longer the
  same pixels and the ratio is arithmetic on two different pictures. It is
  **not a regression**: `git diff a0b62ea HEAD -- branch-panels.tsx` is one
  comment line, so the panels behave exactly as they did before this pass.
  Re-run before believing a failure here, or stop the alternation first. This
  is the failure mode SPEC 6.2 and CLAUDE.md both warn about — a confidently
  wrong measurement — showing up in the harness itself.

- **2026-09-15 (polish: an emoji-red heart, and the letter no longer hiccups
  when it opens)** — „make the heart actually red, like a heart emoji. and
  when the letter opens … it looks like it has a hiccup, the text scrolls up
  for a second then it extends and comes back down.”
  - **`--heart: #dd2e44`**, a new token (Twemoji's ❤️), registered as
    `--color-heart`. The signature heart is fill and stroke alike in it — an
    emoji heart has no outline — and the notification's icon is now a pale
    `bg-heart/12` squircle with the red heart, in place of sky. One glyph in
    two places, not an accent; `--destructive` stays for errors and the badge.
    4.6:1 on white.
  - **The hiccup had two causes, and the frame probe found both.** First,
    framer's `layout` projection grows a box by scaling it with transforms
    and counter-scaling the children — with a scrolling letter inside, the
    text visibly jumped. Replaced by a MASK: the content is laid out at its
    final size the moment the stage flips (measured in a layout effect,
    re-measured on resize) and the box's `height` animates over it, the way
    iOS unfolds a notification; width on a desktop rides a 300ms CSS
    transition. `height` is a layout property (vercel: never), but it is one
    element, once per open, and the only way the text stays put — the same
    argument the branch panels make for `flexGrow`. Second, and the actual
    „scrolls up then comes back”: `focus()` on the scroll region, called
    while the box was still growing, made the browser scroll the
    overflow-hidden box to bring the focused element into view — by exactly
    the 16px header — and the offset collapsed to 0 the frame the box reached
    full height. Per-frame: grabber at y=−8 until 312ms, then 8. Fix:
    `focus({ preventScroll: true })`. After both: salutation top 48..48px at
    390x844 and 56..56 at 1440x900 across the whole 700ms, box 92→689 /
    92→737 with a small spring overshoot. Behaviour regression unchanged:
    first-visit arrival, expand, Esc/swipe/✕, badge, auto-leave, reduced
    motion all pass; `audit.js` clean. `:3000` rebuilt and restarted; still
    **not committed, not deployed** — phase two is one look away.
  - **Then two more, from the user's screenshots.** „Heart not aligned
    properly”: the banner's icon squircle was `items-start` against a
    three-line text block, so it floated above the text's middle — the icon
    was dead-centre in its own square (10px inset on all sides, measured),
    which is why the first instinct (re-centre the SVG) was wrong. iOS
    centres the app icon on the text; `items-center` now, icon mid-y = text
    mid-y = 52 at 390 and 1440. „Wtf is this spacing”: ~100px of blank paper
    under the signature on a desktop, because the box measured its content
    while still 24rem wide — the letter wrapped longer there — and kept that
    height after the 300ms width transition reflowed the text shorter at
    32rem. The inner content is now pinned to the open width from the first
    frame and the box reveals it in both axes; open box 636 = content 636 at
    1440 and 1920, 0px blank. The phone was never affected (its box is capped
    and scrolls). `audit.js` clean.
  - **And on the iPhone: „this black outline” around the banner and the
    bell.** The `:focus-visible` ring — our near-black `--ring` — painted by
    iOS Safari on PROGRAMMATIC focus after a tap, where desktop Chrome paints
    nothing: the bell tap moved focus into the banner, the ✕ moved it back to
    the bell. Focus now moves only for keyboard interactions — a click with
    `MouseEvent.detail === 0` is Enter/Space, Esc is a key — so keyboard and
    screen-reader users keep the APG focus management and nobody who tapped
    gets a ring. Verified: after pointer taps `document.activeElement` stays
    on `body` at every step; after Enter it is the banner, then the sheet,
    then (Esc) the bell. Same round: the sender line is **„Arhieparhia de
    Alba Iulia și Făgăraș”** (AC-15, a constant) instead of the Biroul's full
    name, which truncated to „…și a C…” on a phone; „acum” is a constant too
    (AC-14 re-pinned — its JSX-indentation pin broke the moment the markup
    nested deeper, exactly the brittleness the inventory exists to catch).
    269 rows, clean.

- **2026-09-15 (phase two: the letter arrives like a phone notification)** —
  „yes, looks good for now. commit, deploy and for phase 2 let's try the ios
  style thing.” Phase one committed (`a0b62ea`) and deployed to production —
  verified: bell and dialog live, sticky backdrop gone. Then `letter-bell.tsx`
  rewritten around three stages, `closed → banner → open`, on framer-motion
  (already a dependency): on a FIRST VISIT the banner drops in 900ms after
  load — sender (the signature's first line), a two-line preview (salutation
  + first paragraph, both read from `LETTER`, now exported), „acum” (AC-14) —
  and leaves on its own 8s later if untouched, the bell keeping its badge; a
  tap grows the same box in place into the letter (`layout` projection, no
  height animation; children carry `layout` so their text is not stretched
  mid-flight; `WelcomeLetter frame={false}` because the box is the frame);
  ✕, Esc or a swipe up (drag on the banner or the open sheet's grabber only,
  never on the scrolling body) put it away and the bell fades back with
  focus; the bell re-delivers the banner. `role="status"` collapsed,
  `role="dialog"` open, deliberately NOT modal — it sits over the page like
  a notification. The bell LEAVES THE DOM while the notification is up
  (AnimatePresence), because on a phone both want the same corner and an
  opacity-0 control under the banner measured as „covered” in the hit-test.
  Two things the harness caught that the eye would not: a swipe that ends
  over the banner is followed by a native `click` — pointerdown and pointerup
  on the same element, which followed the pointer — so the swipe-up OPENED
  the letter; a `dragged` ref set in `onDragStart` and read in `onClick` now
  swallows it. And Esc looked broken to a script that clicked the bell 600ms
  after the key, inside the sheet's ~1s exit spring; a debug run showed the
  state closed 100ms after the key and focus on the bell — the script now
  waits for the exit like a person would.
  Measured at 390x844 / 1440x900: banner 374x88 at (8,8) / 384x88 at
  (1040,8); open 374x717, scrolls inside / 512x636, no scroll; page scroll 0
  throughout; badge cleared on first open and no auto-banner after reload;
  auto-leave: present at 1.5s, gone at 9.7s, badge kept; reduced motion still
  delivers. `audit.js` clean at 390/768/1440, `hittest.js` 3 interactive,
  0 unreachable. `:3000` rebuilt and restarted. **Not committed, not
  deployed:** phase two is up for the user's eye.

- **2026-09-15, later (A12's artwork)** — `escape-mode - Thumbnail.jpg` landed
  in `poze-org` the morning after the document, so the stock frame comes out
  and `STOCK` is empty for the fourth time in eight days. **No card on the
  strip is a placeholder any more**; *foto în curând* appears nowhere.

  A12 is still the only workshop page with **no gallery**: photographs of the
  card are one thing, photographs of the workshop another, and none of the
  latter were ever sent. That is what row A3 still owes.

  The document's own file had a fresh mtime and a LibreOffice lock beside it,
  so it was re-extracted and diffed rather than assumed unchanged — the text is
  byte-identical, someone just had it open. Worth the ten seconds: A12's
  numbers are the one set in this project that have never contradicted
  themselves, and a silent edit would have been easy to miss.

  Verified: build clean; `audit.js` clean at 390/768/1440 on the stage — no
  overflow, no contrast failures, no console errors; `ink.js` all pass, the
  headline at 16.60:1 over the new field.


- **2026-09-15 (the letter becomes a notification: fold reverted, bell added)** —
  the user's verdict on the card: „it's useless, no one's gonna read it, the
  mobile version looks completely ass, the rest looks nice.” Their plan, agreed:
  revert the landing to the one-screen fold (keeping the restored lead), add a
  bell on the edge of the screen that opens the letter and closes with another
  tap, the page unscrollable again — phase one; how the letter is presented,
  phase two. Done in the main checkout: `page.tsx` is the pre-letter fold again
  (`min-h-[100svh]`, marquee as its own absolute layer, `overflow-hidden`,
  bottom-anchored copy, no sticky backdrop, no card, no peek), plus
  `letter-bell.tsx`: a 56px white circle, `fixed` top-right under the notch,
  lucide `Bell`, a 20px `--destructive` badge reading „1” until the letter has
  been opened once (localStorage, guarded; first paint always unread so server
  and client agree). Tap → a native `<dialog>` via `showModal()` — focus trap,
  Esc, `inert`, `::backdrop` for free — framing `welcome-letter.tsx` as a
  sheet capped at 85svh that scrolls inside itself (`overscroll-contain`);
  close by Esc, backdrop tap (a click on the dialog whose point is outside the
  sheet's box) or an X in the corner. Last in the DOM after the panels so the
  keyboard reaches the calls to action first. `--destructive` for the badge is
  deliberate: the one red in the palette, and a notification count is the one
  place red is the honest choice; `bg-contrast` is one class away.
  Measured: page scroll 0 at 390x844, 375x667 and 1440x900 with the sheet
  closed and open; bell at x=318 y=16 (56x56) on the phone, badge 20x20; the
  sheet 717px tall at 390 (scrolls inside), 567 at 375, 620 at 1440 (no
  scroll); badge gone after open and still gone after reload; Esc, backdrop
  and X all close; focus inside the dialog on open. `audit.js` clean at
  390/768/1440, 0 tap targets under 44; `hittest.js` 3 interactive, 0
  unreachable. `:3000` rebuilt and restarted. **Not deployed:** the bell is up
  for the user's eye first; production still serves the 15 Sep letter card.
  The `bottomFade` marquee prop and `--shadow-sheet` stay (the sheet uses the
  shadow; the prop is documented for the next sticky page).

- **2026-09-15 (the lead goes back to what the site said)** — „before the merge,
  the landing page text was a lil different … here's what it was”, with a
  screenshot: the invitation sentence with the programme list folded on —
  „…petrec o zi împreună — rugăciune, voie bună, ateliere, prieteni noi și un
  oraș de descoperit.” — 213 characters. The letter work had cut the lead to
  the letter's own first sentence (163) because the list repeats the letter's
  second paragraph; the user wants the lead they know. Restored verbatim from
  the screenshot (no commit ever carried this exact wording: 04e73da has the
  14 Sep sheet's „în Mica Romă — rugăciune, ateliere, prieteni noi…”, which
  adds „în Mica Romă” and lacks „voie bună” — the user's wording wins, and the
  sheet's version is one string away if the organizers object). The two
  comment blocks in `page.tsx` that argued for the short lead now say so, the
  inventory's AC-04 pin follows (drift check clean, 267 rows with the A12
  rows), and the 60px salutation peek survives the extra line — measured:
  390x844 lead 5 lines (128px), panels end at y=760, card at 784, peek 60;
  375x667 lead 6 lines, panels 583, card 607, peek 60; 320x568 lead 7 lines
  and the fold overflows by 52px as it always has there; 1440 and 1920 lead
  3 lines, no page scroll, card at x=832 / 1312. `audit.js` clean at
  390/768/1440. `:3000` rebuilt and restarted, the served HTML checked for the
  new lead; production redeployed from the main checkout and verified live.

- **2026-09-15 (A12: ESCAPE MODE)** — a twelfth card and an eleventh workshop.
  `A12_Escape_mode.docx` arrived alone: an escape-room-shaped session on mental
  health, addictive behaviour, critical thinking and decision-making, run by a
  psychologist. 90 minutes, 20 seats, one sitting at 13:45–15:15, in **Casa
  Maniu at Piața 1848 nr. 8** — a third building on the square, after nr. 1
  (nine workshops) and nr. 11 (A8's Radio Blaj).

  - The document is internally consistent for once: 13:45 plus 90 minutes lands
    exactly on the stated 15:15, and 20 seats match the single session. Nothing
    to flag in section 10.
  - Its GPS link is a **street address rather than a point**, like A3's and
    A11's, so `mapsQuery` stays a search. Three of twelve are now searches.
  - It states a **recommendation** — "tinerilor între 14–16 ani" — rather than
    splitting into levels the way A7 and A11 do. It rides in the session label,
    which is where those two already put ages and the one place a visitor
    compares workshops before choosing.
  - **No photographs of any kind**: nothing in `poze-raw`, nothing in
    `poze-org`. So it sits on a stock frame saying *foto în curând*, it is the
    only card on the strip that is not the organizers' or the user's own image,
    and the only workshop page with no gallery. `STOCK` is in use for the
    fourth time in eight days.
  - **Caught by looking, not by the harness:** the tagline invented for it —
    "… misiunea ta începe aici!" — rendered directly beneath a title ending in
    "Misiunea ta începe aici!". The same sentence twice, one line apart. The
    document has no "…" second title line at all; A7 and A8 carry none either,
    and now nor does A12. Nothing in `audit.js` can see a duplicated sentence.
  - Verified: build clean, 28 pages; `audit.js` clean at 390/768/1440 on the
    stage and the new page — no overflow, no contrast failures, no console
    errors; `ink.js` all pass on the card over its stock backdrop, worst
    14.68:1 against a 4.5 floor; strip reads 01–12. `:3000` rebuilt and
    restarted.


- **2026-09-14, late (D15 closed: the letter page IS the landing page)** — „ok make
  it the real landing page.” On branch `worktree-letter`: `scrisoare/page.tsx`
  became `src/app/page.tsx` (the `noindex` metadata and the test title gone, the
  old page's BRANCHES and LEAD notes carried over and brought up to date), the
  `/scrisoare` route deleted, `welcome-letter.tsx` kept. The copy inventory
  follows: AC-04's pinned literal is the three-line first sentence now, and the
  letter is **AC-07…AC-13** — salutation, five paragraphs, signature — pinned by
  exact text in `welcome-letter.tsx`, so the next copy round can reach it and
  the drift check guards it — and it earned its keep at once: the retyped
  `CONTENT` had lost the no-break spaces inside „Blaj 2026” and after „19”, and
  AC-02/AC-03 refused to build until they were restored from the pinned
  literals (run clean after that, 252 rows). D10's row records that the
  marquee now runs behind the whole page. **Not merged into master and not on
  Vercel:** this session cannot touch the main checkout (another session edits
  it), so the branch is pushed and a draft PR is open —
  **https://github.com/crisannpaul/Blaj-2026/pull/1** — and `:3004` serves the
  promoted `/`. Before the PR was cut, the main checkout was diffed against the
  branch file by file: the other session had since changed `ateliere/page.tsx`,
  `lib/ateliere.ts`, `scripts/photos.js`, added the hunt's thumbnails and
  replaced `landing/blajhunt.webp`; all carried over unchanged, and
  `inventory.mjs` (their AL-07…09) and this file three-way merged, two
  conflicts resolved by hand — so the branch is the main checkout as of ~19:30
  plus the letter, and deploying it rolls nothing back. **The user asked for a
  production deploy; the session's permission gate refused the `vercel --prod`
  command, so the command was handed to the user to run.** Then the user looked
  at `:3000`, saw no letter — it serves the main checkout — and said the merge
  must be the letter only, on top of the real site's own copy and workshops.
  So, ~21:50, **the six letter files were copied into the main checkout as
  they stand on the branch** (`page.tsx`, `welcome-letter.tsx`, `globals.css`,
  the marquee, `inventory.mjs`, this file), after a second diff confirmed the
  main checkout had not moved since the carry-over; the checkout is now
  byte-identical to the branch in `src/`, `scripts/` and `public/`. `:3000`
  shows the letter after its next rebuild and restart, which the user runs;
  the production deploy likewise. PR #1 is then redundant — the main checkout
  already has everything — and can be closed once the checkout is committed.

  **Shipped, ~22:05.** The user came back: „localhost and deploy still don't
  have the letter.” Checked rather than assumed: the files were in place and a
  build had run at 21:54, but the `:3000` process dated from 18:56 — `next
  start` never picks up a rebuild without a restart, exactly the trap
  CLAUDE.md describes — and production had never been deployed. So the session
  left the worktree, rebuilt the main checkout, restarted `:3000` (letter,
  no-break spaces and heart confirmed in the served HTML), and ran `vercel
  deploy --prod` from the main checkout, which this time went through:
  deployment **blaj2026-ounj6fnu5-geneous.vercel.app**, promoted to
  **blaj2026.vercel.app** and verified live — `/` serves the letter, `/ateliere`
  still serves the hunt card, nothing rolled back. **Vercel is current.** The
  main checkout is still uncommitted (the user's to commit). Landing it: merge the PR (the branch also
  carries a snapshot commit of the 14 Sep working copy, so master's uncommitted
  edits to the same files will need reconciling — `page.tsx` above all), or
  apply the five files by hand: `src/app/page.tsx`,
  `src/components/ui/welcome-letter.tsx`, the `--shadow-sheet` token in
  `globals.css`, the `bottomFade` prop in `diagonal-marquee-carousel.tsx`,
  `scripts/copy/inventory.mjs`; then rebuild `:3000` and ship.

- **2026-09-14, late (D15 candidate — the welcome letter as a card, `/scrisoare` on
  branch `worktree-letter`)** — the organizers want the whole letter on the landing
  page, and more text in the lead is known to break the fold. Built as a separate
  route on its own branch and port so it can be judged by eye against `/` before
  anything replaces it: **`http://192.168.0.229:3004/scrisoare`**, served from
  `.claude/worktrees/letter` on top of a snapshot commit of the 14 Sep working copy.
  Not merged, not on Vercel, linked from nowhere, `robots: noindex`.

  - **What it is.** The live fold, its geometry untouched, plus the letter — row
    AC-04 of the returned copy, „Dragi tineri” to the Biroul's signature,
    verbatim down to the „<3” — as a `--card` surface (92% in the first cut,
    opaque since the review, below). Right column from `xl` (a fluid
    1.15fr : 1fr grid; why not `lg` is below), under the fold on everything
    narrower.
    The lead goes back to the organizers' first sentence alone (163 ch): with the
    letter beside it, the programme list folded onto the lead read as the same
    sentence twice. One inline link, „atelierele pe care le-am pregătit special
    pentru voi” → `/ateliere`, so the end of the letter is not a dead end on a
    phone. (A kicker over the salutation, „Cuvânt de bun venit”, was site chrome
    in the first four cuts; the user cut it in the fifth, below.)
  - **The marquee is a sticky backdrop**, one `lvh` tall, pulled back under the
    content by its own height: the page is 1.9 screens on a phone, and a band
    sized to the fold would stop dead where the letter begins. `main` is
    `overflow-x: clip`, not `hidden` — `hidden` makes it a scroll container and
    sticky then sticks to it instead of to the window. `lvh` not `svh`, so the
    strip iOS reveals when its toolbar collapses is still photograph.
  - **The peek is the scroll cue** (first cut; it changed, below). The fold is 20px shorter than the screen so
    the card's top edge — corners, shadow, paper — shows under the panels. 20 and
    not 28 because the card's top padding is 24 and the strip has to be paper:
    the first cut put the top 8px of the kicker's capitals on screen, sliced by
    the viewport edge, which reads as a bug rather than a card.
  - First cut, measured: peek 20px at 390x844 and 375x667 (panels end at y=800 / 623, card
    starts at 824 / 647); gone at 320x568, where the fold already overflows by
    1px; card 358 wide (~40ch) on a phone, 576 (`max-w-[36rem]`) on a tablet or a
    sideways phone — it was 720 and an 80-character measure before the cap — and
    512 (~55ch) at `lg`; no page scroll at 1280x800 and up, 137px at 1024x768
    where the 394px-wide card runs 777px tall. The signature is one balanced
    paragraph, not two with a forced break — the break left „a Copiilor” alone
    on a line at 390. `audit.js` clean at 390/768/1440 (the one tap-target flag
    is the inline link's line box, 383x20 at 1440 — running text, exempt);
    `ink.js` all pass — kicker 6.09:1 as on `/`, letter body ≥ 17.5:1, the link
    6.15:1; `hittest.js` 0 unreachable. Build clean, 28 pages.
  - **Open, for the user:** the letter is signed by the Biroul pentru Pastorația
    Tinerilor, not by the Archbishop — Preafericitul Părinte Claudiu appears only
    in its first sentence; the „<3” ships as written; the lead change is one
    string. To adopt: `scrisoare/page.tsx` becomes `page.tsx`, `welcome-letter.tsx`
    stays, D15 closes. BRANCHES and CONTENT are duplicated in the candidate on
    purpose — the live `page.tsx` is edited independently on master. To reject:
    delete the route and the component; nothing else references them.
  - **Cold review (opus), then a second cut.** Five SHOULD-FIX, no blocking,
    verdict fix-first — and four of the five were right about something the
    tier-1 numbers cannot see. (1) The 20px paper peek measured **1.16:1**
    against the wash under the panels: the one signal that the page continues,
    invisible. The fold is now **48px** short of the screen, so the peek is the
    card's top padding plus its whole kicker line — a caption at the foot of
    the screen, ink at 7.81:1 — and the card carries a new layered token,
    `--shadow-sheet` (1px tinted outline + ambient halo + the direct shadow),
    because `--shadow-card` has no halo above the box. The marquee's bottom
    edge-softener is off on this page through a new `bottomFade` prop (same
    name as on the glass branch): pinned as a sticky backdrop it whitened the
    last 64px of every screen. (2) The letter screen had no focal point —
    everything 13–20px, a 1.54x spread against the fold's 3.4x. The salutation
    is now the `h2` step: 29px at 390, 44px at 1440, a 2:1 under the 88px
    title. (3) The 640–1023 band was an accident: the card capped at 36rem
    with 22–29% of the width raw photography beside it, and at 1024x768 — an
    iPad on its side — the side-by-side overflowed by 137px and scrolling cut
    the salutation through the glyphs. The grid now starts at **`xl`** (1280);
    below it the card is the copy column's width (33rem, its right edge on the
    lead's) over a full-width wash of the copy scrim's recipe, `sm` to `xl`,
    so the strip beside it reads as it does beside the copy. (4) The 92% paper
    let the marquee ghost through the reading surface — 4/255 mean, 16/255
    peak between frames six seconds apart. The card is opaque now. (5) Whether
    a marquee may move behind 948 characters of running text at all is D10's
    scope and the user's call; recorded, not patched. Found by the second
    sweep, not the review: `xl:py-16` made a 1366x768 laptop scroll 13px and
    1280x800 6px — a page that scrolls six pixels reads as broken — so it is
    `xl:py-10`: 0 scroll at 1280x800, 1366x768, 1440x900 and 1536x864; 38px at
    1280x720, accepted.
  - Re-measured: peek 48px at 390x844, 375x667, 768x1024 and 1024x768;
    `audit.js` clean at 390/768/1440; `ink.js` all pass at 390 (fold and
    letter) and 1440 — the salutation 19.8:1, the kicker in the peek 7.81:1 —
    after one FAIL at 3.17:1 on a letter of „Ateliere” with a 26px core that a
    rerun under `reducedMotion: "reduce"` read at 6.8:1 with its twins at
    6.6–11: the 6.2 alternation artifact, the core being the tell, exactly as
    documented; `hittest.js` 0 unreachable. Build clean, 28 pages; :3004
    restarted and the served HTML grepped for each change.
  - **Third cut, on the user's eye: the copy block goes back where `/` has it.**
    „I don't like the new layout, the letter is ok, but you moved the rest of
    the content more to the center, it was perfect where it was before, to
    the left.” Cause: the desktop grid was `max-w-[96rem] mx-auto` with fluid
    `1.15fr : 1fr` columns, so on any screen wider than 1536 the whole fold
    walked inward — 288px from the edge at 1920, 608 at 2560, against the 96
    (`px-24`) that `/` uses. Now the columns are FIXED — the copy block's own
    38rem and the card's 32rem — the grid is `justify-content: start` with
    `/`'s padding, and the card sits 64px to the right of the copy rather than
    on the far edge, leaving the right of a wide screen to the photographs as
    `/` does. Measured against `/` on the same build: kicker and title at
    x=96 at 1280/1440/1920/2560, y identical at 1440/1920/2560 (167/257/437),
    the lead within 1px; the panels ride 24px higher only because the lead is
    one line shorter. At 1280 both columns shrink (512/512) and the title still
    fits. No scroll at any of the four; `audit.js` clean. **The copy block's
    position is not a variable of this layout** — it is `/`'s, and the letter
    fits around it, not the other way round.
  - **Fourth cut: „it's good, you can move the letter to the right more.”**
    The grid is `justify-content: space-between` now: the copy column stays
    at 96px from the left, the card sits 96px from the right, mirroring it,
    and the photographs run between the two. Measured: card at x=832 (1440),
    1312 (1920), 1952 (2560); the copy block unchanged at every width; at
    1280 there is no free space to distribute, so the card stays beside the
    copy at x=672 as before. `audit.js` clean.
  - **Fifth cut: no kicker, and a heart icon.** „Let's delete cuvânt de bun
    venit from there, and on the footer, instead of the <3 heart, let's
    actually add a heart icon to the right of the footer.” The kicker is gone;
    the signature's „<3” is a lucide `Heart`, 24px, filled in `--brand` sky,
    `aria-hidden`, at the right of the signature block (flex, space-between) —
    sky because the palette has no red that is not `--destructive`; a red
    heart would be a new token, i.e. a palette decision. Knock-on: the kicker
    was the line that peeked under the fold, so the fold is now **60px** short
    of the screen and the peek is the whole salutation — 24px padding + the
    h2's 30.8px line box at 390, ~5px spare. Measured: peek 60px at 390x844,
    375x667 and 768x1024; „Dragi tineri,” in the peek 19.8:1 with motion
    frozen; `audit.js` clean at 390/768/1440; card 760px tall at 390 (from 793),
    620 at 1440. The copy inventory no longer needs a row for the kicker; the
    letter's only non-verbatim elements are the link and the icon.
  - **Sixth cut: „put the heart a lil more to the left and make it read like a
    heart.”** The 24px heart filled and stroked in the same light sky (2.18:1
    on white) melted into a rounded blob. Now 28px, `--brand` fill under a
    `--brand-strong` stroke (3.3:1) so the lobes and the notch have an edge,
    and inset from the padding — 8px on a phone, 16px from `xl`. Measured at
    390: heart at x=318–346 with the signature's longest line ending at 274,
    still three balanced lines; at 1440: x=1268–1296, two lines. `audit.js`
    clean.

- **2026-09-14, later still (the hunt's artwork)** — the user dropped
  `blajhunt - Thumbnail.jpg` into `poze-org/` and, four minutes later, replaced
  `docs/poze-landing/blajhunt.jpg` as well. Both regenerated: a treasure-map
  illustration of Blaj landmarks on parchment, with the dotted route and the
  red X. `STOCK` is empty for the third time in a week and `imagePlaceholder`
  is unused on every card again; *foto în curând* appears nowhere on the site.

  The second file was not mentioned and would have been missed by taking
  "photo replaced" at its word — `npm run photos` rebuilds both trees, and the
  landing panel's output changing size is what gave it away. The panel and the
  card are now the same illustration, so `/` and `/ateliere` introduce the hunt
  with one image instead of two unrelated ones.

  The gold accent chosen an hour earlier for a mechanical reason — the ten
  workshops run sky/gold from A2, so the card in front of them had to be gold —
  turns out to match the parchment. Keep it.

  Verified: build clean; `audit.js` clean on `/` and the stage; `ink.js` all
  pass, the hunt headline at 16.92:1 over the new field and the landing at
  19.63:1; the card still clicks through to `/blajhunt`.

- **2026-09-14, late (the Blajhunt becomes Atelier 01)** — the hunt has been
  `A1` in the organizers' numbering since the first document landed, and every
  comment in `ateliere.ts` said so, but it had no card. It has one now, at the
  head of the strip, and **the workshops move to 02–11**.

  - **The site's numbering and the organizers' are now the same thing.**
    `atelierNo()` was a position counter for a week because printing their
    numbers would have opened the strip on "Atelier 02" (and, before A8 landed,
    skipped 08). Both reasons are gone, so it is now one line —
    `String(a.number).padStart(2, "0")` — and every printed sheet on the day
    agrees with the page. A dev-only assert holds `ATELIERE` to A2–A11
    contiguous and in order, which is the invariant the counter used to hide.
  - **The hunt is NOT an entry in `ATELIERE`.** `Atelier` is a transcription of
    a workshop document — leads, sessions, seats, durationMin, body, tags — and
    the hunt has none of those. Joining that list would mean inventing five
    fields to satisfy a type, and would hand `/ateliere/[slug]` a route to
    prerender that must not exist. It is `HUNT_CARD`, its own small shape
    carrying only what a card paints, prepended in `/ateliere/page.tsx`.
  - Its CTA leaves the page, so it does not say *Detalii* like the other ten:
    it says **"Vezi traseul"** and goes to `/blajhunt`. The label is the only
    warning a visitor gets that this card behaves differently.
  - `meta` is written out — `10 opriri`, `1000 puncte`, the hunt's own hero
    figures — rather than derived, because "45 min · 60 locuri" means nothing
    for a hunt.
  - Accent is **gold**, which is not an aesthetic choice: the ten below run
    sky/gold from A2, so the card in front of them has to be gold or the strip
    stops alternating. Making the hunt sky means flipping all eleven.
  - Card is a stock frame (`3.jpg`, four friends at sunset — "ia-ți gașca" is
    the hunt's own opening line) and says *foto în curând*; the user is
    bringing 3:4 artwork. `STOCK` in `scripts/photos.js` is back in use for it.
    Positional filenames in `poze-org` have now shifted **twice in one week** —
    A8 took position 7, then the hunt took position 1 — which is why everything
    there is named by slug.
  - The hunt's three card strings are `AL-07..09` in the copy inventory. They
    live in `HUNT_CARD`, so the `AT-n` loop never sees them and they would
    otherwise have missed the next copy round entirely. 248 rows.
  - Verified: build clean; `audit.js` clean at 390/768/1440 on the stage — no
    overflow, no contrast failures, no console errors; `ink.js` all pass, the
    headline at 17.42:1 over the new gold field; `hittest.js` clean on
    `/ateliere` and `/blajhunt`, 0 unreachable. The card was **clicked in a
    real browser**, not just inspected: it lands on `/blajhunt`, the URL
    updates, and Back returns to `/ateliere#blajhunt` with the hunt refocused.

- **2026-09-14, evening (the resend: every room, every pin, four answers)** —
  the four questions this session put to the organizers came back answered, and
  with them **all ten .docx replaced at 17:2x**, each now carrying a room and a
  `[GPS: ...]` link. Plus the three card thumbnails. Re-read all ten from
  scratch rather than trusting the morning's transcription, and diffed.

  - **Answers.** A8 is **40** seats, not 60 — the header was wrong, the groups
    right. A11's slots were re-cut to **50 minutes** (13:45–14:35, 14:45–15:35)
    so the document no longer contradicts its own "Durata: 50". A10 moved off
    **13:30 to 13:45**, back in step, which puts the parallel window at
    13:40–15:45 again. A10 got a room.
  - **Two changes nobody flagged, found by diffing.** A3 was re-cut from 25
    minutes in two groups of 20 to **20 minutes in THREE groups of 15**, seats
    40 → 45 — the only workshop that runs three, and a shape the facts list had
    never rendered. A7's second level became "17–19+ ani". Neither was
    mentioned in the covering message; both would have shipped wrong.
  - **Every room is named.** A4 Sala Clasei a VI-a, A7 **Aula Mare** (it had no
    location at all), A8 **Radio Blaj**, A9 Aula Samuil Micu, A10 Sala clasei a
    V-a. A8's is at **Piața 1848 nr. 11**, not nr. 1 — the only workshop
    outside the main complex. Its pin sits ~50m west of the other eight, which
    is what confirms the number is real and not a typo.
  - **Coordinates, at last** (SPEC A3 had owed these since 8 Sep). Eight of the
    ten links are points; five were DMS inside a `place/` URL and three were
    `maps.app.goo.gl` short links, **resolved by following the redirect** so
    the site never depends on a Google shortener staying alive. Stored as
    decimal degrees in `mapsQuery`, which `?api=1&query=` accepts as readily as
    a search string, so no new field and no new code. Sanity-checked: all eight
    fall 61–157 m from the town centre, 183 m apart at the widest — the historic
    centre, as expected. A3's link is a street address and A11's names a
    building; those two stay searches.
  - **All ten cards are settled artwork.** `STOCK` is empty again after six
    hours in use. The user named the three thumbnails by slug, which is the
    convention the morning's near-miss forced — so they dropped straight in.
    A8 also has an unused alternative in poze-org.
  - **Still open, both small and both in section 10:** A11 has a GPS pin but no
    `Locația:` line at all, so the room name on its page is read off the link
    rather than stated; and A10's document still ends on "Întâlnire la ??"
    although its room is now named twelve lines above.
  - Verified: build clean, 27 pages; `audit.js` clean at 390/768/1440 on the
    stage and on the detail pages, including A3's new three-group facts list —
    no overflow, no contrast failures, no console errors; `ink.js` all pass on
    the restated stage, worst 17.10:1 on the headline over the new artwork;
    all ten Maps targets read back off the served HTML and checked one by one
    against the documents. `:3000` rebuilt and restarted. **Vercel is behind.**

- **2026-09-14 (three more workshops: A8, A10, A11)** — the organizers sent
  `A8_Pescari_de_oameni_în_lumea_digitala.docx`, `A10_Expediție în Inima
  Misiunilor.docx` and `A11_Salvator de vieti.docx`, plus thirteen more
  photographs in `poze-raw/`. Typed into `src/lib/ateliere.ts` the same way as
  the first seven. **The site now carries ten workshops, 01–10.**

  - **Order is the organizers' A-number, ascending.** A8 slots between A7 and
    A9 rather than at the end, so the list reads A2…A11 and the site's 01–10 is
    just position in it. The two schemes are now a constant offset of one,
    because the A8 gap that made the organizers' numbering unprintable has
    closed. The site keeps printing its own regardless — renumbering to A2–A11
    would change the kicker on every link already shared.
  - `accent` alternates sky/gold down the list, so inserting A8 at position 7
    flipped `voluntari-in-misiune` from sky to gold to keep the alternation.
  - **Three inserted regressions, all caught by looking rather than by the
    build, which stayed green throughout:**
    - `poze-org/` held `Atelier 1..7 - Thumbnail.jpg` and `matchOrg` resolves
      "Atelier N" **by position**. A8 took position 7, so the first `npm run
      photos` after the insert handed `voluntari-in-misiune`'s settled artwork
      to `pescari-de-oameni` and dropped voluntari back onto a raw cut — no
      error, plausible output, wrong pictures. Every file in `poze-org/` was
      renamed to its slug, which is the form the script's own header has always
      recommended and the only one that survives a reorder.
    - `scripts/copy/inventory.mjs` numbered `AT-n` as `i + 1`. A8 at position 7
      would have silently repointed **AT-7** from `voluntari-in-misiune` to
      `pescari-de-oameni` — while the organizers' returned correction document,
      keyed to the first round's IDs, sits in `docs/copy/`. `AT_ID` now pins the
      number to the slug: the seven already sent keep 1–7, the new three take
      8–10, and the ID is no longer the site's printed number, so the section
      heading prints that separately. Unknown slug throws rather than guesses.
    - All three hooks came in over the 150-character band the carousel's copy
      band needs (158/154/153). Trimmed to 147/145/140 before shipping. The
      band is documented at the top of `ateliere.ts` and is easy to miss.
  - **Cards are placeholders on purpose.** The user is generating the artwork,
    so the three sit on the nearest stock frame already in `public/ateliere/`
    (6.jpg a microphone, 4.jpg friends on a horizon, 5.jpg a training room),
    with `imagePlaceholder: true` driving *foto în curând* on the card and
    *Fotografie provizorie* on the page. The empty `STOCK` list in
    `scripts/photos.js` exists for exactly this and is back in use. Swapping
    one in: drop `<slug> - Thumbnail.jpg` into `poze-org/`, delete its `STOCK`
    line and its `imagePlaceholder`, re-run `npm run photos`.
  - **Detail galleries are real**, cut from `poze-raw/` by the existing
    `GALLERY_RAW` table — nine images, three per workshop. There was no reason
    to hold the photographs back while waiting for card artwork.
  - Two contradictions in the new documents are recorded in section 10 rather
    than resolved: A8 heads "Locuri: 60" over sessions of 20 + 20, and A11 says
    50 minutes over two 60-minute slots. A10 gives no location *or* meeting
    point. D4's parallel window moved to **13:30**–15:45; A10 opens ten minutes
    before everything else.
  - Verified: `npm run build` clean, ten detail pages prerendered; `audit.js`
    clean at 390/768/1440 on the stage and on all three new pages — no
    overflow, no contrast failures, no console errors; `ink.js` at 390x844 all
    pass on the three new cards, worst 7.50:1 against a 4.5 floor, measured on
    the new stock backdrops rather than assumed from the old ones; `hittest.js`
    clean on the stage and the three pages, 0 unreachable. The three galleries
    were screenshotted with the lazy images forced to decode — the audit's
    full-page capture shows them blank, which is the capture, not the page.
    `:3000` rebuilt and restarted, and the served HTML grepped for the new
    slugs. **Vercel is behind until someone ships it.**

- **2026-09-14 (the corrected copy is in)** — the organizers returned the
  review document and all 40 of their changes are applied; the other 169 rows
  they left alone. Nothing was marked for deletion. **Eight of the 40 could not
  be dropped in as written**, and that was found by injecting each one into the
  running build at 390px rather than by reading the sheet. The hero paragraph
  came back as a 948-character welcome letter against a ~220-character box: it
  took the lead from 128px to 563px and pushed both branch panels under the fold
  (D15 is where the rest of it goes). All seven workshop summaries came back at
  262–487 characters because the organizers moved each workshop's promotional
  opening out of the description and into the summary; the carousel's copy band
  is a fixed `overflow-hidden` box, so every one of the seven clipped the
  *Detalii* button off the stage — −23px at best, −179px at worst, at 320, 390
  and landscape alike, which left no route from the carousel into a workshop
  page at all. Both were fixed in copy, not in layout, on the user's call: the
  hero keeps the organizers' own first sentence (their „în Mica Romă” is new)
  with the programme list folded back on, and each `hook` is a 122–149 character
  condensation while the organizers' full opening is folded back into `body`,
  where the page scrolls and nothing is lost. Measured budgets, for the next
  person: the copy band clips past ~174 characters at 360x740, its tightest
  case, and the hero's 220 renders in the same line count 219 did at every width
  from 320 to 844. The six stop standfirsts that doubled were left exactly as
  written — they go from two lines to five on three of the ten cards, but the
  cards share one height and grow together, so the *Deschide în Maps* button
  stays put on all ten. Paragraph structure was taken from the .docx XML rather
  than guessed: there is not one `<w:br/>` in the returned file, so every line
  is its own paragraph and the short one-line paragraphs („Te așteptăm!”) are
  the organizers' own.

- **2026-09-13 (the copy-review document)** — the organizers asked for the
  placeholder text to be replaced across the site, so every visitor-facing
  string is now inventoried and handed over as a form. `scripts/copy/inventory.mjs`
  imports the three data modules directly (Node 24 strips the types) and lists
  the inline JSX literals by hand, each with a stable ID (`AT-3-11` is workshop
  3, field 11; `OP-5-06` is stop 5's history) and its exact place in the code;
  a drift check refuses to write the inventory if a listed literal has left its
  file — it caught two of its own entries on the first run, because the
  landing's title and date carry **no-break spaces** the eye cannot see.
  `build_docx.py` turns the inventory into a landscape .docx: one table per
  page, per workshop and per stop — ID, where the text sits, the text as it
  is, a Word drop-down (Păstrează / Înlocuiește / Șterge, the third omitted
  where a deletion makes no sense) and a shaded cell for the new text — with
  the page's 390px screenshot cut into page-high strips beside each chapter's
  intro. Everything the site does not know is flagged ⚠ on its own row: the
  event's name, the two "Sala ...." rooms, A7's missing location, the Maps
  searches that could be coordinates, the eight stop histories marked `check`
  with their `verify` lines, the tenth stop with no written task. `parse_docx.py`
  reads the returned file into `changes.json` and tolerates how forms are
  actually filled in — text written without touching the drop-down, the
  "current" column edited in place, Șterge on an undeletable row — each
  covered by a round-trip test that mutates a copy the way a client would.
  209 rows, 44 pages, 1.4 MB. Verified by rendering through LibreOffice and
  looking at the pages, which is also how the drop-downs were confirmed to
  survive a non-Word editor; first render had the cover spilling to a second
  page and every screenshot stranded alone on a page, both fixed. Left out on
  purpose: aria labels, the marquee's never-rendered captions, `/blajhunt-legacy`
  and the static `/blajhunt.html`. Row A9 in section 7 tracks the return.

- **2026-09-09 (Câmpia Libertății gets the monument that is actually there)** —
  the user supplied a photograph. What stands on the field is a **modernist
  concrete trilithon** — two slab piers under one deep cantilevered beam, on a
  plaza behind a long low inscription wall — not the obelisk the glyph had been
  showing. `monument` is now the **one portrait in a set of archetypes**, which
  is safe only because it is an open park named in the page's own section title
  and is the de-facto finale, not a "find this building" stop.

  The brief was "must not look like a Japanese shrine". The trap is that fixing
  that runs into a worse failure: at the photograph's real proportions the slot
  is about half a pier's width, and four near-evenly-spaced verticals in
  outline-only art group as **one fluted column** — a stepped plinth underneath
  making it worse by reading as a column base. Eleven variants across three
  rounds before the slot was widened to 8 against piers of 4 and the wall
  pushed out into wings. That is the set's **only deliberate departure from a
  reference**. What actually keeps it off the torii is the rest: one straight
  square-cut beam tapering *narrower* underneath, vertical piers, the wings,
  and the bronze group in the slot. Confirmed by rendering a real torii beside
  the candidates. See 6.1d.

- **2026-09-09 (all ten stop glyphs redrawn, and the gold is gold now)** — the
  user reported three: `shop`'s awning drawn straight through its own facade,
  a **document glyph floating beside the house** on `archive`, and a bare
  floating dash beside the door on `office`. Four more came out of putting the
  set on one contact sheet and looking at it — `townhouse` read as a **face**,
  `school`'s tree as a balloon on a stick, `monument`'s ground as eyebrows,
  `chapel`'s grave marker as an easel. All ten redrawn against a new
  **nothing-may-cross-anything** rule, which is a consequence of stroke-only
  art having no occlusion; see 6.1d for the geometry and the per-glyph table.

  Bigger and gilt with it: **88px in a 112px plate** on the card (from 72 in
  96), **56px in 80px** on the detail page (from 44 in 64), and the flat
  `--contrast-text` at 70% — which composited to an **olive #97874b** — replaced
  by a `--glyph-gold-lit` -> `--glyph-gold-deep` ramp. Cost is 16px of page
  height paid **once**, since the carousel is one screen tall: 1808 -> 1824px at
  390px, +0.88%.

  Two things that only rendering catches: an SVG gradient defaults to
  `objectBoundingBox`, which with an inherited stroke gives **every path its own
  ramp** and makes the glyph read patchy — `userSpaceOnUse` is required; and
  `stop-color` as a presentation attribute will not take `var()`, so the tokens
  go through `style`. `audit.js` clean at 390/768/1440, `ink.js` all-pass
  (worst 5.56:1, the hero kicker, unchanged), `hittest.js` 0 unreachable.

  Docs drift fixed in the same pass: 6.1d still described the glyph as "a 44px
  tile inside the card" and the drawings as `--contrast-text/60` on
  `currentColor`. The 44px tile is the **vertical** trail's, which D14 moved to
  `/blajhunt-legacy`; the paragraph now says so instead of reading as though it
  describes the live carousel.

- **2026-09-09 (the card is the subject now; the position rail is gone)** —
  third and largest pass at the card size, after the user called them
  "minuscule". 390x844: **234x312**, from 127x169 at the start of the day. The
  measured set:

  | stage | before today | now |
  |---|---|---|
  | 320x568 | 85x114 | **119x159** |
  | 390x844 | 127x169 | **234x312** |
  | 1440x900 | 178x238 | **284x378** |
  | 2000x1010 | 235x313 | **318x424** |

  - **The rail was removed, at the user's offer.** "04 / 07" over a progress
    line cost 30px plus its gap at the bottom of every stage, and at 320 it was
    the one thing standing between the cards and a usable size — the copy floor
    it forced capped the card at 114px. What it carried is still on the page:
    the credit line under the headline names the workshop's number, and the
    strip shows its neighbours either side. `RAIL` is out of both ratio sets
    rather than left as dead config, and `COPY_MIN` drops 250→205 / 190→150.
  - **Wide was the worse offender and it was not the card ratio.** `STRIP_TOP`
    put the strip at 44% of the stage for a headline block that does not need
    it: above `NARROW_AT` the credit and duration share the headline's row, so
    nothing is stacked beneath it and most of that band was empty. 0.44 → 0.34.
    `CARD_H` 0.30 → 0.37 narrow, 0.31 → 0.42 wide, and the `clamp` ceiling
    360 → 480, which a large display was hitting before the card was anywhere
    near what the stage could carry.
  - **The headline's descenders were landing on the cards.** With the strip this
    large the gap had to outrun `TITLE_INK_BOTTOM`, which hangs ink past the
    last line box — 8px of a 68px title before anything else. The gap is now one
    named `stripGap` (0.045 of the stage) feeding both the padding that draws it
    and the room calculation that accounts for it; as two literals they had
    already drifted. Measured lowest-ink-to-strip: 15px landscape, 26 at 320,
    38 at 390, 46 at 768.
  - **A crude check said the headline now collides with the top bar; it does
    not.** Comparing the back link's 44px tap target against the mask's ink
    padding reported −7px at 320. Both are padded boxes, not glyphs — the render
    shows ~15px of clear air, and `hittest.js` confirms 0 unreachable, which is
    the failure that would actually matter (a headline stealing the back link's
    clicks). Recorded because the measurement looked authoritative and was not.
  - Verified: `audit.js` clean at 390/768/1440; fit checked at 320, 360, 390,
    430, 768, 844x390 and 1440; **landscape no longer cuts anything** — it was
    losing the rail below the fold, and there is no rail.

- **2026-09-09 (four gallery images that were never free before)** — every card
  now comes from `poze-org`, so the six raw frames that used to be consumed as
  CARD sources stopped being spoken for. Four went into galleries:
  `Atelier_4_A/B/C` gave **curajul-de-a-ti-urma-inima** the gallery it never
  had, and `Atelier_5_A` now LEADS **iconar** — it is the only frame in that set
  showing the thing the workshop actually makes. 14 gallery images, 2312KB in
  `public/ateliere/`.
  - **A4 was being withheld on a judgement that was not the maintainer's to
    make.** The table said its three photographs were institutional collages
    with captions baked in and that "a page of them says nothing about the
    workshop". The user overruled that, and was right: the workshop is about
    choosing between marriage, priesthood and consecrated life, so one panel per
    community — the CMD sisters, the intereparchial seminary, the Basilian
    sisters — is the subject rather than decoration around it.
  - **The renumber does not reach this.** Raw filenames carry the ORGANIZERS'
    numbering (`Atelier_4_*` is A4) while the site now counts 01–07, so A4's
    photographs belong to the workshop the site calls 03. `GALLERY_RAW` keys on
    slug and never on number, which is what stops a renumber from silently
    repointing a gallery at the wrong workshop.
  - **Still unused, and all four are freed card sources:** `Atelie_2_Unica`
    (**masina-timpului has no gallery at all** — the only workshop without one),
    `Atelier_3_A` (episcopul, would be a 4th), `Atelier_6_B` (mozaicar, a 4th),
    `Atelier_9_B` (voluntari, a 3rd). Left out pending the user's eye rather
    than forgotten.
  - `audit.js` clean at 390/768/1440 on both changed pages.

- **2026-09-09 (`npm run photos`)** — the pipeline resolves `playwright-core`
  from the verification harness itself, so it runs from the repo root instead of
  only from inside `.claude/skills/web-verify` with `NODE_PATH` set by hand.
  The user re-runs it every time they settle a thumbnail; that should not need a
  ritual. **The refresh loop is: overwrite the file in `docs/ateliere/poze-org/`,
  `npm run photos`, rebuild, restart :3000.** Nothing is ever edited under
  `public/ateliere/` — every file there is generated and overwritten each run.
  - Also normalised four files back to LF. Python's text mode translates `
`
    to `os.linesep` on write, so editing through it on Windows silently rewrote
    whole files to CRLF. Harmless in git (`core.autocrlf` is true, and the diffs
    stayed the real size) but the working tree had gone mixed. Edit through Node,
    which does not translate.

- **2026-09-08 (the clipped cards keep the middle half, not the top)** —
  `object-position` 50% 0% → 50% 50%. A card at half height is a 3:2 window
  onto a 3:4 picture, so it hides exactly half; `p` places that window at
  `p/2` of the picture, and 50% keeps 25%–75%.
  - **Third value, third time the artwork changed under it.** 26% suited
    photographs of people. 0% suited the organizers' collages, composed
    downward from a title. The user's generated set is built like photographs
    again — sky, roofline and empty margin on top, subject in the middle — so
    the top half was the half with nothing in it, and the neighbours read as
    blank panels. The authoring guidance in section 7 said "compose from the
    top down" and has been corrected to the middle, since thumbnails are still
    being generated against it.
  - Nothing changes for the focused card: it is exactly 3:4 and so is the
    artwork, so there is no overflow to place and the whole picture shows.
  - **Worth knowing before regenerating:** the middle band of the A1 collage
    exposes English lettering — *Palatul Cultural · Discover!* and *Old
    School* — that the top crop happened to hide. The backdrop tier already
    handles this behind the copy (120px sibling, SPEC 2), but the card itself
    now shows it on a Romanian site.

- **2026-09-08 (the site numbers the workshops 01–07)** — it printed the
  organizers' own numbers, which run **02–09 with gaps**: A1 is the treasure
  hunt and there is no A8. The list therefore opened on "Atelier 02" and
  skipped 08, which reads as a bug to everyone who has not seen the source
  documents. It is now the position in `ATELIERE`, 1-based and zero-padded.
  - **This reverses a recorded decision**, taken so the site would agree with
    whatever gets printed on the day, and reversed by the user knowing that.
    The risk it was guarding against is real but small and one-directional:
    someone holding a sheet that says A03 will see *Atelier 02* on the phone.
    If printed material ever quotes the organizers' numbers, this is the thing
    to revisit — `number` is still on every entry for exactly that reason.
  - **One funnel, so the two schemes cannot drift on the page.** `atelierNo`
    is the only thing that formats a number, and all four display sites go
    through it: the stage's credit line, the detail page's kicker and both
    prev/next links. It matches on `slug` rather than `indexOf`, so an entry
    built by hand falls back to the organizers' number instead of printing
    "00". Verified off the served HTML, not the source: all seven kickers
    match their position, every prev/next pair is consecutive, the first has
    no prev and the last no next, and no 08 or 09 appears anywhere.

- **2026-09-08 (all seven thumbnails, and the headline that ate its own
  diacritics)** — the user generated a card for every workshop and settled
  them in `docs/ateliere/poze-org/` as `Atelier <1-7> - Thumbnail.jpg`, the
  positional name the pipeline already understood. All seven now come from
  `poze-org`; **the stock Unsplash frame is gone** and with it
  `imagePlaceholder`, which no workshop sets any more (the machinery stays for
  the next gap). Every run prints the workshop it resolved each file to and all
  seven were checked against that line, because `Atelier 6` is position 6 and
  therefore A7. 1995KB in `public/ateliere/`.
  - **A second card for one workshop is now ranked, not sorted.** The folder
    held `Atelier 1 - Thumbnail.jpg` and `Atelier 1 - Thumbnail Alternativ.jpg`
    — both match, both are cards, and the winner was whichever name sorted
    first. A space sorts before a dot, so the ALTERNATIVE would have won
    silently. The plain name now outranks any decorated one and the loser is
    reported as an unused alternative rather than an error, because holding two
    candidates is what choosing looks like.
  - **The wipe mask was amputating Romanian.** Each headline line sits in a
    `overflow-hidden` box exactly one line box tall so it can wipe up from its
    own edge. Outfit's ink does not fit that box: 0.98em above the baseline (Î,
    Ă carry the accent above cap height) and 0.388em below it — and that lower
    figure is not a descender but the comma under ș and ț, which Outfit draws
    1.7x deeper than its own j (0.224em). At 49px the box was taking 7.9px off
    the top of *În vizită la* and 6.0px off the bottom of *Episcopul*. The mask
    is now sized to the ink and given back to the layout with an equal negative
    margin, so the leading and the computed title size are untouched.
    - **Letting the comma out whole was worse than the bug.** At 0.9 its tip
      lands on the next line's x-height (0.9 − 0.388 = 0.512 against an
      x-height of 0.51) and reads as an apostrophe inside the word below:
      *mașina / timpului* became *masina / timpul'ui*. So the bottom admits
      every true descender and stops there, cutting the comma at 0.203em —
      about half of it, still unmistakably a comma-below. Checked against a
      plain-`s` control, not by eye alone. Loosening instead was measured and
      rejected: 1.0 clears the x-height but not the ascenders, and clearing
      those needs 0.388 + 0.714 = 1.10, which is no longer this headline.
    - **Negative margins between siblings collapse.** As blocks the masks
      cancelled only the larger of each adjoining pair, and the title grew
      17.6px — quietly loosening the leading the padding exists to preserve.
      The `h2` is a flex column now; flex items never collapse. Caught by
      measuring the box against `lineHeight × lines`, not by looking.
  - **The focused card is 50% bigger** (390x844: 127x169 → 190x253, in two
    passes — 0.27, then 0.30 once the first had been looked at). The picture
    inside it was unreadable at the old size. One constant does it — every
    card's width is `fullH × 0.75` — so the strip keeps reading as a row of
    cropped frames with one complete picture in it, rather than becoming a hero
    with thumbnails. `CARD_H` 0.2 → 0.30 narrow, 0.264 → 0.31 wide. Half of
    each neighbour still shows at every size (85–238px).
    - **Both ratios are set by their tightest device, not their roomiest.** The
      leftover the copy band spreads between the action and the rail does not
      scale with the stage — description and button are near enough fixed — so
      a taller phone has proportionally more to give: at 0.27 the gap measured
      28px at 320, 41 at 360, 64 at 390, 77 at 430. **360x740 caps the narrow
      ratio**; past 0.30 it closes that gap on a 360 while merely tidying a
      430. Final gaps: 28 / 19 / 39 / 49.
    - **The strip may not eat the copy band.** The ratio that gives a legible
      picture on a tall phone is the same ratio that pushes the action off a
      short one, so `fullH` takes the smaller of its ratio and what is left
      once the band keeps `COPY_MIN`. This *fixed* a defect rather than
      avoiding one: a landscape phone (844x390) was already putting the last
      3px of the button under the fold at the old ratio, and now clears it.
      320x568 is unchanged, capped by the same floor.
    - **Landscape still cannot fit everything, and this is as far as the cap
      reaches.** At 844x390 the copy floor wants a 28px card, so the `clamp`
      minimum of 96 wins instead and the band overflows: the position rail sits
      below the fold. It is better than it was — both the button *and* the rail
      were cut before — but a 390px-tall stage genuinely cannot carry strip,
      copy and rail at once. The fix, if it is ever wanted, is to drop the rail
      on a short stage rather than to shrink the card further.
  - Verified: `audit.js` clean at 390/768/1440 (no overflow, no contrast
    failure, no sub-12px text, no small tap target, no console error);
    `hittest.js` 0 unreachable across `/`, `/ateliere` and a detail page; the
    seven titles measured clear of the mask top and bottom at both 390 and 320
    with the title box matching `lineHeight × lines` exactly; card and button
    fit checked at 320, 360, 390, 430, 768, 844x390 and 1440.

- **2026-09-08 (a page per workshop)** — `/ateliere/[slug]`, seven statically
  prerendered pages over `src/lib/ateliere.ts`, built by a forked session in a
  worktree while the pipeline and the carousel stayed with the main one.
  Photograph first, then the sheet: the card photo full-bleed under the top band
  with the title block riding up over its bottom edge on a rounded corner;
  kicker, title, tagline, hook; a ruled facts list (who, when, duration, seats,
  where with a Maps search); the disabled *Înscrieri în curând* control with its
  note; the organizers' description at one measure; neutral tag chips; a
  horizontal scroll-snap strip of the extra photographs at native ratios;
  prev/next and a route back to the list. Above `lg` the photograph takes the
  left column and stays sticky while the sheet scrolls. No ink on imagery — so
  contrast here is a CSS fact and `audit.js` sees all of it — and no JavaScript
  on the page.
  - **The gallery has no manifest.** `src/lib/ateliere-gallery.ts` reads
    `public/ateliere/<slug>-N.webp` off disk at build and parses each WebP header
    for width/height, so the pipeline's naming is the only contract and every
    `<img>` ships with its size. Pages with no gallery files omit the section.
    The parser was checked against the real assets rather than taken on trust:
    `canvas.toBlob` writes **VP8X** (extended) WebP, which is the third of its
    three branches, and all ten sizes match what the pipeline reported.
  - **The carousel links out and comes back to the same card.** The CTA is
    *Detalii* → `/ateliere/<slug>` with a `nav-forward` transition; `HeroCarousel`
    gained `syncHash`, which mirrors the focused card into `#<slug>` with
    `replaceState` (the history stack does not grow per swipe) and reads it back
    on mount and on `hashchange`. Verified independently on the merged build:
    End → Detalii → back lands on the same card at the same URL, a fresh
    `/ateliere#mozaicar` opens on mozaicar, and four swipes leave `history.length`
    at 4. **The disabled signup control moved off the carousel** — a visible
    change to a page the user has been reviewing, so it was shown to them flagged
    rather than merged silently.
  - **Cold review (opus): fix-first, eight findings, all addressed and
    re-measured.** BLOCKING: the *Fotografie provizorie* line under A7's stock
    photo was a figcaption under the image and the sheet's `-mt-6` painted over
    it — `elementFromPoint` at its centre returned the sheet, so the one page that
    most needed to say "not our photo" said nothing. It renders inside the sheet
    below `lg` and as the figcaption above. The facts list was two columns
    everywhere with a 6.5rem label: "COORDONATORI" is 138px of letterspaced caps
    and ran into the name while the other rows kept 60–79px of gutter; at 320 the
    values had 19ch; at 200% zoom words were cut at the edge and the document
    scrolled 40px sideways. It stacks below `sm` and uses a 9rem label column
    above — values 350px at 390, 280 at 320, 155 at 195, zero horizontal scroll.
    The gallery `<ul>` carried `mx-auto`, so a strip narrower than the viewport
    centred itself 282px right of its heading at 1440, and its `lg` padding
    disagreeing with the region's `scroll-padding` made mozaicar arrive
    pre-scrolled by 144px; it now pads with the page's own gutter expression as
    both padding and scroll-padding, and snaps `proximity`. Landscape 844x390:
    photo plus band took 77% of the screen and the h1 was cut below the fold;
    `short:max-h-[38svh]` puts the photo at 53% with the whole title in the fold.
    The only route back to the list was the band at y=8 on a 2.5–3.3k px page;
    *Toate atelierele* now closes the nav. Nits: the strip's focus ring is inset;
    `main` pads its bottom by `max(1.5rem, env(safe-area-inset-bottom))`.
  - **`metadataBase` was missing and the merge is what surfaced it.** The detail
    page is the first to give Open Graph an image, and Next resolved that
    root-relative path against `http://localhost:3000` — every shared link would
    have carried a preview image nobody else could load. `layout.tsx` now reads
    the base from `NEXT_PUBLIC_SITE_URL`, falling back to Vercel's injected
    production hostname, so it is right on the deployment without hard-coding a
    domain that is still open (D2). The build warning is gone.
  - Verified on the merged tree, not only on the branch: build clean, 24 routes,
    all seven detail pages 200; `audit.js` clean at 390/768/1440 on `iconar`
    (gallery), `curajul-de-a-ti-conduce-viata` (stock photo) and `masina-timpului`
    (generated card); `hittest.js` 0 unreachable across `/`, `/ateliere` and three
    detail pages at 390 and 1440.
  - **Two sessions, one repo, by design.** The page was built on branch
    `worktree-atelier-page` in `.claude/worktrees/atelier-page`, served on :3105,
    and handed back as unified diffs against main's current files plus new files
    verbatim — **no binaries**: the ten gallery WebPs regenerate from
    `GALLERY_RAW` and hash-match. Both patches applied clean and the main
    session's `50% 0%` anchor survived, which is what the diff-not-file-copy rule
    bought. Using the gallery pass is also what found two defects in it — a stem
    split on `-` that rejected every hyphenated slug, and a square crop where the
    doc promised native ratio.
  - **Left as decisions:** the carousel CTA label; the hook doubling as
    standfirst at `--text-h3` while the docs' first paragraph repeats it below;
    the gallery being raw snapshots via `GALLERY_RAW` until the user curates
    `poze-org`.

- **2026-09-08 (gallery images, and why they are generated rather than committed)** —
  Ten detail-page images now come out of the pipeline: three for A3, two for A5,
  three for A6, two for A9, native ratio, sized by display height. A4 gets none — all
  three of its photographs are institutional collages with captions baked in.
  - **The point is the table, not the files.** The parallel session had produced
    the same ten correctly, but by dropping renamed copies of raw photos into
    ITS worktree's `poze-org`. Merging that would have given the main tree ten
    binaries no checkout could rebuild, their source of truth being a directory
    about to be deleted. They come from a `GALLERY_RAW` table instead, standing
    in the same relation to the gallery that `RAW` already does to the cards:
    poze-raw is the fallback, **poze-org wins per slug**. And raw copies stay out
    of `poze-org`, which is the user's curation folder, not a staging area.
  - Mosaic photographs are the expensive ones — tesserae edge to edge, the
    densest content in the set. At the shared 0.8 the three came to 742KB, over
    half the gallery, on pages read outdoors on mobile data. At **0.66** they are
    598KB, and that was checked by looking at a 1:1 crop against the source
    rather than by trusting the number: tesserae, grout lines and marble veining
    all hold. The weight that remains is detail this content genuinely needs.
  - **Sized by HEIGHT, and asking rather than guessing is what found it.** The
    first version capped the long edge at 1200, which was left open pending the
    detail page's real display size. That page's strip turned out to be
    height-driven — 240 CSS px below `sm`, 288 at `sm`, 320 at `lg`, width
    following each image's own ratio — which makes the long edge **the wrong
    axis, wrong in both directions at once**: a portrait's long edge IS its
    height, so 1200 was ~2x over-spec, while a landscape's long edge is its
    displayed WIDTH, so the 3.78:1 mosaic lunette rendered 908 CSS px wide on a
    phone and was being fed 1200 — 0.66x, soft on the one image whose whole point
    is its sweep. `GALLERY` is `{ height: 720, maxLong: 1800 }` in DEVICE px now
    (720 covers 240 CSS at 3x and 320 at 2.25x) and never upscales.
    **1273KB -> 817KB, and the two panoramas got sharper**: the lunette ships
    1800 wide against the 1816 its display needs, source-limited rather than
    policy-limited. The portraits paid for it. No per-entry size overrides and
    nothing to maintain by hand as photographs arrive — the rule derives each
    size from the source's own ratio. One tier, no `srcset`; there is only one
    tier worth having once the sizing is right.
    **This rule inverts if that strip ever becomes width-driven.**
  - **`next start` snapshots `public/` at BUILD time.** A file added there after
    a build 404s until the next one, with no error anywhere to say so. Same
    family as the stale-build trap in CLAUDE.md, and it cost a confusing minute.

- **2026-09-08 (clipped cards show their top)** — On request: the half-height
  neighbours in the strip took their band from `50% 26%` and now take it from
  `50% 0%`. That 26% was the right answer for the placeholder set, which was
  stock portraits of people — just above centre lands on a face rather than a
  forehead. The real set is artwork and collages, composed from the top down,
  and a band from the middle of one is the part that identifies nothing: the
  neighbours all read as anonymous texture. From the top the A2 collage's own
  title is legible in a 78px card. **The rule this leaves is a content rule,
  not a CSS one** — cards are composed top-down now, and section 7 says so.
  Worth revisiting only if the set ever becomes photographs of people.
  Verified: build clean, audit clean at 390/768/1440, seven-slide sweep clean at
  six viewports.

- **2026-09-08 (the first generated card, and the backdrop stops being the card)** —
  The user is regenerating the workshop photographs in AI Studio and split the
  sources in two: `docs/ateliere/poze-raw/` for what the organizers sent and
  `docs/ateliere/poze-org/` for settled artwork. **poze-org wins per slug**, so
  a card is replaced by dropping a file in and re-running the pipeline. The first
  one landed: the A2 scrapbook collage rebuilt as a 896x1200 portrait, which is
  the whole card now instead of a window cut below its title band.
  - **The backdrop is a separate asset now, and finding out why is the entry.**
    The stage paints the focused card's image a second time, full-bleed at 1.28
    scale — a ~2.5x enlargement at 1440. With a photograph that is a soft field;
    with the collage it put **its own lettering across the fold**, "Palatul
    Cultural" and "Discover!" legible in English behind Romanian copy. The A4
    collage had the same defect earlier and was dodged by moving its window off
    the caption band, which was treating the symptom.
    `HeroCarouselItem` takes an optional `backdropImage` and the pipeline emits
    `<slug>-bg.webp` at **120x160, 3-8KB**. The browser's ~15x upscale IS the
    blur, so there is no `filter` to re-rasterise on each frame of the 6s scale —
    which is why a CSS blur was the wrong answer on a phone. Large shapes survive
    (the mosaic's eye, the Madonna); nothing readable does.
  - **Derive it from the SLUG, not the image path.** The first version was
    `image.replace(/\.webp$/, "-bg.webp")`, and A7's card is a stock `.jpg`, so
    that slide silently kept its sharp original while the other six went soft —
    one crisp photograph in a row of fields, which reads as a bug. A7 now gets a
    backdrop cut from the stock frame (`STOCK` in the script; delete the entry
    when its real photo arrives).
  - **Two bugs in the new gallery pass, both found by the parallel session
    reading the code rather than by any test here.** The filename matcher split
    the stem on dashes, and **five of the seven slugs contain dashes**, so
    `episcopul-tinerilor - 1.jpg` resolved to "episcopul" and went unmatched —
    the documented `<slug> - Thumbnail` convention only ever worked for the two
    single-word slugs. It matches a known PREFIX now (longest slug first, so the
    two `curajul-de-a-ti-…` cannot shadow each other). And the gallery called the
    3:4 cutter with `w === h`, squaring every image: the 1818x481 lunette came out
    481x481. `CUT` takes an explicit `fit`, `ratio` for cards and `long` for
    gallery images. Verified end to end: 1818x481 -> 1200x317, 2048x928 ->
    1200x544, 1100x1384 -> 954x1200.
  - Added because both bugs were shipped and neither was caught by running the
    script on the real folder — it has no gallery files, so the broken path never
    executed: **`--check`** resolves a table of sample filenames and exits
    touching no disk, and **`ATELIERE_ORG` / `ATELIERE_OUT`** override the source
    and output directories so the pipeline can be exercised on scratch inputs
    without writing into the curated folder or the live `public/` tree. A pass
    that cannot run is not a pass that works.
  - Verified: build clean; audit.js clean at 390/768/1440; ink.js all-pass at
    1440, worst 9.06:1; the seven-slide sweep clean at 320x568, 360x640, 390x667,
    390x844, 844x390 and 1440x900; `hittest.js` 0 unreachable. 718KB of assets for
    seven cards and seven backdrops.
  - **Two sessions on one tree.** A fork owns `/ateliere/[slug]` in its own
    worktree on :3105; this one owns :3000, the pipeline, the carousel and
    `/ateliere`. It will bring `syncHash` on the carousel, a `Detalii` CTA and a
    build-time gallery reader; there is deliberately no `gallery` field in
    `src/lib/ateliere.ts`, because the filename contract above is the only one.

- **2026-09-08 (the phone gets bigger frames)** — On request: the marquee frames read as texture
  rather than as photographs on a phone, so the base card step went from 124px tall to **176px**
  (+86% frame area) and `sm` from 168 to 200. Roughly 1.8 cards across a 390px screen instead of
  2.3 — fewer, and each big enough to see a face in. **`lg` and `xl` did not move**: desktop was
  already right, and the 2618px seam ceiling is set by `xl`, so it did not move either.

  Two things had to hold while doing it, and both were measured rather than assumed:

  **The payload did not move.** DPR2 and DPR3 phones still pull **351KB**, one file per
  photograph. That is not luck — the wide card is now exactly 1.5x the card height, which is the
  width a 3:2 source occupies at that height, so narrow and wide paint at the *same* 264px and a
  base-breakpoint tier straddle became impossible at any DPR. 264x3 = 792 keeps DPR3 inside the
  800w tier with 8px to spare. DPR3.5 crosses to 1120w and pays 578KB — heavier, but still one
  file per photograph, where before the bump it fetched both tiers. **A card size change is a
  tier change**; the sizes ramp had to move with the cards.

  **The ramp stayed monotonic.** Raising base without raising `sm` would have made cards *shrink*
  from 639px to 640px wide, which reads as a bug. `sm` went up with it.

  Verified: 0 horizontal overflow at 320, 390, 768, 844x390 and 1440; seam margin positive at
  every breakpoint (+2198 at 390, +128 at 2560); rendered-ink contrast unchanged with motion
  frozen — kicker still **6.09:1** at 390, all pass at 320x568 and in landscape.

- **2026-09-09 (the spine wash broke, and the break was predicted)** — the
  8 Sep entry above closed with "these margins belong to THIS artwork — swap the
  workshops image for something dark in its lower left and the question
  re-opens." The replacement photograph arrived the next morning with two
  figures in **black habits dead centre**, and a spine keeps only the middle
  ~30% of the frame, so the vertical ATELIERE mark landed on near-black:
  **2.36:1 at L=0.075** against a 4.5:1 / 0.19 floor. A real failure on a real
  build, caught only because the art change triggered a re-measure.

  The spine wash had been cut 78% -> 58% -> 36% across the two "less colour"
  passes. A sweep found the threshold at **68%** (4.66:1, L=0.197) — clearing
  the floor by 0.007, which would not survive the next re-encode. Shipped at
  **75%**: 5.44:1 at L=0.232.

  **Both tints carry it, though gold measured fine at 36%** because the map is
  light. A floor set from whatever art is currently in the folder is not a
  floor. The open card keeps its reduced veil and scrim — that is the state the
  "too coloured" complaint was about; a spine is 76-115px of colour chip with a
  word on it and, as the component has said since it was written, has almost no
  photograph to lose. Cutting it was the overreach.

  Re-measured, both panels, both states, 320/390/1440: worst **sky spine
  5.44:1**, open sky 5.53, open gold 6.89, gold spine 11.20, darkest backdrop
  L=0.232. The same states read up to 3 points higher on the *previous*
  photograph, which is the plainest evidence available that these numbers
  describe artwork, not code.

- **2026-09-09 (`npm run photos` learned the landing pair)** — the branch
  panels were being converted by hand, which is how the first pair ended up
  re-encoded at the source's own 1152x928 (ratio 1.241) rather than cut to the
  5:4 the geometry actually calls for. The script now does both consumers:
  `docs/poze-landing/*` -> `public/landing/<stem>.webp`, cropped to 5:4 at a
  1200x960 ceiling with `native` on, so a source is never upscaled and keeps its
  own resolution (both landed at 1152x922). The stem is the contract —
  `workshops.jpg` -> `workshops.webp`, which is what `BRANCHES` points at.
  Extra files are converted and reported as unreferenced rather than refused, so
  trying a new panel costs nothing.

  Renamed `scripts/ateliere-photos.js` -> `scripts/photos.js`: it writes
  `public/landing/` now, and a script called "ateliere" that does would mislead
  someone later. `npm run photos` is unchanged. Seven references across SPEC,
  `page.tsx`, `ateliere.ts` and `ateliere-gallery.ts` were updated in the same
  pass.

  **The point of routing it through the script at all is that `docs/` cannot
  ship.** It is gitignored and vercelignored and sits outside `public/`, so art
  referenced from there works in dev and 404s in production. That is now true of
  the landing folder as well as the workshop ones, and enforced by there being
  one command that produces every servable image.

- **2026-09-09 (the landing copy, and the fold that had to make room for it)** —
  the kicker became **"Întâlnirea Intereparhială a Tineretului"** (was
  "Întâlnirea Tineretului Greco-Catolic") and the lead was replaced with the
  organisers' text, naming Preafericitul Părinte Claudiu's invitation and both
  eparchies. Supplied at 305 characters, shipped at ~215.

  **What was cut and why.** "Vă așteptăm cu un program complex și atractiv din
  care nu lipsesc" went: it announces a list instead of being one, and the list
  survives whole (rugăciune, voie bună, ateliere, prietenii noi, un oraș de
  descoperit). The two eparchy names are the single largest block of characters
  and are exactly what must NOT be cut — naming Cluj-Gherla is how a young
  person from Cluj-Gherla knows the invitation includes them.

  **The fold had no room, and that had to be found rather than assumed.** It is
  `justify-end` inside `min-h-[100svh]`, so the copy block hangs from the
  BOTTOM and every extra line pushes the kicker up and off the top. Measured
  slack below the cards was exactly the 56px of bottom padding at every width
  from 375 to 768 — the layout had no give at all, and the longer lead cost 56px
  at 375x667 and 77px at 320x568.

  Paid for by, in order of size: the branch cards `h-60` -> `h-52` (240px ->
  208px) **on phones only**, since `sm:`/`lg:` had slack; the gap above the
  pair `mt-8` -> `mt-6`; and the fold's bottom padding 3.5rem -> 2.5rem (the
  safe-area `max()` is kept). The card shrink is coupled to the vertical mark
  on a spine — see `branch-panels.tsx` — so the mark came down with it (initial
  2.2em -> 2em, tracking 0.42em -> 0.3em, 194px -> 178px), which leaves **more**
  air than before: 30px in 208 against 23px in 240.

  | viewport | before copy | after copy, before shrink | shipped |
  |---|---|---|---|
  | 320x568 | 103px over | 180px over | **92px over** |
  | 375x667 | 0 slack | 56px over | **40px slack** |
  | 390x844 | 56px slack | 0 slack | **40px slack** |
  | 1440x900 | 159px slack | 147px slack | **143px slack** |

  Every viewport ends equal or better than it started, carrying ~90 more
  characters. Verified: `audit.js` clean at 390/768/1440; `ink.js` all pass,
  new kicker **6.09:1**, lead 19.63:1; panel labels re-measured worst **8.00:1**;
  `hittest.js` 2 interactive / 0 unreachable; mark 178px of 208 with no clipping
  at any width, landscape included.

- **The `tight:` variant (same day), and a comment in `globals.css` that was
  wrong.** That comment said "Portrait phones are unaffected — the shortest
  common one is 568px tall." Measurement says otherwise: 320x568 was overflowing
  by 103px *before* any of this, and 375x667 — an iPhone SE 2/3, not an exotic
  device — had exactly 0px of margin. They fall between two stools: too tall for
  `short:` at 520px, too short for the 844 the rhythm is tuned to.
  `tight:` is therefore a BAND, `(min-height: 521px) and (max-height: 700px)`,
  not a ceiling. It has to be: a sideways phone is ~390px tall and would match
  both variants at once, leaving which padding wins to source order in the
  compiled sheet. It carries `tight:pt-8` on the fold, which is what takes
  320x568 to 92px — below the 103px it had before the copy grew.

- **Two verification methods failed silently today; both are recorded because
  they will fail again.** (a) `npm run build` was run while `next start` still
  held `.next`, and the server went on serving a build two revisions old while
  reporting HTTP 200 — the fit numbers measured against it were wrong twice
  before the cause was found. **Kill the server BEFORE building**, not after, and
  re-measure. (b) A "does the CSS contain this utility?" check globbed
  `/_next/static/css/`, but Next 16 emits stylesheets under
  `/_next/static/chunks/`. With no match the variable was empty and `curl`
  silently refetched the HTML, where the class name appears in `className`
  anyway — so the check passed for the wrong reason and proved nothing. Read the
  `<link rel="stylesheet">` href out of the served HTML, or `cat`
  `.next/static/chunks/*.css`.

- **2026-09-08 (the workshops get their content)** — A3 delivered and shipped on
  `/ateliere`: seven workshop documents (A2–A7 and A9; A1 is the hunt, there is no A8)
  and eighteen photographs in `docs/ateliere/`, typed into `src/lib/ateliere.ts` —
  titles, numbers, coordinators, durations, seats, sessions, locations, the long
  descriptions and the hashtags, so the detail page that comes next is a template
  over data that already exists. The carousel reads that module; the six invented
  workshops are gone. Numbering is the organizers' own, gap included: 02 … 09.
  - **The photographs are a mess and the page had to be built around that** —
    the full account is in section 7. Cut by hand per photo, 720x960 WebP, 664KB for
    the set of six (the mosaic is 178KB of tessera detail; it was 424KB at 960 wide,
    which is why the cards are 720 wide, the same as the stock frames were). A7 has
    no photograph, sits on the stock lecture-room frame, and its credit line says
    *foto în curând* instead of pretending.
  - **Three-line titles, and the cap that made them safe.** The real titles are long
    (*Curajul de a-ți conduce propria viață*), so `cardTitle` breaks them by hand
    into up to three lines of ≤13 characters. That fit everywhere except 320x568,
    where the headline block is bottom-anchored and a title that does not fit
    overflows *upward* — `justify-end` does not clamp — 14px under the back link.
    `hero-carousel.tsx` now caps the title size by the measured room above the
    credit and meta lines. It binds only there (33 → 25px on three-line slides) and
    nothing moves at 360x640, 390x667, 390x844, 844x390 or 1440. The first cut
    reserved the two label lines at 1.25x and left the title's box flush against
    the bar: they inherit the body's 1.6 line-height. Measured, not guessed.
  - The accents are `var(--brand)` / `var(--contrast)` now, not hex. The page
    carried six raw hex values before, against its own rule.
  - Verified: build clean; audit.js clean at 390/768/1440; all seven slides swept
    at 320x568, 360x640, 390x667, 390x844, 844x390 and 1440x900 — no wrapped
    headline line, no headline under the top bar, no CTA over the rail; ink.js
    all-pass at 390 and 1440 (worst 9.06:1, the disabled CTA); hittest 0
    unreachable on `/` and `/ateliere`. **No cold review this pass**: content
    swapped into an existing layout is the case the web-dev skill says not to
    spend a reviewer on. The detail page will get one — on opus, per the user.
  - **Not done, by decision:** `/ateliere/[slug]` is next, and the CTA stays the
    disabled *Înscrieri în curând* until signup exists. Owed by the organizers:
    A7's photo, GPS for every location, the rooms for A4 and A9, a location for A7.
  - **Two sessions shared one working tree and one :3000 today**, and this one
    found the port restarted under it three times by the other. Every restart here
    was confirmed by grepping the served HTML for a string only the new build has,
    which is the only reason none of the numbers above came off a stale build.

- **2026-09-08 (the marquee gets its photographs)** — A1 delivered and shipped. Eleven real
  photographs from a past meeting replace the three Unsplash landscapes behind the landing fold.
  The page reads the way section 7 predicted it would: crowds, raised hands, a stage, a hall
  mid-dance. It is the first time the fold has had the material it was designed around.

  **The order is deliberate and it is load-bearing.** Every one of the five rows is a rotation of
  one list, so `ARCHIVE` is interleaved by mean luminance (0.25-0.48, alternating high/low) with
  no two neighbours sharing a subject. Dealt in file order the rows read as tiled wallpaper.

  **351KB for the whole archive on a phone**, from 3.5MB of source JPEG. Two WebP tiers behind a
  `srcset` — 800w and 1120w — and the encode is `.blur(0.75)` *then* `quality: 55`. Quality
  alone stalls: the worst frame goes 54KB -> 40KB from q72 to q45, while blur-then-quality takes
  it to 33KB. Dense crowd detail is what costs bits, and none of it survives a 228x124 card behind
  a wash on a rotated moving band. Verified by rendering frames at their true card sizes and
  looking. `sizes` is the *painted* width, not the box width — a 3:2 source under `object-cover`
  paints 1.5x its own height.

  **The tier boundary was nearly a 848KB own-goal, and only the network tab caught it.** Each
  photograph is dealt into narrow *and* wide slots, so it has two demands at once (186 and 228 CSS
  px). With the small tier at 640w a DPR3 phone wanted 558 and 684 — either side of it — and
  fetched **both** files for **every** photograph. 700w still split DPR3.5. 800w holds every
  phone, DPR2 through DPR3.5, in one bucket. Full measured table in 6.1.

  **Fixed a seam bug that had been latent since the placeholders.** Nine frames per half only
  out-measured the 220vw row up to a **1963px** viewport, so every 2560px monitor was showing the
  loop's gap and a 1920px one was 96px from it. `MIN_PER_HALF` is now 12 — 5760px against 5632px
  at 2560, with the ceiling measured at exactly 2618px — and the top-up takes its extra
  frames from the *middle* of the deck — filling from the front would put `cards[0]` at both ends
  of a half, and the -50% wrap joins those ends, so the same photograph would run twice in a row.
  Also dropped the `tripled` deal: with an eleven-photo deck it would have put 330 `<img>` nodes
  on the page instead of 120.

  **`ink.js` reported a false hard failure and it is now written up in 6.2.** One letter of
  "Ateliere" at 1.37:1, bit-stable across three runs — and wrong. The branch panels alternate
  forever, `ink.js` diffs two screenshots, and a moving glyph makes the diff measure the motion.
  Under `reducedMotion: "reduce"` the page passes with the tightest real number at **6.09:1** (the
  sky kicker), against 6.15:1 over the old placeholders. The tell was the core area: 816px for an
  `e` whose twin measured 269px. Stable is not the same as correct.

  Tier 1 clean at 390/768/1440 — 0 overflow, 0 sub-12px text, 0 tap targets under 44px, 0 console
  errors, 0% empty band. `hittest.js` 0 unreachable on `/` and `/ateliere`.

  Still placeholder on this fold: all the landing copy (A3/A4/A5) and the two branch panels'
  own photographs. **The live Vercel deployment does not have any of this** — it is a local
  build only.


- **2026-09-05 (the mark gets its room)** — the mark from the entry below, on
  request: bigger, and centred in both axes instead of sitting on the panel's
  foot.
  - **The mark and the panel height were one decision, not two.** Eight letters
    plus seven gaps is 12.14x the type step, so the mark is 194px tall and there
    was no room to grow it inside a 208px panel — nor any way to make CENTRING
    legible there, because a stack that fills its box reads the same whichever
    way it is justified. The type went one step up the ramp
    (`--text-ui` -> `--text-body`, 13 -> 16px, initial 28.6 -> 35.2px), the gap
    paid a little for it (0.55em -> 0.42em), and the panels went to `h-60`
    (240px, `sm:h-64`) in the same pass. 23px of air above and below at 390,
    47px at lg.
  - **`short:` did not grow with it** and now drops the whole mark to
    `--text-ui`: the landscape panel is 160px because the viewport is 390px
    tall, which is a constraint rather than a design choice. 129px of a 136px
    content box.
  - **The taller panel would have clipped the fold at 320x640** — the one
    viewport where the copy column already overflowed (31px before this).
    Recovered by taking the column's minimum top padding from `pt-24` to
    `pt-16`, **which costs nothing anywhere else**: the column is `justify-end`
    inside `min-h-[100svh]`, so that padding only binds when the content is
    already taller than the screen. 320x640 is back to its previous 31px with
    the pair fully above the fold; 390x844, 390x667, 360x740 and 1440x900 are
    unchanged and still fit exactly.
  - All measurements re-run: audit.js clean at 390/768/1440, nothing under 12px;
    both states at 390 and 1440 pass with the spine's worst letter at
    **7.87:1**; zero letter escape past a panel edge; spine tap 537ms,
    open-panel tap 102ms, Tab expands each panel, reduced-motion static.

- **2026-09-05 (the spine becomes a mark)** — fourth pass on the same pair, and
  the one that stopped trying to fix it by degrees. Three earlier passes made
  the stack heavier, then bigger, then lowercase, and each was rejected the same
  way; the user settled it with a reference image.
  **The lesson is the diagnosis, not the values: a column of letters at reading
  size looks like a word that fell over, and no amount of balancing the two
  states against each other repairs that** — they are not one typographic idea
  and should not have been sized as if they were.
  - The spine is now a **mark**: small tracked capitals under one large initial,
    **13px (`--text-ui`) against 28.6px (`2.2em`)**, centred. *(One step larger
    the next pass — see the entry above; the 2.2em ratio held.)* The open row is
    untouched at 23px sentence case — it is simply the name.
  - **The tracking is the container's `gap`, not `letter-spacing`.** Each glyph
    is its own block, so `letter-spacing` would add its space *after* the glyph
    and push every centred letter off-axis by half of it. `gap-[0.55em]` also
    follows the step down in `short:` without a second declaration.
  - Landscape needed only the initial's ratio dropped (`short:text-[1.5em]`):
    121px of a 132px content box, where the previous 20px stack needed a
    size drop on every letter.
  - Both states pass at 390 and 1440: spine stack **8.42:1** worst on sky and
    **10.93:1** on gold, the initial **11.56:1** sky / **11.79:1** gold, open row
    **12.06:1** gold / **8.98:1** sky. audit.js clean at 390/768/1440 with no
    text under 12px. Zero letter escape past a panel edge in either direction
    (the defect from the entry below stays fixed). Spine tap navigates at 518ms,
    open-panel tap at 97ms, Tab expands each panel, reduced-motion static.

- **2026-09-05 (the panels get their balance)** — third pass on the same pair,
  on the same complaint: "still looks like unbalanced ass". Four changes, and
  one clipping bug that only the third one exposed.
  - **The stack is a word, not a spine of capitals.** *(Reverted the next pass
    — see the entry above; setting it at reading size was the mistake, not the
    casing.)* It was `uppercase`, which
    is what made it read as a label stapled to the side of the panel rather
    than the same word waiting to lie down — and it forced every glyph to the
    same width, which is exactly what a column of letters does not want.
    Lowercase also does the initial's job for it: against x-heights a capital
    stands out on shape alone, so it keeps its emphasis at `1.45em` without
    being the only thing on the panel.
  - **The two states now read at one size, with the horizontal a step ahead.**
    *(Superseded — this was the third and last attempt to balance them as one
    idea. Current sizes are in the entry above.)*
    The previous pass had made the spine the loud state and the open label the
    quiet one, which just moved the imbalance rather than removing it. Both
    labels share `--text-h3` as their base; the open row is `1.15em` of it
    (23px), the stack 1em (20px), the initial `1.45em` (29px). Both are
    **ratios, not ramp steps** — see the fluid-vs-fixed trap in the entry
    below, which is why neither may be expressed as `text-h2`. The cost is that
    every letter now resizes mid-flight where seven of eight used to hold; that
    is the price of the pair not looking like a title and its footnote.
  - **Both labels hang off the same foot.** *(The stack is centred rather than
    end-aligned now; the shared foot survived.)* The stack aligned on its end
    edge (`items-end`, matching the row's `items-end` baseline) and both are
    bottom-anchored with the same 16px foot, so the two words sit on one line
    across the pair. Anchoring the stack at the TOP, as it was, cost twice: at
    lg it left 95px of empty panel under a label pinned to the ceiling, and it
    put every letter the full height of the panel away from where it was going.
    From the foot the tail of the word barely moves and only the head travels.
  - **THE BUG THIS EXPOSED: letters were being thrown clear of the panel and
    clipped away.** Measured mid-flight at 1440: **64px past the bottom edge and
    56px past the left edge**, peaking around 170ms, swallowed by
    `overflow-hidden`. Invisible until the labels moved to the bottom, where the
    escape had an edge to cross. Two independent causes, both found by
    measuring letter boxes against panel boxes every frame rather than by
    looking at stills:
    - *A doubled projection.* The glyphs' container carried `layout` as well as
      the glyphs, so each letter had its own projection multiplied by its
      parent's 21x169 box scaling to 87x23, and any letter whose delay put it
      out of phase with that parent was flung outside. The container is a plain
      `span` now; with a static parent each glyph simply flies from its old
      viewport box to its new one, which is all this ever needed. Vertical
      escape 64px to 0.
    - *A lagging letter on a moving edge.* **The stagger now applies to the
      OPENING panel only, and that is a correctness rule rather than a
      preference.** An opening panel's left edge is pinned and only its right
      edge travels, so a delayed letter is always still inside it. A closing
      panel on the right of the pair has the opposite geometry — its left edge
      sweeps 274px inward at lg — and letters held back by a delay were left
      outside it. With no delay the letters and the edge share one spring and
      stay in step. Horizontal escape 56px to 0.
  - Also **6px of clearance bought back at 200% zoom**, where the open label had
    been overflowing its own padding: the `short:` variant now tightens the open
    panel's side padding too, not just the spine's.
  - Re-measured, both states, 390 and 1440, all pass: open row **12.06:1** on
    gold and **8.98:1** on sky, spine stack **7.88:1** on sky and **10.93:1** on
    gold, the initial **8.61:1** sky / **11.68:1** gold. Worst case 7.88 against
    a 4.5 floor. audit.js clean at 390/768/1440. Zero horizontal overflow and
    positive padding on every edge at 320, landscape 844x390, 200% zoom and 390.
    Four input paths again: spine tap navigates at 572ms after the expansion
    plays, open-panel tap at 107ms, Tab expands each panel, reduced-motion
    static over 6s.

- **2026-09-05 (the panels get their choreography)** — the pair from the entry
  below, reworked to a sketch. Three changes to the transition and two to the
  behaviour.
  - **The spine's letters are upright and stacked, not rotated.** It was
    `writing-mode: vertical-rl`, which lays the glyphs on their side. Rotated
    glyphs also cannot fly into a horizontal word — they would have to
    un-rotate mid-flight — so this was blocking the animation as well as being
    wrong. Each glyph is now its own `layout` child, so framer measures its
    stacked position and its inline position and flies it between the two on a
    transform.
  - **The initial is the word's own first letter**, one ramp step larger while
    stacked, not a separate badge below the word. `BranchPanel` lost its
    `initial` field: it was the same character stored twice and the two could
    drift.
  - **ONE MOTION — and getting there took two wrong turns worth recording.**
    - *First wrong turn: reading the sketch as keyframes.* Its three frames
      were illustrating what the TEXT does; scheduling the width to start
      200ms after the letters turned that illustration into a stutter, and it
      was rejected on sight as "mechanical, laggy". Everything now runs on a
      single shared spring (`visualDuration: 0.34`, `bounce: 0.12`) started at
      the same instant, with no delay on any part. The sketch's middle frame
      still happens — the word goes horizontal and clipped while the panel is
      still opening — but it falls out of the spring's fast start rather than
      being timed by hand. **Sharing one transition object is the load-bearing
      part:** two transitions of different durations drift apart at every frame
      between the endpoints, and that drift is what "mechanical" looks like.
    - *Second wrong turn: letting eight letters interpolate independently.*
      Glyph 0 barely moves while glyph 7 crosses the whole panel, so on one
      clock the word spent its flight as a **diagonal staircase** — correct
      geometry, and it read as letters tumbling. A 14ms per-position stagger
      turns it into a fold: the front of the word is already lying down while
      the tail is still standing, so the stack pours into the line. Under a
      fifth of the spring's duration, which is enough to give the motion a
      direction without becoming eight animations again.
      *(Amended — the stagger now runs on the opening panel only. On a closing
      one it left the tail outside a left edge that was sweeping inward; see the
      entry above.)*
    - The staged version's one real merit is preserved by accident: holding
      letters at a stale position is what made the closing word appear to slide
      out through the left edge (framer measures a layout child once per
      commit, so a label centred in a box whose width a *style* animation is
      changing drifts against that stale measurement for as long as it is
      held). With no delays anywhere, the drift has nothing to act on.
  - **The type was rebalanced**, on the same complaint: the spine read as an
    afterthought at 16px under a 29px word. The spine is the loud state now —
    its stack matches the open label exactly (both 20px) and its initial is the
    largest thing on either panel. The open label came down a step to meet it,
    which also makes the flight cheaper: seven of the eight letters no longer
    change size at all, so only the initial is scaled mid-air.
    *(Superseded — this pass made the spine loud instead of the row, which moved
    the imbalance rather than removing it. Current sizes are in the entry
    above; the `em`-ratio rule below still holds and is why they are ratios.)*
    **The initial is a ratio of its stack, not a ramp step**, and that is a
    real trap: `--text-h2` is fluid where `--text-h3` is fixed, so as
    `text-h2` the initial held its relationship to the stack only at phone
    widths — by 1440 it had grown to 44px against a stack still at 20px and had
    come loose from its own word. `1.45em` is the same proportion everywhere
    and resolves to the 29px it already was at the 390px design target, so it
    adds no sixth size to the ramp.
  - **Alternation is 1.5s** (was 2.6s), measured in-page at 1100/1474/1525/1476ms
    between flips — the spread is the width-threshold detector tripping partway
    through the 400ms animation, not the interval.
  - **Tapping a spine plays its expansion, then navigates**; an already-open
    panel goes straight away. Measured: width climbs 76 to 258px and
    `history.pushState` fires at 501ms, after the panel is at rest. Modifier
    and middle clicks are passed through untouched, or "open in a new tab"
    would quietly become "expand a panel, then navigate this one".
    Uses `router.push(href, { transitionTypes })`, which Next 16 supports, so
    the view-transition type survives the programmatic navigation.
  - **The bug worth remembering: `focus` fires before `click`.** The first
    version of tap-to-preview never ran once, and the panel looked like it
    navigated instantly. `onFocus` expanded the panel — added so a keyboard
    user is not tabbing onto an unlabelled spine — and a tap focuses the anchor
    *before* the click handler sees it, so the handler always found `open`
    already true and took its "already open, just go" path.
    Guarding with `:focus-visible`, which is false for pointer-driven focus,
    keeps the keyboard behaviour and fixes the tap.
    **It took instrumenting the handler to find, and three wrong theories
    first** — the `preventDefault` was reaching the DOM (a bubble listener saw
    `defaultPrevented: true`), which looked like proof the guard had passed. It
    was not: Next's own `linkClicked` calls `preventDefault` before navigating,
    so that flag is set either way. A test that cannot distinguish two causes is
    not evidence for either.
  - Re-measured after all of it, both states, 390 and 1440, all pass: open
    label **8.98:1** on sky and **12.06:1** on gold; spine letters **8.42:1**
    on sky and **11.30:1** on gold; the initial **11.53:1**. Worst case 8.42
    against a 4.5 floor.
    audit.js clean at all three widths; reduced-motion static over 6s;
    stop-on-scroll held over 6s; geometry unchanged at 320, landscape and 200%.
  - Verified the four input paths separately, because they take different
    branches: touch-tap a spine (expands, then navigates at 651ms), touch-tap
    the open panel (navigates at 65ms), Tab (focuses and expands each panel in
    turn), mouse hover then click (expands on hover, navigates at 32ms).

- **2026-09-05 (the branches become panels)** — the two action rows added
  earlier the same day were replaced, on request, by an **expanding pair**:
  one panel open with its name, one collapsed to a spine carrying its initial
  and its name set vertically. `src/components/ui/branch-panels.tsx`, adapted
  from `HoverExpand_001` / Skiper52 on 21st.dev.
  - **What came from the original is the idea, not the code.** It is a
    nine-image desktop gallery driven entirely by hover; this is a two-choice
    router that has to work on a phone first. Three things had to change or it
    would not have worked at all:
    - **The four `swiper/css` imports are dead.** The original imports
      `swiper/css`, `effect-creative`, `pagination` and `autoplay` and never
      uses Swiper once — leftovers from the file it was cut out of. Swiper was
      **not installed**; the recommended install list was wrong about it.
      `framer-motion` was already a dependency, used by `hero-carousel.tsx`.
    - **`flexGrow` against `flex-basis: 0`, not fixed `5rem`/`24rem` widths.**
      The original's expanded panel alone is wider than a 390px screen. Growing
      3.4 : 1 means the pair fills its column exactly at every width — 258/76 at
      390, 204/60 at 320, 390/115 at 1440.
    - **Hover cannot be the only way in.** `hover:` compiles under
      `@media (hover: hover)` and does not exist on a phone, so on a touch
      device every panel in the original stays shut forever. Keyboard focus
      opens a panel too, which the original also has no handling for.
  - **The pair alternates and stops for good at the first sign of a
    human** — pointer, touch, wheel, key or scroll (user's choice among three
    offered). Stopping is what keeps this out of WCAG 2.2.2: motion over 5s
    alongside other content needs a pause control, motion that ends when you
    touch anything and never restarts does not. It matters because the marquee
    behind it is *already* an accepted 2.2.2 deviation (D10) — a second
    uncontrolled loop on the same fold would compound a deviation rather than
    repeat one. `prefers-reduced-motion` skips the whole thing; verified static
    over 6s, verified held over 6s after one scroll, verified alternating when
    left alone.
  - **The tint is accent field, photograph multiplied over it, accent lifted
    back.** Sky to the workshops, gold to the hunt (a treasure hunt is the one
    thing on this page gold actually means something for).
    **The lift is a floor for the picture; the SCRIM is the floor for the ink**
    — these were conflated in the first draft and the comment said so wrongly.
    The lift cannot hold backdrop luminance >= 0.19 without washing the
    photograph out entirely, so the
    cover is sized per state instead: a gradient over the bottom 3/5 when the
    panel is open and its label sits at the foot, and a **flat wash over the
    whole spine**, because the stack reaches well above the 3/5 line — exactly
    where a bottom-up gradient has faded to nothing. (The stack is
    bottom-anchored now rather than top-anchored, and at 169px of a 264px panel
    its head still clears the line, so the flat wash stands.)
  - **D15 (8 Sep): the stack was INVERTED — grey photograph first, accent over
    it as a partial multiply — because no alpha could have fixed it.** Asked
    twice for "less colour", the first pass just cut the alphas (multiply 55->70,
    lift 38->16, scrim 100/85 -> 68/34, wash 78->58). It was not enough, and the
    reason is structural rather than a matter of taste: **multiplying a picture
    into an opaque accent field makes every pixel carry the accent's hue**, so a
    duotone is what that stack produces at *any* setting. Turning the numbers
    down only yielded a darker gold.
    Now the picture is a plain `grayscale` layer at full opacity and the accent
    sits above it at `mix-blend-multiply` **30%**; scrim **42% -> 20% ->
    transparent**, spine wash **36%**. A partial multiply leaves the neutral
    channel alive — gold at 30% scales blue by 0.65 instead of to 0 — which is
    the whole difference between a tinted photograph and a colour chip. One dial
    (`veil`) now governs how coloured the pair is.
    The Blajhunt artwork is the case that proves it: a warm, light, fine-lined
    treasure map, whose narrow tonal range collapsed into a near-solid
    `--contrast` rectangle under the duotone, buildings and all. Under the veil
    the parchment reads as parchment.
    Measured (6.2), both panels, both states, 320/390/1440 — worst per state
    **open gold 7.00:1**, open sky 8.67, sky spine 8.37, gold spine 11.73;
    darkest backdrop under any glyph **L=0.311** vs the 0.19 floor. Gold-open
    binds, and at *1440*, not on a phone: the panel is widest there so
    `object-cover` crops least and the map's burnt lower edge reaches the label.
    **Less colour bought more contrast** — every number beats the duotone's 5.32.
  - **A hand-computed worst case for the veil said 2.6:1 and was wrong.** It
    assumed a dark pixel beneath the sky label; the actual pixels there are a
    light wooden table, and the measurement returned 8.90:1. Recorded because it
    cuts both ways: the arithmetic was not merely pessimistic, it was answering a
    question about a photograph that does not exist. **These margins belong to
    THIS artwork**, not to the alphas — swap the workshops image for something
    dark in its lower left and the question re-opens. Re-run `ink.js` when the
    art changes.
  - **A width floor, not `min-w-0`.** At 200% zoom the column is 147px and
    3.4 : 1 left the spine **32px** — narrower than its own 16px-a-side padding,
    so the vertical label had nothing to sit in. `min-w-[3.25rem]` plus tighter
    padding on the spine specifically; the pair is now 52 + 8 + 87 = 147 exactly
    and never binds above 320px.
  - The first photograph tried for the workshops panel, `ateliere/1.jpg`, is a
    pale flat-lay and vanished into the sky tint — the panel read as a plain
    blue rectangle. `ateliere/2.jpg` has real tonal range and people in it.
    **A tinted photograph is only as good as the photograph's contrast**, which
    is worth knowing before the real illustrations are commissioned.
  - **The artwork landed on 8 Sep** — `public/landing/workshops.webp` and
    `blajhunt.webp`, 1152x928 (5:4), webp at q82 (183KB + 120KB, from 871KB +
    827KB of JPEG). The originals live in `docs/poze-landing/`, which is the
    right place for masters and the **wrong place for anything the page loads**:
    `docs/` is in both `.gitignore` and `.vercelignore` and sits outside
    `public/`, so Next cannot serve it at all and Vercel never receives it. Art
    referenced from `docs/` would 404 in production while working in dev.
  - **Export geometry for the panel art (A1/A3), measured off the running page
    rather than derived from the CSS.** The open panel's box, and therefore the
    only crop that matters, is not one ratio — it moves with the column:

    | viewport | open panel | ratio | spine | ratio |
    |---|---|---|---|---|
    | 320 | 204x240 | 0.85 | 60x240 | 0.25 |
    | 390 | 258x240 | **1.08** | 76x240 | 0.32 |
    | 430 | 289x240 | 1.20 | 85x240 | 0.35 |
    | 768 | 315x256 | 1.23 | 93x256 | 0.36 |
    | >=1024 | 390x288 | **1.35** | 115x288 | 0.40 |
    | 844x390 landscape | 315x160 | 1.97 | 93x160 | 0.58 |

    `object-cover` centre-crops, so for a source of ratio S in a box of ratio B
    the surviving fraction is `min(S,B)/max(S,B)`. Across 390 -> 1440 the box
    spans 1.08-1.35, whose geometric mean is 1.21; the nearest ratio a generator
    will actually emit is **5:4 (1.25)**, which keeps >=86% at 390, >=92% at
    1440 and never upscales — the largest the panel is ever painted is 390x288
    CSS px, i.e. 1170x864 on a 3x phone, and 5:4 at 1K is 1152x896. 4:3 is the
    alternative and is better at `lg` but worse on a phone, which is the wrong
    way round for this project. **320px keeps only 68%** and the landscape spine
    keeps ~25%, so nothing load-bearing may sit outside the central column.
  - **The art is generated for VALUE, not colour.** The panel applies
    `grayscale` before `mix-blend-multiply`, so every hue in the source file is
    discarded and only its tonal map survives, multiplied into sky or gold. A
    colourful source and a greyscale one of the same tones are byte-identical
    once painted. Mid-to-light values are wanted: multiply only ever darkens, and
    the ink floor above is measured against the *darkest* pixel a panel can
    reach, so a dark source spends the margin that the alphas were just cut to
    create.
  - Verified: build clean; audit.js clean at 390/768/1440 (no overflow, no
    contrast failure, no tap target under 44px, no console error);
    `hittest.js` 2 interactive, 0 unreachable at 390 and 1440; geometry checked
    at 320x568, 844x390 landscape and 195x422 (200% zoom), overflow 0 at all.

  - **Two open questions this leaves, both for the user:**
    - **GUIDELINES 3 says exactly one primary action per screen, and this pair
      no longer has one.** Two panels of equal size and equal accent weight,
      swapping which is open, is deliberately a "pick one of two" rather than a
      ranked pair — which is honest about a common trunk with two branches, but
      it is a real departure and it is now the third on this page. The rows it
      replaced ranked themselves by fill.
    - **Accent economy.** GUIDELINES 5 caps a screen at ~3 accent moments. The
      fold now has the gold rule, the sky kicker, a large sky panel and a large
      gold panel. The panels are tinted photographs rather than flat accent
      chrome, which softens it, but it is over the line as written.

- **2026-09-05 (two branches, and D14 closed)** — the landing fold now says
  where to go. It had one CTA to `/ateliere` and no way at all to reach the
  hunt; it now carries **both branches as one ranked pair** — a filled sky row
  to `/ateliere`, an outlined row to `/blajhunt` — and **D14 is decided**: the
  horizontal carousel *is* `/blajhunt`, the vertical roadmap it replaced is
  parked unlinked at `/blajhunt-legacy`, and `/blajhunt/[slug]` did not move
  because it is shared content that both treatments deep-link to.
  - **Two rows, one shape, two weights.** Rank comes from the fill, not from
    the size: same 68px height, same radius, so the pair reads as one object
    and not as two competing CTAs. Two buttons of equal weight would be the
    same as having no primary at all.
  - **Each row carries a hint line**, and that is what earns the second row its
    height. "Blajhunt" is a coined name that means nothing to a first-time
    visitor, so the row says *Zece opriri, pe echipe* under it. The hints are
    deliberately asymmetric: the hunt cites its ten stops because ten is real
    and tracked, the workshops cite no count because the six on `/ateliere` are
    invented (A3) and a placeholder number repeated in a second place is a
    second thing to remember to fix.
  - **The arrow needed a chip.** On its own it floated ~200px from the end of
    its own label — the row is 384px wide at 1440 and the label stops at 277 —
    which read as a table row with a stray glyph in it. A 36px disc at the end
    makes the right edge deliberate, and the dead space becomes a gap between
    two things rather than an accident. Found by looking at the desktop shot;
    tier 1 was clean on that build and had nothing to say about it.
  - **The hint's alpha is 85%, not 80%, and `audit.js` is wrong about why.**
    It reported the 80% as 4.10:1 and failing; it is 5.15:1, confirmed by
    `ink.js` and by hand. The tool composites the alpha over the page's white
    and compares that against the sky tile. Full evidence in 6.2 — this is the
    fourth tool number in this project that turned out to be about the tool.
  - **Copy tightened for 320px.** The second hint was *Zece opriri prin oraș,
    pe echipe*, which fits on one line at 390 and wraps at 320, growing the row
    and pushing it further under the fold. It is *Zece opriri, pe echipe* now:
    both facts, one line, every width.
  - **Temporary scaffolding reverted, as promised.** `next.config.ts` is back
    to a plain empty config (no `NEXT_DIST_DIR`), and the `.next-swipe/types`
    entries are out of `tsconfig.json`. A `:3104` server may still be running
    from the variant run; it serves a stale build and can be killed.
  - **The cold review found a BLOCKING defect that six clean tier-1 runs did
    not**, and it is the third instance of a class this project has already
    written down twice: `COPY_SCRIM` is `to bottom`, so its left and right
    edges were square cuts, and from 592px to `lg` the right one sliced the
    photographs. Full reasoning in 6.1b — including why the careful comment
    about the top and bottom ramps is the reason nobody checked the sides.
    Fixed by insetting the box `-50vw` horizontally. Confirmed with a
    column-luminance scan calibrated against the broken version: the old inset
    reproduces a 59-96/255 step at exactly x=592 at 640, 768, 844x390 and 1023,
    and the fix leaves nothing but content edges (the action rows at x=408, the
    text gutter at x=24).
  - Five more fixes from the same review, all measured before and after:
    - **Landscape phones had no route to either branch.** At 844x390 the copy
      block is 601px, so the actions sat entirely below the fold — 5.3% of the
      pair on screen — on a page whose only job is routing to them. A new
      `short:` variant in `globals.css` (`max-height: 520px`, height not
      orientation, so a short portrait window is covered too) sheds the top
      padding and drops the title to the `h2` step. Now **96.4%** visible.
    - **The outlined row's chip was not a disc.** `--secondary` on a white
      plate is 1.10:1. Each chip now repeats its own row's logic — filled row,
      filled disc; outlined row, a `--border-strong` ring at 3.36:1. That also
      gives the pair the one structural difference it was missing, which is
      what keeps two identical rows out of the iOS-settings idiom.
    - **The outlined row had no press state.** `-webkit-tap-highlight-color:
      transparent` kills the native flash, so a 1.5% scale was the whole
      response to a tap — the pixel under the finger measured 1.00:1, i.e.
      unchanged. It now darkens its border on hover and takes a `--secondary`
      fill with a `--foreground` border on press.
    - **200% zoom blew the rows out of their column.** A grid item's
      `min-width` is `auto`, so the track could not shrink under the row's
      min-content floor: at 195px effective the `<a>` was 169.9px inside a
      147px `<ul>`, overhanging by 23px and touching the screen edge while the
      copy above kept its gutter. `min-w-0` on the item plus `wrap-anywhere` on
      the text (Tailwind 4.3 — `break-words` would NOT have worked, since
      `overflow-wrap: break-word` does not reduce min-content width). Rows are
      now exactly 147px in a 147px track.
    - **"Blaj 2026" split across two lines** at any effective width under
      ~230px, because `text-wrap: balance` on `h1` will halve it and a plain
      space was the only reason it could. It is a non-breaking space now — the
      name was already `translate="no"`, i.e. already treated as an atom
      everywhere else.
  - **Left open, for the user, not silently changed:** the review argues the
    date is ranked below its importance — 13px muted grey with the heaviest
    tracking on the page, under a 20px accent-blue kicker, when for a stranger
    the date is one of the two facts that decide whether they come. It is a
    fair reading of GUIDELINES 2 ("uppercase and letterspacing need MORE size")
    and GUIDELINES 3. Not changed because the whole type block is placeholder
    copy the organizers still own, and because moving the date to the 16px step
    wraps it to two lines at 320px. Worth a decision.
  - Verified: `npm run build` clean, 17 routes; `/`, `/ateliere`, `/blajhunt`,
    `/blajhunt-legacy` and `/blajhunt/[slug]` all 200; `/blajhunt-swipe` now
    404. audit.js clean at 390/768/1440 — no overflow, no contrast failure, no
    tap target under 44px, no console error. `ink.js` all-pass at 390 and 1440.
    `hittest.js` 0 unreachable at both, which matters here because the marquee
    is a later sibling that paints across the whole fold. After the review
    fixes, all of that re-run and still clean, plus `hittest.js` across `/`,
    `/ateliere` and `/blajhunt` at 390 and 1440 — 0 unreachable on all six.

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
    D13 run) — **reverted 5 Sep when D14 landed; described here in the past
    tense.** `next.config.ts` took `distDir` from `NEXT_DIST_DIR` —
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
