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
 *  - Cards size up in four steps. The original's flat 400x300 put 2.3 cards
 *    across a 390px phone, which reads as sliding wallpaper. The phone step was
 *    then raised again (124px tall -> 176px, +86% area) because at the small
 *    size the archive read as texture rather than as photographs: fewer frames,
 *    each big enough to see a face in. Desktop was already right and did not
 *    move — only the base and `sm` steps did.
 *  - TWO WEBP TIERS behind a `srcset`, because the deck is eleven real
 *    photographs now rather than three. A phone pulls 394KB for the whole
 *    archive; serving the desktop tier to everyone would have been 578KB.
 *  - Decorative: aria-hidden on the band, alt="" on every image, no
 *    cursor-pointer on cards that are not clickable.
 */

export interface CardItem {
  id: string | number;
  /** Fallback source; also the widest tier. */
  url: string;
  /** Width-descriptor set, so a phone never pulls the desktop tier. @default undefined */
  srcSet?: string;
  /** Never rendered — the band is decorative and every frame is `alt=""`. It
   *  names the photograph for whoever edits the deck next. */
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
  /** The wash over the whole band. `/` bleaches it to 22%; a page that puts
   *  glass over it wants the photographs to survive. @default "bg-background/22" */
  washClassName?: string;
  /** The left-column wash from `lg` up. `true` is `/`'s solid column;
   *  `"soft"` is a lighter vignette for a page whose copy sits on a frosted
   *  pane — enough to calm the field around the pane, not enough to leave it
   *  nothing to see through; `false` is none. @default true */
  columnWash?: boolean | "soft";
  /** The white fade along the band's bottom edge below `lg`. `/` needs it: the
   *  band ends where the fold ends, and a hard bottom edge under the copy read
   *  as a cut. A page that lets the visitor scroll down INTO the band must turn
   *  it off — a fade to page-white at the foot of the first screen says "the
   *  page ends here", which is the opposite of what a peeking band should say.
   *  @default true */
  bottomFade?: boolean;
}

/**
 * The archive — eleven photographs from a past meeting. SPEC A1, delivered.
 *
 * The originals live in `docs/poze-intc/`, which never ships; `public/arhiva/`
 * holds two WebP tiers re-encoded from them by the recipe in SPEC 6.1.
 *
 * **The order is the deal, and it is deliberate.** Mean luminance alternates
 * high/low and no two neighbours share a subject, so a row never reads as two
 * versions of the same photograph sliding past. Every row is a rotation of
 * this one list, so reordering it reorders all five. Keep it interleaved.
 */
const ARCHIVE: readonly { n: string; title: string }[] = [
  { n: "01", title: "Adunarea pe platou" },
  { n: "02", title: "Rugăciune în genunchi" },
  { n: "03", title: "Mâini ridicate" },
  { n: "04", title: "Scena principală" },
  { n: "05", title: "Pauză pe iarbă" },
  { n: "06", title: "Cercetași cu pancarte" },
  { n: "07", title: "Aplauze în rând" },
  { n: "08", title: "Cântare împreună" },
  { n: "09", title: "Dans în sala mare" },
  { n: "10", title: "Bucurie în mulțime" },
  { n: "11", title: "Animatorii în față" },
];

const DEFAULT_CARDS: CardItem[] = ARCHIVE.map(({ n, title }, i) => ({
  id: i + 1,
  url: `/arhiva/${n}-1120.webp`,
  srcSet: `/arhiva/${n}-800.webp 800w, /arhiva/${n}-1120.webp 1120w`,
  title,
}));

/**
 * `sizes` must be the width a frame is PAINTED at, not the width of its box.
 * The sources are 3:2 under `object-cover`, so a narrow card fills by height
 * and overflows sideways — it paints 1.5x its own height, which is wider than
 * its box at every breakpoint. Hand the browser the box width instead and it
 * picks the small tier for a card that needs more, and the crowds go to mush.
 * A wide card is already wider than 1.5x its height, so there the box governs.
 */
/**
 * THE SMALL TIER IS 800w AND THE NUMBER IS LOAD-BEARING. Every photograph is
 * dealt into narrow slots AND wide slots, so it has two painted widths at
 * once. Put a tier boundary between them and the browser fetches BOTH files
 * for EVERY photograph — the deck doubles. Not hypothetical: at 640w a DPR3
 * phone wanted 558 for a narrow card and 684 for a wide one, either side of
 * the boundary, and pulled 848KB of a 270KB archive — on the one device class
 * this whole site is built for.
 *
 * The phone step now paints both widths at the SAME 264px, because the wide
 * card is exactly 1.5x the card height and that is the width a 3:2 source
 * occupies at that height. So a base-breakpoint straddle is no longer possible
 * at any DPR. 800w is what keeps DPR2 and DPR3 phones on the small tier
 * regardless: 264x3 = 792, just inside it. DPR3.5 needs 924 and takes the
 * 1120w tier whole — heavier at 578KB, but still one file per photograph.
 *
 * A 1024-1279px viewport at DPR2 still splits — 338 vs 408 painted, so 676 vs
 * 816 — and pays 930KB. That is a retina tablet or a small retina laptop, not
 * the target device, and closing it would mean shipping every phone a bigger
 * tier. Left open knowingly.
 *
 * All measured, none reasoned; the table is in SPEC 6.1. **A card size change
 * is also a tier change** — move either and re-measure the real transfer per
 * device class rather than re-deriving it on paper.
 */
