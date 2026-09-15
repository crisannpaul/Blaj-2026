/**
 * The copy inventory: every visitor-facing string on the site, with a stable
 * ID, where it lives in the code, and what the client should know about it.
 *
 *   node --no-warnings scripts/copy/inventory.mjs      -> docs/copy/inventory.json
 *
 * The three data modules are imported directly (Node 24 strips the types), so
 * the workshops and the hunt are read from the same source the site renders.
 * The inline JSX literals — buttons, labels, the landing fold — are listed by
 * hand here, each with the file and the exact string, so the apply step can
 * find them. When one of those literals changes in the code, change it here
 * too: the drift check at the bottom refuses to write the inventory if a
 * literal is no longer in its file.
 *
 * IDs are the contract with the returned document. Never reuse one: a removed
 * item keeps its number out of circulation.
 *
 *   GEN   site-wide metadata          AC    the landing fold (/)
 *   AL    the workshops carousel      AT-n  workshop n (pinned, see AT_ID)
 *   AD    labels on a workshop page   BH    the hunt roadmap (/blajhunt)
 *   OP-n  stop n (regulation order)   OD    labels on a stop page
 *
 * `src` is what the apply step reads:
 *   { kind: "data", file, export, index, field }   a field in a data module
 *   { kind: "literal", file, text }                an inline JSX/TS string
 * An item with several `src` entries is one string written in several places.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const { ATELIERE, HUNT_CARD } = await import("../../src/lib/ateliere.ts");
const {
  BLAJHUNT_STOPS,
  BLAJHUNT_START,
  BLAJHUNT_END,
  BLAJHUNT_INTRO,
  BLAJHUNT_STATS,
} = await import("../../src/lib/blajhunt-stops.ts");
const { BLAJHUNT_PLACES } = await import("../../src/lib/blajhunt-places.ts");

const F = {
  layout: "src/app/layout.tsx",
  home: "src/app/page.tsx",
  letter: "src/components/ui/welcome-letter.tsx",
  ateliere: "src/app/ateliere/page.tsx",
  atelier: "src/app/ateliere/[slug]/page.tsx",
  atelierData: "src/lib/ateliere.ts",
  blajhunt: "src/app/blajhunt/page.tsx",
  oprire: "src/app/blajhunt/[slug]/page.tsx",
  trail: "src/app/blajhunt/trail-swipe.tsx",
  stops: "src/lib/blajhunt-stops.ts",
  places: "src/lib/blajhunt-places.ts",
};

const items = [];
const lit = (file, text) => ({ kind: "literal", file, text });
const data = (file, exp, index, field) => ({
  kind: "data",
  file,
  export: exp,
  index,
  field,
});

/** One row. `current` is what the visitor reads; paragraphs joined by "\n\n". */
function add(id, o) {
  items.push({ id, deletable: false, note: "", ...o });
}

const pad2 = (n) => String(n).padStart(2, "0");

// ── Site-wide ───────────────────────────────────────────────────────────────
const SEC_GEN = {
  page: "gen",
  section: "Titlul din browser și previzualizarea la distribuire",
};
add("GEN-01", {
  ...SEC_GEN,
  element:
    "Titlul paginii principale (tab-ul browserului, rezultatul Google, previzualizarea pe WhatsApp/Facebook)",
  current: "Întâlnirea Tineretului Greco-Catolic · Blaj 2026",
  src: lit(F.layout, "Întâlnirea Tineretului Greco-Catolic · Blaj 2026"),
  note: "Apare de două ori în cod (titlu + Open Graph); se schimbă împreună. Celelalte pagini primesc automat sufixul « · Blaj 2026 ».",
});
add("GEN-02", {
  ...SEC_GEN,
  element:
    "Descrierea site-ului (sub titlu, în rezultatul Google și în previzualizarea linkului)",
  current: "Întâlnirea tinerilor greco-catolici din Transilvania. Blaj, 2026.",
  src: lit(
    F.layout,
    "Întâlnirea tinerilor greco-catolici din Transilvania. Blaj, 2026.",
  ),
  note: "Apare de două ori în cod; se schimbă împreună. Ideal sub 160 de caractere.",
});

