/*
 * Proves the collage in globals.css is an exact tiling.
 *
 *     node scripts/check-collage.mjs
 *
 * IT READS THE STYLESHEET, not the generator's output, and that is the
 * whole point. The old scatter checker verified a separate layout file
 * that the CSS was supposed to match — so the two could drift, and a
 * hand-edit to globals.css would pass a check that never looked at it.
 * This parses the rules that actually ship.
 *
 * What it proves, for each of the two grids:
 *
 *   EXACT COVER — every cell used exactly once. A hole is a missing
 *   photograph and reads as a loading failure; an overlap silently hides
 *   one, which is worse because nothing looks wrong.
 *
 *   EVERY PHOTOGRAPH PRESENT — eighteen tiles, numbered 1..18 with no
 *   gaps or repeats, because a duplicated nth-child would leave one
 *   photograph unplaced and stack two in one cell.
 *
 *   IN BOUNDS — no tile runs past the column or row count.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, "..", "src", "app", "globals.css"), "utf8");

/* The phone rules sit at the top level; the wide ones inside a breakpoint
   and are indented. That indent is the only thing telling them apart, so
   it is what the split keys on.

   `[ \t]*` and NOT `\s*` — `\s` matches newlines, so with the `m` flag a
   greedy `\s*` after `^` will start at the blank line ABOVE a rule and
   swallow the line break as if it were indentation. Every unindented rule
   then looks indented, and all thirty-six land in one group. That was not
   hypothetical: it reported 0 phone tiles and 36 wide ones. */
const RULE =
  /^([ \t]*)\.prints > li:nth-child\((\d+)\)[ \t]*\{[ \t]*--col:[ \t]*(\d+);[ \t]*--row:[ \t]*(\d+);[ \t]*--cw:[ \t]*(\d+);[ \t]*--ch:[ \t]*(\d+);[ \t]*\}/gm;

const groups = { phone: [], wide: [] };
for (const m of css.matchAll(RULE)) {
  const [, indent, n, col, row, cw, ch] = m;
  groups[indent.length ? "wide" : "phone"].push({
    n: +n,
    c: +col - 1,
    r: +row - 1,
    w: +cw,
    h: +ch,
  });
}

const GRIDS = {
  phone: { cols: 5, rows: 8 },
  wide: { cols: 10, rows: 4 },
};

let failed = false;
for (const [name, tiles] of Object.entries(groups)) {
  const { cols, rows } = GRIDS[name];
  const problems = [];

  const nums = tiles.map((t) => t.n).sort((a, b) => a - b);
  const expected = Array.from({ length: 18 }, (_, i) => i + 1);
  if (nums.length !== 18 || nums.some((v, i) => v !== expected[i])) {
    problems.push(
      `expected photographs 1..18, found ${nums.length}: ${nums.join(",")}`,
    );
  }

  const seen = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (const t of tiles) {
    if (t.c + t.w > cols || t.r + t.h > rows) {
      problems.push(
        `photo ${t.n} (${t.w}x${t.h} at col ${t.c + 1}, row ${t.r + 1}) runs off the ${cols}x${rows} grid`,
      );
      continue;
    }
    for (let y = t.r; y < t.r + t.h; y++)
      for (let x = t.c; x < t.c + t.w; x++) seen[y][x]++;
  }

  const holes = [];
  const overlaps = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (seen[r][c] === 0) holes.push(`col ${c + 1} row ${r + 1}`);
      if (seen[r][c] > 1) overlaps.push(`col ${c + 1} row ${r + 1}`);
    }
  if (holes.length)
    problems.push(`${holes.length} empty cell(s): ${holes.slice(0, 8).join("; ")}`);
  if (overlaps.length)
    problems.push(
      `${overlaps.length} overlapping cell(s): ${overlaps.slice(0, 8).join("; ")}`,
    );

  const kinds = new Set(tiles.map((t) => `${t.w}x${t.h}`));
  const cells = tiles.reduce((s, t) => s + t.w * t.h, 0);
  console.log(
    `\n${name} (${cols}x${rows} = ${cols * rows} cells) — ` +
      `${tiles.length} photos, ${cells} cells used, ${kinds.size} tile sizes ` +
      `(${[...kinds].sort().join(", ")})`,
  );
  if (problems.length) {
    failed = true;
    problems.forEach((p) => console.log(`  ${p}`));
  } else {
    console.log("  PASS — exact tiling, every photograph placed once");
  }
}

if (failed) {
  console.log("\nFIX THE ABOVE.");
  process.exit(1);
}
console.log("\nBoth collages tile exactly.");
