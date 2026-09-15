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
 * to fold the stop's own page into the card — and since 15 Sep the card has
 * TWO FACES to do it with. The front is the roadmap: the drawing at full
 * size, the title, a two-line standfirst, the proofs, the points and the Maps
 * button, at the same place on every card. The back is the place's history —
 * the whole of `place.body`, the same text the stop's page carries. A tap
 * turns it; each newly centred card turns over and back once by itself, so
 * the back gets found. The stop page stays as a safety net, the direction
 * being to retire it once the card carries everything. See "The back of the
 * card" below.
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
 * The arrival peek: how long after a stop becomes the centred one its card
 * turns over and back.
 *
 * `active` flips at the MIDPOINT of the travel, not at the end — it is
 * nearest-centre — so on an arrow click the card is still moving for ~310ms of
 * this, and on a flick for ~200. What is left is how long the card RESTS,
 * front up, before it turns itself away. It has been 420 — a cold review
 * measured that at 133ms of rest, "not a pause, the tail of the scroll", with
 * the Maps button turned away on every arrival — and then 1000, ~700ms of
 * rest, which the user saw and found slow: the turn should follow the landing
 * rather than wait on it. 450 puts it about 140ms after the card stops on an
 * arrow click and ~250ms after a flick settles: a beat, not a pause, and the
 * user's call over the review's. The length of the turn itself is PEEK_MS,
 * mirrored by `.peek` in the module; it came down from 1200 at the same time
 * so the whole flourish is over within 1.5s of the card stopping.
 */
const PEEK_DELAY = 450;
const PEEK_MS = 1000;

/**
 * The part of the peek during which the BACK is the face showing, as a
 * fraction of PEEK_MS: the keyframes cross 90deg a little past a quarter of
 * the way in and a little before a fifth of the way from the end. A tap during
 * the peek is read against this: what you see is what you get. Tap the back
 * while it is showing and the card stays on the back; tap the front while it
 * is turning away and the card comes straight back, because that tap was
 * almost certainly reaching for something on the front.
 */
const PEEK_BACK_WINDOW = [0.22, 0.82] as const;

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

/**
 * The Maps button's glyph: a map pin in the same 24-box, 2px-stroke style as
 * `Arrow`. Not Google's mark — that is a four-colour brand asset, and a raw
 * colour outside globals.css is a defect here — but the pin is the one shape
 * everyone reads as "map", and a map is what the button opens.
 */