// ── Landing ─────────────────────────────────────────────────────────────────
const SEC_AC = { page: "acasa", section: "Pagina principală" };
add("AC-01", {
  ...SEC_AC,
  element: "Supratitlu (rândul mic de deasupra titlului)",
  current: "Întâlnirea Intereparhială a Tinerilor",
  src: lit(F.home, "Întâlnirea Intereparhială a Tinerilor"),
  deletable: true,
  note: "⚠ Denumirea oficială nu a fost confirmată: «Intereparhială» sau «Arhieparhială»? Alegeți forma corectă.",
});
add("AC-02", {
  ...SEC_AC,
  element: "Titlul mare",
  current: "Blaj 2026",
  // The source keeps the two words together with a no-break space.
  src: lit(F.home, 'title: "Blaj 2026"'),
});
add("AC-03", {
  ...SEC_AC,
  element: "Data și locul (rândul cu majuscule mici, sub titlu)",
  current: "19 septembrie 2026 · Blaj",
  // A no-break space after "19", so the line never wraps into "19 / septembrie".
  src: lit(F.home, "19 septembrie 2026 · Blaj"),
  deletable: true,
});
add("AC-04", {
  ...SEC_AC,
  element: "Textul de prezentare (paragraful de sub dată)",
  current:
    "La invitația Preafericitului Părinte Claudiu, tinerii din Arhieparhia de Alba Iulia și Făgăraș și din Eparhia de Cluj-Gherla petrec o zi împreună în Mica Romă.",
  src: lit(
    F.home,
    '"La invitația Preafericitului Părinte Claudiu, tinerii din Arhieparhia " +\n    "de Alba Iulia și Făgăraș și din Eparhia de Cluj-Gherla petrec o zi " +\n    "împreună în Mica Romă."',
  ),
  deletable: true,
  note: "Prima propoziție a scrisorii de bun venit; restul scrisorii este cardul de mai jos (AC-07…AC-13). Spațiul e limitat: pe telefon încap circa 220 de caractere (4–5 rânduri). Un text mai lung împinge titlul în afara ecranului.",
});
add("AC-05", {
  ...SEC_AC,
  element: "Eticheta primului panou (duce la lista de ateliere)",
  current: "Ateliere",
  src: lit(F.home, 'label: "Ateliere"'),
  note: "Un singur cuvânt: literele se animează una câte una.",
});
add("AC-06", {
  ...SEC_AC,
  element: "Eticheta celui de-al doilea panou (duce la traseul Blajhunt)",
  current: "Blajhunt",
  src: lit(F.home, 'label: "Blajhunt"'),
  note: "Un singur cuvânt: literele se animează una câte una.",
});

// The welcome letter — the rest of what came back as AC-04 on 14 Sep, as a
// card of its own on the landing page (SPEC D15). Verbatim from the returned
// document, with two edits the user asked for: one phrase is a link to the
// workshops, and the closing "<3" is a heart icon. Pinned by exact text in
// welcome-letter.tsx; the multi-line paragraphs are the file's own
// concatenations, eight spaces in.
const SEC_SC = {
  page: "acasa",
  section: "Scrisoarea de bun venit (cardul de lângă titlu / de sub panouri)",
};
add("AC-07", {
  ...SEC_SC,
  element: "Formula de adresare (titlul cardului)",
  current: "Dragi tineri,",
  src: lit(F.letter, 'salutation: "Dragi tineri,"'),
});
add("AC-08", {
  ...SEC_SC,
  element: "Scrisoarea — paragraful 1",
  current: "Sunteți pregătiți să petrecem împreună o zi de neuitat?",
  src: lit(F.letter, '"Sunteți pregătiți să petrecem împreună o zi de neuitat?"'),
  deletable: true,
});
add("AC-09", {
  ...SEC_SC,
  element: "Scrisoarea — paragraful 2",
  current:
    "Vă așteptăm cu voie bună și cu un program în care se împletesc rugăciunea, bucuria întâlnirii, prieteniile noi și dorința de a descoperi împreună un oraș cu o istorie și o spiritualitate aparte.",
  src: lit(
    F.letter,
    '"Vă așteptăm cu voie bună și cu un program în care se împletesc " +\n        "rugăciunea, bucuria întâlnirii, prieteniile noi și dorința de a " +\n        "descoperi împreună un oraș cu o istorie și o spiritualitate aparte."',
  ),
  deletable: true,
});
add("AC-10", {
  ...SEC_SC,
  element: "Scrisoarea — paragraful 3",
  current:
    "Nerăbdători să vă întâlnim, venim în întâmpinarea voastră și prin intermediul acestei pagini, unde puteți descoperi atelierele pe care le-am pregătit special pentru voi.",
  src: [
    lit(
      F.letter,
      '"Nerăbdători să vă întâlnim, venim în întâmpinarea voastră și prin " +\n        "intermediul acestei pagini, unde puteți descoperi "',
    ),
    lit(F.letter, 'text: "atelierele pe care le-am pregătit special pentru voi"'),
  ],
  deletable: true,
  note: "«atelierele pe care le-am pregătit special pentru voi» este un link către lista atelierelor.",
});
add("AC-11", {
  ...SEC_SC,
  element: "Scrisoarea — paragraful 4",
  current:
    "Mai mult decât atât, aveți posibilitatea să vă înscrieți la atelierul sau atelierele care vă stârnesc interesul și pe care le considerați potrivite pentru voi.",
  src: lit(
    F.letter,
    '"Mai mult decât atât, aveți posibilitatea să vă înscrieți la atelierul " +\n        "sau atelierele care vă stârnesc interesul și pe care le considerați " +\n        "potrivite pentru voi."',
  ),
  deletable: true,
});
add("AC-12", {
  ...SEC_SC,
  element: "Scrisoarea — paragraful 5 (încheierea)",
  current:
    "Haideți să ne întâlnim, să ne bucurăm împreună și să facem din această zi o experiență de neuitat!",
  src: lit(
    F.letter,
    '"Haideți să ne întâlnim, să ne bucurăm împreună și să facem din " +\n        "această zi o experiență de neuitat!"',
  ),
  deletable: true,
});
add("AC-13", {
  ...SEC_SC,
  element: "Semnătura (sub linie, cu inima în dreapta)",
  current:
    "Biroul pentru Pastorația Tinerilor și a Copiilor al Arhieparhiei de Alba Iulia și Făgăraș",
  src: [
    lit(F.letter, '"Biroul pentru Pastorația Tinerilor și a Copiilor"'),
    lit(F.letter, '"al Arhieparhiei de Alba Iulia și Făgăraș"'),
  ],
  note: "Inima «<3» din document este afișată ca pictogramă, în dreapta semnăturii.",
});

