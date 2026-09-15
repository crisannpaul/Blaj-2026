/**
 * Ten line glyphs, one per stop on the Blajhunt route.
 *
 * ── Why hand-drawn SVG and not photographs ──────────────────────────────────
 * The mockup (`creatives/Roadmap Glyphs.png`) shows detailed greyscale 3D
 * renders. Those do not exist in this repo and there is no photograph of any
 * of the ten objectives (none were ever sent). Two reasons not to fill
 * the hole with stock imagery:
 *
 *  1. Mismatched stock reads worse than nothing. A generic church photo next
 *     to "Biserica Grecilor" is a lie the reader can spot.
 *  2. Several stops ARE "find this building" — a photorealistic render would
 *     hand over the answer. A line glyph says "a church with a graveyard" and
 *     nothing more, which is exactly the amount the roadmap is allowed to say
 *     (see the header of `src/lib/blajhunt-stops.ts`: `docs/` is the answer
 *     key and nothing from it may reach a page).
 *
 * So: these are INVENTED. They are architectural archetypes, not portraits of
 * the real buildings. Nobody has checked whether Casa Maniu has a balcony.
 * When real photographs arrive this file is the thing they replace.
 *
 * ONE EXCEPTION, and it is the shape of the rest: `monument` is drawn from a
 * photograph the user supplied on 9 Sep, so Câmpia Libertății is a portrait.
 * That is safe because it is not a "find this building" stop — it is an open
 * public park with one monument in it, it is named in the page's own section
 * title ("Zece opriri, de la Seminar la Câmpia Libertății"), and per the note
 * at the head of `blajhunt-stops.ts` it is "listed ninth but its task is
 * plainly the finale". Nobody is hunting for it.
 *
 * Do not take it as licence to draw the other nine from life. For the stops
 * that ARE "find this building", the drawing giving away the answer is the
 * whole reason these are archetypes.
 *
 * ── Drawing rules, so ten glyphs read as one set ────────────────────────────
 *  · One 48x48 viewBox. Ground line at y=43, drawing inside x 3–45.
 *  · Stroke only, no fill, round caps and joins.
 *  · Legible at 56px — the smallest place any of these lands is the stop
 *    detail page's tile. Anything under ~4 units wide disappears there, so
 *    nothing is drawn smaller than that.
 *  · `strokeWidth` is NOT set here. It is set by the caller per surface,
 *    because a drawing rendered at 32px and the same drawing at 112px do not
 *    want the same weight in user units. Two live callers: `trail-swipe.tsx`
 *    (the card plate, 88px at 1.5) and `blajhunt/[slug]/page.tsx` (the detail
 *    tile, 56px at 1.8). `how-it-works.tsx` draws them twice more — a 32px
 *    phone tile and a 112px desktop drawing — but it is only mounted on
 *    `/blajhunt-legacy`, the vertical roadmap the swipe retired, so it is
 *    kept in step with this set rather than designed against.
 *  · Decorative: every instance is `aria-hidden`, and the card beside it
 *    already carries the stop's name. Nothing here is the only copy of
 *    anything.
 *
 * ── NOTHING MAY CROSS ANYTHING ─────────────────────────────────────────────
 * These are stroke-only with no fill, so there is no paint order and no
 * occlusion: a line drawn "in front" does not hide the line behind it, it
 * simply crosses it. That is a rendering fact, not a style choice, and it is
 * what made the shop read as broken — the facade ran from y=18 while the
 * awning band sat at y=21..27, so both shop walls were drawn straight THROUGH
 * the awning and the awning read as a transparent smear over the storefront.
 *
 * The fix is geometric and it is the rule for every glyph in this file: where
 * two parts meet, they meet at a shared endpoint. The shop's walls now begin
 * at x=6 and x=42, which are exactly where the awning's scalloped edge ends;
 * the cathedral's nave roof springs from (14,25) and (34,25), which are
 * exactly the towers' inner walls; the college's tower walls stop dead on the
 * cornice at y=24. Where an eave is meant to overhang, it clears the wall top
 * entirely rather than nicking it — check the arithmetic, a 0.3-unit crossing
 * is invisible in review and visible on a phone.
 *
 * ── The gilt, and why the gradient is `userSpaceOnUse` ─────────────────────
 * The drawings used to be flat `--contrast-text` at 70% opacity, which over
 * the near-white plate renders about #97874b: not gold, olive. They are now
 * painted with a vertical gilt ramp, `--glyph-gold-lit` at the spires down to
 * `--glyph-gold-deep` at the ground line.
 *
 * `gradientUnits="userSpaceOnUse"` is load-bearing and is NOT the default.
 * With the default `objectBoundingBox` a gradient resolves against the bbox of
 * each element that REFERENCES it — and since the stroke is inherited from the
 * `<svg>`, that is every path separately. The ground line, being 0 units tall,
 * comes out flat and light; a churchyard cross low in the frame gets its own
 * full light-to-dark ramp instead of the dark it should be at that height. The
 * glyph reads patchy rather than lit. Confirmed by rendering both side by side
 * before choosing — it is not visible in the markup, only in the pixels.
 *
 * The two stops are `--glyph-gold-lit` and `--glyph-gold-deep`, registered in
 * `globals.css`. They are passed through `style` rather than the `stop-color`
 * attribute on purpose: presentation attributes do not accept `var()`, the CSS
 * property does. Rendered contrast on the plate's darkest ground (`--muted`,
 * #f4f4f5) is 3.26:1 at the lit end and 7.5:1 at the deep end, both clearing
 * the 3:1 floor for a graphic — and the lit end is the one to re-check if
 * anyone brightens it, because #b8880e already falls under.
 */

