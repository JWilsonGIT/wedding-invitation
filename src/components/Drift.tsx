import type { CSSProperties } from "react";

/**
 * Soft blurred colour that drifts as the section scrolls past.
 *
 * The parallax comes from the *difference* in rates — two layers moving at
 * different speeds read as depth, whereas one layer moving is just a moving
 * object. So place these in pairs with different `speed` values.
 *
 * Purely decorative, and always aria-hidden: there is nothing here for a
 * screen reader to announce.
 */
export function Drift({
  className = "",
  speed = 40,
  tone = "rose",
}: {
  /** Position and size, e.g. "-top-16 left-[-10%] size-72". */
  className?: string;
  /** Pixels of travel across the section. Higher reads as nearer. */
  speed?: number;
  tone?: "rose" | "blush" | "gray";
}) {
  /* Alphas are capped low deliberately. These layers pass behind body text,
     and a translucent wash silently eats contrast — the rose was 0.30 and
     dragged an 11px heading down to 4.0:1. Keep them as atmosphere. */
  const colour = {
    rose: "rgba(226, 160, 184, 0.22)",
    blush: "rgba(247, 220, 229, 0.45)",
    gray: "rgba(168, 160, 164, 0.18)",
  }[tone];

  return (
    <span
      aria-hidden="true"
      style={{ "--drift": speed, background: `radial-gradient(closest-side, ${colour}, transparent)` } as CSSProperties}
      /* No negative z-index: the section is `position: relative` without a
         z-index, so it is not a stacking context, and a -z child would paint
         behind the section's own background and vanish. Instead this sits at
         the default level and the section's content is lifted to z-10. */
      className={`drift pointer-events-none absolute rounded-full blur-2xl ${className}`}
    />
  );
}
