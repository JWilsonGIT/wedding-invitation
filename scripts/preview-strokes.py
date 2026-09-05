#!/usr/bin/env python3
"""
Drawing aid for the pen strokes. Run by hand; the site never uses its output.

    python scripts/preview-strokes.py             # residue check, whole lockup
    python scripts/preview-strokes.py A0          # one glyph, big, on a grid
    python scripts/frames.py                      # the writing, as stills

THE RESIDUE CHECK IS THE POINT. The letterform is filled RED and the pen
path is stroked WHITE over it at the true mask width. Anything still red
is ink the pen will never reveal. That is the only question worth asking
of a centreline, and it needs no boolean geometry to answer — just eyes.

For the writing itself — pacing, the pale-to-full fade — use
scripts/frames.py, which renders the take as stills with no animation at
all. This file is for the geometry: does the pen cover the letter, and
does it travel the right route.
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


def load_art():
    ts = ART.read_text(encoding="utf-8")
    return json.loads(ts[ts.index("{"): ts.rindex("} as const;") + 1])


def load_pen():
    return json.loads(PEN.read_text(encoding="utf-8"))


def placed(pen):
    """Flatten shapes+place into concrete strokes with a transform."""
    out = []
    for p in pen["place"]:
        for s in pen["shapes"][p["shape"]]:
            out.append({
                "glyph": p["glyph"],
                "line": p["line"],
                "d": s["d"],
                "of": s["of"] * p.get("weight", 1.0),
                "dx": p["dx"],
                "dy": p["dy"],
            })
    return out


def path_length(d: str) -> float:
    """
    Arc length of a path built from M and C only, by flattening.

    Needed because librsvg — which is what sharp rasterises SVG with — does
    NOT implement `pathLength`. Browsers do, so the component normalises to
    pathLength=1 and this preview works in absolute units instead. Without
    this the dash pattern is measured against the path's real length, the
    stroke becomes a dotted line along its whole extent, and every frame
    renders fully revealed.
    """
    import re as _re
    nums = _re.findall(r"-?\d*\.?\d+", d)
    cmds = _re.findall(r"[MC]", d)
    vals = [float(n) for n in nums]
    i = 0
    total = 0.0
    cur = (0.0, 0.0)
    for c in cmds:
        if c == "M":
            cur = (vals[i], vals[i + 1]); i += 2
        else:
            p1 = (vals[i], vals[i + 1]); p2 = (vals[i + 2], vals[i + 3]); p3 = (vals[i + 4], vals[i + 5])
            i += 6
            prev = cur
            steps = 24
            for k in range(1, steps + 1):
                t = k / steps
                mt = 1 - t
                x = (mt ** 3 * cur[0] + 3 * mt * mt * t * p1[0]
                     + 3 * mt * t * t * p2[0] + t ** 3 * p3[0])
                y = (mt ** 3 * cur[1] + 3 * mt * mt * t * p1[1]
                     + 3 * mt * t * t * p2[1] + t ** 3 * p3[1])
                total += ((x - prev[0]) ** 2 + (y - prev[1]) ** 2) ** 0.5
                prev = (x, y)
            cur = p3
    return total


def grid(x0, y0, w, h, step):
    o = []
    x = int(x0 // step) * step
    while x < x0 + w:
        o.append(f'<line x1="{x}" y1="{y0}" x2="{x}" y2="{y0+h}" stroke="#bcd" stroke-width="0.25"/>')
        o.append(f'<text x="{x+0.8}" y="{y0+4}" font-size="3" fill="#69a">{x}</text>')
        x += step
    y = int(y0 // step) * step
    while y < y0 + h:
        o.append(f'<line x1="{x0}" y1="{y}" x2="{x0+w}" y2="{y}" stroke="#bcd" stroke-width="0.25"/>')
        o.append(f'<text x="{x0+0.8}" y="{y-0.8}" font-size="3" fill="#69a">{y}</text>')
        y += step
    return "\n".join(o)


def rasterise(svg_text: str, name: str, width: int):
    OUT.mkdir(parents=True, exist_ok=True)
    svg_path = OUT / f"{name}.svg"
    png_path = OUT / f"{name}.png"
    svg_path.write_text(svg_text, encoding="utf-8")
    js = (
        "const s=require('sharp'),f=require('fs');"
        f"s(Buffer.from(f.readFileSync({str(svg_path).replace(chr(92), '/')!r})))"
        f".resize({width}).png().toFile({str(png_path).replace(chr(92), '/')!r})"
        ".then(i=>console.log(i.width+'x'+i.height));"
    )
    subprocess.run(["node", "-e", js], cwd=ROOT, check=True)
    return png_path


def stroke_svg(s, width, colour, extra=""):
    return (f'<g transform="translate({s["dx"]},{s["dy"]})">'
            f'<path d="{s["d"]}" fill="none" stroke="{colour}" stroke-width="{width}" '
            f'stroke-linecap="round" stroke-linejoin="round" {extra}/></g>')


def main():
    art = load_art()
    pen = load_pen()
    strokes = placed(pen)
    w_pen = pen["width"]

    glyphs = [g for ln in ("lineA", "lineB") for g in art[ln]["glyphs"]]
    glyphs.append({"id": "amp", "d": art["amp"]["d"], "box": art["amp"]["box"]})
    arg = sys.argv[1] if len(sys.argv) > 1 else None

    # ── one glyph, magnified, on a grid ─────────────────────────────────
    if arg and not arg.startswith("--"):
        g = next((x for x in glyphs if x["id"] == arg), None)
        if not g:
            print("ids:", [x["id"] for x in glyphs] + ["amp"]); raise SystemExit(1)
        b = g["box"]; m = 12
        x0, y0, w, h = b["x"] - m, b["y"] - m, b["w"] + 2 * m, b["h"] + 2 * m
        mine = [s for s in strokes if s["glyph"] == arg]
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {w} {h}">
<rect x="{x0}" y="{y0}" width="{w}" height="{h}" fill="#fff"/>
{grid(x0, y0, w, h, 5)}
<path d="{g["d"]}" fill="#e11"/>
{"".join(stroke_svg(s, w_pen, "#ffffffcc") for s in mine)}
{"".join(stroke_svg(s, 0.8, "#c0f") for s in mine)}
</svg>'''
        print("wrote", rasterise(svg, f"glyph-{arg}", 1100), "box", b)
        return

    fills = "".join(f'<path d="{g["d"]}" fill="#e11"/>' for g in glyphs)
    vb = art["viewBox"]

    # ── residue check ───────────────────────────────────────────────────
    wide = "".join(stroke_svg(s, w_pen, "#fff") for s in strokes)
    core = "".join(stroke_svg(s, 0.7, "#c0f") for s in strokes)
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">
<rect x="{vb.split()[0]}" y="{vb.split()[1]}" width="{vb.split()[2]}" height="{vb.split()[3]}" fill="#fff"/>
{fills}{wide}{core}
</svg>'''
    print("wrote", rasterise(svg, "residue", 1500), " pen width", w_pen)
    tot = {}
    for s in strokes:
        tot[s["line"]] = tot.get(s["line"], 0) + s["of"]
    for k, v in tot.items():
        flag = "" if abs(v - 1) < 1e-9 else "   <-- MUST SUM TO 1"
        print(f"  line {k}: shares sum to {v}{flag}")


if __name__ == "__main__":
    main()
