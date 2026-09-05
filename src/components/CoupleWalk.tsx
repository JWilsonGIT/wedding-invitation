/**
 * The groom walks the width of the page to reach the bride, and they join
 * hands when he arrives.
 *
 * The page is divided along the scroll:
 *   0% → 86%    he walks, his gait bound to scroll so he steps only while
 *               you scroll and stands still when you stop
 *   86% → 93%   his stride settles into a stand
 *   86% → 100%  both reach out; their hands meet at the bottom of the page
 *   92% → 100%  a heart blooms between them
 *
 * WHY THE LIMBS ARE DOUBLE-WRAPPED. The gait runs as 11 iterations, so when
 * it ends it holds the final keyframe — legs apart, mid-stride. Two animations
 * cannot share one `rotate`, and the later one would simply win and cancel the
 * walk. So each joint has an outer group that adds a second rotation on top of
 * the held pose: the leg settles cancel the ±20° stride, and the arm groups add
 * the reach. Rotations about the same origin compose, so the two layers add up
 * cleanly.
 *
 * No JavaScript: a server component plus CSS scroll-driven animation.
 * Decorative, so the scene is aria-hidden and ignores pointer events.
 *
 * Silhouettes rather than illustrated faces — elegant at 100px tall, and no
 * need to guess at features. Groom in gray, bride in ivory with a rose
 * outline, since white on white would disappear. The gray is for contrast
 * against her ivory, not a match to the dress code — the gentlemen wear
 * khaki there.
 */
export function CoupleWalk() {
  return (
    <div className="couple-scene" aria-hidden="true">
      <Groom />
      <Bride />
      <Celebration />
    </div>
  );
}

function HeartShape({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" role="presentation">
      <path
        d="M12 21s-8-4.9-8-10.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 3.6C20 16.1 12 21 12 21Z"
        fill={fill}
      />
    </svg>
  );
}

/*
  Small hearts rising around the couple. Hand-picked rather than random, for
  the same reason as the petals: `Math.random()` would differ between the
  server render and the client and trip a hydration mismatch.

  x / y are percentages of the celebration box, so they scale with the figures
  instead of drifting out of place on mobile.
*/
const SPARKS = [
  { x: 5, y: 16, size: 9, duration: 3.0, delay: 0, drift: -7 },
  { x: 19, y: 45, size: 7, duration: 3.7, delay: 0.9, drift: 5 },
  { x: 32, y: 7, size: 11, duration: 2.6, delay: 1.8, drift: -4 },
  { x: 46, y: 57, size: 8, duration: 3.3, delay: 0.4, drift: 8 },
  { x: 59, y: 25, size: 10, duration: 2.9, delay: 2.3, drift: -8 },
  { x: 73, y: 51, size: 7, duration: 3.9, delay: 1.3, drift: 4 },
  { x: 85, y: 13, size: 9, duration: 3.1, delay: 2.7, drift: -5 },
  /* Drift kept negative on the rightmost hearts: the box already ends at the
     viewport edge, so a positive drift would carry them off-screen. */
  { x: 92, y: 37, size: 6, duration: 4.2, delay: 0.6, drift: -6 },
];

const SPARK_TONES = [
  "var(--color-rose-400)",
  "var(--color-rose-500)",
  "var(--color-rose-600)",
];

/**
 * Small hearts rising around the couple once they meet.
 *
 * Two layers, because they answer to different clocks: the container's opacity
 * is scroll-driven so nothing shows until they are together, while each heart
 * rises on a time-based loop so they keep going when you stop scrolling at the
 * bottom of the page.
 */
