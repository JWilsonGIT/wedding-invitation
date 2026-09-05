/**
 * A hairline rule with a small diamond at its centre — the one piece of
 * decoration used throughout the page. Repeating a single motif is what
 * makes a set of sections read as one invitation instead of one template.
 *
 * Uses rose-400, which is decoration-only in this palette. Never text.
 *
 * `draw` opts into the ornament drawing itself: the diamond appears and the
 * two rules spread outward from it. It is OFF by default because this
 * component is used in SEVEN places — the welcome panel, the RSVP panel,
 * the footer, the hero, the invitation note, the RSVP form and the section
 * headings — and only Panel I, where the names are written by a pen, has
 * any reason to animate. Every other call site renders exactly what it
 * rendered before.
 *
 * The markup is unchanged in both cases. The rules are still gradient
 * spans, not SVG paths: animating `scale` on the existing elements draws
 * them just as well as a dash offset would, and it cannot alter how the
 * other six look.
 */
export function Ornament({
  className = "",
  draw = false,
}: {
  className?: string;
  draw?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center gap-3 ${draw ? "orn-draw" : ""} ${className}`}
    >
      <span className="orn-rule orn-rule-l h-px w-12 bg-gradient-to-r from-transparent to-rose-400 sm:w-20" />
      <svg width="7" height="7" viewBox="0 0 7 7" className="orn-diamond shrink-0">
        <rect
          x="3.5"
          y="0"
          width="4.95"
          height="4.95"
          transform="rotate(45 3.5 0)"
          fill="currentColor"
          className="text-rose-400"
        />
      </svg>
      <span className="orn-rule orn-rule-r h-px w-12 bg-gradient-to-l from-transparent to-rose-400 sm:w-20" />
    </div>
  );
}
