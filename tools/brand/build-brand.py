#!/usr/bin/env python3
"""Build the site's brand images from the home page's hero art (the isometric layered stack).

Usage:  python3 tools/brand/build-brand.py

Writes
  assets/favicon.svg            simplified three-tier stack (scales down to 16px)
  favicon.ico                   32px + 16px, for clients that only ask for /favicon.ico
  assets/apple-touch-icon.png   180px, on the paper colour
  assets/og.png                 1200x630 social preview: the full stack + the home headline

The geometry mirrors `isoArt` in assets/home.js (same grid → screen projection, tiers and key blocks); colours are the
light-theme tokens. Needs Google Chrome (headless renders) and Pillow. Rarely needed — rerun only when the hero art,
palette or headline changes, then bump `?v=` for the icon links and `OG_IMAGE` in tools/seo/build-head.py (link-preview
caches key on the image URL) and rerun it.
"""
import os, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BG, PAPER, INK, MUTED, FAINT = "#eef2f1", "#f7faf9", "#101f1e", "#526463", "#5f7271"
LINE, ACCENT, ACCENT_SOFT, SECONDARY, LEFT, RIGHT = "#bfcdca", "#a3272a", "#ebdcdc", "#0e5e5b", "#f4efe6", "#ece5d8"
HEADLINE = ("The craft of building real systems,", "written down.")

# tiers as in home.js: (k, cells, key cells)
FULL = [(0, [(0,0),(1,0),(2,0),(3,0),(4,0),(0,1),(1,1),(2,1),(3,1),(4,1),(0,2),(1,2),(2,2),(3,2),(4,2),(1,3),(2,3),(3,3),(4,3),(2,4),(3,4)], [(2,2),(3,1)]),
        (1, [(1,1),(2,1),(3,1),(1,2),(2,2),(3,2),(2,3),(3,3)], [(2,2)]),
        (2, [(2,2),(3,2),(2,3)], [(2,2)])]
RISERS = [(2,2,0,1,True),(3,1,0,1,False),(1,2,0,1,False),(2,2,1,2,True),(3,2,1,2,False),(2,3,1,2,False)]
ICON = [(0, [(0,0),(1,0),(2,0),(0,1),(1,1),(2,1),(0,2),(1,2),(2,2)], []),
        (1, [(0,0),(1,0),(0,1),(1,1)], []),
        (2, [(0,0)], [(0,0)])]

def stack(tiers, A, H, GAP, ox, oy, stroke, sw, risers=(), centre=False):
    """SVG markup for the stack. `centre` shifts each tier so its middle sits over the tier below (icon only)."""
    def P(i, j, k): return ox + (i - j) * A, oy + (i + j) * (A / 2) - k * (H + GAP)
    out = []
    for i, j, k0, k1, hot in risers:
        a, b = P(i, j, k0), P(i, j, k1)
        out.append('<path d="M%g %g L%g %g" stroke="%s" stroke-width="%g" opacity="%s"/>' % (a[0], a[1] - A/2, b[0], b[1] + A/2 + H, SECONDARY if hot else stroke, sw, ".7" if hot else "1"))
    for k, cells, keys in tiers:
        off = (max(c[0] for c in tiers[0][1]) - max(c[0] for c in cells)) / 2 if centre else 0
        for i, j in sorted(cells, key=lambda c: c[0] + c[1]):
            x, y = P(i + off, j + off, k); key = (i, j) in keys
            faces = [(LEFT, [(x-A,y),(x,y+A/2),(x,y+A/2+H),(x-A,y+H)]), (RIGHT, [(x+A,y),(x,y+A/2),(x,y+A/2+H),(x+A,y+H)]),
                     (ACCENT_SOFT if key and not centre else ACCENT if key else PAPER, [(x,y-A/2),(x+A,y),(x,y+A/2),(x-A,y)])]
            for n, (fill, pts) in enumerate(faces):
                out.append('<polygon points="%s" fill="%s" stroke="%s" stroke-width="%g" stroke-linejoin="round"/>' % (
                    " ".join("%g,%g" % p for p in pts), fill, ACCENT if key and n == 2 else stroke, sw))
    return "\n".join(out)

def favicon_svg():
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\n<title>Field Guides</title>\n%s\n</svg>\n'
            % stack(ICON, A=9.5, H=5, GAP=6.5, ox=32, oy=35, stroke=INK, sw=1.1, centre=True))

