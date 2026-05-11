---
name: add-chapter
description: Add a new numbered chapter to an existing guide. Generates the HTML with the standard sidebar (Sections + Navigation h2s), wires it into the previous chapter's Next link, and adds a card to the guide hub.
---

# Add a chapter to a guide

Use when the user says things like "add a chapter to <guide> about X" or "create chapter NN in <guide>".

## Inputs

Ask via AskUserQuestion if not provided:
- **Guide**: the destination guide (display name or folder). Resolve against `SITE_NAV` in `assets/script.js`.
- **Title**: the chapter `<h1>` text.
- **Number**: chapter number — default to the next integer above `ls <guide>/[0-9]*.html`. For stretch-style suffixes (04a, 04b, …), match the existing pattern.
- **Outline**: optional — a short list of section names. If omitted, scaffold a single placeholder section.
- **Section group**: which `Section X · …` block on the guide hub the new card belongs to. Infer from chapter number if obvious; otherwise ask.

## Steps

1. Read an existing chapter of similar length as the structural template (e.g., `<guide>/00-START-HERE.html` for short, `<guide>/03-*.html` for longer). Copy its head + sidebar shape.

2. Generate `<guide>/<NN>-<slug>.html`:
   - Assets: `../assets/style.css` and `../assets/script.js`. Include the hljs CDN `<link>` + `<script>` if the chapter contains code blocks.
   - `<div class="layout">` → `<aside class="sidebar" id="sidebar">` with `<button class="mobile-toc-toggle">` + `<nav>`.
   - Inside `<nav>`, **two** `<h2>` blocks in this order:
     - `<h2>Sections</h2>` followed by `<a href="#anchor">` for each outline item.
     - `<h2>Navigation</h2>` followed by `<a href="index.html">↺ All guides</a>`, then a `← Previous: …` link (omit on chapter 00), then a `Next: … →` link (omit on the last chapter).
   - `<main>` with `<header class="hero">` containing a `<span class="eyebrow">`, the `<h1>` (this drives the auto-injected breadcrumb), optional `<p class="subtitle">`.
   - `<section id="anchor">` blocks matching the outline anchors.
   - `<button class="theme-toggle" id="themeToggle" title="Toggle theme">🌙</button>` before `</body>`.
   - **Do NOT hand-author a `<nav class="crumbs">`** — `injectBreadcrumb()` adds it at runtime.

3. Update the **previous** chapter's `Navigation` block: rewrite its `Next:` link to point at the new file. If you inserted between two existing chapters, also update the next chapter's `← Previous:` link.

4. Add a card to `<guide>/index.html` inside the matching `<div class="guide-grid">` under the chosen section:
   ```
   <a class="guide-card" href="<NN>-<slug>.html">
     <span class="number">NN</span>
     <span class="name">Title</span>
     <span class="desc">One-line description.</span>
   </a>
   ```
   Add `<span class="tags"><span class="badge …"></span></span>` only if the user requested specific badges.

5. Verify with `grep`:
   - The hub references the new file.
   - The previous chapter's `Next:` link points at the new file.
   - The new chapter's `<aside>` contains both `<h2>Sections</h2>` and `<h2>Navigation</h2>`.

## Gotchas

- Asset paths from a guide folder are `../assets/...`. Never absolute, never `assets/...`.
- Don't add a breadcrumb in the chapter file — it's injected by JS.
- Don't add a `<div class="site-nav">` panel — it's injected by JS.
- Every chapter must have a single `<h1>` inside `<main>` (used by the breadcrumb injector to label the current page).