// ── Workshops carousel ──────────────────────────────────────────────────────
const SEC_AL = { page: "ateliere", section: "Lista atelierelor (caruselul)" };
add("AL-01", {
  ...SEC_AL,
  element:
    "Marca din colțul din dreapta sus, pe carusel și pe fiecare pagină de atelier",
  current: "Blaj 2026",
  src: [lit(F.ateliere, 'brand="Blaj 2026"'), lit(F.atelier, "Blaj&nbsp;2026")],
  deletable: true,
});
add("AL-02", {
  ...SEC_AL,
  element: "Linkul de întoarcere din stânga sus (← …)",
  current: "Acasă",
  src: lit(F.ateliere, 'backLabel="Acasă"'),
});
add("AL-03", {
  ...SEC_AL,
  element:
    "Prefixul numerotării: pe carusel («Atelier 01»), ca supratitlu pe pagina atelierului și pe butoanele «atelierul anterior / următor»",
  current: "Atelier",
  src: [
    lit(F.ateliere, "`Atelier ${atelierNo(a)}`"),
    lit(F.atelier, "Atelier {no}"),
    lit(F.atelier, "&larr; Atelier {atelierNo(prev)}"),
    lit(F.atelier, "Atelier {atelierNo(next)} &rarr;"),
  ],
  note: "Numerotarea site-ului este 01–10, în ordinea listei. Numerele din documentele voastre (A2–A11) NU se afișează.",
});
add("AL-04", {
  ...SEC_AL,
  element:
    "Unitățile de pe carusel și din fișa atelierului: durata și locurile",
  current: "45 min\n\n60 locuri",
  src: [
    lit(F.ateliere, "`${a.durationMin} min`, `${a.seats} locuri`"),
    lit(F.atelier, "{a.durationMin} min"),
    lit(F.atelier, "· {s.seats} locuri"),
  ],
  note: "Doar cuvintele «min» și «locuri» se pot schimba aici; cifrele se completează la fiecare atelier.",
});
add("AL-05", {
  ...SEC_AL,
  element: "Butonul de pe carusel (deschide pagina atelierului)",
  current: "Detalii",
  src: lit(F.ateliere, 'ctaLabel: "Detalii"'),
});
add("AL-06", {
  ...SEC_AL,
  element: "Titlul paginii în browser (devine «Ateliere · Blaj 2026»)",
  current: "Ateliere",
  src: lit(F.ateliere, 'metadata = { title: "Ateliere" }'),
});

