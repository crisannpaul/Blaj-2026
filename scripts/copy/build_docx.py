"""
Build the client-facing copy-review document from docs/copy/inventory.json.

    python scripts/copy/build_docx.py            -> docs/copy/Blaj 2026 - Textele site-ului.docx

One landscape table per page/section: ID · where the text sits · the text as
it is today · an action dropdown (Păstrează / Înlocuiește / Șterge) · a shaded
cell for the new text. IDs are the contract with parse_docx.py, which reads
the file back. The walkthrough screenshots come from scripts/copy/shots.mjs.
"""
import datetime
import io
import json
import os
import random
import re
import sys

from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
INVENTORY = os.path.join(ROOT, "docs", "copy", "inventory.json")
SHOTS = os.path.join(ROOT, "docs", "copy", "shots")
OUT = os.path.join(ROOT, "docs", "copy", "Blaj 2026 - Textele site-ului.docx")

INK = RGBColor(0x1A, 0x1A, 0x1A)
MUTED = RGBColor(0x5F, 0x63, 0x68)
WARN = RGBColor(0xB4, 0x4A, 0x00)
HEAD_FILL = "1F3A5F"
NEW_FILL = "FFF6D5"
ID_FILL = "F3F4F6"

ACTIONS = [("Păstrează", "keep"), ("Înlocuiește", "replace"), ("Șterge", "delete")]

# Column widths, cm. Landscape A4 with 1.6 cm side margins leaves 26.5 cm.
COLS = [1.7, 4.8, 8.6, 2.6, 8.8]
HEADERS = ["Nr.", "Unde apare", "Textul actual (nu se modifică)", "Acțiune", "Textul nou"]

MONTHS_RO = [
    "ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
    "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie",
]

PAGES = [
    {
        "key": "acasa",
        "title": "Pagina principală",
        "url": "/",
        "shot": "acasa",
        "intro": [
            "Prima pagină, pe un singur ecran: fotografiile din arhivă în fundal, "
            "supratitlul, titlul, data, textul de prezentare și cele două panouri "
            "care duc spre Ateliere și spre Blajhunt. Panourile se schimbă singure "
            "între ele până când vizitatorul atinge ceva.",
            "Aici este tot textul provizoriu de pe prima pagină. Denumirea "
            "întâlnirii (AC-01) este cea mai importantă de confirmat.",
        ],
        "sections": ["Pagina principală"],
    },
    {
        "key": "ateliere",
        "title": "Lista atelierelor",
        "url": "/ateliere",
        "shot": "ateliere",
        "intro": [
            "Un carusel cu câte un card pe atelier, în ordinea din tabelul de mai "
            "jos (01–07). Sub cardul din mijloc: numărul («Atelier 01»), durata și "
            "locurile, rezumatul și butonul «Detalii», care deschide fișa atelierului.",
            "Titlurile, rezumatele, duratele și locurile vin din fișa fiecărui "
            "atelier (capitolul următor). Aici sunt doar etichetele comune "
            "caruselului.",
        ],
        "sections": ["Lista atelierelor (caruselul)"],
    },
    {
        "key": "atelier",
        "title": "Fișele atelierelor",
        "url": "/ateliere/…",
        "shot": "atelier",
        "intro": [
            "Fiecare atelier are pagina lui: fotografia, numărul, titlul, "
            "subtitlul și rezumatul; apoi datele (cine îl conduce, când, durata, "
            "locurile, unde — cu buton spre Google Maps); butonul de înscriere, "
            "inactiv până se deschid înscrierile; descrierea completă; "
            "hashtag-urile; fotografiile suplimentare; legăturile spre atelierele "
            "vecine.",
            "Capturile de mai jos sunt pentru atelierul 01. Celelalte șase au "
            "exact aceeași structură. Textele sunt cele din documentele trimise pe "
            "8 septembrie; ce lipsea acolo (săli, locație, coordonate) este marcat cu ⚠.",
        ],
        "sections": "atelier",
    },
    {
        "key": "blajhunt",
        "title": "Traseul Blajhunt",
        "url": "/blajhunt",
        "shot": "blajhunt",
        "intro": [
            "Prezentarea vânătorii de comori și traseul ei: câte un cartonaș pe "
            "oprire, derulat lateral, cu un cartonaș de Start înainte și unul de "
            "Final după. Pe fiecare cartonaș: numărul, punctele, numele opririi, "
            "rândul de sub nume, descrierea probei, ce se predă și butonul spre Maps.",
            "Pagina nu conține regulamentul, indiciile sau răspunsurile — și nu "
            "trebuie să le conțină: este publică. Textele cartonașelor sunt în "
            "capitolul următor, la fiecare oprire.",
        ],
        "sections": ["Traseul Blajhunt (pagina /blajhunt)"],
    },
    {
        "key": "oprire",
        "title": "Paginile opririlor",
        "url": "/blajhunt/…",
        "shot": "oprire",
        "intro": [
            "Fiecare oprire are pagina ei: numele, rândul de sub nume, butonul "
            "Maps și punctele, apoi istoria locului și ce se predă acolo. Nicio "
            "parte a probei nu apare pe această pagină.",
            "⚠ Textele despre istoria locurilor au fost scrise din cunoștințe "
            "generale, fără o sursă verificată și fără ca cineva din echipa "
            "site-ului să fi fost la fața locului. Fiecare are notat exact ce este "
            "de confirmat. Vă rugăm să le citiți cu atenție: aici e cel mai probabil "
            "să existe o greșeală de fapt.",
        ],
        "sections": "oprire",
    },
    {
        "key": "gen",
        "title": "Texte tehnice",
        "url": "toate paginile",
        "shot": None,
        "intro": [
            "Texte pe care vizitatorul nu le vede în pagină, dar le vede în "
            "afara ei: în tab-ul browserului, în rezultatul Google și în "
            "previzualizarea care apare când linkul e trimis pe WhatsApp sau "
            "Facebook.",
        ],
        "sections": ["Titlul din browser și previzualizarea la distribuire"],
    },
]


