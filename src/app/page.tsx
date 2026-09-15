import { ViewTransition } from "react";
import DiagonalMarqueeCarousel from "@/components/ui/diagonal-marquee-carousel";
import {
  BranchPanels,
  type BranchPanel,
} from "@/components/ui/branch-panels";
import { LetterBell } from "@/components/ui/letter-bell";

/**
 * THE LANDING PAGE. One fold, one screen, no scroll: kicker, title, date, the
 * lead and the two branch panels over the archive marquee — plus, since
 * 15 Sep, a bell in the top-right corner that opens the organizers' welcome
 * letter as a message (`letter-bell.tsx`).
 *
 * The letter was ON the fold for one evening, 14 Sep: a card beside the copy
 * on a desktop and a second, scrolling screen under it on a phone, with the
 * marquee pinned as a sticky backdrop (commit 9b36e8f has every number).
 * The user reverted it on 15 Sep: the desktop
 * was fine, the phone "looks completely ass", and nobody reads a wall of text
 * on a page whose job is routing to two branches. So the fold is what it was
 * — bottom-anchored copy, `min-h-[100svh]`, the marquee as its own absolute
 * layer — and the letter is a notification. What that message looks like
 * when it opens is phase two; today it is a plain sheet.
 *
 * The two BRANCHES are the page's whole job: this is the common trunk and the
 * day has exactly two things in it. They are labels only, by decision — no
 * descriptive sub-line — so the pair reads as a poster rather than a menu.
 *
 * The two images are the commissioned artwork (A1/A3), supplied 8 Sep and
 * converted to webp from the originals kept out of the bundle in `docs/`. They
 * are 1152x928, i.e. 5:4 — sized to the largest the open panel is ever painted
 * (390x288 CSS px, 1170x864 on a 3x phone) so nothing upscales. See the export
 * geometry table in scripts/photos.js before commissioning any replacement:
 * the open panel's ratio moves from 1.08 at 390 to 1.35 at lg, and
 * `object-cover` centre-crops.
 *
 * The tint is what keeps them from reading as more of the marquee behind them.
 * Sky goes to the workshops because /ateliere already carries a sky cast, and
 * gold to the hunt because a treasure hunt is the one thing on this page that
 * gold actually means something for.
 */
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

/**
 * Every string here is the organizers' own since the 14 Sep copy review (rows
 * AC-01 to AC-04 of the inventory); the rest of their letter is `LETTER` in
 * `welcome-letter.tsx` (AC-07 to AC-13), behind the bell.
 *
 * THE LEAD IS LENGTH-CONSTRAINED, and the constraint is structural, not taste.
 *
 * The fold is `justify-end` inside `min-h-[100svh]`, so the copy block is
 * anchored to the BOTTOM and every extra line of lead pushes the kicker UP,
 * toward and then off the top of the screen. Measured slack below the cards is
 * exactly the 56px of bottom padding at every width from 375 to 768: there is
 * no spare room to grow into, only room taken from the top.
 *
 * The text supplied on 8 Sep ran 305 characters. It was cut to ~215 by dropping
 * "Vă așteptăm cu un program complex și atractiv din care nu lipsesc" — a
 * clause that announces a list instead of being one — and folding the list onto
 * the first sentence. Nothing factual went: the invitation, both eparchies and
 * all five things in the programme survive. The eparchy names would save the
 * most characters by far and are exactly what must NOT be cut, because naming
 * Cluj-Gherla is how a young person from Cluj-Gherla knows they are invited.
 *
 * The copy-review round came back on 14 Sep with 948 characters for this slot —
 * a full welcome letter, "Dragi tineri" through to the Biroul's signature. That
 * is 4.3x the box. Injected into the running page at 390 it took the lead from
 * 128px to 563px, pushed the document to 1055px against an 844px fold and put
 * BOTH branch panels under it. The letter therefore lives behind the bell, with
 * real paragraphs and the signature (`welcome-letter.tsx`), and this slot keeps
 * the lead THE USER KNOWS from the live site — the invitation with the
 * programme list folded on, restored by them on 15 Sep after the letter work
 * had cut it to the letter's first sentence. 213 characters: 7 lines at 320,
 * 6 at 375, 5 at 390, 3 at 1440, measured. (The 14 Sep sheet's own version of
 * this sentence adds "în Mica Romă" and drops "voie bună"; the user's wording
 * wins, and the sheet's is one string away.)
 *
 * Count characters to get close, then count LINES, because the line count is
 * what the box actually spends. If it grows again, the room comes from the
 * CARDS, not from the top of the screen — and that is a coupled decision with
 * the vertical mark on a spine. See the height note in `branch-panels.tsx`
 * before changing either.
 */
