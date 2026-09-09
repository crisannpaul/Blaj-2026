import { ViewTransition } from "react";
import {
  HeroCarousel,
  type HeroCarouselItem,
} from "@/components/ui/hero-carousel";
import { ATELIERE, atelierNo } from "@/lib/ateliere";

export const metadata = { title: "Ateliere" };

/**
 * The seven workshops the organizers delivered on 8 Sep, from
 * `src/lib/ateliere.ts` — titles, numbers, durations, seats and the hooks are
 * theirs. The stage shows one card per workshop and the copy band carries a
 * two-sentence hook; everything longer waits for `/ateliere/[slug]`.
 *
 * Numbers are the organizers' own, gaps included: A1 is the hunt and there is
 * no A8, so the strip reads 02 … 09. Renumbering would put the site at odds
 * with every printed sheet on the day.
 *
 * The photographs are the organizers' too, cropped to the card's 3:4 by
 * `scripts/photos.js`. A7 has none yet and sits on a stock frame,
 * which its credit line says out loud rather than hides.
 *
 * `accent` alternates the site's two accents, lapis and gilt, as CSS variables
 * rather than hex — the palette lives in globals.css and nowhere else. The
 * grade washes toward --stage, so the luminance floor does not depend on the
 * accent (SPEC 6.1b) — which is what lets an accent as deep as lapis grade a
 * light stage at all. Verify any new accent with ink.js regardless.
 */
const ACCENT = { lapis: "var(--brand)", gold: "var(--contrast)" } as const;

const WORKSHOPS: HeroCarouselItem[] = ATELIERE.map((a) => ({
  id: a.slug,
  title: a.cardTitle,
  image: a.image,
  // The stage paints the card image a second time as the full-bleed field, so
  // a card cut from a collage or a poster puts its own lettering across the
  // fold at 1440. `scripts/photos.js` emits a 120px-wide sibling for
  // that job, one per workshop — including the one still on a stock frame,
  // because six soft fields and one sharp photograph reads as a bug.
  // Keyed off the SLUG, not the image path: the stock card is a .jpg and a
  // derivation by extension silently handed that slide its sharp original.
  backdropImage: `/ateliere/${a.slug}-bg.webp`,
  credit: a.imagePlaceholder
    ? `Atelier ${atelierNo(a)} · foto în curând`
    : `Atelier ${atelierNo(a)}`,
  meta: [`${a.durationMin} min`, `${a.seats} locuri`],
  description: a.hook,
  // Each card opens its own page; the not-yet signup control lives there.
  ctaLabel: "Detalii",
  ctaHref: `/ateliere/${a.slug}`,
  accent: ACCENT[a.accent],
}));

/** Open on the middle card so the strip visibly continues both ways. */
const DEFAULT_INDEX = Math.floor(WORKSHOPS.length / 2);

export default function Ateliere() {
  return (
    <ViewTransition
      enter={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "none",
      }}
      exit={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "none",
      }}
      default="none"
    >
      <main className="h-[100svh]">
        <HeroCarousel
          items={WORKSHOPS}
          defaultIndex={DEFAULT_INDEX}
          brand="Blaj 2026"
          backHref="/"
          backLabel="Acasă"
          label="Atelierele întâlnirii"
          syncHash
        />
      </main>
    </ViewTransition>
  );
}
