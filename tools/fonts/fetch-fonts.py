#!/usr/bin/env python3
"""Re-fetch the self-hosted web fonts into assets/fonts/ and regenerate assets/fonts.css.

    python3 tools/fonts/fetch-fonts.py

Pulls woff2 files (every Google subset, with its unicode-range) for FAMILIES from the Google Fonts css2 API, names each
file <family>-<sha256[:10]>.woff2, and writes assets/fonts.css pointing at them — so pages load no third-party
stylesheet or font and the CSP needs no Google origins. Also saves each family's OFL.txt beside the files.
Needs network access; run it only when the families or weights change, then bump the ?v= asset version.
"""
import hashlib, os, re, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FAMILIES = ("family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,300;1,9..144,400"
            "&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&family=Patrick+Hand&display=swap")
LICENSES = {"fraunces": "fraunces", "inter": "inter", "jetbrainsmono": "jetbrainsmono", "patrickhand": "patrickhand"}
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=30).read()

def main():
    out_dir = os.path.join(ROOT, "assets", "fonts"); os.makedirs(out_dir, exist_ok=True)
    css = get("https://fonts.googleapis.com/css2?" + FAMILIES).decode()
    for url in sorted(set(re.findall(r"url\((https://fonts\.gstatic\.com/[^)]+)\)", css))):
        data = get(url); fam = url.split("/s/")[1].split("/")[0]
        name = f"{fam}-{hashlib.sha256(data).hexdigest()[:10]}.woff2"
        open(os.path.join(out_dir, name), "wb").write(data)
        css = css.replace(f"url({url})", f"url(fonts/{name})")
    head = ("/* Self-hosted web fonts (SIL Open Font License 1.1): Fraunces, Inter, JetBrains Mono, Patrick Hand.\n"
            "   Generated from the Google Fonts css2 API (woff2, all Google subsets with their unicode-range) so the site\n"
            "   loads no third-party stylesheet or font. Re-fetch with tools/fonts/fetch-fonts.py if the families change. */\n")
    open(os.path.join(ROOT, "assets", "fonts.css"), "w").write(head + css)
    for fam, folder in LICENSES.items():
        open(os.path.join(out_dir, f"OFL-{fam}.txt"), "wb").write(
            get(f"https://raw.githubusercontent.com/google/fonts/main/ofl/{folder}/OFL.txt"))
    print("fonts:", len(os.listdir(out_dir)), "files in assets/fonts; assets/fonts.css written")

if __name__ == "__main__":
    main()
