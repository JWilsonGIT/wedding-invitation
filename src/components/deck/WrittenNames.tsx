import { nameOutlines } from "./name-outlines.generated";
import { nameStrokes } from "./name-strokes.generated";

/*
  ═══════════════════════════════════════════════════════════════════════
  THE NAMES, WRITTEN RATHER THAN SET

  Each letter is revealed along the path a pen would actually travel: down
  the stem, round the bowl, out through the join. That needs the letters as
  geometry, so these are Tangerine's real outlines traced into SVG (see
  scripts/generate-name-outlines.py) with hand-drawn centrelines masking
  them in (scripts/strokes.json).

  HOW THE REVEAL WORKS. Each glyph has its own <mask> containing the pen
  strokes for that glyph, stroked thick in white. Animating the mask's
  stroke-dashoffset walks the reveal along the pen's route. The visible art
  is the FILLED outline, so Tangerine's thick/thin contrast survives — a
  plain stroked centreline would flatten the face into a monoline.

  ONE MASK PER GLYPH, NOT PER WORD. A pen wide enough to cover the `n`
  reliably has a round cap that reaches into the `a` beside it, and with a
  shared mask that would reveal a sliver of the next letter early. Pairing
  each mask with only its own glyph's outline makes that impossible rather
  than merely unlikely.

  THE SETTLE LAYER. A hand-drawn centreline never covers a letterform
  perfectly — the tip of a swash, the inside of a tight counter. An
  identical unmasked copy of every outline cross-fades in as each line
  finishes, so any residue fills itself. It also carries the whole
  fail-safe: it rests at opacity 1, so if the animation never runs, the
  names are simply THERE. See globals.css.

  IDS ARE STATIC on purpose — not useId(). Panel I mounts once, `url(#…)`
  wants something greppable, and React 19's generated ids are awkward
  inside a functional-IRI. If this component is ever rendered twice on one
  page the ids must be namespaced then, not before.
  ═══════════════════════════════════════════════════════════════════════
*/

type Line = "a" | "amp" | "b";

const strokeAttrs = {
  fill: "none" as const,
  stroke: "#fff",
  strokeWidth: nameStrokes.width,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  /* Normalised so the dash maths is identical for every stroke regardless
     of its true length. Browsers honour this; librsvg does not, which is
     why the offline preview computes real lengths instead. */
  pathLength: 1,
};

/*
  The gradient's stops, spread evenly along it. The colours themselves live
  in globals.css beside the contrast notes — only the COUNT is structural,
  and it is derived rather than written down, so adding or removing a stop
  here is the whole edit.
*/
const INK_STOPS = [
  "var(--writing-1)",
  "var(--writing-2)",
  "var(--writing-3)",
  "var(--writing-4)",
  "var(--writing-5)",
];

function penFor(glyphId: string) {
  return (["a", "amp", "b"] as Line[]).flatMap((line) =>
    nameStrokes.lines[line]
      .filter((s) => s.glyph === glyphId)
      .map((s) => ({ ...s, line })),
  );
}

