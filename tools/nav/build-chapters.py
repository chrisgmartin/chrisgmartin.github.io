#!/usr/bin/env python3
"""Regenerate the CHAPTERS manifest embedded in assets/nav.js from the guide hubs.

Usage:  python3 tools/nav/build-chapters.py [--check]

For every guide in SITE_NAV (assets/script.js) it reads the hub's section labels and chapter cards
(`.section-label` + `.guide-card` with a numbered chapter link) and rewrites the `var CHAPTERS = {...};`
line. Entries whose hub has no chapter cards (e.g. the Claude Skills collection hubs, which set
`unit` and link out with absolute `href`s) are preserved as they are. Run after adding a chapter or a
guide, then bump the asset version (see CLAUDE.md). `--check` writes nothing and exits non-zero if the manifest is stale.
Hand-maintained entries must use https:// hrefs and a plain lowercase `unit`, or the script refuses to run.
"""
import html, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DPE = "becoming-a-data-platform-engineer"

def site_nav():
    s = open(os.path.join(ROOT, "assets", "script.js"), encoding="utf-8").read()
    body = re.search(r"const SITE_NAV = (\[.*?\n  \]);", s, re.S).group(1)
    topics = []
    for tm in re.finditer(r"\{\s*name: '((?:[^'\\]|\\.)*)',\s*folder: '([^']+)',\s*guides: \[(.*?)\]\s*\}", body, re.S):
        guides = [(html.unescape(g[0].replace("\\'", "'")), g[1], bool(g[2]))
                  for g in re.findall(r"\{ name: '((?:[^'\\]|\\.)*)', folder: '([^']+)'(, group: \w+)? \}", tm.group(3))]
        topics.append((tm.group(1).replace("\\'", "'"), tm.group(2), guides))
    return topics

def parse_hub(path):
    s = open(path, encoding="utf-8").read()
    sections, cur = [], None
    for m in re.finditer(r'<div class="section-label"[^>]*>(.*?)</div>|<a class="guide-card[^"]*"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', s, re.S):
        if m.group(1) is not None:
            label = re.sub("<[^>]+>", "", m.group(1)); label = re.sub(r"^Section [A-Z] · ", "", html.unescape(label)).strip()
            cur = {"label": label, "chapters": []}; sections.append(cur)
        else:
            f, body = m.group(2), m.group(3)
            n = re.search(r'<span class="number">(.*?)</span>', body, re.S); t = re.search(r'<span class="name">(.*?)</span>', body, re.S)
            if not (n and t) or not re.match(r"^[0-9]", f): continue
            if cur is None: cur = {"label": "Chapters", "chapters": []}; sections.append(cur)
            cur["chapters"].append({"f": f, "n": html.unescape(re.sub("<[^>]+>", "", n.group(1))).strip(), "t": html.unescape(re.sub("<[^>]+>", "", t.group(1))).strip()})
    return [x for x in sections if x["chapters"]]

def checked(key, entry):
    """Hand-maintained entries are copied verbatim into nav.js, whose runtime sinks assume safe values: every absolute
    href must be https://, and `unit` a plain lowercase word. Refuse anything else rather than publish it."""
    unit = entry.get("unit", "chapters")
    if not re.fullmatch(r"[a-z]+", unit): sys.exit(f"  ! {key}: unit {unit!r} must match [a-z]+")
    for s in entry.get("sections", []):
        for c in s.get("chapters", []):
            if "href" in c and not c["href"].startswith("https://"): sys.exit(f"  ! {key}: href {c['href']!r} must start with https://")
    return entry

def main():
    navp = os.path.join(ROOT, "assets", "nav.js"); nav = open(navp, encoding="utf-8").read()
    m = re.search(r"var CHAPTERS = (\{.*?\});\n", nav, re.S); old = json.loads(m.group(1)); new = {}
    for tname, tfolder, guides in site_nav():
        for gname, gfolder, grouped in guides:
            key = f"{tfolder}/{DPE}/{gfolder}" if grouped else f"{tfolder}/{gfolder}"
            hub = os.path.join(ROOT, key, "index.html")
            if not os.path.exists(hub): print("  ! missing hub", key); continue
            secs = parse_hub(hub)
            if secs: new[key] = {"domain": tname, "name": gname, "sections": secs}
            elif key in old: new[key] = checked(key, old[key])  # hand-maintained entry (unit / absolute hrefs)
            else: print("  ! no chapters found in", key)
    out = nav[:m.start(1)] + json.dumps(new, ensure_ascii=False, separators=(",", ":")) + nav[m.end(1):]
    if "--check" in sys.argv:                       # read-only mode for the audit skill: report staleness, write nothing
        if out != nav: sys.exit("CHAPTERS: OUT OF DATE — run python3 tools/nav/build-chapters.py")
        print("CHAPTERS: up to date"); return
    open(navp, "w", encoding="utf-8").write(out)
    print(f"CHAPTERS: {len(new)} guides, {sum(len(c['chapters']) for g in new.values() for c in g['sections'])} chapters")

if __name__ == "__main__":
    main()
