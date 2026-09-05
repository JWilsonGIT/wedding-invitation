#!/usr/bin/env python3
"""
Render the writing as a grid of stills.

    python scripts/frames.py            # 12 frames across the whole take
    python scripts/frames.py 16         # more frames

Why this exists: the dev browser pane does not composite frames, so a
running animation cannot be screenshotted and `document.getAnimations()`
sits frozen at currentTime 0. Motion gets verified by seeking; APPEARANCE
gets verified here, by rendering the exact same masks and opacities at
fixed points in time with no animation involved at all.

It mirrors the CSS in globals.css. If the clock there changes, change
WRITE below to match — the derived values follow the same arithmetic.
"""

from __future__ import annotations

import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
ART = ROOT / "src" / "components" / "deck" / "name-outlines.generated.ts"
PEN = ROOT / "scripts" / "strokes.json"
OUT = ROOT / "scripts" / "out"

# ── the clock, mirroring .panel-welcome in globals.css ──────────────────
WRITE = 2.0
A_START = 280 * WRITE
A_DUR = 900 * WRITE
AMP_START = A_START + A_DUR + 20 * WRITE
AMP_DUR = 260 * WRITE
B_START = AMP_START + AMP_DUR
B_DUR = 900 * WRITE
SETTLE = 220 * WRITE
SETTLE_LEAD = 60 * WRITE
TOTAL = B_START + B_DUR + SETTLE

LINE = {"a": (A_START, A_DUR), "amp": (AMP_START, AMP_DUR), "b": (B_START, B_DUR)}

# Mirrors .writing in globals.css. The letters carry a gradient rather
# than a flat colour, laid across the whole lockup along the direction the
# hand travels — so it must be one gradient here too, not one per glyph.
# The five palette stops, mirroring .writing in globals.css.
# 3.35:1 to 6.97:1 against the frosted card — see the note there.
INK_STOPS = ["#b96181", "#ab5573", "#9c4965", "#8c3e57", "#7c344a"]


def load_art():
    ts = ART.read_text(encoding="utf-8")
    return json.loads(ts[ts.index("{"): ts.rindex("} as const;") + 1])


def placed():
    pen = json.loads(PEN.read_text(encoding="utf-8"))
    out, acc = [], {}
    for p in pen["place"]:
        for s in pen["shapes"][p["shape"]]:
            line = p["line"]
            share = s["of"] * p.get("weight", 1.0)
            at = acc.get(line, 0.0)
            acc[line] = at + share
            out.append({"glyph": p["glyph"], "line": line, "d": s["d"],
                        "dx": p["dx"], "dy": p["dy"], "at": at, "of": share})
    return out, pen["width"]


def path_length(d: str) -> float:
    """librsvg ignores pathLength, so the preview needs real arc lengths."""
    import re
    vals = [float(n) for n in re.findall(r"-?\d*\.?\d+", d)]
    cmds = re.findall(r"[MC]", d)
    i, total, cur = 0, 0.0, (0.0, 0.0)
    for c in cmds:
        if c == "M":
            cur = (vals[i], vals[i + 1]); i += 2
            continue
        p1, p2, p3 = (vals[i], vals[i+1]), (vals[i+2], vals[i+3]), (vals[i+4], vals[i+5])
        i += 6
        prev = cur
        for k in range(1, 25):
            t = k / 24
            m = 1 - t
            x = m**3*cur[0] + 3*m*m*t*p1[0] + 3*m*t*t*p2[0] + t**3*p3[0]
            y = m**3*cur[1] + 3*m*m*t*p1[1] + 3*m*t*t*p2[1] + t**3*p3[1]
            total += ((x-prev[0])**2 + (y-prev[1])**2) ** 0.5
            prev = (x, y)
        cur = p3
    return total


def clamp01(v: float) -> float:
    return 0.0 if v < 0 else 1.0 if v > 1 else v


