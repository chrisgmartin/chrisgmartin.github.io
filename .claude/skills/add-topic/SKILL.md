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

## Steps

1. Create `<folder>/index.html`, using `ai-engineering/index.html` as the structural template. Update:
   - `<title>` and `<h1>` to the new topic name.
   - Breadcrumb: `← Home  ›  <Topic name>` (aria-current).
   - Hero subtitle = description.
   - `.topic-head` shows `<span class="count">0 guides</span>` and an empty `<div class="guide-grid">` (or with a "coming soon" note).

2. Append a SITE_NAV entry in `assets/script.js`:
   ```js
   {
     name: '<Topic name>',
     folder: '<folder>',
     guides: []
   }
   ```

3. Add a topic card to root `/index.html` inside the existing `<div class="guide-grid">`:
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