# ── Small XML helpers ────────────────────────────────────────────────────────

# Word validates child order inside w:tblPr; LibreOffice does not. Insert at
# the schema position rather than appending after python-docx's w:tblLook.
TBL_PR_ORDER = [
    "tblStyle", "tblpPr", "tblOverlap", "bidiVisual", "tblStyleRowBandSize",
    "tblStyleColBandSize", "tblW", "jc", "tblCellSpacing", "tblInd",
    "tblBorders", "shd", "tblLayout", "tblCellMar", "tblLook",
]


def tbl_pr_set(table, el):
    tbl_pr = table._tbl.tblPr
    tag = el.tag.split("}")[1]
    for old in tbl_pr.findall(qn(f"w:{tag}")):
        tbl_pr.remove(old)
    later = TBL_PR_ORDER[TBL_PR_ORDER.index(tag) + 1:]
    for child in tbl_pr:
        if child.tag.split("}")[1] in later:
            child.addprevious(el)
            return
    tbl_pr.append(el)


def shade(cell, hex_fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_fill)
    tc_pr.append(shd)


def cell_margins(table, top=60, bottom=60, left=90, right=90):
    mar = OxmlElement("w:tblCellMar")
    for side, val in (("top", top), ("left", left), ("bottom", bottom), ("right", right)):
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:w"), str(val))
        el.set(qn("w:type"), "dxa")
        mar.append(el)
    tbl_pr_set(table, mar)


def fixed_layout(table):
    layout = OxmlElement("w:tblLayout")
    layout.set(qn("w:type"), "fixed")
    tbl_pr_set(table, layout)


def repeat_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    el = OxmlElement("w:tblHeader")
    el.set(qn("w:val"), "true")
    tr_pr.append(el)
    cant = OxmlElement("w:cantSplit")
    cant.set(qn("w:val"), "true")
    tr_pr.append(cant)


def set_widths(table, widths_cm):
    for row in table.rows:
        for cell, w in zip(row.cells, widths_cm):
            cell.width = Cm(w)
    grid = table._tbl.tblGrid
    for col, w in zip(grid.findall(qn("w:gridCol")), widths_cm):
        col.set(qn("w:w"), str(int(Cm(w).twips)))


