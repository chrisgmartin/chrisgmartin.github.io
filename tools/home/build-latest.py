#!/usr/bin/env python3
"""Regenerate the "Latest" blocks on the home page.

Usage:  python3 tools/home/build-latest.py [--n 5] [--check]

Two blocks in index.html are rewritten between marker comments, so the file stays hand-editable
everywhere else and the tool is idempotent:

  <!-- LATEST:strip -->   one line under the hero: the newest guide
  <!-- LATEST:list -->    the five most recent guides, dated, under the atlas

Data comes from the repo itself — recency from each hub's first commit (`git log --diff-filter=A`),
names/domains/counts from the CHAPTERS manifest in assets/nav.js, and the one-line summary from the
hub's own <p class="subtitle"> trimmed at its first clause. Nothing is hand-maintained, so the
section stays correct as guides are added; run it after `tools/nav/build-chapters.py`.

The strip's label is honest about age: "Just published" only within STRIP_FRESH_DAYS, "Latest guide"
after that. `--check` exits non-zero if the file is out of date (useful in CI or the audit skill).

The styles live in the home page's own <style> block (class .latestbar / .latest); this tool only
writes markup.
"""
import argparse, datetime, html, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PAGE = os.path.join(ROOT, "index.html")
STRIP_FRESH_DAYS = 45
MON = {"01":"Jan","02":"Feb","03":"Mar","04":"Apr","05":"May","06":"Jun",
       "07":"Jul","08":"Aug","09":"Sep","10":"Oct","11":"Nov","12":"Dec"}
E = html.escape


def guides():
    nav = open(os.path.join(ROOT, "assets", "nav.js"), encoding="utf-8").read()
    ch = json.loads(re.search(r"var CHAPTERS = (\{.*?\});\n", nav, re.S).group(1))
    out = []
    for key, g in ch.items():
        hub = os.path.join(ROOT, key, "index.html")
        if not os.path.exists(hub):
            print(f"  ! missing hub {key}", file=sys.stderr); continue
        added = subprocess.run(
            ["git", "-C", ROOT, "log", "--diff-filter=A", "--format=%cs", "-1", "--", f"{key}/index.html"],
            capture_output=True, text=True).stdout.strip()
        if not added:                       # not committed yet — treat as today so new work surfaces
            added = datetime.date.today().isoformat()
        m = re.search(r'<p class="subtitle">(.*?)</p>', open(hub, encoding="utf-8").read(), re.S)
        sub = re.sub(r"\s+", " ", re.sub("<[^>]+>", "", html.unescape(m.group(1)))).strip() if m else ""
        out.append(dict(key=key, date=added, domain=g["domain"], name=g["name"],
                        n=sum(len(s["chapters"]) for s in g["sections"]),
                        unit=g.get("unit", "chapters"), sub=sub))
    out.sort(key=lambda r: (r["date"], r["key"]), reverse=True)
    return out


def pretty(date, show_year):
    y, m, d = date.split("-")
    return f"{MON[m]} {int(d)}" + (f", {y}" if show_year else "")


def clause(s, lo=45, hi=135):
    """The first self-contained clause of a subtitle — em-dash, then sentence, then a word-boundary cut."""
    s = s.strip()
    for sep in (" — ", " – "):
        head = s.split(sep)[0]
        if lo <= len(head) <= hi:
            return head
    m = re.match(r"(.+?[.!?])(\s|$)", s)
    if m and lo <= len(m.group(1)) <= hi:
        return m.group(1)
    if len(s) <= hi:
        return s
    return s[:hi].rsplit(" ", 1)[0].rstrip(",;:—–-") + "…"


def read_time(r):
    h, m = divmod(r["n"] * 8, 60)
    return f"{h} h {m:02d}" if h else f"{m} min"


def render(rows, total, n):
    top, rest = rows[0], rows[:n]
    this_year = datetime.date.today().year
    age = (datetime.date.today() - datetime.date.fromisoformat(top["date"])).days
    label = "Just published" if age <= STRIP_FRESH_DAYS else "Latest guide"
    strip = (
        f'<div class="wrap latestbar"><a href="{E(top["key"])}/index.html">'
        f'<span class="tag">{label}</span>'
        f'<span class="nm">{E(top["name"])}</span><span class="sep">·</span>'
        f'<span class="dm">{E(str(top["n"]))} {E(top["unit"])} · {E(top["domain"])}</span>'
        f'<span class="go">Read →</span></a></div>'
    )
    li = ""
    for r in rest:
        show_year = int(r["date"][:4]) != this_year
        li += (f'      <li><a href="{E(r["key"])}/index.html">'
               f'<time class="dt" datetime="{E(r["date"])}">{pretty(r["date"], show_year)}</time>'
               f'<span class="dm">{E(r["domain"])}</span>'
               f'<span class="tt">{E(r["name"])}<small>{E(clause(r["sub"]))}</small></span>'
               f'<span class="len">{E(str(r["n"]))} {E(r["unit"])} · {read_time(r)}</span></a></li>\n')
    lst = (f'<section class="wrap latest" aria-label="Latest guides">\n'
           f'    <div class="lhead"><h2>Latest</h2>'
           f'<a class="all" href="#domains">Browse all {total} guides →</a></div>\n'
           f'    <ol>\n{li}    </ol>\n  </section>')
    return strip, lst


def splice(src, name, block):
    open_m, close_m = f"<!-- LATEST:{name} -->", f"<!-- /LATEST:{name} -->"
    new = f"{open_m}{block}{close_m}"
    if open_m in src:
        return re.sub(re.escape(open_m) + ".*?" + re.escape(close_m), lambda _: new, src, count=1, flags=re.S)
    if name == "strip":                       # first run: place it between the hero and the atlas
        return src.replace('  <section class="wrap atlas"', f"  {new}\n\n  <section class=\"wrap atlas\"", 1)
    return src.replace("  </section>\n</main>", f"  </section>\n\n  {new}\n</main>", 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=5, help="entries in the list (default 5)")
    ap.add_argument("--check", action="store_true", help="exit 1 if index.html is out of date")
    a = ap.parse_args()
    rows = guides()
    strip, lst = render(rows, len(rows), a.n)
    src = open(PAGE, encoding="utf-8").read()
    out = splice(splice(src, "strip", strip), "list", lst)
    if a.check:
        print("index.html Latest blocks:", "up to date" if out == src else "OUT OF DATE")
        sys.exit(0 if out == src else 1)
    if out != src:
        open(PAGE, "w", encoding="utf-8").write(out)
    print(f"Latest: {'updated' if out != src else 'unchanged'} · newest {rows[0]['date']} "
          f"{rows[0]['name']} · {a.n} listed of {len(rows)} guides")


if __name__ == "__main__":
    main()
