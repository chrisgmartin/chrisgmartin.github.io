# Chapter components

Everything below already exists in `assets/style.css` / `assets/script.js`. Use these; do not invent classes. When in
doubt, grep an existing chapter for the class and copy its markup.

## Callouts — one idea the reader must not miss

```html
<div class="callout insight">
  <span class="callout-label">Why "copy the data out" is non-negotiable</span>
  <p>…</p>
</div>
```

| Variant | Use for |
|---|---|
| `insight` | the non-obvious "why" — the reframe a senior person would give |
| `tip` | a practical move that saves time or money |
| `warn` | a trap that costs you later (a footgun, a stale assumption) |
| `danger` | a mistake that is expensive or irreversible (data loss, a compliance breach, an interview-ending answer) |

The label is a claim or a named trap, never "Note" / "Tip" / "Important". At most one callout per section as a rule;
never two in a row.

## Diagrams — `.flow`

Pre-formatted ASCII for processes, layouts, request paths and side-by-side contrasts. Keep lines ≤ 84 characters, use
box-drawing characters, label the arrows. Escape `<`, `>` and `&`.

```html
<div class="flow">[Question]
   ↓
[Embed question]
   ↓
[Top-K search]</div>
```

## Code

```html
<div class="code-wrap">
<div class="code-header"><span class="filename"><span class="dot"></span>models/fct_rentals.sql</span><button class="copy-btn">Copy</button></div>
<pre><code class="language-sql">select …</code></pre>
</div>
```

Without a filename: `<div class="code-wrap"><button class="copy-btn">Copy</button><pre><code class="language-python">…</code></pre></div>`.
Languages in use: `sql`, `python`, `bash`, `yaml`, `rust`, `solidity`, `text`. A chapter with code needs the two
SRI-pinned highlight.js tags in `<head>` — copy them verbatim (with `integrity` and `crossorigin`) from a chapter that
has them.

## Tables

Plain `<table>` with `<thead>`. Wrap wide tables in `<div style="overflow-x: auto;">`. `<th class="pick">` / matching
`<td>`s highlight the recommended column in a decision table; `<td class="term">` is the term column of a glossary. Use
a table only when rows share the same attributes — otherwise write prose.

## Folded content

```html
<details class="reveal">
  <summary>Show answer</summary>
  <div class="reveal-body"><p>…</p></div>
</details>
```

`reveal` hides an answer or solution the reader should attempt first. `collapse-card` (same shape:
`details.collapse-card` › `summary` › `div.collapse-card-body`) holds optional depth — an exercise, an alternative
schedule, a long derivation.

## Practice and prep

- `<button class="practice-check" data-id="q1">practiced</button>` inside an `<h2>`/`<h3>` — a per-item "done" toggle
  saved in localStorage. `data-id` must be unique within the page.
- `<div class="qa"><h3>Q1. … </h3><details class="reveal"><summary>Model answer</summary>…</details></div>` — interview
  Q&A.
- `<div class="talking-point"><p><em>"…"</em></p></div>` — words to say aloud, first person, with `[placeholders]` for
  the reader's own facts.
- `<span class="step-num">1</span>` at the start of an `<h2>` — numbered problems or build steps.
- `<ul class="checklist" data-storage-key="unique-key"><li data-key="py"><span class="check-box"></span><span class="check-label">…</span></li></ul>`
  — a persistent tick-list (prerequisites, pre-flight).

## Links

Intra-site links are relative and keep the `.html` suffix (`06-data-modeling.html#scd`,
`../../data-engineering/<guide>/03-….html`). External links: `target="_blank" rel="noopener"`.

## Closing sections

```html
<section id="check">
  <h2>✓ Check yourself</h2>
  <p>Answer from memory before opening each one.</p>
  <ol>
    <li>
      <p>Question…</p>
      <details class="reveal"><summary>Show answer</summary><div class="reveal-body"><p>…</p></div></details>
    </li>
  </ol>
</section>

<section id="takeaway">
  <h2>Takeaway</h2>
  <ul><li>A complete claim.</li></ul>
  <p>Hand-off sentence. → <a href="06-data-modeling.html">Data Modeling</a></p>
</section>

<section id="further-reading">
  <h2>Further reading</h2>
  <ul>
    <li><a href="https://…" target="_blank" rel="noopener"><strong>Title</strong></a> — author, year. What it is good for.</li>
  </ul>
</section>
```
