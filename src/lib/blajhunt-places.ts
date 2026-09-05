/**
 * Editorial context for the ten Blajhunt stops — one entry per stop, rendered
 * at `/blajhunt/[slug]`.
 *
 * ── The hard rule: this file may not help anyone win ────────────────────────
 * `docs/Treasurehunt.docx` is the ANSWER KEY and `docs/` is gitignored and
 * vercelignored for that reason. **Nothing here comes from it.** These entries
 * are about the PLACE — who built it, who lived in it, what happened there —
 * and never about the probă: not the task, not the hint, not the thing you are
 * meant to find, not where in the building to look. A team that reads all ten
 * of these pages should be better company at dinner and no closer to a point.
 *
 * That line is easy to cross by accident. "Casa Maniu has a balcony" is
 * context; "look at the balcony" is the answer to stop 05. When in doubt, say
 * less.
 *
 * ── The other hard rule: `confidence` is not decoration ─────────────────────
 * These are real buildings in a real town and this text was written from
 * general historical knowledge, not from a source in this repo and not from
 * anyone who has stood in front of them. Every entry is therefore marked:
 *
 *   "solid" — well-documented public history that any reference will confirm
 *             (the 1848 assembly, Inochentie Micu-Klein moving the see here,
 *             the 2019 beatification). Safe to print.
 *   "check" — plausible and probably right, but it asserts something specific
 *             about a specific building that nobody in this project has
 *             verified. `verify` says exactly what to confirm.
 *
 * **Everything marked "check" needs an organizer to confirm it before the site
 * goes public.** SPEC section 7 tracks this as an open content dependency. Do
 * not quietly promote an entry to "solid" — promote it when someone has
 * actually checked, and say who.
 *
 * ── Maps ────────────────────────────────────────────────────────────────────
 * `mapsQuery` is a SEARCH string, not a coordinate. Nobody here has surveyed
 * these buildings, and a wrong pin sends a team across town on the day; a
 * search for the name lands them on whatever Google actually knows. If real
 * coordinates ever arrive, they belong here and the link shape changes once.
 */

export interface BlajhuntPlace {
  /** URL segment. Stable — it is a link people may share. */
  slug: string;
  /** Must match the `title` of the matching entry in BLAJHUNT_STOPS. */
  title: string;
  /** One line under the heading. Sets the scene, gives nothing away. */
  standfirst: string;
  /** Two to four short paragraphs. Context only — never the probă. */
  body: string[];
  /** What to search for. Always ends in Blaj so the search cannot wander. */
  mapsQuery: string;
  /** See the header. "check" means an organizer must confirm before launch. */
  confidence: "solid" | "check";
  /** For "check": precisely what needs confirming, so it can be checked fast. */
  verify?: string;
}

