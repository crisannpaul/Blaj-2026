import type { Metadata } from "next";
import { ViewTransition } from "react";
import DiagonalMarqueeCarousel from "@/components/ui/diagonal-marquee-carousel";
import { BranchPanels } from "@/components/ui/branch-panels";
import { GlassFilter } from "@/components/ui/glass-filter";
import { BRANCHES, CONTENT } from "@/lib/landing";

/**
 * THE LANDING, IN GLASS. An experiment, not a page: same content, same
 * composition and same two branches as `/`, with the two covers that protect
 * the ink over the photographs swapped for panes of clear glass (globals.css,
 * GLASS). It exists so the two can be looked at side by side before one of
 * them is chosen. Unlinked and `noindex`; if it wins, it replaces `page.tsx`
 * and this file goes.
 *
 * What is different from `/`, and why:
 *
 * - **The copy sits on a pane, not under a wash.** `/` protects the kicker
 *   with a 90% `--background` gradient inset -50vw so it has no visible edges.
 *   A pane is the opposite idea: it has edges on purpose, and what is behind
 *   it stays a photograph. From `sm` it is a free-standing card that hugs its
 *   content, left-aligned as the copy is at `lg`, and no wider than the branch
 *   pair: the cold review found a 136px frosted void beside the cards at 768
 *   when the card followed the copy's 33rem instead.
 *
 * - **On a phone the card IS the screen, and the page does not scroll.** The
 *   card fills the viewport inside a 12px margin, all four corners showing,
 *   the copy at the top and the two branches pinned to the bottom in the
 *   thumb zone (`mt-auto`). What the glass is for on a phone is the empty
 *   middle of the pane, where the marquee shows through, and the margin round
 *   it, where it shows plain. Copy that grows eats that middle first; only
 *   past it does the card outgrow the screen and the page scroll — 320x568
 *   and a phone held sideways, which is where `/` overflows too.
 *
 *   This is the user's own layout, and it replaced two others in one day.
 *   The third cut was `/`'s bottom sheet: the copy covered most of the phone
 *   and the marquee was "awkwardly seen" in a strip along the top. The next
 *   was a top-hanging sheet over a sticky marquee with one extra screen of
 *   scroll, so the pane slid over the photographs and the page ended on them;
 *   the user looked at it on the phone and said no — "there is no point for
 *   scrolling now" — and asked for the card to fit the whole screen with its
 *   top edges visible. The marquee's edge fades are off (`topFade` /
 *   `bottomFade`): with photographs meant to show in the margins, a fade to
 *   page-white there would read as a white frame.
 *
 * - **The pane is CLEAR — a quarter white, 3px of blur.** The first cut was
 *   72% white and 18px of blur and the user said "more transparent" twice; the
 *   cold review, independently, said the 18px blur turned the marquee into
 *   grey blotches and the pane into a dirty card. Both are right for the same
 *   reason: a heavy blur over photographs produces stains, not glass. The
 *   third cut settled on 6px; a second cold review measured that at 390 only
 *   18% of the photograph's detail survived it — the marquee's frames are
 *   176px tall on a phone and a 6px blur erases a face at that size — against
 *   42% at 1440, which is why desktop read as glass and the phone did not.
 *   The user's own reference was 3px. See the GLASS note in globals.css for
 *   what was measured on the way to the value.
 *
 * - **Every ink on the pane is near-black.** On `/` the kicker is sky
 *   (`--brand-text`, L=0.12) and the date line is `--muted-foreground`; those
 *   are the two inks that failed the moment the pane went below ~60% white
 *   (4.31:1 at 50%). Near-black ink over a 25% pane holds 4.5:1 even over a
 *   black frame — the arithmetic is in globals.css — so it is the ink that
 *   changes, not the glass. The sky accent moves from the kicker to the
 *   Ateliere chip, where it already was; the yellow rule stays. Apple's own
 *   glass never puts a mid-tone colour on text for exactly this reason.
 *
 * - **The marquee is less bleached.** The wash over the band drops from 22% to
 *   10% and the solid left column at `lg` becomes a soft vignette, because the
 *   pane now does that job and glass over an already-white field is invisible.
 *
 * - **The branch cards carry `finish="glass"`**: a clear lip under the label
 *   instead of a gradient scrim, and a tinted-glass chip for the spine instead
 *   of a flat 75% wash. See the TINT note in `branch-panels.tsx`.
 *
 * `<GlassFilter />` is the refraction map every `glass-liquid` layer on the
 * page references; it renders once, here.
 *
 * The `short:` / `tight:` height bands and the alternation of the pair are
 * `/`'s and are documented there. `tight:` (521–700px tall — an iPhone SE, a
 * 320x568) additionally takes 28px out of the card's vertical rhythm here, so
 * that an SE still fits the card without scrolling. The margin round the card
 * grows to the safe-area insets where the page runs under a status bar or a
 * home indicator (`safe-area-inset-*` is 0 in Safari's own portrait view and
 * real in a standalone one).
 */
