---
name: add-topic
description: Add a brand-new topic landing page. Creates /<topic>/index.html, adds a topic card to the root catalog, and appends a SITE_NAV entry with an empty guides list.
---

# Add a topic

Use when the user says "add a topic" or "create a topic page for X". Rare — only needed when introducing a new top-level area of the catalog.

## Inputs

Ask via AskUserQuestion if not provided:
- **Display name**: e.g. "MLOps & Infrastructure".
- **Folder name**: kebab-case, e.g. `mlops-infra`. Derive from the display name if not given.
- **Description**: one-line text for the root catalog card and the topic-page subtitle.
- **Tag chips** (optional): three to four short labels summarizing the area, for the catalog card.

**Validate before writing anything.** These values are pasted into JS string literals, JSON, HTML and shell commands,
so reject (and re-ask) rather than escape:
- Folder name must match `^[a-z0-9]+(-[a-z0-9]+)*$`.
- Display name, description and tag chips must not contain `'`, `"`, `\`, `<`, `>`, `$` or a backtick. Use typographic
  quotes (’ “ ”) instead of straight ones.

## Steps

1. Create `<folder>/index.html`, using `data-engineering/index.html` as the structural template (the **Catalog** layout:
   `<main class="wrap topic">`, crumbs, `.hero` with eyebrow "Topic" / h1 / subtitle / `.stat` line, a `.dist` format bar
   with legend, then `.catalog` with a `.cat-head`, one `.cat-group` per format and numbered `<li><a>` rows carrying
   `.n .t .d`, a `.badge.format-*`, `.c` (length) and `.r` (read time = chapters × 8 min)). Update:
   - `<title>` and `<h1>` to the new topic name; breadcrumb `← Home › <Topic name>` (aria-current).
   - Hero subtitle = description; `.stat` = `0 guides · 0 chapters` until guides exist.
   - Optionally a plate beside the hero: add a spec keyed by the topic folder in `tools/plates/boards.js`, register the
     page in `EXTRA` in `tools/plates/build.py`, run the builder (see `tools/plates/README.md`).

2. Append a SITE_NAV entry in `assets/script.js` **and** a matching `DOMAINS` entry in `assets/nav.js`
   (`{ label: '<short>', name: '<Topic name>', folder: '<folder>', guides: [] }` — `label` is the global-bar text; keep it
   short, the bar has nine items):
   ```js
   {
     name: '<Topic name>',
     folder: '<folder>',
     guides: []
   }
   ```

3. Add the domain to the homepage atlas: append an entry to the JSON array in `<script type="application/json"
   id="atlas-data">` in `/index.html` (name, href, count, caption, and an *accurate* nodes/edges diagram in the 640×360
   viewBox — see the existing entries). It is strict JSON (double-quoted keys and strings, no trailing commas); the code
   that draws it is `assets/home.js`. Bump the hand-written totals
   in the section heading ("Eight domains") and footer ("N guides across N domains"). The old catalog card markup below
   is no longer used:
   ```html
   <a class="guide-card" href="<folder>/index.html">
     <span class="name"><Topic name></span>
     <p class="desc">Description.</p>
     <span class="meta">
       <span class="badge tag">tag1</span>
       <span class="badge tag">tag2</span>
     </span>
   </a>
   ```

4. Verify with `grep`:
   - `grep -n "<folder>" assets/script.js index.html` → both files reference it.
   - The new topic appears in the auto-injected `Browse all guides` panel on every page.
   - Clicking the catalog card lands on the new topic page; clicking `← Home` from there returns to the catalog.

## Gotchas

- Topic folder name and SITE_NAV `folder` must match exactly.
- New topics start with `guides: []`. Use the `add-guide` skill to populate.
- Bump the shared-asset version after editing `script.js`/`nav.js` (CLAUDE.md → *Shared-asset versioning*).
- For local review, add a *relative* symlink for the new folder in `experiments/palettes/site/` (see CLAUDE.md →
  *Local review*); never write outside the repo.
- Keep the two security `<meta>` tags (Content-Security-Policy, referrer) the template carries right after `<meta charset>`.
  Pages may not contain inline `<script>` code or `on*=` handlers — the CSP blocks them; put code in `assets/*.js`.

## Head block and sitemap

After the topic page exists, run `python3 tools/seo/build-head.py` — `git add` the new page(s) first (it walks tracked files); it writes the
   description / canonical / Open Graph / favicon block after `<title>` and refreshes `sitemap.xml`. Never hand-write that block.