def borders(table, color="C9CDD3", size=4):
    b = OxmlElement("w:tblBorders")
    for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), str(size))
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), color)
        b.append(el)
    tbl_pr_set(table, b)


def no_borders(table):
    b = OxmlElement("w:tblBorders")
    for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:val"), "nil")
        b.append(el)
    tbl_pr_set(table, b)


def dropdown(paragraph, tag, options, default):
    """A Word drop-down content control inside `paragraph`."""
    sdt = OxmlElement("w:sdt")
    pr = OxmlElement("w:sdtPr")
    rpr = OxmlElement("w:rPr")
    sz = OxmlElement("w:sz")
    sz.set(qn("w:val"), "19")
    rpr.append(sz)
    pr.append(rpr)
    alias = OxmlElement("w:alias")
    alias.set(qn("w:val"), "Acțiune")
    pr.append(alias)
    t = OxmlElement("w:tag")
    t.set(qn("w:val"), tag)
    pr.append(t)
    i = OxmlElement("w:id")
    i.set(qn("w:val"), str(random.randint(100000000, 2000000000)))
    pr.append(i)
    dd = OxmlElement("w:dropDownList")
    dd.set(qn("w:lastValue"), default)
    for display, value in options:
        li = OxmlElement("w:listItem")
        li.set(qn("w:displayText"), display)
        li.set(qn("w:value"), value)
        dd.append(li)
    pr.append(dd)
    sdt.append(pr)
    content = OxmlElement("w:sdtContent")
    r = OxmlElement("w:r")
    r_pr = OxmlElement("w:rPr")
    r_sz = OxmlElement("w:sz")
    r_sz.set(qn("w:val"), "19")
    r_pr.append(r_sz)
    r.append(r_pr)
    tx = OxmlElement("w:t")
    tx.text = default
    r.append(tx)
    content.append(r)
    sdt.append(content)
    paragraph._p.append(sdt)


def page_number(paragraph):
    run = paragraph.add_run()
    for kind, text in (("begin", None), (None, "PAGE"), ("end", None)):
        if kind:
            el = OxmlElement("w:fldChar")
            el.set(qn("w:fldCharType"), kind)
        else:
            el = OxmlElement("w:instrText")
            el.set(qn("xml:space"), "preserve")
            el.text = text
        run._r.append(el)


def set_lang(doc, lang="ro-RO"):
    rpr = doc.styles["Normal"].element.get_or_add_rPr()
    el = OxmlElement("w:lang")
    el.set(qn("w:val"), lang)
    rpr.append(el)


# ── Text helpers ─────────────────────────────────────────────────────────────

def write_text(cell, text, size=9.5, color=INK, italic=False, first=True):
    """Paragraphs on blank lines, line breaks on single newlines."""
    paras = text.split("\n\n") if text else [""]
    for k, para in enumerate(paras):
        p = cell.paragraphs[0] if (first and k == 0) else cell.add_paragraph()
        p.paragraph_format.space_after = Pt(3 if k < len(paras) - 1 else 0)
        lines = para.split("\n")
        for j, line in enumerate(lines):
            run = p.add_run(line)
            run.font.size = Pt(size)
            run.font.color.rgb = color
            run.italic = italic
            if j < len(lines) - 1:
                run.add_break(WD_BREAK.LINE)
    return cell


def para(doc_or_cell, text="", size=10.5, bold=False, color=INK, italic=False,
         after=6, align=None, style=None):
    p = doc_or_cell.add_paragraph(style=style) if style else doc_or_cell.add_paragraph()
    if text:
        run = p.add_run(text)
        run.font.size = Pt(size)
        run.bold = bold
        run.italic = italic
        run.font.color.rgb = color
    p.paragraph_format.space_after = Pt(after)
    if align:
        p.alignment = align
    return p


