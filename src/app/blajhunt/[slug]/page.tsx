import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { StopGlyph, STOP_GLYPHS } from "@/components/ui/stop-glyphs";
import {
  BLAJHUNT_PLACES,
  mapsUrl,
  placeBySlug,
} from "@/lib/blajhunt-places";
import { BLAJHUNT_STOPS } from "@/lib/blajhunt-stops";

/**
 * One page per stop: what the place IS, and how to get to it.
 *
 * It exists so the roadmap can stay a roadmap. A card on `/blajhunt` has room
 * for a line that tells you what kind of thing you are looking for; it has no
 * room for two hundred years of why the building is there, and cramming that
 * in would have cost the roadmap the thing it is good at.
 *
 * **It carries no part of the probă.** Not the task, not the hint, not where to
 * look — see the header of `src/lib/blajhunt-places.ts`, which is the file this
 * rule actually lives in. The proof chips and the points are repeated here only
 * because they are already public on the roadmap.
 */

/** Route data and editorial content are two files; this joins them by title. */
function stopFor(title: string) {
  const index = BLAJHUNT_STOPS.findIndex((s) => s.title === title);
  return index < 0
    ? null
    : { stop: BLAJHUNT_STOPS[index], number: index + 1, index };
}

export function generateStaticParams() {
  return BLAJHUNT_PLACES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const place = placeBySlug(slug);
  if (!place) return {};
  return {
    title: `${place.title} · Blajhunt`,
    description: place.standfirst,
  };
}

export default async function Place({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const place = placeBySlug(slug);
  if (!place) notFound();

  const found = stopFor(place.title);
  // A place whose title no longer matches any stop is a content bug, not a 404:
  // the two files have drifted apart. Fail loudly in the build rather than
  // shipping a page with no number on it.
  if (!found) {
    throw new Error(
      `blajhunt-places: "${place.title}" matches no stop in BLAJHUNT_STOPS. ` +
        `The two files have drifted — titles must match exactly.`,
    );
  }
  const { stop, number, index } = found;
  const glyph = STOP_GLYPHS[index];

  const prev = BLAJHUNT_PLACES[BLAJHUNT_PLACES.indexOf(place) - 1];
  const next = BLAJHUNT_PLACES[BLAJHUNT_PLACES.indexOf(place) + 1];

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
        {/* ── Header ──────────────────────────────────────────────────────
            The same four --field-* tokens as the hero, as a still gradient.
            No shader here: this is one of ten pages and the field is not what
            they are for. `field-seam` lands it on --field-0 so the join to the
            body below is the same continuous ramp the roadmap uses. */}
        <section className="field-fallback relative isolate overflow-hidden">
          <div
            aria-hidden="true"
            className="field-seam pointer-events-none absolute inset-x-0 bottom-0 h-20"
          />
          <div className="relative mx-auto w-full max-w-3xl px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-12 sm:px-8">
            <Link
              href="/blajhunt"
              transitionTypes={["nav-back"]}
              className="text-foreground font-ui text-ui focus-visible:ring-ring focus-visible:ring-offset-background -ml-2 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full px-2 font-semibold tracking-[0.08em] uppercase focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <span aria-hidden="true">&larr;</span> Traseul
            </Link>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-start">
              <span
                aria-hidden="true"
                className="bg-contrast/25 text-contrast-text flex size-16 shrink-0 items-center justify-center rounded-2xl"
              >
                <StopGlyph
                  name={glyph ?? "cathedral"}
                  className="size-11 [stroke-width:1.6]"
                />
              </span>
              <div className="min-w-0">
                <p className="text-brand-text font-ui text-ui font-semibold tracking-[0.14em] uppercase">
                  Oprirea {String(number).padStart(2, "0")}
                </p>
                <h1 className="text-h2 mt-1.5">{place.title}</h1>
              </div>
            </div>

            <p className="text-foreground/80 text-h3 mt-5 max-w-prose">
              {place.standfirst}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={mapsUrl(place)}
                target="_blank"
                rel="noreferrer noopener"
                className="bg-primary text-primary-foreground font-ui shadow-card active:bg-brand-strong focus-visible:ring-ring focus-visible:ring-offset-background inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-semibold transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.97]"
              >
                Deschide în Maps
                <span aria-hidden="true">&#8599;</span>
              </a>
              <span className="bg-contrast text-foreground font-ui text-ui inline-flex min-h-12 shrink-0 items-center rounded-full px-4 font-semibold tabular-nums">
                {stop.points}&nbsp;p
              </span>
            </div>
          </div>
        </section>

        {/* ── The place ───────────────────────────────────────────────────
            Context only. Nothing here is part of the probă. */}
        <article className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
          <div className="max-w-prose space-y-5">
            {place.body.map((para) => (
              <p key={para.slice(0, 32)} className="text-foreground/90">
                {para}
              </p>
            ))}
          </div>

          {stop.proofs?.length ? (
            <div className="border-border mt-10 border-t pt-6">
              <h2 className="text-muted-foreground font-ui text-ui font-semibold tracking-[0.14em] uppercase">
                Ce predați aici
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {stop.proofs.map((proof) => (
                  <li
                    key={proof}
                    className="border-brand/45 bg-brand/5 text-brand-text font-ui text-ui rounded-full border px-3 py-1 font-medium tracking-[0.08em] uppercase"
                  >
                    {proof}
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground mt-4 max-w-prose">
                Proba se anunță pe teren. Pagina asta nu o conține.
              </p>
            </div>
          ) : null}
        </article>

        {/* ── No dead ends: the route continues in both directions. ────── */}
        <nav
          aria-label="Opriri vecine"
          className="border-border border-t py-10"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-5 sm:flex-row sm:items-stretch sm:justify-between sm:px-8">
            {prev ? (
              <Link
                href={`/blajhunt/${prev.slug}`}
                transitionTypes={["nav-back"]}
                className="border-border hover:border-border-strong focus-visible:ring-ring focus-visible:ring-offset-background flex min-h-12 flex-1 flex-col justify-center rounded-[var(--radius)] border px-5 py-3 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <span className="text-muted-foreground font-ui text-ui font-semibold tracking-[0.08em] uppercase">
                  &larr; Înainte
                </span>
                <span className="text-foreground mt-0.5 font-semibold">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <span className="flex-1" />
            )}
            {next ? (
              <Link
                href={`/blajhunt/${next.slug}`}
                transitionTypes={["nav-forward"]}
                className="border-border hover:border-border-strong focus-visible:ring-ring focus-visible:ring-offset-background flex min-h-12 flex-1 flex-col justify-center rounded-[var(--radius)] border px-5 py-3 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:text-right"
              >
                <span className="text-muted-foreground font-ui text-ui font-semibold tracking-[0.08em] uppercase">
                  După &rarr;
                </span>
                <span className="text-foreground mt-0.5 font-semibold">
                  {next.title}
                </span>
              </Link>
            ) : (
              <span className="flex-1" />
            )}
          </div>
        </nav>
      </main>
    </ViewTransition>
  );
}
