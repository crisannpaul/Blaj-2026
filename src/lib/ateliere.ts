/**
 * The workshops, as data. One entry per atelier, rendered on `/ateliere` and,
 * once it exists, on `/ateliere/[slug]`.
 *
 * ── Source ──────────────────────────────────────────────────────────────────
 * Transcribed from the organizers' seven documents in `docs/ateliere/`
 * (received 8 Sep 2026). `docs/` is gitignored and vercelignored because the
 * same folder holds the treasure-hunt answer key; nothing here is imported
 * from there at build time, it is typed in. When a document changes, this
 * file changes by hand.
 *
 * ── Numbering is the organizers', gaps included ─────────────────────────────
 * A1 is the Blajhunt itself, so the workshops start at 2. There is no A8 in
 * The site numbers them 1–7, in the order they appear here. It used to print
 * the organizers' own numbers so it would agree with whatever gets printed on
 * the day, but those run 02–09 with gaps — A1 is the hunt and there is no A8 —
 * and a list that opens on "Atelier 02" and skips 08 reads as a bug to anyone
 * who has not seen the source documents. The organizers' number is kept on
 * every entry as `number`, because it is how the .docx files are named and how
 * the organizers refer to them; it is simply not what the site prints.
 *
 * ── What is still owed (SPEC A3) ────────────────────────────────────────────
 *   - Every location in the documents ends in "[GPS]" and no coordinates
 *     came. `mapsQuery` is a search string, same policy as the hunt's places:
 *     a wrong pin sends people across town, a search lands on what Google
 *     knows.
 *   - Two rooms are literally "Sala ...." in the source (A4, A9). A7 has no
 *     location at all. `location` is optional and the UI says so.
 *   - A7's photograph never came; its thumbnail was generated instead, so no
 *     entry sets `imagePlaceholder` any more. The flag and the UI that reads it
 *     stay, for the next gap.
 */

export interface AtelierSession {
  /** "Grupa 1", "Nivel 2 (17–19 ani)". Absent for a single-session workshop. */
  label?: string;
  /** "13:45–14:30" */
  time: string;
  /** Seats in this session, when the document splits them. */
  seats?: number;
}

export interface Atelier {
  /** URL segment. Stable — it is a link people may share. */
  slug: string;
  /** The organizers' own number, as used in their documents and on their
   *  paperwork. A1 is the hunt and there is no A8, so these run 02–09 with
   *  gaps. NOT what the site prints — see `atelierNo`. */
  number: number;
  /** Full title, as in the document. */
  title: string;
  /** The same title broken into lines for the stage headline, `\n` per line.
   *  Lines are kept to ~12 characters so three of them fit above the strip on
   *  a 390px phone at the headline's measured size. */
  cardTitle: string;
  /** The document's second line — "… sau cine știe, poate pentru mai multe!" */
  tagline?: string;
  /** One or two sentences for the copy band under the strip. */
  hook: string;
  /** "Ghid", "Coordonator atelier". Defaults to "Coordonator". */
  leadLabel?: string;
  /** Who runs it. */
  leads: string[];
  durationMin: number;
  seats: number;
  sessions: AtelierSession[];
  /** As written in the document; undefined when the document has none. */
  location?: string;
  /** What to search for. Always ends in Blaj so the search cannot wander. */
  mapsQuery?: string;
  /** The long description, paragraph by paragraph. */
  body: string[];
  /** The document's hashtags, without the #. */
  tags: string[];
  /** Card image, 3:4. Under `public/ateliere/`, produced by scripts/photos.js. */
  image: string;
  /** True while the organizers still owe a photograph and `image` is stock. */
  imagePlaceholder?: boolean;
  /** Which of the two palette accents grades the stage behind this card. */
  accent: "lapis" | "gold";
}

