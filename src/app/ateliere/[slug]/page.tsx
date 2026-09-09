import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { ATELIERE, atelierBySlug, atelierNo, mapsUrl } from "@/lib/ateliere";
import { galleryFor } from "@/lib/ateliere-gallery";

/**
 * One page per workshop — the "fișă de atelier".
 *
 * The carousel on `/ateliere` has room for a title and two sentences. The
 * organizers wrote two to six paragraphs each, plus who runs it, when, where
 * and for how many; that is what this page is for. Everything on it comes from
 * `src/lib/ateliere.ts`; the extra photographs come off disk via
 * `src/lib/ateliere-gallery.ts`.
 *
 * ── Composition ─────────────────────────────────────────────────────────────
 * Photograph first, then the sheet. On a phone the card photograph runs
 * full-bleed under the top band and the title block rides up over its bottom
 * edge; the facts are a ruled list, the story a single measure, the extra
 * photographs a swipe strip at their own ratios, and the route continues to
 * the neighbouring workshops. Above `lg` the photograph takes the left column
 * and stays put while the sheet scrolls beside it. Nothing is centred and no
 * ink sits on the photograph, so contrast here is a CSS fact and audit.js can
 * see all of it.
 *
 * Accent economy (GUIDELINES 5): the workshop's own accent as a short rule,
 * the lapis kicker, the Maps link. The tags are neutral on purpose.
 *
 * Signup does not exist yet (SPEC section 9), so the primary control is the
 * same disabled, labelled button the carousel used to carry — honest about
 * being not-yet rather than a live button to nowhere.
 */

export function generateStaticParams() {
  return ATELIERE.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = atelierBySlug(slug);
  if (!a) return {};
  return {
    title: `${a.title} · Ateliere`,
    description: a.hook,
    openGraph: { images: [a.image] },
  };
}

const ACCENT_RULE = { lapis: "bg-brand", gold: "bg-contrast" } as const;

/** Under a stock photograph, while the organizers still owe the real one. */
const PLACEHOLDER_NOTE = "Fotografie provizorie — cea a atelierului urmează.";

/*
 * The gallery strip's gutter, `max(2rem,calc((100vw-72rem)/2+2rem))`, appears
 * twice below as a literal rather than as a constant: Tailwind finds classes by
 * scanning source text, and a class assembled from a template literal is never
 * generated. It is the page's own left gutter — the container is `max-w-6xl`
 * (72rem) with `sm:px-8`, so past 1216px the gutter is the centring margin
 * plus 2rem. The strip breaks out of the container to run full-bleed and uses
 * it to put its first photograph exactly under the section heading, and as its
 * scroll-padding, so the snap start and the padding agree and the strip does
 * not arrive already scrolled.
 */

