# Field Guides — project guide

Static site (plain HTML/CSS/JS, no build step for pages) published at **christopherm.xyz** (Cloudflare Pages)
and **chrisgmartin.github.io** (GitHub Pages). Both deploy automatically from `main` within ~2 minutes, so
**anything merged to `main` is public**. Long-form guides for senior practitioners across eight domains, plus a
reference list of Claude Skills.

## Layout

```
/index.html                      home — typographic hero + interactive domain atlas (one accurate diagram per domain)
/404.html                        not-found page (root-absolute asset paths)
/assets/style.css                shared stylesheet: tokens, layout, hubs, chapters, topic "Catalog" pages, plates
/assets/script.js                SITE_NAV (source of truth for topics/guides) + page enhancers + nav mounting
/assets/nav.js, nav.css          global bar (one dropdown per domain), guide sub-bar, Support, CHAPTERS manifest
/assets/home.js, 404.js          the home atlas and the 404 art (external so the CSP needs no inline script)
/assets/fonts.css, fonts/        self-hosted web fonts (OFL) — regenerate with tools/fonts/fetch-fonts.py
/_headers, _redirects            Cloudflare Pages: security headers incl. CSP; hide repo tooling from the site
/_config.yml                     GitHub Pages (Jekyll): `exclude` keeps CLAUDE.md and tools/ unpublished
/<topic>/index.html              topic page, depth 1 — Catalog layout (hero + stat, format bar, numbered rows)
/<topic>/<guide>/index.html      guide hub, depth 2 — hero + plate, "how to read" callout, section labels, chapter cards
/<topic>/<guide>/NN-*.html       chapters, depth 2 — sidebar (Sections + Navigation), hero, sections
/data-platform/becoming-a-data-platform-engineer/<course>/   the one nested curriculum (8 course hubs)
/claude-skills/<collection>/     reference hubs listing Agent Skills collections (no chapters; links out to SKILL.md)
/tools/plates/                   plate (whiteboard sketch) specs + builder      → tools/plates/README.md
/tools/nav/build-chapters.py     regenerates the CHAPTERS manifest in nav.js from the hubs
/tools/home/build-latest.py      regenerates the home page's Latest strip + list (git history + manifest)
/tools/fonts/fetch-fonts.py      re-fetches the self-hosted fonts into assets/fonts/ (network; rarely needed)
/.claude/skills/                 add-topic, add-guide, add-chapter, audit — follow them for structural changes
```

Asset paths are relative and depth-aware: `assets/…` (root), `../assets/…` (topic), `../../assets/…` (hub/chapter).

## Registrations — keep all four in sync

1. `SITE_NAV` in `assets/script.js` — topics and guides (name + folder).
2. `DOMAINS` in `assets/nav.js` — the global bar's dropdowns (label, name, folder, guide pairs).
3. `CHAPTERS` in `assets/nav.js` — guide → sections → chapters; drives the guide sub-bar, "NN of M", prev/next.
   Regenerate with `python3 tools/nav/build-chapters.py` after adding chapters/guides. Hand-maintained entries may
   set `unit` (e.g. `"skills"`) and give chapters an absolute `href`.
4. Homepage atlas data — the strict-JSON array in `<script type="application/json" id="atlas-data">` in `index.html`,
   drawn by `assets/home.js` — one entry per domain (name, href, count, caption, nodes, edges; optional `unit`). Update
   `count` when guides are added; the footer totals ("N guides across 8 domains") are hand-written.
5. Homepage **Latest** blocks — regenerate with `python3 tools/home/build-latest.py` (run it after the chapter
   manifest). It rewrites the two `<!-- LATEST:… -->` blocks in `index.html` from git history plus the manifest;
   `--check` fails if they are stale. Never hand-edit inside the markers.

## Shared-asset versioning (important)

Every page links `style.css?v=N` / `script.js?v=N`, and `script.js` loads `nav.css?v=N` / `nav.js?v=N`. Cloudflare
serves static assets with `max-age=14400`, so **whenever `style.css`, `script.js`, `nav.css` or `nav.js` changes,
bump N everywhere** (currently `v=13`; the same applies to `fonts.css`, `home.js` and `404.js`):

