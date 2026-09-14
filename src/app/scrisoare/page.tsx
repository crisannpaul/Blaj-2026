import type { Metadata } from "next";
import { ViewTransition } from "react";
import DiagonalMarqueeCarousel from "@/components/ui/diagonal-marquee-carousel";
import {
  BranchPanels,
  type BranchPanel,
} from "@/components/ui/branch-panels";
import { WelcomeLetter } from "@/components/ui/welcome-letter";

/**
 * THE LANDING PAGE WITH THE LETTER — a candidate for `/`, served at
 * `/scrisoare` so it can be judged beside the live fold before anything
 * replaces it. It answers SPEC D15: the organizers' welcome letter does not
 * fit the hero slot, so where does it go? Here: a card of its own, beside the
 * copy from `xl` up and under it on everything narrower, where the page
 * scrolls.
 *
 * Same fold as `/` — kicker, title, date, lead, the two branch panels, the
 * archive marquee behind — and the fold's geometry does not move: it is still
 * bottom-anchored with the same slack, because the answer is a second surface,
 * not a longer lead. More text in the lead has been tested and breaks the
 * layout (see the LEAD note in `page.tsx`).
 *
 * BRANCHES and CONTENT are COPIED from `page.tsx` rather than imported, on
 * purpose: that file is the live page and is edited on its own; this one
 * either replaces it wholesale or is deleted. Keep them in step until then.
 *
 * What differs from `page.tsx`, and why:
 *
 *  - THE LEAD IS THE ORGANIZERS' FIRST SENTENCE ALONE, 163 characters, not
 *    the 220-character cut that folded the programme list onto it. That fold
 *    was made because the rest of the letter did not fit; with the letter on
 *    the page, "rugăciune, ateliere, prieteni noi" in the lead and
 *    "rugăciunea, bucuria întâlnirii, prieteniile noi" three lines later read
 *    as the same sentence twice, and on a desktop they sit side by side. The
 *    shorter lead also buys the fold back a line at every width.
 *
 *  - THE MARQUEE IS A STICKY BACKDROP, not the fold's own absolute layer. On a
 *    phone this page is taller than one screen and the archive has to keep
 *    covering it; a band sized to the fold would stop dead where the letter
 *    starts. The wrapper is one viewport tall, sticks to the top, and is
 *    pulled back under the content by its own height, so the copy and the
 *    letter scroll over photographs that stay put — same picture on every
 *    screen, no second background to design. `lvh` rather than `svh`: on iOS
 *    the viewport grows when the toolbar collapses, and a backdrop sized to
 *    the small viewport would leave a strip of bare page under it. `main` is
 *    `overflow-x: clip`, not `hidden`, because `hidden` makes it a scroll
 *    container and sticky then sticks to it instead of to the window. The
 *    band's bottom edge-softener is OFF (`bottomFade`): pinned, it would
 *    whiten the last 64px of every screen, and the one thing that has to read
 *    down there is the letter's top edge.
 *
 *  - THE LETTER PEEKS, AND THE PEEK IS A LINE OF TEXT. The fold is 60px
 *    shorter than the screen, so under the panels sit the card's top padding
 *    (24) and its whole salutation — „Dragi tineri,” at the h2 step, 29px
 *    with a 1.05 line-height at 390 — with ~5px to spare below the line box.
 *    That is the scroll affordance: the letter's own first words at the foot
 *    of the screen. It got here in four steps. 28px showed the top 8px of a
 *    kicker's capitals, sliced by the viewport — a strip of cut letters reads
 *    as a bug. 20px was paper only, and the cold review measured it at 1.16:1
 *    against the wash under the panels: a near-white strip on a near-white
 *    band, the one signal the page has that anything is below, invisible.
 *    48px showed the whole kicker line, „Cuvânt de bun venit”; then the user
 *    cut the kicker, and the salutation — bigger ink still — took its place.
 *    A whole line of ink is a signal at any contrast the paper can manage,
 *    and the card's own halo (`shadow-sheet`) draws the edge as well. On a
 *    phone that is already too short for the fold, the fold grows past the
 *    screen and the peek is simply gone, which is the right failure.
 *
 *  - TWO COLUMNS FROM `xl`, NOT `lg`. At 1024–1279 the side-by-side does not
 *    fit: the title is the binding width on the left — "Blaj 2026" at the
 *    ramp's 88px cap is ~435px — and the right column that leaves at 1024 is
 *    under 400px, on which the letter runs 777px tall against a 768px viewport
 *    (an iPad on its side, exactly). The page then scrolled 137px and the
 *    salutation was cut through the glyphs at the top of the window. So that
 *    band stacks like a tablet instead, and the grid starts where both columns
 *    have room.
 *
 *  - THE COLUMNS ARE FIXED, THE COPY IS ANCHORED LEFT, THE LETTER RIGHT. The
 *    copy column is the copy block's own 38rem and the card's is 32rem, the
 *    grid is `justify-content: space-between`, and the padding is the `px-24`
 *    that `/` uses — so the kicker, title, lead and panels sit at exactly 96px
 *    from the left edge at every width, which is where `/` has them and where
 *    the user wants them ("it was perfect where it was before, to the left"),
 *    and the card sits 96px from the right edge, mirroring them, with the
 *    photographs running between the two. The first cut used `1.15fr : 1fr`
 *    inside a centred `max-w-[96rem]`, and on a wide screen that walked the
 *    whole fold inward — 288px from the edge at 1920, 608 at 2560 — which the
 *    user saw at once and rejected. The second put the card 64px off the
 *    copy's right edge, and the user asked for it further right; the edge is
 *    the one position that needs no number. Below 38 + 32rem + gap (1472px)
 *    the free space is gone and both columns shrink from their maxima — 1280
 *    still gives the title room.
 *
 *  - BELOW `xl` THE CARD ALIGNS TO THE COPY COLUMN and carries a wash of its
 *    own. From `sm` it is capped at 33rem — the copy block's own width — so
 *    its right edge lands on the lead's right edge rather than 48px past it,
 *    and behind it a full-width scrim of the same recipe as the copy's, so the
 *    strip of raw photography beside the card on a tablet (22% of the width
 *    at 768, 29% on a sideways phone) is washed the way it is beside the copy
 *    above. Not on a phone: at 390 the flanks are 16px of photograph and a
 *    92%-white wash there would only erase the card's own sides.
 */