export const ATELIERE: readonly Atelier[] = [
  {
    slug: "masina-timpului",
    number: 2,
    title: "Cu mașina timpului prin Blaj",
    cardTitle: "Cu mașina\ntimpului\nprin Blaj",
    tagline: "… în cel mai cool tur istoric ever!",
    hook:
      "Speed-run prin inima Blajului: revoluția din Piața 1848, Eminescu și Facebook-ul de epocă al Micii Rome. Cu meme-uri istorice și cadre de Insta.",
    leadLabel: "Ghid",
    leads: ["Ciprian Vestemean"],
    durationMin: 45,
    seats: 60,
    sessions: [
      { label: "Grupa 1", time: "13:45–14:30", seats: 30 },
      { label: "Grupa 2", time: "14:45–15:30", seats: 30 },
    ],
    location: "Piața 1848, la bustul episcopului Ioan Inocențiu Micu-Klein",
    mapsQuery: "Piața 1848, Blaj",
    body: [
      "Vrei un speed-run prin inima Blajului? Să afli cum s-a lăsat o revoluție aici și de ce iubea Eminescu atât de mult acest loc, încât i-a dat un nume special! Vei descoperi cum funcționa Facebook-ul de epocă în „Mica Romă”.",
      "Adună-ți gașca, vino la bustul lui Micu-Klein și hai să dăm o nouă perspectivă trecutului! Ne vedem în Piața 1848 pentru un tur interactiv cu meme-uri istorice, vibe bun și cadre perfecte de Insta.",
      "Vom explora Piața 1848, un spațiu emblematic pentru Blaj și pentru țară, datorită evenimentelor istorice desfășurate aici, ne vom reaminti cum s-a întemeiat orașul și viziunea iluministă a episcopului Ioan Inocențiu Micu-Klein. Vom vedea clădirile de patrimoniu — de la Catedrală și Primele Școli, până la Curia Arhiepiscopală, Casa „Iuliu Maniu” și Palatul Cultural —, reconstituind totodată efervescența comercială a vechiului târg. Prin integrarea memoriei literare legate de trecerea emoționantă a lui Mihai Eminescu prin acest nucleu spiritual, ghidajul transformă un simplu perimetru urban într-o destinație culturală de impact.",
      "Traseul: întâlnire la bustul episcopului Ioan Inocențiu Micu-Klein → Catedrală → statuia Mitropolitului Vasile Suciu → Seminar.",
    ],
    tags: ["CeODaBlajul", "Blaj", "MicaRoma", "IstoriePeRepedeInainte"],
    image: "/ateliere/masina-timpului.webp",
    accent: "lapis",
  },
  {
    slug: "episcopul-tinerilor",
    number: 3,
    title: "În vizită la Episcopul Tinerilor",
    cardTitle: "În vizită la\nEpiscopul\nTinerilor",
    tagline: "… acasă la Fericitul Ioan Suciu",
    hook:
      "Acasă la Fericitul Ioan Suciu, „Episcopul Tinerilor”: mansarda în care făcea direcțiune spirituală și obiectele personale care i-au aparținut.",
    leadLabel: "Coordonator atelier",
    leads: ["Ion Moldovan"],
    durationMin: 25,
    seats: 40,
    sessions: [
      { label: "Grupa 1", time: "13:45–14:10", seats: 20 },
      { label: "Grupa 2", time: "14:15–14:40", seats: 20 },
    ],
    location: "Strada Astra nr. 18",
    mapsQuery: "Strada Astra 18, Blaj",
    body: [
      "Vrei să afli mai multe despre „Episcopul Tinerilor”? Te invităm acasă la Fericitul Episcop Ioan Suciu pentru a-i descoperi spiritul prin vizitarea „mansardei” unde crea și făcea direcțiune spirituală și prin intermediul obiectelor personale care i-au aparținut!",
      "Centrul spiritual „Episcopul Martir Ioan Suciu” din Blaj, înființat întru cinstirea și amintirea bravului nostru episcop martir, își desfășoară activitatea în imobilul de pe strada Astra (fosta Regină Maria), în care s-a născut, a copilărit și și-a petrecut o parte din anii de studii liceale și universitare „Episcopul Tinerilor” — un nume pe care credincioșii i l-au dat tocmai pentru că era foarte apropiat de tineri și implicat în formarea lor spirituală și de buni români.",
      "Era cunoscută la Blaj, înainte de interzicerea Bisericii, celebra mansardă a Episcopului, în care se retrăgea mai multe luni pe an, încă din vremea în care era elev la Liceul „Sfântul Vasile cel Mare” sau a studiilor teologice și, ulterior, în vremea în care era preot și profesor la Blaj. Pentru mulți tineri din acea vreme, acest binecuvântat loc a devenit în timp o „oază” de liniște, de regăsire a sinelui, de descoperire a minunatei vieți de creștin. Toate acestea sub îndrumarea hăruitului „învățător” care se dovedea a fi Ioan Suciu.",
      "Spiritul acestui loc și amintirea vie a Episcopului Ioan Suciu se pot regăsi și astăzi, după atâția ani, în mansarda Centrului spiritual, reconstituită după mărturii ale celor care i-au trecut pragul și au beneficiat de îndrumarea sa spirituală.",
      "Vrei să trăiești o experiență pe care să o păstrezi în inimă toată viața? Te invităm să treci pragul mansardei și să te întorci în timp, având posibilitatea să descoperi documente, fotografii, manuscrise și obiecte care au aparținut ilustrului nostru înaintaș. Te așteptăm!",
    ],
    tags: [],
    image: "/ateliere/episcopul-tinerilor.webp",
    accent: "gold",
  },
  {
    slug: "curajul-de-a-ti-urma-inima",
    number: 4,
    title: "Curajul de a-ți urma inima!",
    cardTitle: "Curajul de\na-ți urma\ninima",
    tagline: "… ca să fii fericit!",
    hook:
      "Căsătorie, preoție sau viață consacrată — un atelier interactiv despre vocația pe care Dumnezeu a așezat-o în inima ta. Voi avea curajul să spun „da”?",
    leadLabel: "Coordonatori atelier",
    leads: [
      "Sr. Maximiliana, Ordinul Sfântului Vasile cel Mare (Baziliene)",
      "Sr. Luminița, Congregația Surorilor Maicii Domnului (CMD)",
      "Pr. Ciprian Suciu, Seminarul Teologic Intereparhial Blaj",
      "Pr. Anton Rus, Facultatea de Teologie Greco-Catolică",
    ],
    durationMin: 60,
    seats: 60,
    sessions: [
      { label: "Grupa 1", time: "13:45–14:45", seats: 30 },
      { label: "Grupa 2", time: "14:45–15:45", seats: 30 },
    ],
    // The document says "Sala ...." — the room is not decided yet.
    location: "Piața 1848 nr. 1, sala se anunță",
    mapsQuery: "Piața 1848 nr. 1, Blaj",
    body: [
      "Ce să fac cu viața mea? Cum pot să-i dau un sens? Încotro să o apuc? Cum să trăiesc astfel încât să fiu împlinit și fericit? Care este dorința cea mai profundă a inimii mele? Și tu te confrunți cu astfel de întrebări?",
      "Te provocăm la un atelier interactiv despre vocația pe care Dumnezeu a așezat-o în inima ta. Împreună, vom răspunde provocării de a înfrunta marile întrebări și alegeri ale tinereții. Căsătoria, preoția sau viața consacrată — fiecare vocație este un dar de iubire, iar orice dar cere un răspuns liber și asumat. Voi avea curajul să spun „da”?",
      "Atelierul oferă atât o perspectivă generală asupra vocației de fii ai lui Dumnezeu — vocația fundamentală a oricărui creștin —, cât și ocazia de a purta discuții cu privire la vocația specifică și unică a fiecăruia dintre noi, la carismele proprii ordinelor călugărești. Cu toții avem o dorință profundă de sens. Vocația și proiectul de viață sunt două aspecte ale aceleiași realități: chemarea lui Dumnezeu și răspunsul nostru, concretizat printr-o alegere liberă.",
    ],
    tags: ["sens", "vocație", "discernământ", "curaj", "împlinire", "fericire"],
    image: "/ateliere/curajul-de-a-ti-urma-inima.webp",
    accent: "lapis",
  },
  {
    slug: "iconar",
    number: 5,
    title: "Iconar pentru o zi",
    cardTitle: "Iconar\npentru o zi",
    tagline: "… sau cine știe, poate pentru mai multe!",
    hook:
      "Desen, culoare, rugăciune: dai viață sticlei în tehnica icoanei transilvănene și pleci acasă cu propria ta creație.",
    leadLabel: "Coordonator atelier",
    leads: ["Ioana Aruști"],
    durationMin: 120,
    seats: 30,
    sessions: [{ time: "13:40–15:40" }],
    location: "Piața 1848 nr. 1, curtea Facultății, în aer liber",
    mapsQuery: "Facultatea de Teologie Greco-Catolică, Piața 1848, Blaj",
    body: [
      "Ești atras de pictură și de arta sacră? Vrei să descoperi tainele și tehnica folosirii pensulei, a culorilor și a sticlei pentru a da viață Sacrului și Frumosului din sufletul tău? Hai să deschidem împreună „o fereastră spre absolut”!",
      "Te invităm la un atelier de pictură în care dai viață sticlei prin desen, culoare, rugăciune, emoție și credință. Vei pleca acasă cu o experiență unică și inedită, cu o creație personală în care se vor reuni Dumnezeu, Blajul și sufletul tău!",
      "Icoana pe sticlă e specifică artei populare transilvănene și e atât de actuală și fascinantă! Aceasta presupune un demers artistic original, dar mai ales spiritual, prin care, asemeni țăranilor simpli de odinioară, ne creăm cu mâinile noastre un colțișor autentic și personal de rugăciune și comuniune cu Dumnezeu.",
      "Tehnica picturii pe sticlă (cunoscută tradițional sub numele de pictură în oglindă sau inversată) este un proces fascinant, deoarece se desfășoară în ordine complet inversă față de pictura clasică pe pânză sau hârtie. Practic, artistul pictează pe spatele sticlei, pornind de la desen și detalii, iar lucrarea finală se admiră pe fața sticlei.",
      "Materialele folosite în trecut erau simple, luate din gospodărie: bucăți de sticlă cu imperfecțiuni, culori naturale din minerale, oxizi sau plante, gălbenuș de ou sau usturoi ca liant. Desenul e simplu și deseori naiv, căci nu presupune studiu academic, ci reflectare sinceră și autentică a sufletului și credinței personale!",
      "Despre simbolurile din icoane, despre semnificația culorilor, despre motivele tradiționale românești din icoana pe sticlă, vei afla mai multe în cadrul atelierului. Învățarea dă roadele cele mai bune când îmbinăm teoria cu practica, într-o atmosferă relaxată și creativă, în comuniune și har!",
    ],
    tags: ["pictură", "inspirație", "fereastrăspreabsolut", "creație", "comuniune", "har", "veșnicie"],
    image: "/ateliere/iconar.webp",
    accent: "gold",
  },
  {
    slug: "mozaicar",
    number: 6,
    title: "Artist mozaicar pentru o zi",
    cardTitle: "Mozaicar\npentru o zi",
    tagline: "… sau cine știe, poate pentru mai multe!",
    hook:
      "Pietricică lângă pietricică, în tehnica mozaicului romano-bizantin, la Școala de mozaic „Tesserae”. Pleci cu propria ta creație.",
    leadLabel: "Coordonator atelier",
    leads: ["Claudia Komives"],
    durationMin: 120,
    seats: 25,
    sessions: [{ time: "13:40–15:40" }],
    location: "Piața 1848 nr. 1, Sala de Mozaic",
    mapsQuery: "Piața 1848 nr. 1, Blaj",
    body: [
      "Vrei să fii creator de lumină spirituală? Să creezi, punând pietricică lângă pietricică, imagini și simboluri religioase? Să reînvii alături de noi străluciri ale unei lumi antice creștine de pe axa mozaicului Răsărit-Apus? Descoperă artistul din tine!",
      "Te așteptăm la Atelierul de Mozaic realizat de Școala de mozaic „Tesserae”, un loc de convergență între artă, credință și învățare, unde piatra naturală plantată direct se transformă în imagini încărcate de semnificații creștine. Vei putea lua cu tine nu doar experiența trăită, ci și propria creație, în care se vor oglindi sensibilitatea ta și lucrurile învățate împreună!",
      "Școala de mozaic „Tesserae” funcționează la Blaj din anul 2004 și dezvoltă arta mozaicului romano-bizantin, fiind în strânsă legătură cu viața spirituală și culturală a orașului istoric, Blajul Episcopal. „Tesserae” este o continuitate a tradiției artei sacre din sânul Bisericii Greco-Catolice, care dorește să întărească legătura dintre comunitate și mărturisirea credinței prin artă.",
      "Vino să descoperi împreună cu noi tehnica de plantare directă a pietrei naturale (tesserelor), pe care o regăsim în marile mozaicuri murale romano-bizantine, să înveți să vezi dincolo de limitarea unui șablon, să creezi dimensiuni cromatice din imaginație, dar și să te ancorezi puternic în stilul antic de plantare. Îți arătăm cum să faci comuniunea între materie, har și comunitate. Te învățăm stilul de lucru al artiștilor mozaicari eleni și romani adaptat zilelor noastre și să recunoști strălucirea marilor creații creștine.",
    ],
    tags: ["lumină", "creație", "imaginație", "comuniune", "har", "veșnicie"],
    image: "/ateliere/mozaicar.webp",
    accent: "lapis",
  },
  {
    slug: "curajul-de-a-ti-conduce-viata",
    number: 7,
    title: "Curajul de a-ți conduce propria viață",
    cardTitle: "Curajul de\na-ți conduce\npropria viață",
    hook:
      "Ce faci acum contează. O discuție despre alegeri, obiective, competențe și obiceiurile care te modelează în persoana care alegi să devii.",
    leadLabel: "Coordonator atelier",
    leads: [
      "Dr. Ciprian Ghișa, profesor la Facultatea de Teologie Greco-Catolică și Cambridge Exams Officer",
    ],
    durationMin: 60,
    seats: 50,
    sessions: [
      { label: "Nivel 1 (14–16 ani)", time: "13:45–14:45", seats: 25 },
      { label: "Nivel 2 (17–19 ani)", time: "14:45–15:45", seats: 25 },
    ],
    // The document gives no location at all.
    body: [
      "Știi în ce direcție se dezvoltă viața ta? Care sunt punctele tari pe care ai nevoie să le îmbunătățești pentru a-ți atinge obiectivele? Ceea ce faci acum contează!",
      "Te invit să discutăm deschis despre viață și despre alegerile pe care le facem, despre obiectivele pe care ni le propunem și competențele pe care le dezvoltăm, dar și despre comportamentele pe care, repetându-le zi de zi, le transformăm în obiceiuri. În timp, toate acestea ne modelează în persoana care alegem să devenim.",
      "A fi un lider autentic înseamnă, în primul rând, să fii cu adevărat responsabil de evoluția propriei vieți, de deciziile pe care le iei, de țintele și direcțiile în care alegi să te dezvolți. Competențele pe care trebuie să te concentrezi în acești ani te vor ajuta enorm odată ce îți începi viața de adult. Te invit să discutăm despre comportamentele care, repetate acum, te vor ajuta în mod decisiv mai târziu.",
    ],
    tags: ["lider", "dezvoltarepersonală", "modelare", "competențe", "comportamente"],
    // Generated artwork like the other six, settled by the user in
    // docs/ateliere/poze-org/ and cut by scripts/photos.js. This was
    // the last card on a stock Unsplash frame; the organizers never sent a
    // photograph of this workshop, so it was made rather than waited for.
    image: "/ateliere/curajul-de-a-ti-conduce-viata.webp",
    accent: "gold",
  },
  {
    slug: "voluntari-in-misiune",
    number: 9,
    title: "Voluntari în misiune",
    cardTitle: "Voluntari\nîn misiune",
    tagline: "… sau aventuri cu Dumnezeu într-o altă lume",
    hook:
      "Tineri ca tine care au petrecut un an în misiune — Argentina, Peru, Napoli — îți povestesc față în față, cu muzică, poze și filmulețe.",
    leadLabel: "Coordonator atelier",
    leads: ["Diacon Leo Jagwitz"],
    durationMin: 60,
    seats: 25,
    sessions: [{ time: "13:40–14:40" }],
    // "Sala ..." in the document.
    location: "Piața 1848 nr. 1, sala se anunță",
    mapsQuery: "Piața 1848 nr. 1, Blaj",
    body: [
      "Ești curios să cunoști aventura unor tineri ca tine care pentru un an au fost în misiune în țări îndepărtate? Vrei să știi ce experiențe, emoții și trăiri spirituale au avut? Te invităm față în față cu ei și cu povestea unui an pe care l-au petrecut în misiune!",
      "Absolvenții voluntariatului DIMORA te așteaptă să-ți împărtășească din aventurile lor cu Dumnezeu într-o altă lume — într-un cartier din Argentina, din Peru sau din Napoli.",
      "Te așteptăm la o întâlnire cu tineri faini, cu aventuri și experiențe umane și spirituale emoționante, cu muzică, poze, filmulețe și vibe bun!",
    ],
    tags: ["voluntariat", "misiune", "aventură", "mărturie", "tineri"],
    image: "/ateliere/voluntari-in-misiune.webp",
    accent: "lapis",
  },
];

export const atelierBySlug = (slug: string): Atelier | undefined =>
  ATELIERE.find((a) => a.slug === slug);

/**
 * What the site prints: position in this list, 1-based and zero-padded — "01"
 * through "07", no gaps. Deliberately NOT `a.number`, which is the organizers'
 * numbering and runs 02–09.
 *
 * Every display site goes through here — the stage's credit line, the detail
 * page's kicker and its prev/next links — so the two numbering schemes cannot
 * drift apart on the page.
 *
 * Falls back to the organizers' number for an entry that is not in ATELIERE,
 * which only happens if a caller builds an Atelier by hand; indexOf would
 * otherwise silently print "00".
 */
export const atelierNo = (a: Atelier): string => {
  const i = ATELIERE.findIndex((x) => x.slug === a.slug);
  return String(i >= 0 ? i + 1 : a.number).padStart(2, "0");
};

export const mapsUrl = (query: string): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
