"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The landing fold's two branches, as one expanding pair.
 *
 * Adapted from `HoverExpand_001` / Skiper52 (21st.dev). What survived is the
 * idea — one panel open, the rest as spines, driven by hover. Everything else
 * was rebuilt, because the original is a nine-image desktop gallery and this is
 * a two-choice router that has to work first on a 390px phone:
 *
 * - **The four `swiper/css` imports are gone.** The original file imports
 *   `swiper/css`, `effect-creative`, `pagination` and `autoplay` and never uses
 *   Swiper once — they are leftovers from the file it was cut out of. Nothing
 *   here needs that package, so it is not installed.
 * - **`flexGrow`, not `width` in rem.** The original animates fixed `5rem` and
 *   `24rem` widths, which at 390px would overflow the screen before the second
 *   panel existed. Growing against `flex-basis: 0` means the pair always fills
 *   its column exactly, at 320px and at 1440.
 * - **Hover cannot be the only way in.** `hover:` compiles under
 *   `@media (hover: hover)` and does not exist on a phone, so on a touch device
 *   the original's collapsed panels would never open at all. Here the pair
 *   alternates on its own until the visitor does anything — see AUTO below.
 * - Keyboard focus opens a panel too. The original has no focus handling, so a
 *   keyboard user would tab onto a 5rem spine with no idea what it was.
 *
 * Both panels are links at all times. Tapping one navigates; it is never a
 * "first tap opens, second tap follows" control, which is the thing that makes
 * carousels feel broken on a phone.
 */

/**
 * AUTO-ALTERNATION. The pair swaps every 2.6s so a phone sees both states
 * without a hover it does not have, and **stops for good at the first sign of
 * a human** — pointer, touch, wheel, key or scroll.
 *
 * Stopping is the whole reason this is not a WCAG 2.2.2 problem. Motion over
 * 5s alongside other content needs a pause control; motion that ends the
 * moment you touch anything, and that never restarts, does not. That matters
 * here specifically because the marquee behind this pair is already an
 * accepted 2.2.2 deviation (SPEC D10) — a second uncontrolled loop on the same
 * fold would be compounding a deviation, not repeating one.
 *
 * `prefers-reduced-motion` skips it entirely and the panels do not animate at
 * all. The CSS block in globals.css cannot reach this: it clamps CSS
 * animation and transition durations, and this is neither.
 */
const SWAP_MS = 1500;

/**
 * ONE MOTION. Every animating part of a panel — its width, the label's box and
 * each individual letter — runs on this single spring, started at the same
 * instant, with no delay anywhere.
 *
 * That replaced a staged version that read as three separate moves with pauses
 * between them. The sketch it came from showed three frames, but they were
 * illustrating what the TEXT does, not marking keyframes to hold: scheduling
 * the width to start 200ms after the letters turned an illustration into a
 * stutter.
 *
 * A shared spring still gives the same reading — the word goes horizontal and
 * is clipped while the panel is still opening — because a spring covers most
 * of its travel early, so the letters are near their destination while the
 * wider box is still catching up. The middle frame falls out of the physics
 * instead of being timed by hand, and nothing ever waits.
 *
 * Sharing one object also keeps the parts locked together. Two transitions of
 * different durations drift apart at every frame between the endpoints, and
 * that drift is what "mechanical" actually looks like.
 *
 * `visualDuration` is the time to REACH the target, not the time to settle, so
 * 0.34 reads as about a third of a second whatever the bounce does afterwards.
 * The bounce is small on purpose: this is a panel resizing, not a toy.
 */
const MOTION = {
  type: "spring",
  visualDuration: 0.34,
  bounce: 0.12,
} as const;

/** Expanded:collapsed ratio. 3.4 : 1 leaves the spine 76px at 390 and 60px at
 *  320 — enough for the initial plus its vertical label, and no more. */
const GROW_ACTIVE = 3.4;
const GROW_RESTING = 1;

/** How long a tapped spine gets to open before the navigation goes. A little
 *  past the spring's visual duration: long enough to read as a finished
 *  gesture, short enough not to feel like a wait. */
const PREVIEW_MS = 470;

