#!/usr/bin/env python3
"""Regenerate the CHAPTERS manifest embedded in assets/nav.js from the guide hubs.

Usage:  python3 tools/nav/build-chapters.py

For every guide in SITE_NAV (assets/script.js) it reads the hub's section labels and chapter cards
(`.section-label` + `.guide-card` with a numbered chapter link) and rewrites the `var CHAPTERS = {...};`
line. Entries whose hub has no chapter cards (e.g. the Claude Skills collection hubs, which set
`unit` and link out with absolute `href`s) are preserved as they are. Run after adding a chapter or a
guide, then bump the asset version (see CLAUDE.md).
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
            elif key in old: new[key] = old[key]           # hand-maintained entry (unit / absolute hrefs)
            else: print("  ! no chapters found in", key)
    nav = nav[:m.start(1)] + json.dumps(new, ensure_ascii=False, separators=(",", ":")) + nav[m.end(1):]
    open(navp, "w", encoding="utf-8").write(nav)
    print(f"CHAPTERS: {len(new)} guides, {sum(len(c['chapters']) for g in new.values() for c in g['sections'])} chapters")

if __name__ == "__main__":
    main()