const CONTENT = {
  kicker: "Întâlnirea Intereparhială a Tinerilor",
  title: "Blaj 2026",
  meta: "19 septembrie 2026 · Blaj",
  lead:
    "La invitația Preafericitului Părinte Claudiu, tinerii din Arhieparhia " +
    "de Alba Iulia și Făgăraș și din Eparhia de Cluj-Gherla petrec o zi " +
    "împreună — rugăciune, voie bună, ateliere, prieteni noi și un oraș " +
    "de descoperit.",
} as const;

/**
 * The copy's own scrim, below lg. Two things matter here.
 *
 * It is anchored to the COPY BLOCK, not the viewport. A wash with
 * viewport-percentage stops slides out from under text positioned by its own
 * height — that is what dropped the kicker to 2.24:1 in landscape and 1.96:1
 * at 200% zoom.
 *
 * And its ramps must COMPLETE INSIDE the box, or the scrim's own edge draws a
 * hard line across the fold. A radial at `140% 125%` is still fully opaque
 * where the box ends, because the box edge sits at 0.5H while the gradient's
 * radius is 1.25H. This linear reaches transparent at both ends by
 * construction: solid 22%-88%, ramping over the padding.
 *
 * That reasoning covers the TOP and BOTTOM edges only, which is exactly how
 * this shipped a third time. `to bottom` has no horizontal ramp at all, so the
 * box's left and right edges are square cuts. Below 592px both hang off the
 * screen and nobody sees them; from 592px up to `lg` the right edge is inside
 * the viewport and sliced whatever photograph it landed on — a 45%-luminance
 * step straight down the artwork at 768 wide and on any phone held sideways.
 * The box is therefore inset by -50vw on both sides: the gradient does not
 * need the width, it needs its own vertical edges to be the only edges it has.
 *
 * At 90% the marquee still reads through it — over a pure black photo the
 * kicker measures 5.15:1, and it is 5.16:1 in practice.
 */
const COPY_SCRIM =
  "linear-gradient(to bottom, transparent 0%, " +
  "color-mix(in oklab, var(--background) 90%, transparent) 22%, " +
  "color-mix(in oklab, var(--background) 90%, transparent) 88%, transparent 100%)";

export default function Home() {
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
      <main className="relative isolate min-h-[100svh] overflow-hidden">
        {/* Copy is bottom-left on a phone — the actions land in the thumb zone
          and the fold stops being a centred template. It shifts to a left
          column at lg, where the photographs get the right half. */}
        <div
          className="relative z-20 flex min-h-[100svh] flex-col justify-end px-6 pt-16 pb-14 short:pt-6 tight:pt-8 lg:justify-center lg:px-24 lg:pb-14"
          style={{
            paddingBottom:
              "max(2.5rem, calc(env(safe-area-inset-bottom) + 2.5rem))",
          }}
        >
          <div className="relative max-w-[33rem] lg:max-w-[38rem]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-[50vw] -top-36 -bottom-20 -z-10 lg:hidden"
              style={{ background: COPY_SCRIM }}
            />

            <h1>
              {/* Block, not a flex sibling of the text: as a sibling under
                items-center it centred on the whole kicker, so the moment the
                kicker wrapped to two lines the rule sat level with neither. */}
              <span
                aria-hidden="true"
                className="bg-contrast mb-4 block h-1 w-10 rounded-full"
              />
              <span className="text-brand-text font-ui text-h3 block font-medium">
                {CONTENT.kicker}
              </span>
              <span
                className="text-display short:text-h2 mt-3 short:mt-2 block font-semibold"
                translate="no"
              >
                {CONTENT.title}
              </span>
            </h1>

            <p className="text-muted-foreground font-ui text-ui mt-4 tracking-[0.14em] uppercase">
              {CONTENT.meta}
            </p>

            <p className="text-body mt-5 short:mt-3 max-w-prose">{CONTENT.lead}</p>

            {/* The two branches. One open, one a spine; the pair alternates
              on its own until the visitor does anything, because hover does
              not exist on the phone this is designed for. */}
            <BranchPanels
              panels={BRANCHES}
              className="mt-6 short:mt-5 max-w-[26rem] lg:max-w-[32rem]"
            />
          </div>
        </div>

        {/* After the panels in the DOM so a keyboard lands on the calls to
          action before a secondary control; it paints top-right regardless,
          because it is fixed. */}
        <LetterBell />

        {/* Paint order is z-index, not source order. */}
        <div className="absolute inset-0">
          <DiagonalMarqueeCarousel />
        </div>
      </main>
    </ViewTransition>
  );
}
