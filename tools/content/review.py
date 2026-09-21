#!/usr/bin/env python3
"""Mechanical content review of guide chapters — the ⚙ items of the write-chapter quality checklist.

Usage:  python3 tools/content/review.py [--summary] [--strict] [path ...]

`path` is a chapter file, a guide folder or a topic folder; with no path every tracked chapter
(`<topic>/<guide>/NN-*.html`, plus the nested curriculum) is reviewed. Read-only: it writes nothing.

Per chapter it reports
  FAIL  broken intra-site links or #anchors, <section id>s missing from the sidebar, visible (unfolded)
        Check-yourself answers, external links without rel="noopener", code without the highlight.js tags,
        inline <script> / on*= handlers
  WARN  no Takeaway, no Check yourself, yes/no "Do you understand…" questions, Takeaway without a hand-off link,
        no intra-site links beyond the sidebar
  INFO  no Further reading, word count

`--summary` prints one line per guide instead of per chapter (for planning a backfill). Exit status is 1 when any
FAIL is found, or any WARN with `--strict`. Judgement items (voice, accuracy, coverage) are not checkable here — see
.claude/skills/write-chapter/references/quality-checklist.md.
"""
import html, os, re, subprocess, sys
from collections import defaultdict
from urllib.parse import unquote

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CHAPTER = re.compile(r"(^|/)[0-9][^/]*\.html$")
SOFT_Q = re.compile(r"^\s*(do|can|could|are|is|have|did|will|would) (you|your)\b", re.I)

def text(s): return html.unescape(re.sub(r"<[^>]+>", " ", s))

def chapters(paths):
    tracked = subprocess.run(["git", "ls-files", "*.html"], cwd=ROOT, capture_output=True, text=True).stdout.split("\n")
    tracked = [f for f in tracked if CHAPTER.search(f) and f.count("/") >= 2 and not f.startswith("tools/")]
    if not paths: return tracked
    out = []
    for p in paths:
        rel = os.path.relpath(os.path.abspath(p), ROOT)
        if os.path.isdir(os.path.join(ROOT, rel)):
            out += [f for f in tracked if f.startswith(rel.rstrip("/") + "/")]
        elif CHAPTER.search(rel): out.append(rel)     # may be new and untracked
        else: sys.exit("not a chapter file or folder: " + p)
    return out

_ids = {}
def ids_of(path):
    if path not in _ids:
        try: _ids[path] = set(re.findall(r'\bid="([^"]+)"', open(path, encoding="utf-8").read()))
        except OSError: _ids[path] = None
    return _ids[path]

def section(s, pattern):
    """The <section> whose <h2> matches `pattern`, or None."""
    for m in re.finditer(r"<section\b[^>]*>(.*?)</section>", s, re.S):
        h = re.search(r"<h2[^>]*>(.*?)</h2>", m.group(1), re.S)
        if h and re.search(pattern, text(h.group(1)), re.I): return m.group(1)
    return None

