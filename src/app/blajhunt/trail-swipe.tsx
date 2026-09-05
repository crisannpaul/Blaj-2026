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
 * why the gaps are large — `--card` and `--gap` are sized separately in the
 * module — and it is the whole reason the layout has the proportions it has:
 * the road needs somewhere to be visible, and the gap is that somewhere.
 *
 * An earlier build ran the route in an 80px band ABOVE the cards, dipping to
 * touch each card's top edge so the numbered disc sat exactly ON the line.
 * That was tidier in one way and wrong in another: with a band that shallow the
 * road could only ever ripple, and a route that never leaves the top 80px of
 * the page does not read as a road at all. Trading the disc's place on the line
 * for arcs with real amplitude is the deliberate call here; the disc is now a
 * station number on the card's top edge.
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
 * Slide top padding — clearance for the top half of the numbered disc.
 *
 * How far down the route may swing is NOT here. It is `--field` in the module,
 * derived from `--gap`, because it has to scale with the width of the gap it
 * crosses and a constant in this file cannot.
 */
const TOP = 20;

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
 * 23. Verified by counting pixel runs in a screenshot — see the note in SPEC
 * 6.2; a measurement of the wrong quantity is what produced the solid line.
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

/** tabler-icons "pin", as on the vertical trail. Terminals only; stops count. */
const Pin = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M16 3a1 1 0 0 1 .117 1.993l-.117 .007v4.764l1.894 3.789a1 1 0 0 1 .1 .331l.006 .116v2a1 1 0 0 1 -.883 .993l-.117 .007h-4v4a1 1 0 0 1 -1.993 .117l-.007 -.117v-4h-4a1 1 0 0 1 -.993 -.883l-.007 -.117v-2a1 1 0 0 1 .06 -.34l.046 -.107l1.894 -3.791v-4.762a1 1 0 0 1 -.117 -1.993l.117 -.007h8z" />
  </svg>
);

