import type { CSSProperties } from "react";

/**
 * Blossom petals drifting across the page on the wind.
 *
 * A server component with no JavaScript — the whole effect is CSS
 * (`.petal-field` in globals.css), so nothing ships to the browser and the
 * animation runs on the compositor.
 *
 * The values below are HAND-PICKED, NOT RANDOM, and that is deliberate:
 * `Math.random()` would produce different numbers on the server and on the
 * client, so React would find the markup it hydrated doesn't match what it
 * rendered. Fixed values also let the drift be composed rather than left to
 * chance — durations share no common factor, so the field never falls into a
 * visible repeating pattern the way a uniform grid of petals does.
 *
 * Purely decorative: aria-hidden, and the layer ignores pointer events, so it
 * can never intercept a tap meant for the RSVP button underneath.
 */

type Petal = {
  /** Starting position across the viewport, in %. */
  left: number;
  /** Edge length in px. */
  size: number;
  /** Time to cross the screen, in seconds. */
  duration: number;
  /** Negative, so the field is already mid-flight on first paint rather
      than every petal starting from the top together. */
  delay: number;
  /** Horizontal travel, in vw. Positive is the prevailing wind. */
  wind: number;
  /** One tumble, in seconds. */
  spin: number;
  opacity: number;
  tone: 0 | 1 | 2;
  /** Depth-of-field blur, px. Only the large foreground petals carry it. */
  blur?: number;
};

/*
  Tones deepened from the first version, which was the real reason the
  petals barely registered: near-white petals on a white page are close to
  invisible, and no amount of extra count fixes that. These lead with
  rose-400 and rose-500 so each petal actually separates from the
  background, with one pale blush kept as a highlight note.
*/
const TONES = [
  { from: "rgba(242, 193, 212, 0.96)", to: "rgba(220, 146, 174, 0.9)" },
  { from: "rgba(228, 163, 187, 0.96)", to: "rgba(201, 113, 142, 0.88)" },
  { from: "rgba(252, 232, 239, 0.96)", to: "rgba(238, 196, 213, 0.9)" },
] as const;

