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
 * goes public.** TODO.md tracks this as an open content dependency. Do
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
      "Catedrala a fost ridicată în deceniile care au urmat, în stil baroc. Blajul este centrul Bisericii Române Unite cu Roma, Greco-Catolică, iar din 2005, când Biserica a fost ridicată la rang de Arhiepiscopie Majoră, poartă titlul de catedrală arhiepiscopală majoră.",
      "Atunci când a ajuns la Blaj, Mihai Eminescu a numit orașul în mod simbolic: Mica Romă.",
    ],
    mapsQuery: "Catedrala Sfânta Treime, Blaj",
    confidence: "solid",
  },
  {
    slug: "liceul-si-gradina-botanica",
    title: "Liceul „Ștefan Manciulea” și Grădina Botanică",
    standfirst: "Școlile Blajului — de unde a plecat Școala Ardeleană.",
    body: [
      "Școlile Blajului s-au deschis la mijlocul secolului al XVIII-lea, sub episcopul Petru Pavel Aron, și au fost primele școli cu predare sistematică în limba română din Transilvania. Aici apare Școala Ardeleană, mișcarea care a argumentat, cu gramatici și cu istorii, originea latină a limbii și a poporului român.",
      "Ștefan Manciulea (1894–1985), al cărui nume îl poartă astăzi liceul, a fost geograf și istoric, profesor și bibliotecar la Blaj. A trecut, ca mulți dintre colegii lui, prin persecuția regimului comunist.",
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
    standfirst:
      "Cea mai discretă biserică din traseu. În cimitirul ei veți descoperi numele unor personalități de marcă din istoria Bisericii Greco-Catolice din România.",
    body: [
      "În secolul al XVIII-lea s-au așezat la Blaj mai mulți călugări greci uniți cu Roma. Cel mai proeminent a fost ieromonahul Leontie Moschonas, un învățat călugăr grec din insula Naxos, care a venit la Blaj împreună cu episcopul Inocențiu Micu, care l-a numit arhimandrit. Moschonas a pus bazele bibliotecii din Blaj și a murit la Blaj în 1758. Biserica își are numele de la călugării greci care au deservit-o inițial.",
      "În perioada Belle Époque paroh al bisericii a fost protopopul Gheorghe Bărbat.",
    ],
    mapsQuery: "Biserica Grecilor, Blaj",
    confidence: "check",
    verify:
      "Originea numelui și istoria concretă a acestei biserici. Contextul negustorilor greci din Transilvania este corect în general, dar nimeni din proiect nu a verificat că exact aceasta este explicația numelui de aici.",
  },
  {
    slug: "castelul-mitropolitan",
    title: "Castelul Mitropolitan",
    standfirst: "Un castel nobiliar care a ajuns reședință mitropolitană.",
    body: [
      "Clădirea este mai veche decât rolul pe care îl joacă azi: a fost ridicată ca reședință nobiliară în secolul al XVI-lea, în perioada Principatului Transilvaniei, și abia după 1737 a devenit reședința episcopilor greco-catolici mutați la Blaj.",
      "Este singura clădire din traseu care a fost, pe rând, palat nobiliar, centru administrativ al unei Biserici și în anii regimului comunist, după scoaterea în afara legii a Bisericii Greco-Catolice, muzeu.",
    ],
    mapsQuery: "Castelul Mitropolitan, Blaj",
    confidence: "check",
    verify:
      "Secolul construcției și familia care a ridicat-o. Că a devenit reședință episcopală după mutarea scaunului la Blaj este sigur; datarea exactă și proprietarii inițiali nu au fost verificați.",
  },
  {
    slug: "casa-maniu",
    title: "Casa Maniu",
    standfirst:
      "Numele unui om politic greco-catolic care a avut un rol important în evenimentele de la 1918 și după, murind în închisoarea comunistă de la Sighet.",
    body: [
      "Iuliu Maniu (1873–1953) a fost unul dintre artizanii Unirii de la 1918 și de trei ori prim-ministru al Regatului României. A condus Partidul Național Țărănesc, a fost una dintre puținele voci care au refuzat compromisul atât cu dictatura regală, cât și cu cea comunistă, și a murit în 1953 în închisoarea de la Sighet.",
      "De asemenea, era un greco-catolic convins și a îndeplinit funcția de avocat mitropolitan la Blaj.",
    ],
    mapsQuery: "Casa Maniu, Blaj",
    confidence: "check",
    verify:
      "Ce anume leagă această casă de Iuliu Maniu — a locuit în ea, i-a aparținut familiei, sau poartă doar numele? Biografia lui Maniu este sigură; legătura cu clădirea aceasta nu.",
  },
  {
    slug: "magazinul-gostat",
    title: "Magazinul Gostat",
    standfirst:
      "În clădirea de față au funcționat, pe parcursul istoriei, mai multe magazine, prăvălii importante pentru comunitatea blăjeană.",
    body: [
      "„Gostat” este prescurtarea de la Gospodărie Agricolă de Stat, o rețea de ferme de stat din perioada comunistă. Magazinele lor erau prezente în aproape fiecare oraș.",
      "Pe parcursul istoriei, în clădirea care găzduiește actualul magazin „Gostat” au funcționat diverse alte magazine. Le putem identifica fie cu ajutorul documentelor de arhivă și a fotografiilor de epocă, fie cu ajutorul literaturii. Ion Agârbiceanu menționează, în unele opere, aceste magazine.",
    ],
    mapsQuery: "Magazin Gostat, Blaj",
    confidence: "check",
    verify:
      "Că locul este cunoscut în oraș sub acest nume și că clădirea mai există ca atare. Ce a însemnat „Gostat” este sigur; că acesta este magazinul la care se referă regulamentul, nu.",
  },
  {
    slug: "casa-ioan-suciu",
    title: "Casa Ioan Suciu",
    standfirst:
      "Un episcop care juca fotbal împreună cu tinerii, mort pentru credință în lagărul comunist de exterminare de la Sighet.",
    body: [
      "Ioan Suciu (1907–1953) a fost episcop greco-catolic și administrator apostolic, un om remarcabil de tânăr pentru funcția pe care a purtat-o și cunoscut mai ales pentru munca lui cu tinerii.",
      "În 1948 regimul comunist a scos în afara legii Biserica Greco-Catolică. Episcopii care au refuzat să treacă la Ortodoxie au fost arestați. Ioan Suciu a murit în 1953 în închisoarea de la Sighet.",
      "Pe 2 iunie 2019, pe Câmpia Libertății, Papa Francisc i-a beatificat pe cei șapte episcopi greco-catolici martiri. Ioan Suciu este unul dintre ei.",
    ],
    mapsQuery: "Casa Ioan Suciu, Blaj",
    confidence: "check",
    verify:
      "Legătura casei cu episcopul — casa natală, casa familiei, sau o casă memorială? Biografia lui Ioan Suciu și beatificarea din 2019 sunt sigure; identificarea clădirii nu.",
  },
  {
    slug: "colegiul-si-capela",
    title: "Colegiul „Inochentie Micu Clain” și Capela Arhiereilor",
    standfirst:
      "Poartă numele celui care a fost „arhitectul” Blajului prin gândirea sa revoluționară.",
    body: [
      "Inochentie Micu-Klein (1692–1768) a fost episcopul care a mutat scaunul episcopal de la Făgăraș la Blaj și care a cerut, insistent și în scris, drepturi politice pentru români în Transilvania, pe atunci o națiune doar tolerată. A fost chemat la Viena să dea socoteală, a plecat la Roma și nu s-a mai întors niciodată. A murit acolo, în exil, după douăzeci și șase de ani. Cu toate acestea, documentele de arhivă ne atestă că episcopul a păstrat constant legătura cu cei rămași acasă.",
      "Osemintele i-au fost aduse înapoi la Blaj abia în 1997, după mai bine de două secole.",
      "Colegiul îi poartă numele. Capela Arhiereilor, din aceeași incintă, este locul unde odihnesc o parte din arhiereii Blajului și a Bisericii Române Unite.",
    ],
    mapsQuery: "Colegiul Inochentie Micu Clain, Blaj",
    confidence: "check",
    verify:
      "Că Capela Arhiereilor se află în incinta colegiului și că acolo sunt înmormântați episcopii. Biografia lui Inochentie Micu-Klein și aducerea osemintelor în 1997 sunt sigure.",
  },
  {
    slug: "campia-libertatii",
    title: "Câmpia Libertății",
    standfirst:
      "Aici s-au desfășurat adunările naționale din timpul revoluției de la 1848-1849. Atunci s-a scandat pentru libertate, acum puteți răspunde și voi la o întrebare?",
    body: [
      "Pe 3/15 mai 1848 s-a ținut aici Marea Adunare Națională de la Blaj. Au venit zeci de mii de oameni și au cerut drepturi egale pentru români. Câmpul, din spatele Catedralei, pe care s-au strâns se numește de atunci Câmpia Libertății.",
      "Este singurul loc din traseu care nu este o clădire. Tot aici, pe 2 iunie 2019, Papa Francisc i-a beatificat pe cei șapte episcopi greco-catolici martiri, în fața a peste o sută de mii de oameni. Același câmp, aceeași idee, o sută șaptezeci și unu de ani mai târziu.",
    ],
    mapsQuery: "Câmpia Libertății, Blaj",
    confidence: "solid",
  },
  {
    slug: "protopopiatul",
    title: "DE ȘTERS LOCAȚIA!!!",
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
