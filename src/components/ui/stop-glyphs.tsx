/**
 * Ten line glyphs, one per stop on the Blajhunt route.
 *
 * ── Why hand-drawn SVG and not photographs ──────────────────────────────────
 * The mockup (`creatives/Roadmap Glyphs.png`) shows detailed greyscale 3D
 * renders. Those do not exist in this repo and there is no photograph of any
 * of the ten objectives yet (SPEC section 7, A1/A2). Two reasons not to fill
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
 * ── Drawing rules, so ten glyphs read as one set ────────────────────────────
 *  · One 48x48 viewBox. Ground line at y=43, drawing inside x 3–45.
 *  · Stroke only, no fill, round caps and joins. Colour is `currentColor`.
 *  · Legible at 44px — that is the size on a phone, and it is the size that
 *    decides how much detail a glyph may carry. Anything under ~4 units wide
 *    disappears there, so nothing is drawn smaller than that.
 *  · `strokeWidth` is NOT set here. It is set by the caller per breakpoint,
 *    because a drawing rendered at 44px and the same drawing at 112px do not
 *    want the same weight in user units. See `trail.tsx`.
 *  · Decorative: every instance is `aria-hidden`, and the card beside it
 *    already carries the stop's name. Nothing here is the only copy of
 *    anything.
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
  // Two spires, a nave with a rose window, an arched door.
  cathedral: (
    <>
      {GROUND}
      <path d="M8 43V19h7v24" />
      <path d="M7 19l4.5-12L16 19" />
      <path d="M11.5 7V3M9.5 5h4" />
      <path d="M33 43V19h7v24" />
      <path d="M32 19l4.5-12L41 19" />
      <path d="M36.5 7V3M34.5 5h4" />
      <path d="M15 43V27h18v16" />
      <path d="M14 27l10-8 10 8" />
      <circle cx="24" cy="23.5" r="2.5" />
      <path d="M20 43v-7a4 4 0 0 1 8 0v7" />
    </>
  ),

  // A civic building under a cornice and a low pediment — NOT the same gabled
  // house as `archive`, which is the confusion this set is most prone to —
  // and the garden's tree beside it.
  school: (
    <>
      {GROUND}
      <path d="M5 43V21h19v22" />
      <path d="M3 21h23" />
      <path d="M8 21l6.5-5.5L21 21" />
      <circle cx="14.5" cy="18.6" r="1.5" />
      <path d="M7.5 26h4.5v5.5H7.5zM17 26h4.5v5.5H17z" />
      <path d="M12 43v-8.5h5V43" />
      <path d="M36.5 43V31" />
      <circle cx="36.5" cy="23" r="7.5" />
      <path d="M36.5 31v-6M36.5 27l-3.2-3.2M36.5 27l3.2-3.2" />
    </>
  ),

  // A small pitched-roof church with a cross on the ridge, a grave beside it.
  chapel: (
    <>
      {GROUND}
      <path d="M10 43V25h18v18" />
      <path d="M8 25l11-9 11 9" />
      <path d="M19 16v-5M16.5 13.5h5" />
      <path d="M16 43v-8a3 3 0 0 1 6 0v8" />
      <circle cx="19" cy="21" r="1.5" />
      <path d="M36 43v-7.5M33.5 38h5" />
      <path d="M31 43c1.5-2.6 8.5-2.6 10 0" />
    </>
  ),

  // Two round towers under cones, a crenellated curtain wall, a gate.
  castle: (
    <>
      {GROUND}
      <path d="M7 43V20h8v23" />
      <path d="M6 20l5-9 5 9" />
      <path d="M33 43V20h8v23" />
      <path d="M32 20l5-9 5 9" />
      <path d="M15 43V27h2v-3h4v3h6v-3h4v3h2v16" />
      <path d="M20 43v-7a4 4 0 0 1 8 0v7" />
    </>
  ),

  // A town house whose story is on the first floor: a balcony, and look up.
  townhouse: (
    <>
      {GROUND}
      <path d="M11 43V16h26v27" />
      <path d="M9 16l15-7 15 7" />
      <path d="M14 21h6v5h-6zM28 21h6v5h-6z" />
      <path d="M17 30h14v5H17z" />
      <path d="M20 30v5M24 30v5M28 30v5" />
      <path d="M21 43v-8h6v8" />
    </>
  ),

  // A corner shop: scalloped awning, a window and a door.
  shop: (
    <>
      {GROUND}
      <path d="M9 43V18h30v25" />
      <path d="M8 21h32" />
      <path d="M8 21l-2 6M40 21l2 6" />
      <path d="M6 27c1.5 2.5 4.5 2.5 6 0s4.5 2.5 6 0 4.5 2.5 6 0 4.5 2.5 6 0 4.5 2.5 6 0 4.5 2.5 6 0" />
      <path d="M13 43V31h9v12" />
      <path d="M27 43V31h7v12" />
    </>
  ),

  // A steep-roofed house with a chimney, and a sheet of paper that outlived
  // the boy who lived in it. The dog-eared corner is what keeps the sheet
  // from reading as a second, narrower building.
  archive: (
    <>
      {GROUND}
      <path d="M7 43V24h19v19" />
      <path d="M5 24l11.5-9L28 24" />
      <path d="M21 19.5V15h3v7" />
      <path d="M10 28h5v5h-5z" />
      <path d="M18 43v-9h5v9" />
      <path d="M31 40V22h7l4 4v14z" />
      <path d="M38 22v4h4" />
      <path d="M34 31h5M34 35h3" />
    </>
  ),

  // A long institutional range with a chapel tower over the middle bay.
  college: (
    <>
      {GROUND}
      <path d="M4 43V27h40v16" />
      <path d="M2 27h44" />
      <path d="M19 27V17h10v10" />
      <path d="M17.5 17L24 11.5 30.5 17" />
      <path d="M24 11.5V7M22 9.5h4" />
      <path d="M8 43v-6a3 3 0 0 1 6 0v6" />
      <path d="M21 43v-7a3 3 0 0 1 6 0v7" />
      <path d="M34 43v-6a3 3 0 0 1 6 0v6" />
    </>
  ),

  // The field, and the monument standing in the middle of it.
  monument: (
    <>
      <path d="M3 43h42" />
      <path d="M3 39c5-4 11-4 15 0M30 39c5-4 11-4 15 0" />
      <path d="M17 43v-3h14v3" />
      <path d="M20 40l1.5-26h5L28 40" />
      <path d="M21.5 14L24 9l2.5 5" />
    </>
  ),

  // A parish office: flat cornice, an arched gate, a cross over the roofline.
  office: (
    <>
      {GROUND}
      <path d="M12 43V22h24v21" />
      <path d="M10 22l14-8 14 8" />
      <path d="M24 14V9.5M22 11.5h4" />
      <path d="M15 27h6v6h-6zM27 27h6v6h-6z" />
      <path d="M21 43v-8h6v8" />
      <path d="M15 37.5h5" />
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
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {DRAWINGS[name]}
    </svg>
  );
}
