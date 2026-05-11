---
name: add-guide
description: Add a new guide to an existing topic. Creates the guide folder with a hub index.html and a 00-START-HERE chapter, registers it in SITE_NAV, and adds a card to the topic page.
---

# Add a guide to a topic

Use when the user says "add a guide to <topic>" or "create a guide for <subject>".

## Inputs

Ask via AskUserQuestion if not provided:
- **Topic**: which existing topic. Look up topics from `SITE_NAV` in `assets/script.js`. If only one topic plausibly fits, default to it but confirm.
- **Display name**: e.g. "Cloud Cost Engineering".
- **Folder name**: kebab-case, e.g. `cloud-cost-engineering`. Derive from the display name if not given.
- **Description**: one-line text for the topic-page card and the catalog summary.
- **Format badge** (optional): one of `format-prep`, `format-build`, `format-deepdive`, `format-reference`, `format-notes`.
- **Tag chips** (optional): zero to four short labels.

## Steps

1. Create the folder `<folder>/` at the repo root.

2. Generate `<folder>/index.html` (the guide hub). Use `ai-engineer-compliance/index.html` or `data-analytics-interview-prep/index.html` as the structural template. Required pieces:
   - Assets at `../assets/style.css` and `../assets/script.js`.
   - `<div class="layout layout-wide">` wrapping `<aside class="sidebar" id="sidebar">` (with the standard mobile-toc-toggle button + an `On this page` `<h2>` whose `<a>` items target section anchors below) and `<main>`.
   - Hand-authored `<nav class="crumbs">` breadcrumb at the top of `<main>`:
     `← Home  ·  <Topic name> (link to ../<topic-folder>/index.html)  ›  <Guide name> (aria-current)`
   - `<header class="hero">` with an eyebrow, h1 = guide name, subtitle = description.
   - At minimum one `<div class="section-label" id="orient">Section A · Orient</div>` followed by a `<div class="guide-grid">` containing the card for the 00-START-HERE chapter (created in the next step).
   - A `<footer>` with an "About this guide" paragraph and the standard "shared styling lives at …" line.
   - `<button class="theme-toggle" id="themeToggle">🌙</button>` before `</body>`.

3. Generate `<folder>/00-START-HERE.html` via the `add-chapter` conventions (sidebar with both `Sections` and `Navigation` h2s; `<h1>` inside `<main>`; no manual breadcrumb).

4. Register in `assets/script.js`. Locate the topic's `SITE_NAV` entry and append to its `guides` array:
   ```js
   { name: '<Guide name>', folder: '<folder>' }
   ```
   Watch comma placement when there's already an entry.

5. Add a card to `<topic-folder>/index.html`:
   - Append a new `<a class="guide-card">` inside the existing `<div class="guide-grid">` with name, description, format badge, and tag chips.
   - Bump the `<span class="count">N guides</span>` in the `.topic-head` block.

6. Verify with `grep`:
   - `grep -n "<folder>" assets/script.js` → SITE_NAV entry present.
   - `grep -l "<folder>" <topic-folder>/index.html` → topic card present.
   - The new hub renders the auto-injected `Browse all guides` panel and the new guide is marked active.

## Gotchas

- Folder names are kebab-case and form the URL (`/<folder>/`).
- The topic name in the breadcrumb must match the `name` field in the SITE_NAV topic entry exactly — that's what the injected breadcrumb on chapter pages will display.
- Don't move existing guide folders into the topic folder — the layout stays flat at the repo root; topic-membership is tracked in SITE_NAV.
