/**
 * The workshops, as data. One entry per atelier, rendered on `/ateliere` and,
 * once it exists, on `/ateliere/[slug]`.
 *
 * ── Source ──────────────────────────────────────────────────────────────────
 * Transcribed from the organizers' ten documents in `docs/ateliere/`: seven
 * received 8 Sep 2026 and corrected against the copy-review document the
 * organizers returned on 14 Sep (`docs/copy/`, see scripts/copy/README.md),
 * then A8, A10 and A11 delivered on 14 Sep 2026 and transcribed straight from
 * their .docx — those three have not been through a copy round yet.
 * `docs/` is gitignored and vercelignored because the same folder holds the
 * treasure-hunt answer key; nothing here is imported from there at build
 * time, it is typed in. When a document changes, this file changes by hand.
 *
 * ── `hook` is not the organizers' summary, and that is deliberate ───────────
 * The 14 Sep round moved each workshop's promotional opening OUT of the body
 * and INTO the summary field, which runs 262-487 characters. The carousel's
 * copy band is a fixed box that clips: at 360x740, its tightest case, a
 * summary over ~174 characters pushes the *Detalii* button out of the stage
 * and `overflow-hidden` eats it — measured at -23px to -179px on all seven.
 * So `hook` is a 122-149 character condensation, inside the 115-150 band the
 * site already shipped, and the organizers' full opening is folded back into
 * `body`, where the page scrolls and nothing is lost. Check any new hook
 * against the band before shipping it; the character count is not the
 * constraint, the rendered line count is. The three 14 Sep workshops were
 * written to it from the start — 140-147 characters — rather than condensed
 * afterwards.
 *
 * ── Two numberings, and why they differ by exactly one ──────────────────────
 * A1 is the Blajhunt itself, so the organizers' workshops start at A2. With
 * A8, A10 and A11 delivered on 14 Sep they now run A2–A11 with no gaps, and
 * the site numbers them 01–10 in the order they appear here.
 *
 * Until 14 Sep those numbers ran 02–09 and genuinely skipped 08, which is why
 * the site stopped printing them: a list that opens on "Atelier 02" and skips
 * 08 reads as a bug to anyone who has not seen the source documents. The gap
 * has since closed, so the two schemes are now a constant offset of one — but
 * the site keeps its own numbering, because it is the one on the page and
 * renumbering mid-project would break every shared link's kicker.
 *
 * The organizers' number stays on every entry as `number`: it is how the .docx
 * files are named and how the organizers refer to them. It is simply not what
 * the site prints. ORDER IS BY `number` — that is the ordering the organizers
 * use, and the site's 01–10 is just its position in it.
 *
 * ── Settled by the 14 Sep resend ────────────────────────────────────────────
 * All ten documents came back at 17:2x with a room and a [GPS: ...] link, and
 * with the four open questions answered. Nothing on this list is open any more:
 *   - Every room is named. A4 is Sala Clasei a VI-a, A7 the Aula Mare, A8
 *     Radio Blaj, A9 the Aula Samuil Micu, A10 Sala clasei a V-a. A7 and A10
 *     had no location at all before this.
 *   - Coordinates arrived. Eight links are points and are stored as decimal
 *     degrees; A3's is a street address and A11's names a building, so those
 *     two stay searches. See `mapsQuery`.
 *   - A8 is 40 seats, not 60 — the header was wrong, the groups were right.
 *   - A11's slots were cut to 50 minutes, matching its stated duration.
 *   - A10 moved off 13:30 to 13:45, in step with everything else.
 *   - A3 was re-cut from 25 minutes in two groups of 20 to 20 minutes in
 *     THREE groups of 15. It is the only workshop that runs three.
 *   - All ten cards are settled artwork.
 *
 * ── A12, which arrived alone on 15 Sep ──────────────────────────────────────
 * ESCAPE MODE came as a document with no photographs at all — nothing in
 * poze-raw, nothing in poze-org. Its card artwork followed the next morning,
 * so only the GALLERY is still missing: it is the one workshop whose page has
 * no photo strip, because a gallery needs photographs of the thing and none
 * were ever sent. Its GPS link is an address rather than a point, like A3's
 * and A11's. Everything else in it is internally consistent: 13:45 + 90
 * minutes lands exactly on its stated 15:15.
 *
 * ── What the resend did NOT settle (both in TODO.md) ────────────────────────
 *   - A11 still has no "Locația:" line at all. Its room name here is read off
 *     the GPS link, which is a place URL for the Biblioteca de Teologie
 *     Greco-Catolică. The pin is the organizers'; the words are not.
 *   - A10's document still ends on "Întâlnire la ??" even though the room is
 *     now named twelve lines above it. Reads as leftover draft text rather
 *     than a live question, and nothing is printed from it — but if the
 *     meeting point is somewhere other than the room, nobody has said so.
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
   *  paperwork. A1 is the hunt, so these run 02–11. NOT what the site prints
   *  — see `atelierNo`. */
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
  /** What Google Maps is pointed at, passed through `?api=1&query=`, which
   *  accepts either a place/address string or "lat,lng".
   *
   *  Coordinates since the 14 Sep resend, when every document finally carried
   *  a [GPS: ...] link — eight are points, resolved to decimal degrees here so
   *  the site never depends on a goo.gl redirect staying alive. Two are not:
   *  A3's link is a street address and A11's names a building, and those two
   *  stay search strings ending in Blaj so the search cannot wander. */
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
  accent: "sky" | "gold";
}

