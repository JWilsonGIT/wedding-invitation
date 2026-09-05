/*
 * Packs the gallery photographs into a collage — varied tile sizes, tiled
 * edge to edge with no gaps and no overlaps.
 *
 *     node scripts/gen-collage.mjs           # emit the CSS
 *     node scripts/gen-collage.mjs --seeds   # score candidate seeds
 *
 * WHY A PACKER AND NOT `grid-auto-flow: dense`. Dense auto-placement will
 * fill a grid, but it decides where things go at layout time and it is free
 * to leave holes when nothing fits — which on a photo collage reads as a
 * missing photograph rather than as negative space. Worse, the result
 * changes with the column count, so a layout that looks right on one screen
 * can open a hole on another.
 *
 * Placing every tile explicitly makes the tiling a fact that can be
 * CHECKED: this script only emits a layout it has proved is an exact cover
 * — every cell of the grid used exactly once, by exactly one photograph.
 *
 * THE SIZE MIX IS THE POINT. A collage of equal tiles is a contact sheet.
 * The multiset of spans below is chosen so the cell count lands exactly on
 * columns x rows, which is what makes a hole-free tiling possible at all:
 *
 *     cells = 4a + 2b + 2c + d  where a = 2x2, b = 2x1, c = 1x2, d = 1x1
 *     items = a + b + c + d = 18
 *
 * Both have to balance, so the mix is solved rather than picked.
 */

import { pathToFileURL } from "node:url";

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/*
 * Exact-cover packing, scanning row-major.
 *
 * At each step it takes the first empty cell and tries the remaining tiles
 * in a shuffled order, keeping any that fits. Backtracks when it strands a
 * cell nothing can fill. A grid this small is solved in microseconds, and
 * the shuffle is what makes different seeds give genuinely different
 * collages rather than the same one with the sizes relabelled.
 */
function pack(cols, rows, sizes, seed) {
  const rand = rng(seed);
  const order = sizes.map((s, i) => ({ ...s, i }));
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const grid = Array.from({ length: rows }, () => new Array(cols).fill(-1));
  const placed = new Array(order.length).fill(null);
  const used = new Array(order.length).fill(false);

  const firstEmpty = () => {
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) if (grid[r][c] === -1) return [r, c];
    return null;
  };
  const fits = (r, c, w, h) => {
    if (r + h > rows || c + w > cols) return false;
    for (let y = r; y < r + h; y++)
      for (let x = c; x < c + w; x++) if (grid[y][x] !== -1) return false;
    return true;
  };
  const paint = (r, c, w, h, v) => {
    for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) grid[y][x] = v;
  };

  const step = () => {
    const cell = firstEmpty();
    if (!cell) return used.every(Boolean);
    const [r, c] = cell;
    for (let k = 0; k < order.length; k++) {
      if (used[k]) continue;
      const { w, h } = order[k];
      if (!fits(r, c, w, h)) continue;
      used[k] = true;
      paint(r, c, w, h, k);
      placed[k] = { r, c, w, h };
      if (step()) return true;
      used[k] = false;
      paint(r, c, w, h, -1);
      placed[k] = null;
    }
    return false;
  };

  if (!step()) return null;
  /* Back to the caller's original order, carrying each tile's placement. */
  const out = new Array(order.length);
  order.forEach((o, k) => {
    out[o.i] = { ...placed[k], w: o.w, h: o.h };
  });
  return out;
}

/* Proves the emitted layout really is an exact cover. Deliberately a
   separate pass from the packer — the packer could be wrong. */
function verify(tiles, cols, rows) {
  const seen = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (const t of tiles)
    for (let y = t.r; y < t.r + t.h; y++)
      for (let x = t.c; x < t.c + t.w; x++) {
        if (y >= rows || x >= cols) return `tile at ${t.r},${t.c} runs off the grid`;
        seen[y][x]++;
      }
  const over = [];
  const holes = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (seen[r][c] === 0) holes.push(`${r},${c}`);
      if (seen[r][c] > 1) over.push(`${r},${c}`);
    }
  if (holes.length) return `${holes.length} empty cell(s): ${holes.slice(0, 6).join(" ")}`;
  if (over.length) return `${over.length} overlapping cell(s): ${over.slice(0, 6).join(" ")}`;
  return null;
}

