#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════
Turn the couple's names into SVG letterform outlines.

RUN THIS BY HAND. It is not wired into `npm run build` and must not be —
the repo has no codegen step, and its output is committed. Re-run it only
when the names, the typeface or the weight change:

    pip install "fonttools[woff]"
    python scripts/generate-name-outlines.py

Writes:
    src/components/deck/name-outlines.generated.ts   the artwork
    scripts/out/centreline-debug.svg                 the drawing aid

WHY THIS EXISTS. Panel I animates the names as if written by a pen. That
needs the letters as geometry a stroke can travel along; HTML text cannot
do it. The trade is that the names stop being live text — which is why
PanelWelcome checks the generated `text` against wedding.ts and falls back
to the old text rendering when they disagree. wedding.ts stays the only
file anyone edits; this script is what makes the handwriting catch up.

COORDINATE SYSTEM. Everything below is in HUNDREDTHS OF AN EM, y-down,
with line A's baseline at y=0. Two reasons for the odd unit: it makes the
numbers directly comparable to the canvas metrics already recorded in
globals.css ("Ana" ink height 65, "An" advance 133.7, "J" advance 67.4),
so a reviewer can check this output against those comments without
arithmetic; and it keeps every emitted number a small readable integer-ish
value rather than a five-digit font unit.
═══════════════════════════════════════════════════════════════════════════
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.misc.transform import Transform
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / "assets" / "fonts" / "Tangerine-Bold.ttf"
OUT_TS = ROOT / "src" / "components" / "deck" / "name-outlines.generated.ts"
OUT_SVG = ROOT / "scripts" / "out" / "centreline-debug.svg"

# The two names. Kept here rather than parsed out of wedding.ts: this script
# is run by a person who knows why they are running it, and a TS parser in
# a build-less repo is a liability. PanelWelcome does the real comparison.
LINE_A = "Ana"
LINE_B = "John"

EM = 100.0

# Baseline-to-baseline distance, and it is a FIT constraint before it is an
# aesthetic one. The whole lockup is aspect-locked, so its height is set
# here: total ink height is LINE_GAP + 82.9 units (the J's descender sets
# the bottom, so this figure did not move when Jan became John). The text rendering this
# replaces stood about 2.0em tall and that is what the panel has room for,
# so 100 lands the artwork at ~1.98em including breathing room. Raising it
# makes the SVG taller at the same width and pushes the note into the deck
# numerals — measure at 1280x800 and 1440x700 before touching it.
#
# It also leaves "Ana" (no descender at all) clear of "John" (whose J drops
# 19 below its own baseline) with a channel for the ampersand.
LINE_GAP = 100.0

# Padding around the ink bbox, so the viewBox is not flush with the
# letterforms. This is what replaces the `padding: 0.10em 0 0.085em` hack
# the text version needed — here the box and the visual extent are the
# same thing by construction.
BREATHE_X = 6.0
BREATHE_TOP = 8.0
BREATHE_BOTTOM = 7.0

# Cap height of the ampersand, in the same hundredths of an em. Tangerine's
# ampersand is 47.5 tall at text size; the channel between the names is
# 35.6, and punctuation should sit below the weight of the names anyway.
AMP_HEIGHT = 27.0

# How far BELOW the centre of the channel the ampersand sits, in the same
# units. Centring it geometrically puts it slightly high to the eye: "Ana"
# has no descender, so the space under it reads as empty, while "John" comes
# up to meet it. Dropping it a little re-centres it optically, which is the
# one that matters. If this moves, the ampersand's pen strokes in
# scripts/strokes.json must move with it — they are authored in final
# coordinates, like every other stroke.
AMP_DROP = 5.0


def die(msg: str) -> None:
    print(f"\n  ERROR: {msg}\n", file=sys.stderr)
    raise SystemExit(1)


def cmap_of(font: TTFont):
    return font.getBestCmap()


