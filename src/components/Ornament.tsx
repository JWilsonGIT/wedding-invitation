/**
 * A hairline rule with a small diamond at its centre — the one piece of
 * decoration used throughout the page. Repeating a single motif is what
 * makes a set of sections read as one invitation instead of one template.
 *
 * Uses rose-400, which is decoration-only in this palette. Never text.
 */
export function Ornament({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center gap-3 ${className}`}
    >
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-rose-400 sm:w-20" />
      <svg width="7" height="7" viewBox="0 0 7 7" className="shrink-0">
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
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-rose-400 sm:w-20" />
    </div>
  );
}
