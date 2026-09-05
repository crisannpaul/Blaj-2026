import { cn } from "@/lib/utils";
import Link from "next/link";
import { StopGlyph, STOP_GLYPHS } from "@/components/ui/stop-glyphs";
import { placeByTitle } from "@/lib/blajhunt-places";

/**
 * Trail — the /blajhunt roadmap with an ILLUSTRATION PER STOP.
 *
 * A copy of `src/components/ui/how-it-works.tsx` (shared, not editable) with
 * one creative layer added. Everything else — the arch table, the slice
 * geometry, the discs, the cards, the terminals — is unchanged, so comparing
 * this page against /blajhunt compares the glyphs and nothing else. The
 * original file's header explains the geometry and is still the reference for
 * it; only the deltas are documented here.
 *
 * ── The creative layer, and the two places it lives ─────────────────────────
 *
 * WIDE (lg+) is the easy half and is what the mockup shows: each row is two
 * columns with the card in one of them, so the glyph goes in the OTHER one,
 * hugging the gutter, on the far side of the dotted curve from its card. It
 * costs nothing — that column was empty.
 *
 * PHONE is the whole reason this variant exists, because at 390px there is no
 * empty column: the card is the full width of the page and the curve lives in
 * the 100–170px gaps between cards. Three places a glyph could go there:
 *
 *   a) inside the card, beside the title — steals width from the one thing
 *      the card is for. The measure is already 35 characters a line; a 44px
 *      glyph plus its gutter takes ~56px of 310, which drops the title to
 *      about 24. Rejected.
 *   b) in the empty lobe of the gap, beside the curve — free, but there is no
 *      stable lobe. The curve sweeps from 13% to 87% across the gap, and
 *      WHERE it does that depends on which of the five arches the row drew.
 *      Measured against the two extreme arches, the same glyph box is clear
 *      by 36px under one and overlapping by 19px under the other.
 *   c) ON the curve, at the gap's midpoint. Every slice of the curve passes
 *      through exactly (50%, 50%) of its gap — that is forced by the cubic,
 *      whose two x control points are the two endpoints, so x(t=0.5) is their
 *      mean whatever the arch does to the y controls. A disc centred there is
 *      therefore ALWAYS on the line, under every arch, at every width.
 *
 * (c) is what shipped. The disc is painted `--stage`, so it masks the dots it
 * covers exactly the way the numbered disc's `ring-stage` does, and the route
 * reads as opening into a waypoint rather than as being interrupted. It takes
 * zero width from the card: the text measure is identical to /blajhunt's, and
 * the only cost is height — see GAP below.
 *
 * The glyph belongs to the stop BELOW it. The gap above card i is card i's
 * approach, so you meet the drawing of a place just before you are told its
 * name, which is the right order for a treasure hunt. Terminals keep their
 * pins and get no glyph: the ten stops are the subject.
 */

export interface Step {
  title: string;
  description: string;
  points?: number;
  proofs?: string[];
  tone?: "sky" | "sun";
}

export interface TrailTerminal {
  label: string;
  title: string;
  description?: string;
}

export interface TrailProps {
  steps: Step[];
  start?: TrailTerminal;
  end?: TrailTerminal;
  className?: string;
}

/** Unchanged from how-it-works.tsx. See its header. */
const X = {
  phoneNear: 13,
  phoneFar: 87,
  wideNear: 43.5,
  wideFar: 56.5,
} as const;

/** Unchanged from how-it-works.tsx. See its header. */
const ARCHES = [
  { cross: 50.0, reach: 0.0, lift: [14, 26], drop: [74, 86], gap: 1.0, bend: [0.35, 0.65] }, // prettier-ignore
  { cross: 48.6, reach: 0.7, lift: [9, 31], drop: [70, 90], gap: 0.88, bend: [0.45, 0.72] }, // prettier-ignore
  { cross: 51.4, reach: -0.5, lift: [19, 33], drop: [67, 81], gap: 1.14, bend: [0.25, 0.55] }, // prettier-ignore
  { cross: 49.2, reach: 0.4, lift: [11, 22], drop: [78, 92], gap: 0.96, bend: [0.42, 0.6] }, // prettier-ignore
  { cross: 51.8, reach: -0.8, lift: [16, 30], drop: [72, 83], gap: 1.06, bend: [0.3, 0.78] }, // prettier-ignore
] as const;

