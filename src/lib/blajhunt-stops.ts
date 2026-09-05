/**
 * The Blajhunt route, as data. SHARED AND READ-ONLY.
 *
 * Every /blajhunt* page renders this same content so that comparing two of
 * them compares their TREATMENT and nothing else. If you are building a
 * creative variant: import it, do not fork it, do not edit it. Copy in a
 * different order or with different words and the comparison stops meaning
 * anything.
 *
 * ── Where it comes from, and what may not be added ──────────────────────────
 * Sourced from `docs/Regulament.docx`, the participant-facing rules document
 * and the only one whose ten stops add up to the stated 1000 points. `docs/`
 * is gitignored and vercelignored because it also holds the ANSWER KEY to
 * every task in the hunt. Nothing here may be lifted from
 * `docs/Treasurehunt.docx` beyond the NAME of a stop and the KIND of proof a
 * team hands in. The descriptions are written to say what sort of thing you
 * are looking for without saying where it is or what it turns out to be —
 * keep them that way.
 *
 * Three things the two source documents do not agree on (SPEC D3):
 *   - Muzeul Curiei has a fully written task in Treasurehunt.docx but is not
 *     among the ten stops in the regulation.
 *   - Protopopiatul Blaj is among the ten and has no task written anywhere.
 *   - Câmpia Libertății is listed ninth but its task is plainly the finale.
 * The list and order here are the regulation's, unchanged, so the site is
 * wrong in the same way the regulation is rather than in some new way.
 */

export interface BlajhuntStop {
  /** Name of the stop, as it appears in the regulation. */
  title: string;
  /** One line. Enough to know what kind of thing you are looking for. */
  description: string;
  /** Points on offer. */
  points?: number;
  /** What the team hands in. One word each. */
  proofs?: string[];
  /** `sun` marks the finale. Exactly one stop carries it. */
  tone?: "sky" | "sun";
}

export interface BlajhuntTerminal {
  label: string;
  title: string;
  description?: string;
}

export const BLAJHUNT_START: BlajhuntTerminal = {
  label: "Start",
  title: "Curtea Seminarului Teologic",
  description:
    "De aici pleacă toate echipele. Primiți accesul la platformă și instrucțiunile.",
};

export const BLAJHUNT_END: BlajhuntTerminal = {
  label: "Final",
  title: "Clasament și premiere",
  description:
    "Câștigă punctajul cel mai mare. La egalitate decide timpul total, apoi proba de pe Câmpia Libertății.",
};

export const BLAJHUNT_STOPS: BlajhuntStop[] = [
  {
    title: "Catedrala Arhiepiscopală Majoră „Sfânta Treime”",
    description:
      "Prima oprire, la câțiva pași de start. Două detalii ascunse în iconostas: unul se scrie în platformă, celălalt se fotografiază.",
    points: 100,
    proofs: ["Răspuns", "Foto"],
  },
  {
    title: "Liceul „Ștefan Manciulea” și Grădina Botanică",
    description:
      "O dată din secolul al XVIII-lea și un copac plantat la zece ani după Marea Unire. Amândouă vă așteaptă în aceeași curte.",
    points: 100,
    proofs: ["Răspuns", "Foto"],
  },
  {
    title: "Biserica Grecilor",
    description:
      "Un singur nume, într-un cimitir mic. O întrebare scurtă — dar răspunsul nu e la vedere de la poartă.",
    points: 100,
    proofs: ["Răspuns"],
  },
  {
    title: "Castelul Mitropolitan",
    description:
      "Cinci plicuri ascunse în curte și un mesaj care nu are sens până nu sunt găsite toate. Singura probă pe care nu o poate rezolva un singur om.",
    points: 100,
    proofs: ["Căutare", "Răspuns"],
  },
  {
    title: "Casa Maniu",
    description:
      "Găsiți intrarea potrivită — nu e cea la care vă gândiți — și apoi ridicați privirea.",
    points: 100,
    proofs: ["Foto"],
  },
  {
    title: "Magazinul Gostat",
    description:
      "Ceva e ascuns pe lângă magazin, nu înăuntru. Căutați pe drumul care coboară spre piață.",
    points: 100,
    proofs: ["Căutare", "Răspuns"],
  },
  {
    title: "Casa Ioan Suciu",
    description:
      "Înainte de a fi episcop a fost elev. În casă s-a păstrat o hârtie din anii aceia.",
    points: 100,
    proofs: ["Răspuns"],
  },
  {
    title: "Colegiul „Inochentie Micu Clain” și Capela Arhiereilor",
    description:
      "O fotografie de acum aproape o sută de ani. Găsiți locul din care a fost făcută și refaceți-o din același unghi.",
    points: 100,
    proofs: ["Foto"],
  },
  {
    title: "Câmpia Libertății",
    description:
      "Un videoclip de cel mult două minute, cu toată echipa în el, un semn distinctiv inventat de voi și o formulă de încheiere pe care o primiți acolo.",
    points: 100,
    proofs: ["Video"],
    tone: "sun",
  },
  {
    // No task exists for this stop in either source document. The copy is
    // written so it can ship as-is if one is added, and so it says nothing
    // untrue if one is not.
    title: "Protopopiatul Blaj",
    description:
      "Ultima oprire din regulament. Detaliile probei se anunță la start.",
    points: 100,
  },
];

/** The fold's copy, shared so every variant's hero says the same thing. */
export const BLAJHUNT_INTRO = {
  kicker: "Blajhunt · 19 septembrie 2026",
  title: "Crezi că știi Blajul?",
  lead: "Ia-ți gașca și descoperă orașul așa cum nu l-ai mai văzut. Urmează indicii, caută detalii ascunse, descifrează mesaje și rezolvă provocările de pe traseu. De la Catedrală până pe Câmpia Libertății, fiecare oprire vă aduce mai aproape de victorie.",
  cta: "Vezi traseul",
  sectionKicker: "Traseul",
  sectionTitle: "Zece opriri, de la Seminar la Câmpia Libertății",
  sectionLead:
    "Traseul se parcurge în ordine și în echipă. Fiecare oprire are proba ei; probele se rezolvă pe teren, iar dovada se trimite din platformă de către căpitan.",
} as const;

export const BLAJHUNT_STATS = [
  { value: "10", label: "opriri" },
  { value: "1000", label: "puncte" },
  { value: "6", label: "într-o echipă" },
] as const;