function Celebration() {
  return (
    <span className="cw-celebrate">
      <span className="cw-sparks">
        {SPARKS.map((spark, index) => (
          <span
            key={index}
            className="cw-spark"
            style={
              {
                left: `${spark.x}%`,
                bottom: `${spark.y}%`,
                width: `${spark.size}px`,
                height: `${spark.size}px`,
                "--spark-duration": `${spark.duration}s`,
                "--spark-delay": `${spark.delay}s`,
                "--spark-drift": `${spark.drift}px`,
              } as React.CSSProperties
            }
          >
            <HeartShape fill={SPARK_TONES[index % SPARK_TONES.length]} />
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * In profile, facing right — the direction of travel.
 *
 * Joints, in viewBox coordinates. The CSS rotates about these exact points
 * using `transform-box: view-box`, so they must stay in step with globals.css:
 *   hip      24, 56
 *   knee     24, 79
 *   shoulder 24, 33
 */
function Groom() {
  return (
    <svg
      className="couple-figure couple-groom"
      viewBox="0 0 52 104"
      role="presentation"
      focusable="false"
    >
      {/* Painted back to front: far limbs, body, then near limbs */}
      <g className="cw-bob">
        {/* Far arm: swings, then settles to hang at his side */}
        <g className="cw-armset cw-arm-far-settle">
          <g className="cw-arm cw-arm-far">
            <rect x="21" y="31" width="7" height="26" rx="3.5" fill="#3E3A3C" />
            <circle cx="24.5" cy="55" r="3.9" fill="#3E3A3C" />
          </g>
        </g>

        <Leg side="far" />

        {/* Jacket, leaning very slightly into the walk */}
        <path d="M17.5 29 Q24 25 30.5 29 L32 57 Q24 61 16.5 57 Z" fill="#565055" />
        {/* Collar and bow tie, on the leading edge since he faces right */}
        <path d="M27 27 L30 38 L31.5 27 Z" fill="#FFFFFF" />
        <path
          d="M29 30 l-3.4 -2.2 0 4.4 Z M29 30 l3.4 -2.2 0 4.4 Z"
          fill="var(--color-rose-600)"
        />

        {/* Head in profile: skull, brow, nose */}
        <circle cx="24" cy="15" r="9.5" fill="#3E3A3C" />
        <path d="M32.6 13.2 l3 2.1 -3 1.9 Z" fill="#3E3A3C" />
        <path
          d="M14.5 14.5 Q15 4 24 4 Q32.2 4 33.2 12 Q29.8 7.2 24 8.2 Q17.4 8.6 14.5 14.5 Z"
          fill="#2B2729"
        />

        <Leg side="near" />

        {/* Near arm: swings, then reaches for her hand */}
        <g className="cw-armset cw-arm-near-reach">
          <g className="cw-arm cw-arm-near">
            <rect x="21" y="31" width="7.5" height="26" rx="3.75" fill="#6E6469" />
            <circle className="cw-hand cw-hand-groom" cx="24.75" cy="57" r="4.2" fill="#6E6469" />
          </g>
        </g>
      </g>
    </svg>
  );
}

/**
 * Thigh with the shin nested inside it, so the knee bends off the hip.
 * Each is wrapped in a settle group that cancels the held stride at the end —
 * see the note at the top of the file.
 */
function Leg({ side }: { side: "near" | "far" }) {
  const key = side === "near" ? "a" : "b";
  const thigh = side === "near" ? "#565055" : "#3E3A3C";
  const shin = side === "near" ? "#4A4448" : "#332F31";
  const shoe = side === "near" ? "#2B2729" : "#211E20";

  return (
    <g className={`cw-leg-settle cw-leg-settle-${key}`}>
      <g className={`cw-thigh cw-thigh-${key}`}>
        <rect x="19.75" y="54" width="8.5" height="27" rx="4.25" fill={thigh} />
        <g className={`cw-knee-settle cw-knee-settle-${key}`}>
          <g className={`cw-shin cw-shin-${key}`}>
            <rect x="20.25" y="77" width="7.5" height="23" rx="3.75" fill={shin} />
            {/* Shoe points right, the way he is walking */}
            <path d="M20 97 h5 l10 4 q1.6 0.8 0 2.2 h-15 z" fill={shoe} />
          </g>
        </g>
      </g>
    </g>
  );
}

/**
 * In profile, facing left — turned toward the groom as he arrives.
 *
 * Her shoulder is at 38, 33 so her hand meets his at the same height.
 * She keeps the bouquet in her far hand, leaving the near arm free to reach.
 */
function Bride() {
  return (
    <svg
      className="couple-figure couple-bride"
      viewBox="0 0 72 104"
      role="presentation"
      focusable="false"
    >
      {/* Veil behind her, trailing to the right, swaying as the page moves */}
      <g className="cw-veil">
        <path
          d="M40 11 Q56 18 59 54 Q62 85 51 98 Q46 88 47 63 Q47 31 40 13 Z"
          fill="var(--color-rose-400)"
          opacity="0.32"
        />
      </g>

      {/* Bouquet, held in her far hand and away from the groom */}
      <g className="cw-bouquet">
        <path d="M47 52 L48 62" stroke="#8FA98C" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="46" cy="49" r="4" fill="var(--color-rose-500)" />
        <circle cx="50.5" cy="52" r="3.2" fill="var(--color-rose-400)" />
        <circle cx="44.5" cy="54" r="3" fill="var(--color-rose-600)" />
      </g>

      {/* Gown — ivory with a rose outline, or it vanishes against the page */}
      <path
        d="M32 42 L17 95 Q38 102 59 95 L44 42 Z"
        fill="#FFFBFC"
        stroke="var(--color-rose-400)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M32.5 28 Q38 25 43.5 28 L44.5 44 Q38 47 31.5 44 Z"
        fill="#FFFBFC"
        stroke="var(--color-rose-400)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Head in profile facing left: nose on the left, bun at the back */}
      <circle cx="38" cy="17" r="9.5" fill="#3E3A3C" />
      <path d="M29.4 15.2 l-3 2.1 3 1.9 Z" fill="#3E3A3C" />
      <path
        d="M47.5 16.5 Q47 5 38 5 Q30 5 29 13 Q32.5 8.5 38 9.5 Q45 10 47.5 16.5 Z"
        fill="#2B2729"
      />
      <circle cx="47" cy="14" r="5" fill="#2B2729" />

      {/* Near arm: still at her side, then reaching for his hand */}
      <g className="cw-bride-arm">
        <rect x="34.5" y="31" width="7" height="26" rx="3.5" fill="#F3D8E2" />
        <circle className="cw-hand cw-hand-bride" cx="38" cy="57" r="4.2" fill="#F3D8E2" />
      </g>
    </svg>
  );
}