const archAt = (i: number) =>
  ARCHES[((i % ARCHES.length) + ARCHES.length) % ARCHES.length];

const phoneNodeAt = (i: number) =>
  i % 2 === 0
    ? X.phoneNear - archAt(i).reach * 3
    : X.phoneFar + archAt(i).reach * 3;

const wideNodeAt = (i: number) =>
  i % 2 === 0 ? X.wideNear - archAt(i).reach : X.wideFar + archAt(i).reach;

/**
 * Base height of the phone connector, in px before the arch table scales it.
 *
 * This was briefly 148, to leave room for a glyph sitting ON the curve in the
 * middle of the gap. That placement was wrong for a reason no measurement
 * caught: a drawing centred between two cards is equidistant from both, so it
 * reads as a stop of its own — an intermediary on the way to the next
 * objective rather than a picture OF one. On a route where every other mark is
 * a numbered destination, that is a real misreading, and it was the first
 * thing noticed on a phone.
 *
 * The glyph now lives inside its card (see the card header below), so the gap
 * is back to carrying nothing but the route, and 112 is the value SPEC 6.1d
 * measured: enough for the connector to read as an S without the cards
 * drifting apart. Reverting it also gave back the 391px the mid-gap placement
 * had cost at 390px.
 */
const GAP = 112;

/** Unchanged: a zero-length dash under a round cap is a round dot. */
const STROKE = {
  stroke: "currentColor",
  strokeWidth: 3,
  strokeDasharray: "0.01 7",
  strokeLinecap: "round",
  fill: "none",
  vectorEffect: "non-scaling-stroke",
} as const;

/** tabler-icons "pin". Marks the two ends of the trail; stops use numbers. */
const Pin = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M16 3a1 1 0 0 1 .117 1.993l-.117 .007v4.764l1.894 3.789a1 1 0 0 1 .1 .331l.006 .116v2a1 1 0 0 1 -.883 .993l-.117 .007h-4v4a1 1 0 0 1 -1.993 .117l-.007 -.117v-4h-4a1 1 0 0 1 -.993 -.883l-.007 -.117v-2a1 1 0 0 1 .06 -.34l.046 -.107l1.894 -3.791v-4.762a1 1 0 0 1 -.117 -1.993l.117 -.007h8z" />
  </svg>
);

type TrailNode =
  | { kind: "terminal"; terminal: TrailTerminal; tone: "ink" | "sun" }
  | { kind: "step"; step: Step; number: number };

