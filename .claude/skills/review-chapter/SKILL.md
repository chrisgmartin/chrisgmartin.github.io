---
name: review-chapter
description: Editorial review of existing chapters against the write-chapter quality checklist — sourcing, coverage, voice, Check-yourself questions, takeaways, cross-links. Works on one chapter, a guide, or the whole catalog (backfill planning). Reports findings; does not modify files.
---

# Review chapters

Use when the user says "review this chapter/guide", "how good is the writing in X", "what needs backfilling", or before
a PR that adds or rewrites chapters. `audit` checks the catalog's *structure*; this checks the *writing*. Read-only —
report, then ask before fixing. Fixes go through the `write-chapter` skill.

## Steps

1. **Mechanical pass.** `python3 tools/content/review.py <path…>` (a chapter, guide folder or topic folder; no path =
   everything). For catalog-wide planning use `--summary`, which prints one line per guide. FAILs are defects (broken
   links and anchors, sidebar out of step with sections, unfolded answers, missing `rel="noopener"`, CSP violations);
   WARNs are gaps against the house pattern (no Takeaway, no Check yourself, yes/no questions, no cross-links).

2. **Editorial pass** — only for the chapters the user asked about (for a whole guide, read every chapter; for the
   catalog, stop after step 1 and propose which guides to read). Read the chapter, its hub and its neighbours, then
   judge it against `.claude/skills/write-chapter/references/quality-checklist.md`:
   - **Accuracy**: list every load-bearing number, date, price, version and citation. Spot-check the ones most likely
     to have gone stale (pricing, tool versions, regulation, company facts) against a primary source. Say which you
     checked and which you did not.
   - **Coverage**: does the chapter deliver what its hub card and subtitle promise? Are enumerated sets complete? Does
     it re-teach a neighbour instead of linking?
   - **Voice**: definition-first openings, unqualified "always/never", filler, bullet fragments standing in for
     reasoning, stacked or mislabelled callouts, a second invented example.
   - **Check yourself / Takeaway**: judged against `write-chapter/references/check-yourself.md` — hints in the
     phrasing, trivia, missing application/analysis questions, takeaway bullets that are topic names.
   - **Links**: concepts relied on but introduced elsewhere with no link; adjacent guides on the site worth linking
     (grep `<h1>`/`<h2>` text across the repo for candidates and name the specific targets).

3. **Report.** Per chapter: the tool's FAIL/WARN lines, then editorial findings ordered by reader impact, each with the
   line number and a concrete fix ("§parquet ¶2: '10–20×' has no source — Parquet docs give…"). Do not report style
   preferences the checklist does not back. For a guide, end with the three changes that would most improve it; for
   the catalog, end with a suggested backfill order (FAILs first, then the guides with the most traffic-worthy gaps).

## Notes

- Never print names of untracked or gitignored folders (`experiments/`, `job-finder/`) — the tool only walks tracked
  files.
- A chapter may deliberately omit Check yourself (reference pages, `00-START-HERE`) or Further reading (experience-led
  prep chapters). Do not flag those.
