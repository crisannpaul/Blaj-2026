"use client";

// A full-bleed editorial hero driven by a filmstrip.
//
// Every card shares one top edge. The focused card unfurls to full height while
// its neighbours stay clipped to half, so the strip reads as a row of cropped
// heads with one complete portrait standing in the middle of it. Changing the
// focus re-grades the whole background to that image.
//
// Geometry is measured, never hard-coded: one ResizeObserver reads the stage and
// every size below is a ratio of it, so the same component is pixel-identical in
// a 600px preview box and on a 4K display.
//
// ── Adapted from the crafterui / 21st.dev original. What changed, and why ─────
//  - RATIOS ARE RESPONSIVE. The original's single set was tuned for a wide
//    stage; on a 390px phone the strip landed at 50% with the headline crushed
//    above it and nothing below. Two sets now, chosen off the measured width.
//  - A description and an optional call to action per slide, in a band beneath
//    the strip, with a scrim of their own. That band is why the phone ratios
//    lift the strip to 38%.
//  - Colour comes from tokens (--stage, --on-stage). The original hard-coded
//    black and white. This is the one dark surface on a light-only site, so it
//    gets named tokens rather than raw values — see globals.css.
//  - `select-none` dropped from the stage: it also blocked selecting the
//    description, which is real copy people may want to copy.
//  - Images carry width/height so the strip cannot shift as it loads.

import * as React from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import Link from "next/link";

import { cn } from "@/lib/utils";

export interface HeroCarouselItem {
  /** Stable key; falls back to the index. @default undefined */
  id?: string | number;
  /** Headline for the active slide. `\n` becomes separate reveal lines. */
  title: string;
  /** Image URL, used both in the card and as the graded background. */
  image: string;
  /** Byline printed beside the headline, e.g. "CU PR. ANDREI". @default undefined */
  credit?: string;
  /** Right-aligned facts, e.g. ["90 MIN", "20 LOCURI"]. @default undefined */
  meta?: string[];
  /** Body copy under the strip. @default undefined */
  description?: string;
  /** Call-to-action label. Renders disabled when `ctaHref` is absent. @default undefined */
  ctaLabel?: string;
  /** Destination for the call to action. @default undefined */
  ctaHref?: string;
  /**
   * CSS colour the background is graded to. The photo keeps its luminance and
   * takes this hue, which is what makes the backdrop swing on every change.
   * @default "#8a8a8a"
   */
  accent?: string;
}

export interface HeroCarouselProps {
  /** Slides, in strip order. */
  items: HeroCarouselItem[];
  /** Focused slide when controlled. Leave unset for internal state. @default undefined */
  index?: number;
  /** Focused slide on mount when uncontrolled. @default 0 */
  defaultIndex?: number;
  /** Fires on every focus change, from any input. @default undefined */
  onIndexChange?: (index: number) => void;
  /** Wordmark in the middle of the top bar. @default undefined */
  brand?: React.ReactNode;
  /** Renders the "Back" control when provided. @default undefined */
  backHref?: string;
  /** Label for the back control. @default "Înapoi" */
  backLabel?: string;
  /** Accessible name for the carousel region. @default "Carusel" */
  label?: string;
  /** Advance on a timer. Pauses on hover, drag and focus. @default false */
  autoplay?: boolean;
  /** Milliseconds between autoplay steps. @default 4000 */
  autoplayDelay?: number;
  /** Extra classes for the stage. @default undefined */
  className?: string;
}

/**
 * Ratios, all relative to the measured stage box. Two sets: a phone-shaped
 * stage cannot carry the wide layout — at 390px the original put the strip's
 * top edge at 50% with a two-line headline crushed above it and a dead band
 * below. The narrow set lifts the strip and buys back room for the copy.
 */
