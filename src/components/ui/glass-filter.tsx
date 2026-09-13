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
 * turbulence -> contrast stretch -> blur -> displacement.
 *
 * THE STRETCH IS THE WHOLE EFFECT. Two-octave fractal noise sits within about
 * ±0.12 of mid-grey, and a displacement map moves pixels by
 * `scale x (value - 0.5)`, so without it a throw of 22 was moving the backdrop
 * by two or three pixels and the pane looked flat. The linear transfer
 * (slope 3 about 0.5) widens the map to its full range, clipping the extremes
 * into soft cells, and the blur rounds the cells off; at scale 28 that is a
 * typical ±6px and a maximum ±14px — waves of ~150px, which reads as water on
 * a pane rather than as a broken layer. The alpha table pins the map opaque so
 * premultiplication cannot bias the channels.
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
 * and the url instead. That cost an hour here.
 *
 * The frost layer is oversized by 1.5rem and clipped by its pane, so the
 * ±14px throw never samples past the edge of what is there.
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
        x="-10%"
        y="-10%"
        width="120%"
        height="120%"
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
        <feDisplacementMap
          in="SourceGraphic"
          in2="map"
          scale="28"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
