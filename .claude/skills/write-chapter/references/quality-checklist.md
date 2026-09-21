# Chapter quality checklist — self-review

Verify every item against the finished file before reporting completion. Fix and re-verify on any failure. Items marked
⚙ are also checked by `python3 tools/content/review.py <file>`.

## Sources and accuracy
- [ ] Every source was read for content; nothing assumed from a filename or title.
- [ ] Every number, date, price, quote, version, API/CLI name and regulatory citation traces to a source in the phase-1
      map, or was verified against a primary source during this session.
- [ ] Unverifiable claims were softened or cut — and are listed in the report to the user.
- [ ] Time-sensitive facts carry an "as of <month year>".
- [ ] Code was run, or is labelled a sketch. Commands match the versions the guide uses.

## Coverage
- [ ] Every item on the phase-2 topic checklist is covered in a section.
- [ ] Every enumerated set ("three kinds of…") has all members covered at comparable depth.
- [ ] Nothing re-teaches a neighbouring chapter; it links there instead.
- [ ] The hub card's one-line description still describes the chapter.

## Voice
- [ ] Sections open on a decision or problem, not a dictionary definition.
- [ ] Each recommendation states the case where it flips; no unqualified "always/never".
- [ ] Mechanism is explained before consequence — the chapter says *why*, not only *what*.
- [ ] The guide's running example is used throughout; no second invented example.
- [ ] No filler ("it's important to note", "in today's…", "let's dive in"), no hype adjectives, no summary of what the
      section is about to say.
- [ ] Reasoning is in prose; bullets and tables hold parallel items only.
- [ ] Subtitle is 2–3 sentences and places the chapter after the previous one.

## Components
- [ ] Only classes from `components.md`; no hard-coded colours; no inline `<script>` or `on*=` attributes. ⚙
- [ ] Callout labels are claims or named traps; no stacked callouts; variants match their meaning.
- [ ] Process/layout topics have a `.flow` diagram; lines ≤ 84 characters.
- [ ] Code blocks have a language class; chapters with code carry the SRI-pinned highlight.js tags. ⚙
- [ ] `&`, `<`, `>` escaped in prose, diagrams and code.

## Closing sections
- [ ] `✓ Check yourself` present (unless reference/orientation), 4–6 questions. ⚙
- [ ] Every answer is inside `<details class="reveal">`; none visible by default. ⚙
- [ ] No yes/no or "do you understand" questions; no hints in the phrasing; mix per `check-yourself.md`. ⚙ (first part)
- [ ] `Takeaway` present, 4–7 bullets, each a complete claim; ends with a linked hand-off to the next chapter. ⚙
- [ ] `Further reading` lists primary sources with a "good for" clause, or is deliberately omitted. ⚙ (presence, as info)

## Links and structure
- [ ] At least two intra-site links beyond prev/next; first reliance on an earlier concept links back to it. ⚙
- [ ] Every link target and `#anchor` exists. ⚙
- [ ] Sidebar `Sections` anchors match the `<section id>`s one-to-one, in order. ⚙
- [ ] External links use `target="_blank" rel="noopener"`. ⚙
- [ ] One `<h1>`; `<h2>` per section; heading levels do not skip.

## Hygiene
- [ ] No personal material, nothing from `job-finder/`, no invented biography (placeholders in prep talk-tracks).
- [ ] Registrations and derived blocks refreshed if titles/chapters changed (`build-chapters.py`, `build-latest.py`).
