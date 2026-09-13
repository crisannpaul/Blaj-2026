# The copy-review round trip

Every visitor-facing string on the site, handed to the organizers as a form
they fill in, and read back. Four scripts, outputs in `docs/copy/` (gitignored
and Vercel-ignored with the rest of `docs/`).

```
node --no-warnings scripts/copy/inventory.mjs   # -> docs/copy/inventory.json  (209 rows)
node scripts/copy/shots.mjs [http://localhost:3000]   # -> docs/copy/shots/*.png (needs :3000 up)
python scripts/copy/build_docx.py               # -> docs/copy/Blaj 2026 - Textele site-ului.docx
python scripts/copy/parse_docx.py <returned.docx>     # -> docs/copy/changes.json + a summary
```

Run them in that order. The inventory imports the three data modules directly
(`ateliere.ts`, `blajhunt-stops.ts`, `blajhunt-places.ts`) and lists the inline
JSX literals by hand, each with its file and exact string. **If a listed
literal is no longer in its file, the inventory refuses to build** — update the
entry, do not delete it. Screenshots come from the web-verify harness's own
`playwright-core`; the DOCX is written with `python-docx` (installed in the
system Python).

## The IDs are the contract

| Prefix | What |
|---|---|
| `GEN-nn` | site-wide metadata (browser title, share description) |
| `AC-nn` | the landing fold |
| `AL-nn` | the workshops carousel's own labels |
| `AT-n-nn` | workshop *n* in **site order 01–07**, field *nn* (01 title … 11 body, 12 tags) |
| `AD-nn` | fixed labels on a workshop page |
| `BH-nn` | the hunt roadmap |
| `OP-n-nn` | stop *n* in regulation order, field *nn* (01 name … 06 history, 07 Maps query) |
| `OD-nn` | fixed labels on a stop page |

Never reuse an ID. If an item goes away, its number stays retired. Every row's
`src` in `inventory.json` says where the string lives: a `data` entry names
the export, index and field in one of the three modules; a `literal` entry is
the exact text to find in a `.tsx`/`.ts` file (a few rows carry several, for
one string written in several places — the stop names, "Deschide în Maps").

## What the document asks

Per row: keep / replace / delete, from a Word drop-down that defaults to
Păstrează and omits Șterge where a deletion makes no sense (titles, buttons,
labels). The new text goes in the shaded last column. The cover page says all
of this in Romanian, and says to send back a `.docx`, not a PDF.

Rows the site cannot answer by itself are flagged ⚠ in the "Unde apare"
column: the event's official name (AC-01), the two "Sala ...." rooms and A7's
missing location (AT-n-09), the Maps searches that could become coordinates
(AT-n-10, OP-n-07), the eight stop histories marked `confidence: "check"`
(OP-n-06, each with the `verify` line), the team size and tie-break rule taken
from the regulation (BH-08, BH-17), and the tenth stop with no written task.

Deliberately **not** in the document: aria labels, the marquee's never-rendered
captions, `/blajhunt-legacy` (dead), the static `/blajhunt.html` (legacy
rules page), image alt text (all decorative, `alt=""`).

## Reading it back

`parse_docx.py` is forgiving about how people actually fill forms in, and
flags each case in the summary and in `changes.json`:

- new text written but the drop-down left on Păstrează → treated as a replacement
- the "Textul actual" column edited in place → its edited text is the replacement
- Înlocuiește chosen with an empty new-text cell → listed, nothing to apply
- Șterge on a row that cannot be deleted → treated as keep
- a document opened in Google Docs flattens the drop-downs to plain text; the
  parser reads the plain text too

`changes.json` is what gets applied, by hand or by a script written when the
document comes back: `src` says where, `new` says what. Derived fields are
rebuilt at that point — `cardTitle` (the title broken into short lines for the
stage) from `title`, the workshop `sessions` from the "Grupa · ora · locuri"
lines, `mapsQuery` from whatever the organizers wrote (a name, coordinates or
a Maps link). The no-break spaces in the landing's title and date must be kept
when those two literals are replaced.

`scratchpad/roundtrip.py` (session-local, not in the repo) mutated six rows
the way a client would and asserted the parser's reading of each; the pristine
document parses to zero changes.