export type GlyphName =
  | "cathedral"
  | "school"
  | "chapel"
  | "castle"
  | "townhouse"
  | "shop"
  | "archive"
  | "college"
  | "monument"
  | "office";

/**
 * The glyph for each stop, in the order `BLAJHUNT_STOPS` declares them.
 * Index-mapped rather than added to the shared content module, because that
 * module is read-only and shared with the other two variants.
 */
export const STOP_GLYPHS: readonly GlyphName[] = [
  "cathedral", // 01 Catedrala Arhiepiscopală Majoră „Sfânta Treime”
  "school", //    02 Liceul „Ștefan Manciulea” și Grădina Botanică
  "chapel", //    03 Biserica Grecilor
  "castle", //    04 Castelul Mitropolitan
  "townhouse", // 05 Casa Maniu
  "shop", //      06 Magazinul Gostat
  "archive", //   07 Casa Ioan Suciu
  "college", //   08 Colegiul „Inochentie Micu Clain” și Capela Arhiereilor
  "monument", //  09 Câmpia Libertății
  "office", //    10 Protopopiatul Blaj
] as const;

const GROUND = <path d="M4 43H44" />;

const DRAWINGS: Record<GlyphName, React.ReactNode> = {
  // Two towers under onion cupolas, a nave between them with a rose window and
  // an arched door. The nave has no walls of its own: the towers' inner faces
  // at x=14 and x=34 already run the full height, and drawing the nave's box
  // on top of them would double the stroke on those two lines.
  cathedral: (
    <>
      {GROUND}
      <path d="M6 43V17h8v26" />
      <path d="M6 17c0-4.5 2-7 4-9.5 2 2.5 4 5 4 9.5" />
      <path d="M10 7.5V3.5M8.2 5.4h3.6" />
      <path d="M8 31.5V28a2 2 0 0 1 4 0v3.5" />
      <path d="M34 43V17h8v26" />
      <path d="M34 17c0-4.5 2-7 4-9.5 2 2.5 4 5 4 9.5" />
      <path d="M38 7.5V3.5M36.2 5.4h3.6" />
      <path d="M36 31.5V28a2 2 0 0 1 4 0v3.5" />
      <path d="M14 25l10-6 10 6" />
      <circle cx="24" cy="29.5" r="2.6" />
      <path d="M20 43v-5a4 4 0 0 1 8 0v5" />
    </>
  ),

  // A two-storey civic range under a cornice and a low pediment — NOT the same
  // gabled house as `archive`, which is the confusion this set is most prone
  // to — and the botanical garden's tree beside it.
  //
  // The canopy is five arcs around a circle of radius 5.2, each drawn at
  // radius 3.2 against a 6.11-unit chord so it bulges 2.25 units proud. A
  // plain circle was tried first and read as a balloon on a stick; the lobes
  // and the forked trunk are what make it a tree. The trunk stops at y=32.4,
  // which is the canopy's lowest point, so it meets the foliage instead of
  // running through it.
  school: (
    <>
      {GROUND}
      <path d="M6 43V19h22v24" />
      <path d="M4 19h26" />
      <path d="M11 19l6-5.5 6 5.5" />
      <circle cx="17" cy="17" r="1.4" />
      <path d="M8 23.5h5.5v6H8z" />
      <path d="M20.5 23.5H26v6h-5.5z" />
      <path d="M8 33h5.5v6H8z" />
      <path d="M20.5 33H26v6h-5.5z" />
      <path d="M14.25 43v-6.5a2.75 2.75 0 0 1 5.5 0V43" />
      <path d="M37.5 43V32.4M37.5 37l-2.8-2.8M37.5 39l2.8-2.8" />
      <path d="M37.5 19.8a3.2 3.2 0 0 1 4.946 3.593a3.2 3.2 0 0 1-1.89 5.814a3.2 3.2 0 0 1-6.112 0a3.2 3.2 0 0 1-1.89-5.814a3.2 3.2 0 0 1 4.946-3.593z" />
    </>
  ),

  // A west tower with a spire, a lower nave behind it, and a churchyard cross
  // on a stone block beside it. The grave marker went through three drafts: a
  // cross on a mound read as eyebrows, a round-topped slab read as a door, and
  // a splayed plinth read as an easel. A plain block is what reads as stone.
  chapel: (
    <>
      {GROUND}
      <path d="M6 43V18h9v25" />
      <path d="M4.5 18l6-9 6 9" />
      <path d="M10.5 9V4.5M8.7 6.5h3.6" />
      <path d="M8.5 27v-4a2 2 0 0 1 4 0v4" />
      <path d="M8.5 43v-6a2 2 0 0 1 4 0v6" />
      <path d="M31 43V25" />
      <path d="M15 25l8-6 8 6" />
      <circle cx="23" cy="22" r="1.8" />
      <path d="M18 34v-3.5a2.25 2.25 0 0 1 4.5 0V34" />
      <path d="M25.5 34v-3.5a2.25 2.25 0 0 1 4.5 0V34" />
      <path d="M38 40V27.5M34 31.5h8" />
      <path d="M35 43v-3h6v3" />
    </>
  ),

  // Two round towers under cones, a crenellated curtain wall between them, a
  // gate with a portcullis, and a pennant. The curtain wall needs no side
  // edges of its own: it runs from x=14 to x=34, which are the towers' inner
  // faces.
  castle: (
    <>
      {GROUND}
      <path d="M5 43V19h9v24" />
      <path d="M3.5 19l5.5-9 5.5 9" />
      <path d="M9 10V5h4.5l-1.6 1.8 1.6 1.8H9" />
      <path d="M7.5 30v-3a2 2 0 0 1 4 0v3" />
      <path d="M34 43V19h9v24" />
      <path d="M32.5 19l5.5-9 5.5 9" />
      <path d="M36.5 30v-3a2 2 0 0 1 4 0v3" />
      <path d="M14 26h1.75v-3h3.5v3h3.5v-3h3.5v3h3.5v-3h3.5v3H34" />
      <path d="M20 43v-7a4 4 0 0 1 8 0v7" />
      <path d="M22.7 43v-9M25.3 43v-9" />
    </>
  ),

  // A town house whose story is on the first floor: a balcony, and look up.
  //
  // The old drawing was a face — two square windows for eyes over a slatted
  // box for a mouth, which is what a bare balcony reads as when it is the only
  // thing under a symmetrical pair. The arched French window between the two
  // upper windows breaks it: three openings on that floor, not two.
  townhouse: (
    <>
      {GROUND}
      <path d="M9 43V17h30v26" />
      <path d="M7 17l17-8 17 8" />
      <path d="M12 21h5v5.5h-5z" />
      <path d="M31 21h5v5.5h-5z" />
      <path d="M21.5 27v-4.5a2.5 2.5 0 0 1 5 0V27" />
      <path d="M18 28h12" />
      <path d="M17.5 31.5h13" />
      <path d="M21 28v3.5M24 28v3.5M27 28v3.5" />
      <path d="M12 33h5v5.5h-5z" />
      <path d="M31 33h5v5.5h-5z" />
      <path d="M21 43v-7a3 3 0 0 1 6 0v7" />
    </>
  ),

  // A corner shop, stacked so nothing crosses: signboard, then the awning bar
  // it sits on, then the awning splaying out to a scalloped edge, and only
  // then the shopfront — whose walls start at x=6 and x=42, the exact points
  // the scallop ends. This is the glyph the no-crossing rule was written for;
  // see the note at the top of the file.
  shop: (
    <>
      {GROUND}
      <path d="M11 18V13h26v5" />
      <path d="M9 18h30" />
      <path d="M9 18L6 24" />
      <path d="M39 18l3 6" />
      <path d="M6 24q3 4 6 0q3 4 6 0q3 4 6 0q3 4 6 0q3 4 6 0q3 4 6 0" />
      <path d="M6 24v19" />
      <path d="M42 24v19" />
      <path d="M9 43V30h10v13" />
      <path d="M29 43V30h10v13" />
      <path d="M21 43V29h6v14" />
      <circle cx="25.4" cy="36.5" r="1" />
    </>
  ),

  // A memorial house: steep roof, chimney, a gable roundel, a paned window,
  // and a plaque with a cross on it beside the door.
  //
  // This used to be a house with a full-height sheet of PAPER standing next to
  // it, dog-eared corner and all, at nearly the height of the building. It was
  // meant to read as a document outliving the man; it read as a stray icon
  // that had wandered into the frame. The marker belongs ON the wall, and it
  // is drawn landscape (8x4.5) so it cannot be mistaken for the square window
  // on the other side of the door.
  archive: (
    <>
      {GROUND}
      <path d="M10 43V24h28v19" />
      <path d="M7 24l17-10 17 10" />
      <path d="M30 17.5V12h3v7.3" />
      <circle cx="24" cy="20" r="1.9" />
      <path d="M13 28h6.5v6.5H13z" />
      <path d="M16.25 28v6.5M13 31.25h6.5" />
      <path d="M27.5 29h8v4.5h-8z" />
      <path d="M31.5 30v2.5M30.25 31.25h2.5" />
      <path d="M20.5 43v-9h6.5v9" />
    </>
  ),

  // A long institutional range — four arches under four windows — with the
  // chapel tower over the middle bays. The range has no top edge of its own:
  // the cornice at y=24 is that line, and drawing both would double it.
  college: (
    <>
      {GROUND}
      <path d="M5 43V24" />
      <path d="M43 43V24" />
      <path d="M3 24h42" />
      <path d="M16 15h16" />
      <path d="M16 15l8-6.5 8 6.5" />
      <path d="M18 15v9M30 15v9" />
      <path d="M24 8.5V4M22.2 6h3.6" />
      <circle cx="24" cy="19.5" r="2.2" />
      <path d="M7.5 27h5v4h-5z" />
      <path d="M16.5 27h5v4h-5z" />
      <path d="M26.5 27h5v4h-5z" />
      <path d="M35.5 27h5v4h-5z" />
      <path d="M6.5 43v-6a3.5 3.5 0 0 1 7 0v6" />
      <path d="M15.5 43v-6a3.5 3.5 0 0 1 7 0v6" />
      <path d="M25.5 43v-6a3.5 3.5 0 0 1 7 0v6" />
      <path d="M34.5 43v-6a3.5 3.5 0 0 1 7 0v6" />
    </>
  ),

  // Câmpia Libertății. THE ONLY GLYPH IN THIS SET DRAWN FROM A PHOTOGRAPH —
  // the user supplied one, so this stop alone is a portrait rather than an
  // archetype. It is a modernist concrete trilithon: two slab piers carrying
  // one deep cantilevered beam, standing on a paved plaza behind a long low
  // inscription wall.
  //
  // It replaces an obelisk on a stepped plinth, which was simply the wrong
  // building.
  //
  // ── Two failure modes, and they pull against each other ────────────────────
  // The brief was "must not read as a Japanese shrine", and the naive Π does
  // read as a torii. But the first fix overshot into a second, worse failure:
  //
  //  · TOO NARROW A SLOT AND IT IS A FLUTED COLUMN. Outline-only art cannot
  //    say "solid" or "void" — it can only say "line". Four verticals at
  //    roughly even spacing group as ONE shaft with flutes, which is what the
  //    photo-accurate proportions produce (the real slot is about half a
  //    pier's width). A stepped plinth underneath makes it worse: it reads as
  //    a column base and welds the two piers into one object. So the piers
  //    land straight on the ground, the slot is 8 against piers of 4, and the
  //    wall is pushed out to the sides as wings. The eye then groups them as
  //    two legs. This is a deliberate departure from the photograph, and it is
  //    the one place in this set where legibility beat fidelity.
  //
  //  · WHAT KEEPS IT OFF THE TORII is not the slot, it is everything else. A
  //    torii has TWO crossbeams, a kasagi that sweeps up at the ends, poles
  //    that batter inward, and a central plaque. This has one straight beam,
  //    square-cut, tapering so its underside is NARROWER than its top (a
  //    torii's does the opposite), vertical piers, the low inscription wings,
  //    and the bronze group standing in the slot — a torii's opening is empty
  //    by definition. Checked by rendering an actual torii beside it; they are
  //    not confusable.
  //
  // The wings stop at x=16 and x=32 rather than closing their own boxes,
  // because those verticals ARE the piers' outer faces and drawing them twice
  // doubles the stroke.
  monument: (
    <>
      <path d="M3 43h42" />
      <path d="M11 8L37 8L36.4 13L11.6 13Z" />
      <path d="M16 43V13M20 43V13" />
      <path d="M28 43V13M32 43V13" />
      <path d="M4 43v-3.5h12" />
      <path d="M6 41.4h8" />
      <path d="M44 43v-3.5H32" />
      <path d="M34 41.4h8" />
      <path d="M21.8 43v-5.5h4.4v5.5" />
    </>
  ),

  // A parish office: hipped roof under a cornice, a cross on the ridge, two
  // paned windows, and a deep arched entrance with a moulded surround.
  //
  // There used to be a bare 5-unit dash floating beside the door — no
  // referent, drawn at a height nothing else in the glyph shares. A columned
  // portico was tried in its place and read as a tent pitched inside the
  // building; the recessed arch is what says "civic" without adding a second
  // roof to a glyph that already has one.
  office: (
    <>
      {GROUND}
      <path d="M9 43V22M39 43V22" />
      <path d="M7 22h34" />
      <path d="M11 22l4-5h18l4 5" />
      <path d="M24 17v-6M21.8 13.6h4.4" />
      <path d="M10.5 27h6v7h-6z" />
      <path d="M13.5 27v7" />
      <path d="M31.5 27h6v7h-6z" />
      <path d="M34.5 27v7" />
      <path d="M19 43V32a5 5 0 0 1 10 0v11" />
      <path d="M21.5 43v-8a2.5 2.5 0 0 1 5 0v8" />
    </>
  ),
};

export function StopGlyph({
  name,
  className,
}: {
  name: GlyphName;
  className?: string;
}) {
  /* Derived from the glyph's name rather than `useId()`, because this is a
     server component and hooks are not available in one. Each name renders at
     most once per page — the trail draws ten distinct stops — and two
     identical gradients under one id would in any case resolve to the same
     ramp, since `userSpaceOnUse` makes it independent of the referencing
     element. */
  const giltId = `stop-glyph-gilt-${name}`;

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke={`url(#${giltId})`}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        {/* y1/y2 span the drawing, not the viewBox: the artwork lives between
            the tallest cross at y=3.5 and the ground line at y=43, so ramping
            over 0..48 would spend a tenth of the gradient above and below
            anything that is drawn and flatten both ends. */}
        <linearGradient
          id={giltId}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="3.5"
          x2="0"
          y2="43"
        >
          <stop offset="0" style={{ stopColor: "var(--glyph-gold-lit)" }} />
          <stop offset="1" style={{ stopColor: "var(--glyph-gold-deep)" }} />
        </linearGradient>
      </defs>
      {DRAWINGS[name]}
    </svg>
  );
}