/**
 * A letter's head start, per position in the word.
 *
 * Without it every glyph interpolates between its stacked spot and its inline
 * spot on the same clock, and because glyph 0 barely moves while glyph 7
 * crosses the whole panel, the word spends its flight as a diagonal staircase.
 * Geometrically correct, and it reads as letters tumbling.
 *
 * A small stagger turns that into a fold: the front of the word is already
 * lying down while the tail is still standing, so the stack pours into the
 * line instead of smearing into it. 14ms is deliberately under a fifth of the
 * spring's own duration — enough to give the motion a direction, not enough to
 * read as eight separate animations, which is the failure this whole section
 * has been walking back from.
 *
 * It applies to the OPENING panel only, and that is a correctness rule, not a
 * preference. An opening panel's left edge is pinned and only its right edge
 * travels, so a lagging letter is always still inside it. A CLOSING panel on
 * the right of the pair has the opposite geometry: its left edge sweeps 274px
 * inward at lg, and letters held back by a delay were left outside it and
 * clipped by `overflow-hidden` — the tail of the word simply vanished
 * mid-flight. With no delay the letters and the edge share one spring and stay
 * in step. Measured: 56px of escape past the left edge at 166ms, now 0.
 */
const STAGGER = 0.014;

export type BranchPanel = {
  href: string;
  /** The word. It is the link's accessible name and the expanded label. */
  label: string;
  image: string;
  tint: "lapis" | "gold";
};

/**
 * Tints. A GREY PHOTOGRAPH, with the accent laid over it as a partial multiply.
 *
 * It used to be the other way round — an opaque accent field with the picture
 * multiplied *into* it — and that is a duotone by construction. This matters
 * more than it sounds: multiplying anything into a saturated base leaves every
 * pixel carrying the base's hue, so there is NO alpha anywhere in that stack
 * that makes the panel less colourful. Turning the numbers down twice only made
 * it a darker gold; the user said "still too colored" both times, correctly.
 * The colour was structural, not a value.
 *
 * So the picture is now a plain `grayscale` layer at full opacity — a real
 * photograph, in its own tonal range — and the accent sits above it at
 * `mix-blend-multiply` with alpha 30%. A partial multiply keeps the neutral
 * channel alive instead of crushing it: lapis at 30% multiplies the red channel
 * by 0.74 rather than to 0.14, which is exactly the difference between "tinted
 * photograph" and "colour chip". ONE DIAL — `veil` — now controls how coloured
 * the pair is, and it does not fight the ink.
 *
 * The Blajhunt art is the case that proves it. It is a warm, light, fine-lined
 * treasure map; under the old duotone its narrow tonal range flattened into a
 * near-solid `--contrast` rectangle and the buildings disappeared. Under the
 * veil the parchment reads as parchment and the linework survives.
 *
 * **The ink's floor is the cover, not the veil — and the cover is the PAGE
 * COLOUR, not the accent.** It used to be the accent at these same alphas, and
 * that worked only because sky-400 was brighter than most of the photograph:
 * laid over the picture it LIFTED the backdrop under the ink. Lapis and gilt
 * are both darker than the picture, so the same layer painted with them can
 * only sink it — on the first lapis build the open "Ateliere" label measured
 * 4.50:1 and the gilt spine 5.35:1, down from the sky numbers. A cover that
 * has to protect dark ink must be light (SPEC 6.1b), and `--background` is
 * the right light: the foot of an open panel fades toward the page it sits on
 * rather than toward a third colour. Sized per state: a
 * gradient over the bottom 3/5 when the panel is open and its label sits at the
 * foot, and a FLAT wash over the whole spine, because the vertical stack runs
 * well above the 3/5 line — exactly where a bottom-up gradient has faded to
 * nothing. The gradient reaches transparent inside its own box by construction;
 * a scrim still opaque at its own edge draws a hard line across the layout, and
 * that has shipped three times in this project.
 *
 * **THE SPINE WASH IS 75%, AND IT IS NOT A PLACE TO SAVE COVER.** It went to
 * 36% in the same pass that cut everything else, and the next photograph broke
 * it: the workshops art delivered 9 Sep has two figures in black habits dead
 * centre, and a spine keeps only the middle ~30% of the frame, so the vertical
 * mark landed on near-black — 2.36:1 against a backdrop of L=0.075 under the
 * sky wash, a real failure on a real build. A sweep put the sky threshold at
 * 68% (4.66:1, L=0.197), which clears the 0.19 floor by 0.007 and would not
 * survive the next re-encode, let alone the next photograph; 75% measured
 * 5.44:1 at L=0.232. The number was kept when the wash became bone: bone lifts
 * harder than sky did, so the same 75% now puts the spine letters at 12.5:1
 * over the same black habits — and a floor set from the artwork currently in
 * the folder is still not a floor.
 *
 * Both tints carry it, though gold measured fine at 36% — the map is light.
 * Gold art will not always be parchment. The open card keeps the reduced
 * values, because that is the state the "too coloured" complaint was actually
 * about; a spine is 76-115px of chip with a word on it and has, as the note
 * above says, almost no photograph to lose. Under a 75% bone wash the spine
 * reads as pale paper carrying the veil's tint, which is the hierarchy the
 * pair wants: the open panel is the picture, the spine is the label.
 *
 * MEASURED, not computed — glyph-core rendered ink (SPEC 6.2) over the real
 * artwork, both panels, both states, at 320/390/1440, with the open panel
 * forced through ink.js's `INK_TABTO` / `INK_HOVER` so the state is a fact and
 * not a race against the 1.5s auto-swap. Worst per state, lapis + gilt with
 * the bone cover, on the second workshops photograph (9 Sep):
 *
 *   open lapis 6.19:1 · lapis spine 12.50:1 · open gilt 6.88:1 · gilt spine 13.18:1
 *
 * Under Sunlit Sky's accent cover the same photograph read 5.53 / 5.44 / 6.89
 * / 11.20, and the first photograph a full 3 points higher on the sky panel —
 * the clearest statement available that these numbers describe ARTWORK and
 * not this file. 1440 binds on both open panels: they are widest there, so
 * `object-cover` crops least and the label meets the most of the frame. With
 * the accent cover under lapis, before the bone cover, the open "Ateliere"
 * label had measured 4.50:1 — the cover's colour, not its alpha, was the
 * whole difference.
 *
 * That margin is LARGER than the duotone's was, which is the counter-intuitive
 * part and worth stating plainly: a hand-computed worst case for this stack said
 * the sky label would land at 2.6:1, because it assumed a dark pixel under the
 * glyphs. The actual pixels there are a light wooden table. **The arithmetic was
 * wrong and the measurement corrected it** — which is the whole reason SPEC 6.2
 * exists. The corollary is that this margin belongs to THIS photograph: it is
 * not a property of the alphas, and swapping the workshops art for something
 * dark in its lower-left re-opens the question. Re-run ink.js when the art
 * changes; do not assume these numbers travel.
 */