/* How varied is it? A collage of one size is a contact sheet. */
function score(tiles) {
  const areas = tiles.map((t) => t.w * t.h);
  const kinds = new Set(tiles.map((t) => `${t.w}x${t.h}`));
  /* Are the big tiles spread out, or clumped in one corner? */
  const big = tiles.filter((t) => t.w * t.h >= 4);
  let spread = 0;
  for (let i = 0; i < big.length; i++)
    for (let j = i + 1; j < big.length; j++)
      spread += Math.hypot(big[i].r - big[j].r, big[i].c - big[j].c);
  return {
    kinds: kinds.size,
    biggest: Math.max(...areas),
    bigSpread: +(spread / Math.max(1, (big.length * (big.length - 1)) / 2)).toFixed(2),
  };
}

/*
 * The two grids.
 *
 * WIDE: 10 columns x 4 rows = 40 cells. Six 2x2, three 2x1, one 1x2,
 *       eight 1x1 -> 24 + 6 + 2 + 8 = 40, and 6 + 3 + 1 + 8 = 18.
 *
 *       WIDE AND SHALLOW ON PURPOSE. The panel gives the collage a fixed
 *       HEIGHT budget and lets it take whatever width that allows, so rows
 *       are the scarce resource and columns are nearly free — at 1440x900
 *       the stage was 1376px wide with the grid using only 704 of it.
 *       Fewer, taller rows spend the free width on bigger cells instead of
 *       leaving it empty, and 10x4 on a 2.5:1 grid makes the cells square,
 *       which 7x6 on 16:9 did not (they were 1.5:1 letterboxes).
 * PHONE: 5 columns x 8 rows = 40 cells. Five 2x2, four 2x1, three 1x2,
 *       six 1x1 -> 20 + 8 + 6 + 6 = 40, and 5 + 4 + 3 + 6 = 18.
 */
const mix = (a, b, c, d) => [
  ...Array.from({ length: a }, () => ({ w: 2, h: 2 })),
  ...Array.from({ length: b }, () => ({ w: 2, h: 1 })),
  ...Array.from({ length: c }, () => ({ w: 1, h: 2 })),
  ...Array.from({ length: d }, () => ({ w: 1, h: 1 })),
];

const WIDE = { name: "wide", cols: 10, rows: 4, sizes: mix(6, 3, 1, 8) };
const PHONE = { name: "phone", cols: 5, rows: 8, sizes: mix(5, 4, 3, 6) };

function emit(cfg, tiles, indent) {
  return tiles
    .map(
      (t, i) =>
        `${indent}.prints > li:nth-child(${i + 1})${i + 1 > 9 ? "" : " "} ` +
        `{ --col: ${t.c + 1}; --row: ${t.r + 1}; --cw: ${t.w}; --ch: ${t.h}; }`,
    )
    .join("\n");
}

const isCli = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isCli) {
  const args = process.argv.slice(2);
  if (args.includes("--seeds")) {
    for (const cfg of [WIDE, PHONE]) {
      console.log(`\n${cfg.name} (${cfg.cols}x${cfg.rows}, ${cfg.sizes.length} photos):`);
      for (let seed = 1; seed <= 24; seed++) {
        const tiles = pack(cfg.cols, cfg.rows, cfg.sizes, seed);
        if (!tiles) {
          console.log(`  seed ${String(seed).padStart(2)}  no exact tiling`);
          continue;
        }
        const bad = verify(tiles, cfg.cols, cfg.rows);
        const s = score(tiles);
        console.log(
          `  seed ${String(seed).padStart(2)}  ${bad ? "FAIL " + bad : "exact"}` +
            `  kinds ${s.kinds}  big spread ${s.bigSpread}`,
        );
      }
    }
  } else {
    const seeds = { wide: Number(args[0] ?? 1), phone: Number(args[1] ?? 1) };
    for (const cfg of [PHONE, WIDE]) {
      const tiles = pack(cfg.cols, cfg.rows, cfg.sizes, seeds[cfg.name]);
      if (!tiles) throw new Error(`no tiling for ${cfg.name} seed ${seeds[cfg.name]}`);
      const bad = verify(tiles, cfg.cols, cfg.rows);
      if (bad) throw new Error(`${cfg.name}: ${bad}`);
      console.log(`/* ${cfg.name} — ${cfg.cols}x${cfg.rows}, seed ${seeds[cfg.name]} */`);
      console.log(emit(cfg, tiles, cfg.name === "wide" ? "  " : ""));
      console.log("//", JSON.stringify(score(tiles)));
    }
  }
}

export { pack, verify, score, WIDE, PHONE };