// ── The Blajhunt's card on the carousel (Atelier 01) ────────────────────────
// Its copy lives in HUNT_CARD rather than in ATELIERE — the hunt is not one of
// the organizers' workshop documents — so the AT-n loop below never sees it.
// These three rows are how it reaches the copy round at all.
add("AL-07", {
  ...SEC_AL,
  element: "Titlul primului card, al Blajhunt-ului (Atelier 01)",
  current: HUNT_CARD.cardTitle,
  src: data(F.atelierData, "HUNT_CARD", null, "cardTitle"),
  note: "Blajhunt-ul apare pe carusel ca Atelier 01; butonul lui duce la pagina /blajhunt, nu la o fișă de atelier.",
});
add("AL-08", {
  ...SEC_AL,
  element: "Rezumatul de sub titlu, pe cardul Blajhunt",
  current: HUNT_CARD.hook,
  src: data(F.atelierData, "HUNT_CARD", null, "hook"),
  note: "Recomandat sub 200 de caractere: pe carusel are loc pentru două propoziții.",
});
add("AL-09", {
  ...SEC_AL,
  element: "Butonul de pe cardul Blajhunt (deschide pagina traseului)",
  current: HUNT_CARD.ctaLabel,
  src: data(F.atelierData, "HUNT_CARD", null, "ctaLabel"),
  note: "Diferit intenționat de «Detalii» al celorlalte: acest buton duce în altă parte a site-ului.",
});

/**
 * AT-n is PINNED TO THE SLUG, not to the position in ATELIERE.
 *
 * The first round went out on 13 Sep with AT-1…AT-7 numbered by position, and
 * the organizers returned a document keyed to those IDs. On 14 Sep three more
 * workshops arrived and A8 inserted itself at site position 07, pushing
 * `voluntari-in-misiune` from 7 to 8. Numbering by position would have made
 * AT-7 mean a different workshop than it does in the document on their desk —
 * exactly the reuse the ID contract at the top of this file forbids, and
 * silently, because every row would still look well-formed.
 *
 * So the seven already sent keep their numbers and the new three take 8, 9 and
 * 10. The ID is therefore NO LONGER the site's printed number, which is why
 * the section heading below prints the site number on its own.
 *
 * Adding a workshop: append it here with the next free number, wherever it
 * lands in the list. Never renumber an existing line.
 */
const AT_ID = {
  "masina-timpului": 1,
  "episcopul-tinerilor": 2,
  "curajul-de-a-ti-urma-inima": 3,
  iconar: 4,
  mozaicar: 5,
  "curajul-de-a-ti-conduce-viata": 6,
  "voluntari-in-misiune": 7,
  "pescari-de-oameni": 8,
  "inima-misiunilor": 9,
  "salvator-de-vieti": 10,
  "escape-mode": 11,
};

