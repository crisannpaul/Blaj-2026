import { Fragment } from "react";
import Link from "next/link";

/**
 * The organizers' welcome letter, VERBATIM, as a card.
 *
 * This is row AC-04 of the copy review that came back on 14 Sep — the text
 * the organizers wrote for the landing's lead slot. 948 characters, "Dragi
 * tineri" to the Biroul's signature, against a hero slot that holds ~220
 * (SPEC D15). The hero keeps their first sentence; everything after it lives
 * here, with its paragraphs intact. The returned .docx has no line breaks in
 * it — every line is its own paragraph — so the one-liners are theirs, and so
 * is the "<3" at the end of the signature.
 *
 * Nothing is rewritten. The single edit is a LINK: "atelierele pe care le-am
 * pregătit special pentru voi" points at /ateliere, because the sentence says
 * this page is where the workshops are, and on a phone the letter is the last
 * thing on the page — a reader who finishes it needs somewhere to go other
 * than back up to the panels (vercel: no dead ends).
 *
 * The kicker above the salutation is site chrome, not copy: the same
 * uppercase tracked label the hero's date line wears. It is what makes the
 * card read as a letter *from someone* on first glance, before anyone has
 * read down to the signature. Add it to the copy inventory as an AC row if the
 * page ships.
 *
 * Type: three steps of the ramp — the kicker at `ui`, the salutation at `h2`
 * and everything else at `body`. The salutation was `h3` (20px) in the first
 * cut, on the argument that a letter's salutation is body-sized on paper. The
 * cold review put a number on what that cost: on a phone the card IS the
 * second screen, and everything on it sat between 13 and 20px — a 1.54x
 * spread against the fold's 3.4x, with no element the eye could land on
 * (GUIDELINES 3 and 10.9). `h2` is fluid, 29px at 390 and 44px at 1440, and
 * 44 beside the fold's 88px title is a 2:1 — the page's second section
 * carrying the page's second heading, which is what it is.
 */
type Segment = string | { text: string; href: "/ateliere" };

const LETTER: {
  kicker: string;
  salutation: string;
  paragraphs: readonly (readonly Segment[])[];
  signature: readonly [string, string];
} = {
  kicker: "Cuvânt de bun venit",
  salutation: "Dragi tineri,",
  paragraphs: [
    ["Sunteți pregătiți să petrecem împreună o zi de neuitat?"],
    [
      "Vă așteptăm cu voie bună și cu un program în care se împletesc " +
        "rugăciunea, bucuria întâlnirii, prieteniile noi și dorința de a " +
        "descoperi împreună un oraș cu o istorie și o spiritualitate aparte.",
    ],
    [
      "Nerăbdători să vă întâlnim, venim în întâmpinarea voastră și prin " +
        "intermediul acestei pagini, unde puteți descoperi ",
      {
        text: "atelierele pe care le-am pregătit special pentru voi",
        href: "/ateliere",
      },
      ".",
    ],
    [
      "Mai mult decât atât, aveți posibilitatea să vă înscrieți la atelierul " +
        "sau atelierele care vă stârnesc interesul și pe care le considerați " +
        "potrivite pentru voi.",
    ],
    [
      "Haideți să ne întâlnim, să ne bucurăm împreună și să facem din " +
        "această zi o experiență de neuitat!",
    ],
  ],
  signature: [
    "Biroul pentru Pastorația Tinerilor și a Copiilor",
    "al Arhieparhiei de Alba Iulia și Făgăraș <3",
  ],
};

/**
 * The surface is `--card`, OPAQUE. It was 92% in the first cut, to match the
 * fold's 90% copy scrim and let the archive ghost through the paper; the cold
 * review measured the ghost — a 4/255 mean, 16/255 peak drift under the body
 * copy between two frames six seconds apart — and named it for what it is:
 * the marquee, an accepted 2.2.2 deviation on the fold (D10), composited into
 * the reading surface of 948 characters of running text. Paper does not move
 * while you read it. The band still runs around the card, as on the fold.
 *
 * `shadow-sheet`, not `shadow-card`: the card's top edge is what peeks under
 * the fold, and `shadow-card` has no halo above the box — see globals.css.
 *
 * Padding steps up with the viewport — 20 / 24 / 32 — because the measure
 * does: at 390 the card is 358 wide and 20px a side leaves ~40ch; at `xl` the
 * card is 484–512 and 32px leaves ~55ch, inside the 45–75 band. The top is 24
 * even at 390: the landing shows this card's top 48px under the fold — the
 * padding and the whole kicker line — as the scroll cue, and the geometry
 * there is `page.tsx`'s to keep.
 */
export function WelcomeLetter({ className = "" }: { className?: string }) {
  return (
    <article
      aria-labelledby="scrisoare-salut"
      className={`bg-card text-card-foreground shadow-sheet rounded-2xl px-5 pt-6 pb-5 sm:p-6 xl:p-8 ${className}`}
    >
      <p className="text-muted-foreground font-ui text-ui tracking-[0.14em] uppercase">
        {LETTER.kicker}
      </p>
      <h2 id="scrisoare-salut" className="text-h2 mt-3 font-semibold">
        {LETTER.salutation}
      </h2>

      <div className="mt-5 space-y-4">
        {LETTER.paragraphs.map((para, i) => (
          <p key={i}>
            {para.map((seg, k) =>
              typeof seg === "string" ? (
                <Fragment key={k}>{seg}</Fragment>
              ) : (
                <Link
                  key={k}
                  href={seg.href}
                  transitionTypes={["nav-forward"]}
                  /* Always underlined — colour alone must not carry "this is a
                     link", and hover does not exist on the target device. The
                     underline is sky, the ink is the sky that reads (6.15:1).
                     Inline links in running text are the one place a 44px
                     target is not owed: the line box is what the finger gets,
                     and a wrapped link is two of them. */
                  className="text-brand-text focus-visible:ring-ring focus-visible:ring-offset-card decoration-brand rounded-sm font-medium underline underline-offset-4 hover:text-foreground focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:text-foreground"
                >
                  {seg.text}
                </Link>
              ),
            )}
          </p>
        ))}
      </div>

      {/* The signature, under a hairline. One name in one paragraph — the
          .docx had it as two, but a signature is a block and a screen reader
          should say the name once, whole. No forced break either: with one,
          the first half wrapped on its own at 390 and left "a Copiilor" alone
          on a line. Balanced instead, so the three lines a phone needs come
          out even and the two a desktop needs break where the name does. */}
      <footer className="border-border mt-7 border-t pt-5">
        <p className="font-display leading-snug font-semibold text-balance">
          {LETTER.signature[0]} {LETTER.signature[1]}
        </p>
      </footer>
    </article>
  );
}
