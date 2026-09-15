# Liquid glass — the recipe, the rules, and where it belongs

**This file is a specification, not an implementation.** Nothing on master uses
`backdrop-filter`; there is no `glass-*` utility here and no `glass-filter.tsx`. The
working code lives on branch `worktree-glass` and stays there until someone applies it
deliberately, surface by surface.

On 14 September the landing was rebuilt as `/glass`: a frosted, refracting pane over the
photograph marquee, after the 21st.dev liquid-glass dock (@suraj-xd). Four cuts, two cold
reviews and a day of measurement later, the verdict was that the material is good and the
host was wrong — *"it was forced where it should not have been."* The page was not taken.

What follows is everything that day produced, so the next application starts from a
measured recipe instead of from a reference screenshot. Several items below are silent
Chromium behaviours that cost an hour each and that no amount of reading the spec would
have surfaced.

## Where the parts are

Branch `worktree-glass`, head `a6e3988`, pushed to origin. Readable from here without
switching branches:

```
git show origin/worktree-glass:src/app/globals.css                    # the GLASS block, at the end
git show origin/worktree-glass:src/components/ui/glass-filter.tsx     # the refraction
git show origin/worktree-glass:src/components/ui/branch-panels.tsx    # a worked application
```

A live preview of the rejected page, for reference only:
`https://blaj2026-7pqzjlnhf-geneous.vercel.app/glass`

Every token the recipe reads — `--background`, `--foreground`, `--primary`, `--contrast`,
`--scrim` — already exists in master's `globals.css`, so the block ports with no edits.

---

## 1. When glass earns its place

This is the part that matters most, and the part that was learned by getting it wrong.
Glass is a material for **chrome**, not for content. It earns its place when all three of
these are true:

1. **There is something behind it worth seeing.** A photograph, artwork, a moving deck.
   Over a flat token colour a frosted pane is invisible — you have paid for a blur and a
   filter to render a slightly different shade of white.
2. **The text on it is short.** A label, a title, a line or two. Not a paragraph somebody
   has to read for a minute.
3. **It is small, or transient, or both.** It covers part of the screen, or it appears and
   then goes away.

**The failure mode.** The landing broke rules 2 and 3 at once: the copy block is the
page's primary reading surface and on a phone it covers nearly the whole screen. Two
things follow, and both are structural rather than matters of taste.

- **The fill has to climb to protect the text, and past roughly 50% it is no longer
  glass.** It is a white card that costs a backdrop filter. The phone ended at 56% → 48%,
  and the honest reading of that number is that the surface had stopped wanting to be
  glass.
- **It dictates the ink.** Every mid-tone colour had to go near-black, so the landing lost
  its sky kicker and its muted date line — an accent the rest of the site uses. The
  material was making typographic decisions, which is backwards.

**Where it genuinely worked.** Two moments convinced, and both are instructive. At 1440,
with the copy in a left column and photographs to the right, the pane reads as a real
sheet of glass. And on a phone mid-scroll, when the pane passed *over* the photographs —
the state a cold reviewer called "the one state where the glass earns itself". **Motion
behind glass is what sells it.** A static pane over a static field reads as a tint; the
same pane sliding over pictures reads as a material.

**The shape to look for**, then: a small surface, over imagery or over content that moves,
carrying a few words, ideally arriving and leaving. Modals, sheets, sticky bars,
notification banners, badges and labels on photographs, a lip across the foot of a picture
card. That list is not a coincidence — it is what Apple uses the material for.

**This site already reached the same conclusion once, independently.** The welcome letter
(`src/components/ui/welcome-letter.tsx`, the note above `shadow-sheet`) records that its
surface was 92% in the first cut, to let the archive ghost through the paper. A cold
review measured the ghost — **a 4/255 mean and 16/255 peak drift under the body copy
between two frames six seconds apart** — and named it: the marquee composited into the
reading surface of 948 characters of running text. The surface is opaque now, and the note
ends *"Paper does not move while you read it."*

