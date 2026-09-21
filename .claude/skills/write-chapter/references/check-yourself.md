# Writing "✓ Check yourself"

The block exists so a reader finds out what they did *not* absorb. A question they can answer "yes" to without
thinking tests nothing.

## Rules

1. **Ask for an answer, not a feeling.** Never "Do you understand…?" / "Can you describe…?".
   - Bad: *Do you understand why analytics uses a columnar format?*
   - Good: *A query reads 2 of 11 columns over 300M rows. Roughly what fraction of the I/O does Parquet do compared with
     a row store, and which footer structure makes that possible?*
2. **No hints in the question.** Ask about behaviour, purpose or outcome; do not name the answer or the section it is in.
   - Bad: *Which min/max statistics let Parquet skip row groups?*
   - Good: *`WHERE temp_c > 90` runs against a file whose data is unsorted. Why does predicate pushdown barely help?*
3. **Every answer is folded** in `<details class="reveal">` — never visible by default. Answers are 1–4 sentences: the
   answer, then the reason. Link the section that covers it (`<a href="#parquet">`) so a miss has somewhere to go.
4. **Test the chapter's load-bearing ideas**, one question each — the things in the Takeaway — not trivia (dates,
   version numbers, the third item of a list).
5. **Wrong-answer awareness.** Where a common misconception exists, build the question around it and have the answer
   name the misconception ("The tempting answer is X; it fails because…").
6. **Senior-level phrasing.** Scenarios and trade-offs over definitions: "what happens when…", "which would you choose
   given…", "what breaks first…", "your colleague proposes X — what do you ask?".

## Mix (4–6 questions per chapter)

| Type | Share | Shape |
|---|---|---|
| Recall of a mechanism | about half | "Why does…", "What does the engine do when…" |
| Application | at least one, usually two | a new scenario the chapter did not work through; the reader must transfer the idea |
| Analysis / judgement | at least one | a trade-off with no single right answer; the folded answer gives the deciding factors and when each side wins |

Pure definition questions: at most one, and only for a term the rest of the guide depends on.

## Format variations

- **Prep guides**: "Interview probes" stays the place for questions an interviewer would ask, with model answers in
  the reader's voice. Check yourself is about the *material*; do not duplicate probes.
- **Build / curriculum guides**: at least one question should be checkable against the thing built ("run X — what
  should the row count be, and what does it mean if it is double?"). Keep the existing exercise
  `<details class="collapse-card">` after the questions.
- **Rephrase, don't repeat**: when a later chapter re-tests an earlier idea, put it in a new context rather than
  reusing the question.