def glyph_path(font: TTFont, glyph_name: str, xform: Transform) -> str:
    """SVG `d` for one glyph, already transformed into output space."""
    glyphs = font.getGlyphSet()
    pen = SVGPathPen(glyphs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    glyphs[glyph_name].draw(TransformPen(pen, xform))
    return pen.getCommands()


def glyph_bounds(font: TTFont, glyph_name: str, xform: Transform):
    glyphs = font.getGlyphSet()
    pen = BoundsPen(glyphs)
    glyphs[glyph_name].draw(TransformPen(pen, xform))
    return pen.bounds  # (xMin, yMin, xMax, yMax) or None for a blank


def layout(font: TTFont, text: str, baseline_y: float, x_start: float = 0.0):
    """Place each glyph of `text`, returning per-glyph records and the pen x."""
    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    upm = font["head"].unitsPerEm
    scale = EM / upm

    out = []
    x = x_start
    for i, ch in enumerate(text):
        name = cmap.get(ord(ch))
        if name is None:
            die(
                f"the font has no glyph for {ch!r}. This is next/font's subset, "
                f"not the full family. Covered: {''.join(sorted(chr(c) for c in cmap))[:120]}"
            )
        # y is negated: font units are y-up, SVG is y-down.
        xform = Transform(scale, 0, 0, -scale, x, baseline_y)
        d = glyph_path(font, name, xform)
        b = glyph_bounds(font, name, xform)
        advance = hmtx[name][0] * scale
        out.append(
            {
                "char": ch,
                "id": f"{ch}{i}",
                "d": d,
                "advance": advance,
                "bounds": b,
                "penX": x,
            }
        )
        x += advance
    return out, x


def union(boxes):
    boxes = [b for b in boxes if b]
    if not boxes:
        die("no ink at all — every glyph came back blank")
    return (
        min(b[0] for b in boxes),
        min(b[1] for b in boxes),
        max(b[2] for b in boxes),
        max(b[3] for b in boxes),
    )


def main() -> None:
    if not FONT.exists():
        die(f"{FONT} is missing. See assets/fonts/README.md.")

    raw = FONT.read_bytes()
    sha = hashlib.sha256(raw).hexdigest()
    font = TTFont(FONT)
    upm = font["head"].unitsPerEm

    # ── Lay both lines out from a common origin ──────────────────────────
    a_glyphs, a_end = layout(font, LINE_A, 0.0)
    b_glyphs, b_end = layout(font, LINE_B, LINE_GAP)

    # ── The cascade ──────────────────────────────────────────────────────
    # The last "a" of Ana must sit directly over the "J" of Jan. The text
    # version did this with `translate: ±0.5em` derived from advance-width
    # arithmetic; here it is measured off the real ink and applied once, so
    # it is exact by construction rather than correct to within a pixel.
    last_a = a_glyphs[-1]
    first_b = b_glyphs[0]
    if not last_a["bounds"] or not first_b["bounds"]:
        die("cannot align: one of the cascade anchor glyphs has no ink")
    a_centre = (last_a["bounds"][0] + last_a["bounds"][2]) / 2
    j_centre = (first_b["bounds"][0] + first_b["bounds"][2]) / 2
    shift = a_centre - j_centre

    if abs(shift) > 0:
        b_glyphs, b_end = layout(font, LINE_B, LINE_GAP, x_start=shift)
        first_b = b_glyphs[0]
        j_centre = (first_b["bounds"][0] + first_b["bounds"][2]) / 2

    # ── The ampersand: Tangerine's own ────────────────────────────────────
    # It was hand-drawn as a monoline mark at first, on the argument that a
    # script ampersand between two script names reads as a third name. That
    # argument was wrong here for a simple reason: the names are now drawn
    # letterforms with heavy stroke contrast, and a uniform-width mark beside
    # them belongs to no typeface at all. Tangerine's ampersand carries the
    # same modulation as the letters, so it matches by construction.
    #
    # It is SCALED DOWN rather than set at text size. At full size the glyph
    # is 47.5 units tall and the channel between the two names is only 35.6,
    # and it should read as punctuation between the names rather than as a
    # third thing of equal weight. AMP_HEIGHT is the one number to change.
    a_box = union([g["bounds"] for g in a_glyphs])
    b_box = union([g["bounds"] for g in b_glyphs])

    amp_name = cmap_of(font).get(ord("&"))
    if amp_name is None:
        die("the font subset has no ampersand")
    upm_scale = EM / upm
    raw = Transform(upm_scale, 0, 0, -upm_scale, 0, 0)
    raw_bounds = glyph_bounds(font, amp_name, raw)
    amp_scale = AMP_HEIGHT / (raw_bounds[3] - raw_bounds[1])
    amp_cx = (a_box[0] + a_box[2] + b_box[0] + b_box[2]) / 4
    amp_cy = (a_box[3] + b_box[1]) / 2 + AMP_DROP
    # place the scaled glyph so its ink centre lands on (amp_cx, amp_cy)
    tx = amp_cx - (raw_bounds[0] + raw_bounds[2]) / 2 * amp_scale
    ty = amp_cy - (raw_bounds[1] + raw_bounds[3]) / 2 * amp_scale
    amp_xform = Transform(upm_scale * amp_scale, 0, 0, -upm_scale * amp_scale, tx, ty)
    amp_d = glyph_path(font, amp_name, amp_xform)
    amp_bounds = glyph_bounds(font, amp_name, amp_xform)
    amp_box = {
        "x": amp_bounds[0],
        "y": amp_bounds[1],
        "w": amp_bounds[2] - amp_bounds[0],
        "h": amp_bounds[3] - amp_bounds[1],
    }

    ink = union([a_box, b_box])
    vb_x = ink[0] - BREATHE_X
    vb_y = ink[1] - BREATHE_TOP
    vb_w = (ink[2] - ink[0]) + BREATHE_X * 2
    vb_h = (ink[3] - ink[1]) + BREATHE_TOP + BREATHE_BOTTOM

    def fmt(v: float) -> float:
        return round(v, 2)

    def line(text: str, glyphs, box):
        return {
            "text": text,
            "box": {
                "x": fmt(box[0]),
                "y": fmt(box[1]),
                "w": fmt(box[2] - box[0]),
                "h": fmt(box[3] - box[1]),
            },
            "glyphs": [
                {
                    "char": g["char"],
                    "id": g["id"],
                    "d": g["d"],
                    "box": {
                        "x": fmt(g["bounds"][0]),
                        "y": fmt(g["bounds"][1]),
                        "w": fmt(g["bounds"][2] - g["bounds"][0]),
                        "h": fmt(g["bounds"][3] - g["bounds"][1]),
                    }
                    if g["bounds"]
                    else None,
                }
                for g in glyphs
            ],
        }

    art = {
        "provenance": {
            "family": "Tangerine",
            "weight": 700,
            "unitsPerEm": upm,
            "source": "assets/fonts/Tangerine-Bold.ttf",
            "sha256": sha,
            "generatedBy": "scripts/generate-name-outlines.py",
        },
        "em": EM,
        "viewBox": f"{fmt(vb_x)} {fmt(vb_y)} {fmt(vb_w)} {fmt(vb_h)}",
        "emWidth": fmt(vb_w / EM),
        "emHeight": fmt(vb_h / EM),
        "cascade": {
            "finalACentreX": fmt(a_centre),
            "jCentreX": fmt(j_centre),
            "appliedShift": fmt(shift),
        },
        "amp": {
            "id": "amp",
            "d": amp_d,
            "box": {k: fmt(v) for k, v in amp_box.items()},
        },
        "lineA": line(LINE_A, a_glyphs, a_box),
        "lineB": line(LINE_B, b_glyphs, b_box),
    }

    # ── Emit TypeScript ──────────────────────────────────────────────────
    body = json.dumps(art, indent=2, ensure_ascii=False)
    OUT_TS.parent.mkdir(parents=True, exist_ok=True)
    OUT_TS.write_text(
        "/**\n"
        " * GENERATED FILE — DO NOT EDIT BY HAND.\n"
        " *\n"
        " * Produced by scripts/generate-name-outlines.py from the vendored\n"
        " * Tangerine 700 in assets/fonts/. Re-run that script if the couple's\n"
        " * names, the typeface or the weight change; PanelWelcome falls back to\n"
        " * plain text until you do, so nothing breaks in the meantime.\n"
        " *\n"
        " * These are letterform OUTLINES traced from the font — a document\n"
        " * created with it, in the sense of OFL 1.1 section 1, not a\n"
        " * redistribution of the font itself. The binary they came from ships\n"
        " * its own notice; see assets/fonts/README.md.\n"
        " *\n"
        " * Units: hundredths of an em, y-down, line A's baseline at y=0.\n"
        " */\n\n"
        f"export const nameOutlines = {body} as const;\n\n"
        "export type NameOutlines = typeof nameOutlines;\n",
        encoding="utf-8",
    )

    # ── Emit the drawing aid ─────────────────────────────────────────────
    write_debug_svg(art)

    print(f"  wrote {OUT_TS.relative_to(ROOT)}")
    print(f"  wrote {OUT_SVG.relative_to(ROOT)}")
    print()
    print(f"  viewBox        {art['viewBox']}")
    print(f"  em box         {art['emWidth']} x {art['emHeight']} em")
    print(f"  cascade shift  {art['cascade']['appliedShift']}  "
          f"(final a centre {art['cascade']['finalACentreX']} == J centre {art['cascade']['jCentreX']})")
    for ln in ("lineA", "lineB"):
        g = art[ln]
        print(f"  {g['text']:<5} box {g['box']['w']} x {g['box']['h']}  "
              f"glyphs {[x['id'] for x in g['glyphs']]}")


def write_debug_svg(art) -> None:
    """
    Three panels side by side. Panel 2 is the one that matters.

      1  the outline in grey over a numbered 10-unit grid, so a centreline
         can be authored against real coordinates
      2  the outline in RED with the candidate centreline stroked WHITE on
         top at the exact mask width — ANY RED LEFT IS INK THE PEN WILL
         NEVER REVEAL. No boolean geometry needed to answer the only
         question that matters.
      3  the centreline alone, with a numbered dot at each stroke start

    Panels 2 and 3 are empty until name-strokes.ts exists; re-run this after
    authoring strokes and paste them into STROKES below to check coverage.
    """
    vb = [float(v) for v in art["viewBox"].split()]
    w, h = vb[2], vb[3]
    pad = 6
    gap = 8

    def glyph_paths(fill):
        out = []
        for ln in ("lineA", "lineB"):
            for g in art[ln]["glyphs"]:
                out.append(f'<path d="{g["d"]}" fill="{fill}"/>')
        return "\n      ".join(out)

    grid = []
    step = 10
    x = int(vb[0] // step) * step
    while x < vb[0] + w:
        grid.append(f'<line x1="{x}" y1="{vb[1]}" x2="{x}" y2="{vb[1]+h}" '
                    f'stroke="#c8d8ff" stroke-width="0.3"/>')
        grid.append(f'<text x="{x+1}" y="{vb[1]+5}" font-size="3.4" fill="#7a9">{x}</text>')
        x += step
    y = int(vb[1] // step) * step
    while y < vb[1] + h:
        grid.append(f'<line x1="{vb[0]}" y1="{y}" x2="{vb[0]+w}" y2="{y}" '
                    f'stroke="#c8d8ff" stroke-width="0.3"/>')
        grid.append(f'<text x="{vb[0]+1}" y="{y-1}" font-size="3.4" fill="#7a9">{y}</text>')
        y += step
    grid = "\n      ".join(grid)

    total_w = w * 3 + gap * 2 + pad * 2
    total_h = h + pad * 2

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 {total_w:.1f} {total_h:.1f}" width="{total_w*8:.0f}">
  <rect width="100%" height="100%" fill="#fff"/>

  <!-- 1: outline over a coordinate grid -->
  <g transform="translate({pad - vb[0]},{pad - vb[1]})">
    <g>
      {grid}
      {glyph_paths("#00000026")}
      <line x1="{vb[0]}" y1="0" x2="{vb[0]+w}" y2="0" stroke="#f0a" stroke-width="0.4"/>
      <line x1="{vb[0]}" y1="{LINE_GAP}" x2="{vb[0]+w}" y2="{LINE_GAP}" stroke="#f0a" stroke-width="0.4"/>
    </g>
  </g>

  <!-- 2: residue check -->
  <g transform="translate({pad + w + gap - vb[0]},{pad - vb[1]})">
    <g>
      {glyph_paths("#e11")}
      <g id="pen-check" fill="none" stroke="#fff" stroke-width="14"
         stroke-linecap="round" stroke-linejoin="round"></g>
    </g>
  </g>

  <!-- 3: the centreline alone -->
  <g transform="translate({pad + (w + gap) * 2 - vb[0]},{pad - vb[1]})">
    <g>
      {glyph_paths("#00000012")}
      <g id="pen-core" fill="none" stroke="#c0f" stroke-width="1"
         stroke-linecap="round"></g>
    </g>
  </g>
</svg>
"""
    OUT_SVG.parent.mkdir(parents=True, exist_ok=True)
    OUT_SVG.write_text(svg, encoding="utf-8")


if __name__ == "__main__":
    main()
