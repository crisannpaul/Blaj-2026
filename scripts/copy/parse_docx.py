"""
Read a copy-review document the client sent back and list what they asked for.

    python scripts/copy/parse_docx.py <returned.docx> [--out docs/copy/changes.json]

Every table row whose first cell is an inventory ID becomes one entry:

    { id, action: keep|replace|delete, new, current_in_doc, edited_in_place,
      flags: [...] }

The action is read from the drop-down; a filled "Textul nou" cell on a row left
on "Păstrează" counts as a replacement (the cover page says so). A row whose
"Textul actual" cell no longer matches the inventory is flagged
`edited_in_place` and its edited text is offered as the replacement, because
some people will edit the left column no matter what the instructions say.
Nothing is applied here — the output is what a human (or the apply step) acts on.
"""
import argparse
import json
import os
import re
import sys

from docx import Document
from docx.oxml.ns import qn

# The summary is Romanian; a Windows console defaults to cp1252 and chokes.
sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
INVENTORY = os.path.join(ROOT, "docs", "copy", "inventory.json")

ID_RE = re.compile(r"^(GEN|AC|AL|AT-\d+|AD|BH|OP-\d+|OD)-\d{2}$")
ACTION_OF = {"păstrează": "keep", "înlocuiește": "replace", "șterge": "delete"}


def norm(s):
    """Collapse spaces, keep paragraph breaks (blank lines) and line breaks."""
    lines = [re.sub(r"[ \t ]+", " ", line).strip() for line in (s or "").split("\n")]
    return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()


def cell_text(cell):
    """Paragraphs joined by blank lines; explicit line breaks kept. Includes
    text inside content controls, which python-docx's .text skips."""
    paras = []
    for p in cell._tc.iter(qn("w:p")):
        parts = []
        for node in p.iter():
            if node.tag == qn("w:t"):
                parts.append(node.text or "")
            elif node.tag == qn("w:br"):
                parts.append("\n")
            elif node.tag == qn("w:tab"):
                parts.append("\t")
        paras.append("".join(parts))
    text = "\n\n".join(paras)
    return norm(text)


def action_of(cell):
    sdt = next(cell._tc.iter(qn("w:sdt")), None)
    raw = ""
    if sdt is not None:
        content = sdt.find(qn("w:sdtContent"))
        if content is not None:
            raw = "".join(t.text or "" for t in content.iter(qn("w:t")))
    if not raw:
        raw = cell_text(cell)
    key = norm(raw).lower().strip(" .")
    return ACTION_OF.get(key, None), raw.strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("docx")
    ap.add_argument("--out", default=os.path.join(ROOT, "docs", "copy", "changes.json"))
    args = ap.parse_args()

    with open(INVENTORY, encoding="utf-8") as f:
        inv = {it["id"]: it for it in json.load(f)["items"]}

    doc = Document(args.docx)
    seen, changes, unknown = set(), [], []
    for table in doc.tables:
        for row in table.rows:
            cells = row.cells
            if len(cells) < 5:
                continue
            rid = cell_text(cells[0]).strip()
            if not ID_RE.match(rid):
                continue
            if rid not in inv:
                unknown.append(rid)
                continue
            seen.add(rid)
            it = inv[rid]
            current_doc = cell_text(cells[2])
            action, raw_action = action_of(cells[3])
            new = cell_text(cells[4])
            flags = []

            placeholder_empty = current_doc.startswith("(gol")
            edited = (not placeholder_empty) and norm(current_doc) != norm(it["current"])
            if placeholder_empty:
                current_doc = ""

            if action is None:
                flags.append(f"acțiune necunoscută: „{raw_action}”")
                action = "keep"
            if action == "keep" and new:
                action = "replace"
                flags.append("text nou scris, dar acțiunea lăsată pe Păstrează → tratat ca înlocuire")
            if action == "replace" and not new:
                if edited:
                    new = current_doc
                    flags.append("Înlocuiește fără text nou; folosit textul editat din coloana „actual”")
                else:
                    flags.append("Înlocuiește, dar coloana „Textul nou” e goală → nimic de aplicat")
            if action == "delete" and not it["deletable"]:
                flags.append("Șterge pe un element care nu se poate șterge → tratat ca Păstrează")
                action = "keep"
            if edited and action == "keep":
                new = current_doc
                action = "replace"
                flags.append("coloana „Textul actual” a fost editată direct → tratat ca înlocuire")
            elif edited and action == "replace" and new != current_doc:
                flags.append("coloana „Textul actual” a fost editată ȘI s-a scris text nou; se folosește „Textul nou”")

            if action == "keep" and not flags:
                continue
            changes.append({
                "id": rid,
                "section": it["section"],
                "element": it["element"],
                "action": action,
                "current": it["current"],
                "new": new if action == "replace" else "",
                "edited_in_place": edited,
                "flags": flags,
                "src": it["src"],
            })

    missing = sorted(set(inv) - seen)
    out = {"source": os.path.abspath(args.docx), "changes": changes, "unknown_ids": unknown, "missing_ids": missing}
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    n_rep = sum(1 for c in changes if c["action"] == "replace")
    n_del = sum(1 for c in changes if c["action"] == "delete")
    n_flag = sum(1 for c in changes if c["flags"])
    print(f"{len(seen)} rows read · {n_rep} replace · {n_del} delete · {n_flag} flagged")
    if unknown:
        print(f"unknown ids (not in inventory): {', '.join(unknown)}")
    if missing:
        print(f"ids missing from the document ({len(missing)}): {', '.join(missing[:12])}{' …' if len(missing) > 12 else ''}")
    for c in changes:
        tag = {"replace": "REPLACE", "delete": "DELETE ", "keep": "keep   "}[c["action"]]
        head = f"{tag} {c['id']:9} {c['element'][:60]}"
        print(head)
        if c["action"] == "replace":
            print(f"          → {c['new'][:110].replace(chr(10), ' / ')}{'…' if len(c['new']) > 110 else ''}")
        for fl in c["flags"]:
            print(f"          ! {fl}")
    print(f"-> {args.out}")


if __name__ == "__main__":
    main()