def review(rel):
    path = os.path.join(ROOT, rel); s = open(path, encoding="utf-8").read()
    fail, warn, info = [], [], []
    aside = re.search(r"<aside\b.*?</aside>", s, re.S); aside = aside.group(0) if aside else ""
    main = re.search(r"<main\b.*?</main>", s, re.S); main = main.group(0) if main else s

    # links and anchors
    for href in re.findall(r'<a\b[^>]*\bhref="([^"]+)"', s):
        if re.match(r"(https?:|mailto:|//)", href): continue
        target, _, frag = html.unescape(href).partition("#")
        tpath = os.path.normpath(os.path.join(os.path.dirname(path), unquote(target))) if target else path
        if os.path.isdir(tpath): tpath = os.path.join(tpath, "index.html")
        found = ids_of(tpath)
        if found is None: fail.append("broken link: " + href)
        elif frag and frag not in found: fail.append("missing anchor: " + href)
    for a in re.findall(r'<a\b[^>]*\bhref="https?://[^"]*"[^>]*>', main):
        if "noopener" not in a: fail.append("external link without rel=noopener: " + re.search(r'href="([^"]+)"', a).group(1))

    # sidebar (every link group above Navigation) vs <section id> — other id'd targets, e.g. a Setup callout, are fine
    block = re.search(r"<nav\b[^>]*>(.*?)(<h2>Navigation</h2>|</nav>)", aside, re.S)
    if block:
        secs = re.findall(r'<section\b[^>]*\bid="([^"]+)"', main)
        side = re.findall(r'href="#([^"]+)"', block.group(1))
        miss = [x for x in secs if x not in side]
        if miss: fail.append("sections missing from the sidebar: " + ", ".join(miss))   # order is free: some sidebars group links

    # CSP and code
    if re.search(r"<script\b(?![^>]*\bsrc=)(?![^>]*application/json)[^>]*>", s): fail.append("inline <script>")
    if re.search(r"<[a-z][^>]*\son[a-z]+\s*=", s, re.I): fail.append("on*= handler attribute")
    if re.search(r'<code class="language-', s) and "highlight.min.js" not in s: fail.append("code blocks but no highlight.js tags")

    # closing sections
    orientation = bool(re.search(r"(^|/)00-", rel))
    take = section(main, r"^takeaways?\b|^key takeaways?")
    if take is None:
        if not orientation: warn.append("no Takeaway")
    elif not re.search(r'<a\b[^>]*href="(?!https?:|#)[^"]+"', take): warn.append("Takeaway has no hand-off link")
    check = section(main, r"check yourself")
    if check is None:
        if not orientation: warn.append("no Check yourself")
    else:
        body = check.split("<details", 1)[0] if 'class="collapse-card"' in check and 'class="reveal"' not in check else check
        items = re.findall(r"<li\b[^>]*>(.*?)</li>", body, re.S)
        soft = [i for i in items if SOFT_Q.match(text(i))]
        if soft: warn.append("yes/no self-check questions (%d)" % len(soft))
        if items and 'class="reveal"' not in check: fail.append("Check yourself has no folded answers")
        if len(items) < 4: warn.append("Check yourself short of 4–6 questions (%d)" % len(items))
    if section(main, r"^(further reading|sources|references)$") is None: info.append("no Further reading")

    inner = [h for h in re.findall(r'<a\b[^>]*\bhref="([^"]+)"', re.sub(r"<aside\b.*?</aside>", "", s, flags=re.S))
             if not re.match(r"(https?:|mailto:|//|#)", h)]
    if len(inner) < 2: warn.append("few intra-site links in the body (%d)" % len(inner))
    info.append("%d words" % len(text(main).split()))
    return fail, warn, info

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]; flags = set(sys.argv[1:]) - set(args)
    if flags - {"--summary", "--strict"}: sys.exit(__doc__)
    files = chapters(args); nfail = nwarn = 0; guides = defaultdict(lambda: defaultdict(int))
    for rel in files:
        fail, warn, info = review(rel); nfail += len(fail); nwarn += len(warn)
        g = guides[os.path.dirname(rel)]; g["chapters"] += 1; g["fail"] += len(fail)
        for w in warn + [i for i in info if i.startswith("no ")]: g[w.split(" (")[0]] += 1
        if "--summary" in flags: continue
        if fail or warn or args:
            print(rel)
            for tag, rows in (("FAIL", fail), ("WARN", warn), ("INFO", info)):
                for r in rows: print("  %s  %s" % (tag, r))
    if "--summary" in flags:
        for name in sorted(guides):
            g = guides[name]; rest = ", ".join("%s ×%d" % (k, v) for k, v in sorted(g.items()) if k not in ("chapters", "fail") and v)
            print("%-72s %3d ch  %2d FAIL  %s" % (name, g["chapters"], g["fail"], rest))
    print("%d chapter(s): %d FAIL, %d WARN" % (len(files), nfail, nwarn))
    sys.exit(1 if nfail or ("--strict" in flags and nwarn) else 0)

if __name__ == "__main__":
    main()
