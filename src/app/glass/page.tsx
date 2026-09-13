import type { Metadata } from "next";
import { ViewTransition } from "react";
import DiagonalMarqueeCarousel from "@/components/ui/diagonal-marquee-carousel";
import { BranchPanels } from "@/components/ui/branch-panels";
import { BRANCHES, CONTENT } from "@/lib/landing";

/**
 * THE LANDING, IN GLASS. An experiment, not a page: same content, same
 * composition and same two branches as `/`, with the two covers that protect
 * the ink over the photographs swapped for frosted panes (globals.css, GLASS).
 * It exists so the two can be looked at side by side before one of them is
 * chosen. Unlinked and `noindex`; if it wins, it replaces `page.tsx` and this
 * file goes.
 *
 * What is different from `/`, and why:
 *
 * - **The copy sits on a SHEET, not under a wash.** `/` protects the kicker
 *   with a 90% `--background` gradient inset -50vw so it has no visible edges.
 *   A pane is the opposite idea: it has edges on purpose, and what is behind
 *   it stays legible as photographs. Below `lg` it is a bottom sheet — full
 *   width, rounded at the top only, running under the home indicator — which
 *   costs no horizontal room on a 390px phone and is the shape a phone already
 *   knows glass in. From `lg` it is a free-standing card in the left column.
 *
 * - **The marquee is less bleached.** The wash over the band drops from 22% to
 *   10% and the solid left column at `lg` becomes a soft vignette, because the
 *   sheet now does that job and a frosted pane over an already white field is
 *   invisible — glass only reads as glass when there is something to see
 *   through it. With no column at all the desktop turned into a photo wall
 *   with a card on it, which is the opposite of subtle; the vignette keeps
 *   the field calm around the pane and vivid to the right of it.
 *
 * - **The branch cards carry `finish="glass"`**: a frosted lip under the label
 *   instead of a gradient scrim, and a frosted colour chip for the spine
 *   instead of a flat 75% wash. See the TINT note in `branch-panels.tsx`.
 *
 * Everything else — the bottom-anchored fold, the `short:` / `tight:` height
 * bands, the safe-area padding, the alternation of the pair — is `/`'s and is
 * documented there.
 *
 * The vertical budget is TIGHTER than `/` by the sheet's own top padding: the
 * wash needed no room above the kicker, a pane needs a lip. That is why the
 * padding steps down through `tight:` and `short:` rather than staying at one
 * value — the 375x667 phone had 0px of slack before this page existed.
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
        <div className="relative z-20 flex min-h-[100svh] flex-col justify-end lg:justify-center lg:px-24">
          {/* The sheet. `isolate` scopes the rim's ring (z-index 1 inside
            `glass-rim`) so it can never rise above anything outside the pane. */}
          <div
            /* Bottom sheet below `sm`, a free-standing card from `sm` up. The
               sheet is full width on a phone because that is where the room
               is; from 640px the copy is capped at 33rem and a full-width
               pane put an empty fogged expanse to the right of it — on a
               sideways phone, half the screen. The card is left-aligned, as
               the copy is at `lg`. */
            className="glass-frost glass-rim isolate rounded-t-[1.75rem] px-6 pt-7 short:pt-4 tight:pt-5 sm:mx-6 sm:mb-6 sm:max-w-[36rem] sm:rounded-[1.75rem] short:mb-3 lg:mx-0 lg:mb-0 lg:max-w-[38rem] lg:px-10 lg:pt-10"
            style={{
              paddingBottom:
                "max(2.5rem, calc(env(safe-area-inset-bottom) + 2.5rem))",
            }}
          >
            <div className="relative max-w-[33rem] lg:max-w-none">
              <h1>
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