export const ATELIERE: readonly Atelier[] = [
  {
    slug: "masina-timpului",
    number: 2,
    title: "Cu mașina timpului prin Blaj",
    cardTitle: "Cu mașina\ntimpului\nprin Blaj",
    tagline: "… în cel mai cool tur istoric ever!",
    hook:
      "Vrei un speed-run prin inima Blajului? Revoluția din Piața 1848, Eminescu și Facebook-ul de epocă al Micii Rome. Meme-uri istorice și cadre de Insta.",
    leadLabel: "Ghid",
    leads: ["Ciprian Vestemean"],
    durationMin: 45,
    seats: 60,
    sessions: [
      { label: "Grupa 1", time: "13:45–14:30", seats: 30 },
      { label: "Grupa 2", time: "14:45–15:30", seats: 30 },
    ],
    location: "Piața 1848, la bustul episcopului Ioan Inocențiu Micu-Klein",
    mapsQuery: "46.174168,23.922383",
    body: [
      "Vrei un speed-run prin inima Blajului? Să afli cum s-a lăsat o revoluție aici și de ce iubea Eminescu atât de mult acest loc, încât i-a dat un nume special! Vei descoperi cum funcționa Facebook-ul de epocă în „Mica Romă”.",
      "Adună-ți gașca, vino la bustul lui Micu-Klein și hai să dăm o nouă perspectivă trecutului! Ne vedem în Piața 1848 pentru un tur interactiv cu meme-uri istorice, vibe bun și cadre perfecte de Insta.",
      "Vom explora Piața 1848, un spațiu emblematic pentru Blaj și pentru țară, datorită evenimentelor istorice desfășurate aici, ne vom reaminti cum s-a întemeiat orașul și viziunea iluministă a episcopului Ioan Inocențiu Micu-Klein. Vom vedea clădirile de patrimoniu — de la Catedrală și Primele Școli, până la Curia Arhiepiscopală, Casa „Iuliu Maniu” și Palatul Cultural —, reconstituind totodată efervescența comercială a vechiului târg. Prin integrarea memoriei literare legate de trecerea emoționantă a lui Mihai Eminescu prin acest nucleu spiritual, ghidajul transformă un simplu perimetru urban într-o destinație culturală de impact.",
      "Traseul: întâlnire la bustul episcopului Ioan Inocențiu Micu-Klein → Catedrală → statuia Mitropolitului Vasile Suciu → Seminar.",
    ],
    tags: ["CeODaBlajul", "Blaj", "MicaRoma", "IstoriePeRepedeInainte"],
    image: "/ateliere/masina-timpului.webp",
    accent: "sky",
  },
  {
    slug: "episcopul-tinerilor",
    number: 3,
    title: "În vizită la Episcopul Tinerilor",
    cardTitle: "În vizită la\nEpiscopul\nTinerilor",
    tagline: "… acasă la Fericitul Ioan Suciu",
    hook:
      "Vrei să-l cunoști pe „Episcopul Tinerilor”? Te invităm acasă la Fericitul Ioan Suciu: mansarda în care făcea direcțiune spirituală și obiectele lui.",
    leadLabel: "Coordonator atelier",
    leads: ["Ion Moldovan"],
    // Re-cut on 14 Sep: was 25 minutes in two groups of 20. Now 20 minutes in
    // THREE groups of 15 — the only workshop that runs three.
    durationMin: 20,
    seats: 45,
    sessions: [
      { label: "Grupa 1", time: "13:45–14:05", seats: 15 },
      { label: "Grupa 2", time: "14:15–14:35", seats: 15 },
      { label: "Grupa 3", time: "14:45–15:05", seats: 15 },
    ],
    location: "Strada Astra nr. 18",
    // The only GPS link that is an address rather than a point; kept as the
    // search it is.
    mapsQuery: "Strada Astra 18, 515400 Blaj",
    body: [
      "Vrei să afli mai multe despre „Episcopul Tinerilor”?",
      "Te invităm acasă la Fericitul Episcop Ioan Suciu pentru a-i descoperi universul prin vizitarea „mansardei” unde crea și făcea direcțiune spirituală și prin intermediul obiectelor personale care i-au aparținut!",
      "Centrul spiritual „Episcopul Martir Ioan Suciu” din Blaj, înființat întru cinstirea și amintirea bravului nostru episcop martir, își desfășoară activitatea în imobilul de pe strada Astra (fosta Regină Maria), în care s-a născut, a copilărit și și-a petrecut o parte din anii de studii liceale și universitare „Episcopul Tinerilor” — un nume pe care credincioșii i l-au dat tocmai pentru că era foarte apropiat de tineri și implicat în formarea lor spirituală și de buni români.",
      "Era cunoscută la Blaj, înainte de interzicerea Bisericii, celebra mansardă a Episcopului, în care se retrăgea mai multe luni pe an, încă din vremea în care era elev la Liceul „Sfântul Vasile cel Mare” sau a studiilor teologice și, ulterior, în vremea în care era preot și profesor la Blaj. Pentru mulți tineri din acea vreme, acest binecuvântat loc a devenit în timp o „oază” de liniște, de regăsire a sinelui, de descoperire a minunatei vieți de creștin. Toate acestea sub îndrumarea hăruitului „învățător” care se dovedea a fi Ioan Suciu.",
      "Spiritul acestui loc și amintirea vie a Episcopului Ioan Suciu se pot regăsi și astăzi, după atâția ani, în mansarda Centrului spiritual, reconstituită după mărturii ale celor care i-au trecut pragul și au beneficiat de îndrumarea sa spirituală.",
      "Vrei să trăiești o experiență pe care să o păstrezi în inimă toată viața? Te invităm să treci pragul mansardei și să te întorci în timp, având posibilitatea să descoperi documente, fotografii, manuscrise și obiecte care au aparținut ilustrului nostru înaintaș.",
      "Te așteptăm!",
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
      "Ce să fac cu viața mea? Încotro să o apuc? Care e dorința cea mai profundă a inimii mele? Un atelier interactiv despre vocația ta.",
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
    location: "Piața 1848 nr. 1, Sala Clasei a VI-a – Liceu",
    mapsQuery: "46.173806,23.923333",
    body: [
      "Ce să fac cu viața mea? Cum pot să-i dau un sens? Încotro să o apuc? Cum să trăiesc astfel încât să fiu împlinit și fericit? Care este dorința cea mai profundă a inimii mele?",
      "Și tu te confrunți cu astfel de întrebări?",
      "Te provocăm la un atelier interactiv despre vocația pe care Dumnezeu a așezat-o în inima ta.",
      "Împreună, vom răspunde provocării de a înfrunta marile întrebări și alegeri ale tinereții. Căsătoria, preoția sau viața consacrată, fiecare vocație este un dar de iubire, iar orice dar cere un răspuns liber și asumat. Voi avea curajul să spun „da”?",
      "Atelierul oferă atât o perspectivă generală asupra vocației de fii ai lui Dumnezeu (vocația fundamentală a oricărui creștin), cât și ocazia de a purta discuții cu privire la vocația specifică și unică a fiecăruia dintre noi, la carismele proprii ordinelor călugărești.",
      "Cu toții avem o dorință profundă de sens. Vocația și proiectul de viață sunt două aspecte ale aceleiași realități: chemarea lui Dumnezeu și răspunsul nostru, concretizat printr-o alegere liberă.",
    ],
    tags: ["sens", "vocație", "discernământ", "curaj", "împlinire", "fericire"],
    image: "/ateliere/curajul-de-a-ti-urma-inima.webp",
    accent: "sky",
  },
  {
    slug: "iconar",
    number: 5,
    title: "Iconar pentru o zi",
    cardTitle: "Iconar\npentru o zi",
    tagline: "… sau cine știe, poate pentru mai multe!",
    hook:
      "Ești atras de pictură și de arta sacră? Dai viață sticlei prin desen, culoare și rugăciune și pleci acasă cu propria ta creație.",
    leadLabel: "Coordonator atelier",
    leads: ["Ioana Aruști"],
    durationMin: 120,
    seats: 30,
    sessions: [{ time: "13:40–15:40" }],
    location: "Piața 1848 nr. 1, Curtea Facultății, în aer liber",
    mapsQuery: "46.174138,23.924074",
    body: [
      "Ești atras de pictură și de arta sacră? Vrei să descoperi tainele și tehnica folosirii pensulei, a culorilor și a sticlei pentru a da viață Sacrului și Frumosului din sufletul tău?",
      "Hai să deschidem împreună „o fereastră spre absolut”!",
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
      "Vrei să fii creator de lumină spirituală? Pietricică lângă pietricică, în tehnica mozaicului, și pleci acasă cu propria ta creație.",
    leadLabel: "Coordonator atelier",
    leads: ["Claudia Komives"],
    durationMin: 120,
    seats: 25,
    sessions: [{ time: "13:40–15:40" }],
    location: "Piața 1848 nr. 1, Sala de Mozaic",
    mapsQuery: "46.174167,23.923361",
    body: [
      "Vrei să fii creator de lumină spirituală? Să creezi, punând pietricică lângă pietricică, imagini și simboluri religioase? Să reînvii alături de noi străluciri ale unei lumi antice creștine de pe axa mozaicului Răsărit-Apus?",
      "Descoperă artistul din tine!",
      "Vei putea lua acasă nu doar experiența trăită, ci și propria creație, în care se vor oglindi sensibilitatea ta și lucrurile învățate împreună!",
      "Te așteptăm la Atelierul de Mozaic realizat de Școala de mozaic „Tesserae”, un loc de convergență între artă, credință și învățare, unde piatra naturală plantată direct se transformă în imagini încărcate de semnificații creștine. Vei putea lua cu tine nu doar experiența trăită, ci și propria creație, în care se vor oglindi sensibilitatea ta și lucrurile învățate împreună!",
      "Școala de mozaic „Tesserae” funcționează la Blaj din anul 2004 și dezvoltă arta mozaicului romano-bizantin, fiind în strânsă legătură cu viața spirituală și culturală a orașului istoric, Blajul Episcopal. „Tesserae” este o continuitate a tradiției artei sacre din sânul Bisericii Greco-Catolice, care dorește să întărească legătura dintre comunitate și mărturisirea credinței prin artă.",
      "Vino să descoperi împreună cu noi tehnica de plantare directă a pietrei naturale (tesserelor), pe care o regăsim în marile mozaicuri murale romano-bizantine, să înveți să vezi dincolo de limitarea unui șablon, să creezi dimensiuni cromatice din imaginație, dar și să te ancorezi puternic în stilul antic de plantare. Îți arătăm cum să faci comuniunea între materie, har și comunitate. Te învățăm stilul de lucru al artiștilor mozaicari eleni și romani adaptat zilelor noastre și să recunoști strălucirea marilor creații creștine.",
    ],
    tags: ["lumină", "creație", "imaginație", "comuniune", "har", "veșnicie"],
    image: "/ateliere/mozaicar.webp",
    accent: "sky",
  },
  {
    slug: "curajul-de-a-ti-conduce-viata",
    number: 7,
    title: "Curajul de a-ți conduce propria viață",
    cardTitle: "Curajul de\na-ți conduce\npropria viață",
    hook:
      "Știi în ce direcție se dezvoltă viața ta? Ceea ce faci acum contează: alegeri, obiective și obiceiurile care te modelează.",
    leadLabel: "Coordonator atelier",
    leads: [
      "Dr. Ciprian Ghișa, profesor la Facultatea de Teologie Greco-Catolică și Cambridge Exams Officer",
    ],
    durationMin: 60,
    seats: 50,
    sessions: [
      { label: "Nivel 1 (14–16 ani)", time: "13:45–14:45", seats: 25 },
      { label: "Nivel 2 (17–19+ ani)", time: "14:45–15:45", seats: 25 },
    ],
    location: "Piața 1848 nr. 1, Aula Mare, etaj",
    mapsQuery: "46.174028,23.923194",
    body: [
      "Știi în ce direcție se dezvoltă viața ta? Care sunt punctele tari pe care ai nevoie să le îmbunătățești pentru a-ți atinge obiectivele?",
      "Ceea ce faci acum contează!",
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
    slug: "pescari-de-oameni",
    number: 8,
    title: "Pescari de oameni în lumea digitală",
    cardTitle: "Pescari de\noameni în\nlumea digitală",
    hook:
      "Vrei să fii reporter Radio-TV pentru o zi? Intri în culisele Radio Blaj & TV Online și afli cum se face o știre — și cum o deosebești de una falsă.",
    leadLabel: "Coordonatori atelier",
    leads: [
      "Claudiu Nicușan, director Radio Blaj TV Online",
      "Nicu Goga, redactor Radio Blaj",
      "Pr. Vlad Mezei, producător TV",
      "Radu Oprean, operator media",
    ],
    durationMin: 60,
    // Was "Locuri: 60" over sessions of 20 + 20. Asked, and the organizers
    // answered 40 on 14 Sep: the header was the error, the groups were right.
    seats: 40,
    sessions: [
      { label: "Grupa 1", time: "13:45–14:45", seats: 20 },
      { label: "Grupa 2", time: "14:45–15:45", seats: 20 },
    ],
    // nr. 11, not nr. 1 — the only workshop outside the Piața 1848 nr. 1
    // complex. Its pin sits ~50m west of the others, which is the check that
    // caught the number: a typo would have put it on top of them.
    location: "Piața 1848 nr. 11, Radio Blaj",
    mapsQuery: "46.174142,23.921702",
    body: [
      "Vrei să trăiești experiența de a fi reporter Radio-TV și producător de materiale media? Vrei să fii și tu parte din misiunea de a duce mai departe mesajul Evangheliei, folosind instrumentele lumii digitale? Te invităm la atelierul de media și social media — Radio Blaj & TV Online!",
      "„Veniți după Mine și vă voi face pescari de oameni!” (Mt 4,19)",
      "Atelierul îi invită pe tineri să descopere lumea Radio Blaj și TV Online, într-o incursiune în culisele unui studio de radio și televiziune. Participanții vor afla cum se realizează o știre, cum se construiește un material media și cum pot deosebi o informație autentică de una falsă în multitudinea de mesaje întâlnite zilnic în mediul online.",
      "Prin exerciții practice și jocuri cu imaginea și sunetul, tinerii vor avea ocazia să descopere câteva dintre secretele producției radio-TV și să experimenteze, într-un mod creativ, diferite forme de comunicare.",
      "Atelierul propune și o reflecție asupra misiunii Bisericii în lumea digitală. Așa cum apostolii au fost chemați să fie „pescari de oameni”, și astăzi mesajul Evangheliei poate ajunge la oameni prin mijloacele moderne de comunicare. Camera, microfonul și rețelele sociale pot deveni instrumente prin care sunt promovate credința, valorile Bisericii Române Unite cu Roma, patrimoniul și viața comunităților greco-catolice.",
      "„Pescari de oameni în lumea digitală” este, astfel, o invitație pentru tineri să descopere că pot folosi media nu doar pentru a transmite informații, ci și pentru a spune povești adevărate, a promova binele și a duce mai departe un mesaj de credință și speranță.",
    ],
    tags: [],
    image: "/ateliere/pescari-de-oameni.webp",
    accent: "sky",
  },
  {
    slug: "voluntari-in-misiune",
    number: 9,
    title: "Voluntari în misiune",
    cardTitle: "Voluntari\nîn misiune",
    tagline: "… sau aventuri cu Dumnezeu într-o altă lume",
    hook:
      "Ești curios să cunoști aventura unor tineri ca tine, plecați un an în misiune? Te invităm față în față cu ei și cu povestea lor.",
    leadLabel: "Coordonator atelier",
    leads: ["Diacon Leo Jagwitz"],
    durationMin: 60,
    seats: 25,
    sessions: [{ time: "13:40–14:40" }],
    location: "Piața 1848 nr. 1, Aula Samuil Micu",
    mapsQuery: "46.174417,23.923250",
    body: [
      "Ești curios să cunoști aventura unor tineri ca tine care pentru un an au fost în misiune în țări îndepărtate? Vrei să știi ce experiențe, emoții și trăiri spirituale au avut?",
      "Te invităm față în față cu ei și cu povestea unui an pe care l-au petrecut în misiune!",
      "Absolvenții voluntariatului DIMORA te așteaptă să-ți împărtășească din aventurile lor cu Dumnezeu într-o altă lume: într-un cartier din Argentina, din Peru sau din Napoli.",
      "Te așteptăm la o întâlnire cu tineri faini, cu aventuri și experiențe umane și spirituale emoționante, cu muzică, poze, filmulețe și vibe bun!",
    ],
    tags: ["voluntariat", "misiune", "aventură", "mărturie", "tineri"],
    image: "/ateliere/voluntari-in-misiune.webp",
    accent: "gold",
  },
  {
    slug: "inima-misiunilor",
    number: 10,
    title: "Expediție în Inima Misiunilor",
    cardTitle: "Expediție în\nInima\nMisiunilor",
    tagline: "… de la Lyon la marginile lumii!",
    hook:
      "Cum a pornit o tânără de 17 ani prima rețea de „crowdfunding” din istoria Bisericii? Povestea celor patru Opere care au ajuns la marginile lumii.",
    leadLabel: "Coordonatori",
    leads: [
      "Pr. Eugen Blaj, director OMP România",
      "Matilda Andrici, secretar național OMP",
    ],
    durationMin: 60,
    seats: 70,
    sessions: [
      { label: "Grupa 1", time: "13:45–14:45", seats: 35 },
      { label: "Grupa 2", time: "14:45–15:45", seats: 35 },
    ],
    // Was the one workshop starting at 13:30, out of step with the rest; the
    // organizers moved it to 13:45 on 14 Sep. The room arrived in the same
    // resend. The document's closing line still reads "Întâlnire la ??" — left
    // over from the draft that had no location, since the room is now named
    // twelve lines above it. Nothing is printed from it. Listed in TODO.md.
    location: "Piața 1848 nr. 1, Sala clasei a V-a – Liceu",
    mapsQuery: "46.173778,23.923528",
    body: [
      "Vrei să descoperi cum o tânără de 17 ani a creat prima rețea de „crowdfunding” din istoria Bisericii? Sau cum poți fi un super-erou pentru alți copii, chiar și de la mii de kilometri distanță? Vino să afli povestea celor patru Opere care au schimbat fața lumii și cum motto-ul „Toți misionari!” a devenit cel mai tare trend spiritual!",
      "Adună-ți gașca și hai să vedem cum ideile revoluționare ale unor oameni simpli au primit titlul de „Pontificale” și au cucerit întreg globul!",
      "Ne vedem pentru un tur interactiv cu vibe de misiune, povești de sacrificiu și cadre perfecte pentru a-ți arăta pasiunea pentru bine!",
      "Vom porni într-o călătorie fascinantă prin secolele XIX și XX pentru a cunoaște „părinții” misiunilor moderne. Vom descoperi cum Pauline Jaricot a început cu „un bănuț pe săptămână” în Lyon, cum Episcopul Forbin-Janson a lansat provocarea „Copiii ajută copiii” pentru copiii din China, și cum Jeanne Bigard și-a vândut toate bunurile pentru a susține viitorii preoți din Japonia. Nu în ultimul rând, vom înțelege viziunea Fericitului Paolo Manna, care ne-a învățat că fiecare botezat este, prin definiție, un misionar. Prezentarea transformă datele istorice într-o experiență vie despre solidaritate universală și evanghelizare.",
    ],
    tags: [
      "ToțiMisionari",
      "CopiiiAjutăCopiii",
      "PaulineJaricot",
      "Misiune",
      "Solidaritate",
      "GlobalVibe",
      "OMPRomânia",
    ],
    image: "/ateliere/inima-misiunilor.webp",
    accent: "sky",
  },
  {
    slug: "salvator-de-vieti",
    number: 11,
    title: "Salvator de vieți",
    cardTitle: "Salvator\nde vieți",
    tagline: "… pentru că știi cum!",
    hook:
      "Știi ce să faci când cineva de lângă tine are nevoie urgentă de ajutor? Prim ajutor pe bune: RCP pe manechin, poziția laterală, apel la 112.",
    leadLabel: "Coordonatori atelier",
    leads: [
      "As. med. Paul Ogrean, lector formator și coordonator intervenții",
      "As. med. Alexandra Ogrean, instructor formare practică",
    ],
    // The 14 Sep resend cut the slots to match the stated 50 minutes, so the
    // document no longer contradicts itself: 13:45–14:35 and 14:45–15:35.
    durationMin: 50,
    seats: 40,
    sessions: [
      { label: "Nivel 1 (12–15 ani)", time: "13:45–14:35", seats: 20 },
      { label: "Nivel 2 (16–20+ ani)", time: "14:45–15:35", seats: 20 },
    ],
    // INFERRED, not stated. A11 is the one document with no "Locația:" line at
    // all — the 14 Sep resend added a GPS link and nothing else, and that link
    // is a place URL naming the Biblioteca de Teologie Greco-Catolică. The
    // name below is read off it, so the search is the authoritative half and
    // the label is the guess. Confirm with the organizers. Listed in TODO.md.
    location: "Biblioteca de Teologie Greco-Catolică",
    mapsQuery: "Biblioteca de Teologie Greco-Catolică Blaj",
    body: [
      "Știi ce să faci atunci când cineva de lângă tine are nevoie urgentă de ajutor? Să recunoști o situație de urgență? Să intervii rapid și corect, doar cu mâinile goale? Să oferi o șansă la viață în acele prime minute care pot face diferența?",
      "Descoperă salvatorul din tine! Te așteptăm la un atelier practic și interactiv de prim ajutor, realizat de echipa medicală a Centrului Medical SMD, un loc în care învățarea se transformă în experiență practică, iar cunoștințele pot deveni gesturi care salvează vieți.",
      "Vei putea pleca nu doar cu informații noi, ci și cu încrederea de a reacționa corect într-o situație de urgență și cu deprinderi practice pe care le poți folosi în viața de zi cu zi.",
      "Te vom învăța pas cu pas cum să recunoști o urgență, cum să evaluezi victima și cum să ceri ajutor eficient la 112.",
      "Vei exersa direct pe manechine masajul cardiac (RCP) și tehnica corectă a compresiilor toracice. Vei descoperi când și cum se folosește poziția laterală de siguranță, dar și alte tehnici utile de prim ajutor.",
      "Îți arătăm că, în momentele în care fiecare secundă contează, mâinile tale pot face diferența. Te învățăm cum să transformi panica în acțiune, neputința în curaj și câteva cunoștințe simple într-o adevărată șansă la viață.",
      "Haide și tu să descoperi salvatorul din tine, să înveți să reacționezi și să fii pregătit atunci când cineva are nevoie de tine.",
    ],
    tags: ["primajutor", "RCP", "salvator", "viață", "curaj", "învățare", "CentrulMedicalSMD"],
    image: "/ateliere/salvator-de-vieti.webp",
    accent: "gold",
  },
  {
    slug: "escape-mode",
    number: 12,
    title: "ESCAPE MODE: Misiunea ta începe aici!",
    cardTitle: "Escape\nMode",
    // No tagline. The document has no "…" second title line, and the one
    // invented here read "… misiunea ta începe aici!" directly under a
    // title ending in "Misiunea ta începe aici!" — the same sentence twice,
    // a line apart. A7 and A8 carry none either.
    hook:
      "Nu vii să asculți o lecție, vii să rezolvi misiuni: informații reale vs. fake, presiunea grupului, algoritmi. Găsești codul de evadare?",
    leadLabel: "Coordonator atelier",
    leads: ["Mirela Ghircău, psiholog specialist în consiliere psihologică"],
    durationMin: 90,
    seats: 20,
    // One session, and the only workshop whose document states an age
    // recommendation without splitting into levels. It rides in the session
    // label because that is where A7 and A11 already put ages, and because the
    // facts list is the one place a visitor compares workshops before choosing.
    sessions: [{ label: "Recomandat 14–16 ani", time: "13:45–15:15" }],
    location: "Casa Maniu — Piața 1848 nr. 8",
    // The GPS link is a street address, not a point, like A3's and A11's — so
    // it stays a search. Casa Maniu is at nr. 8; A8's Radio Blaj is at nr. 11
    // and the other nine are at nr. 1. Three different buildings on one square.
    mapsQuery: "Piața 1848 8, 515400 Blaj",
    body: [
      "Atelier despre sănătate mintală, comportamente adictive, gândire critică și luarea deciziilor.",
      "Crezi că iei mereu deciziile tale? Sau uneori te influențează prietenii, TikTok-ul, presiunea grupului, emoțiile sau dorința de a încerca ceva nou?",
      "În ESCAPE MODE nu vii să asculți o lecție. Vii să rezolvi misiuni, să descoperi indicii și să vezi cât de bine poți să gândești atunci când lucrurile nu sunt atât de simple pe cât par.",
      "Vei avea de trecut prin provocări despre: informații reale vs. fake; manipularea și presiunea grupului; algoritmi și comportamente repetitive; stres, emoții și alegeri; și situații în care trebuie să alegi: EXIT sau CONTINUE?",
      "Ai voie să te răzgândești. Ai voie să spui „nu știu”. Ai voie să pui întrebări. Dar nu ai voie să accepți o informație doar pentru că „așa spune toată lumea”.",
      "La final, trebuie să descoperi CODUL DE EVADARE. Ai suficientă gândire critică pentru a ieși din ESCAPE MODE?",
      "Vino! Intră în joc! Pune întrebări! Fă alegeri! Ai 90 de minute. 5 misiuni. 1 singur cod. Ai curaj să intri? Misiunea începe cu tine.",
    ],
    tags: [],
    image: "/ateliere/escape-mode.webp",
    accent: "sky",
  },
];

export const atelierBySlug = (slug: string): Atelier | undefined =>
  ATELIERE.find((a) => a.slug === slug);

/**
 * What the site prints — and since 14 Sep it is simply the organizers' own
 * number, zero-padded: "01" through "11".
 *
 * ── Why this used to be a position counter ──────────────────────────────────
 * The organizers number the hunt A1 and the workshops A2–A11. The site used to
 * list only the workshops, so printing their numbers would have opened the
 * strip on "Atelier 02"; it counted positions instead and printed 01–10, one
 * less than the paperwork all the way down. (Before 14 Sep it was worse: there
 * was no A8, so their numbering had a hole in it as well.)
 *
 * Both reasons are gone. The hole closed when A8 arrived, and the offset
 * closed when the Blajhunt took its rightful place at the head of the strip as
 * `HUNT_CARD` — A1, where it always was. Site and paperwork now agree, which
 * is what the site wanted in the first place.
 *
 * Every display site goes through here — the stage's credit line, the detail
 * page's kicker and its prev/next links — so a workshop cannot be numbered one
 * way in one place and another way elsewhere.
 */
export const atelierNo = (a: Atelier): string => String(a.number).padStart(2, "0");

/**
 * ATELIERE must stay A2–A11, contiguous and in order, or `atelierNo` and the
 * strip's reading order quietly disagree — the list order is what the visitor
 * sees and `number` is what gets printed on it. Cheap to assert, and it is the
 * exact invariant that made the old position counter necessary.
 *
 * Dev only: `next build` runs this once per module load, and throwing here
 * fails the build rather than shipping a mis-numbered strip.
 */
if (process.env.NODE_ENV !== "production") {
  ATELIERE.forEach((a, i) => {
    const want = i + 2;
    if (a.number !== want) {
      throw new Error(
        `ateliere: ATELIERE[${i}] is "${a.slug}" with number ${a.number}, expected ${want}. ` +
          `The list must run A2–A11 in order — atelierNo() prints \`number\` and the strip ` +
          `renders list order, so a gap or a swap here mis-numbers the page.`,
      );
    }
  });
}

/**
 * The Blajhunt, as the first card on the workshops strip.
 *
 * It is `A1` in the organizers' numbering — every comment in this file that
 * says "A1 is the hunt" has said so since 8 Sep — but it had no card, so the
 * strip opened on A2. It has one now, at the head, and clicking it leaves for
 * `/blajhunt` rather than opening a workshop sheet: the hunt's page already
 * exists and is a richer thing than `/ateliere/[slug]` could be.
 *
 * ── Why it is NOT an entry in ATELIERE ──────────────────────────────────────
 * `Atelier` is a transcription of one of the organizers' workshop documents:
 * `leads`, `sessions`, `seats`, `durationMin`, `body`, `tags`. The hunt has
 * none of those — it is not seated, not timed in groups and not run by a
 * coordinator — so joining that list would mean inventing five fields to
 * satisfy a type, and the one thing this file does not do is invent. It would
 * also hand `/ateliere/[slug]` a route to prerender and `generateStaticParams`
 * a page that must not exist.
 *
 * So it is its own shape, carrying only what a card paints. `meta` is written
 * out rather than derived because "45 min · 60 locuri" is meaningless for a
 * hunt; these are the same three figures `/blajhunt` puts under its hero,
 * minus the team size, which does not fit the two-slot strip.
 */
export interface HuntCard {
  slug: string;
  number: number;
  title: string;
  cardTitle: string;
  hook: string;
  /** Replaces the `N min` / `N locuri` pair. */
  meta: readonly string[];
  /** Where the CTA goes. The whole point: it leaves /ateliere. */
  href: string;
  ctaLabel: string;
  image: string;
  /** Unused since the artwork landed on 14 Sep. Kept, like `Atelier`'s, for
   *  the next gap — the card and the strip already know how to say so. */
  imagePlaceholder?: boolean;
  accent: "sky" | "gold";
}

export const HUNT_CARD: HuntCard = {
  slug: "blajhunt",
  number: 1,
  title: "Blajhunt",
  cardTitle: "Blajhunt",
  hook:
    "Ia-ți gașca și descoperă Blajul așa cum nu l-ai mai văzut: zece opriri, indicii de urmărit și probe de rezolvat pe teren.",
  // The hunt's own hero stats, in the strip's two slots.
  meta: ["10 opriri", "1000 puncte"],
  href: "/blajhunt",
  // Not "Detalii" like the ten. The card leaves for a different kind of page
  // and the label is the only warning the visitor gets before it does.
  ctaLabel: "Vezi traseul",
  image: "/ateliere/blajhunt.webp",
  // Gold, which is what keeps the strip alternating: the ten below run
  // sky/gold from A2, so the card in front of them has to be gold. Changing it
  // to sky means flipping all eleven, not one.
  accent: "gold",
};

export const mapsUrl = (query: string): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