export const BLAJHUNT_PLACES: readonly BlajhuntPlace[] = [
  {
    slug: "catedrala",
    title: "Catedrala Arhiepiscopală Majoră „Sfânta Treime”",
    standfirst:
      "Biserica-mamă a Bisericii Române Unite cu Roma și motivul pentru care Blajul a devenit Blaj.",
    body: [
      "În 1737 episcopul Inochentie Micu-Klein a mutat la Blaj scaunul episcopal greco-catolic de la Făgăraș. Decizia a schimbat orașul: în jurul reședinței au apărut școlile, tipografia și biblioteca care aveau să facă din Blaj un centru cultural cu mult mai mare decât dimensiunea lui.",
      "Catedrala a fost ridicată în deceniile care au urmat, în stil baroc, pe locul unei mănăstiri mai vechi. Este biserica-mamă a Bisericii Române Unite cu Roma, Greco-Catolică, iar din 2005, când Biserica a fost ridicată la rang de Arhiepiscopie Majoră, poartă titlul de catedrală arhiepiscopală majoră.",
      "Mihai Eminescu a ajuns la Blaj în 1866, pe jos, adolescent. Orașului i-a rămas de atunci numele pe care i l-a dat el: Mica Romă.",
    ],
    mapsQuery: "Catedrala Sfânta Treime, Blaj",
    confidence: "solid",
  },
  {
    slug: "liceul-si-gradina-botanica",
    title: "Liceul „Ștefan Manciulea” și Grădina Botanică",
    standfirst: "Școlile Blajului — de unde a plecat Școala Ardeleană.",
    body: [
      "Școlile Blajului s-au deschis la mijlocul secolului al XVIII-lea, sub episcopul Petru Pavel Aron, și au fost primele școli în limba română din Transilvania. Din ele a ieșit Școala Ardeleană — Samuil Micu, Gheorghe Șincai, Petru Maior — curentul care a argumentat, cu gramatici și cu istorii, originea latină a limbii și a poporului român.",
      "Ștefan Manciulea (1894–1985), al cărui nume îl poartă astăzi liceul, a fost geograf și istoric, profesor și bibliotecar la Blaj. A trecut, ca mulți dintre colegii lui, prin închisorile regimului comunist.",
      "Grădina Botanică ține de aceeași curte a școlilor. Un oraș mic cu o grădină botanică nu este un accident: este ce se întâmplă când o școală ia botanica în serios timp de două secole.",
    ],
    mapsQuery: "Liceul Teoretic Ștefan Manciulea, Blaj",
    confidence: "check",
    verify:
      "Că liceul de azi ocupă chiar clădirea școlilor istorice, și că Grădina Botanică este în aceeași curte cu el. Datele despre Școala Ardeleană și despre Ștefan Manciulea sunt sigure; legătura dintre cele două locuri de pe teren nu a fost verificată de nimeni din proiect.",
  },
  {
    slug: "biserica-grecilor",
    title: "Biserica Grecilor",
    standfirst: "Cea mai discretă biserică din traseu, și cea cu cel mai mic cimitir.",
    body: [
      "Numele vine de la negustorii greci așezați în Transilvania în secolele XVII–XVIII. Comunitățile lor erau mici, bogate și bine organizate, iar acolo unde se stabileau își ridicau propria biserică — de obicei modestă ca dimensiune și îngrijită ca execuție, pentru un număr de familii care se putea număra pe degete.",
      "Este cea mai mică oprire din traseu și singura la care nu clădirea este lucrul principal, ci ce se află în jurul ei.",
    ],
    mapsQuery: "Biserica Grecilor, Blaj",
    confidence: "check",
    verify:
      "Originea numelui și istoria concretă a acestei biserici. Contextul negustorilor greci din Transilvania este corect în general, dar nimeni din proiect nu a verificat că exact aceasta este explicația numelui de aici.",
  },
  {
    slug: "castelul-mitropolitan",
    title: "Castelul Mitropolitan",
    standfirst: "Un castel nobiliar care a ajuns reședință de episcop.",
    body: [
      "Clădirea este mai veche decât rolul pe care îl joacă azi: a fost ridicată ca reședință nobiliară în secolul al XVI-lea, în perioada Principatului Transilvaniei, și abia după 1737 a devenit reședința episcopilor greco-catolici mutați la Blaj.",
      "Este singura clădire din traseu care a fost, pe rând, casă de familie nobiliară, centru administrativ al unei Biserici și — în anii regimului comunist, după scoaterea în afara legii a Bisericii Greco-Catolice în 1948 — cu totul altceva.",
    ],
    mapsQuery: "Castelul Mitropolitan, Blaj",
    confidence: "check",
    verify:
      "Secolul construcției și familia care a ridicat-o. Că a devenit reședință episcopală după mutarea scaunului la Blaj este sigur; datarea exactă și proprietarii inițiali nu au fost verificați.",
  },
  {
    slug: "casa-maniu",
    title: "Casa Maniu",
    standfirst: "Numele unui om care a condus România și a murit într-o închisoare.",
    body: [
      "Iuliu Maniu (1873–1953) a fost unul dintre artizanii Unirii de la 1918 și de trei ori prim-ministru al României. A condus Partidul Național Țărănesc, a fost una dintre puținele voci care au refuzat compromisul atât cu dictatura regală, cât și cu cea comunistă, și a murit în 1953 în închisoarea de la Sighet.",
      "Ca mulți dintre oamenii politici ardeleni ai generației lui, formarea și l-a legat de școlile Blajului — orașul era, pentru elita românească din Transilvania, locul prin care treceai.",
    ],
    mapsQuery: "Casa Maniu, Blaj",
    confidence: "check",
    verify:
      "Ce anume leagă această casă de Iuliu Maniu — a locuit în ea, i-a aparținut familiei, sau poartă doar numele? Biografia lui Maniu este sigură; legătura cu clădirea aceasta nu.",
  },
  {
    slug: "magazinul-gostat",
    title: "Magazinul Gostat",
    standfirst: "Singura oprire din traseu al cărei nume vine din altă Românie.",
    body: [
      "„Gostat” este prescurtarea de la Gospodărie Agricolă de Stat — rețeaua de ferme de stat din perioada comunistă. Magazinele lor erau prezente în aproape fiecare oraș, iar numele a rămas lipit de clădire mult după ce instituția a dispărut, în anii '90.",
      "Este genul de toponim pe care nu îl găsești pe nicio hartă oficială și pe care ți-l spune oricine din oraș. Într-un traseu format din catedrale, castele și case memoriale, oprirea aceasta este acolo pentru că orașele nu sunt făcute doar din monumente.",
    ],
    mapsQuery: "Magazin Gostat, Blaj",
    confidence: "check",
    verify:
      "Că locul este cunoscut în oraș sub acest nume și că clădirea mai există ca atare. Ce a însemnat „Gostat” este sigur; că acesta este magazinul la care se referă regulamentul, nu.",
  },
  {
    slug: "casa-ioan-suciu",
    title: "Casa Ioan Suciu",
    standfirst: "Un episcop de treizeci și ceva de ani, mort în închisoare, fericit din 2019.",
    body: [
      "Ioan Suciu (1907–1953) a fost episcop greco-catolic și administrator apostolic, un om remarcabil de tânăr pentru funcția pe care a purtat-o și cunoscut mai ales pentru munca lui cu tinerii.",
      "În 1948 regimul comunist a scos în afara legii Biserica Greco-Catolică. Episcopii care au refuzat să treacă la Ortodoxie au fost arestați. Ioan Suciu a murit în 1953 în închisoarea de la Sighet.",
      "Pe 2 iunie 2019, pe Câmpia Libertății — ultima oprire a acestui traseu — Papa Francisc i-a beatificat pe cei șapte episcopi greco-catolici martiri. Ioan Suciu este unul dintre ei. Traseul acesta trece, fără să insiste, pe lângă începutul și sfârșitul aceleiași povești.",
    ],
    mapsQuery: "Casa Ioan Suciu, Blaj",
    confidence: "check",
    verify:
      "Legătura casei cu episcopul — casa natală, casa familiei, sau o casă memorială? Biografia lui Ioan Suciu și beatificarea din 2019 sunt sigure; identificarea clădirii nu.",
  },
  {
    slug: "colegiul-si-capela",
    title: "Colegiul „Inochentie Micu Clain” și Capela Arhiereilor",
    standfirst: "Numele omului care a adus tot ce urmează în orașul acesta.",
    body: [
      "Inochentie Micu-Klein (1692–1768) a fost episcopul care a mutat scaunul la Blaj și care a cerut, insistent și în scris, drepturi politice pentru români în Transilvania — pe atunci o națiune doar tolerată. A fost chemat la Viena să dea socoteală, a plecat la Roma și nu s-a mai întors niciodată. A murit acolo, în exil, după douăzeci și șase de ani.",
      "Osemintele i-au fost aduse înapoi la Blaj abia în 1997, după mai bine de două secole.",
      "Colegiul îi poartă numele. Capela Arhiereilor, din aceeași incintă, este locul unde odihnesc episcopii Blajului.",
    ],
    mapsQuery: "Colegiul Inochentie Micu Clain, Blaj",
    confidence: "check",
    verify:
      "Că Capela Arhiereilor se află în incinta colegiului și că acolo sunt înmormântați episcopii. Biografia lui Inochentie Micu-Klein și aducerea osemintelor în 1997 sunt sigure.",
  },
  {
    slug: "campia-libertatii",
    title: "Câmpia Libertății",
    standfirst: "Locul în care, în 1848, au încăput mai mulți oameni decât are Blajul azi.",
    body: [
      "Pe 3/15 mai 1848 s-a ținut aici Marea Adunare Națională de la Blaj. Au venit zeci de mii de oameni — mult mai mulți decât populația orașului — și au cerut, în fața autorităților imperiale, drepturi egale pentru români. Au vorbit Simion Bărnuțiu, George Barițiu, Avram Iancu. Câmpul pe care s-au strâns se numește de atunci Câmpia Libertății.",
      "Este singurul loc din traseu care nu este o clădire. Nu are ce să îți arate: importanța lui este că zece mii de oameni au stat în picioare pe el, într-o zi de mai, acum aproape două sute de ani.",
      "Tot aici, pe 2 iunie 2019, Papa Francisc a beatificat șapte episcopi greco-catolici martiri, în fața a peste o sută de mii de oameni. Același câmp, aceeași idee, o sută șaptezeci și unu de ani mai târziu.",
    ],
    mapsQuery: "Câmpia Libertății, Blaj",
    confidence: "solid",
  },
  {
    slug: "protopopiatul",
    title: "Protopopiatul Blaj",
    standfirst: "Ultima oprire din regulament, și cea mai administrativă din traseu.",
    body: [
      "Protopopiatul este unitatea administrativă care coordonează parohiile dintr-o zonă — un fel de district, condus de un protopop. Nu este o clădire de vizitat, ci un birou care funcționează.",
      "Într-un oraș în care Biserica Greco-Catolică a fost desființată prin lege în 1948 și repusă în drepturi abia după 1989, existența unui protopopiat care își vede de treaba lui este, în felul ei, tot un fel de monument.",
    ],
    mapsQuery: "Protopopiatul Greco-Catolic, Blaj",
    confidence: "check",
    verify:
      "Adresa exactă și dacă locul este accesibil publicului în ziua evenimentului. Contextul istoric (desființarea din 1948, revenirea după 1989) este sigur.",
  },
] as const;

/** Lookup by slug, for the dynamic route. */
export const placeBySlug = (slug: string): BlajhuntPlace | undefined =>
  BLAJHUNT_PLACES.find((p) => p.slug === slug);

/** Lookup by stop title, so a card can link to its own page. */
export const placeByTitle = (title: string): BlajhuntPlace | undefined =>
  BLAJHUNT_PLACES.find((p) => p.title === title);

/**
 * Google Maps search URL. A search, not a pin — see the header for why.
 */
export const mapsUrl = (place: BlajhuntPlace): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    place.mapsQuery,
  )}`;
