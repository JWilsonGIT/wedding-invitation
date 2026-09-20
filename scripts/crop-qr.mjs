/*
 * Crops the QR code out of a payment-app screenshot.
 *
 *     node scripts/crop-qr.mjs
 *
 * The screenshots are whole phone screens: a brand header, the account
 * holder's real name, a masked account number, footer copy and, on one of
 * them, a referral advert. Only the code belongs on the invitation, and
 * the name in particular must not ship.
 *
 * FINDING THE CODE RATHER THAN BEING TOLD WHERE IT IS. Hand-entered crop
 * boxes are wrong the moment a screenshot is retaken on a different phone,
 * and nothing catches it but an eye on the result. So the box is measured.
 *
 * WHAT A QR IS, TO A MEASUREMENT. Not "the dark part" — every one of these
 * screens has dark text and three have a dark wordmark. It is the one
 * element that is a large, SQUARE, densely-filled blob. So: threshold to
 * near-black, blur the modules together into one shape, find every
 * connected shape, and take the biggest one that is square and solid.
 *
 * TWO SIMPLER TESTS THAT BOTH FAILED, since the reasons are the design:
 *
 *   Luminance for "dark" said GCash's saturated blue background was darker
 *   than mid-grey, and the script decided the whole 1086x2048 screenshot
 *   was one enormous QR code. Darkness has to be per-channel: near-black
 *   means every channel low, which blue (b=255) is not.
 *
 *   Scanning for rows that are mostly dark measured each row against the
 *   FULL image width, but Maya's code covers 45% of it. A sparse row of
 *   the code then scores under the threshold, splitting it in two, and
 *   "the longest run" picked the bottom half and some footer text.
 *
 * WHY PNG OUT. A QR is high-frequency black and white, exactly what JPEG
 * is worst at; its ringing lands inside the module grid. PNG at the native
 * crop size keeps every module edge hard. Nothing is resampled, so
 * nothing is softened.
 */

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const banks = join(here, "..", "public", "images", "banks");

/* Near-black, per channel. Also rejects the coloured InstaPay badge sitting
   at the centre of all four of these codes. */
const DARK = 110;
/* The detection grid. Coarse on purpose: one cell is dark if ANY pixel in
   it is, which welds the modules of a code into a single shape while
   leaving a gap of white between separate elements of the page. */
const GRID = 420;
/* Quiet zone, as a fraction of the code's width. A QR is unreadable
   without clear space around it. */
const QUIET = 0.08;

function components(mask, w, h) {
  const seen = new Uint8Array(w * h);
  const out = [];
  const stack = [];
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || seen[s]) continue;
    stack.push(s);
    seen[s] = 1;
    let n = 0;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    while (stack.length) {
      const i = stack.pop();
      const x = i % w;
      const y = (i - x) / w;
      n++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      /* 8-connected: a QR's diagonal module corners touch only at a point. */
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const j = ny * w + nx;
          if (mask[j] && !seen[j]) {
            seen[j] = 1;
            stack.push(j);
          }
        }
    }
    out.push({ n, x0, y0, x1, y1 });
  }
  return out;
}

