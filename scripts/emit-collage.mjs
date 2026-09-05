import { pack, verify, WIDE, PHONE } from "./gen-collage.mjs";

const seeds = { wide: 1, phone: 12 };

function fmt(tiles, indent) {
  return tiles
    .map(
      (q, i) =>
        indent +
        ".prints > li:nth-child(" +
        (i + 1) +
        ")" +
        (i + 1 > 9 ? "" : " ") +
        " { --col: " +
        (q.c + 1) +
        "; --row: " +
        (q.r + 1) +
        "; --cw: " +
        q.w +
        "; --ch: " +
        q.h +
        "; }",
    )
    .join("\n");
}

const w = pack(WIDE.cols, WIDE.rows, WIDE.sizes, seeds.wide);
const p = pack(PHONE.cols, PHONE.rows, PHONE.sizes, seeds.phone);
const bad = verify(w, WIDE.cols, WIDE.rows) || verify(p, PHONE.cols, PHONE.rows);
if (bad) throw new Error("not an exact cover: " + bad);

console.log(JSON.stringify({ wide: fmt(w, "  "), phone: fmt(p, "") }));
