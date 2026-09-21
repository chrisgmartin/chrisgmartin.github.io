---
name: write-chapter
description: Write or substantially rewrite the body of a guide chapter — source mapping, topic checklist, drafting in the house voice with the site's components, a "Check yourself" block with folded answers, cross-links, further reading, and a mandatory self-review. Use after add-chapter/add-guide has scaffolded the file, or when asked to draft, expand, deepen or rewrite a chapter.
---

# Write a chapter

`add-chapter` builds the shell (sidebar, hero, registrations). This skill fills it. Use it when the user says "write
chapter NN", "draft the chapter on X", "expand/deepen/rewrite <chapter>", or hands over sources (papers, docs, a repo,
URLs, notes) to turn into a chapter or a whole guide. For a whole guide, run phases 1–2 once for the guide, then phases
3–6 per chapter.

References — read before drafting:
- [components.md](references/components.md) — the HTML components a chapter may use, with copy-paste markup.
- [check-yourself.md](references/check-yourself.md) — how to write the questions that end a chapter.
- [quality-checklist.md](references/quality-checklist.md) — the self-review gate (phase 6).

## Inputs

Ask via AskUserQuestion only for what cannot be inferred:
- **Chapter**: the file to fill (must already exist — run `add-chapter` first if not).
- **Sources**: files, URLs, a repo, or "from your own knowledge". Own-knowledge chapters are allowed, but every
  load-bearing number, date, quote, API name and version still has to be verified (phase 1) or softened.
- **Reader and format**: read the guide hub. The format badge sets the job of the chapter:
  `format-prep` → the reader must be able to *say it aloud* under questioning; `format-build` → the reader must end with
  something *running*; `format-deepdive` → the reader must understand the *mechanism*; `format-curriculum` → the reader
  is *learning in sequence* and needs exercises; `format-reference` → the reader must be able to *find it in ten
  seconds*; `format-notes` → the reader gets the author's *opinionated distillation*.

## Phase 1 — Map the sources

1. Read every source for what it actually says. Never infer content from a filename, title or abstract. Convert PDFs
   with `pdftotext` and read the text; fetch URLs with WebFetch.
2. Build a source map: `source → topics it really covers → where (section/page/URL anchor)`. Note each source's date —
   tooling, prices and regulation go stale, and the chapter should say "as of <month year>" where that matters.
3. List claims the chapter will depend on that no source backs. Each one is either verified now (WebSearch/WebFetch
   against a primary source — vendor docs, the paper, the spec, the regulator; not a blog summarising it), softened to
   what is actually known, or cut.
4. For a multi-chapter job, show the user the source map before writing.

## Phase 2 — Topic checklist

1. Read the hub and the neighbouring chapters (previous, next, and any chapter the hub card text implies overlap with).
   Record what they already cover so this chapter links to it instead of re-teaching it.
2. Write the full list of topics and subtopics this chapter owes the reader. This list drives the draft and the
   self-review.
3. **Enumeration completeness**: when a source or the chapter itself says "three kinds of X" / "the four failure modes",
   every member gets real coverage — not one treated in depth and the rest named in a list.
4. **Thin-source rule**: a topic the source mentions in one line but the reader needs still gets full treatment,
   supplemented from primary references found in phase 1.
5. Turn the checklist into the section outline. Each `<section id>` answers one question the reader has; 4–9 sections is
   typical. Median chapter length on this site is ~1,500 words, deep dives run to ~2,800; do not pad to a number.

## Phase 3 — Draft

Voice (this is what the strongest existing chapters do — e.g. `data-platform/data-platform-systems-design/05-…`):

- **Senior practitioner to senior practitioner.** No definitions of things the reader knows, no "in today's fast-paced
  world", no "it's important to note". Open each section on the decision or the problem, not on a definition.
- **Mechanism first, then consequence.** Say *why* it works or breaks — what the engine reads, what the regulator
  checks, what the interviewer is probing — then what that means for the reader's choice.
- **Concrete over abstract.** Real numbers with units, real tool names and versions, real failure stories. If the guide
  has a running example (GridDP, a named company, a dataset), every section uses it; do not invent a second one.
- **Opinionated, with the exception stated.** Recommend something. Then name the case where the recommendation flips.
  A general statement without its edge case fails review.
- **Prose carries the argument; components carry the structure.** Tables for genuine comparisons across the same
  attributes, `.flow` diagrams for processes and layouts, callouts for the one thing per section the reader must not
  miss. Do not convert reasoning into bullet fragments, and do not stack callouts.
- **Subtitle** (`<p class="subtitle">`): 2–3 sentences — where this sits after the previous chapter, what it builds, why
  it matters. Not a table of contents.
- British/American spelling: match the guide.

Mechanics:

- Use only components in [components.md](references/components.md). No new classes, no hard-coded colours, no inline
  `<script>`, no `on*=` handlers (CSP). Escape `&`, `<`, `>` in text and code.
- Keep the sidebar `Sections` links in step with the `<section id>`s as you add them.
- Code must be runnable or explicitly marked as a sketch; show the filename in the code header when it is a file.

## Phase 4 — Close the chapter

Every chapter ends with these, in this order (each its own `<section>`, each in the sidebar):

1. **Format-specific practice**, where the format calls for it: `Interview probes` (prep), an exercise (build,
   curriculum). Follow the guide's existing pattern.
2. **`✓ Check yourself`** (`id="check"`) — 4–6 questions with folded answers, written to
   [check-yourself.md](references/check-yourself.md). Skip only for `format-reference` chapters and `00-START-HERE`
   orientation pages that teach nothing testable.
3. **`Takeaway`** (`id="takeaway"`) — 4–7 bullets, each a complete claim a reader could repeat in a meeting, not a topic
   name. End with one sentence that hands off to the next chapter with a link.
4. **`Further reading`** (`id="further-reading"`) — the primary sources from phase 1 that a reader should actually open,
   3–7 items, each `<a … target="_blank" rel="noopener">` plus a clause on what it is good for. Omit the section rather
   than list filler. Chapters written purely from experience (prep talk-tracks, notes) may omit it.

## Phase 5 — Interlink

- Link back to the chapter where a concept was introduced the first time it is relied on
  (`<a href="04-ingestion.html#cdc">chapter 04</a>`), and forward where a thread is picked up later.
- Add cross-guide links where another guide on the site covers the adjacent topic in depth. Find candidates by
  grepping hub and chapter `<h1>`/`<h2>` text across the repo; paths are relative (`../../<topic>/<guide>/NN-….html`).
- Every link target, including `#anchors`, must exist. Aim for at least two intra-site links beyond prev/next.

## Phase 6 — Self-review (mandatory)

Walk [quality-checklist.md](references/quality-checklist.md) item by item against the finished file, fix what fails, and
re-check. Run `python3 tools/content/review.py <chapter.html>` for the mechanical items. Report to the user: the
checklist result, any claim you softened or could not verify, and anything left for them to decide. Then finish the
structural side if it has not been done: hub card text still accurate, `python3 tools/nav/build-chapters.py`,
`python3 tools/home/build-latest.py`, topic-page length/read time.

## Gotchas

- The source-mapping, completeness and self-review phases are adapted from bevibing/tutor-skills (MIT).

- Do not re-teach what a neighbouring chapter covers — link to it. Duplicate explanations drift apart.
- Do not write "as discussed above/below"; link the section.
- Interview-prep chapters in the first person use placeholders (`[N weeks]`, `[your project]`) for the reader's own
  facts — never invent a biography.
- Nothing personal from `job-finder/` ever goes into a chapter.