That is this section's rule reached from the other direction, by different people, on a
different component. **Anything a visitor reads rather than glances at should be opaque**
— and note how small the drift was that settled it. Translucency under running text does
not have to be visibly wrong to be wrong.

---

## 2. The one hard rule: change the ink, not the glass

A pane's backdrop luminance floor is `tint × L(fill)` over whatever is darkest behind it.
Dark ink needs a backdrop of **L ≥ 0.19**; near-white ink needs **≤ 0.17**. They do not
overlap, so no surface can be tuned into supporting both.

Worked from the landing: a quarter-white pane over a black photograph frame washed 10%
gives a backdrop of L = 0.24 + 0.76 × 0.10 = 0.32.

| Ink | Luminance | On that pane |
|---|---|---|
| `--foreground`, near-black | 0.003 | 6.9:1 — passes anywhere |
| `--brand-text`, the sky kicker | 0.121 | 2.2:1 — fails everywhere |
| `--muted-foreground`, the date line | 0.087 | 2.7:1 — fails everywhere |

**There is no tint below about 60% that holds a mid-tone ink over photographs, and a pane
at 60% is not glass.** So: put near-black ink on glass, or do not put that text on glass.
Never solve it by raising the fill. Apple's own glass never puts a mid-tone colour on
text, for exactly this reason.

The corollary: **a surface whose text must stay in an accent colour is not a candidate.**
Check the ink before designing the pane.

---

## 3. The recipe

Three layers inside a clipping pane, then the content:

```
.glass-pane                    overflow hidden + radius; positioned by the caller
  .glass-frost.glass-liquid    oversized -24px; backdrop blur + SVG refraction
  .glass-fill                  the tint, a top-to-bottom gradient
  .glass-bevel / -top          directional inset highlights
  <content, position: relative>
```

**Layers rather than one element, and this is load-bearing.** The refraction is
`filter: url()`, and a filter on an element bends its children — the copy would wobble
with the glass. And WebKit, which cannot bend a backdrop, still applies the filter to the
layer's *own* pixels: with the fill on that layer it shows as wavy transparent edges on a
flat tint; on a layer with no content and no fill it shows as nothing at all.

**Copy the utilities verbatim** — `glass-pane`, `glass-shadow`, `glass-frost`,
`glass-liquid`, `glass-fill`, `glass-bevel`, `glass-bevel-top` — and the `:root` knobs,
from the `GLASS` block on the branch. Do not retype them. Render `<GlassFilter />` once
per page that uses `glass-liquid`.

### The knobs

All custom properties, never raw colours, all `glass-`-prefixed so none can shadow a
`:root` token. Tune a layer with arbitrary properties that reference tokens —
`[--glass-fill:var(--glass-sky)] [--glass-tint:36%]` — never with a hex.

| Knob | Default | What it does |
|---|---|---|
| `--glass-tint` | 25% | how much fill; the ink's floor comes from here |
| `--glass-tint-top` | unset | makes the fill a gradient, denser at the top |
| `--glass-fill` | `--background` | what the tint is made of; swap for a tinted chip |
| `--glass-blur` | 3px | the frost |
| `--glass-sat` | 1.2 | puts back the colour the blur greys out; ~1 on a tinted chip |
| `--glass-sky` / `--glass-gold` | accent lifted 30% to white | tinted-glass chip fills |

### Values settled by measurement

| Surface | Fill | Blur | Sat |
|---|---|---|---|
| Sheet over photographs, phone | 56% → 48% | 3px | 1.2 |
| Sheet over photographs, desktop | 32% → 24% | 3px | 1.2 |
| Lip across the foot of a photo card | 25% | 5px | 1.05 |
| Tinted chip on a photo (sky / gold) | 36% / 32% | 5px | 1.05 |

**Blur is 3px, and that is smaller than instinct suggests.** At 6px a cold review measured
that only 18% of the photograph's detail survived at 390px, against 42% at 1440 — a
phone's marquee frames are 176px tall and a 6px blur erases a face at that size. "No face,
no crowd, no hillside survives." At 3px people are still people through the pane. Judge
this by eye on A/B crops: our own Laplacian-ratio metric moved 26% → 28% between the two
and was useless, because it measures the finest frequency any blur kills.

