import { ViewTransition } from "react";
import DiagonalMarqueeCarousel from "@/components/ui/diagonal-marquee-carousel";
import { BranchPanels } from "@/components/ui/branch-panels";
/* The copy and the two branches live in `src/lib/landing.ts`, shared with the
   `/glass` experiment so the two never drift in content while one of them is
   being judged on finish. The notes on the lead's length constraint and on
   the artwork's export geometry moved with them. */
import { BRANCHES, CONTENT } from "@/lib/landing";

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

        {/* Last in the DOM so a keyboard lands on the call to action before the
          decorative pause control. Paint order is z-index, not source order. */}
        <div className="absolute inset-0">
          <DiagonalMarqueeCarousel />
        </div>
      </main>
    </ViewTransition>
  );
}
