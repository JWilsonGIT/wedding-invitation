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
  /** Edge length in px. Kept small — these are petals, not leaves. */
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
};

const TONES = [
  { from: "rgba(250, 228, 236, 0.95)", to: "rgba(240, 200, 216, 0.85)" },
  { from: "rgba(244, 210, 224, 0.95)", to: "rgba(226, 160, 184, 0.8)" },
  { from: "rgba(255, 245, 248, 0.95)", to: "rgba(247, 220, 229, 0.85)" },
] as const;

/* Ordered so the first ten stand alone as a complete, well-spread field —
   mobile hides the rest, and it should still look composed. */
const PETALS: Petal[] = [
  { left: 6, size: 13, duration: 17, delay: -2, wind: 26, spin: 6.5, opacity: 0.5, tone: 1 },
  { left: 18, size: 9, duration: 23, delay: -11, wind: 15, spin: 9, opacity: 0.38, tone: 2 },
  { left: 31, size: 16, duration: 14, delay: -7, wind: 32, spin: 5, opacity: 0.55, tone: 0 },
  { left: 44, size: 10, duration: 26, delay: -19, wind: 12, spin: 11, opacity: 0.34, tone: 2 },
  { left: 57, size: 14, duration: 19, delay: -4, wind: 24, spin: 7.5, opacity: 0.48, tone: 1 },
  { left: 69, size: 11, duration: 21, delay: -14, wind: 18, spin: 8, opacity: 0.42, tone: 0 },
  { left: 81, size: 17, duration: 15, delay: -9, wind: 29, spin: 5.5, opacity: 0.52, tone: 1 },
  { left: 92, size: 9, duration: 25, delay: -21, wind: 10, spin: 10, opacity: 0.33, tone: 2 },
  { left: 12, size: 12, duration: 20, delay: -16, wind: 21, spin: 6, opacity: 0.45, tone: 0 },
  { left: 63, size: 8, duration: 28, delay: -24, wind: 9, spin: 12, opacity: 0.3, tone: 2 },
  { left: 25, size: 15, duration: 16, delay: -12, wind: 27, spin: 6.8, opacity: 0.5, tone: 1 },
  { left: 37, size: 10, duration: 24, delay: -6, wind: 14, spin: 9.5, opacity: 0.36, tone: 2 },
  { left: 50, size: 13, duration: 18, delay: -22, wind: 23, spin: 7, opacity: 0.46, tone: 0 },
  { left: 75, size: 11, duration: 22, delay: -3, wind: 17, spin: 8.5, opacity: 0.4, tone: 1 },
  { left: 87, size: 14, duration: 17.5, delay: -18, wind: 25, spin: 6.2, opacity: 0.47, tone: 0 },
  { left: 2, size: 9, duration: 27, delay: -8, wind: 11, spin: 10.5, opacity: 0.32, tone: 2 },
  { left: 96, size: 12, duration: 19.5, delay: -26, wind: 20, spin: 7.8, opacity: 0.43, tone: 1 },
  { left: 41, size: 8, duration: 29, delay: -13, wind: 8, spin: 11.5, opacity: 0.29, tone: 2 },
];

export function Petals() {
  return (
    <div className="petal-field" aria-hidden="true">
      {PETALS.map((petal, index) => (
        <span
          key={index}
          className="petal"
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
            } as CSSProperties
          }
        >
          <span className="petal-inner" />
        </span>
      ))}
    </div>
  );
}
