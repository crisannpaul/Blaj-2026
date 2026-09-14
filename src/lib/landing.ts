import type { BranchPanel } from "@/components/ui/branch-panels";

/**
 * The landing fold's content, shared by `/` and by the `/glass` experiment so
 * the two never drift apart in copy while one of them is being judged on
 * finish alone. It moved out of `page.tsx` because a page file may only export
 * its page and Next's config fields — a stray named export there is a build
 * error, not a warning.
 *
 * Every string here is a placeholder pending the organizers — the gathering's
 * official name, the date and the blurb all still need confirming (SPEC
 * A3/A5). They live in one object so there is exactly one place to edit.
 *
 * The two BRANCHES are the page's whole job: this is the common trunk and the
 * day has exactly two things in it. They are labels only, by decision — no
 * descriptive sub-line — so the pair reads as a poster rather than a menu.
 *
 * The two images are the commissioned artwork (A1/A3), supplied 8 Sep and
 * converted to webp from the originals kept out of the bundle in `docs/`. They
 * are 1152x928, i.e. 5:4 — sized to the largest the open panel is ever painted
 * (390x288 CSS px, 1170x864 on a 3x phone) so nothing upscales. See the export
 * geometry table in SPEC before commissioning any replacement: the open panel's
 * ratio moves from 1.08 at 390 to 1.35 at lg, and `object-cover` centre-crops.
 *
 * The tint is what keeps them from reading as more of the marquee behind them.
 * Sky goes to the workshops because /ateliere already carries a sky cast, and
 * gold to the hunt because a treasure hunt is the one thing on this page that
 * gold actually means something for.
 */
export const BRANCHES: readonly BranchPanel[] = [
  {
    href: "/ateliere",
    label: "Ateliere",
    image: "/landing/workshops.webp",
    tint: "sky",
  },
  {
    href: "/blajhunt",
    label: "Blajhunt",
    image: "/landing/blajhunt.webp",
    tint: "gold",
  },
];

/**
 * THE LEAD IS LENGTH-CONSTRAINED ON `/`, and the constraint is structural, not
 * taste. (`/glass` is not — see the end of this note.)
 *
 * `/`'s fold is `justify-end` inside `min-h-[100svh]`, so the copy block is
 * anchored to the BOTTOM and every extra line of lead pushes the kicker UP,
 * toward and then off the top of the screen. Measured slack below the cards is
 * exactly the 56px of bottom padding at every width from 375 to 768: there is
 * no spare room to grow into, only room taken from the top.
 *
 * The text supplied on 8 Sep ran 305 characters. It was cut to ~215 by dropping
 * "Vă așteptăm cu un program complex și atractiv din care nu lipsesc" — a
 * clause that announces a list instead of being one — and folding the list onto
 * the first sentence. Nothing factual went: the invitation, both eparchies and
 * all five things in the programme survive. The eparchy names would save the
 * most characters by far and are exactly what must NOT be cut, because naming
 * Cluj-Gherla is how a young person from Cluj-Gherla knows they are invited.
 *
 * The copy-review round came back on 14 Sep with 948 characters for this slot —
 * a full welcome letter, "Dragi tineri" through to the Biroul's signature. That
 * is 4.3x the box. Injected into the running `/` at 390 it took the lead from
 * 128px to 563px, pushed the document to 1055px against an 844px fold and put
 * BOTH branch panels under it; the letter's paragraph breaks also vanish here,
 * because this slot is one <p>. What survives is the organizers' own first
 * sentence, whose "în Mica Romă" is new and is theirs, plus the programme list
 * folded back on. The rest of the letter is not lost — it wants a section of
 * its own below the panels, with real paragraphs and the signature, and that is
 * a layout decision rather than a copy one. (That note and these strings were
 * written on master's `page.tsx` on 14 Sep and carried here the same day, so
 * the two trees say the same thing; on this branch this file is where copy
 * lands.)
 *
 * 220 characters renders in exactly the line count 219 did at every width from
 * 320 to 844: 7 / 6 / 5 / 5 / 4. Count characters to get close, then count
 * LINES, because the line count is what the box actually spends.
 *
 * If it grows again on `/`, the room comes from the CARDS, not from the top of
 * the screen — and that is a coupled decision with the vertical mark on a
 * spine. See the height note in `branch-panels.tsx` before changing either.
 *
 * `/glass` has no such ceiling: below `lg` its sheet hangs from the top of a
 * page that scrolls, so a longer lead makes the sheet taller and the page
 * longer and pushes nothing off the screen. Checked with the 8 Sep text at its
 * full 305 characters plus a two-line kicker: at 390x844 the sheet is 656px
 * and 188px of the marquee still shows under it. The organisers' final copy
 * is landing here; on this branch this file is the one place it goes.
 */
export const CONTENT = {
  kicker: "Întâlnirea Intereparhială a Tinerilor",
  title: "Blaj 2026",
  meta: "19 septembrie 2026 · Blaj",
  lead:
    "La invitația Preafericitului Părinte Claudiu, tinerii din Arhieparhia " +
    "de Alba Iulia și Făgăraș și din Eparhia de Cluj-Gherla petrec o zi " +
    "împreună în Mica Romă — rugăciune, ateliere, prieteni noi și un oraș " +
    "de descoperit.",
} as const;
