import Link from "next/link";
import { ViewTransition } from "react";
import { ShaderBackground } from "@/components/ui/adisyon-shader";
import {
  BLAJHUNT_END,
  BLAJHUNT_INTRO,
  BLAJHUNT_START,
  BLAJHUNT_STATS,
  BLAJHUNT_STOPS,
} from "@/lib/blajhunt-stops";
import TrailSwipe from "./trail-swipe";
import styles from "./trail-swipe.module.css";

export const metadata = {
  title: "Blajhunt",
  description:
    "Traseul Blajhunt: zece opriri prin Blaj, de la Seminarul Teologic la Câmpia Libertății.",
};

/**
 * The Blajhunt roadmap — **D14 decided 5 Sep: the horizontal treatment won**
 * and this is now the route itself, not a variant. It was built at
 * /blajhunt-swipe; the vertical original it replaced is parked, unlinked, at
 * /blajhunt-legacy for reference and is due for deletion.
 *
 * Why sideways. The vertical roadmap rendered all twelve nodes down one page,
 * so several were on screen at once and each got a card about 150px tall —
 * enough for a one-line teaser and nothing else, which is why the history had
 * to move to /blajhunt/[slug] in the first place. Turned sideways, exactly one
 * stop is on screen, the card can be as tall as the screen, and the stop's own
 * page folds back into it.
 *
 * /blajhunt/[slug] stays regardless: it is shared content, not scaffolding.
 * The cards deep-link to it and it is the deep, printable version of a stop.
 *
 * Content comes from the shared read-only modules in src/lib; nothing here
 * forks it. Read the header of `blajhunt-stops.ts` before changing any of it —
 * in particular what may not be lifted from the answer key.
 */
export default function Blajhunt() {
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
      <main>
        {/* ── The fold ────────────────────────────────────────────────────
            Unchanged from /blajhunt. The sky field is a canvas over the same
            gradient it draws, so a phone without WebGL, a failed shader link
            and the frame before first paint all show the same picture rather
            than a hole. */}
        <section className="relative isolate flex min-h-[68svh] flex-col overflow-hidden">
          <div
            aria-hidden="true"
            className="field-fallback absolute inset-0 -z-10"
          >
            <ShaderBackground className="h-full w-full" />
          </div>
          {/* Hands the shader over to the carousel's field on the SAME colour:
              this lands on --field-0 and the module's `.field` starts there,
              so the two are one continuous ramp rather than two backgrounds
              meeting. Transparent at its own top edge — a gradient still
              opaque at the edge of its box draws a hard line across the page,
              which has shipped twice here. */}
          <div
            aria-hidden="true"
            className="field-seam pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-28"
          />

          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-9 sm:px-8">
            <Link
              href="/"
              transitionTypes={["nav-back"]}
              className="text-foreground font-ui text-ui focus-visible:ring-ring focus-visible:ring-offset-background -ml-2 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full px-2 font-semibold tracking-[0.08em] uppercase focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <span aria-hidden="true">&larr;</span> Acasă
            </Link>

            <div className="flex flex-1 flex-col justify-end pt-14">
              <p className="text-brand-text font-ui text-ui font-semibold tracking-[0.14em] uppercase">
                {BLAJHUNT_INTRO.kicker}
              </p>
              <h1 className="text-display mt-3">{BLAJHUNT_INTRO.title}</h1>
              <p className="mt-5 max-w-prose">{BLAJHUNT_INTRO.lead}</p>
              <a
                href="#traseu"
                className="bg-primary text-primary-foreground font-ui shadow-card active:bg-brand-strong focus-visible:ring-ring focus-visible:ring-offset-background mt-8 inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-full px-7 text-base font-semibold transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.97]"
              >
                {BLAJHUNT_INTRO.cta}
              </a>
            </div>

            <dl className="border-foreground/15 mt-10 grid grid-cols-3 gap-4 border-t pt-5">
              {BLAJHUNT_STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="text-foreground font-display text-h3 block font-semibold tabular-nums">
                      {stat.value}
                    </span>
                    <span className="text-foreground/70 font-ui text-ui mt-0.5 block">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── The trail, sideways ─────────────────────────────────────────
            The section header stays inside the 5xl container; the track alone
            is full-bleed, because the peek of the next card has to run off the
            edge of the screen to read as "there is more" rather than as a
            cropped card sitting in a box. */}
        <section
          id="traseu"
          className={`${styles.field} scroll-mt-4 overflow-hidden pt-14 pb-20`}
        >
          <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
            <p className="text-muted-foreground font-ui text-ui font-semibold tracking-[0.14em] uppercase">
              {BLAJHUNT_INTRO.sectionKicker}
            </p>
            <h2 className="text-h2 mt-3">{BLAJHUNT_INTRO.sectionTitle}</h2>
            <p className="text-muted-foreground mt-4 max-w-prose">
              {BLAJHUNT_INTRO.sectionLead}
            </p>
          </div>

          <TrailSwipe
            className="mt-10"
            steps={[...BLAJHUNT_STOPS]}
            start={BLAJHUNT_START}
            end={BLAJHUNT_END}
          />
        </section>

        {/* No dead ends: the trail ends on a page, not on a wall. */}
        <section className="border-border border-t py-12">
          <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
            <h2 className="text-h3">Urmează</h2>
            <p className="text-muted-foreground mt-2 max-w-prose">
              Regulamentul complet, probele și înscrierea echipelor se deschid
              înainte de întâlnire. Până atunci, aruncă un ochi pe ateliere.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/ateliere"
                transitionTypes={["nav-forward"]}
                className="border-border-strong text-foreground font-ui focus-visible:ring-ring focus-visible:ring-offset-background inline-flex min-h-12 items-center rounded-full border px-6 text-base font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Atelierele întâlnirii
              </Link>
              <Link
                href="/"
                transitionTypes={["nav-back"]}
                className="text-foreground font-ui decoration-border-strong focus-visible:ring-ring focus-visible:ring-offset-background inline-flex min-h-12 items-center rounded-full px-4 text-base font-semibold underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Acasă
              </Link>
            </div>
          </div>
        </section>
      </main>
    </ViewTransition>
  );
}