export const metadata: Metadata = {
  title: "Scrisoare (probă)",
  // A candidate page, not a destination. Off the index until it is `/`.
  robots: { index: false, follow: false },
};

const BRANCHES: readonly BranchPanel[] = [
  {
    href: "/ateliere",
    label: "Ateliere",
    image: "/landing/workshops.webp",
    tint: "sky",
  },
  {
    href: "/blajhunt",
    label: "Blajhunt",
    image: "/landing/blajhunt.webp",
    tint: "gold",
  },
];

const CONTENT = {
  kicker: "Întâlnirea Intereparhială a Tinerilor",
  title: "Blaj 2026",
  meta: "19 septembrie 2026 · Blaj",
  lead:
    "La invitația Preafericitului Părinte Claudiu, tinerii din Arhieparhia " +
    "de Alba Iulia și Făgăraș și din Eparhia de Cluj-Gherla petrec o zi " +
    "împreună în Mica Romă.",
} as const;

/** The copy's own scrim below xl — identical to `page.tsx`, see the note there. */
const COPY_SCRIM =
  "linear-gradient(to bottom, transparent 0%, " +
  "color-mix(in oklab, var(--background) 90%, transparent) 22%, " +
  "color-mix(in oklab, var(--background) 90%, transparent) 88%, transparent 100%)";

/**
 * The letter's wash, sm to xl. Same recipe, and the same rule: both ramps
 * complete INSIDE the box, or the wash draws its own edge across the page.
 * The top ramp is short (12%) and the box starts only 24px above the card, so
 * the band between the panels and the card — where the peek has to read on a
 * short tablet — is barely touched: ~20% at the card's top row.
 */
const LETTER_SCRIM =
  "linear-gradient(to bottom, transparent 0%, " +
  "color-mix(in oklab, var(--background) 90%, transparent) 12%, " +
  "color-mix(in oklab, var(--background) 90%, transparent) 90%, transparent 100%)";

export default function Scrisoare() {
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
      <main className="relative isolate overflow-x-clip">
        {/* The backdrop. First in the DOM because the negative margin has to
          pull the content up over it; nothing in it is focusable, so source
          order costs the keyboard nothing. */}
        <div
          aria-hidden="true"
          className="pointer-events-none sticky top-0 z-0 -mb-[100lvh] h-[100lvh]"
        >
          <DiagonalMarqueeCarousel bottomFade={false} />
        </div>

        <div className="relative z-10 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+2.5rem))] xl:grid xl:min-h-[100svh] xl:grid-cols-[minmax(0,38rem)_minmax(0,32rem)] xl:items-center xl:justify-between xl:gap-x-16 xl:px-24 xl:py-10">
          {/* THE FOLD. Bottom-left on a phone, 60px short of the screen so the
            letter's salutation shows under the panels; a centred left column
            from xl. */}
          <div className="short:pt-6 tight:pt-8 flex min-h-[calc(100svh-3.75rem)] flex-col justify-end px-6 pt-16 pb-6 xl:min-h-0 xl:px-0 xl:pt-0 xl:pb-0">
            <div className="relative max-w-[33rem] xl:max-w-[38rem]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-[50vw] -top-36 -bottom-20 -z-10 xl:hidden"
                style={{ background: COPY_SCRIM }}
              />

              <h1>
                <span
                  aria-hidden="true"
                  className="bg-contrast mb-4 block h-1 w-10 rounded-full"
                />
                <span className="text-brand-text font-ui text-h3 block font-medium">
                  {CONTENT.kicker}
                </span>
                <span
                  className="text-display short:text-h2 short:mt-2 mt-3 block font-semibold"
                  translate="no"
                >
                  {CONTENT.title}
                </span>
              </h1>

              <p className="text-muted-foreground font-ui text-ui mt-4 tracking-[0.14em] uppercase">
                {CONTENT.meta}
              </p>

              <p className="text-body short:mt-3 mt-5 max-w-prose">
                {CONTENT.lead}
              </p>

              <BranchPanels
                panels={BRANCHES}
                className="short:mt-5 mt-6 max-w-[26rem] xl:max-w-[32rem]"
              />
            </div>
          </div>

          {/* THE LETTER. 16px from a phone's edges — inside the fold's 24px
            text margin, because a surface can sit closer to the edge than
            ink can. From sm it is the copy column's width, on its own wash;
            at xl it is the right column, hugging the far side. */}
          <div className="relative mx-4 sm:mx-6 sm:max-w-[33rem] xl:mx-0 xl:w-full xl:max-w-[32rem]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-[50vw] -top-6 -bottom-10 -z-10 hidden sm:block xl:hidden"
              style={{ background: LETTER_SCRIM }}
            />
            <WelcomeLetter />
          </div>
        </div>
      </main>
    </ViewTransition>
  );
}