const TINT = {
  lapis: { field: "bg-primary", veil: "bg-primary/30" },
  gold: { field: "bg-contrast", veil: "bg-contrast/30" },
} as const;

/* The text's cover, shared by both tints — see the block above for why it is
   the page colour and not the accent, and why the spine's is 75%. */
const COVER = {
  scrim: "from-background/42 via-background/20",
  wash: "bg-background/75",
} as const;

export function BranchPanels({
  panels,
  className = "",
}: {
  panels: readonly BranchPanel[];
  className?: string;
}) {
  const reduced = useReducedMotion();
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const previewRef = useRef<number | null>(null);

  const stopAuto = useCallback(() => setAuto(false), []);

  useEffect(
    () => () => {
      if (previewRef.current !== null) window.clearTimeout(previewRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!auto || reduced) return;
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % panels.length),
      SWAP_MS,
    );
    return () => window.clearInterval(id);
  }, [auto, reduced, panels.length]);

  useEffect(() => {
    if (!auto) return;
    const events = ["pointerdown", "touchstart", "wheel", "keydown", "scroll"];
    for (const e of events)
      window.addEventListener(e, stopAuto, { passive: true });
    return () => {
      for (const e of events) window.removeEventListener(e, stopAuto);
    };
  }, [auto, stopAuto]);

  return (
    <ul className={`flex gap-2 ${className}`}>
      {panels.map((panel, i) => {
        const open = active === i;
        const tint = TINT[panel.tint];

        /* The same spring everywhere — see MOTION. Letters additionally take
           a per-position head start; see STAGGER. */
        const move = reduced ? { duration: 0 } : MOTION;
        const letterMove = (k: number) =>
          reduced || !open ? move : { ...MOTION, delay: k * STAGGER };

        return (
          <motion.li
            key={panel.href}
            /* A FLOOR, not min-w-0. At 200% zoom on a 390px phone the column
               is 147px, and 3.4:1 of that left the spine 32px — narrower than
               its own 16px-a-side padding, so the vertical label had nothing
               to sit in. 52px is the point where the glyph column plus the
               spine's own padding still fit, and at 147px the pair is
               52 + 8 + 87 = 147 exactly. Wider than 320px it never binds. */
            className="short:h-40 relative h-52 min-w-[3.25rem] sm:h-64 lg:h-72"
            style={{ flexBasis: 0, flexShrink: 1 }}
            animate={{ flexGrow: open ? GROW_ACTIVE : GROW_RESTING }}
            transition={move}
          >
            <Link
              href={panel.href}
              transitionTypes={["nav-forward"]}
              className="shadow-card focus-visible:ring-ring focus-visible:ring-offset-background relative block size-full overflow-hidden rounded-2xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              onPointerEnter={(e) => {
                /* Mouse only. A touch "enter" fires just before the tap that
                   is already navigating, so reacting to it would flip the
                   panel open under the finger on the way out of the page. */
                if (e.pointerType !== "mouse") return;
                setAuto(false);
                setActive(i);
              }}
              onFocus={(e) => {
                /* KEYBOARD focus only, and this is load-bearing rather than
                   tidy. Focus fires before click, so on a touch device the tap
                   was focusing the anchor, expanding the panel, and leaving the
                   click handler below to find `open` already true — which is
                   its "already open, just go" path. The tap-to-preview never
                   ran once, and the panel looked like it navigated instantly.
                   `:focus-visible` is false for pointer-driven focus, which is
                   exactly the distinction needed. */
                if (!e.currentTarget.matches(":focus-visible")) return;
                setAuto(false);
                setActive(i);
              }}
              onClick={(e) => {
                /* Tapping a SPINE plays its expansion first, then navigates —
                   the animation is the point, and it is over before the next
                   page could have painted anyway. An already-open panel just
                   goes, and so does everything under reduced motion.

                   Modifier and middle clicks are let through untouched, or
                   "open in a new tab" would silently become "expand a panel
                   and then navigate this one". */
                if (open || reduced) return;
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                if (e.button !== 0) return;
                if (previewRef.current !== null) return;

                e.preventDefault();
                setAuto(false);
                setActive(i);
                previewRef.current = window.setTimeout(() => {
                  previewRef.current = null;
                  router.push(panel.href, {
                    transitionTypes: ["nav-forward"],
                  });
                }, PREVIEW_MS);
              }}
            >
              {/* The tint stack. All three are decorative; the label carries
                the meaning and lives above them. */}
              <span
                aria-hidden="true"
                className={`absolute inset-0 ${tint.field}`}
              />
              {/* Decorative: the visible label is real text in both states and
                is already the link's accessible name, so alt text here would
                only announce the same destination twice. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={panel.image}
                alt=""
                width={800}
                height={1000}
                className="absolute inset-0 size-full object-cover grayscale"
              />
              <span
                aria-hidden="true"
                className={`absolute inset-0 mix-blend-multiply ${tint.veil}`}
              />
              {/* The text's cover, per state — see TINT above.
                Open: a gradient over the bottom 3/5, under the label, reaching
                transparent at its own top edge by construction. A gradient
                still opaque where its box ends draws a hard line across the
                layout, which has shipped three times in this project.
                Spine: a FLAT wash over the whole panel, not a gradient. The
                stack is 169px of a 264px panel at lg, so its head reaches well
                above the 3/5 line — exactly where a bottom-up gradient has
                faded to nothing, leaving the top letters on raw photograph. A
                52px spine has no picture worth protecting anyway. */}
              <span
                aria-hidden="true"
                className={
                  open
                    ? `absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t ${COVER.scrim} to-transparent`
                    : `absolute inset-0 ${COVER.wash}`
                }
              />

              {/* THE LABEL, one set of letter spans in both states.
                
                The letters are never re-rendered as a different element and
                never cross-fade — each glyph is a `layout` child, so framer
                MEASURES its stacked position and its inline position and flies
                it between the two on a transform. That is what makes the "A
                collapses onto the word and comes down" motion read as one
                object moving rather than two labels swapping.

                Their container is a PLAIN span, deliberately. It used to carry
                `layout` too, and a glyph then had two projections multiplied
                together — its own, and its parent's 21x169 box scaling to
                87x23. Any letter whose delay put it out of phase with that
                parent was thrown clear of the panel: 64px below the bottom
                edge at 1440, clipped away by `overflow-hidden`. With a static
                parent each glyph simply flies from its old viewport box to its
                new one, which is all this ever needed.

                The initial is not a separate badge any more: it is simply the
                word's first letter, scaled up while stacked. That is why
                `BranchPanel` no longer carries an `initial` — it was the same
                character twice, and the two could drift.

                Stacked upright, not `writing-mode: vertical-rl`. Rotated
                glyphs cannot fly into a horizontal word: they would have to
                un-rotate mid-flight, which is a second motion on top of the
                one this whole component exists to get right.

                The row keeps the bottom left corner of an open panel; the
                mark is centred in both axes of a spine. Anchoring the mark to
                the panel's foot, as it was, put it 47px low in a 288px panel at
                lg — the same complaint the previous top-anchored version had,
                mirrored. Centring costs a little on the flight (every letter
                now travels the half-panel to the row instead of the tail
                staying put), which is why the panel height and the mark were
                sized together: see below. */}
              <span
                className={`text-foreground absolute inset-0 flex flex-col ${open ? "justify-end px-4 pt-4 pb-4 short:px-3" : "justify-center p-3"}`}
              >
                <span
                  className={`font-display flex leading-none font-semibold ${open ? "text-h3 short:text-body flex-row items-end" : "text-body short:text-ui flex-col items-center gap-[0.3em] uppercase short:gap-[0.2em]"}`}
                >
                  {[...panel.label].map((glyph, k) => (
                    <motion.span
                      layout
                      key={k}
                      transition={letterMove(k)}
                      /* Both sizes are RATIOS of their container's step, not
                         ramp steps of their own. That is not style: the initial
                         was `text-h2` once, and `--text-h2` is fluid while the
                         steps around it are fixed, so the pair held its
                         relationship only at phone widths — by 1440 the initial
                         was 44px against a stack still at 20px and had come
                         loose from its own word. An `em` is the same proportion
                         everywhere.

                         The two states are deliberately NOT one typographic
                         idea. Three passes were spent trying to balance them by
                         making the stack heavier, then bigger, then lowercase,
                         and all three failed the same way: a column of letters
                         at reading size looks like a word that fell over. It is
                         set as a MARK instead — small tracked capitals under one
                         large initial, 16px against 35.2px — which is what a
                         spine is for. The open row keeps its own scale and is
                         simply the name, 23px and sentence case.

                         THE MARK AND THE PANEL HEIGHT ARE ONE DECISION, and
                         they were re-taken together on 8 Sep when the longer
                         lead landed. The fold is bottom-anchored, so the copy
                         had nowhere to grow but upward and off the top of a
                         short phone; the room came from here.

                         The panel went `h-60` -> `h-52` (240px -> 208px) on
                         PHONES ONLY — `sm:` and `lg:` measured 56px of slack
                         and were left alone. At the old settings the mark was
                         194px, which does not fit 208px once the spine's own
                         24px of padding is counted, so the mark came down with
                         the box: initial 2.2em -> 2em, tracking 0.42em ->
                         0.3em, giving 178px.

                         That is counter-intuitively MORE air, not less: 30px in
                         a 208px panel against the 23px it had in 240px, because
                         the mark shrank proportionally harder than the box did.
                         Measured, not derived — 178px of 208 at both 320 and
                         390, no clipping at any width, and landscape still fits
                         at 129 of 160.

                         The tracking is the container's `gap`, not
                         `letter-spacing`: each glyph is its own block, so
                         `letter-spacing` would add its space AFTER the glyph and
                         push every centred letter off-axis by half of it. The
                         gap is in `em` so it follows the step down in `short:`
                         on its own.

                         `short:` drops the whole mark a step to `--text-ui`
                         and tightens the gap, because the landscape panel did
                         NOT grow — it is 160px and constrained by a 390px-tall
                         viewport, not by the design. 129px of a 136px content
                         box. */
                      className={
                        open
                          ? "block text-[1.15em]"
                          : k === 0
                            ? "short:text-[1.5em] block text-[2em]"
                            : "block"
                      }
                    >
                      {glyph}
                    </motion.span>
                  ))}
                </span>
              </span>
            </Link>
          </motion.li>
        );
      })}
    </ul>
  );
}
