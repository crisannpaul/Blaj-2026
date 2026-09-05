import React from "react";
import { cn } from "@/lib/utils";

/**
 * Diagonal marquee carousel.
 *
 * After 21st.dev/@saurabh-2607 (Great UI, MIT — Saurabh Sharma). Same props,
 * same picture. What changed and why:
 *
 *  - Keyframes moved to globals.css. The original injected a <style> tag via
 *    dangerouslySetInnerHTML on every mount; in the stylesheet they parse once
 *    and prefers-reduced-motion can reach them.
 *  - NO pause control, by explicit decision (SPEC D10). The Vercel baseline
 *    makes one a MUST for autoplay motion over 5s alongside content, and so
 *    does WCAG 2.2.2. `prefers-reduced-motion: reduce` still stops the loop
 *    dead, which is what carries the accessibility case now. Do not re-add a
 *    hover-only pause: `hover:` does not exist on the target device.
 *  - One wash over the whole band instead of an overlay <div> per card: same
 *    result, ~90 fewer DOM nodes on a phone. The wash is directional — it
 *    lifts from the bottom on a phone and from the left on a desktop, because
 *    that is where the copy sits. A centred pool would centre the composition.
 *  - Every colour reads --background. This site has one palette and no dark
 *    mode; a hard-coded white here would be the one thing a reskin could not
 *    reach.
 *  - Cards size up in four steps from 168px wide. The original's flat 400x300
 *    put 2.3 cards across a 390px phone, which reads as sliding wallpaper.
 *  - Decorative: aria-hidden on the band, alt="" on every image, no
 *    cursor-pointer on cards that are not clickable.
 */

export interface CardItem {
  id: string | number;
  url: string;
  title: string;
}

export interface DiagonalMarqueeCarouselProps {
  cards?: CardItem[];
  angle?: number;
  baseSpeed?: number;
  alternateDirections?: boolean;
  className?: string;
  cardClassName?: string;
  fadeClassName?: string;
}

/** Placeholder photography. Replace with the real archive — see SPEC A1/A2. */
const DEFAULT_CARDS: CardItem[] = [
  { id: 1, url: "/placeholder/1.jpg", title: "Placeholder" },
  { id: 2, url: "/placeholder/2.jpg", title: "Placeholder" },
  { id: 3, url: "/placeholder/3.jpg", title: "Placeholder" },
];

const Card = ({
  card,
  className,
  priority,
  wide,
}: {
  card: CardItem;
  className?: string;
  priority?: boolean;
  /** Every third frame runs wider. Identical frames in a row read as a lattice. */
  wide?: boolean;
}) => (
  <div
    className={cn(
      "relative h-[124px] shrink-0 overflow-hidden rounded-xl sm:h-[168px] lg:h-[225px] xl:h-[300px]",
      wide
        ? "w-[228px] sm:w-[304px] lg:w-[408px] xl:w-[544px]"
        : "w-[168px] sm:w-[224px] lg:w-[300px] xl:w-[400px]",
      "shadow-card",
      className,
    )}
  >
    <img
      src={card.url}
      alt=""
      width={800}
      height={600}
      decoding="async"
      // Three unique files fill every row, so the first copy is the whole
      // above-the-fold cost. Fetch those eagerly, coast on cache after.
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "low"}
      className="h-full w-full object-cover"
    />
  </div>
);

const MarqueeRow = ({
  cards,
  speed,
  direction,
  cardClassName,
  priority,
}: {
  cards: CardItem[];
  speed: number;
  direction: 1 | -1;
  cardClassName?: string;
  priority?: boolean;
}) => (
  <div className="flex w-full overflow-hidden">
    {/* Two identical halves: the keyframes translate exactly -50%, so copy 2
        lands where copy 1 began and the seam never shows. Each half must
        out-measure the row it sits in, or the loop opens a gap. */}
    <div
      className={cn(
        "flex shrink-0",
        direction === -1 ? "animate-marquee-left" : "animate-marquee-right",
      )}
      style={{ "--speed": `${speed}s` } as React.CSSProperties}
    >
      {[0, 1].map((half) => (
        <div className="flex shrink-0" key={half}>
          {cards.map((card, idx) => (
            <div
              key={`${card.id}-${idx}-${half}`}
              className="shrink-0 pr-4 sm:pr-6 lg:pr-8"
            >
              <Card
                card={card}
                className={cardClassName}
                priority={priority && half === 0 && idx < 3}
                wide={idx % 3 === 1}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

/* From lg up the copy sits in a left column, so the wash lifts from the left.
   Below lg the copy carries its own scrim instead — see page.tsx. */
const SCRIM_RIGHT =
  "linear-gradient(to right, var(--background) 0%, var(--background) 32%, " +
  "color-mix(in oklab, var(--background) 80%, transparent) 60%, transparent 88%)";

export default function DiagonalMarqueeCarousel({
  cards = DEFAULT_CARDS,
  angle = -25,
  baseSpeed = 90,
  alternateDirections = true,
  className = "",
  cardClassName = "",
  fadeClassName = "",
}: DiagonalMarqueeCarouselProps) {
  // Nine per half clears the widest row we render (220vw) at every breakpoint:
  // 9x184px = 1656 on a 390px phone, 9x432px = 3888 on a 1440px desktop.
  // Each row is dealt from a different rotation of the source, so a frame is
  // never directly above a copy of itself — with few source photos an
  // unrotated deal reads as tiled wallpaper rather than as an archive.
  const rotate = (n: number) => {
    const k = cards.length ? n % cards.length : 0;
    return [...cards.slice(k), ...cards.slice(0, k)];
  };

  const SPEEDS = [baseSpeed, Math.max(baseSpeed - 15, 30), baseSpeed + 15,
                  Math.max(baseSpeed - 6, 35), baseSpeed + 24];

  const rows = SPEEDS.map((speed, i) => {
    const dealt = rotate(i);
    const tripled = [...dealt, ...dealt, ...dealt];
    return {
      cards: i % 2 === 0 ? tripled : [...tripled].reverse(),
      speed,
      direction: (i % 2 === 0 ? -1 : 1) as 1 | -1,
    };
  });

  return (
    <div
      className={cn(
        "bg-background relative flex h-full w-full items-center justify-center overflow-hidden",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute z-0 flex w-[220vw] flex-col gap-4 sm:gap-6 lg:gap-8"
        style={{ transform: `rotate(${angle}deg)` }}
      >
        {rows.map((row, i) => (
          <MarqueeRow
            key={i}
            cards={row.cards}
            speed={row.speed}
            direction={alternateDirections ? row.direction : -1}
            cardClassName={cardClassName}
            priority={i === 0}
          />
        ))}
      </div>

      <div className="bg-background/22 pointer-events-none absolute inset-0 z-10" />
      <div
        className={cn("pointer-events-none absolute inset-0 z-10 hidden lg:block", fadeClassName)}
        style={{ background: SCRIM_RIGHT }}
      />
      {/* Edge softeners only — never a full-height wash below lg. A wash whose
          stops are viewport percentages slides out from under copy that is
          positioned by its own height: landscape, 200% zoom and a 640px-tall
          phone all dropped the kicker onto raw photography. The copy carries
          its own scrim instead — see page.tsx. */}
      <div className="from-background pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b to-transparent" />
      <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t to-transparent lg:hidden" />

    </div>
  );
}

/**
 * Great UI Component — https://great-ui.com · MIT
 * Author: Saurabh Sharma (x.com/srbh_s) · github.com/Saurabh-2607/GreatUI
 */
