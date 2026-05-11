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
- Walk the disk: for each top-level directory **not** in `{assets, .claude, compliance-mcp}` and not a registered topic folder, flag it as an orphan.
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

- This skill does NOT fix anything. If the user wants fixes, propose them and confirm before editing.
- Skip `compliance-mcp/` — it's a separate Python project, not part of the HTML catalog.
