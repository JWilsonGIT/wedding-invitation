/*
 * Trims the empty margin off each payment logo.
 *
 *     node scripts/normalise-logos.mjs           # report only
 *     node scripts/normalise-logos.mjs --write   # write the trimmed files
 *
 * WHY THIS EXISTS. The gift cards show each provider's mark in a chip of
 * fixed HEIGHT, which is the right way to normalise marks of different
 * proportions — every logo comes out the same height and as wide as its own
 * shape wants. That only works if each file is cropped to its artwork.
 * These four were not:
 *
 *     bdo-logo.webp        400x400    ink 345x123    31% of the height
 *     maya-logo.jpg       1080x720    ink 770x222    31%
 *     g-cash-logo.png      320x320    ink 288x243    76%
 *     maribank-logo.png    512x512    ink 512x512   100%
 *
 * So BDO and Maya rendered at a third the size of MariBank — not because
 * anyone chose that, but because two of the files carry a wide empty
 * border and two do not. Trimming to the ink makes the four agree.
 *
 * SOURCES LIVE IN assets/banks/, NOT public/. Everything under public/ is
 * served, so keeping untouched originals there would ship them to guests
 * for no reason. `assets/` already holds the vendored font for the same
 * reason: it is input to the build, not output of it.
 *
 * Re-run this after dropping a new logo into assets/banks/.
 */

import { readdirSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const SRC = "assets/banks";
const OUT = "public/images/banks";

/* A pixel is "ink" if it is neither transparent nor near-white. Both tests
   are needed: two of these files use alpha and two have white baked in. */
function isInk(r, g, b, a) {
  if (a <= 24) return false;
  return !(r > 242 && g > 242 && b > 242);
}

async function inkBox(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -1,
    y1 = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      if (!isInk(data[i], data[i + 1], data[i + 2], data[i + 3])) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return null;
  return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1, info };
}

const write = process.argv.includes("--write");
if (write && !existsSync(OUT)) mkdirSync(OUT, { recursive: true });

for (const name of readdirSync(SRC).sort()) {
  if (!/\.(png|jpe?g|webp)$/i.test(name)) continue;
  /* `*.original.*` is a superseded file kept for reference, not a logo to
     publish. Skipped rather than deleted — it is the author's file. */
  if (/\.original\./i.test(name)) {
    console.log(`  ${name.padEnd(22)} skipped (kept as reference)`);
    continue;
  }
  const src = join(SRC, name);
  const box = await inkBox(src);
  if (!box) {
    console.log(`  ${name.padEnd(22)} SKIPPED — no ink found`);
    continue;
  }
  const { info } = box;
  const fillsW = ((box.width / info.width) * 100).toFixed(0);
  const fillsH = ((box.height / info.height) * 100).toFixed(0);

  /*
    A small margin back, in the mark's own terms rather than a fixed number
    of pixels — these canvases range from 320px to 1080px wide, so a fixed
    inset would be generous on one and invisible on another. Without any
    margin the marks butt right against the chip's edge.
  */
  const pad = Math.round(Math.max(box.width, box.height) * 0.04);
  const left = Math.max(0, box.left - pad);
  const top = Math.max(0, box.top - pad);
  const region = {
    left,
    top,
    width: Math.min(info.width - left, box.width + pad * 2),
    height: Math.min(info.height - top, box.height + pad * 2),
  };

  console.log(
    `  ${name.padEnd(22)} ${String(info.width + "x" + info.height).padEnd(11)}` +
      ` ink ${String(box.width + "x" + box.height).padEnd(10)} (${fillsW}% w, ${fillsH}% h)` +
      ` -> ${region.width}x${region.height}`,
  );

  if (write) {
    await sharp(src).extract(region).toFile(join(OUT, name));
  }
}

if (!write) console.log("\n(report only — pass --write to apply)");