**A phone needs a denser fill than the desktop for the same look** — not for contrast, for
parity. At `lg` the marquee carried a soft white column wash under the sheet and the phone
had none, so an identical fill put the phone's copy on a backdrop of 173/255 with
photographic texture at σ42, against the desktop's 203 at σ32. Raising the phone to
56% → 48% brought it to 201 at σ28. Measure the backdrop under the text with the text
masked out; do not match numbers across breakpoints, match results.

### The refraction

`glass-filter.tsx`: turbulence → contrast stretch → blur → edge mask → displacement. Two
things about it are non-obvious.

**The contrast stretch is the whole effect.** Two-octave fractal noise sits within ±0.12 of
mid-grey, and displacement moves pixels by `scale × (value − 0.5)`, so without the stretch
a throw of 22 moved the backdrop two or three pixels and the pane looked flat. A linear
transfer at slope 3 widens the map to its full range; the blur rounds the cells off.

**The throw is 14, not 28.** At 28 (±6px typical, ±14 max) a reviewer read it as "two or
three lazy bulges" bending the marquee's straight white gutters into serpentine ribbons —
a greasy pane, not water. 14 gives ±3px typical at the same ~150px wavelength.

Chromium only. See §5.

---

## 4. The traps

Every one of these cost real time, and none of them produce an error message.

1. **A `mix-blend-mode` anywhere under a stacking context switches off every SVG backdrop
   filter in it.** Chromium isolates the group and silently drops reference filters from
   the backdrop path. The refraction measured **0.0% bend** with the branch cards'
   `mix-blend-multiply` veil present and **22%** with it set to `normal`, nothing else
   changed. Found by removing things one at a time, after fifteen structural variants of an
   isolated test page had all worked fine. Applying glass to a component that uses a blend
   mode for tinting means the blend has to go.

2. **`setAttribute` on a live SVG filter does not invalidate Chromium's cached backdrop.**
   Every A/B that changed `scale` and screenshotted reported ~2% difference at any throw,
   because it was comparing a render with itself. Toggle the layer's `filter` property
   between `none` and the url, or inject a second filter under a different id and point at
   that.

3. **A displacement filter on a clipped backdrop bends the clip's own edge.** Chromium
   hands the filter the frosted backdrop already cut to the pane, so a throw at the edge
   pulls what lies past it — nothing — into view: wavy edges and a light seam, worst at the
   corners. The fix fades the map to neutral along the edge, and **that fade is coupled to
   `glass-frost`'s 24px oversize, in pixels**. Change one, change the other.

4. **Masks built from `SourceAlpha` are no-ops here.** Two attempts — an erode and a
   blur-and-threshold — changed nothing, to the decimal, because Skia clamps those
   primitives at the input's bounds, so a shape filling its bounds never shrinks. Only a
   primitive with a region of its own (`feFlood`) has an edge for a blur to decay from.

5. **`isolate`, `filter` or `opacity` on the pane makes it a backdrop root**, and the frost
   then blurs its own empty parent instead of the page. The pane carries geometry only — no
   colour, no shadow, no isolation.

6. **A framer-motion `animate` value is not in the server markup.** The branch pair's
   `flexGrow` lived only in `animate`, so first paint had both cards at their 52px floor
   with the label clipped to "Ate" until hydration — 132ms on a desktop, 660ms at 6× CPU
   throttle — and it was live on `/` in production the whole time. Put the first-paint
   value in `style` as well and let the spring animate only changes. Check with JavaScript
   off. *(Not a glass bug, but this work found it; the fix is on the branch.)*

7. **`hover:` compiles under `@media (hover: hover)` and does not exist on a phone.** The
   original dock's whole interaction was hover-driven. Nothing in this material may depend
   on it.

---

