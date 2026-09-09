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
  /** Image URL for the card in the strip. */
  image: string;
  /**
   * Tiny stand-in for the graded background, if the card image should not be
   * enlarged into it. The backdrop paints this image full-bleed at 1.28 scale,
   * which at 1440 is a ~2.5x enlargement of a 720px card — enough to make any
   * lettering inside a source legible behind the copy. A 120px-wide file
   * upscaled by the browser is the same field with the detail gone, and no
   * runtime `filter` to re-rasterise during the 6s scale.
   * Falls back to `image`. @default undefined
   */
  backdropImage?: string;
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
  /**
   * Mirror the focused card into the URL hash (`#<id>`) and read it back on
   * mount, so a link out and back lands on the card it left from. Needs item
   * ids. Uncontrolled mode only. @default false
   */
  syncHash?: boolean;
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
    CARD_H: 0.3, // active card height ÷ stage height
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
    CARD_H: 0.31,
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

/**
 * Headline leading, as a multiple of the title's own size, and how much ink
 * the per-line wipe mask lets out past its box. Measured against Outfit at
 * 600, which is the only face this headline is ever set in.
 *
 * Outfit's ink does not fit 0.9. It reaches 0.98em above the baseline (Î and
 * Ă carry their accent above cap height) and 0.388em below it — and that
 * lower figure is not a descender, it is the comma under ș and ț, which
 * Outfit draws 1.7x deeper than its own j (0.224em). Something has to give.
 *
 * What gives is the last third of that comma, and nothing else:
 *
 *  - TOP admits the accents whole (0.162em needed). This was the reported bug:
 *    every Î lost its circumflex and every ă its breve.
 *  - BOTTOM admits every true descender — j and g at 0.224em are the deepest —
 *    and stops there. The comma is cut at 0.203em below the baseline, keeping
 *    about half of it: still unmistakably a comma-below, which is all it has to
 *    be, and short enough to stay out of the line underneath.
 *
 * Letting the comma out whole was tried and looked worse than the bug. At 0.9
 * its tip lands exactly on the next line's x-height (0.9 - 0.388 = 0.512 vs an
 * x-height of 0.51) and reads as an apostrophe dropped into the middle of the
 * word below — "mașina / timpului" became "masina / timpul’ui". Loosening to
 * 1.0 clears the x-height but not the ascenders; clearing those needs
 * 0.388 + 0.714 = 1.10, which is no longer this headline.
 *
 * Constants, not literals, because the room calculation divides by the leading
 * and the wipe's travel is measured from the padded edge: as literals they
 * would drift apart and the title would overflow its box again on a short
 * stage. Re-measure all three if the display face ever changes.
 */
