# Guide plates

Every guide hub (and the Claude Skills topic page) carries a **plate**: a hand-drawn, whiteboard-style
sketch of the guide's central idea, beside the hero. Plates are **static SVG inlined in the page** —
no runtime drawing library, no CDN. They follow the theme because ink is `var(--text)`, the wash
`var(--secondary)` and the red marker `var(--accent)`.

- `boards.js` — one spec per guide, keyed by guide path (`data-engineering/data-systems-design`).
  A small DSL: `d.title`, `d.box`, `d.round`, `d.cloud`, `d.cyl`, `d.arrow`, `d.connect(a,b)` (edge to
  edge), `d.route([[x,y],…])`, `d.flow(y,[labels])`, `d.stack`, `d.timeline`, `d.grid`, `d.venn`,
  `d.bubble`, `d.ring` (red circle), `d.underline`, `d.strike`, `d.check`, `d.cross`, `d.star`,
  `d.note`, `d.text`. Canvas is 400×320. `{wash:1}` tints a box; `{red:1}` draws in the accent.
- `render.html` — draws one board with the vendored rough.js and exposes the SVG markup.
- `build.py` — renders every board with headless Chrome and inlines it into the hub between
  `<figure class="plate">…</figure>`, wrapping the hero text in `.hero-text` and adding `.has-plate`.
- `vendor/rough.js` — rough.js 4.6.6 (MIT), used only at build time.
  Source: npm `roughjs@4.6.6`, file `bundled/rough.js`
  (https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.js), SHA-256
  `6853af8619532f3939b156cd16824d2e14f31e71d3df306ad5558eeafacab194`. Verify before replacing:
  `shasum -a 256 tools/plates/vendor/rough.js`.

## Adding or changing a plate

1. Write (or edit) the spec in `boards.js`. Say the guide's *idea* — the method, the ladder, the
   loop, the trade-off — not its keywords. Keep labels clear of arrows.
2. `python3 tools/plates/build.py <guide-path>` (or no argument for all).
3. Look at it: open the hub locally (see CLAUDE.md → *Local review*) or render a contact sheet
   from the experiments gallery. Fix collisions, rebuild.
4. Bump the shared-asset version if `style.css` changed; commit the hub HTML with the spec.

`build.py` is idempotent — rerunning replaces the existing figure.