/**
 * The terminal plate's mark. A DIFFERENT drawing from `Pin` above, on purpose.
 *
 * `Pin` is filled, which is right at 16px inside the node disc and wrong at
 * 128px on the plate: blown up it is a heavy solid silhouette sitting in a
 * carousel whose other ten plates hold delicate line drawings, and the two
 * read as belonging to different products. This is stroked, in the glyph set's
 * own 48x48 box, at a comparable weight, and it stands on the same ground line
 * every stop glyph stands on — so the trailhead is visibly one of the set.
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
        /* 1 dead centre, falling to 0 one slide away. Squared so the lift
           holds near the middle and drops off late, which reads as the card
           settling rather than as a linear ramp. */
        const linear = Math.max(0, 1 - delta / b.width);
        el.style.setProperty("--t", (linear * linear).toFixed(4));
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
            className="bg-brand-text absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none"
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
              className={cn(styles.slide, "relative flex flex-col pb-9")}
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

              {/* On the curve, straddling the card's top edge. Opaque, so it
                  masks the dots it covers and the route reads as opening into
                  a waypoint rather than being interrupted by a badge. */}
              <div
                style={{ top: TOP }}
                /* z-20, above the active card's z-10. The disc is an earlier
                   sibling than the <article>, so at equal z the card wins and
                   the centred card — the only one that is scaled — swallowed
                   the bottom half of its own number. The one node you are meant
                   to be looking at was the one that disappeared.

                   No `ring-stage` any more: the ring existed to mask the dots
                   the disc sat among, and the route no longer passes through
                   here. It is a station number on the card's top edge now, not
                   a point on the line. */
                className="bg-card border-border-strong absolute left-1/2 z-20 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm"
              >
                {node.kind === "terminal" ? (
                  <Pin
                    className={cn(
                      "size-4",
                      node.tone === "sun"
                        ? "text-contrast-text"
                        : "text-foreground",
                    )}
                  />
                ) : (
                  <span
                    className={`font-ui text-ui leading-none font-semibold tabular-nums ${
                      sun ? "text-contrast-text" : "text-brand-text"
                    }`}
                  >
                    {String(node.number).padStart(2, "0")}
                  </span>
                )}
              </div>

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
                <div className={cn(styles.card, "relative z-10 mx-auto flex flex-1 flex-col px-3 pt-8 pb-5 text-center")}>
                  <div
                    aria-hidden="true"
                    className={cn(
                      styles.plate,
                      "border-border flex min-h-28 flex-1 items-center justify-center rounded-[calc(var(--radius)-2px)] border",
                      /* Tied to the route's own two colours rather than to a
                         grey: sky for the start, the finale's gold for the
                         end. A neutral pin here read as a dead placeholder.
                         Alphas match the cards' own glyphs (/70) now that this
                         is a stroke and not a fill — a line drawing at /35 on a
                         pale plate is barely there. */
                      node.tone === "sun"
                        ? "text-contrast-text/70"
                        : "text-brand-text/55",
                    )}
                  >
                    {/* Sized to the panel it is in, not to the card's glyphs.
                        The plate here grows to ~350px, and a 64px mark in it
                        read as an empty frame with a speck in the middle —
                        which is exactly the "placeholder that looks broken"
                        failure. At 128px it is the subject of its own panel. */}
                    <PinMark className="size-32 [stroke-width:1.1]" />
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
                    "bg-card relative mx-auto flex flex-col rounded-[var(--radius)] border p-5 pt-8",
                    sun ? "border-border-strong" : "border-border",
                    /* The middle card is the one you are reading; the others
                       are context. Scale rather than width, so the snap
                       positions, the seam geometry and the node discs are all
                       untouched by it — only paint changes.

                       origin-TOP, not centre: the numbered disc straddles the
                       card's top edge, and a card growing from its middle
                       drags that edge up out from under the disc. Growing
                       downward keeps the node exactly on the line. The slide's
                       pb-9 is the headroom that growth needs.

                       SIZE AND SHADOW ONLY. The off-centre cards were also
                       dimmed to `opacity-70`, which looked right and was not:
                       ink.js measured the rendered result at 3.28:1 on the
                       proof chips, 3.57:1 on the Maps button and 3.73:1 on the
                       body copy, all under the 4.5 floor, on cards that are
                       perfectly readable content a desktop reader will read.
                       `audit.js` said "contrast failures: none" throughout,
                       because opacity is invisible to a CSS-derived number.
                       Emphasis that costs legibility is not emphasis. */
                    isActive
                      ? "shadow-card z-10 scale-[1.06]"
                      : "scale-100 shadow-sm",
                  )}
                >
                  {/* The drawing at a size worth looking at. On the vertical
                      trail this is a 44px tile wedged beside the title,
                      because a full-width card has no room for anything else;
                      one card per screen is what buys it back. */}
                  <div
                    aria-hidden="true"
                    className={cn(
                      styles.plate,
                      "border-border text-contrast-text/70 flex h-28 items-center justify-center rounded-[calc(var(--radius)-2px)] border",
                    )}
                  >
                    <StopGlyph
                      name={glyph ?? "cathedral"}
                      className="size-20 [stroke-width:1.3]"
                    />
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
                        className="focus-visible:ring-ring focus-visible:ring-offset-card rounded-sm after:absolute after:inset-x-0 after:-inset-y-3 after:content-[''] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
                    <p className="text-foreground/80 mt-2">{place.standfirst}</p>
                  ) : null}

                  {/* One paragraph of the place's own history, clamped. The
                      rest is a tap away on the stop's page — the card is meant
                      to be read standing in the street, not studied. */}
                  {place?.body[0] ? (
                    <p className="text-muted-foreground mt-2.5 line-clamp-4">
                      {place.body[0]}
                    </p>
                  ) : (
                    <p className="text-muted-foreground mt-2.5">
                      {node.step.description}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {node.step.proofs?.length ? (
                      <ul className="flex flex-wrap gap-2">
                        {node.step.proofs.map((proof) => (
                          <li
                            key={proof}
                            className="border-brand/45 bg-brand/5 text-brand-text font-ui text-ui rounded-full border px-2.5 py-0.5 font-medium tracking-[0.08em] uppercase"
                          >
                            {proof}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {typeof node.step.points === "number" ? (
                      <span className="bg-contrast text-foreground font-ui text-ui ml-auto shrink-0 rounded-full px-2.5 py-1 font-semibold tabular-nums">
                        {node.step.points}&nbsp;p
                      </span>
                    ) : null}
                  </div>

                  {place ? (
                    <a
                      href={mapsUrl(place)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="bg-primary text-primary-foreground font-ui focus-visible:ring-ring focus-visible:ring-offset-card mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-semibold transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.97]"
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