const SIZES = {
  narrow:
    "(min-width: 1280px) 450px, (min-width: 1024px) 338px, (min-width: 640px) 300px, 264px",
  wide: "(min-width: 1280px) 544px, (min-width: 1024px) 408px, (min-width: 640px) 300px, 264px",
} as const;

/**
 * Frames per half-track. Each half must out-measure the 220vw row or the -50%
 * loop opens a visible gap, and the deck is what supplies them.
 *
 * Twelve is what the widest breakpoint needs. With `wide` on every third frame
 * a half measures 8x400 + 4x544 + 12x32 = 5760px, clearing 220vw up to a
 * 2618px viewport — a 2560px desktop included. The nine this carried while the
 * deck was three placeholders came to 4320px, a ceiling of 1963px, so every
 * 2560px monitor was showing the seam. Narrower breakpoints have far more
 * slack: 3056px against 858 at 390, 3488 against 1408 at sm, 4416 against 2253
 * at lg. All measured with offsetWidth — a rect on a rotated band is its
 * axis-aligned box and reads ~9% low.
 */
const MIN_PER_HALF = 12;

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
      "relative h-[176px] shrink-0 overflow-hidden rounded-xl sm:h-[200px] lg:h-[225px] xl:h-[300px]",
      wide
        ? "w-[264px] sm:w-[300px] lg:w-[408px] xl:w-[544px]"
        : "w-[220px] sm:w-[250px] lg:w-[300px] xl:w-[400px]",
      "shadow-card",
      className,
    )}
  >
    <img
      src={card.url}
      srcSet={card.srcSet}
      sizes={wide ? SIZES.wide : SIZES.narrow}
      alt=""
      width={1120}
      height={747}
      decoding="async"
      // Eleven unique files fill all five rows and every row repeats them, so
      // the first copy is the whole cost — the rest are cache hits. Fetch the
      // opening frames eagerly and coast.
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
              className="shrink-0 pr-5 sm:pr-6 lg:pr-8"
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

/* The `"soft"` column: never opaque, and gone by two thirds of the width. A
   frosted pane over a solid white column is invisible — this leaves the
   photographs under it at roughly half strength. */
const SCRIM_SOFT =
  "linear-gradient(to right, color-mix(in oklab, var(--background) 55%, transparent) 0%, " +
  "color-mix(in oklab, var(--background) 35%, transparent) 40%, transparent 68%)";

export default function DiagonalMarqueeCarousel({
  cards = DEFAULT_CARDS,
  angle = -25,
  baseSpeed = 90,
  alternateDirections = true,
  className = "",
  cardClassName = "",
  fadeClassName = "",
  washClassName = "bg-background/22",
  columnWash = true,
  bottomFade = true,
}: DiagonalMarqueeCarouselProps) {
  // Each row is dealt from a different rotation of the deck, so a frame is
  // never directly above a copy of itself — an unrotated deal reads as tiled
  // wallpaper rather than as an archive.
  const rotate = (n: number) => {
    const k = cards.length ? n % cards.length : 0;
    return [...cards.slice(k), ...cards.slice(0, k)];
  };

  // Top a deal up to MIN_PER_HALF: whole copies while one still fits, then
  // single frames taken from the MIDDLE of the deck. Taking the remainder from
  // the front instead would put cards[0] at both ends of the half — and the
  // -50% wrap joins those two ends, so the same photograph would run twice in
  // a row at the seam, which is the one thing the rotation exists to prevent.
  const fill = (deal: CardItem[]) => {
    if (!deal.length) return deal;
    const out = [...deal];
    while (out.length + deal.length <= MIN_PER_HALF) out.push(...deal);
    const mid = Math.floor(deal.length / 2);
    for (let k = 0; out.length < MIN_PER_HALF; k += 1) {
      out.push(deal[(mid + k) % deal.length]!);
    }
    return out;
  };

  const SPEEDS = [baseSpeed, Math.max(baseSpeed - 15, 30), baseSpeed + 15,
                  Math.max(baseSpeed - 6, 35), baseSpeed + 24];

  const rows = SPEEDS.map((speed, i) => {
    const dealt = fill(rotate(i));
    return {
      cards: i % 2 === 0 ? dealt : [...dealt].reverse(),
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
        className="absolute z-0 flex w-[220vw] flex-col gap-5 sm:gap-6 lg:gap-8"
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

      <div className={`pointer-events-none absolute inset-0 z-10 ${washClassName}`} />
      {columnWash && (
        <div
          className={cn("pointer-events-none absolute inset-0 z-10 hidden lg:block", fadeClassName)}
          style={{ background: columnWash === "soft" ? SCRIM_SOFT : SCRIM_RIGHT }}
        />
      )}
      {/* Edge softeners only — never a full-height wash below lg. A wash whose
          stops are viewport percentages slides out from under copy that is
          positioned by its own height: landscape, 200% zoom and a 640px-tall
          phone all dropped the kicker onto raw photography. The copy carries
          its own scrim instead — see page.tsx. */}
      <div className="from-background pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b to-transparent" />
      {bottomFade && (
        <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t to-transparent lg:hidden" />
      )}

    </div>
  );
}

/**
 * Great UI Component — https://great-ui.com · MIT
 * Author: Saurabh Sharma (x.com/srbh_s) · github.com/Saurabh-2607/GreatUI
 */
