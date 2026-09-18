---
name: audit
description: Validate structural consistency across the catalog — asset paths (depth-aware), sidebar shape, breadcrumb context, SITE_NAV vs disk, and broken intra-site links. Reports a pass/fail checklist; does not modify files.
---

# Audit the catalog

Use when the user says "audit", "check the guides", "validate the catalog", or asks for a consistency review.

This skill is **read-only** — it inspects and reports. If issues are found, summarize them and ask the user whether to fix them.

## Layout reminder

```
/                                       Home (depth 0)
├── index.html
├── assets/
├── <topic-folder>/                     Topic (depth 1)
│   ├── index.html
│   └── <guide-folder>/                 Guide (depth 2)
│       ├── index.html                  Guide hub
│       └── NN-*.html                   Chapters (depth 2)
```

Expected asset paths by depth:
- Root index.html: `assets/style.css`
- Topic index.html (depth 1): `../assets/style.css`
- Guide hub + chapters (depth 2): `../../assets/style.css`

## Checks

Run each check. Gather results into a single summary at the end.

### 1. SITE_NAV vs disk

- Parse `SITE_NAV` from `assets/script.js`.
- For each topic: confirm `<topic.folder>/index.html` exists.
- For each guide nested under a topic: confirm `<topic.folder>/<guide.folder>/index.html` exists.
- Walk the **tracked** top-level directories (`git ls-files | cut -d/ -f1 | sort -u`) — never untracked or gitignored
  ones such as `experiments/`, `job-finder/`, `.wrangler/` or `compliance-mcp/`, whose names must not appear in the
  report. For each tracked directory **not** in `{assets, .claude, tools}` and not a registered topic folder, flag it as an orphan.
- For each registered topic folder, list its subdirectories: any subdirectory not listed in the topic's `guides` array is an orphan guide.

### 2. Asset paths (depth-aware)

For every HTML file, determine its depth from the repo root, then verify the asset links match:
- Depth 0 (`/index.html`): `assets/style.css` + `assets/script.js`.
- Depth 1 (`/<topic>/index.html`): `../assets/...`.
- Depth 2 (`/<topic>/<guide>/*.html`): `../../assets/...`.

Flag any file using the wrong prefix.

### 3. Chapter sidebar shape

For every numbered chapter file (`<topic>/<guide>/[0-9]*.html`):
- Contains `<aside class="sidebar"` with a child `<nav>`.
- The `<nav>` contains `<h2>Navigation</h2>` somewhere (so `reorderSidebarSections()` can find it).
- `<main>` contains exactly one top-level `<h1>` (so `injectBreadcrumb()` can label the page).

Flag any chapter missing one or more.

### 4. Hub pages have manual breadcrumbs

Confirm a hand-authored `<nav class="crumbs">` exists in:
- Each topic page `<topic>/index.html`.
- Each guide hub `<topic>/<guide>/index.html`.

(Root `/index.html` does NOT need a breadcrumb.)

Verify guide-hub breadcrumb paths are depth-aware:
- `← Home` → `../../index.html`
- `<Topic name>` → `../index.html`

### 5. Theme toggle present

Every page with `<aside class="sidebar">` should also contain `<button class="theme-toggle" id="themeToggle">`. Flag any sidebar page missing it.

### 6. Broken intra-site links

`grep` all HTML files for `href="..."` values that look like local relative HTML paths (ends in `.html`, no `http://` or `https://`, no `mailto:`). For each, resolve relative to the source file and confirm the target exists.

Skip anchor-only hrefs (`#section`).

### 7. Registrations agree

- `DOMAINS` in `assets/nav.js` lists the same topics/guides as `SITE_NAV` (same folders, same order).
- Every guide in `SITE_NAV` has a `CHAPTERS` entry whose chapter files exist on disk (`python3 tools/nav/build-chapters.py
  --check` exits 0; it writes nothing).
- The homepage atlas data (`<script type="application/json" id="atlas-data">` in `index.html`) parses as JSON and has one
  entry per topic with the right `count`; the footer totals match.

### 8. Shared-asset version is uniform

All pages and the loads in `script.js` reference the same `?v=N` for `style.css`, `script.js`, `nav.css`, `nav.js`,
`fonts.css`, `home.js` and `404.js`. Flag any stragglers
(`git ls-files '*.html' assets/script.js | xargs grep -nE '\?v=[0-9]+' | grep -v 'v=<N>'`).

### 9. Home page Latest is current

`python3 tools/home/build-latest.py --check` exits 0 when the `<!-- LATEST:… -->` blocks match git history and the
manifest. Flag a non-zero exit (fix: run the tool without `--check`).

### 10. Every hub has a plate

Each guide hub (and `claude-skills/index.html`) contains `<figure class="plate">` inside `.hero.has-plate`. List hubs
without one (fix: add a spec to `tools/plates/boards.js` and run `tools/plates/build.py`).

### 11. Security baseline

- Every tracked HTML page outside `tools/` carries, right after `<meta charset>`, the Content-Security-Policy `<meta>`
  (identical to the `_headers` policy minus `frame-ancestors`) and `<meta name="referrer">`.
- No page outside `tools/` has an inline `<script>` without `src` (JSON data blocks `type="application/json"` are fine)
  or an `on*=` event-handler attribute.
- The only cross-origin resource a page references is `cdn.jsdelivr.net`, and every such `<script>`/`<link>` has
  `integrity` + `crossorigin`. (The CSP also allows `static.cloudflareinsights.com` / `cloudflareinsights.com` for the
  Web Analytics beacon Cloudflare injects at the edge — no page should reference them directly.)
  Fonts are self-hosted (`assets/fonts.css`); no page references `fonts.googleapis.com`.
- `_redirects` covers `/CLAUDE.md`, `/_config.yml`, `/.gitignore`, `/.claude/*`, `/tools/*`, and `_config.yml` excludes
  `CLAUDE.md` and `tools/`, so repo tooling is never published.

## Output format

Report as a checklist. For each check, show `✓` or `✗` with failing items beneath. Example:

```
✓ SITE_NAV vs disk: all entries resolve, no orphan folders.
✗ Asset paths: 1 file uses wrong depth
  - ai-engineering/ai-engineer-compliance/12-foo.html:8 — uses ../assets/ but is depth 2 (expected ../../assets/)
✓ Chapter sidebars: 40/40 chapters have required structure
✓ Hub breadcrumbs: 4/4 hubs have manual <nav class="crumbs"> with correct depths
✓ Theme toggle: present on every sidebar page
✗ Broken links: 1 reference to a missing file
  - ai-engineering/ai-engineer-compliance/index.html:120 — href="04-nonexistent.html"
```

End with a single-line summary: `N checks passed, M issues found.`

## Notes

- This skill does NOT fix anything and runs nothing that writes (every tool is invoked with `--check`). If the user wants fixes, propose them and confirm before editing.
- Skip `compliance-mcp/` — it's a separate Python project, not part of the HTML catalog.