const RATIOS = {
  narrow: {
    CARD_H: 0.2, // active card height ÷ stage height
    CARD_AR: 0.75, // active card is 3:4
    GAP: 0.05, // gap ÷ card width
    STRIP_TOP: 0.36,
    TITLE: 0.058, // headline cap size ÷ stage height
    LABEL: 0.0125, // small mono label ÷ stage height
    BODY: 0.019, // description ÷ stage height
    PAD: 0.05, // page gutter ÷ stage width
    RAIL: 0.32, // progress rail width ÷ stage width
  },
  wide: {
    CARD_H: 0.264,
    CARD_AR: 0.75,
    GAP: 0.038,
    STRIP_TOP: 0.44,
    TITLE: 0.067,
    LABEL: 0.0103,
    BODY: 0.017,
    PAD: 0.017,
    RAIL: 0.2,
  },
} as const;

/** Below this measured stage width the narrow ratio set applies. */
const NARROW_AT = 720;

/** Wheel distance that commits to a step, and the lockout after one. */
const WHEEL_THRESHOLD = 60;
const WHEEL_COOLDOWN = 420;

/* Film grain, as a self-contained SVG so the component carries no assets. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export function HeroCarousel({
  items,
  index: controlled,
  defaultIndex = 0,
  onIndexChange,
  brand,
  backHref,
  backLabel = "Înapoi",
  label: regionLabel = "Carusel",
  autoplay = false,
  autoplayDelay = 4000,
  className,
}: HeroCarouselProps) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  const [uncontrolled, setUncontrolled] = React.useState(defaultIndex);
  const [dragging, setDragging] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const reduced = useReducedMotion();

  const last = items.length - 1;
  const index = clamp(controlled ?? uncontrolled, 0, Math.max(0, last));

  const go = React.useCallback(
    (next: number) => {
      const clamped = clamp(next, 0, Math.max(0, last));
      if (controlled === undefined) setUncontrolled(clamped);
      if (clamped !== index) onIndexChange?.(clamped);
    },
    [controlled, index, last, onIndexChange],
  );

  // One observer feeds every measurement below.
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const read = () => setBox({ w: stage.clientWidth, h: stage.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  const narrow = box.w > 0 && box.w < NARROW_AT;
  const R = narrow ? RATIOS.narrow : RATIOS.wide;

  const fullH = clamp(box.h * R.CARD_H, 96, 360);
  const halfH = fullH / 2;
  const cardW = fullH * R.CARD_AR;
  const gap = Math.max(4, Math.round(cardW * R.GAP));
  const step = cardW + gap;
  const pad = Math.max(16, Math.round(box.w * R.PAD));
  // 13, not 11: these labels are uppercase and letterspaced, and the rubric
  // floor is 12px flat. Letterspaced caps need MORE size than body, not less.
  const label = Math.max(13, Math.round(box.h * R.LABEL));
  const body = Math.max(15, Math.round(box.h * R.BODY));

  // Centre the focused card: the track slides, the card never moves itself.
  const xFor = React.useCallback(
    (i: number) => box.w / 2 - (i * step + cardW / 2),
    [box.w, step, cardW],
  );
  const x = useMotionValue(0);
  const target = xFor(index);

  const swing = reduced
    ? { duration: 0 }
    : { duration: 0.7, ease: "easeOut" as const };
  const spring = reduced
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 260, damping: 34, mass: 0.9 };

  // The track is driven by a motion value rather than an `animate` prop so a
  // drag that starts mid-spring reads the real position, not where the spring
  // was headed - otherwise the release snaps a card off.
  React.useEffect(() => {
    if (dragging) return;
    const run = animate(x, target, spring);
    return () => run.stop();
    // `spring` is a literal, so `reduced` (all it derives from) stands in for it.
  }, [target, dragging, reduced, x]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wheel and trackpad. Both axes step the strip.
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let acc = 0;
    let until = 0;

    const onWheel = (e: WheelEvent) => {
      // Trackpads report the dominant axis; take whichever is stronger.
      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      // Scroll chaining: once the strip is against an end, hand the gesture
      // back to the page. Without this a full-height carousel is a scroll trap
      // with no way past it.
      const stuck = (delta > 0 && index === last) || (delta < 0 && index === 0);
      if (stuck) {
        acc = 0;
        return;
      }
      e.preventDefault();
      const now = e.timeStamp;
      if (now < until) return;
      acc += delta;
      if (Math.abs(acc) < WHEEL_THRESHOLD) return;
      go(index + Math.sign(acc));
      acc = 0;
      until = now + WHEEL_COOLDOWN;
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [go, index, last]);

  React.useEffect(() => {
    if (!autoplay || paused || dragging || items.length < 2) return;
    const id = window.setTimeout(
      () => go(index === last ? 0 : index + 1),
      autoplayDelay,
    );
    return () => window.clearTimeout(id);
  }, [
    autoplay,
    autoplayDelay,
    dragging,
    go,
    index,
    items.length,
    last,
    paused,
  ]);

  const active = items[index];
  if (!active) return null;

  const lines = active.title.split("\n");
  const accent = active.accent ?? "#8a8a8a";

  return (
    <div
      ref={stageRef}
      tabIndex={0}
      role="group"
      aria-roledescription="carousel"
      aria-label={regionLabel}
      onKeyDown={(e) => {
        const keys: Record<string, number> = {
          ArrowLeft: index - 1,
          ArrowRight: index + 1,
          Home: 0,
          End: last,
        };
        if (!(e.key in keys)) return;
        e.preventDefault();
        go(keys[e.key]!);
      }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        "bg-stage text-on-stage relative h-full min-h-[24rem] w-full overflow-hidden",
        "focus-visible:ring-on-stage/50 outline-none focus-visible:ring-2 focus-visible:ring-inset",
        className,
      )}
    >
      {/* ── Background: the focused photo, blown up and re-hued to its accent ── */}
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={swing}
        >
          <motion.img
            src={active.image}
            alt=""
            aria-hidden
            draggable={false}
            width={750}
            height={1000}
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ scale: reduced ? 1.28 : 1.42 }}
            animate={{ scale: 1.28 }}
            transition={
              reduced ? { duration: 0 } : { duration: 6, ease: "linear" }
            }
          />
          {/* The grade, in three moves. It LIFTS rather than darkens: the ink
              here is near-black, and dark type needs a bright backdrop.
              1. take the accent's hue, keep the photo's luminance
              2. wash toward --stage, which is what guarantees the floor
              3. put the accent back as a visible tint, since step 2 desaturates
              Worst case (a pure black photo) still lands around 9:1. */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: accent, mixBlendMode: "color" }}
          />
          <div className="bg-stage/[0.68] absolute inset-0" />
          <div
            className="absolute inset-0 opacity-[0.19]"
            style={{ backgroundColor: accent, mixBlendMode: "multiply" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Legibility wash + grain, above the swap so they never flicker. The
          bottom stop is heavier than the original's: real body copy sits down
          there now, not just a row of mono labels. */}
      <div className="from-stage/40 to-stage/55 absolute inset-0 bg-gradient-to-b via-transparent" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.10] mix-blend-multiply"
        style={{ backgroundImage: GRAIN, backgroundSize: "180px 180px" }}
      />

      {/* ── Top bar ──
          z-30 is load-bearing: the headline block below is a later sibling that
          spans from the very top of the stage, so without it that block paints
          over this bar and eats every click on the back link. */}
      <div
        className="absolute inset-x-0 z-30 flex items-center justify-between"
        style={{
          top: Math.max(12, box.h * 0.024),
          paddingLeft: pad,
          paddingRight: pad,
        }}
      >
        {backHref ? (
          <Link
            href={backHref}
            transitionTypes={["nav-back"]}
            className="focus-visible:ring-on-stage/60 -ml-2 inline-flex min-h-11 items-center gap-2 rounded-full px-2 opacity-90 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:outline-none active:opacity-75"
            style={{ fontSize: label * 1.15 }}
          >
            <span aria-hidden>←</span> {backLabel}
          </Link>
        ) : (
          <span />
        )}
        {brand ? (
          <div
            className="font-ui font-semibold tracking-[0.06em] uppercase"
            style={{ fontSize: label * 1.2 }}
          >
            {brand}
          </div>
        ) : null}
      </div>

      {/* ── Headline block, sitting just above the strip's top edge ── */}
      <div
        className="absolute inset-x-0 top-0 flex flex-col justify-end"
        style={{
          height: `${R.STRIP_TOP * 100}%`,
          paddingLeft: pad,
          paddingRight: pad,
          paddingBottom: Math.round(box.h * 0.028),
        }}
      >
        {/* Cover for the credit and meta labels, which otherwise sit in the
            transparent middle of the page wash. It must fade out at BOTH ends
            and overhang the block, or its own bottom edge draws a hard line
            straight across the stage — the same failure as the landing page's
            copy scrim. Ramps complete inside the box, by construction. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0"
          style={{
            top: "20%",
            bottom: -Math.round(fullH * 0.55),
            background:
              "linear-gradient(to bottom, transparent 0%, " +
              "color-mix(in oklab, var(--stage) 46%, transparent) 44%, " +
              "color-mix(in oklab, var(--stage) 46%, transparent) 64%, transparent 100%)",
          }}
        />
        <div
          className={cn(
            "relative flex w-full",
            narrow
              ? "flex-col items-start gap-2"
              : "flex-wrap items-end gap-x-[6vw] gap-y-2",
          )}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.h2
              key={index}
              className="font-display font-semibold leading-[0.9] tracking-[-0.03em]"
              style={{ fontSize: Math.max(28, Math.round(box.h * R.TITLE)) }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
            >
              {lines.map((line, i) => (
                // Each line wipes up from behind its own edge.
                <span key={i} className="block overflow-hidden">
                  <motion.span
                    className="block"
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={
                      reduced
                        ? { duration: 0 }
                        : {
                            duration: 0.62,
                            delay: i * 0.07,
                            ease: [0.22, 1, 0.36, 1],
                          }
                    }
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </motion.h2>
          </AnimatePresence>

          {active.credit ? (
            <motion.p
              key={`credit-${index}`}
              className="font-ui uppercase tracking-[0.14em] opacity-90"
              style={{ fontSize: label }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {active.credit}
            </motion.p>
          ) : null}

          {active.meta?.length ? (
            <div
              className={cn("flex items-end", !narrow && "ml-auto")}
              style={{ gap: `${narrow ? 20 : Math.max(16, box.w * 0.055)}px` }}
            >
              {active.meta.map((fact, i) => (
                <motion.span
                  key={`${index}-${fact}`}
                  className="font-ui whitespace-nowrap uppercase tracking-[0.14em] opacity-90"
                  style={{ fontSize: label }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 0.9, y: 0 }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { duration: 0.45, delay: 0.12 + i * 0.06 }
                  }
                >
                  {fact}
                </motion.span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* ── The strip: one shared top edge, the focused card twice as tall ── */}
      <div
        className="absolute inset-x-0"
        style={{ top: `${R.STRIP_TOP * 100}%`, height: fullH }}
      >
        <motion.div
          className="flex items-start"
          style={{ gap, x, cursor: dragging ? "grabbing" : "grab" }}
          drag="x"
          dragMomentum={false}
          dragElastic={0.08}
          dragConstraints={{ left: xFor(last), right: xFor(0) }}
          onDragStart={() => setDragging(true)}
          onDragEnd={(_, info) => {
            setDragging(false);
            // Land on whatever card the release sits nearest, nudged by throw
            // velocity so a flick clears more than one card.
            const thrown = x.get() + info.velocity.x * 0.12;
            go(Math.round((box.w / 2 - thrown - cardW / 2) / step));
          }}
        >
          {items.map((item, i) => (
            <motion.button
              key={item.id ?? i}
              type="button"
              aria-label={item.title.replace(/\n/g, " ")}
              aria-current={i === index}
              onClick={() => go(i)}
              className="focus-visible:ring-on-stage border-border-strong/60 shadow-card bg-stage relative shrink-0 overflow-hidden rounded-md border focus-visible:ring-2 focus-visible:outline-none"
              style={{ width: cardW }}
              animate={{ height: i === index ? fullH : halfH }}
              transition={spring}
            >
              {/* The focused card is exactly 3:4, so object-position does
                  nothing to it - it only picks which band of the portrait the
                  half-height neighbours keep. Anchored just above centre so a
                  clipped card still shows a face, not a forehead. */}
              <img
                src={item.image}
                alt=""
                draggable={false}
                width={750}
                height={1000}
                className="h-full w-full object-cover"
                style={{ objectPosition: "50% 26%" }}
              />
              {/* Unfocused cards wash toward the stage, so they recede on a
                  light field the way the black overlay did on a dark one. */}
              <motion.span
                aria-hidden
                className="bg-stage absolute inset-0"
                animate={{ opacity: i === index ? 0 : 0.30 }}
                transition={spring}
              />
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* ── Copy band: description, action, and the position rail ──
          New in this adaptation. The original ended at the strip; a workshop
          needs to say what it is. It carries its own scrim because body copy
          over a graded photograph needs more cover than a mono label does. */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col justify-between"
        style={{
          top: `calc(${R.STRIP_TOP * 100}% + ${fullH}px)`,
          paddingLeft: pad,
          paddingRight: pad,
          paddingTop: Math.round(box.h * 0.03),
          paddingBottom: `max(${Math.max(14, Math.round(box.h * 0.022))}px, env(safe-area-inset-bottom))`,
        }}
      >
        <div
          aria-hidden
          className="from-stage/75 pointer-events-none absolute inset-x-0 top-0 bottom-0 bg-gradient-to-t to-transparent"
        />

        <div className="relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              initial={{ opacity: 0, y: reduced ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={
                reduced ? { duration: 0 } : { duration: 0.45, delay: 0.08 }
              }
            >
              {active.description ? (
                <p
                  className="max-w-prose leading-relaxed opacity-95"
                  style={{ fontSize: body }}
                >
                  {active.description}
                </p>
              ) : null}

              {active.ctaLabel ? (
                <div style={{ marginTop: Math.round(box.h * 0.026) }}>
                  {active.ctaHref ? (
                    <Link
                      href={active.ctaHref}
                      className="bg-primary text-primary-foreground active:bg-brand-strong focus-visible:ring-ring focus-visible:ring-offset-stage shadow-card font-ui inline-flex min-h-12 items-center rounded-full px-6 font-semibold transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.97]"
                      style={{ fontSize: Math.max(15, body) }}
                    >
                      {active.ctaLabel}
                    </Link>
                  ) : (
                    // No destination yet. A disabled control that says so is
                    // honest; a live one that goes nowhere is a dead end.
                    // Muted at 80% of the ink, not --muted-foreground: that
                    // token is 7.8:1 on white but only 3.5:1 on the graded
                    // stage, and this label carries real information.
                    <button
                      type="button"
                      disabled
                      className="border-border-strong text-on-stage/80 font-ui inline-flex min-h-12 cursor-not-allowed items-center rounded-full border px-6 font-medium"
                      style={{ fontSize: Math.max(15, body) }}
                    >
                      {active.ctaLabel}
                    </button>
                  )}
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <div
          className="relative"
          style={{
            width: Math.max(120, box.w * R.RAIL),
          }}
        >
          <div
            className="font-ui flex justify-between tabular-nums opacity-90"
            style={{ fontSize: label }}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <span>{String(items.length).padStart(2, "0")}</span>
          </div>
          <div className="bg-on-stage/30 relative mt-2 h-px w-full">
            <motion.div
              className="bg-on-stage absolute inset-y-0"
              style={{ width: `${100 / items.length}%` }}
              animate={{ left: `${(index / items.length) * 100}%` }}
              transition={spring}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Original: crafterui / 21st.dev diagonal editorial hero carousel.
 * Adapted for this project — see the notes at the top of the file.
 */
