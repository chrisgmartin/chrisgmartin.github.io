---
name: add-guide
description: Add a new guide to an existing topic. Creates the guide folder under the topic with a hub index.html and a 00-START-HERE chapter, registers it in SITE_NAV, and adds a card to the topic page.
---

# Add a guide to a topic

Use when the user says "add a guide to <topic>" or "create a guide for <subject>".

## Layout reminder

The folder structure matches the site hierarchy:
```
<topic-folder>/
  index.html              ← topic page
  <guide-folder>/         ← guide lives INSIDE the topic
    index.html            ← guide hub
    00-START-HERE.html, … ← chapters
```

## Inputs

Ask via AskUserQuestion if not provided:
- **Topic**: which existing topic. Look up topics from `SITE_NAV` in `assets/script.js`.
- **Display name**: e.g. "Cloud Cost Engineering".
- **Folder name**: kebab-case, e.g. `cloud-cost-engineering`.
- **Description**: one-line text for the topic-page card and the catalog summary.
- **Format badge** (optional): one of `format-prep`, `format-build`, `format-deepdive`, `format-reference`, `format-notes`.
- **Tag chips** (optional): zero to four short labels.

## Steps

1. Create the folder `<topic-folder>/<guide-folder>/` (inside the topic).

2. Generate `<topic-folder>/<guide-folder>/index.html` (the guide hub). Use `ai-engineering/ai-engineer-compliance/index.html` as the structural template. Required pieces:
   - Assets at `../../assets/style.css` and `../../assets/script.js` (guide hubs are 2 levels deep).
   - `<div class="layout layout-wide">` wrapping `<aside class="sidebar" id="sidebar">` (with the standard mobile-toc-toggle button + an `On this page` `<h2>` whose `<a>` items target section anchors below) and `<main>`.
   - Hand-authored `<nav class="crumbs">` breadcrumb at the top of `<main>`:
     - `← Home` → `../../index.html`
     - `<Topic name>` → `../index.html` (the parent topic page)
     - `<Guide name>` → aria-current span (no link)
   - `<header class="hero">` with an eyebrow, h1 = guide name, subtitle = description.
   - Initial `<div class="section-label" id="orient">Section A · Orient</div>` + a `<div class="guide-grid">` with the card for the 00-START-HERE chapter (created in the next step).
   - A `<footer>` with an "About this guide" paragraph; "Shared styling lives in …" line references `../../assets/style.css` and `../../assets/script.js`.
   - `<button class="theme-toggle" id="themeToggle">🌙</button>` before `</body>`.

3. Generate `<topic-folder>/<guide-folder>/00-START-HERE.html` via the `add-chapter` conventions. Asset paths are `../../assets/...`. No manual breadcrumb (auto-injected).

4. Register in `assets/script.js` SITE_NAV. Locate the topic entry and append to its `guides` array:
   ```js
   { name: '<Guide display name>', folder: '<guide-folder>' }
   ```
   Watch comma placement when an entry already exists.

5. Add a card to `<topic-folder>/index.html`:
   - Append a new `<a class="guide-card" href="<guide-folder>/index.html">` inside the existing `<div class="guide-grid">` with name, description, format badge, and tag chips. (Topic page is at depth 1; guide is its direct child, so href is just the guide folder.)
   - Bump the `<span class="count">N guides</span>` in the `.topic-head` block.

6. Verify with `grep`:
   - `grep -n "<guide-folder>" assets/script.js` finds the SITE_NAV entry.
   - `grep -l "<guide-folder>" <topic-folder>/index.html` returns the topic page.
   - Open the new hub in a browser — confirm breadcrumb, sidebar `Browse all guides` panel (topic is active), and first chapter card render.

## Gotchas

- Folder names are kebab-case and form URL segments: `/<topic>/<guide>/`.
- The topic name in the breadcrumb must exactly match the `name` field in the SITE_NAV topic entry (the auto-injected breadcrumb on chapter pages uses this string).
- SITE_NAV only stores the topic folder + the guide folder name. The full path is reconstructed at runtime as `<topic.folder>/<guide.folder>/`.
- Guide hubs are 2 levels deep — asset paths use `../../assets/...`, not `../assets/...`.