const MapPin = ({ className }: { className?: string }) => (
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
    <path d="M12 21.5s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10.5" r="2.5" />
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

  /* ── The back of the card ────────────────────────────────────────────────
     Exactly one card is turned at a time and it is the one you turned:
     `flipped` is an index, not a set. A card that leaves the centre goes back
     to its front by itself — `arrive` below resets both values whenever a
     different slide becomes the nearest — so every arrival starts the same
     way, front up.

     `peek` is the arrival flourish. The moment a new stop is centred its card
     turns over and back once, so a first-time visitor learns there is a back
     without being told. It is a CSS animation (`.peek` in the module): the
     class goes on after PEEK_DELAY and comes off on animationend, and a tap
     during it cancels it and turns the card for real. Not under reduced
     motion — there a tap, or Enter on the focused card, is the whole way
     over, and the stop page behind the title link is the safety net. There
     is NO standing sign of the back. There was one for an afternoon — a
     labelled pill on each face — and the user took both off: a card that
     turns when touched, and shows you so on arrival, does not need a button
     saying it does.

     `arrive` is called from the measure loop, at the moment the nearest slide
     changes — an event callback, not an effect body, which is what the React
     Compiler's lint asks for and also simply where the information is. Which
     kind of node the slide holds is read off the element (`data-kind`), so
     this needs nothing from `nodes`, which is rebuilt every render. */
  const [flipped, setFlipped] = useState<number | null>(null);
  const [peek, setPeek] = useState<number | null>(null);
  const peekTimer = useRef(0);
  const peekStart = useRef(0);

  const arrive = useCallback((i: number) => {
    window.clearTimeout(peekTimer.current);
    setFlipped(null);
    setPeek(null);
    if (slideRefs.current[i]?.dataset.kind !== "step") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    peekTimer.current = window.setTimeout(() => {
      peekStart.current = performance.now();
      setPeek(i);
    }, PEEK_DELAY);
  }, []);

  /** Is the back the face showing right now, PEEK_MS-fractions in? Only
      ever called from a tap, hence the callback — a clock read in a plain
      render-scoped helper is what the React Compiler's purity rule stops. */
  const peekShowsBack = useCallback(() => {
    const f = (performance.now() - peekStart.current) / PEEK_MS;
    return f > PEEK_BACK_WINDOW[0] && f < PEEK_BACK_WINDOW[1];
  }, []);

  /* ── The scroll cue on the back ────────────────────────────────────────
     At 320px the back's text box scrolls (see the note on it below), and a
     box that scrolls with no sign of it reads as a card cut off mid-sentence
     — mobile scrollbars are invisible at rest. `data-more` says which edge
     has more behind it and the module fades that edge. Written straight
     onto the element: it changes on every scroll of a box a visitor is
     reading and has no business going through React state. */
  const cueScroll = useCallback((el: HTMLElement) => {
    const scrolls = el.scrollHeight - el.clientHeight > 1;
    const above = el.scrollTop > 1;
    const below = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
    el.dataset.more = !scrolls ? "" : above && below ? "both" : above ? "top" : "bottom";
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const all = () =>
      track.querySelectorAll<HTMLElement>("[data-scrollbox]").forEach(cueScroll);
    all();
    window.addEventListener("resize", all);
    return () => window.removeEventListener("resize", all);
  }, [cueScroll]);

  /* No focus to hand over when the card turns: the ARTICLE is the focusable
     thing (tabIndex 0, Enter/Space turn it, Escape turns it back) and it
     never goes inert — only its faces do — so a keyboard user who turns the
     card keeps their place on it. It used to be a button on each face and a
     focus handoff between them after commit. */
  const turn = useCallback((i: number) => {
    window.clearTimeout(peekTimer.current);
    setPeek(null);
    setFlipped((prev) => (prev === i ? null : i));
  }, []);

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
    let lastBest = -1;
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

      if (best !== lastBest) {
        lastBest = best;
        arrive(best);
      }
      setActive(best);
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
      window.clearTimeout(peekTimer.current);
    };
  }, [arrive]);

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
              data-kind={node.kind}
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
                /* ── A two-faced card ────────────────────────────────────
                   The FRONT is the roadmap's card as it was: the drawing,
                   the title, a two-line standfirst, the proofs and the Maps
                   button. The BACK is the place's history in full
                   (`place.body`, the stop page's own paragraphs); the page
                   stays as a safety net until the card is known to carry
                   everything it does.

                   Why there is a back. The front used to carry the first
                   paragraph of history clamped to three lines under a
                   standfirst that ran one to four, so the proof chips sat at
                   a different height on every card and the Maps button —
                   `mt-auto`, so at least IT held still — had a different
                   amount of air above it each time. Fixing the standfirst to
                   two lines puts the chips and the button at the SAME y on
                   all ten cards; the history that was squeezed out goes on
                   the back, where it gets the whole card instead of three
                   lines of it.

                   Three layers, one job each:
                     .card / .scene (this div)  the width, the --t scale and
                                                the perspective. Never rotates.
                     .flip (the article)        preserve-3d and the rotation:
                                                what the peek animates and what
                                                a tap turns.
                     .face x2                   the paint — background, border,
                                                radius, shadow. backface-
                                                visibility hides whichever one
                                                faces away.
                   The scale and the rotation are on DIFFERENT elements on
                   purpose: `.card` writes `transform` from --t, and a
                   rotation on the same property would have to be composed
                   with it by hand.

                   The face that is turned away is `inert` as well as hidden
                   from assistive tech: its links must not be reachable by
                   Tab or by a screen reader while the other face is the one
                   being shown. React 19 renders the boolean as the bare
                   attribute. The article itself is never inert — it is the
                   thing a keyboard user holds while the faces swap. */
                <div
                  className={cn(
                    styles.card,
                    styles.scene,
                    "relative mx-auto flex flex-1 flex-col",
                    isActive ? "z-10" : "",
                  )}
                >
                  <article
                    tabIndex={0}
                    aria-label={`Oprirea ${String(node.number).padStart(2, "0")}: ${node.step.title}`}
                    className={cn(
                      styles.flip,
                      "focus-visible:ring-ring relative flex flex-1 flex-col rounded-[var(--radius)] focus-visible:ring-2 focus-visible:outline-none",
                      flipped === i && styles.flipped,
                      peek === i && styles.peek,
                    )}
                    /* A tap anywhere on the card turns it — except on the
                       things that are already links, which keep their own
                       job. A tap on a card that is NOT the centred one brings
                       it to the centre instead: on a desktop three cards are
                       in view, and turning a card at 0.96 scale off to one
                       side is not what anyone meant. The keyboard gets the
                       same two rules on Enter and Space, when the article
                       itself is what is focused — never when the key lands
                       on the title link inside it. */
                    onClick={(e) => {
                      if ((e.target as Element).closest("a, button")) return;
                      if (i !== active) {
                        goTo(i);
                        return;
                      }
                      /* Mid-peek, the tap is read against the face that is
                         showing — see PEEK_BACK_WINDOW. */
                      if (peek === i && !peekShowsBack()) {
                        window.clearTimeout(peekTimer.current);
                        setPeek(null);
                        return;
                      }
                      turn(i);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape" && flipped === i) {
                        turn(i);
                        return;
                      }
                      if (e.target !== e.currentTarget) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (i !== active) goTo(i);
                        else turn(i);
                      }
                    }}
                    onAnimationEnd={(e) => {
                      if (e.target === e.currentTarget) {
                        setPeek((p) => (p === i ? null : p));
                      }
                    }}
                  >
                    {/* ── Front ───────────────────────────────────────
                        One border for all ten, `--border`. The finale stop
                        (tone `sun`) had `--border-strong`, the way its
                        number and points are gold; on the screen that read
                        as one card with black edges among nine without, and
                        the user asked for the same edges as the others. The
                        gold badge and pill still mark it. */}
                    <div
                      data-face="front"
                      inert={flipped === i}
                      aria-hidden={flipped === i}
                      className={cn(
                        styles.face,
                        styles.lift,
                        "bg-card border-border relative flex min-h-[30rem] flex-1 flex-col rounded-[var(--radius)] border p-5",
                      )}
                    >
                      {/* ── The card is 30rem tall, and the PLATE takes up
                          the slack ──────────────────────────────────────
                          The front's own content comes to about 400px, and
                          a back that size holds seven lines of history —
                          two sentences, not a story. 30rem (480px) is what
                          the card measured before the standfirst was fixed
                          at two lines, and it gives the back eighteen lines
                          at body size now that the back is text alone — most
                          of a history, not all of them: see the back.

                          Where the extra goes matters. Left as air between
                          the standfirst and the chips it is a hollow band on
                          every card (GUIDELINES 4). Given to the plate it is
                          a bigger drawing — the card's subject — and it is
                          the same move the two terminals make with THEIR
                          plates: `flex-1` on the decorative panel, content
                          pinned where it belongs. A one-line title makes its
                          plate 21px taller rather than opening a gap under
                          itself.

                          128px, up from 88 in the 112px plate this was: the
                          plate is ~275px now (the Maps bar's 60px went to it
                          too) and an 88px mark in it read as a stamp in a
                          frame. The stroke drops 1.5 -> 1.15 in
                          user units so the rendered weight stays near 3px
                          rather than growing with the size.

                          The wrapper is here so the station badge can sit on
                          the plate's corner. The badge is a SIBLING of the
                          plate, not a child: the plate is aria-hidden — it is
                          decoration — and the stop's number is not. The
                          plate's bottom corner is empty on purpose: a
                          „Povestea” pill sat there for an afternoon as the
                          standing sign of the back, and the user took it off
                          — the arrival peek is the sign. */}
                      <div className="relative flex flex-1 flex-col">
                        <div
                          aria-hidden="true"
                          className={cn(
                            styles.plate,
                            "border-border flex min-h-28 flex-1 items-center justify-center rounded-[calc(var(--radius)-2px)] border",
                          )}
                        >
                          <StopGlyph
                            name={glyph ?? "cathedral"}
                            className="size-32 [stroke-width:1.15]"
                          />
                        </div>
                        {/* The station number. Near-black, not sky: a label,
                            not an action. `sun` stops keep the gold, because
                            that tone is what marks the finale.

                            Size and colour in a template literal, never
                            through cn(): tailwind-merge does not know
                            --text-ui exists, reads `text-ui` as a colour and
                            drops one of the pair. */}
                        <span
                          className={`bg-card border-border-strong font-ui text-ui absolute top-2.5 left-2.5 flex size-8 items-center justify-center rounded-full border leading-none font-semibold tabular-nums ${
                            sun ? "text-contrast-text" : "text-foreground"
                          }`}
                        >
                          {String(node.number).padStart(2, "0")}
                        </span>
                        {/* The score, opposite the number, ON the plate, where
                            it cannot wrap onto a line of its own the way it did
                            at the end of the chip row. */}
                        {typeof node.step.points === "number" ? (
                          <span className="bg-contrast text-foreground font-ui text-ui absolute top-2.5 right-2.5 rounded-full px-2.5 py-1 leading-none font-semibold tabular-nums">
                            {node.step.points}&nbsp;p
                          </span>
                        ) : null}
                      </div>

                      <h3 className="text-h3 text-card-foreground relative mt-4">
                        {place ? (
                          /* A stretched link SCOPED TO THE HEADING, not to the
                             card — the card is a destination in its own right
                             now, with a Maps button and a back of its own, so
                             a card-wide overlay would swallow both.

                             The overlay exists because a single-line title is
                             a 25px tap target, under the 44px floor. -inset-y-3
                             takes the H3's 21px line box to 45px; 2.5 gives 41
                             and quietly misses. Measured with elementFromPoint.

                             THE RING IS ON THE ::after, NOT ON THE LINK: the
                             link is inline, so on a wrapped title Chromium
                             would ring each line fragment and the two rings
                             would land on the words. The overlay is one box
                             covering the whole hit area, so ringing that gives
                             exactly one rectangle around exactly the target. */
                          <Link
                            href={`/blajhunt/${place.slug}`}
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

                      {/* TWO LINES. The copy in blajhunt-places.ts is written
                          to fill two lines at 390px (64-73 characters against
                          a ~37ch measure) and the box reserves two
                          (`min-h-[2lh]`). This is the line that used to run
                          one to four and take the whole bottom of the card
                          with it.

                          Clamped at THREE, not two: at 320px the measure is
                          ~29ch and the same copy needs a third line, and a
                          clamp at two put an ellipsis on every card there.
                          The third line costs the chips and the button
                          nothing — the bottom group is `mt-auto` and the
                          plate above absorbs the 24px — so the clamp is only
                          a belt against copy that runs away, not what holds
                          the layout still.

                          font-medium, not a sixth type size — the ramp is
                          five steps and adding one is a defect. */}
                      <p className="text-foreground/80 mt-3 line-clamp-3 min-h-[2lh] font-medium">
                        {place?.standfirst ?? node.step.description}
                      </p>

                      {/* The bottom row: the proof chips on the left, the
                          Maps button at the right end. `mt-auto` on the ROW,
                          so it sits at the same y on every card — the chips
                          used to be in flow above an `mt-auto` button, which
                          is exactly how they ended up at a different height
                          on each stop.

                          The Maps control was a full-width 48px bar under
                          the chips, „Deschide în Maps”; the user called it
                          huge and ugly and asked for a small button with a
                          map glyph. It is a 48px pill — 48 not 44, because
                          the neighbour cards draw at 0.96 and 44 × 0.96 is
                          under the floor — holding `MapPin` and `Arrow`:
                          the pin says where, the arrow says it takes you
                          there, which a pin alone did not („so that it
                          signifies the fact that it's a button and it takes
                          you somewhere”). Named for a screen reader; no
                          visible label, by the user's choice.

                          OUTLINED GREY — NOT SKY, AND NOT INK. It was
                          `bg-primary` for an hour, the one blue the card
                          spends on actions, and on a white card on a white
                          field the user read it as „aggressive” and „in
                          your face”. Adding colour around it to soften it
                          is the move this page has already made and
                          reverted (blue on blue on blue — see `.field` in
                          the module). So the pill wears the chrome of the
                          two arrows above the track instead, a
                          `--border-strong` ring on the card's fill — and
                          its glyphs are that same grey, not ink: an ink pin
                          was, in the user's words, the blackest thing on
                          the page. `--border-strong` on white is 3.5:1,
                          over the 3:1 floor for a graphic, and it is the
                          tone of the trailhead's pin two slides back. No
                          sky on the card at all; gold, on the points and in
                          the drawing, is its only colour, which is what the
                          hunt's colour is for.

                          The row wraps, so at 320 the two stops with two
                          chips (188px of chips in a 220px row) drop the
                          pill to a second line, right-aligned, rather than
                          overflow; at 390 the row is 278px and the pill
                          fits beside the chips on all ten. On the one stop
                          with no proofs the pill stands alone at the right,
                          at the same y as everywhere else: the row's
                          `min-h-12` is its own height. */}
                      <div className="mt-auto flex min-h-12 flex-wrap items-center gap-2 pt-4">
                        {/* Neutral chips: they only label what proof the
                            stop wants. --muted-foreground on --muted is
                            7.4:1. */}
                        {node.step.proofs?.length ? (
                          <ul className="flex flex-wrap gap-2">
                            {node.step.proofs.map((proof) => (
                              <li
                                key={proof}
                                className="border-border bg-muted text-muted-foreground font-ui text-ui rounded-full border px-2.5 py-0.5 font-medium tracking-[0.08em] uppercase"
                              >
                                {proof}
                              </li>
                            ))}
                          </ul>
                        ) : null}

                        {place ? (
                          <a
                            href={mapsUrl(place)}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label="Deschide în Google Maps"
                            className="border-border-strong bg-card text-border-strong focus-visible:ring-ring focus-visible:ring-offset-card active:bg-foreground/5 ml-auto inline-flex h-12 shrink-0 items-center gap-1 rounded-full border pr-3.5 pl-3 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                          >
                            <MapPin className="size-6" />
                            <Arrow className="size-4" />
                          </a>
                        ) : null}
                      </div>
                    </div>

                    {/* ── Back ──────────────────────────────────────────
                        Absolute over the front, so the front alone sets the
                        card's height and the back gets exactly that much.
                        The text box scrolls if it must — see the note on it
                        below — so a history that outgrows the card is still
                        readable rather than cut at the edge. */}
                    <div
                      data-face="back"
                      inert={flipped !== i}
                      aria-hidden={flipped !== i}
                      className={cn(
                        styles.face,
                        styles.back,
                        styles.lift,
                        "bg-card border-border absolute inset-0 flex flex-col rounded-[var(--radius)] border p-5",
                      )}
                    >
                      {/* No header. The back carried the number badge and
                          the points pill for a day — the plate's own pair,
                          so the two faces would read as one card — and the
                          user took them off: they are on the front, a tap
                          away, and the 44px they cost is two more lines of
                          history in a box that is short of them. The text
                          starts at the card's top padding. */}
                      {/* THE WHOLE HISTORY — `place.body`, the paragraphs
                          the stop page shows — not a condensed copy of it.
                          The card had a `back` field for an afternoon, two
                          paragraphs cut to fit; the user's direction is to
                          retire the stop pages, so the card has to carry
                          what they carry, and a second copy of the facts is
                          a second thing to fact-check. leading-normal (1.5)
                          rather than the body's 1.6: sixteen lines in a card
                          is a block, not a page. The box is the card less
                          its padding — eighteen lines at every width; the
                          measure is what changes; which histories need more
                          than that at which width is measured and recorded in
                          SPEC, and is the open question on this card. Until
                          it is answered the box scrolls rather than clips —
                          overflow-y auto, the edge cue below, nothing hidden,
                          nothing spilling out of a rotated face. */}
                      <div
                        data-scrollbox
                        onScroll={(e) => cueScroll(e.currentTarget)}
                        className={cn(
                          styles.scrollbox,
                          "min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain",
                        )}
                      >
                        {(place?.body ?? [node.step.description]).map((para) => (
                          <p
                            key={para.slice(0, 32)}
                            className="text-foreground/90 leading-normal"
                          >
                            {para}
                          </p>
                        ))}
                      </div>
                    </div>
                  </article>
                </div>
              )}
            </li>
          );
        })}

        <li aria-hidden="true" className={styles.edge} />
      </ol>
    </div>
  );
}