## 5. Platform reality

- **Every iPhone gets frost and fill, no ripple.** WebKit composites the backdrop
  separately, so `filter: url()` only sees the layer's own empty content. This is
  deliberate and safe *because* that layer carries no content and no fill — a browser that
  bends nothing draws nothing wrong. Design so the ripple is a bonus, never the point.
- **`prefers-reduced-transparency: reduce`** hides the frost and takes the fill to 94%.
  Already in the utilities.
- **No `backdrop-filter` support** falls back to a 90% wash, which is what the landing uses
  today anyway. Already in the utilities.
- **Cost is negligible at this scale.** At 390px under 6× CPU throttle: the glass page ran
  58.8 fps, ripple off 59.2, no frost at all 56.5, and the plain landing 56.0. The glass
  page was *not slower* than the page it would have replaced. It only costs while on
  screen. A low-end Android has not been measured.

---

## 6. Applying it to a component

Two things beyond dropping the layers in.

**Give the component a `finish` prop rather than a fork.** `branch-panels.tsx` on the
branch takes `finish?: "tint" | "glass"` defaulting to `"tint"`, so the existing pages stay
byte-identical while the glass version is judged. Do the same for anything on a live page.
It is also how the option to drop the whole thing is kept.

**Glass usually means turning the old protection down.** A frosted pane over an
already-bleached field is invisible, so applying it meant the marquee's wash went 22% →
10%, its solid desktop column became a soft vignette, and both of its white edge fades were
switched off. The host needs props for this; the carousel gained `washClassName`,
`columnWash`, `topFade`, `bottomFade` and `priority`. **Expect to weaken the thing behind
the glass, and expect that to be most of the work.**

A related catch: if the glass surface comes first in the DOM, its backdrop's images take
the preload priority and the real content's do not. On the glass page the marquee's tiles
were fetched ahead of the two branch artworks — 1.0s against 2.2s on a 1.6Mbps line, the
cards painting as raw brand colour meanwhile. Hence `priority={false}` on the backdrop and
`fetchPriority="high"` on the cards.

---

## 7. Verification

None of this is judgeable from CSS. The harness is in `.claude/skills/web-verify`.

```
node .claude/skills/web-verify/audit.js <url> <outDir>
$env:INK_REDUCED=1; $env:INK_TAB=2; node .claude/skills/web-verify/ink.js <url> 390 844
$env:INK_CSS="tmp\candidate.css"; node .claude/skills/web-verify/ink.js <url> 390 844
$env:ROUTES="/,/ateliere"; node .claude/skills/web-verify/hittest.js <baseUrl>
```

- **`audit.js` reports `contrast failures: none` on text over imagery.** It cannot see it.
  Measure rendered ink with `ink.js`, which screenshots twice — once normally, once with
  the ink set to `transparent` — and reads the same glyph-core pixels in both.
- **`INK_CSS=<file>` injects a candidate stylesheet into the built page**, which is how the
  chip tints were chosen without a rebuild per value. Anything that passes that way must
  then be built and measured again for real.
- **Then open the screenshot yourself.** Every real defect in this project was either
  invisible to the harness or introduced by trusting a number.
- **Targets:** rendered ink ≥ 4.5:1 at every viewport in both interaction states — the
  glass page's worst glyph measured 6.9:1 at 1440 and 7.5:1 at 390, so there is no reason
  to accept anything marginal; no horizontal overflow at 320px; the pane's outer 10px must
  not move when the refraction is toggled on and off; and photographs must still read as
  photographs through the pane at 390px, by eye.

---

## 8. The field on this site

Zero uses of `backdrop-filter` exist in `src/` today — every text-over-imagery problem here
is solved with opacity and gradients. So any application is a first, not a migration, and
should go one surface at a time behind a prop.

Ranked against §1: what is behind it, how much text it carries, whether it is transient.

### Fits the material

