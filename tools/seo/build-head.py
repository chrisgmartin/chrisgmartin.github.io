#!/usr/bin/env python3
"""Write the SEO / social / icon block into every published page, plus sitemap.xml and robots.txt.

Usage:  python3 tools/seo/build-head.py [--check]

For each tracked HTML page outside tools/ it (re)writes the lines between `<!-- HEAD:seo -->` and `<!-- /HEAD:seo -->`
(inserted right after `<title>` on first run): meta description, canonical, Open Graph + Twitter card, favicon links.
Never hand-edit inside the markers — change the page's `<title>` / hero subtitle (or DESCRIPTIONS below) and rerun.

  description  the hero `<p class="subtitle">` (home: `.lede`), tags stripped, cut at a sentence or word boundary ≤ 160
  canonical    https://christopherm.xyz + the clean URL Cloudflare serves (no `index.html`, no `.html`) — the GitHub
               Pages copy points here too, so the two hosts do not compete as duplicates
  icons        depth-aware relative paths, `?v=` taken from the page's own style.css/fonts.css link
  404.html     gets `noindex` and root-absolute paths; no canonical, not in the sitemap

sitemap.xml lists every canonical URL (no lastmod: it would go stale on every commit). Run after adding or retitling pages (the add-*
skills say when). `--check` writes nothing and exits non-zero if anything is stale.
"""
import html, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SITE = "https://christopherm.xyz"
NAME = "Field Guides"
OPEN, CLOSE = "<!-- HEAD:seo -->", "<!-- /HEAD:seo -->"
DESCRIPTIONS = {   # pages with no hero subtitle
    "404.html": "That page is not here. Browse the Field Guides catalog instead.",
}

def git(*a): return subprocess.run(["git"] + list(a), cwd=ROOT, capture_output=True, text=True).stdout

def pages():
    return [f for f in git("ls-files", "*.html").split("\n") if f and not f.startswith("tools/")]

def clean(s): return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s))).strip()

def shorten(t, n=160):
    if len(t) <= n: return t
    cut = t[:n]; stop = max(cut.rfind(". "), cut.rfind("? "))
    if stop >= 90: return cut[:stop + 1]
    return cut[:cut.rfind(" ")].rstrip(",;:—– ") + "…"

def canonical(rel):
    if rel == "index.html": return SITE + "/"
    if rel.endswith("/index.html"): return SITE + "/" + rel[:-len("index.html")]
    return SITE + "/" + rel[:-len(".html")]

def block(rel, s):
    title = clean(re.search(r"<title>(.*?)</title>", s, re.S).group(1))
    m = re.search(r'<p class="(?:subtitle|lede)[^"]*"[^>]*>(.*?)</p>', s, re.S)
    desc = DESCRIPTIONS.get(rel) or (shorten(clean(m.group(1))) if m else None)
    if not desc: sys.exit("no description source for " + rel + " — add a hero subtitle or a DESCRIPTIONS entry")
    v = re.search(r"(?:style|fonts)\.css\?v=(\d+)", s); v = "?v=" + v.group(1) if v else ""
    missing = rel == "404.html"
    up = "/" if missing else "../" * rel.count("/")
    e = lambda x: html.escape(x, quote=True)
    rows = ['<meta name="description" content="%s">' % e(desc)]
    if missing: rows.append('<meta name="robots" content="noindex">')
    else:
        url = canonical(rel)
        rows += ['<link rel="canonical" href="%s">' % url,
                 '<meta property="og:type" content="%s">' % ("website" if rel.count("/") < 2 or rel.endswith("index.html") else "article"),
                 '<meta property="og:site_name" content="%s">' % NAME,
                 '<meta property="og:title" content="%s">' % e(title),
                 '<meta property="og:description" content="%s">' % e(desc),
                 '<meta property="og:url" content="%s">' % url,
                 '<meta property="og:image" content="%s/assets/og.png">' % SITE,
                 '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">',
                 '<meta property="og:image:alt" content="Field Guides — the craft of building real systems, written down.">',
                 '<meta name="twitter:card" content="summary_large_image">']
    rows += ['<link rel="icon" href="%sassets/favicon.svg%s" type="image/svg+xml">' % (up, v),
             '<link rel="alternate icon" href="%sfavicon.ico%s" sizes="32x32">' % (up, v),
             '<link rel="apple-touch-icon" href="%sassets/apple-touch-icon.png%s">' % (up, v)]
    return OPEN + "\n" + "\n".join(rows) + "\n" + CLOSE

def apply(rel, s):
    b = block(rel, s)
    if OPEN in s: return re.sub(re.escape(OPEN) + r".*?" + re.escape(CLOSE), lambda _: b, s, count=1, flags=re.S)
    return re.sub(r"(<title>.*?</title>\n?)", lambda m: m.group(1).rstrip("\n") + "\n" + b + "\n", s, count=1, flags=re.S)

def main():
    check = "--check" in sys.argv[1:]; stale = []; files = pages()
    outputs = {}
    for rel in files:
        s = open(os.path.join(ROOT, rel), encoding="utf-8").read()
        outputs[rel] = (s, apply(rel, s))
    urls = sorted(canonical(r) for r in files if r != "404.html")
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(
        "  <url><loc>%s</loc></url>\n" % u for u in urls) + "</urlset>\n"
    robots = "User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n" % SITE
    for rel, new in (("sitemap.xml", sitemap), ("robots.txt", robots)):
        p = os.path.join(ROOT, rel); old = open(p, encoding="utf-8").read() if os.path.exists(p) else None
        outputs[rel] = (old, new)
    for rel, (old, new) in outputs.items():
        if old == new: continue
        stale.append(rel)
        if not check: open(os.path.join(ROOT, rel), "w", encoding="utf-8").write(new)
    if check:
        if stale: print("stale: %d file(s), e.g. %s — run tools/seo/build-head.py" % (len(stale), ", ".join(stale[:5]))); sys.exit(1)
        print("head blocks, sitemap.xml and robots.txt are current (%d pages)" % len(files))
    else: print("updated %d file(s); %d pages, %d sitemap URLs" % (len(stale), len(files), len(urls)))

if __name__ == "__main__":
    main()