/*
  Thirty-four petals in three depths — far (small, slow, faint), mid, and a
  few near ones (large, fast, blurred). Ordered so the FIRST SIXTEEN already
  form a complete, well-spread field across all three depths, because mobile
  hides everything after them and it still has to look composed.
*/
const PETALS: Petal[] = [
  // ── first sixteen: the mobile field ─────────────────────────────────
  { left: 4, size: 17, duration: 15, delay: -2, wind: 28, spin: 6.5, opacity: 0.62, tone: 1 },
  { left: 17, size: 11, duration: 24, delay: -11, wind: 14, spin: 9, opacity: 0.44, tone: 2 },
  { left: 29, size: 26, duration: 11, delay: -6, wind: 36, spin: 4.8, opacity: 0.7, tone: 0, blur: 2 },
  { left: 41, size: 13, duration: 21, delay: -18, wind: 18, spin: 8.2, opacity: 0.5, tone: 1 },
  { left: 53, size: 19, duration: 14, delay: -4, wind: 30, spin: 5.6, opacity: 0.64, tone: 0 },
  { left: 66, size: 10, duration: 27, delay: -22, wind: 11, spin: 10.5, opacity: 0.4, tone: 2 },
  { left: 78, size: 22, duration: 12.5, delay: -9, wind: 33, spin: 5, opacity: 0.68, tone: 1, blur: 1.6 },
  { left: 90, size: 12, duration: 23, delay: -15, wind: 16, spin: 8.8, opacity: 0.46, tone: 0 },
  { left: 10, size: 14, duration: 19, delay: -25, wind: 22, spin: 7.2, opacity: 0.55, tone: 0 },
  { left: 35, size: 9, duration: 29, delay: -7, wind: 9, spin: 11.5, opacity: 0.38, tone: 2 },
  { left: 47, size: 28, duration: 10.5, delay: -13, wind: 38, spin: 4.5, opacity: 0.72, tone: 1, blur: 2.6 },
  { left: 60, size: 15, duration: 18, delay: -20, wind: 24, spin: 7, opacity: 0.57, tone: 0 },
  { left: 72, size: 11, duration: 25, delay: -3, wind: 13, spin: 9.6, opacity: 0.42, tone: 2 },
  { left: 84, size: 18, duration: 16, delay: -27, wind: 27, spin: 6, opacity: 0.6, tone: 1 },
  { left: 96, size: 13, duration: 22, delay: -10, wind: 17, spin: 8.4, opacity: 0.48, tone: 0 },
  { left: 23, size: 24, duration: 13, delay: -17, wind: 34, spin: 5.2, opacity: 0.66, tone: 0, blur: 1.8 },

  // ── the rest: desktop only, filling the gaps ────────────────────────
  { left: 8, size: 12, duration: 26, delay: -5, wind: 15, spin: 9.2, opacity: 0.45, tone: 2 },
  { left: 14, size: 20, duration: 15.5, delay: -23, wind: 29, spin: 6.4, opacity: 0.61, tone: 1 },
  { left: 21, size: 10, duration: 28, delay: -12, wind: 10, spin: 11, opacity: 0.39, tone: 2 },
  { left: 27, size: 16, duration: 17.5, delay: -1, wind: 25, spin: 7.6, opacity: 0.56, tone: 0 },
  { left: 33, size: 13, duration: 20.5, delay: -19, wind: 19, spin: 8, opacity: 0.5, tone: 1 },
  { left: 39, size: 23, duration: 12, delay: -8, wind: 35, spin: 4.9, opacity: 0.69, tone: 0, blur: 1.9 },
  { left: 45, size: 11, duration: 24.5, delay: -26, wind: 12, spin: 10, opacity: 0.41, tone: 2 },
  { left: 51, size: 17, duration: 16.5, delay: -14, wind: 26, spin: 6.8, opacity: 0.58, tone: 1 },
  { left: 57, size: 14, duration: 19.5, delay: -21, wind: 21, spin: 7.8, opacity: 0.53, tone: 0 },
  { left: 63, size: 25, duration: 11.5, delay: -16, wind: 37, spin: 4.6, opacity: 0.71, tone: 1, blur: 2.3 },
  { left: 69, size: 12, duration: 27.5, delay: -24, wind: 13, spin: 10.8, opacity: 0.43, tone: 2 },
  { left: 75, size: 18, duration: 14.5, delay: -30, wind: 31, spin: 5.8, opacity: 0.63, tone: 0 },
  { left: 81, size: 10, duration: 29.5, delay: -28, wind: 8, spin: 12, opacity: 0.37, tone: 2 },
  { left: 87, size: 21, duration: 13.5, delay: -6.5, wind: 32, spin: 5.4, opacity: 0.67, tone: 1, blur: 1.5 },
  { left: 93, size: 15, duration: 18.5, delay: -32, wind: 23, spin: 7.4, opacity: 0.54, tone: 0 },
  { left: 2, size: 13, duration: 21.5, delay: -29, wind: 20, spin: 8.6, opacity: 0.49, tone: 1 },
  { left: 44, size: 9, duration: 30, delay: -31, wind: 9, spin: 12.5, opacity: 0.36, tone: 2 },
  { left: 98, size: 19, duration: 17, delay: -33, wind: 28, spin: 6.2, opacity: 0.59, tone: 0 },
];

export function Petals() {
  return (
    <div className="petal-field" aria-hidden="true">
      {PETALS.map((petal, index) => (
        <span
          key={index}
          className={petal.blur ? "petal petal-near" : "petal"}
          style={
            {
              "--petal-left": `${petal.left}%`,
              "--petal-size": `${petal.size}px`,
              "--petal-duration": `${petal.duration}s`,
              "--petal-delay": `${petal.delay}s`,
              "--petal-wind": `${petal.wind}vw`,
              "--petal-spin": `${petal.spin}s`,
              "--petal-opacity": petal.opacity,
              "--petal-from": TONES[petal.tone].from,
              "--petal-to": TONES[petal.tone].to,
              ...(petal.blur ? { "--petal-blur": `${petal.blur}px` } : {}),
            } as CSSProperties
          }
        >
          <span className="petal-inner" />
        </span>
      ))}
    </div>
  );
}