// ── Each workshop ───────────────────────────────────────────────────────────
ATELIERE.forEach((a, i) => {
  const n = AT_ID[a.slug];
  if (!n) {
    throw new Error(
      `inventory: no pinned AT id for "${a.slug}". Add it to AT_ID with the ` +
        `next free number — do not renumber the existing entries.`,
    );
  }
  const p = `AT-${n}`;
  const SEC = {
    // The heading is how an organizer finds the workshop on the page, so it
    // must print what the PAGE prints. That was `i + 1` until the Blajhunt
    // took Atelier 01 on 14 Sep and pushed every workshop down one — after
    // which this said "Atelier 01 — Cu mașina timpului" about a card the site
    // labels 02. `a.number` is the site's number and the organizers' both, and
    // cannot drift from either. NOT the same as the AT-n id above, which is
    // pinned to the slug and deliberately no longer tracks the numbering.
    page: "atelier",
    section: `Atelier ${pad2(a.number)} — ${a.title}`,
    slug: a.slug,
    docNumber: a.number,
  };
  const d = (field) => data(F.atelierData, "ATELIERE", i, field);
  add(`${p}-01`, {
    ...SEC,
    element: "Titlul",
    current: a.title,
    src: d("title"),
    note: "Pe carusel titlul apare pe 2–3 rânduri scurte; împărțirea se reface automat.",
  });
  add(`${p}-02`, {
    ...SEC,
    element: "Subtitlul (rândul de sub titlu, în fișă)",
    current: a.tagline ?? "",
    src: d("tagline"),
    deletable: true,
    note: a.tagline
      ? ""
      : "Momentan lipsește (documentul nu are un al doilea rând de titlu). Scrieți unul dacă doriți.",
  });
  add(`${p}-03`, {
    ...SEC,
    element:
      "Rezumatul (1–2 propoziții: apare pe carusel sub titlu, în fișă înaintea descrierii și în previzualizarea linkului)",
    current: a.hook,
    src: d("hook"),
    deletable: true,
    note: "Recomandat sub 200 de caractere: pe carusel are loc pentru două propoziții.",
  });
  add(`${p}-04`, {
    ...SEC,
    element: "Rolul celui care conduce atelierul (eticheta din fișă)",
    current: a.leadLabel ?? "Coordonator",
    src: d("leadLabel"),
    note: "Pe pagina atelierului cuvântul «atelier» din etichetă se omite automat («Coordonator atelier» → «Coordonator»).",
  });
  add(`${p}-05`, {
    ...SEC,
    element: "Cine conduce atelierul (numele, câte unul pe rând)",
    current: a.leads.join("\n"),
    src: d("leads"),
    deletable: true,
  });
  add(`${p}-06`, {
    ...SEC,
    element: "Programul (grupele, orele și locurile pe grupă)",
    current: a.sessions
      .map((s) =>
        [s.label, s.time, s.seats ? `${s.seats} locuri` : ""]
          .filter(Boolean)
          .join(" · "),
      )
      .join("\n"),
    src: d("sessions"),
    note: "Un rând pe grupă, în formatul «Grupa · ora · locuri».",
  });
  add(`${p}-07`, {
    ...SEC,
    element: "Durata (minute)",
    current: `${a.durationMin} min`,
    src: d("durationMin"),
  });
  add(`${p}-08`, {
    ...SEC,
    element: "Numărul total de locuri",
    current: String(a.seats),
    src: d("seats"),
  });
  add(`${p}-09`, {
    ...SEC,
    element: "Locul de desfășurare (așa cum apare în fișă)",
    current: a.location ?? "",
    src: d("location"),
    deletable: true,
    note: !a.location
      ? "⚠ Documentul nu dă nicio locație; pe site apare «Locația se anunță.» Completați."
      : /se anunță/.test(a.location)
        ? "⚠ Sala apare ca «Sala ....» în document. Completați sala."
        : "",
  });
  add(`${p}-10`, {
    ...SEC,
    element:
      "Căutarea din butonul «Deschide în Maps» (ce caută Google Maps când se apasă butonul)",
    current: a.mapsQuery ?? "",
    src: d("mapsQuery"),
    deletable: true,
    note: "Momentan e o căutare după nume, nu un punct exact. Dacă aveți coordonate GPS (de ex. 46.1755, 23.9166) sau un link Google Maps, scrieți-le aici și butonul va duce exact acolo.",
  });
  add(`${p}-11`, {
    ...SEC,
    element: "Descrierea completă (paragraf cu paragraf)",
    current: a.body.join("\n\n"),
    src: d("body"),
    note: "Un rând gol între paragrafe. Textul e preluat din documentul trimis pe 8 septembrie.",
  });
  add(`${p}-12`, {
    ...SEC,
    element: "Etichetele (#hashtag-urile de la finalul fișei)",
    current: a.tags.map((t) => `#${t}`).join(" "),
    src: d("tags"),
    deletable: true,
    note: a.tags.length
      ? ""
      : "Documentul acestui atelier nu are hashtag-uri; se pot adăuga.",
  });
});

// ── Workshop page labels ────────────────────────────────────────────────────
const SEC_AD = {
  page: "atelier",
  section: "Etichetele fixe de pe pagina unui atelier",
};
add("AD-01", {
  ...SEC_AD,
  element: "Linkul de întoarcere din stânga sus (← …), spre carusel",
  current: "Ateliere",
  src: lit(F.atelier, '<span aria-hidden="true">&larr;</span> Ateliere'),
});
add("AD-02", {
  ...SEC_AD,
  element: "Eticheta rândului cu programul",
  current: "Când",
  src: lit(F.atelier, '<Fact label="Când">'),
});
add("AD-03", {
  ...SEC_AD,
  element: "Eticheta rândului cu durata",
  current: "Durată",
  src: lit(F.atelier, '<Fact label="Durată">'),
});
add("AD-04", {
  ...SEC_AD,
  element: "Eticheta rândului cu locurile",
  current: "Locuri",
  src: lit(F.atelier, '<Fact label="Locuri">'),
});
add("AD-05", {
  ...SEC_AD,
  element: "Eticheta rândului cu locația",
  current: "Unde",
  src: lit(F.atelier, '<Fact label="Unde">'),
});
add("AD-06", {
  ...SEC_AD,
  element:
    "Linkul/butonul spre Google Maps (pe fișa atelierului, pe traseul Blajhunt și pe pagina fiecărei opriri)",
  current: "Deschide în Maps",
  src: [
    lit(F.atelier, "Deschide în Maps"),
    lit(F.oprire, "Deschide în Maps"),
    lit(F.trail, "Deschide în Maps"),
  ],
});
add("AD-07", {
  ...SEC_AD,
  element: "Textul afișat când un atelier nu are încă locație",
  current: "Locația se anunță.",
  src: lit(F.atelier, "Locația se anunță."),
});
add("AD-08", {
  ...SEC_AD,
  element: "Butonul de înscriere (inactiv până se deschid înscrierile)",
  current: "Înscrieri în curând",
  src: lit(F.atelier, "Înscrieri în curând"),
});
add("AD-09", {
  ...SEC_AD,
  element: "Nota de sub butonul de înscriere",
  current:
    "Înscrierile se deschid înainte de întâlnire, aici, cu codul de participant.",
  src: lit(
    F.atelier,
    "Înscrierile se deschid înainte de întâlnire, aici, cu codul de\n                participant.",
  ),
  deletable: true,
});
add("AD-10", {
  ...SEC_AD,
  element: "Titlul benzii cu fotografii suplimentare",
  current: "Fotografii",
  src: lit(F.atelier, "Fotografii\n              </h2>"),
});
add("AD-11", {
  ...SEC_AD,
  element: "Linkul de la finalul paginii, spre carusel",
  current: "Toate atelierele",
  src: lit(F.atelier, "Toate atelierele"),
});