| Surface | File | Why |
|---|---|---|
| **The notification banner, collapsed** | `letter-bell.tsx` | Fixed over the marquee's photographs, opaque `bg-card` today, **transient** — arrives once per first visit, toggled by the bell. Short text. The iOS-notification shape the material was designed for; the best fit on the site. |
| **The bell button** | `letter-bell.tsx` | Fixed top-right over photographs, opaque today. An icon, so no ink-rule problem at all. Small persistent chrome over imagery — the other classic fit. |
| **`/ateliere` hero top bar** | `hero-carousel.tsx` | Back link and wordmark sit **directly on the photograph with no scrim of their own**, protected only by the stage-wide wash. Two short strings. Glass here both looks right and adds protection they currently lack. |
| **The landing's branch cards** | `branch-panels.tsx` | Photographs with a label each. Already built and measured on the branch: a clear lip at 25% under the open label, a tinted chip at 36% sky / 32% gold for the spine, 5px blur. Their `mix-blend-multiply` veil must become a plain wash first — trap 1. |

### Worth trying, with care

| Surface | File | The catch |
|---|---|---|
| **Filmstrip, unfocused cards** | `hero-carousel.tsx` | They recede behind a flat `bg-stage/30` wash over their own thumbnails. Glass would let them recede *and* stay photographs. No text, so no ink rule. Low risk. |
| **The headline's credit/meta cover** | `hero-carousel.tsx` | Already a gradient band behind short mono labels on a photograph. Check those labels' ink first — mono meta lines are exactly the mid-tone text §2 warns about. |
| **`/blajhunt` trail cards** | `trail-swipe.tsx` | They occlude the decorative wavy route line; glass would let the route run *through* the card, which is a genuinely nice idea. But they carry real text, so this is the §1 rule-2 borderline. Try one, judge by eye, be willing to drop it. |

### Do not

| Surface | Why not |
|---|---|
| **The welcome letter's reading surface** | Tried and rejected on this site already. Paper does not move while you read it. |
| **`/ateliere/[slug]` content sheet** | Long-form reading surface. Same rule. |
| **`/blajhunt` and `/blajhunt/[slug]` hero text** | The field behind is a generated shader gradient — flat colour, nothing to see through. A blur there renders a slightly different shade of the same gradient at real cost. |
| **The landing copy block** | This is the experiment that was run and judged. Do not re-propose it. |
| **`/blajhunt/[slug]` glyph tile, station badges, score chips** | All sit on flat gradient plates, not imagery. Same reason. |

---

## 9. Buttons

"All the buttons" cannot be one treatment, and the reason is §1 rule 1. Half this site's
buttons sit on photographs and half sit on flat token colour or a generated shader
gradient, and the material behaves completely differently on each.

| Button | Where | Behind it |
|---|---|---|
| Hero CTA, and the bordered placeholder beside it | `/ateliere` (`hero-carousel.tsx`) | **a photograph** |
| Back link "Înapoi" + wordmark, top bar | `/ateliere` (`hero-carousel.tsx`) | **a photograph**, no scrim of its own |
| The bell | every page (`letter-bell.tsx`) | **the marquee's photographs** |
| "Descoperă traseul" CTA, "Acasă" back link | `/blajhunt` | a generated shader gradient — flat |
| "Deschide în Maps", points chip, back link | `/blajhunt/[slug]` | a static CSS gradient — flat |
| Back link, tag chips, disabled signup | `/ateliere/[slug]` | `bg-stage`, a flat token |

**Two variants, and the difference is whether the frost is there at all.**

- **Over imagery or moving content — the full stack.** Frost, fill, bevel, optionally the
  refraction. The material doing its job.
- **Over a flat field — fill and bevel only, no `glass-frost`.** A backdrop blur over a
  flat colour produces the same flat colour at the cost of a compositing layer. Drop it and
  the look survives, because on a button the look comes from the translucent tinted fill
  and the directional bevel, not from the blur. Leave `saturate()` off too; it has nothing
  to work on.

**The unifying thing across all buttons is the bevel and the fill, not the backdrop
filter.** If every button on the site should feel like one family, that is the part to
standardise.