def heading(doc, text, level):
    h = doc.add_heading(text, level=level)
    for r in h.runs:
        r.font.color.rgb = RGBColor(0x1F, 0x3A, 0x5F)
        r.font.name = "Calibri"
    h.paragraph_format.space_before = Pt(14 if level == 1 else 10)
    h.paragraph_format.space_after = Pt(4)
    h.paragraph_format.keep_with_next = True
    return h


def date_ro(d):
    return f"{d.day} {MONTHS_RO[d.month - 1]} {d.year}"


# ── Screenshots: a phone page as side-by-side strips ────────────────────────

STRIP_W_CM = 5.4
STRIP_GAP_CM = 0.3
STRIP_MAX_H_CM = 13.6
PAGE_TEXT_W_CM = 26.5


def strips_for(shot):
    """Cut a tall 390px-wide screenshot into strips that fit one page height."""
    path = os.path.join(SHOTS, f"{shot}.png")
    if not os.path.exists(path):
        return []
    im = Image.open(path).convert("RGB")
    w, h = im.size
    strip_h = int(w * STRIP_MAX_H_CM / STRIP_W_CM)
    out = []
    y = 0
    while y < h:
        piece = im.crop((0, y, w, min(y + strip_h, h)))
        buf = io.BytesIO()
        piece.save(buf, format="JPEG", quality=82, optimize=True)
        buf.seek(0)
        out.append((buf, piece.size))
        y += strip_h
    return out


def add_intro_with_figure(doc, intro, shot, url):
    """The page description on the left, the phone screenshot strips on the
    right, as one borderless row that never splits across pages."""
    strips = strips_for(shot) if shot else []
    if not strips:
        for t in intro:
            para(doc, t, size=10.5, after=5)
        return
    # One cell per strip, each exactly as wide as its picture plus the gap, so
    # the strips can never wrap under each other (they did, at two strips,
    # when they shared one paragraph).
    col_w = STRIP_W_CM + STRIP_GAP_CM
    text_w = PAGE_TEXT_W_CM - len(strips) * col_w
    table = doc.add_table(rows=1, cols=1 + len(strips))
    table.autofit = False
    fixed_layout(table)
    no_borders(table)
    cell_margins(table, top=0, bottom=0, left=0, right=0)
    left = table.rows[0].cells[0]
    for k, t in enumerate(intro):
        p = left.paragraphs[0] if k == 0 else left.add_paragraph()
        r = p.add_run(t)
        r.font.size = Pt(10.5)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.right_indent = Cm(0.6)
    cap = "Pagina pe telefon" + (f", de sus în jos, în {len(strips)} fâșii" if len(strips) > 1 else "")
    p = left.add_paragraph()
    r = p.add_run(f"{cap} (în dreapta). Adresa: {url}")
    r.font.size = Pt(8.5)
    r.italic = True
    r.font.color.rgb = MUTED
    for k, (buf, (w, h)) in enumerate(strips):
        p = table.rows[0].cells[1 + k].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p.add_run().add_picture(buf, width=Cm(STRIP_W_CM))
    set_widths(table, [text_w] + [col_w] * len(strips))
    para(doc, "", after=2)


# ── The table ────────────────────────────────────────────────────────────────

def add_table(doc, rows):
    table = doc.add_table(rows=1, cols=len(COLS))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    fixed_layout(table)
    borders(table)
    cell_margins(table)

    head = table.rows[0]
    repeat_header(head)
    for cell, text in zip(head.cells, HEADERS):
        shade(cell, HEAD_FILL)
        p = cell.paragraphs[0]
        r = p.add_run(text)
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    for it in rows:
        row = table.add_row()
        c_id, c_el, c_cur, c_act, c_new = row.cells

        shade(c_id, ID_FILL)
        r = c_id.paragraphs[0].add_run(it["id"])
        r.bold = True
        r.font.size = Pt(9)
        r.font.name = "Consolas"

        write_text(c_el, it["element"], size=9)
        if it.get("note"):
            warn = it["note"].startswith("⚠")
            write_text(c_el, it["note"], size=8, color=WARN if warn else MUTED, first=False)
        if not it["deletable"]:
            write_text(c_el, "Nu se poate șterge, doar înlocui.", size=7.5, color=MUTED, italic=True, first=False)

        if it["current"]:
            write_text(c_cur, it["current"], size=9.5)
        else:
            write_text(c_cur, "(gol — momentan nu apare nimic)", size=9, color=MUTED, italic=True)

        opts = ACTIONS if it["deletable"] else ACTIONS[:2]
        dropdown(c_act.paragraphs[0], f"act:{it['id']}", opts, ACTIONS[0][0])

        shade(c_new, NEW_FILL)
        c_new.paragraphs[0].add_run("").font.size = Pt(9.5)

    set_widths(table, COLS)
    return table