// ── Hunt roadmap ────────────────────────────────────────────────────────────
const SEC_BH = { page: "blajhunt", section: "Traseul Blajhunt (pagina /blajhunt)" };
const intro = (field) => data(F.stops, "BLAJHUNT_INTRO", null, field);
add("BH-01", {
  ...SEC_BH,
  element: "Linkul de întoarcere din stânga sus (← …)",
  current: "Acasă",
  src: lit(F.blajhunt, '<span aria-hidden="true">&larr;</span> Acasă'),
});
add("BH-02", {
  ...SEC_BH,
  element: "Supratitlul (rândul mic de deasupra titlului)",
  current: BLAJHUNT_INTRO.kicker,
  src: intro("kicker"),
  deletable: true,
});
add("BH-03", {
  ...SEC_BH,
  element: "Titlul mare",
  current: BLAJHUNT_INTRO.title,
  src: intro("title"),
});
add("BH-04", {
  ...SEC_BH,
  element: "Textul de prezentare",
  current: BLAJHUNT_INTRO.lead,
  src: intro("lead"),
  deletable: true,
});
add("BH-05", {
  ...SEC_BH,
  element: "Butonul principal (derulează la traseu)",
  current: BLAJHUNT_INTRO.cta,
  src: intro("cta"),
});
BLAJHUNT_STATS.forEach((s, i) => {
  add(`BH-${pad2(6 + i)}`, {
    ...SEC_BH,
    element: `Cifra ${i + 1} din cele trei de sub prezentare (cifra și eticheta ei)`,
    current: `${s.value} ${s.label}`,
    src: data(F.stops, "BLAJHUNT_STATS", i, "*"),
    deletable: true,
    note:
      i === 2 ? "⚠ Mărimea echipei (6) e preluată din Regulament; confirmați." : "",
  });
});
add("BH-09", {
  ...SEC_BH,
  element: "Supratitlul secțiunii cu traseul",
  current: BLAJHUNT_INTRO.sectionKicker,
  src: intro("sectionKicker"),
  deletable: true,
});
add("BH-10", {
  ...SEC_BH,
  element: "Titlul secțiunii cu traseul",
  current: BLAJHUNT_INTRO.sectionTitle,
  src: intro("sectionTitle"),
});
add("BH-11", {
  ...SEC_BH,
  element: "Textul de sub titlul secțiunii",
  current: BLAJHUNT_INTRO.sectionLead,
  src: intro("sectionLead"),
  deletable: true,
});
add("BH-12", {
  ...SEC_BH,
  element: "Primul cartonaș al traseului — eticheta",
  current: BLAJHUNT_START.label,
  src: data(F.stops, "BLAJHUNT_START", null, "label"),
});
add("BH-13", {
  ...SEC_BH,
  element: "Primul cartonaș al traseului — titlul",
  current: BLAJHUNT_START.title,
  src: data(F.stops, "BLAJHUNT_START", null, "title"),
});
add("BH-14", {
  ...SEC_BH,
  element: "Primul cartonaș al traseului — textul",
  current: BLAJHUNT_START.description ?? "",
  src: data(F.stops, "BLAJHUNT_START", null, "description"),
  deletable: true,
});
add("BH-15", {
  ...SEC_BH,
  element: "Ultimul cartonaș al traseului — eticheta",
  current: BLAJHUNT_END.label,
  src: data(F.stops, "BLAJHUNT_END", null, "label"),
});
add("BH-16", {
  ...SEC_BH,
  element: "Ultimul cartonaș al traseului — titlul",
  current: BLAJHUNT_END.title,
  src: data(F.stops, "BLAJHUNT_END", null, "title"),
});
add("BH-17", {
  ...SEC_BH,
  element: "Ultimul cartonaș al traseului — textul",
  current: BLAJHUNT_END.description ?? "",
  src: data(F.stops, "BLAJHUNT_END", null, "description"),
  deletable: true,
  note: "⚠ Regula de departajare e preluată din Regulament; confirmați.",
});
add("BH-18", {
  ...SEC_BH,
  element: "Titlul secțiunii de la finalul paginii",
  current: "Urmează",
  src: lit(F.blajhunt, '<h2 className="text-h3">Urmează</h2>'),
});
add("BH-19", {
  ...SEC_BH,
  element: "Textul secțiunii de la finalul paginii",
  current:
    "Regulamentul complet, probele și înscrierea echipelor se deschid înainte de întâlnire. Până atunci, aruncă un ochi pe ateliere.",
  src: lit(
    F.blajhunt,
    "Regulamentul complet, probele și înscrierea echipelor se deschid\n              înainte de întâlnire. Până atunci, aruncă un ochi pe ateliere.",
  ),
  deletable: true,
});
add("BH-20", {
  ...SEC_BH,
  element: "Butonul spre ateliere, la finalul paginii",
  current: "Atelierele întâlnirii",
  src: lit(F.blajhunt, ">\n                Atelierele întâlnirii\n              </Link>"),
});
add("BH-21", {
  ...SEC_BH,
  element: "Linkul spre pagina principală, la finalul paginii",
  current: "Acasă",
  src: lit(F.blajhunt, ">\n                Acasă\n              </Link>"),
});
add("BH-22", {
  ...SEC_BH,
  element: "Titlul paginii în browser (devine «Blajhunt · Blaj 2026»)",
  current: "Blajhunt",
  src: lit(F.blajhunt, 'title: "Blajhunt"'),
});
add("BH-23", {
  ...SEC_BH,
  element: "Descrierea paginii (rezultatul Google, previzualizarea linkului)",
  current:
    "Traseul Blajhunt: zece opriri prin Blaj, de la Seminarul Teologic la Câmpia Libertății.",
  src: lit(
    F.blajhunt,
    "Traseul Blajhunt: zece opriri prin Blaj, de la Seminarul Teologic la Câmpia Libertății.",
  ),
});

