# Vendored fonts

Build-time only. **Nothing in this directory is served to guests.**

It lives in `assets/`, not `public/`, deliberately: `public/` is served, and a guest
must never download these. The site's actual webfonts come from `next/font/google`,
which fetches, subsets and serves its own copies at build time. These files exist
solely so `scripts/generate-name-outlines.py` can be re-run.

## Tangerine-Bold.ttf

The couple's names on Panel I are drawn as SVG outlines rather than set as text, so
they can be animated stroke by stroke. Those outlines are generated from this file.

| | |
|---|---|
| Family / weight | Tangerine, 700 |
| Copyright | Copyright (c) 2010 by Toshi Omagari. All rights reserved. |
| Licence | SIL Open Font License 1.1 |
| Upstream | https://fonts.google.com/specimen/Tangerine — https://github.com/google/fonts/tree/main/ofl/tangerine |
| Obtained from | `.next/static/media/b89b762ca15e5cab-s.p.0s59japw84yl-.woff2` |
| Source sha256 | `cfa07b5321647282012d8d42b9dfcb1ce8fb2d02dac5d9af0840d8ebe384ce47` |
| Conversion | `TTFont(woff2).flavor = None` (fontTools 4.63.0) — decompression only |
| unitsPerEm | 1000 |

### Two things to know

**This is `next/font`'s subset, not the upstream family.** 211 cmap entries, 213
glyphs — latin only. It contains `A n a J &` , which is all the artwork needs. The
generator asserts coverage and aborts rather than silently emitting `.notdef`.

**It is a decompression, not a modification.** The glyf table is byte-faithful to
what `next/font` serves. Nothing was re-hinted, re-subset or renamed. That matters
under OFL: a *modified* version may not use the Reserved Font Name "Tangerine", and
this one is entitled to it.

### On the generated outlines

`src/components/deck/name-outlines.generated.ts` contains path data traced from
these glyphs. Under OFL §1 that is a *document created using the font*, not a
redistribution of the font, and it carries no OFL obligation of its own. The font
binary here does, which is why it ships with its notice.

## TODO before this repo is published

`OFL.txt` is **not yet in this directory.** Copy the verbatim licence from
`https://github.com/google/fonts/blob/main/ofl/tangerine/OFL.txt` and commit it
here. I have deliberately not written it from memory — a subtly wrong licence text
is worse than an obvious gap, and the notice has to travel with the binary.