export default function Trail({ steps, start, end, className }: TrailProps) {
  const nodes: TrailNode[] = [
    ...(start
      ? [{ kind: "terminal" as const, terminal: start, tone: "ink" as const }]
      : []),
    ...steps.map((step, i) => ({ kind: "step" as const, step, number: i + 1 })),
    ...(end
      ? [{ kind: "terminal" as const, terminal: end, tone: "sun" as const }]
      : []),
  ];

  return (
    <ol className={cn("relative", className)}>
      {nodes.map((node, i) => {
        const near = i % 2 === 0;
        const arch = archAt(i);
        const phoneX = phoneNodeAt(i);
        const phonePrevX = phoneNodeAt(i - 1);
        const wideX = wideNodeAt(i);
        const gapH = Math.round(GAP * arch.gap);
        const sun = node.kind === "step" && node.step.tone === "sun";
        // Undefined for the two terminals, and for a stop the glyph set has
        // not been extended to cover — the row then draws exactly as it does
        // on /blajhunt rather than throwing.
        const glyph =
          node.kind === "step" ? STOP_GLYPHS[node.number - 1] : undefined;
        // Undefined until a stop has an entry in blajhunt-places.ts; the card
        // then renders its title as plain text rather than a dead link.
        const place =
          node.kind === "step" ? placeByTitle(node.step.title) : undefined;

        const from = arch.cross;
        const to = archAt(i + 1).cross;
        const enter = `M ${from} 0 C ${from} ${arch.lift[0]}, ${wideX} ${arch.lift[1]}, ${wideX} 50`;
        const leave = `C ${wideX} ${arch.drop[0]}, ${to} ${arch.drop[1]}, ${to} 100`;
        const wideD =
          (i > 0 ? enter : `M ${wideX} 50`) +
          (i < nodes.length - 1 ? ` ${leave}` : "");

        return (
          <li key={i} className="relative lg:py-10">
            {/* Phone: the curve only exists between cards, and the glyph
                rides it at the one point every arch has in common. */}
            {i > 0 ? (
              <div className="relative lg:hidden">
                <svg
                  aria-hidden="true"
                  viewBox={`0 0 100 ${gapH}`}
                  preserveAspectRatio="none"
                  height={gapH}
                  className="text-brand-text/45 block w-full"
                >
                  <path
                    {...STROKE}
                    d={`M ${phonePrevX} 0 C ${phonePrevX} ${(gapH * arch.bend[0]).toFixed(1)}, ${phoneX} ${(gapH * arch.bend[1]).toFixed(1)}, ${phoneX} ${gapH}`}
                  />
                </svg>
              </div>
            ) : null}

            {/* Wide: one unbroken line, each row drawing its own slice. */}
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="text-brand-text/45 pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
            >
              <path {...STROKE} d={wideD} />
            </svg>

            <div className="relative lg:grid lg:grid-cols-2 lg:gap-x-48">
              <div
                style={
                  {
                    "--x": `${phoneX}%`,
                    "--lg-x": `${wideX}%`,
                  } as React.CSSProperties
                }
                className="ring-stage bg-card border-border-strong absolute -top-4 left-[var(--x)] z-10 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border ring-4 lg:top-1/2 lg:left-[var(--lg-x)] lg:-translate-y-1/2"
              >
                {node.kind === "terminal" ? (
                  <Pin
                    className={cn(
                      "size-4",
                      node.tone === "sun"
                        ? "text-contrast-text"
                        : "text-foreground",
                    )}
                  />
                ) : (
                  <span
                    className={`font-ui text-ui leading-none font-semibold tabular-nums ${
                      sun ? "text-contrast-text" : "text-brand-text"
                    }`}
                  >
                    {String(node.number).padStart(2, "0")}
                  </span>
                )}
              </div>

              <div
                className={cn(
                  "lg:row-start-1 lg:max-w-sm",
                  near
                    ? "lg:col-start-1 lg:justify-self-end"
                    : "lg:col-start-2",
                )}
              >
                {node.kind === "terminal" ? (
                  <div className="pt-6 lg:pt-0">
                    <p
                      className={`font-ui text-ui font-semibold tracking-[0.14em] uppercase ${
                        node.tone === "sun"
                          ? "text-contrast-text"
                          : "text-muted-foreground"
                      }`}
                    >
                      {node.terminal.label}
                    </p>
                    <p className="text-foreground text-h3 mt-1">
                      {node.terminal.title}
                    </p>
                    {node.terminal.description ? (
                      <p className="text-muted-foreground mt-1">
                        {node.terminal.description}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <article
                    className={cn(
                      "bg-card shadow-card relative rounded-[var(--radius)] border p-5 pt-6 lg:p-6",
                      sun ? "border-border-strong" : "border-border",
                      near ? "lg:rotate-[1.25deg]" : "lg:-rotate-[1.25deg]",
                    )}
                  >
                    {/* The glyph belongs to THIS stop, so it has to be
                        inside this stop's card — see GAP above for what
                        happens when it floats between two of them.

                        Always the RIGHT, never mirrored to follow the disc.
                        Mirroring was tried: it dodges the disc, but a tile on
                        the left pushes the title in while the description
                        below it stays put, and the card loses its left margin.
                        A broken text edge is worse than a tight corner, and
                        the corner is not actually tight — the disc straddles
                        the card's top edge (y -16..16) and the tile starts
                        below the padding (y 24..68), so they never touch even
                        when the curve puts both on the same side.

                        Wide screens keep the drawing in the empty column
                        opposite the card, so the tile is phone-only. */}
                    <div className="flex flex-row-reverse items-center gap-3.5 lg:block">
                      <span
                        aria-hidden="true"
                        className="bg-contrast/25 text-contrast-text flex size-11 shrink-0 items-center justify-center rounded-xl lg:hidden"
                      >
                        <StopGlyph
                          name={glyph ?? "cathedral"}
                          className="size-7 [stroke-width:1.9]"
                        />
                      </span>
                      <h3 className="text-h3 text-card-foreground min-w-0 flex-1">
                        {place ? (
                          /* Stretched link: the accessible name is the stop's
                             name alone, but the tap target is the whole card.
                             Wrapping the <article> in an <a> would pull the
                             description, the chips and the points into that
                             name and read them out on every card. */
                          <Link
                            href={`/blajhunt/${place.slug}`}
                            transitionTypes={["nav-forward"]}
                            className="focus-visible:ring-ring focus-visible:ring-offset-card rounded-sm after:absolute after:inset-0 after:z-10 after:content-[''] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                          >
                            {node.step.title}
                            {/* The affordance. An underline under a 20px
                                semibold heading in a language this full of
                                descenders and cedillas reads as a strike, not
                                as a link. The arrow says the same thing —
                                "this goes somewhere" — without touching the
                                letterforms.

                                --contrast-text, not --contrast: the bright
                                gold is 1.57:1 on a white card, i.e. invisible.
                                The deep gold is the same hue at 7:1, and it is
                                already what the glyphs are drawn in. */}
                            <span
                              aria-hidden="true"
                              className="text-contrast-text ml-1.5 inline-block"
                            >
                              &#8599;
                            </span>
                          </Link>
                        ) : (
                          node.step.title
                        )}
                      </h3>
                    </div>

                    <p className="text-muted-foreground mt-2.5">
                      {node.step.description}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {node.step.proofs?.length ? (
                        <ul className="flex flex-wrap gap-2">
                          {node.step.proofs.map((proof) => (
                            <li
                              key={proof}
                              className="border-brand/45 bg-brand/5 text-brand-text font-ui text-ui rounded-full border px-2.5 py-0.5 font-medium tracking-[0.08em] uppercase"
                            >
                              {proof}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {typeof node.step.points === "number" ? (
                        <span
                          className="bg-contrast text-foreground font-ui text-ui ml-auto shrink-0 rounded-full px-2.5 py-1 font-semibold tabular-nums"
                        >
                          {node.step.points}&nbsp;p
                        </span>
                      ) : null}
                    </div>
                  </article>
                )}
              </div>

              {/* Wide only: the empty column opposite the card. The drawing
                  hugs the gutter, so it and the card face each other across
                  the route rather than drifting to the page edge. */}
              {glyph ? (
                <div
                  aria-hidden="true"
                  className={cn(
                    "hidden lg:row-start-1 lg:flex lg:items-center",
                    near
                      ? "lg:col-start-2 lg:justify-start"
                      : "lg:col-start-1 lg:justify-end",
                  )}
                >
                  <StopGlyph
                    name={glyph}
                    className="text-contrast-text/60 size-28 [stroke-width:1.15]"
                  />
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
