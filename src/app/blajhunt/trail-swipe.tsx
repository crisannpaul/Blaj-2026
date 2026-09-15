"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { STOP_GLYPHS, StopGlyph } from "@/components/ui/stop-glyphs";
import { mapsUrl, placeByTitle } from "@/lib/blajhunt-places";
import type { BlajhuntStop, BlajhuntTerminal } from "@/lib/blajhunt-stops";
import { cn } from "@/lib/utils";
import styles from "./trail-swipe.module.css";

/**
 * TrailSwipe — the /blajhunt roadmap as a horizontal, swipeable route.
 *
 * The vertical trail shows six things at once and gives each of them a card
 * 315px wide and about 150px tall. This shows ONE, which buys back enough room
 * to fold the stop's own page into the card: the drawing at full size, the
 * standfirst, a paragraph of context, the proofs, the points and the Maps
 * link. The detail page stays for the rest of the history.
 *
 * ── The road runs UNDER the cards ───────────────────────────────────────────
 * The route is one continuous wave spanning the whole track, painted beneath
 * the cards. The cards are opaque, so each one hides the stretch of road it
 * stands on and what you actually see is the arc crossing each gap. That is
 * why the gaps are large — `--card-w` and `--gap-w` are sized separately in the
 * module — and it is the whole reason the layout has the proportions it has:
 * the road needs somewhere to be visible, and the gap is that somewhere.
 *
 * An earlier build ran the route in an 80px band ABOVE the cards, dipping to
 * touch each card's top edge so the numbered disc sat exactly ON the line.
 * That was tidier in one way and wrong in another: with a band that shallow the
 * road could only ever ripple, and a route that never leaves the top 80px of
 * the page does not read as a road at all. Trading the disc's place on the line
 * for arcs with real amplitude is the deliberate call here; the number is now a
 * station badge inside the card, on the corner of the glyph plate.
 *
 * It sat ON the card's top edge until the badge and the card's 1px border were
 * looked at together: the disc is centred on that edge, so the border ran into
 * it at nine o'clock and out at three, and what you read was a rule struck
 * through the number of the stop you were on. Moving it inside is also 20px of
 * card height back, on a card that had none to spare.
 *
 * ── Why the line does not break at a swipe ──────────────────────────────────
 * The obvious build — one SVG per card — draws ten disconnected squiggles, and
 * the illusion of a route dies at every slide edge. Two properties fix it, and
 * both are structural rather than tuned:
 *
 *   1. Slides are ADJACENT — the space between cards comes from the card being
 *      narrower than its slide, never from a flex `gap` — so slide i's route
 *      layer shares an edge with slide i+1's and there is nowhere for the line
 *      to fall through.
 *   2. Each slide draws its own slice of one curve, and consecutive slices
 *      agree at the seam on BOTH position and tangent. Position: slide i ends
 *      at y = CROSS[i+1] and slide i+1 starts at that same value. Tangent: the
 *      control point next to every boundary shares that boundary's y, so the
 *      curve is horizontal as it arrives and horizontal as it leaves. Equal
 *      value plus equal slope is a C1 join — the seam is not findable by eye,
 *      and it stays that way whatever the numbers in CROSS become.
 *
 * Because the card is centred in its slide, a seam falls in the MIDDLE OF A
 * GAP — the most exposed point on the whole route, where a break would be most
 * obvious. It holds there because of (2), not because it is hidden.
 *
 * The same trick, vertically, is what `how-it-works.tsx` does for its wide
 * layout; this is that idea turned ninety degrees.
 */

export interface TrailSwipeProps {
  steps: BlajhuntStop[];
  start?: BlajhuntTerminal;
  end?: BlajhuntTerminal;
  className?: string;
}

/**
 * Height of the route at each slide BOUNDARY — which, because the card is
 * centred in its slide, is the MIDDLE OF A GAP: the one place the route is
 * fully in the open. In the field's 0-100 user space, smaller is higher.
 *
 * They alternate hard, deep then high, because that is what makes the route
 * read as a road wandering between the stops rather than a rail running past
 * them. Eight values against twelve slides and against the five rows of BEND,
 * so no two gaps get the same arc.
 *
 * Continuity does not depend on any of these — see the header — so they are
 * free to be re-tuned by eye without any risk of reopening a seam.
 */
