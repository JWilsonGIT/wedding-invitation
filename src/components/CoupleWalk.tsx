/**
 * The groom walks the width of the page to reach the bride.
 *
 * He starts at the bottom-left, she waits at the bottom-right, and his
 * position is bound to scroll progress — so he arrives exactly as the page
 * runs out. His legs and arms are on the same scroll timeline, at fourteen
 * iterations across the page, which means he steps only while you scroll and
 * stands still when you stop. A time-based loop would have him marching on
 * the spot while you read.
 *
 * No JavaScript: a server component plus CSS scroll-driven animation.
 * Decorative, so the whole scene is aria-hidden and ignores pointer events —
 * it floats over the bottom of the page and must never eat a tap.
 *
 * The figures are silhouettes rather than illustrated faces. It keeps them
 * elegant at 100px tall, and it avoids depicting features that are not ours
 * to guess at. Groom in gray, which is the gentlemen's colour in the dress
 * code; bride in ivory with a rose outline, because white on white would
 * simply disappear.
 */
export function CoupleWalk() {
  return (
    <div className="couple-scene" aria-hidden="true">
      <Groom />
      <Bride />
      {/* Appears only in the last stretch of the page, as they meet */}
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

function Groom() {
  return (
    <svg
      className="couple-figure couple-groom"
      viewBox="0 0 58 104"
      role="presentation"
      focusable="false"
    >
      {/* Back leg first, so the front leg overlaps it */}
      <g className="cw-leg cw-leg-back">
        <rect x="25" y="57" width="9" height="42" rx="4.5" fill="#3E3A3C" />
        <rect x="20" y="94" width="17" height="7" rx="3.5" fill="#2B2729" />
      </g>
      <g className="cw-leg cw-leg-front">
        <rect x="25" y="57" width="9" height="42" rx="4.5" fill="#565055" />
        <rect x="20" y="94" width="17" height="7" rx="3.5" fill="#2B2729" />
      </g>

      <g className="cw-bob">
        <g className="cw-arm cw-arm-back">
          <rect x="10" y="33" width="8" height="30" rx="4" fill="#3E3A3C" />
        </g>

        {/* Jacket */}
        <path d="M16 30 Q29 24 42 30 L45 61 Q29 66 13 61 Z" fill="#565055" />
        {/* Shirt */}
        <path d="M25 27 L29 43 L33 27 Z" fill="#FFFFFF" />
        {/* Bow tie — the one spot of rose on him */}
        <path
          d="M29 30 l-4 -2.6 0 5.2 Z M29 30 l4 -2.6 0 5.2 Z"
          fill="var(--color-rose-600)"
        />

        <g className="cw-arm cw-arm-front">
          <rect x="40" y="33" width="8" height="30" rx="4" fill="#6E6469" />
        </g>

        {/* Head and hair */}
        <circle cx="29" cy="16" r="10" fill="#3E3A3C" />
        <path d="M19 15 Q20 5 29 5 Q38 5 39 15 Q35 9 29 10 Q23 10 19 15 Z" fill="#2B2729" />
      </g>
    </svg>
  );
}

function Bride() {
  return (
    <svg
      className="couple-figure couple-bride"
      viewBox="0 0 72 104"
      role="presentation"
      focusable="false"
    >
      {/* Veil behind everything, swaying slightly as the page moves */}
      <g className="cw-veil">
        <path
          d="M36 10 Q52 16 56 52 Q60 84 50 97 Q44 88 45 62 Q45 30 36 12 Z"
          fill="var(--color-rose-400)"
          opacity="0.32"
        />
      </g>

      {/* Gown — ivory with a rose outline, or it vanishes against the page */}
      <path
        d="M30 42 L15 95 Q36 102 57 95 L42 42 Z"
        fill="#FFFBFC"
        stroke="var(--color-rose-400)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Bodice */}
      <path
        d="M30 29 Q36 26 42 29 L42.6 44 Q36 47 29.4 44 Z"
        fill="#FFFBFC"
        stroke="var(--color-rose-400)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Head, hair, bun */}
      <circle cx="36" cy="17" r="9.5" fill="#3E3A3C" />
      <path d="M26.5 16 Q27 6 36 6 Q45 6 45.5 16 Q41 10 36 11 Q31 11 26.5 16 Z" fill="#2B2729" />
      <circle cx="36" cy="6.5" r="4.5" fill="#2B2729" />

      {/* Bouquet */}
      <g className="cw-bouquet">
        <circle cx="26" cy="52" r="4.2" fill="var(--color-rose-500)" />
        <circle cx="31" cy="49" r="3.4" fill="var(--color-rose-400)" />
        <circle cx="31" cy="55" r="3.2" fill="var(--color-rose-600)" />
        <path d="M28 56 L27 64" stroke="#8FA98C" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
