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
 * copy from `lg` up and under it on a phone, where the page scrolls.
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
 *    container and sticky then sticks to it instead of to the window.
 *
 *  - THE LETTER PEEKS. The fold is 20px shorter than the screen, so the top
 *    edge of the card — corners, shadow, a strip of paper — shows under the
 *    panels on first paint. That is the whole scroll affordance: nothing says
 *    "scroll", the page just visibly continues. 20px, and the card's top
 *    padding is 24: the peek must be PAPER ONLY. The first cut showed 28px,
 *    which put the top 8px of the kicker's capitals on screen, sliced by the
 *    viewport edge — a strip of paper reads as a card, a strip of letters
 *    reads as a bug. On a phone that is already too short for the fold the
 *    fold grows past the screen and the peek is simply gone, which is the
 *    right failure.
 *
 *  - From `lg` up the content is a two-column grid: copy left, letter right,
 *    both centred on the fold. The columns are fluid (1.15fr : 1fr) rather
 *    than fixed because 38rem + 32rem + gap does not fit inside a 1024px
 *    viewport with its padding; the title is the binding width on the left —
 *    "Blaj 2026" at the ramp's 88px cap is ~435px — and 1024 gives it 467.
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

/** The copy's own scrim below lg — identical to `page.tsx`, see the note there. */
const COPY_SCRIM =
  "linear-gradient(to bottom, transparent 0%, " +
  "color-mix(in oklab, var(--background) 90%, transparent) 22%, " +
  "color-mix(in oklab, var(--background) 90%, transparent) 88%, transparent 100%)";

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
          <DiagonalMarqueeCarousel />
        </div>

        <div className="relative z-10 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+2.5rem))] lg:mx-auto lg:grid lg:min-h-[100svh] lg:max-w-[96rem] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-x-12 lg:px-16 lg:py-16 xl:px-24">
          {/* THE FOLD. Bottom-left on a phone, 20px short of the screen so the
            letter peeks; a centred left column from lg. */}
          <div className="short:pt-6 tight:pt-8 flex min-h-[calc(100svh-1.25rem)] flex-col justify-end px-6 pt-16 pb-6 lg:min-h-0 lg:px-0 lg:pt-0 lg:pb-0">
            <div className="relative max-w-[33rem] lg:max-w-[38rem]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-[50vw] -top-36 -bottom-20 -z-10 lg:hidden"
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
                className="short:mt-5 mt-6 max-w-[26rem] lg:max-w-[32rem]"
              />
            </div>
          </div>

          {/* THE LETTER. 16px from the phone's edges — inside the fold's 24px
            text margin, because a surface can sit closer to the edge than
            ink can. Capped at 36rem from sm, because a tablet or a phone on
            its side would otherwise hand it the whole width and a 720px card
            is an 80-character measure. At lg it is the right column, hugging
            the far side. */}
          <WelcomeLetter className="mx-4 sm:mx-6 sm:max-w-[36rem] lg:mx-0 lg:w-full lg:max-w-[32rem] lg:justify-self-end" />
        </div>
      </main>
    </ViewTransition>
  );
}