const CROSS = [76, 22, 68, 31, 84, 18, 71, 36] as const;

const crossAt = (i: number) =>
  CROSS[((i % CROSS.length) + CROSS.length) % CROSS.length];

/**
 * Height at the CENTRE of each slide — behind the card, so almost always
 * hidden. It still matters: it is the hinge the two visible arcs either side
 * of a card turn around, and it is why the route emerges from behind a card at
 * a height that makes sense given where it went in.
 */
const MID = [47, 54, 41, 58, 44] as const;

const midAt = (i: number) => MID[((i % MID.length) + MID.length) % MID.length];

/**
 * Per-slice control-point x positions: [out of the left seam, into the centre,
 * out of the centre, into the right seam]. Five rows against eight CROSS values
 * against twelve slides, so the combination does not repeat over the route and
 * no two rises are quite the same shape.
 *
 * Only the x's vary. Every control point's Y is still pinned to the seam or to
 * the slide centre by the path builder below, which is what keeps every join
 * horizontal — so this table changes how the route WANDERS without being able
 * to reopen a seam. Same reason CROSS is safe to re-tune.
 */
const BEND = [
  [24, 32, 68, 76],
  [18, 36, 62, 82],
  [29, 30, 73, 71],
  [21, 34, 66, 79],
  [15, 39, 70, 86],
] as const;

const bendAt = (i: number) =>
  BEND[((i % BEND.length) + BEND.length) % BEND.length];

/**
 * Slide top padding — the strip of route that stays above the cards.
 *
 * It used to be clearance for the top half of the numbered disc; the disc is
 * inside the card now, so all this buys is somewhere for the shallowest arcs
 * (CROSS bottoms out at 18) to crest in the open rather than behind a card.
 *
 * How far down the route may swing is NOT here. It is `--field-h` in the
 * module, derived from `--gap-w`, because it has to scale with the width of the
 * crosses and a constant in this file cannot.
 */
const TOP = 12;

/**
 * Dashes, not dots, and few of them.
 *
 * TWO THINGS MAKE THESE NUMBERS UNGUESSABLE, and the first version of this
 * comment confidently got both wrong while the line rendered dead solid:
 *
 *   1. With `vector-effect: non-scaling-stroke` the dash pattern is applied in
 *      SCREEN pixels, not in the path's user units. The viewBox stretch does
 *      not scale it up. So "3.8" is 3.8px on screen, not 3.8 x 4.9.
 *   2. `stroke-linecap: round` adds HALF A STROKE-WIDTH of ink at each end of
 *      every dash. At width 5 that is 5px of extra ink per dash, which is also
 *      5px stolen from every gap — so any gap under 5px closes up entirely and
 *      the line is solid with no warning.
 *
 * Rendered ink is therefore (dash + 5) and the rendered gap is (gap - 5). To
 * land ~27px of ink and ~18px of clear air the values have to be around 22 and
 * 23. Verified by counting pixel runs in a screenshot; a measurement of the
 * wrong quantity is what produced the solid line.
 *
 * SIX pairs, not one. A single repeated value draws a machine-perfect row of
 * ticks, which is the one thing a hand-drawn route on a treasure map is not.
 * These are irregular but they still repeat every six dashes, so it reads as
 * pseudorandom without ever being random — the page is statically rendered and
 * a real RNG here would mean the server and the client disagreeing about the
 * dashes and a hydration mismatch.
 */
const STROKE = {
  stroke: "currentColor",
  strokeWidth: 5,
  strokeDasharray: "22 22 17 26 27 20",
  strokeLinecap: "round",
  fill: "none",
  vectorEffect: "non-scaling-stroke",
} as const;

/**
 * The terminal plate's mark. A DIFFERENT drawing from `Pin` above, on purpose.
 *
 * There used to be a second, FILLED pin at 16px inside the node disc. That was
 * right at 16px and wrong at 128px on the plate: blown up it is a heavy solid
 * silhouette in a carousel whose other ten plates hold delicate line drawings,
 * and the two read as belonging to different products. The disc is gone now
 * and this is the only pin left — stroked, in the glyph set's own 48x48 box,
 * at a comparable weight, standing on the same ground line every stop glyph
 * stands on, so the trailhead is visibly one of the set.
 */