// ── Each stop ───────────────────────────────────────────────────────────────
BLAJHUNT_STOPS.forEach((s, i) => {
  const n = i + 1;
  const p = `OP-${n}`;
  const pi = BLAJHUNT_PLACES.findIndex((x) => x.title === s.title);
  const place = BLAJHUNT_PLACES[pi];
  if (!place) throw new Error(`No place for stop "${s.title}"`);
  const SEC = {
    page: "oprire",
    section: `Oprirea ${pad2(n)} — ${s.title}`,
    slug: place.slug,
  };
  const ds = (field) => data(F.stops, "BLAJHUNT_STOPS", i, field);
  const dp = (field) => data(F.places, "BLAJHUNT_PLACES", pi, field);
  add(`${p}-01`, {
    ...SEC,
    element: "Numele opririi (pe cartonaș și ca titlu al paginii ei)",
    current: s.title,
    src: [ds("title"), dp("title")],
    note: "Este scris identic în două locuri din cod; se schimbă împreună.",
  });
  add(`${p}-02`, {
    ...SEC,
    element:
      "Rândul de sub nume, pe cartonaș și pe pagina opririi (o propoziție care așază locul, fără să dea nimic de gol)",
    current: place.standfirst,
    src: dp("standfirst"),
    deletable: true,
  });
  add(`${p}-03`, {
    ...SEC,
    element:
      "Descrierea probei de pe cartonaș (ce fel de lucru se caută — fără indicii și fără răspuns)",
    current: s.description,
    src: ds("description"),
    deletable: true,
    note:
      n === 10
        ? "⚠ În documente nu există nicio probă scrisă pentru această oprire."
        : "Nu scrieți aici nimic din răspuns sau din locul exact: pagina e publică.",
  });
  add(`${p}-04`, {
    ...SEC,
    element: "Punctajul opririi",
    current: s.points != null ? String(s.points) : "",
    src: ds("points"),
  });
  add(`${p}-05`, {
    ...SEC,
    element: "Ce predă echipa la această oprire (etichetele de pe cartonaș)",
    current: (s.proofs ?? []).join(", "),
    src: ds("proofs"),
    deletable: true,
    note: "Câte un cuvânt, despărțite prin virgulă: Răspuns, Foto, Video, Căutare.",
  });
  add(`${p}-06`, {
    ...SEC,
    element:
      "Istoria locului — textul de pe pagina opririi (paragraf cu paragraf)",
    current: place.body.join("\n\n"),
    src: dp("body"),
    note:
      place.confidence === "check"
        ? `⚠ DE VERIFICAT — text scris din cunoștințe generale, neverificat de nimeni la fața locului. Concret: ${place.verify}`
        : "Informații istorice publice, bine documentate. Recomandăm totuși o citire atentă.",
  });
  add(`${p}-07`, {
    ...SEC,
    element: "Căutarea din butonul «Deschide în Maps»",
    current: place.mapsQuery,
    src: dp("mapsQuery"),
    deletable: true,
    note: "Momentan e o căutare după nume, nu un punct exact. Dacă aveți coordonate GPS sau un link Google Maps, scrieți-le aici.",
  });
});