# ── Cover ────────────────────────────────────────────────────────────────────

def add_cover(doc, inv, counts):
    generated = datetime.datetime.fromisoformat(inv["generated"].replace("Z", "+00:00"))
    p = para(doc, "Blaj 2026 · site-ul întâlnirii", size=10.5, color=MUTED, after=0)
    p.paragraph_format.space_before = Pt(4)
    para(doc, "Textele site-ului", size=26, bold=True, color=RGBColor(0x1F, 0x3A, 0x5F), after=0)
    para(doc, "Document de verificare și înlocuire", size=14, color=INK, after=2)
    para(doc, f"Generat pe {date_ro(generated.astimezone())} din versiunea curentă a site-ului · "
              f"{len(inv['items'])} texte", size=9.5, color=MUTED, after=10)

    para(doc, "Acest document conține fiecare text pe care îl vede un vizitator al site-ului, "
              "pagină cu pagină, exact așa cum apare acum. Multe dintre ele sunt provizorii. "
              "Pentru fiecare, spuneți-ne dacă rămâne, se înlocuiește sau dispare — "
              "iar noi le punem pe site.", size=10.5, after=6)

    heading(doc, "Cum se completează", 2)
    steps = [
        ("Citiți coloana „Textul actual”.", " Este textul de pe site astăzi. Nu îl modificați: "
         "el ne spune despre ce text vorbim."),
        ("Alegeți „Acțiunea” din lista derulantă.", " Păstrează — rămâne așa cum e. "
         "Înlocuiește — scrieți textul nou în ultima coloană. Șterge — elementul dispare "
         "de pe site. Unde ștergerea nu are sens (un titlu, un buton), lista are doar "
         "primele două opțiuni."),
        ("Scrieți textul nou în coloana galbenă.", " Doar acolo. Scrieți-l întreg, așa cum "
         "trebuie să apară, nu doar cuvântul care se schimbă. Pentru texte lungi, "
         "lăsați un rând gol între paragrafe."),
        ("Salvați ca .docx și trimiteți-l înapoi.", " Nu PDF. Dacă lucrați în Google Docs: "
         "Fișier → Descărcați → Microsoft Word. Puteți completa în etape: trimiteți ce "
         "aveți, restul vine într-un al doilea document."),
    ]
    for i, (lead, rest) in enumerate(steps, 1):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.left_indent = Cm(0.6)
        p.paragraph_format.first_line_indent = Cm(-0.6)
        r = p.add_run(f"{i}.  ")
        r.font.size = Pt(10)
        r.bold = True
        r = p.add_run(lead)
        r.font.size = Pt(10)
        r.bold = True
        r = p.add_run(rest)
        r.font.size = Pt(10)

    heading(doc, "Câteva lucruri de știut", 2)
    notes = [
        "Rândurile marcate cu ⚠ au ceva de confirmat sau de completat: o sală nestabilită, "
        "o denumire neconfirmată, o informație istorică neverificată. Acestea au prioritate.",
        "Numerele din prima coloană (de ex. AT-3-11) sunt adresa textului în site. Dacă ne scrieți "
        "separat (pe e-mail, pe telefon), folosiți-le: „la OP-5-06, al doilea paragraf…”.",
        "Un text lăsat pe „Păstrează”, dar cu ceva scris în coloana galbenă, se consideră înlocuit.",
        "Fotografiile nu sunt în acest document. Dacă vreți să schimbați o fotografie, spuneți-ne "
        "separat care și cu ce.",
        "Textul apare uneori în mai multe locuri (de exemplu numele unei opriri, pe cartonaș și pe "
        "pagina ei). Îl schimbăm peste tot deodată; e notat la fiecare caz.",
    ]
    for n in notes:
        p = doc.add_paragraph(style="List Bullet")
        r = p.add_run(n)
        r.font.size = Pt(9.5)
        p.paragraph_format.space_after = Pt(1)

    heading(doc, "Cuprins", 2)
    # Two columns, so the whole cover stays on one page.
    half = (len(PAGES) + 1) // 2
    toc = doc.add_table(rows=half, cols=2)
    toc.autofit = False
    fixed_layout(toc)
    no_borders(toc)
    cell_margins(toc, top=0, bottom=0, left=0, right=0)
    for i, pg in enumerate(PAGES):
        cell = toc.cell(i % half, i // half)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(1)
        r = p.add_run(f"{i + 1}.  {pg['title']}")
        r.font.size = Pt(10)
        r.bold = True
        r = p.add_run(f"   ·   {pg['url']}   ·   {counts[pg['key']]} texte")
        r.font.size = Pt(9.5)
        r.font.color.rgb = MUTED
    set_widths(toc, [PAGE_TEXT_W_CM / 2, PAGE_TEXT_W_CM / 2])


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    with open(INVENTORY, encoding="utf-8") as f:
        inv = json.load(f)
    items = inv["items"]

    doc = Document()
    set_lang(doc)
    normal = doc.styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(10.5)
    normal.element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")

    sec = doc.sections[0]
    sec.orientation = WD_ORIENT.LANDSCAPE
    sec.page_width, sec.page_height = Cm(29.7), Cm(21.0)
    sec.left_margin = sec.right_margin = Cm(1.6)
    sec.top_margin = Cm(1.5)
    sec.bottom_margin = Cm(1.4)
    sec.footer_distance = Cm(0.7)

    fp = sec.footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r = fp.add_run("Blaj 2026 · Textele site-ului · pagina ")
    r.font.size = Pt(8)
    r.font.color.rgb = MUTED
    page_number(fp)
    for r in fp.runs:
        r.font.size = Pt(8)
        r.font.color.rgb = MUTED

    by_page = {}
    for it in items:
        by_page.setdefault(it["page"], []).append(it)
    counts = {k: len(v) for k, v in by_page.items()}

    add_cover(doc, inv, counts)

    for i, pg in enumerate(PAGES, 1):
        doc.add_page_break()
        heading(doc, f"{i}. {pg['title']}", 1)
        ap = para(doc, f"Adresa: {pg['url']}", size=9.5, color=MUTED, after=6)
        ap.paragraph_format.keep_with_next = True
        add_intro_with_figure(doc, pg["intro"], pg["shot"], pg["url"])

        rows = by_page.get(pg["key"], [])
        if isinstance(pg["sections"], list):
            for s in pg["sections"]:
                add_table(doc, [r for r in rows if r["section"] == s])
                para(doc, "", after=4)
        else:
            # One sub-heading and table per workshop / stop, in inventory order.
            seen = []
            for r in rows:
                if r["section"] not in seen:
                    seen.append(r["section"])
            for j, s in enumerate(seen, 1):
                sub = [r for r in rows if r["section"] == s]
                heading(doc, f"{i}.{j} {s}", 2)
                meta = []
                if sub[0].get("slug"):
                    base = "/ateliere/" if pg["key"] == "atelier" else "/blajhunt/"
                    meta.append(f"Adresa: {base}{sub[0]['slug']}")
                if sub[0].get("docNumber"):
                    meta.append(f"Documentul vostru: A{sub[0]['docNumber']}")
                if meta:
                    mp = para(doc, "   ·   ".join(meta), size=9.5, color=MUTED, after=4)
                    mp.paragraph_format.keep_with_next = True
                add_table(doc, sub)
                para(doc, "", after=4)

    doc.save(OUT)
    print(f"{len(items)} rows -> {OUT}  ({os.path.getsize(OUT) // 1024} KB)")


if __name__ == "__main__":
    main()