const TITLE_LEADING = 0.9;
const TITLE_INK_TOP = "0.22em";
const TITLE_INK_BOTTOM = "0.12em";

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
  syncHash = false,
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

  // The URL reflects the focused card (Vercel baseline, State & Navigation).
  // `#<id>` is read once, before first paint, so coming back from a detail
  // page lands on the card that was left; it is written with replaceState so
  // a swipe does not grow the history stack, and with the router's own state
  // object preserved so Next's bookkeeping survives the write.
  React.useLayoutEffect(() => {
    if (!syncHash || controlled !== undefined) return;
    const read = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const i = items.findIndex((it) => String(it.id) === id);
      if (i >= 0) setUncontrolled(i);
    };
    read();
    // A same-document hash change (a link to `/ateliere#slug` from a page
    // that is already `/ateliere`) does not remount, so listen as well. No
    // loop: replaceState below never fires hashchange.
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (!syncHash) return;
    const id = items[index]?.id;
    if (id === undefined) return;
    window.history.replaceState(
      window.history.state,
      "",
      `#${encodeURIComponent(String(id))}`,
    );
  }, [syncHash, index, items]);

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

  // The card is a share of the stage, but the strip may not eat the copy band:
  // every card's WIDTH is derived from this height, so the ratio that gives a
  // legible picture on a tall phone is the same ratio that pushes the action
  // off a short one. A landscape phone (844x390) was already putting the last
  // 3px of the button under the fold at the old ratio. So take the smaller of
  // the ratio and whatever is left once the band keeps COPY_MIN, which is the
  // measured height of its own content — scrim, description, action, rail and
  // the safe-area padding — at the tightest width each set has to serve.
  // Both ratios are set by their TIGHTEST device rather than their roomiest,
  // because the leftover the band spreads between the action and the rail does
  // not scale with the stage: the description and the button are near enough a
  // fixed height, so a taller phone has proportionally more to give. Measured
  // gap between button and rail at 0.27: 28px at 320, 41 at 360, 64 at 390, 77
  // at 430. 360x740 is therefore what caps the narrow ratio — raising it past
  // 0.30 closes that gap on a 360 while merely tidying a 430.
  const COPY_MIN = narrow ? 250 : 190;
  const fullH = clamp(
    Math.min(box.h * R.CARD_H, box.h * (1 - R.STRIP_TOP) - COPY_MIN),
    96,
    360,
  );
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

  // The headline box is STRIP_TOP of the stage and everything in it is
  // bottom-anchored, so a title that does not fit overflows UPWARD, under the
  // top bar — flex-end does not clamp. Size from the ratio, then cap by what
  // actually fits above the credit and meta lines. The cap only binds on very
  // short stages: at 320x568 a three-line title is 27px against a 33px ratio
  // size; at 390x844 the ratio gives 49 and the room is 59, so nothing moves.
  // Credit and meta share the headline's row above `narrow`, so they only
  // count against the height when stacked — at the body's 1.6 line-height,
  // which they inherit, plus the column's 8px gap each. Measured, not
  // guessed: 1.25 here put the title's box flush against the bar at 320.
  const topBar = Math.max(12, box.h * 0.024) + 44;
  const stacked = narrow
    ? (active.credit ? label * 1.6 + 8 : 0) +
      (active.meta?.length ? label * 1.6 + 8 : 0)
    : 0;
  const room =
    box.h * R.STRIP_TOP - topBar - stacked - Math.round(box.h * 0.028) - 4;
  const titleSize = Math.max(
    24,
    Math.min(
      Math.max(28, Math.round(box.h * R.TITLE)),
      Math.floor(room / (lines.length * TITLE_LEADING)),
    ),
  );

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
            src={active.backdropImage ?? active.image}
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
              // A column of flex items, not of blocks, purely so the masks'
              // negative margins do not collapse: adjacent sibling margins
              // collapse to the LARGER magnitude rather than summing, so as
              // blocks the -0.22em top and -0.36em bottom cancelled only once
              // per gap and the title grew 17.6px — quietly loosening the very
              // leading this fix exists to preserve. Flex items never collapse.
              className="font-display flex flex-col font-semibold tracking-[-0.03em]"
              style={{ fontSize: titleSize, lineHeight: TITLE_LEADING }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
            >
              {lines.map((line, i) => (
                // Each line wipes up from behind its own edge — and the mask
                // is sized to the INK, not to the line box.
                //
                // A mask exactly one line box tall cut the accent off every Î
                // and the tail off every j — at 49px, 7.9px off the top of
                // "În vizită la" and 6.0px off the bottom of "Episcopul". The
                // padding buys that room (see TITLE_INK_TOP for what it admits
                // and what it deliberately still trims); the equal negative
                // margin gives it straight back, so the line rhythm and the
                // titleSize computed against it are untouched.
                <span
                  key={i}
                  className="block overflow-hidden"
                  style={{
                    paddingTop: TITLE_INK_TOP,
                    marginTop: `-${TITLE_INK_TOP}`,
                    paddingBottom: TITLE_INK_BOTTOM,
                    marginBottom: `-${TITLE_INK_BOTTOM}`,
                  }}
                >
                  <motion.span
                    className="block"
                    // Clears the PADDED bottom edge, not the line box: the
                    // mask now hangs TITLE_INK_BOTTOM lower than it did, and at
                    // the old 110% the line began its wipe already showing.
                    initial={{ y: "125%" }}
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
              {/* The focused card is exactly 3:4 and so is the artwork, so
                  there is no overflow to place and this does nothing to it. It
                  only picks which band of the picture the half-height
                  neighbours keep — and that band is exactly half, because a
                  card at half height is a 3:2 window onto a 3:4 picture.

                  50% keeps the MIDDLE half, 25%..75%. The arithmetic: the
                  hidden overflow equals the box height, so `p` puts the window
                  at p/2 of the picture.

                  This has now been all three values, each time after looking at
                  what was actually in the frame. 26% was tuned for photographs
                  of people, where a band from the top lands on foreheads. Then
                  the set became artwork and collages composed downward from a
                  title, and 0% — the top half — was right for those. Then the
                  user generated a settled thumbnail for all seven, and they are
                  built like photographs again: sky, roofline and empty margin
                  up top, the subject in the middle. The top half of those is
                  the half with nothing in it. Revisit whenever the artwork
                  changes character, and look at the strip rather than reasoning
                  about it — that is what caught it all three times. */}
              <img
                src={item.image}
                alt=""
                draggable={false}
                width={750}
                height={1000}
                className="h-full w-full object-cover"
                style={{ objectPosition: "50% 50%" }}
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
                      transitionTypes={["nav-forward"]}
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