const PinMark = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    <path d="M24 41C24 41 37 28 37 20A13 13 0 1 0 11 20C11 28 24 41 24 41Z" />
    <circle cx="24" cy="20" r="4.5" />
    <path d="M4 43H44" />
  </svg>
);

/**
 * The finale's mark, and the reason there are two of these.
 *
 * Both terminals drew `PinMark` and were told apart only by ink colour, so a
 * cold review landed on it in one line: ARRIVING LOOKED LIKE STARTING. The two
 * ends of a treasure hunt are the one pair on this page that must not be
 * confusable, and a hue is not enough to carry that — least of all for the
 * ~8% of the boys at this event who will not see the difference between a grey
 * pin and a gold one.
 *
 * Same 48x48 box, same stroke weight, and standing on the same ground line
 * every stop glyph stands on, so it still belongs to the set.
 */
const FlagMark = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    <path d="M16 43V7" />
    <path d="M16 9H35L30 15.5L35 22H16Z" />
    <path d="M4 43H44" />
  </svg>
);

const Arrow = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

type SwipeNode =
  | { kind: "terminal"; terminal: BlajhuntTerminal; tone: "ink" | "sun" }
  | { kind: "step"; step: BlajhuntStop; number: number };

export default function TrailSwipe({
  steps,
  start,
  end,
  className,
}: TrailSwipeProps) {
  const nodes: SwipeNode[] = [
    ...(start
      ? [{ kind: "terminal" as const, terminal: start, tone: "ink" as const }]
      : []),
    ...steps.map((step, i) => ({ kind: "step" as const, step, number: i + 1 })),
    ...(end
      ? [{ kind: "terminal" as const, terminal: end, tone: "sun" as const }]
      : []),
  ];

  const trackRef = useRef<HTMLOListElement>(null);
  const slideRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(0);

  /**
   * Which slide is in the MIDDLE — measured, not observed.
   *
   * This was an IntersectionObserver with `threshold: 0.6`, reading
   * `entry.isIntersecting`, and it was wrong in a way worth writing down:
   * `isIntersecting` is true for ANY overlap above zero. It has nothing to do
   * with the threshold, which only decides when the callback fires. So every
   * neighbour showing a 27px sliver counted as active, and the loop kept the
   * last one in the entries array.
   *
   * The result was a phantom the arrows inherited: `active` sat one ahead of
   * centre on a phone and two or three ahead on a desktop, where three slides
   * are visible at once — so "next" jumped three stops and "prev" moved
   * FORWARD, because active-1 was still ahead of where you actually were.
   *
   * Nearest-centre is measured instead. It is the only definition that stays
   * true now that slides can be different distances apart and the middle card
   * is scaled, and it is per-frame arithmetic on twelve rects — all reads,
   * batched, no interleaved writes, so no layout thrashing.
   */
  const nearestIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 0;
    const box = track.getBoundingClientRect();
    const mid = box.left + box.width / 2;
    let best = 0;
    let bestDelta = Infinity;
    slideRefs.current.forEach((el, i) => {
      if (!el) return;
      const b = el.getBoundingClientRect();
      const delta = Math.abs(b.left + b.width / 2 - mid);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = i;
      }
    });
    return best;
  }, []);

  /**
   * One pass per animation frame: how centred is each slide, and which is the
   * most centred.
   *
   * The centredness goes onto the element as `--t` by direct style write, NOT
   * through React state. It changes every frame of every swipe, and putting
   * that through a re-render would be twelve components reconciling at 60fps
   * for a number only CSS consumes. `active` is a different kind of value — it
   * changes rarely and the counter and arrows need it — so that one is state.
   */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let raf = 0;
    const measure = () => {
      raf = 0;
      const box = track.getBoundingClientRect();
      const mid = box.left + box.width / 2;
      let best = 0;
      let bestDelta = Infinity;

      slideRefs.current.forEach((el, i) => {
        if (!el) return;
        const b = el.getBoundingClientRect();
        const delta = Math.abs(b.left + b.width / 2 - mid);
        if (delta < bestDelta) {
          bestDelta = delta;
          best = i;
        }
        /* 1 dead centre, falling to 0 one slide away, SMOOTHSTEPPED.

           It was squared, on the theory that holding the lift near the middle
           reads as the card settling. Squared is not symmetric: at half a
           slide out it returns 0.25, so the card stays visibly small for most
           of the travel and then rushes the last third — the ramp itself was
           part of what felt snappy. smoothstep is flat at both ends and
           steepest in the middle, which is the shape of the gesture. */
        const linear = Math.max(0, 1 - delta / b.width);
        const t = linear * linear * (3 - 2 * linear);
        el.style.setProperty("--t", t.toFixed(4));
      });

      setActive((prev) => (prev === best ? prev : best));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /**
   * Travel to a slide, on our own clock.
   *
   * This was `scrollIntoView({ behavior: "smooth" })`, and that is what made
   * the arrows feel like a jump cut: the browser's smooth scroll is short, its
   * duration is not tunable, and its easing is not ours. 620ms of ease-in-out
   * is roughly twice as long, and because the card's lift is driven off the
   * scroll position it now grows over the whole of that travel instead of
   * flipping at the midpoint.
   *
   * `scroll-snap-type` is suspended for the duration. Mandatory snapping
   * fights a scrollLeft written frame by frame — it keeps trying to resolve to
   * a snap point mid-flight — and it is restored on landing, or on any of the
   * events that mean the user has taken over.
   */
  const animRef = useRef(0);

  const endAnim = useCallback(() => {
    const track = trackRef.current;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = 0;
    if (track) track.style.scrollSnapType = "";
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const track = trackRef.current;
      const el = slideRefs.current[i];
      if (!track || !el) return;

      endAnim();

      const target = el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2;
      const to = Math.max(
        0,
        Math.min(target, track.scrollWidth - track.clientWidth),
      );
      const from = track.scrollLeft;
      const delta = to - from;
      if (Math.abs(delta) < 1) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        track.scrollLeft = to;
        return;
      }

      track.style.scrollSnapType = "none";
      const started = performance.now();
      const DURATION = 620;
      // easeInOutCubic: leaves and arrives slowly, quickest in the middle.
      const ease = (p: number) =>
        p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

      const frame = (now: number) => {
        const p = Math.min(1, (now - started) / DURATION);
        track.scrollLeft = from + delta * ease(p);
        if (p < 1) {
          animRef.current = requestAnimationFrame(frame);
        } else {
          endAnim();
        }
      };
      animRef.current = requestAnimationFrame(frame);
    },
    [endAnim],
  );

  /* The moment the user touches the track, the animation stops arguing with
     them and snapping comes back. Without this a swipe during an arrow's
     travel fights it for the rest of the 620ms. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const opts = { passive: true } as const;
    track.addEventListener("pointerdown", endAnim, opts);
    track.addEventListener("wheel", endAnim, opts);
    track.addEventListener("touchstart", endAnim, opts);
    return () => {
      track.removeEventListener("pointerdown", endAnim);
      track.removeEventListener("wheel", endAnim);
      track.removeEventListener("touchstart", endAnim);
      endAnim();
    };
  }, [endAnim]);

  const step = useCallback(
    (delta: -1 | 1) => {
      const from = nearestIndex();
      goTo(Math.min(Math.max(from + delta, 0), nodes.length - 1));
    },
    [goTo, nearestIndex, nodes.length],
  );

  const atStart = active <= 0;
  const atEnd = active >= nodes.length - 1;

  const current = nodes[active];
  const position =
    current?.kind === "step"
      ? `${String(current.number).padStart(2, "0")} / ${String(steps.length).padStart(2, "0")}`
      : current?.kind === "terminal"
        ? current.terminal.label
        : "";

  return (
    <div className={className}>
      {/* ── Controls ────────────────────────────────────────────────────
          Above the track, not floating over it: an arrow sitting on a card
          covers the drawing on a phone, and there is no room beside the track
          at 390px because the track IS the screen.

          They are the click and keyboard alternative the swipe needs — a
          gesture with no other route to the same content is a Vercel NEVER —
          and they are the only way to move the track with a mouse now that the
          scrollbar is hidden. */}
      <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-5 sm:px-8">
        <p
          aria-live="polite"
          className="text-muted-foreground font-ui text-ui shrink-0 font-semibold tracking-[0.14em] tabular-nums uppercase"
        >
          {position}
        </p>

        {/* Where you are along the route, as a line — the same line the band
            draws, straightened out. Decorative: the counter beside it already
            says this in words, so a screen reader gets it once, not twice. */}
        <div
          aria-hidden="true"
          className="bg-foreground/10 relative h-px flex-1 overflow-hidden rounded-full"
        >
          <span
            className="bg-foreground/55 absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${((active + 1) / nodes.length) * 100}%` }}
          />
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={atStart}
            aria-label="Oprirea anterioară"
            className="border-border-strong text-foreground focus-visible:ring-ring focus-visible:ring-offset-background enabled:active:bg-foreground/5 flex size-11 items-center justify-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-35"
          >
            <Arrow className="size-5 rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={atEnd}
            aria-label="Oprirea următoare"
            className="border-border-strong text-foreground focus-visible:ring-ring focus-visible:ring-offset-background enabled:active:bg-foreground/5 flex size-11 items-center justify-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-35"
          >
            <Arrow className="size-5" />
          </button>
        </div>
      </div>

      {/* ── The track ───────────────────────────────────────────────────
          Full-bleed on purpose: the peek only reads as "there is more" if the
          neighbouring card runs off the edge of the screen rather than
          stopping inside a container's padding.

          tabIndex 0 because a scrollable region has to be reachable by
          keyboard even when the browser does not do it for you. */}
      <ol
        ref={trackRef}
        tabIndex={0}
        aria-label="Traseul Blajhunt, oprire cu oprire"
        className={cn(
          styles.track,
          "focus-visible:ring-ring mt-6 focus-visible:ring-2 focus-visible:outline-none",
        )}
      >
        <li aria-hidden="true" className={styles.edge} />

        {nodes.map((node, i) => {
          const first = i === 0;
          const last = i === nodes.length - 1;
          const a = crossAt(i);
          const b = crossAt(i + 1);

          /* In from the left gap, across behind the card, out into the right
             gap. The four x's come from BEND and vary per slice; the y's do
             not — both control points beside a seam carry that seam's y, and
             both beside the centre carry the centre's — so every join in the
             whole route, within a slide and across slides, is horizontal on
             both sides however much the x's wander. */
          const m = midAt(i);
          const [x1, x2, x3, x4] = bendAt(i);
          const enter = `M 0 ${a} C ${x1} ${a}, ${x2} ${m}, 50 ${m}`;
          const leave = `C ${x3} ${m}, ${x4} ${b}, 100 ${b}`;
          const d = (first ? `M 50 ${m}` : enter) + (last ? "" : ` ${leave}`);

          const isActive = i === active;

          const sun = node.kind === "step" && node.step.tone === "sun";
          const glyph =
            node.kind === "step" ? STOP_GLYPHS[node.number - 1] : undefined;
          const place =
            node.kind === "step" ? placeByTitle(node.step.title) : undefined;

          return (
            <li
              key={i}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              /* pb-7 is the lift shadow's reach (offset 15 + spread -12 +
                 half of blur 30 = 18px) plus margin. It used to be pb-9 to
                 catch a card scaled past its own box; the scale tops out at 1
                 now, so nothing but the shadow lands down here — and the
                 track clips this axis, so it has to fit. */
              className={cn(styles.slide, "relative flex flex-col pb-7")}
              style={{ paddingTop: TOP }}
            >
              {/* UNDER the cards, not above them. The route is one continuous
                  wave across the whole track and the cards are opaque objects
                  standing on it, so what you actually see is the arc crossing
                  each gap — the road between two stops — and the card hides the
                  stretch it covers. That occlusion is the reason the gaps had
                  to grow: the route needs somewhere to be visible. */}
              <svg
                aria-hidden="true"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className={cn(styles.route, "text-border-strong/65")}
              >
                <path {...STROKE} d={d} />
              </svg>

              {node.kind === "terminal" ? (
                /* The two ends are not cards: no border, no shadow, no
                   actions. That is the deliberate variation — it is what makes
                   the ten stops between them read as the subject rather than
                   as twelve equal things.

                   But "lighter" was first built as "less", and measured that
                   way it failed: a terminal carries 160px of content in a
                   track the 538px cards size, so 378px of the slide was empty
                   and the first thing anyone saw on scrolling to the route was
                   a void.

                   Centring the block in that space was worse, not better. It
                   halved the void but it pushed the content 180px clear of the
                   node, and on a page whose whole subject is a connected route
                   a waypoint floating away from its own label is the one thing
                   that must not happen. Connection beats symmetry.

                   So the content starts at the node exactly as a card does,
                   and the PLATE takes up the slack: it is decorative, so it is
                   free to be any height, and `flex-1` makes it precisely as
                   tall as the cards leave room for. The terminal is card-height
                   with no void anywhere, and a tall panel with a single pin in
                   it reads as a trailhead — which is what these two are. */
                <div className={cn(styles.card, "relative z-10 mx-auto flex flex-1 flex-col px-3 pt-5 pb-5 text-center")}>
                  <div
                    aria-hidden="true"
                    className={cn(
                      styles.plate,
                      "border-border flex min-h-28 flex-1 items-center justify-center rounded-[calc(var(--radius)-2px)] border",
                      /* The two ends are told apart by INK, and only the
                         finale gets a colour. It used to be sky for the start
                         and gold for the end, which spent the page's scarcest
                         accent on a decorative pin at the exact moment the
                         field, the plates and the chips were all sky too. Ink
                         for the trailhead, gold for the finish — the same
                         progression, one accent instead of two. */
                      node.tone === "sun"
                        ? "text-contrast-text/70"
                        : "text-foreground/55",
                    )}
                  >
                    {/* Sized to the panel it is in, not to the card's glyphs.
                        The plate here grows to ~350px, and a 64px mark in it
                        read as an empty frame with a speck in the middle —
                        which is exactly the "placeholder that looks broken"
                        failure. At 128px it is the subject of its own panel. */}
                    {node.tone === "sun" ? (
                      <FlagMark className="size-32 [stroke-width:1.1]" />
                    ) : (
                      <PinMark className="size-32 [stroke-width:1.1]" />
                    )}
                  </div>
                  <p
                    className={`font-ui text-ui mt-4 font-semibold tracking-[0.14em] uppercase ${
                      node.tone === "sun"
                        ? "text-contrast-text"
                        : "text-muted-foreground"
                    }`}
                  >
                    {node.terminal.label}
                  </p>
                  <p className="text-foreground text-h3 mt-2">
                    {node.terminal.title}
                  </p>
                  {node.terminal.description ? (
                    <p className="text-muted-foreground mt-2">
                      {node.terminal.description}
                    </p>
                  ) : null}
                </div>
              ) : (
                <article
                  className={cn(
                    styles.card,
                    styles.lift,
                    /* flex-1: every card fills its slide, so all ten are the
                       same height and `mt-auto` on the Maps button lands
                       it at the SAME y on every stop. Card heights ran
                       391-480px otherwise — title wrap plus whether the
                       stop has proof chips — and the one control the card
                       exists for moved under the thumb on every swipe. */
                    "bg-card relative mx-auto flex flex-1 flex-col rounded-[var(--radius)] border p-5",
                    sun ? "border-border-strong" : "border-border",
                    /* STACKING ONLY. Both the size and the shadow are
                       continuous now and live in the module, on --t.

                       This branch used to also carry `scale-[1.06]` against
                       `scale-100`, and that was a real defect rather than a
                       duplicate: Tailwind v4's `scale-*` sets the standalone
                       `scale` property, `.card` sets `transform`, and the two
                       COMPOSE. The centred card measured 1.06 x 1.06 = 1.1236
                       — 538px rendering at 604px — with half of the lift
                       arriving as a step at the midpoint. That step is what
                       felt mechanical, and the 30px it added past the slide is
                       what gave the track vertical scroll and clipped the Maps
                       button. See the note on `.card` in the module.

                       `shadow-card` / `shadow-sm` went with it, and they were
                       already dead: `.lift` is unlayered so it outranks a
                       Tailwind utility, and it was the shadow being painted.

                       Still no dimming. The off-centre cards were once
                       `opacity-70`, which looked right and was not: ink.js
                       measured 3.28:1 on the proof chips, 3.57:1 on the Maps
                       button and 3.73:1 on the body copy, all under the 4.5
                       floor, on cards a desktop reader will actually read.
                       `audit.js` said "contrast failures: none" throughout,
                       because opacity is invisible to a CSS-derived number.
                       Emphasis that costs legibility is not emphasis. */
                    isActive ? "z-10" : "",
                  )}
                >
                  {/* The drawing at a size worth looking at. One card per
                      screen is what buys the room for it: on the vertical
                      trail this had to be a 44px tile wedged beside the title,
                      because a full-width card had no room for anything else.

                      88px in a 112px plate, up from 72 in 96. The drawings
                      carry more detail than they used to — four arches under
                      four windows on `college`, a five-lobed canopy on
                      `school` — and detail that cannot be resolved is just
                      noise. Costs 16px of card height, and because this trail
                      is a horizontal carousel that is 16px ONCE, not once per
                      card: measured 1808px to 1824px at 390px (+0.88%) and
                      1686px to 1702px at 1440 (+0.95%). The vertical trail
                      this replaced would have paid it ten times over.

                      No text colour on the plate any more: the glyph paints
                      itself with the `--glyph-gold-*` gilt and no longer
                      inherits `currentColor`. `text-contrast-text/70` here was
                      what made the drawings olive, and leaving it would be a
                      dead class that reads as though it still governs them.

                      The wrapper is here so the station badge can sit on the
                      plate's corner. The badge is a SIBLING of the plate, not a
                      child: the plate is aria-hidden — it is decoration — and
                      the stop's number is not. */}
                  <div className="relative">
                    <div
                      aria-hidden="true"
                      className={cn(
                        styles.plate,
                        "border-border flex h-28 items-center justify-center rounded-[calc(var(--radius)-2px)] border",
                      )}
                    >
                      <StopGlyph
                        name={glyph ?? "cathedral"}
                        className="size-[5.5rem] [stroke-width:1.5]"
                      />
                    </div>
                    {/* The station number. Near-black, not sky: it was one of
                        the three blues stacked here, and it is a label rather
                        than an action. `sun` stops keep the gold, because that
                        tone is what marks the finale.

                        Size and colour in a template literal, never through
                        cn(): tailwind-merge does not know --text-ui exists,
                        reads `text-ui` as a colour and drops one of the pair. */}
                    <span
                      className={`bg-card border-border-strong font-ui text-ui absolute top-2.5 left-2.5 flex size-8 items-center justify-center rounded-full border leading-none font-semibold tabular-nums ${
                        sun ? "text-contrast-text" : "text-foreground"
                      }`}
                    >
                      {String(node.number).padStart(2, "0")}
                    </span>
                    {/* The score, opposite the number, ON the plate.

                        It used to sit at the end of the proof-chip row under
                        `ml-auto`. That worked on eight cards and broke on two:
                        when two chips fill the row, flex-wrap drops the pill
                        onto a second line ALONE, right-aligned against nothing,
                        and the row went from 27.6px to ~61px. Card heights then
                        ran 433-482px, so the Maps button moved ~51px between
                        consecutive stops — the thumb target shifting every time
                        you advance, on the one control the card exists for.

                        Up here it cannot wrap, the row below holds only proofs,
                        every card loses a row of height, and the plate stops
                        being lopsided: number left, drawing centred, score
                        right. */}
                    {typeof node.step.points === "number" ? (
                      <span className="bg-contrast text-foreground font-ui text-ui absolute top-2.5 right-2.5 rounded-full px-2.5 py-1 leading-none font-semibold tabular-nums">
                        {node.step.points}&nbsp;p
                      </span>
                    ) : null}
                  </div>

                  <h3 className="text-h3 text-card-foreground relative mt-4">
                    {place ? (
                      /* A stretched link SCOPED TO THE HEADING, not to the
                         card. On the vertical trail the whole card is the
                         target, because there the card is a teaser and the
                         page behind it is the only place it goes. This card is
                         a destination — it holds a Maps button and its own
                         text — so a card-wide overlay would swallow both.

                         The overlay is needed all the same: a single-line
                         title like "Casa Maniu" is a 25px tap target, which
                         tier 1 flagged on six of the ten cards and which is
                         under the 44px floor by a lot. The overlay takes it to
                         the full card width and, because the growth is a
                         pseudo-element rather than padding, the text does not
                         move. The 12px it gains above lands in the gap under
                         the plate; the 12px below lands on the top edge of the
                         standfirst, which is not interactive, so nothing is
                         stolen from anything.

                         -inset-y-3, not -2.5. The overlay is sized off the
                         H3's line box, which is 21px — NOT the 25px the anchor
                         itself reports, and not the 25px audit.js prints. 2.5
                         (10px a side) gives 41px and quietly misses the floor;
                         3 gives 45px. Measured with elementFromPoint, because
                         neither number is visible from the CSS. */
                      <Link
                        href={`/blajhunt/${place.slug}`}
                        /* THE RING IS ON THE ::after, NOT ON THE LINK.
                           The link is inline, so on a title that wraps — three
                           of the ten do at 390px — Chromium paints a ring
                           around EACH line fragment. The two fragments overlap
                           by about 4px and both dark edges land on top of the
                           words, so focusing the card made its own title the
                           hardest thing on it to read. A cold review caught it;
                           `audit.js` cannot see it, because nothing about the
                           declared CSS is wrong.

                           The overlay is already a single absolutely
                           positioned box covering the whole hit area, so
                           ringing that instead gives exactly one rectangle
                           around exactly the thing that is clickable. */
                        className="focus-visible:after:ring-ring rounded-sm after:absolute after:inset-x-0 after:-inset-y-3 after:rounded-md after:content-[''] focus-visible:outline-none focus-visible:after:ring-2"
                      >
                        {node.step.title}
                        <span
                          aria-hidden="true"
                          className="text-contrast-text ml-1.5 inline-block"
                        >
                          &#8599;
                        </span>
                      </Link>
                    ) : (
                      node.step.title
                    )}
                  </h3>

                  {place ? (
                    /* font-medium, not a sixth type size — the ramp is
                       five steps and adding one is a defect. Weight plus the
                       gap below is enough to split the lead off the history;
                       they were the same size, same leading and 1.44:1 apart
                       in colour, which read as seven undifferentiated lines. */
                    <p className="text-foreground/80 mt-2 font-medium">
                      {place.standfirst}
                    </p>
                  ) : null}

                  {/* One paragraph of the place's own history, clamped. The
                      rest is a tap away on the stop's page — the card is meant
                      to be read standing in the street, not studied. */}
                  {/* mt-4, not mt-2.5. 10px is off the 4/8/12/16 scale, and
                      it also tied the history to the lead as tightly as the
                      lead is tied to the title — related things have to sit
                      closer than unrelated ones. */}
                  {place?.body[0] ? (
                    <p className="text-muted-foreground mt-4 line-clamp-3">
                      {place.body[0]}
                    </p>
                  ) : (
                    <p className="text-muted-foreground mt-4">
                      {node.step.description}
                    </p>
                  )}

                  {/* Proofs only, and the row is gone entirely when a stop
                      has none — an empty flex row still spends its margin. */}
                  {node.step.proofs?.length ? (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <ul className="flex flex-wrap gap-2">
                        {node.step.proofs.map((proof) => (
                          <li
                            key={proof}
                            /* Neutral. These were border-brand/45 on
                               bg-brand/5 with brand ink — a third blue, on a
                               card that already had a blue plate above it and
                               a blue button below it, for a chip that only
                               labels what proof the stop wants. --muted-
                               foreground on --muted is 7.4:1. */
                            className="border-border bg-muted text-muted-foreground font-ui text-ui rounded-full border px-2.5 py-0.5 font-medium tracking-[0.08em] uppercase"
                          >
                            {proof}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {place ? (
                    <a
                      href={mapsUrl(place)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="bg-primary text-primary-foreground font-ui focus-visible:ring-ring focus-visible:ring-offset-card mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-semibold transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.97]"
                    >
                      Deschide în Maps
                      <span aria-hidden="true">&#8599;</span>
                    </a>
                  ) : null}
                </article>
              )}
            </li>
          );
        })}

        <li aria-hidden="true" className={styles.edge} />
      </ol>
    </div>
  );
}