def og_html():
    """Everything sits inside the central 630px square: compact link previews (Slack, Messages, LinkedIn thumbnails)
    centre-crop the 1200x630 image to a square, and a headline that runs wider than that gets cut mid-word."""
    fonts = "file://" + os.path.join(ROOT, "assets", "fonts.css")
    A, H, GAP = 31, 20, 52
    art = stack(FULL, A=A, H=H, GAP=GAP, ox=612 - A, oy=596 - 4 * A - H, stroke="#a9b9b6", sw=1.2, risers=RISERS)
    return """<!DOCTYPE html><html><head><meta charset="UTF-8"><link rel="stylesheet" href="%s"><style>
html,body{margin:0;width:1200px;height:630px;background:%s;overflow:hidden;color:%s}
svg{position:absolute;left:0;top:0;width:1200px;height:630px}
.t{position:absolute;left:285px;width:630px;top:50px;text-align:center}
.m{font-family:"Fraunces",serif;font-size:16px;letter-spacing:.24em;text-transform:uppercase;color:%s;margin:0 0 20px}
h1{font-family:"Fraunces",serif;font-weight:400;font-size:60px;line-height:1.05;letter-spacing:-.025em;margin:0}
h1 em{font-style:italic;color:%s}
.r{position:absolute;left:0;right:0;top:0;height:8px;background:%s}
</style></head><body><svg viewBox="0 0 1200 630">%s</svg><div class="r"></div>
<div class="t"><p class="m">Field Guides</p><h1>The craft of building<br>real systems,<br><em>%s</em></h1></div></body></html>""" % (
        fonts, BG, INK, MUTED, ACCENT, ACCENT, art, HEADLINE[1])

def shot(html_path, png, w, h, transparent=False):
    prof = tempfile.mkdtemp(prefix="fg-chrome-")
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--user-data-dir=" + prof,
           "--window-size=%d,%d" % (w, h + 200), "--screenshot=" + png, "file://" + html_path]
    if transparent: cmd.insert(1, "--default-background-color=00000000")
    try: subprocess.run(cmd, capture_output=True, timeout=60)
    except subprocess.TimeoutExpired: pass            # Chrome sometimes lingers after writing the file
    shutil.rmtree(prof, ignore_errors=True)
    if not os.path.exists(png): sys.exit("Chrome produced no screenshot for " + html_path)
    from PIL import Image
    Image.open(png).crop((0, 0, w, h)).save(png)      # the window is over-tall on purpose; keep the page's own box

def main():
    from PIL import Image
    tmp = tempfile.mkdtemp(prefix="fg-brand-")
    svg = favicon_svg(); open(os.path.join(ROOT, "assets", "favicon.svg"), "w", encoding="utf-8").write(svg)

    # raster icons: render the SVG large, then downsample
    page = os.path.join(tmp, "icon.html")
    open(page, "w", encoding="utf-8").write('<html><body style="margin:0;background:transparent">%s</body></html>' % svg.replace("<svg ", '<svg width="512" height="512" style="display:block" '))
    big = os.path.join(tmp, "icon.png"); shot(page, big, 512, 512, transparent=True)
    icon = Image.open(big).convert("RGBA")
    icon.resize((64, 64), Image.LANCZOS).save(os.path.join(ROOT, "favicon.ico"), sizes=[(32, 32), (16, 16)])
    touch = Image.new("RGBA", (180, 180), BG); small = icon.resize((148, 148), Image.LANCZOS); touch.paste(small, (16, 16), small)
    touch.convert("RGB").save(os.path.join(ROOT, "assets", "apple-touch-icon.png"), optimize=True)

    page = os.path.join(tmp, "og.html"); open(page, "w", encoding="utf-8").write(og_html())
    raw = os.path.join(tmp, "og.png"); shot(page, raw, 1200, 630)
    Image.open(raw).convert("RGB").quantize(colors=128, method=Image.MEDIANCUT, dither=Image.NONE).save(os.path.join(ROOT, "assets", "og.png"), optimize=True)
    shutil.rmtree(tmp, ignore_errors=True)
    for f in ("assets/favicon.svg", "favicon.ico", "assets/apple-touch-icon.png", "assets/og.png"):
        print("%-30s %6.1f KB" % (f, os.path.getsize(os.path.join(ROOT, f)) / 1024))

if __name__ == "__main__":
    main()