export const metadata: Metadata = {
  title: "Glass (experiment)",
  robots: { index: false, follow: false },
};

export default function GlassHome() {
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
      <main className="relative isolate min-h-svh overflow-hidden">
        <GlassFilter />

        {/* The column is the screen; the card fills it below `sm` and hugs
          its content from `sm`. */}
        <div className="relative z-20 flex min-h-svh flex-col p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6 lg:justify-center lg:px-24 lg:py-0">
          {/* The pane. Three decorative layers first — frost, fill, bevel —
            then the copy, which is `relative` so it paints above them (an
            in-flow block would paint UNDER positioned siblings). The pane
            clips, so the oversized frost layer never shows past the corners.
            No `isolate`, no `filter`, no `opacity` on this element: any of
            those would make it a backdrop root and the frost would blur its
            own empty parent instead of the marquee. */}
          <div className="glass-pane glass-shadow relative flex flex-1 flex-col rounded-[1.75rem] px-5 pt-7 pb-5 short:pt-4 tight:pt-5 sm:max-w-[29rem] sm:flex-none sm:px-6 sm:pb-10 lg:max-w-[38rem] lg:px-10 lg:pt-10">
            <span aria-hidden="true" className="glass-frost glass-liquid" />
            <span
              aria-hidden="true"
              className="glass-fill [--glass-tint-top:32%] [--glass-tint:24%]"
            />
            <span aria-hidden="true" className="glass-bevel" />

            <div className="relative flex max-w-[33rem] flex-1 flex-col lg:max-w-none">
              <h1>
                <span
                  aria-hidden="true"
                  className="bg-contrast mb-4 tight:mb-3 block h-1 w-10 rounded-full"
                />
                <span className="text-foreground font-ui text-h3 block font-medium">
                  {CONTENT.kicker}
                </span>
                <span
                  className="text-display short:text-h2 mt-3 short:mt-2 tight:mt-2 block font-semibold"
                  translate="no"
                >
                  {CONTENT.title}
                </span>
              </h1>

              <p className="text-foreground font-ui text-ui mt-4 tight:mt-3 tracking-[0.14em] uppercase">
                {CONTENT.meta}
              </p>

              <p className="text-body mt-5 short:mt-3 tight:mt-4 max-w-prose">
                {CONTENT.lead}
              </p>

              {/* `mt-auto` pins the pair to the foot of the card; the padding
                is the least air it ever has above it. */}
              <BranchPanels
                panels={BRANCHES}
                finish="glass"
                className="mt-auto max-w-[26rem] pt-6 short:pt-5 tight:pt-5 lg:max-w-[32rem]"
              />
            </div>
          </div>
        </div>

        {/* Last in the DOM so a keyboard lands on the call to action first.
          Paint order is z-index, not source order. */}
        <div className="absolute inset-0">
          <DiagonalMarqueeCarousel
            washClassName="bg-background/10"
            columnWash="soft"
            topFade={false}
            bottomFade={false}
          />
        </div>
      </main>
    </ViewTransition>
  );
}