```
git ls-files -z '*.html' | xargs -0 perl -pi -e 's/(style\.css|script\.js|nav\.css|nav\.js|fonts\.css|home\.js|404\.js)\?v=13/$1?v=14/g'
perl -pi -e 's/(nav\.css|nav\.js|fonts\.css)\?v=13/$1?v=14/g' assets/script.js      # not an .html file — do this separately
# new, not-yet-committed pages are not in `git ls-files`: bump them by hand
```

## Design system

- Palette "Oxblood on Petrol": paper `#eef2f1` / surface `#f7faf9`, ink `#101f1e`, accent oxblood `#a3272a`,
  `--secondary` petrol `#0e5e5b`. Per-format hues `--f-prep / build / deepdive / curriculum / notes / reference` drive
  the format badges (filled chips) and topic distribution bars. Callouts: insight = accent, tip = petrol, warn = gold,
  danger = raspberry. Dark theme retuned to the same family. **No hard-coded colours** — use tokens or
  `color-mix(in srgb, var(--accent) N%, transparent)`.
- Type: Fraunces (headings), Inter (body), JetBrains Mono (labels/code), Patrick Hand (plate handwriting) — self-hosted
  in `assets/fonts/` via `assets/fonts.css`, loaded by `script.js` on every page (home and 404 link it directly). No
  Google Fonts or other font CDN.
- Format badges: `format-prep`, `format-build`, `format-deepdive`, `format-reference`, `format-notes`,
  `format-curriculum`. Topic pages group guides by these.
- Plates: every hub hero has a whiteboard-style sketch of the guide's central idea (`tools/plates`). Draw the *idea*
  (method, ladder, loop, trade-off), never a keyword collage. Static SVG; ink/wash/marker follow the tokens.
- Motion is restrained and respects `prefers-reduced-motion`. Hairline rows over shadowed cards.

## Hosting gotchas

- Cloudflare Pages serves **clean URLs** (`…/00-START-HERE.html` → `…/00-START-HERE`, `index.html` → `/`). Never parse
  `location.pathname` for a `.html` suffix; `script.js` resolves chapter slugs against `CHAPTERS`.
- Cloudflare returns `404.html` for unknown paths; GitHub Pages serves byte-exact files.
- `_headers` does not change Cloudflare's asset caching — the `?v=` bump is the real mechanism.
- **Content-Security-Policy.** Every page carries the CSP `<meta>` (plus `<meta name="referrer">`) right after
  `<meta charset>`, because GitHub Pages ignores `_headers`; `_headers` sends the same policy plus `frame-ancestors`.
  Scripts may come only from the site and `cdn.jsdelivr.net` (SRI-pinned highlight.js): **no inline `<script>` code, no
  `on*=` handlers, no new third-party origins** — put code in `assets/*.js` and data in `type="application/json"`
  blocks. Inline styles are allowed. Change the policy in both places together; the `audit` skill checks it.
- **Repo tooling is not published.** `CLAUDE.md`, `tools/`, `.claude/`, `.gitignore` and `_config.yml` live in the served
  root, so `_redirects` (Cloudflare) and `_config.yml` + Jekyll's dot/underscore rule (GitHub Pages) keep them off the
  sites. Add new repo-only paths to both files.

## Workflow

- Branch → commit → PR → merge; never commit design experiments. They live in **`experiments/`**, which is
  gitignored — mocks, palette studies, plate galleries and the review server. Nothing under it is ever published,
  and the project stays self-contained rather than scattering work outside the repo.
- **Local review**: `python3 experiments/palettes/serve-daemon.py` serves the repo's working tree at
  `http://localhost:8765/` — `experiments/palettes/site/` is a farm of *relative* symlinks back to the repo root, so
  add one when a new top-level folder appears. Mock pages sit beside them (`latest.html`, `plates.html`,
  `gallery.html`); each generator lives at `experiments/<topic>/gen.py` and derives its paths from `__file__`.
  Headless Chrome renders (`--headless=new --screenshot`) are the reliable way to check pages; the Chrome extension
  cannot screenshot localhost.
- Run the `audit` skill before a PR. Keep `job-finder/` (ignored) and any personal material out of commits.
- Commit/PR attribution lines are provided by the session; add them verbatim.
