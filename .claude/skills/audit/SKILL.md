---
name: audit
description: Validate structural consistency across the catalog — asset paths, sidebar shape, breadcrumb context, SITE_NAV vs disk, and broken intra-site links. Reports a pass/fail checklist; does not modify files.
---

# Audit the catalog

Use when the user says "audit", "check the guides", "validate the catalog", or asks for a consistency review.

This skill is **read-only** — it inspects and reports. If issues are found, summarize them and ask the user whether to fix them (or invoke `add-chapter` / `add-guide` etc. for structural fixes).

## Checks

Run each check. Gather results into a single summary at the end.

### 1. SITE_NAV vs disk

- Parse `SITE_NAV` from `assets/script.js`.
- For each topic: confirm `<topic.folder>/index.html` exists on disk.
- For each guide inside each topic: confirm `<guide.folder>/index.html` exists.
- For each directory at the repo root that **isn't** `assets`, `.claude`, `compliance-mcp`, or a known topic folder: confirm it's listed as a guide under some topic. Unregistered guide folders are orphans.

### 2. Asset paths

For every HTML file inside a guide folder or topic folder, the head should reference:
```
<link rel="stylesheet" href="../assets/style.css">
<script defer src="../assets/script.js">
```
Flag any file using `/assets/...` (absolute), `assets/...` (root-relative), or any other path.

The root `/index.html` should reference `assets/style.css` and `assets/script.js` (no `../`).

### 3. Chapter sidebar shape

For every numbered chapter file (`<guide>/[0-9]*.html`):
- Contains `<aside class="sidebar"` with a child `<nav>`.
- The `<nav>` contains `<h2>Navigation</h2>` somewhere (so `reorderSidebarSections()` can find it).
- `<main>` contains exactly one top-level `<h1>` (so `injectBreadcrumb()` can label the page).

Flag any chapter missing one or more.

### 4. Hub pages have manual breadcrumbs

For each hub page below, confirm it contains a hand-authored `<nav class="crumbs">`:
- Each topic page `<topic>/index.html`.
- Each guide page `<guide>/index.html`.

(Root `/index.html` does NOT need a breadcrumb — you're already home.)

### 5. Theme toggle present

Every page with `<aside class="sidebar">` should also contain `<button class="theme-toggle" id="themeToggle">`. Flag any sidebar page missing it.

### 6. Broken intra-site links

`grep` all HTML files for `href="..."` values that look like local relative HTML paths (ends in `.html`, no `http://` or `https://`, no `mailto:`). For each, resolve relative to the source file and confirm the target exists on disk.

Common false positives: anchor-only hrefs like `href="#section"` and hrefs starting with `#`. Skip those.

## Output format

Report as a checklist. For each check, show `✓` or `✗` plus the failing items beneath. Example:

```
✓ SITE_NAV vs disk: all entries resolve, no orphan folders.
✗ Asset paths: 1 file uses a non-relative path
  - some-guide/12-foo.html:8 — <link rel="stylesheet" href="/assets/style.css">
✓ Chapter sidebars: 40/40 chapters have required structure
✓ Hub breadcrumbs: 4/4 hubs (2 topic + 2 guide) have manual <nav class="crumbs">
✓ Theme toggle: present on every sidebar page
✗ Broken links: 2 references to missing files
  - ai-engineer-compliance/00-START-HERE.html:120 — href="04-nonexistent.html"
  - data-analytics-interview-prep/index.html:88 — href="missing-chapter.html"
```

End with a single-line summary: `N checks passed, M issues found.`

## Notes

- This skill does NOT fix anything. If the user wants fixes, propose them and confirm before editing.
- Skip `compliance-mcp/` — it's a separate Python project, not part of the HTML catalog.
