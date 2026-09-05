import { ViewTransition } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import DiagonalMarqueeCarousel from "@/components/ui/diagonal-marquee-carousel";

/**
 * Every string here is a placeholder pending the organizers — the gathering's
 * official name, the date and the blurb all still need confirming (SPEC
 * A3/A5). They live in one object so there is exactly one place to edit.
 *
 * The two ACTIONS are the page's whole job: this is the common trunk and the
 * day has exactly two branches. Their sub-lines are deliberately asymmetric —
 * the hunt cites its ten stops because ten is real and tracked (D3 settles
 * *which* ten, not how many); the workshops cite no count, because the six on
 * /ateliere are invented placeholders (A3) and a number repeated in a second
 * place is a second thing to remember to fix.
 */
const CONTENT = {
  kicker: "Întâlnirea Tineretului Greco-Catolic",
  title: "Blaj 2026",
  meta: "19 septembrie 2026 · Blaj",
  lead:
    "O zi împreună pentru tinerii greco-catolici din Transilvania: ateliere, " +
    "prietenii noi și un oraș de descoperit.",
  actions: [
    {
      href: "/ateliere",
      label: "Descoperă atelierele",
      hint: "Alege-ți atelierul zilei",
      primary: true,
    },
    {
      href: "/blajhunt",
      label: ["Vezi traseul ", "Blajhunt"],
      hint: "Zece opriri, pe echipe",
      primary: false,
    },
  ],
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
 * At 90% the marquee still reads through it — over a pure black photo the
 * kicker measures 5.15:1, and it is 5.16:1 in practice.
 */
const COPY_SCRIM =
  "linear-gradient(to bottom, transparent 0%, " +
  "color-mix(in oklab, var(--background) 90%, transparent) 22%, " +
  "color-mix(in oklab, var(--background) 90%, transparent) 88%, transparent 100%)";

/**
 * One shape, two weights. The pair has to rank itself — two controls of equal
 * weight is the same as having no primary at all — and the fill is what does
 * it, not the size: both rows are the same height so the pair still reads as
 * one object rather than two unrelated buttons.
 *
 * Two lines, not one, because "Blajhunt" is a coined name that means nothing
 * to someone who has not been told what it is. The hint is what makes the
 * second row worth tapping, and it is what lets the row be 68px tall — a
 * comfortable target at the bottom of a phone, which a 48px pill is not.
 *
 * Sizes and colours go in plain className strings on purpose. `cn()` would
 * read `text-body` as a colour, not find `--text-body`, and silently drop one
 * of the two — see CLAUDE.md. Nothing here is conditional, so nothing here
 * needs merging.
 */
const ACTION_BASE =
  "group shadow-card focus-visible:ring-ring focus-visible:ring-offset-background " +
  "flex min-h-[4.25rem] w-full items-center gap-4 rounded-2xl py-3.5 pr-3.5 pl-5 " +
  "transition-transform hover:scale-[1.015] focus-visible:ring-2 " +
  "focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.985]";

/**
 * The hint's alpha is 85%, not 80%, and not because a tool asked for it.
 * Measured on the rendered pixels it is 5.74:1 on the sky fill where 80% was
 * 5.15:1 — thin headroom for a 13px line — and at 13px the floor is 4.5.
 *
 * `audit.js` reports this span as 4.10:1 and FAILING at 1440. It is wrong: it
 * composites the ink's alpha over the page's white and then compares the
 * result against the sky tile, which is not a pair that exists anywhere on
 * screen. Hand arithmetic and `ink.js` both give 5.15:1 for the 80% it was.
 * Recorded in SPEC 6.2 with the numbers — do not "fix" the colour to satisfy
 * that reading.
 */

/**
 * The arrow needs a chip. Left to itself it floated ~200px from the end of its
 * own label — at 1440 the row is 384px wide and the label stops at 277 — which
 * reads as a table row with a stray glyph in it, not as a control. A disc at
 * the end makes the right edge deliberate: text on one side, the affordance on
 * the other, and the dead space between them becomes the gap between two
 * things rather than an accident.
 *
 * Decorative, and inside a row that is itself the 68px target, so its own 36px
 * is not a tap target and does not have to clear the floor.
 */
const CHIP_BASE =
  "flex size-9 shrink-0 items-center justify-center rounded-full";

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
          className="relative z-20 flex min-h-[100svh] flex-col justify-end px-6 pt-24 pb-14 lg:justify-center lg:px-24 lg:pb-14"
          style={{
            paddingBottom:
              "max(3.5rem, calc(env(safe-area-inset-bottom) + 3.5rem))",
          }}
        >
          <div className="relative max-w-[33rem] lg:max-w-[38rem]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-10 -top-36 -bottom-20 -z-10 lg:hidden"
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
                className="text-display mt-3 block font-semibold"
                translate="no"
              >
                {CONTENT.title}
              </span>
            </h1>

            <p className="text-muted-foreground font-ui text-ui mt-4 tracking-[0.14em] uppercase">
              {CONTENT.meta}
            </p>

            <p className="text-body mt-5 max-w-prose">{CONTENT.lead}</p>

            {/* A list, because it is one: the two things the day is made of.
              Capped narrower than the prose above it so the rows stay a
              column of controls rather than stretching into two banners at
              tablet width. */}
            <ul className="mt-8 grid max-w-[24rem] gap-3">
              {CONTENT.actions.map((action) => (
                <li key={action.href}>
                  <Link
                    href={action.href}
                    transitionTypes={["nav-forward"]}
                    className={
                      action.primary
                        ? `${ACTION_BASE} bg-primary text-primary-foreground active:bg-brand-strong`
                        : `${ACTION_BASE} border-border-strong bg-background/92 text-foreground border backdrop-blur-sm`
                    }
                  >
                    <span className="min-w-0 flex-1">
                      <span className="font-ui block text-base font-semibold">
                        {Array.isArray(action.label) ? (
                          <>
                            {action.label[0]}
                            <span translate="no">{action.label[1]}</span>
                          </>
                        ) : (
                          action.label
                        )}
                      </span>
                      <span
                        className={
                          action.primary
                            ? "font-ui text-ui text-primary-foreground/85 mt-0.5 block"
                            : "font-ui text-ui text-muted-foreground mt-0.5 block"
                        }
                      >
                        {action.hint}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={
                        action.primary
                          ? `${CHIP_BASE} bg-primary-foreground/15`
                          : `${CHIP_BASE} bg-secondary`
                      }
                    >
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
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