// ── Stop page labels ────────────────────────────────────────────────────────
const SEC_OD = {
  page: "oprire",
  section: "Etichetele fixe de pe pagina unei opriri",
};
add("OD-01", {
  ...SEC_OD,
  element: "Linkul de întoarcere din stânga sus (← …), spre traseu",
  current: "Traseul",
  src: lit(F.oprire, '<span aria-hidden="true">&larr;</span> Traseul'),
});
add("OD-02", {
  ...SEC_OD,
  element: "Prefixul numerotării de pe pagina opririi («Oprirea 01»)",
  current: "Oprirea",
  src: lit(F.oprire, 'Oprirea {String(number).padStart(2, "0")}'),
});
add("OD-03", {
  ...SEC_OD,
  element: "Prescurtarea punctelor, pe cartonaș și pe pagină («100 p»)",
  current: "p",
  src: [lit(F.oprire, "{stop.points}&nbsp;p"), lit(F.trail, "&nbsp;p")],
});
add("OD-04", {
  ...SEC_OD,
  element: "Titlul listei cu ce se predă la oprire",
  current: "Ce predați aici",
  src: lit(F.oprire, "Ce predați aici"),
});
add("OD-05", {
  ...SEC_OD,
  element: "Nota de sub listă",
  current: "Proba se anunță pe teren. Pagina asta nu o conține.",
  src: lit(F.oprire, "Proba se anunță pe teren. Pagina asta nu o conține."),
  deletable: true,
});
add("OD-06", {
  ...SEC_OD,
  element: "Eticheta butonului spre oprirea anterioară",
  current: "Înainte",
  src: lit(F.oprire, "&larr; Înainte"),
});
add("OD-07", {
  ...SEC_OD,
  element: "Eticheta butonului spre oprirea următoare",
  current: "După",
  src: lit(F.oprire, "După &rarr;"),
});

// ── Drift check: every literal must still be in its file ────────────────────
const cache = new Map();
/**
 * Line endings are normalised before comparing, and that is not cosmetic: this
 * working tree is mixed, and `src/app/page.tsx` is CRLF. Every MULTI-LINE
 * literal listed against a CRLF file — AC-04's four-part concatenation, say —
 * is written here with "\n" and can therefore never match the raw bytes, so
 * the check reported drift that was not there and blocked the build until
 * someone noticed the file's line endings. Comparing text to text, rather than
 * text to whatever the checkout happened to write, is the fix.
 */
const read = (f) => {
  if (!cache.has(f)) cache.set(f, readFileSync(f, "utf8").replace(/\r\n/g, "\n"));
  return cache.get(f);
};
const norm = (t) => t.replace(/\r\n/g, "\n");
const drift = [];
for (const it of items) {
  for (const s of [].concat(it.src)) {
    if (s.kind === "literal" && !read(s.file).includes(norm(s.text))) {
      drift.push(`${it.id}: "${s.text.slice(0, 50)}" not found in ${s.file}`);
    }
  }
}
if (drift.length) {
  console.error(
    "Inventory drift — the code no longer contains these literals:\n  " +
      drift.join("\n  "),
  );
  process.exit(1);
}
const ids = new Set();
for (const it of items) {
  if (ids.has(it.id)) throw new Error(`Duplicate id ${it.id}`);
  ids.add(it.id);
}

mkdirSync("docs/copy", { recursive: true });
writeFileSync(
  "docs/copy/inventory.json",
  JSON.stringify({ generated: new Date().toISOString(), items }, null, 2),
);
console.log(`${items.length} items -> docs/copy/inventory.json`);
