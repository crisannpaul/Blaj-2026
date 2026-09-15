# Open items — Blaj 2026

Read this when a task touches content, copy, the hunt route or deploy. Each
item names who can close it. Decisions already taken live in the header comment
of the file they govern; rules live in `CLAUDE.md`. There is no other list.
Close an item by deleting it, in the same commit as the change.

## Blocking before the site is public

- **Which list of ten stops is final.** `Regulament.docx` and
  `Treasurehunt.docx` disagree: the regulation has Protopopiatul Blaj, which has
  no task written anywhere, where the hunt document has Muzeul Curiei; and
  Câmpia Libertății is listed ninth although its task is plainly the finale. The
  site follows the regulation because it is the participant-facing document and
  the only one whose points add up. One edit to `STOPS` in
  `src/lib/blajhunt-stops.ts` changes it. Owner: organizers.
- **Fact-check the stop histories** in `src/lib/blajhunt-places.ts`. They were
  written from general knowledge, not from a source in this repo. Eight entries
  are flagged `confidence: "check"` and each carries a `verify` line saying
  exactly what to confirm. Promote one to `"solid"` only when someone has
  actually checked, and say who. Owner: organizers.
- **Legacy URLs are printed in the official rules:**
  `https://blajhunt.prietenicuistoria.ro/` and `/panou`. Whatever ships must
  answer there or redirect there. Tied to the domain question below. Owner: user.

## Content the organizers still owe

- **A12 (Escape Mode) has no gallery.** It is the only workshop page without
  one; no photographs of the workshop were ever sent. Its card art arrived
  15 Sep.
- **A11 has no `Locația:` line.** The room name on the site is read off the GPS
  link the organizers sent (Biblioteca de Teologie Greco-Catolică). A library is
  a building; confirm the room. Noted in `src/lib/ateliere.ts`.
- **A10's document ends on "Întâlnire la ??"** although the room is now named
  twelve lines above. Nothing is printed from it; confirm the meeting point is
  the room.
- **Programme of the day, contact for the day, logos.** Never delivered, and no
  section exists for them.
- **Stop coordinates.** The stop pages' Maps buttons run a search for the
  building's name, not a pin, because a wrong pin sends a team across town on
  the day. Real coordinates would be better. Nice-to-have.

## Decisions for the user

- **Domain.** None yet; production is
  `https://blaj2026-rjw9derml-geneous.vercel.app`. Keep
  `blajhunt.prietenicuistoria.ro` with redirects, or a new one? Nothing
  hard-codes the hostname: `src/app/layout.tsx` reads it from the environment.
- **Where the hunt rules go.** `/blajhunt` is the roadmap only. The rules from
  `Regulament.docx` are not on the site; the pre-React `public/blajhunt.html`
  still serves at `/blajhunt.html`, unlinked. Same page further down, or
  `/blajhunt/regulament`? The static file retires either way.
- **The welcome letter's arrival, phase two — built, awaiting the user's eye.**
  The user picked the iOS-style notification: a banner drops in on a first
  visit and expands in place into the letter
  (`src/components/ui/letter-bell.tsx`). It is committed and on `:3000`;
  production still serves phase one's plain sheet. Look, then ship or change.
- **Signup.** There is none, and no backend at all; every workshop page carries
  a disabled, labelled button. The event is 19 Sep. Build something, or drop
  the button?

## Cleanup

- `/blajhunt-legacy` is the vertical roadmap the swipe replaced. Unlinked, due
  for deletion, together with `how-it-works.tsx` which only it mounts.
- `public/blajhunt.html` retires with the rules decision above.
- `public/placeholder/` is referenced by nothing in `src/`.
- Delete the deployment after the event.
