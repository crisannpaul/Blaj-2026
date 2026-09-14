/**
 * The refraction map for `glass-liquid` (globals.css, GLASS). Render it ONCE
 * on any page that uses that utility; the utility references it by id.
 *
 * After the 21st.dev liquid-glass dock, cut down to what actually does
 * something. The original's filter computed a specular-lit version of the
 * noise (`feComponentTransfer` -> `feSpecularLighting` -> `feComposite`) and
 * then never used it: `feDisplacementMap` reads `softMap`, the blurred raw
 * noise, so the lighting stages were dead weight rendered every frame. Its
 * numbers were also odd for a pane — `baseFrequency 0.001` is one wave per
 * thousand pixels, `scale 200` a ±100px throw, and the green channel was zeroed
 * so the whole backdrop simply shifted up by 100px. What is left here:
 * turbulence -> contrast stretch -> blur -> displacement, and a mask that
 * switches the displacement off along the pane's edge.
 *
 * THE STRETCH IS THE WHOLE EFFECT. Two-octave fractal noise sits within about
 * ±0.12 of mid-grey, and a displacement map moves pixels by
 * `scale x (value - 0.5)`, so without it a throw of 22 was moving the backdrop
 * by two or three pixels and the pane looked flat. The linear transfer
 * (slope 3 about 0.5) widens the map to its full range, clipping the extremes
 * into soft cells, and the blur rounds the cells off. The throw is `scale`:
 * 28 gave a typical ±6px and a maximum ±14px, and a cold review at 1440 read
 * that as "two or three lazy bulges" bending the marquee's straight gutters
 * into serpentine ribbons — a greasy pane, not water — while at 390 it was
 * part of what turned the photographs into a smear. It is 14 now: ±3px
 * typical, ±7px maximum, the same ~150px waves. The alpha table pins the map
 * opaque so premultiplication cannot bias the channels.
 *
 * THE THROW FADES TO NOTHING AT THE PANE'S EDGE. Chromium hands this filter
 * the frosted backdrop already clipped to the pane, so a throw at the pane's
 * edge pulls what lies past it — nothing — into view: the chip's edge went
 * wavy and a light seam opened along it, worst at the corners. That is what
 * the user saw on desktop Chrome on 14 Sep. The map is therefore neutral
 * (0.5 — no throw) in a band along the edge and ramps up over the next ~16px:
 * a flood over the filter region, blurred at σ=26 and re-thresholded to
 * 14·(α−0.9), is a mask that is 0 about 7px OUTSIDE the pane's edge, 0.5
 * about 16px inside it and 1 by ~26px. Measured on the page at 1440 with the
 * scale still at 28, ripple on against ripple off: 0% of the pixels in the
 * sheet's outer 10px move (was 16–28%), the ramp runs 10→24px, the interior
 * still moves as before (30%); the chip's 6px edge band went from 17.5% to
 * 1.0%. The mask was sized for a ±14px throw and is kept as is at ±7px.
 *
 * The band is measured from the FROST LAYER'S OWN BOX. The filter region is
 * `x=0 y=0 width=100% height=100%` — that box — and `glass-frost` oversizes it
 * past the pane by exactly 24px, in pixels, which is where the "7px outside"
 * comes from. The 24 there and the 26 / 14 / 0.9 here are one decision.
 *
 * Why a flood and not `SourceAlpha`: two masks eroded or blurred from
 * SourceAlpha changed NOTHING, to the decimal. Skia clamps those primitives at
 * the input's bounds, so a shape that fills its bounds never shrinks; only a
 * primitive with a region of its own — a flood — has an edge for the blur to
 * decay from. The two flood colours are not colours anyone sees: black is the
 * mask's shape and its RGB is never read, and `#808080` is the number 0.5,
 * which means "move nothing" to feDisplacementMap.
 *
 * WHERE IT WORKS. `filter: url()` bends the element it is on. Chromium paints
 * an element's `backdrop-filter` result into that element's own layer, so a
 * filter on the same element bends the frosted backdrop too — that is the
 * liquid. MEASURED, not assumed, against a striped test page: an `feOffset` of
 * 15px moved 85% of the pixels under the pane by that route, and 71% through
 * `backdrop-filter: url()` (the headless shell included). WebKit composites
 * the backdrop separately and the filter only sees the element's own (empty)
 * content, so Safari shows the frost and the fill without the wobble. Fine,
 * and deliberate: the layer it sits on carries no content and no fill of its
 * own (see `glass-frost`), so a browser that bends nothing draws nothing wrong
 * — no wavy edges on a flat tint.
 *
 * A trap for whoever tunes this next: changing `scale` (or any attribute) on
 * the live filter does NOT invalidate Chromium's cached backdrop, so an A/B
 * by `setAttribute` compares the same render with itself and reports ~2%
 * change at any throw. Toggle the layer's `filter` property between `none`
 * and the url instead — or point it at a second filter injected with another
 * id, which is how the edge mask was tried on the live page. That cost an
 * hour here.
 */
export function GlassFilter() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{ position: "absolute" }}
    >
      <filter
        id="glass-distortion"
        x="0"
        y="0"
        width="100%"
        height="100%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.005 0.008"
          numOctaves="2"
          seed="11"
          result="noise"
        />
        <feComponentTransfer in="noise" result="stretched">
          <feFuncR type="linear" slope="3" intercept="-1" />
          <feFuncG type="linear" slope="3" intercept="-1" />
          <feFuncA type="table" tableValues="1 1" />
        </feComponentTransfer>
        <feGaussianBlur in="stretched" stdDeviation="3" result="map" />

        {/* The edge mask: the frost box, blurred, re-thresholded. */}
        <feFlood floodColor="#000" floodOpacity="1" result="box" />
        <feGaussianBlur in="box" stdDeviation="26" result="boxSoft" />
        <feComponentTransfer in="boxSoft" result="mask">
          <feFuncA type="linear" slope="14" intercept="-12.6" />
        </feComponentTransfer>

        {/* The map inside the mask, neutral everywhere else. */}
        <feComposite in="map" in2="mask" operator="in" result="mapInside" />
        <feFlood floodColor="#808080" floodOpacity="1" result="neutral" />
        <feComposite
          in="mapInside"
          in2="neutral"
          operator="over"
          result="mapFaded"
        />

        <feDisplacementMap
          in="SourceGraphic"
          in2="mapFaded"
          scale="14"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