def main() -> None:
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 12
    art = load_art()
    strokes, pen_w = placed()
    glyphs = [g for ln in ("lineA", "lineB") for g in art[ln]["glyphs"]]
    glyphs.append({"id": "amp", "d": art["amp"]["d"], "box": art["amp"]["box"]})
    by_glyph: dict[str, list] = {}
    for s in strokes:
        by_glyph.setdefault(s["glyph"], []).append(s)
    line_of = {s["glyph"]: s["line"] for s in strokes}

    vb = [float(v) for v in art["viewBox"].split()]
    cw, ch, pad = vb[2], vb[3], 8
    cols = 4
    rows = (n + cols - 1) // cols

    cells = []
    for i in range(n):
        t = TOTAL * i / (n - 1)
        defs, ink, settle = [], [], []
        for g in glyphs:
            line = line_of.get(g["id"], "a")
            ls, ld = LINE[line]
            paths = []
            for s in by_glyph.get(g["id"], []):
                s0 = ls + ld * s["at"]
                frac = clamp01((t - s0) / (ld * s["of"])) if s["of"] else 1.0
                if frac <= 0:
                    # Mirrors the stroke-opacity hop in globals.css: a
                    # fully-offset dash still paints its round cap, which
                    # showed as stray flecks before a stroke began. Not
                    # painting it at all is what the CSS does too.
                    continue
                L = path_length(s["d"])
                paths.append(
                    f'<g transform="translate({s["dx"]},{s["dy"]})">'
                    f'<path d="{s["d"]}" fill="none" stroke="#fff" stroke-width="{pen_w}" '
                    f'stroke-linecap="round" stroke-linejoin="round" '
                    f'stroke-dasharray="{L:.3f} {L:.3f}" '
                    f'stroke-dashoffset="{L*(1-frac):.3f}"/></g>')
            mid = f"f{i}-{g['id']}"
            defs.append(
                f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="{vb[0]}" y="{vb[1]}" '
                f'width="{cw}" height="{ch}">'
                f'<rect x="{vb[0]}" y="{vb[1]}" width="{cw}" height="{ch}" fill="#000"/>'
                f'{"".join(paths)}</mask>')
            ink.append(f'<path d="{g["d"]}" fill="url(#grad)" mask="url(#{mid})"/>')
            so = clamp01((t - (ls + ld - SETTLE_LEAD)) / SETTLE)
            if so > 0:
                settle.append(f'<path d="{g["d"]}" fill="url(#grad)" opacity="{so:.3f}"/>')

        r, c = divmod(i, cols)
        x, y = pad + c * (cw + pad), pad + r * (ch + pad)
        cells.append(
            f'<g transform="translate({x-vb[0]},{y-vb[1]})">'
            f'<defs>{"".join(defs)}</defs>'
            f'<rect x="{vb[0]}" y="{vb[1]}" width="{cw}" height="{ch}" fill="#fffdfe" '
            f'stroke="#e6e0e3" stroke-width="0.5"/>'
            f'{"".join(ink)}{"".join(settle)}'
            f'<text x="{vb[0]+4}" y="{vb[1]+ch-4}" font-size="7" fill="#b9adb2">'
            f'{int(t)}ms</text></g>')

    tw, th = pad + cols * (cw + pad), pad + rows * (ch + pad)
    ax = art["lineA"]["box"]; bx = art["lineB"]["box"]
    grad = (f'<linearGradient id="grad" gradientUnits="userSpaceOnUse" '
            f'x1="{ax["x"]}" y1="{ax["y"]}" '
            f'x2="{bx["x"]+bx["w"]}" y2="{bx["y"]+bx["h"]}">'
            + "".join(f'<stop offset="{i/(len(INK_STOPS)-1):.4f}" stop-color="{c}"/>'
                       for i, c in enumerate(INK_STOPS))
            + '</linearGradient>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {tw} {th}">'
           f'<defs>{grad}</defs>'
           f'<rect width="100%" height="100%" fill="#f4f4f6"/>{"".join(cells)}</svg>')

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "frames.svg").write_text(svg, encoding="utf-8")
    subprocess.run(
        ["node", "-e",
         "const s=require('sharp'),f=require('fs');"
         "s(Buffer.from(f.readFileSync('scripts/out/frames.svg')))"
         ".resize(1800).png().toFile('scripts/out/frames.png')"
         ".then(i=>console.log(i.width+'x'+i.height));"],
        cwd=ROOT, check=True)
    print(f"  {n} frames across {int(TOTAL)}ms -> scripts/out/frames.png")


if __name__ == "__main__":
    main()
