/**
 * The groom walks the width of the page to reach the bride.
 *
 * He starts at the bottom-left, she waits at the bottom-right, and his
 * position is bound to scroll progress — so he arrives exactly as the page
 * runs out. His gait runs on the same scroll timeline, so he steps only while
 * you scroll and stands still when you stop.
 *
 * TWO THINGS THE FIRST VERSION GOT WRONG, both fixed here:
 *
 * 1. He was drawn FRONT-FACING. A figure facing the viewer while sliding
 *    sideways cannot read as walking — the brain has no forward direction to
 *    attach the motion to, so it reads as moon-walking. Both figures are now
 *    in profile, and he faces the way he is going. The bride faces left, back
 *    toward him, so they end up looking at each other.
 *
 * 2. His legs were single rigid segments. A straight leg swinging from the hip
 *    is a pendulum, not a stride. Each leg is now a thigh with a shin nested
 *    inside it, pivoting at the knee — so the trailing leg folds as it lifts
 *    and straightens again to land, which is the part the eye actually reads
 *    as walking.
 *
 * No JavaScript: a server component plus CSS scroll-driven animation.
 * Decorative, so the scene is aria-hidden and ignores pointer events.
 *
 * Silhouettes rather than illustrated faces — elegant at 100px tall, and no
 * need to guess at features. Groom in gray, the gentlemen's colour in the
 * dress code; bride in ivory with a rose outline, since white on white would
 * disappear.
 */
export function CoupleWalk() {
  return (
    <div className="couple-scene" aria-hidden="true">
      <Groom />
      <Bride />
      <span className="cw-heart">
        <svg viewBox="0 0 24 24" width="100%" height="100%">
          <path
            d="M12 21s-8-4.9-8-10.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 3.6C20 16.1 12 21 12 21Z"
            fill="var(--color-rose-500)"
          />
        </svg>
      </span>
    </div>
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
        <g className="cw-arm cw-arm-far">
          <rect x="21" y="31" width="7" height="28" rx="3.5" fill="#3E3A3C" />
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

        <g className="cw-arm cw-arm-near">
          <rect x="21" y="31" width="7.5" height="28" rx="3.75" fill="#6E6469" />
        </g>
      </g>
    </svg>
  );
}

/** Thigh, with the shin nested inside it so the knee bends off the hip. */
function Leg({ side }: { side: "near" | "far" }) {
  const thigh = side === "near" ? "#565055" : "#3E3A3C";
  const shin = side === "near" ? "#4A4448" : "#332F31";
  const shoe = side === "near" ? "#2B2729" : "#211E20";

  return (
    <g className={`cw-thigh cw-thigh-${side === "near" ? "a" : "b"}`}>
      <rect x="19.75" y="54" width="8.5" height="27" rx="4.25" fill={thigh} />
      <g className={`cw-shin cw-shin-${side === "near" ? "a" : "b"}`}>
        <rect x="20.25" y="77" width="7.5" height="23" rx="3.75" fill={shin} />
        {/* Shoe points right, the way he is walking */}
        <path d="M20 97 h5 l10 4 q1.6 0.8 0 2.2 h-15 z" fill={shoe} />
      </g>
    </g>
  );
}

/** In profile, facing left — turned toward the groom as he arrives. */
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

      {/* Bouquet, held in front of her — to her left */}
      <g className="cw-bouquet">
        <circle cx="28" cy="50" r="4.2" fill="var(--color-rose-500)" />
        <circle cx="33" cy="47" r="3.4" fill="var(--color-rose-400)" />
        <circle cx="33" cy="53" r="3.2" fill="var(--color-rose-600)" />
        <path d="M30 54 L29 62" stroke="#8FA98C" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
