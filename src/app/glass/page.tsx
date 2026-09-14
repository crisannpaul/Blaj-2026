import type { Metadata } from "next";
import Link from "next/link";
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
 *   it stays a photograph. Below `sm` it is a sheet the full width of the
 *   screen — no horizontal room lost on a 390px phone — hanging from the top,
 *   rounded at the bottom only. From `sm` it is a free-standing card,
 *   left-aligned as the copy is at `lg`, and no wider than the branch pair:
 *   the cold review found a 136px frosted void beside the cards at 768 when
 *   the card followed the copy's 33rem instead.
 *
 * - **Below `lg` the page SCROLLS, and the marquee is what it scrolls to.**
 *   `/` is a bottom sheet in a screen that does not scroll, and on a phone the
 *   copy with its two branches covers most of it; the marquee showed in a
 *   strip along the top — "awkwardly seen", in the user's words, and the copy
 *   is still to grow (SPEC A3/A5). Here the sheet hangs from the TOP of the
 *   first screen with the marquee peeking under it, which is the cue that
 *   there is more, and the band is a sticky, viewport-tall backdrop the sheet
 *   slides up and over as the visitor scrolls, until one more screen of scroll
 *   leaves the photographs alone. That passing of a pane over pictures is the
 *   one moment glass has a job on a phone. Copy that grows makes the sheet
 *   taller and the page longer; nothing is pushed off the top any more and
 *   nothing is clipped. From `lg` the fold is what it was: sheet left,
 *   photographs right, no scroll.
 *
 *   The mechanics: the sticky box is first in the flow and `100lvh` tall; the
 *   sheet's column follows with a `-100lvh` top margin so it starts over the
 *   box; the screen after it is the extra scroll. `lvh`, not `svh`: a phone's
 *   toolbar collapses on scroll and the viewport grows, and a backdrop sized
 *   to the small viewport would show a strip of page background under the
 *   marquee at that moment. `main` clips sideways with `overflow-x: clip` and
 *   never `hidden` — a hidden overflow on an ancestor makes it the sticky
 *   element's scroll container and the backdrop would scroll away with the
 *   page. The marquee's own bottom fade is off: a fade to page-white at the
 *   foot of the first screen says the page ends there. Its eager preload is
 *   off too, so the two card artworks are fetched before eleven decorative
 *   tiles that now precede them in the DOM.
 *
 * - **The end of the scroll is not a dead end.** The cold review's point: a
 *   full screen of marquee with no word and no link on it, 59% of the page,
 *   and the two branches — the page's whole job — behind you. So the extra
 *   screen carries, at its foot, a lip of glass with the archive's caption
 *   and the two branches again as plain links. It arrives only at the end of
 *   the scroll; at load it is a screen below the fold.
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
 * 320x568) additionally takes 28px out of the sheet's vertical rhythm here,
 * because on those phones the marquee under the sheet was down to a 44px
 * sliver and the cue that there is more below went with it. The sheet's top
 * padding clears the status bar where the page runs under one:
 * `safe-area-inset-top` is 0 in Safari's own portrait view and ~50px in a
 * standalone one, and the `max()` serves both.
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
      <main className="relative isolate overflow-x-clip">
        <GlassFilter />

        {/* The backdrop: sticky and a screen tall below lg, absolute behind a
          fold that does not scroll from lg. First in the flow so it paints
          under everything; the copy's column is `relative z-20` above it. */}
        <div
          aria-hidden="true"
          className="sticky top-0 z-0 h-lvh lg:absolute lg:inset-0 lg:h-auto"
        >
          <DiagonalMarqueeCarousel
            washClassName="bg-background/10"
            columnWash="soft"
            bottomFade={false}
            priority={false}
          />
        </div>

        <div className="relative z-20 -mt-[100lvh] flex flex-col lg:mt-0 lg:min-h-svh lg:justify-center lg:px-24">
          {/* The pane. Three decorative layers first — frost, fill, bevel —
            then the copy, which is `relative` so it paints above them (an
            in-flow block would paint UNDER positioned siblings). The pane
            clips, so the oversized frost layer never shows past the corners.
            No `isolate`, no `filter`, no `opacity` on this element: any of
            those would make it a backdrop root and the frost would blur its
            own empty parent instead of the marquee. */}
          <div className="glass-pane glass-shadow relative rounded-b-[1.75rem] px-6 pt-[max(1.75rem,calc(env(safe-area-inset-top)_+_1rem))] pb-10 short:pt-4 tight:pt-5 tight:pb-8 sm:mx-6 sm:mt-6 sm:max-w-[29rem] sm:rounded-[1.75rem] lg:mx-0 lg:mt-0 lg:max-w-[38rem] lg:px-10 lg:pt-10 lg:pb-10">
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

              <BranchPanels
                panels={BRANCHES}
                finish="glass"
                className="mt-6 short:mt-5 tight:mt-5 max-w-[26rem] lg:max-w-[32rem]"
              />
            </div>
          </div>
        </div>

        {/* The extra screen of scroll, with the way onward at its foot. The
          lip is the sheet's recipe at lip scale; its ink is near-black for
          the same reason the sheet's is. Below lg only — the desktop fold
          never scrolls the cards away. */}
        <div className="relative z-20 flex h-lvh items-end px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:hidden">
          <nav
            aria-label="Cele două ramuri"
            className="glass-pane glass-shadow relative w-full rounded-2xl px-5 py-4"
          >
            <span aria-hidden="true" className="glass-frost glass-liquid" />
            <span aria-hidden="true" className="glass-fill [--glass-tint:28%]" />
            <span aria-hidden="true" className="glass-bevel" />
            <p className="text-foreground font-ui text-ui relative tracking-[0.14em] uppercase">
              {CONTENT.archive}
            </p>
            <p className="relative mt-1 flex flex-wrap gap-x-6">
              {BRANCHES.map((branch) => (
                <Link
                  key={branch.href}
                  href={branch.href}
                  transitionTypes={["nav-forward"]}
                  className="text-foreground font-display text-h3 decoration-contrast focus-visible:ring-ring focus-visible:ring-offset-background inline-flex min-h-11 items-center font-semibold underline decoration-2 underline-offset-4 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {branch.label}
                </Link>
              ))}
            </p>
          </nav>
        </div>
      </main>
    </ViewTransition>
  );
}