async function crop(name) {
  const src = join(banks, `${name}_qr.jpg`);
  const meta = await sharp(src).metadata();
  const { width, height } = meta;

  const scale = GRID / Math.max(width, height);
  const gw = Math.max(1, Math.round(width * scale));
  const gh = Math.max(1, Math.round(height * scale));

  const { data, info } = await sharp(src)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ch = info.channels;

  /* Block-max onto the detection grid: a cell is set when any pixel under
     it is near-black. */
  const mask = new Uint8Array(gw * gh);
  for (let y = 0; y < height; y++) {
    const gy = Math.min(gh - 1, Math.floor(y * scale));
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * ch;
      if (data[i] < DARK && data[i + 1] < DARK && data[i + 2] < DARK) {
        mask[gy * gw + Math.min(gw - 1, Math.floor(x * scale))] = 1;
      }
    }
  }

  const cands = components(mask, gw, gh)
    .map((c) => {
      const cw = c.x1 - c.x0 + 1;
      const chh = c.y1 - c.y0 + 1;
      return { ...c, cw, ch: chh, aspect: cw / chh, fill: c.n / (cw * chh) };
    })
    /* Square, solid, and not a speck. A line of text is wide and thin; a
       wordmark is wide and sparse. */
    /* 0.40, not 0.5: BDO's code is a sparser one and measures 0.47. The
       floor is there to reject a wordmark, and those sit near 0.2 while
       also failing the aspect test, so there is room below 0.47. */
    .filter((c) => c.aspect > 0.8 && c.aspect < 1.25 && c.fill > 0.4 && c.cw > gw * 0.15)
    .sort((a, b) => b.cw * b.ch - a.cw * a.ch);

  if (!cands.length) throw new Error(`${name}: no square dense blob found`);
  const q = cands[0];

  /* Back to source pixels. */
  const left = q.x0 / scale;
  const top = q.y0 / scale;
  const side = Math.max(q.cw, q.ch) / scale;

  /* THE QUIET ZONE IS PAINTED, NOT CROPPED. Taking it from the screenshot
     is what a wider crop box does, and it drags in whatever the app put
     next to the code: MariBank's logo has a blue wave that dips into the
     space above, Maya has the top of a grey pill below. Neither would stop
     a scanner, but both look like a sloppy crop on the card. Extracting
     the code alone and extending it with white gives a clean margin on
     every side regardless of what surrounded it.

     The extract is grown by a couple of detection cells first: the grid is
     coarse, so its idea of the edge can be a module short. */
  const cell = Math.ceil(2 / scale);
  const inner = Math.round(side) + cell * 2;
  let x0 = Math.round(left + side / 2 - inner / 2);
  let y0 = Math.round(top + side / 2 - inner / 2);
  x0 = Math.max(0, Math.min(x0, width - inner));
  y0 = Math.max(0, Math.min(y0, height - inner));

  const pad = Math.round(side * QUIET);
  const out = join(banks, `${name}-qr.png`);

  const cut = await sharp(src)
    .extract({ left: x0, top: y0, width: inner, height: inner })
    /* Two of these sit the code on a tinted card, so flatten before the
       margin goes on or the two whites will not match. */
    .flatten({ background: "#ffffff" })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: "#ffffff" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  /*
   * SNAP THE GREYS, KEEP THE COLOURS.
   *
   * The source is a JPEG of a screen, so a module that should be one black
   * is a cloud of near-blacks with ringing along every edge. That is the
   * blur, and it is in the pixels before any of this is displayed: the
   * edges are already soft, and a PNG then stores every shade of that
   * softness, which is why a two-colour image was costing 200KB.
   *
   * Anything near-grey is therefore snapped to pure black or pure white.
   * Module edges go hard, the files collapse to a few KB, and a scanner
   * gets the clean bimodal image its binarizer is looking for.
   *
   * Saturated pixels are left exactly as they are. The InstaPay badge at
   * the centre of all four codes is blue and red; thresholding it by
   * luminance would turn it into a black blob, enlarging the obstruction
   * the code's error correction has to work around.
   */
  const px = cut.data;
  const chans = cut.info.channels;
  for (let i = 0; i < px.length; i += chans) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min > 45) continue; // coloured: leave it alone
    const v = 0.299 * r + 0.587 * g + 0.114 * b < 128 ? 0 : 255;
    px[i] = px[i + 1] = px[i + 2] = v;
  }

  await sharp(px, {
    raw: { width: cut.info.width, height: cut.info.height, channels: chans },
  })
    .png({ compressionLevel: 9, palette: true })
    .toFile(out);

  console.log(
    `${name.padEnd(9)} ${width}x${height} -> code ${Math.round(side)}px ` +
      `(aspect ${q.aspect.toFixed(2)}, fill ${q.fill.toFixed(2)}) ` +
      `-> ${inner + pad * 2}px with a ${pad}px painted quiet zone`,
  );
}

for (const n of ["gcash", "maya", "bdo", "maribank"]) await crop(n);