export default async function Atelier({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = atelierBySlug(slug);
  if (!a) notFound();

  const at = ATELIERE.indexOf(a);
  const prev = ATELIERE[at - 1];
  const next = ATELIERE[at + 1];
  const gallery = galleryFor(a.slug);
  const no = atelierNo(a);

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
      <main className="pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {/* ── Top band: the same two controls as the stage's top bar ─────── */}
        <div className="bg-stage">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 sm:px-8">
            <Link
              href={`/ateliere#${a.slug}`}
              transitionTypes={["nav-back"]}
              className="text-foreground font-ui text-ui focus-visible:ring-ring focus-visible:ring-offset-stage -ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 font-semibold tracking-[0.08em] uppercase focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <span aria-hidden="true">&larr;</span> Ateliere
            </Link>
            <span
              translate="no"
              className="font-ui text-ui font-semibold tracking-[0.06em] uppercase"
            >
              Blaj&nbsp;2026
            </span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl lg:grid lg:grid-cols-[5fr_7fr] lg:gap-x-16 lg:px-8 lg:pt-10">
          {/* ── The photograph. Full-bleed on a phone, a sticky column above lg.
              `short:` (a phone held sideways, 390px tall) caps it at 38svh: at
              62svh the photo plus the band took 77% of the screen and the
              headline was cut mid-glyph below the fold. */}
          <figure className="m-0 lg:sticky lg:top-8 lg:self-start">
            <img
              src={a.image}
              alt=""
              width={720}
              height={960}
              fetchPriority="high"
              decoding="async"
              className="bg-stage short:max-h-[38svh] aspect-[4/5] max-h-[62svh] w-full object-cover object-[50%_30%] lg:aspect-[3/4] lg:max-h-none lg:rounded-2xl lg:border lg:border-border-strong/60 lg:shadow-card"
            />
            {/* Above lg the caption sits under the photograph in its own column.
                Below lg the sheet rides up over the photograph's bottom edge and
                would paint over a figcaption placed here — it did, and the one
                page that most needed to say "this is not our photo" said nothing
                — so there the same line renders inside the sheet instead. */}
            {a.imagePlaceholder ? (
              <figcaption className="text-muted-foreground font-ui text-ui hidden pt-2 lg:block">
                {PLACEHOLDER_NOTE}
              </figcaption>
            ) : null}
          </figure>

          {/* ── The sheet. Rides up over the photograph's bottom edge on a phone. */}
          <div className="bg-background short:pt-4 relative -mt-6 rounded-t-[1.25rem] px-5 pt-7 sm:px-8 lg:mt-0 lg:rounded-none lg:px-0 lg:pt-1">
            {a.imagePlaceholder ? (
              <p className="text-muted-foreground font-ui text-ui mb-4 lg:hidden">
                {PLACEHOLDER_NOTE}
              </p>
            ) : null}
            <span
              aria-hidden="true"
              className={`block h-1 w-12 rounded-full ${ACCENT_RULE[a.accent]}`}
            />
            <p className="text-brand-text font-ui text-ui mt-4 font-semibold tracking-[0.14em] uppercase">
              Atelier {no}
            </p>
            <h1 className="text-h2 mt-2">{a.title}</h1>
            {a.tagline ? (
              <p className="text-muted-foreground font-display mt-2 text-h3 leading-snug">
                {a.tagline}
              </p>
            ) : null}
            <p className="text-foreground/85 mt-5 max-w-prose text-h3 leading-normal">
              {a.hook}
            </p>

            {/* ── Facts. A ruled list, label column fixed so the values align. */}
            <dl className="divide-border mt-8 divide-y border-y">
              {/* "Coordonator atelier" wraps the 6.5rem label column onto two
                  lines; on the atelier's own page the second word says nothing. */}
              <Fact label={(a.leadLabel ?? "Coordonator").replace(/\s+atelier$/i, "")}>
                <ul className="space-y-1">
                  {a.leads.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </Fact>
              <Fact label="Când">
                <ul className="space-y-1">
                  {a.sessions.map((s) => (
                    <li key={s.time} className="flex flex-wrap gap-x-2">
                      <span className="tabular-nums">{s.time}</span>
                      {s.label ? (
                        <span className="text-muted-foreground">{s.label}</span>
                      ) : null}
                      {s.seats ? (
                        <span className="text-muted-foreground tabular-nums">
                          · {s.seats} locuri
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Fact>
              <Fact label="Durată">
                <span className="tabular-nums">{a.durationMin} min</span>
              </Fact>
              <Fact label="Locuri">
                <span className="tabular-nums">{a.seats}</span>
              </Fact>
              <Fact label="Unde">
                {a.location ? (
                  <>
                    <p>{a.location}</p>
                    {a.mapsQuery ? (
                      <a
                        href={mapsUrl(a.mapsQuery)}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-brand-text font-ui focus-visible:ring-ring focus-visible:ring-offset-background -mx-1 mt-1 inline-flex min-h-11 items-center gap-1 rounded-full px-1 font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:underline"
                      >
                        Deschide în Maps
                        <span aria-hidden="true">&#8599;</span>
                      </a>
                    ) : null}
                  </>
                ) : (
                  <p className="text-muted-foreground">Locația se anunță.</p>
                )}
              </Fact>
            </dl>

            {/* ── The action. Disabled and labelled until signup exists. ───── */}
            <div className="mt-6">
              <button
                type="button"
                disabled
                aria-describedby="inscriere-nota"
                className="border-border-strong text-foreground/80 font-ui inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-full border px-6 font-medium sm:w-auto"
              >
                Înscrieri în curând
              </button>
              <p
                id="inscriere-nota"
                className="text-muted-foreground font-ui text-ui mt-2"
              >
                Înscrierile se deschid înainte de întâlnire, aici, cu codul de
                participant.
              </p>
            </div>

            {/* ── The story. One measure, the organizers' words. ─────────── */}
            <div className="text-foreground/90 mt-10 max-w-prose space-y-5">
              {a.body.map((para) => (
                <p key={para.slice(0, 40)}>{para}</p>
              ))}
            </div>

            {a.tags.length ? (
              <ul aria-label="Etichete" className="mt-8 flex flex-wrap gap-2">
                {a.tags.map((t) => (
                  <li
                    key={t}
                    className="bg-secondary text-secondary-foreground font-ui text-ui rounded-full px-3 py-1 font-medium"
                  >
                    #{t}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {/* ── The rest of the photographs. A swipe strip at native ratios. ──
            Pure CSS scroll-snap: no script, swipe on a phone, arrow keys when
            the region has focus, the scrollbar with a mouse. Each image ships
            with its size from the WebP header, so nothing shifts as it loads.
            Rendered only when the pipeline has produced files for this slug. */}
        {gallery.length ? (
          <section
            aria-labelledby="fotografii"
            className="mt-14 border-t border-border pt-8"
          >
            <div className="mx-auto flex w-full max-w-6xl items-baseline justify-between px-5 sm:px-8">
              <h2
                id="fotografii"
                className="text-muted-foreground font-ui text-ui font-semibold tracking-[0.14em] uppercase"
              >
                Fotografii
              </h2>
              <span className="text-muted-foreground font-ui text-ui tabular-nums">
                {gallery.length}
              </span>
            </div>
            <div
              role="region"
              aria-label="Fotografii din atelier, derulează orizontal"
              tabIndex={0}
              className="focus-visible:ring-ring mt-4 overflow-x-auto overscroll-x-contain scroll-px-5 snap-x snap-proximity pb-3 [scrollbar-width:thin] focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none sm:scroll-px-[max(2rem,calc((100vw-72rem)/2+2rem))]"
            >
              {/* No `mx-auto`: a w-max list narrower than the viewport would
                  centre itself, 282px right of its own heading at 1440. */}
              <ul className="flex w-max max-w-none gap-3 px-5 sm:gap-4 sm:px-[max(2rem,calc((100vw-72rem)/2+2rem))]">
                {gallery.map((g) => (
                  <li key={g.src} className="shrink-0 snap-start">
                    <img
                      src={g.src}
                      alt=""
                      width={g.width}
                      height={g.height}
                      loading="lazy"
                      decoding="async"
                      className="bg-stage border-border-strong/60 shadow-card h-60 w-auto max-w-none rounded-xl border sm:h-72 lg:h-80"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {/* ── No dead ends: the list continues in both directions. ───────── */}
        <nav
          aria-label="Ateliere vecine"
          className="border-border mt-12 border-t pt-8"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 sm:flex-row sm:items-stretch sm:justify-between sm:px-8">
            {prev ? (
              <Link
                href={`/ateliere/${prev.slug}`}
                transitionTypes={["nav-back"]}
                className="border-border hover:border-border-strong active:bg-secondary focus-visible:ring-ring focus-visible:ring-offset-background flex min-h-12 flex-1 flex-col justify-center rounded-[var(--radius)] border px-5 py-3 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <span className="text-muted-foreground font-ui text-ui font-semibold tracking-[0.08em] uppercase">
                  &larr; Atelier {atelierNo(prev)}
                </span>
                <span className="text-foreground mt-0.5 font-semibold">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <span className="hidden flex-1 sm:block" />
            )}
            {next ? (
              <Link
                href={`/ateliere/${next.slug}`}
                transitionTypes={["nav-forward"]}
                className="border-border hover:border-border-strong active:bg-secondary focus-visible:ring-ring focus-visible:ring-offset-background flex min-h-12 flex-1 flex-col justify-center rounded-[var(--radius)] border px-5 py-3 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:text-right"
              >
                <span className="text-muted-foreground font-ui text-ui font-semibold tracking-[0.08em] uppercase">
                  Atelier {atelierNo(next)} &rarr;
                </span>
                <span className="text-foreground mt-0.5 font-semibold">
                  {next.title}
                </span>
              </Link>
            ) : (
              <span className="hidden flex-1 sm:block" />
            )}
          </div>
          {/* The list itself, from the bottom of a 2.5–3.3k px page. Without it
              the only way back was the band at y=8, and a reader comparing
              three workshops was scrolling to the top of each. */}
          <div className="mx-auto mt-4 w-full max-w-6xl px-5 sm:px-8">
            <Link
              href={`/ateliere#${a.slug}`}
              transitionTypes={["nav-back"]}
              className="text-foreground font-ui text-ui focus-visible:ring-ring focus-visible:ring-offset-background -ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 font-semibold tracking-[0.08em] uppercase focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <span aria-hidden="true">&larr;</span> Toate atelierele
            </Link>
          </div>
        </nav>
      </main>
    </ViewTransition>
  );
}

/**
 * One row of the facts list. Below `sm` the label sits ABOVE its value; from
 * `sm` up they are two columns with a 9rem label column.
 *
 * It was two columns everywhere, with a 6.5rem label. "COORDONATORI" is 138px
 * of letterspaced caps and ran straight into the name beside it while the
 * other four rows kept a 60–79px gutter; at 320 the values were down to 19ch
 * and the four-coordinator row was 425px tall; at 200% zoom words were cut at
 * the viewport edge and the document scrolled sideways. Stacking below `sm`
 * gives the value the full measure at every width the phone can be, and 9rem
 * clears the widest label once there is room for two columns.
 */
function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-3.5 sm:grid sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-x-4">
      <dt className="text-muted-foreground font-ui text-ui mb-1 font-semibold tracking-[0.08em] uppercase sm:mb-0 sm:pt-1">
        {label}
      </dt>
      <dd className="text-foreground m-0 min-w-0">{children}</dd>
    </div>
  );
}
