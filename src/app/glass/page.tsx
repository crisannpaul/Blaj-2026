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
 *   it stays a photograph. Below `sm` it is a bottom sheet — full width,
 *   rounded at the top only, running under the home indicator — which costs
 *   no horizontal room on a 390px phone and is the shape a phone already knows
 *   glass in. From `sm` it is a free-standing card, left-aligned as the copy
 *   is at `lg`, and no wider than the branch pair: the cold review found a
 *   136px frosted void beside the cards at 768 when the card followed the
 *   copy's 33rem instead.
 *
 * - **The pane is CLEAR — a quarter white, 6px of blur.** The first cut was
 *   72% white and 18px of blur and the user said "more transparent" twice; the
 *   cold review, independently, said the 18px blur turned the marquee into
 *   grey blotches and the pane into a dirty card. Both are right for the same
 *   reason: a heavy blur over photographs produces stains, not glass. At 6px
 *   the photographs stay photographs and the pane is glass over them.
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
 * Everything else — the bottom-anchored fold, the `short:` / `tight:` height
 * bands, the safe-area padding, the alternation of the pair — is `/`'s and is
 * documented there. The vertical budget is TIGHTER than `/` by the sheet's own
 * top padding: a wash needed no room above the kicker, a pane needs a lip.
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
      <main className="relative isolate min-h-[100svh] overflow-hidden">
        <GlassFilter />

        <div className="relative z-20 flex min-h-[100svh] flex-col justify-end lg:justify-center lg:px-24">
          {/* The pane. Three decorative layers first — frost, fill, bevel —
            then the copy, which is `relative` so it paints above them (an
            in-flow block would paint UNDER positioned siblings). The pane
            clips, so the oversized frost layer never shows past the corners.
            No `isolate`, no `filter`, no `opacity` on this element: any of
            those would make it a backdrop root and the frost would blur its
            own empty parent instead of the marquee. */}
          <div
            className="glass-pane glass-shadow relative rounded-t-[1.75rem] px-6 pt-7 short:pt-4 tight:pt-5 sm:mx-6 sm:mb-6 sm:max-w-[29rem] sm:rounded-[1.75rem] short:mb-3 lg:mx-0 lg:mb-0 lg:max-w-[38rem] lg:px-10 lg:pt-10"
            style={{
              paddingBottom:
                "max(2.5rem, calc(env(safe-area-inset-bottom) + 2.5rem))",
            }}
          >
            <span aria-hidden="true" className="glass-frost glass-liquid" />
            <span
              aria-hidden="true"
              className="glass-fill [--glass-tint-top:32%] [--glass-tint:24%]"
            />
            <span aria-hidden="true" className="glass-bevel" />

            <div className="relative max-w-[33rem] lg:max-w-none">
              <h1>
                <span
                  aria-hidden="true"
                  className="bg-contrast mb-4 block h-1 w-10 rounded-full"
                />
                <span className="text-foreground font-ui text-h3 block font-medium">
                  {CONTENT.kicker}
                </span>
                <span
                  className="text-display short:text-h2 mt-3 short:mt-2 block font-semibold"
                  translate="no"
                >
                  {CONTENT.title}
                </span>
              </h1>

              <p className="text-foreground font-ui text-ui mt-4 tracking-[0.14em] uppercase">
                {CONTENT.meta}
              </p>

              <p className="text-body mt-5 short:mt-3 max-w-prose">
                {CONTENT.lead}
              </p>

              <BranchPanels
                panels={BRANCHES}
                finish="glass"
                className="mt-6 short:mt-5 max-w-[26rem] lg:max-w-[32rem]"
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
          />
        </div>
      </main>
    </ViewTransition>
  );
}
