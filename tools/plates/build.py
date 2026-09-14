#!/usr/bin/env python3
"""Pre-render every guide plate to static SVG and inline it into the hub's hero.

Usage:  python3 tools/plates/build.py            # all boards
        python3 tools/plates/build.py <guide-path> [...]   # e.g. data-engineering/data-systems-design

Needs Google Chrome (headless). Idempotent: re-running replaces the existing <figure class="plate">.
The hub's hero is wrapped as  <header class="hero has-plate"><div class="hero-text">…</div><figure class="plate">…</figure></header>
so the two-column layout in assets/style.css applies. Boards live in tools/plates/boards.js.
"""
import html, json, os, re, subprocess, sys, tempfile, time

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TOOLS = os.path.join(ROOT, "tools", "plates")
CHROME = next((c for c in [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome", "/usr/bin/chromium"] if os.path.exists(c)), None)
EXTRA = {"claude-skills": "claude-skills/index.html"}   # topic pages that also carry a plate

def targets():
    nav = open(os.path.join(ROOT, "assets", "nav.js"), encoding="utf-8").read()
    ch = json.loads(re.search(r"var CHAPTERS = (\{.*?\});\n", nav, re.S).group(1))
    t = {k: f"{k}/index.html" for k in ch}
    t.update(EXTRA)
    return t

def render(key):
    """Dump the rendered DOM. Headless Chrome does not always exit after --dump-dom, so stream stdout to a
    file, wait for the end marker, then kill the whole process group."""
    if not CHROME:
        sys.exit("No Chrome found — install Google Chrome or set CHROME in build.py")
    prof = tempfile.mkdtemp(prefix="fg-plate-")
    url = f"file://{TOOLS}/render.html?k={key}"
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--no-first-run", "--allow-file-access-from-files",
           f"--user-data-dir={prof}", "--virtual-time-budget=3000", "--dump-dom", url]
    with tempfile.NamedTemporaryFile("w+", suffix=".html", delete=False) as out:
        p = subprocess.Popen(cmd, stdout=out, stderr=subprocess.DEVNULL, start_new_session=True)
        deadline = time.time() + 25; text = ""
        while time.time() < deadline:
            time.sleep(0.25)
            text = open(out.name, encoding="utf-8", errors="replace").read()
            if "END&gt;&gt;&gt;" in text or "<<<END>>>" in text or "NONE" in text or p.poll() is not None:
                break
        try: os.killpg(os.getpgid(p.pid), 9)
        except Exception: pass
    os.unlink(out.name)
    m = re.search(r"&lt;&lt;&lt;SVG&gt;&gt;&gt;(.*?)&lt;&lt;&lt;END&gt;&gt;&gt;", text, re.S) or re.search(r"<<<SVG>>>(.*?)<<<END>>>", text, re.S)
    return html.unescape(m.group(1)) if m else None

def inject(page, svg, name):
    s = open(page, encoding="utf-8").read()
    fig = f'<figure class="plate" aria-label="Whiteboard sketch: {html.escape(name)}">{svg}</figure>'
    if '<figure class="plate"' in s:
        s2 = re.sub(r'<figure class="plate".*?</figure>', lambda m: fig, s, count=1, flags=re.S)
    else:
        m = re.search(r'<header class="hero([^"]*)"([^>]*)>(.*?)</header>', s, re.S)
        if not m:
            return False
        cls = m.group(1)
        cls = cls if "has-plate" in cls else cls + " has-plate"
        s2 = s[:m.start()] + f'<header class="hero{cls}"{m.group(2)}>\n  <div class="hero-text">{m.group(3)}</div>\n  {fig}\n</header>' + s[m.end():]
    if s2 != s:
        open(page, "w", encoding="utf-8").write(s2)
    return True

def main(argv):
    t = targets()
    keys = argv or sorted(t)
    ok = miss = 0
    for k in keys:
        page = os.path.join(ROOT, t[k])
        svg = render(k)
        if not svg:
            print(f"  no board for {k}", flush=True); miss += 1; continue
        name = re.search(r"<h1[^>]*>(.*?)</h1>", open(page, encoding="utf-8").read(), re.S)
        name = re.sub("<[^>]+>", "", name.group(1)).strip() if name else k
        if inject(page, svg, name):
            ok += 1; print(f"  ✓ {k}", flush=True)
        else:
            print(f"  ! no hero in {t[k]}"); miss += 1
    print(f"plates: {ok} written, {miss} skipped")

if __name__ == "__main__":
    main(sys.argv[1:])