### The primary-CTA problem

The site's primary buttons are `bg-primary` — sky — with a near-white label. §2 cuts both
ways: near-white ink needs a backdrop luminance **≤ 0.17**, and a pale translucent fill
sits far above that. **A white-labelled button cannot become glass without changing its
label to near-black**, and changing a primary CTA's label colour changes what the button
is. Three honest options:

1. **Leave primary CTAs solid.** Glass goes on chrome and secondary actions only. This is
   what Apple does — the primary action stays the most solid thing on screen, because a
   call to action wants to read as the most pressable object in view, and translucency
   works against exactly that.
2. **Convert them to pale tinted glass with a near-black label** — the `--glass-sky` /
   `--glass-gold` fills at chip density (32–48%), already proven to hold near-black text
   over photographs. Handsome, and a real change of identity.
3. **Glass only on CTAs that sit over photographs**, solid elsewhere. Coherent by context
   rather than by component, and harder to explain to whoever maintains it next.

Option 1 is the recommendation, with full glass for back links, the bell, chips and the
bordered/secondary buttons. That gets glass buttons throughout the site without spending
the one affordance the site cannot afford to weaken. **It is a design decision, though, not
a finish swap — it belongs to whoever owns the look, not to the agent implementing it.**

### Three things buttons specifically need

- **Touch targets stay ≥44px**, and the `focus-visible` ring must still read against a
  translucent fill. Its offset resolves against `--background`, so it survives, but check
  it on a dark photograph rather than assuming.
- **A press state has to darken the fill**, not just move the button. On a solid button the
  pressed state is obvious; on a translucent one a four-point tint change is easy to miss.
  And `hover:` does not exist on a phone (trap 7), so the press state is the only feedback
  most visitors get.
- **Many small backdrop filters is a different question from two big ones.** The glass page
  ran two panes and cost nothing (§5); a dozen glass buttons on screen at once has not been
  measured. The flat-field variant costs nothing by construction, which is another reason
  to use it wherever the backdrop is flat.

---

## 10. A prompt for whoever applies this

> Apply the frosted-glass material specified in `GLASS.md` to <the surfaces>. Read the
> file in full first — particularly §1 (when the material earns its place), §2 (the ink
> rule), §4 (seven silent traps) and §9 (why buttons are two different problems). Nearly
> everything in it was learned by measurement, and several items cost an hour each.
>
> **The recipe already exists — copy it, do not rewrite it.** From branch
> `worktree-glass`: the `GLASS` block at the end of `src/app/globals.css`, and
> `src/components/ui/glass-filter.tsx`. Every token they reference exists on master.
> Render `<GlassFilter />` once per page that uses `glass-liquid`.
>
> **The landing's branch cards** are already built and measured there — see the
> `finish="glass"` path in `src/components/ui/branch-panels.tsx`. Port it. The one thing
> that must change with it: the cards' `mix-blend-multiply` accent veil has to become a
> plain wash, or **every** SVG backdrop filter on the page silently stops working (trap 1,
> measured 0.0% against 22%).
>
> **Buttons** split by what is behind them — see the table in §9. Over photographs use the
> full stack; over flat token colours or the shader field use fill and bevel with **no**
> `glass-frost`. Leave primary CTAs solid unless the owner of the look says otherwise; §9
> explains why, and that call is theirs, not yours — ask with a screenshot rather than
> deciding.
>
> **Non-negotiable:** gate everything behind a prop with the current look as the default,
> so live pages stay byte-identical until each change is approved. Contrast is not
> judgeable from CSS — measure rendered ink with `ink.js` (`INK_REDUCED=1`, and
> `INK_CSS=<file>` to try candidate values without a rebuild), run `audit.js` after every
> change, then open the screenshot yourself. Targets are in §7.
>
> Mobile at 390px is the target device, not an adaptation. Every iPhone gets frost and fill
> with no refraction — design so the ripple is a bonus. Show screenshots and let the owner
> judge; the creative call is theirs.