export function WrittenNames() {
  /*
    The ampersand is one of these now, not a special case.

    It began as a hand-drawn monoline mark, on the argument that a script
    ampersand between two script names reads as a third name. That argument
    does not survive the names becoming drawn letterforms: a uniform-width
    stroke beside letters with heavy thick/thin modulation matches no
    typeface at all, and it showed. Tangerine's own ampersand carries the
    same modulation as the letters, so it belongs by construction — scaled
    down, because it is punctuation and should not carry a name's weight.
  */
  const glyphs = [
    ...nameOutlines.lineA.glyphs.map((g) => ({ ...g, line: "a" as Line })),
    { ...nameOutlines.amp, line: "amp" as Line },
    ...nameOutlines.lineB.glyphs.map((g) => ({ ...g, line: "b" as Line })),
  ];

  return (
    <svg
      className="writing"
      viewBox={nameOutlines.viewBox}
      /* The names are announced from the sr-only text in PanelWelcome. A
         role or a <title> here would say them a second time. */
      aria-hidden="true"
      focusable="false"
      style={{ ["--names-em-width" as string]: nameOutlines.emWidth }}
    >
      <defs>
        {/*
          ONE gradient across the whole lockup, not one per letter.

          `userSpaceOnUse` with explicit corners is what makes that true.
          The default, objectBoundingBox, would restart the gradient inside
          every glyph — six little pink-to-magenta sweeps instead of one
          journey — because each path is its own bounding box.

          The axis runs from the top-left of "Ana" to the bottom-right of
          "John", which is the direction the hand actually travels: pink
          where the writing starts, magenta where it ends. Taken from the
          generated boxes rather than typed, so it stays correct if the
          artwork is regenerated.
        */}
        <linearGradient
          id="welcome-ink-gradient"
          gradientUnits="userSpaceOnUse"
          x1={nameOutlines.lineA.box.x}
          y1={nameOutlines.lineA.box.y}
          x2={nameOutlines.lineB.box.x + nameOutlines.lineB.box.w}
          y2={nameOutlines.lineB.box.y + nameOutlines.lineB.box.h}
        >
          {INK_STOPS.map((colour, i) => (
            <stop
              key={colour}
              offset={i / (INK_STOPS.length - 1)}
              stopColor={colour}
            />
          ))}
        </linearGradient>

        {glyphs.map((g) => (
          <mask
            key={g.id}
            id={`welcome-pen-${g.id}`}
            /* Explicit region, not the default objectBoundingBox: that is
               only 120% of the bbox, and a round cap on a long entry swash
               escapes it. Padded by a full pen width. */
            maskUnits="userSpaceOnUse"
            x={g.box.x - nameStrokes.width}
            y={g.box.y - nameStrokes.width}
            width={g.box.w + nameStrokes.width * 2}
            height={g.box.h + nameStrokes.width * 2}
          >
            <rect
              x={g.box.x - nameStrokes.width}
              y={g.box.y - nameStrokes.width}
              width={g.box.w + nameStrokes.width * 2}
              height={g.box.h + nameStrokes.width * 2}
              fill="#000"
            />
            {penFor(g.id).map((s, i) => (
              <g key={i} transform={`translate(${s.dx} ${s.dy})`}>
                <path
                  /* The line class is what selects this stroke's timing —
                     "Ana" and "John" start at different moments and the
                     strokes inside a mask cannot inherit that from the
                     glyph, because the mask is in <defs> and has no
                     ancestor that knows which name it belongs to. */
                  className={`pen line-${s.line}`}
                  d={s.d}
                  {...strokeAttrs}
                  style={{
                    ["--pen-at" as string]: s.at,
                    ["--pen-of" as string]: s.of,
                  }}
                />
              </g>
            ))}
          </mask>
        ))}
      </defs>

      {/* The ink, revealed through the pen. */}
      {glyphs.map((g) => (
        <path
          key={g.id}
          className={`writing-ink line-${g.line}`}
          d={g.d}
          /* The colour after the url() is an SVG paint FALLBACK, used if the
             gradient reference ever fails to resolve. Without it a broken id
             renders the names in black — or in nothing at all. rose-600 is
             the palette's body-text pink, so the fallback is legible rather
             than merely present. */
          fill="url(#welcome-ink-gradient) #a8536f"
          mask={`url(#welcome-pen-${g.id})`}
        />
      ))}

      {/* The safety net: identical outlines, unmasked, faded in behind the
          pen as each line lands. Resting opacity is 1 — this is what makes
          a missing animation harmless. */}
      <g className="writing-settle">
        {glyphs.map((g) => (
          <path
            key={g.id}
            className={`settle-${g.line}`}
            d={g.d}
            fill="url(#welcome-ink-gradient) #a8536f"
          />
        ))}
      </g>
    </svg>
  );
}
