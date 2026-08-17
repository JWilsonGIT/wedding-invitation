type Props = {
  id: string;
  /** blush gives the alternating wash between bands. */
  tone?: "white" | "blush";
  /**
   * Full-bleed decorative layers (see `Drift`), rendered edge to edge behind
   * the content rather than inside the max-width column — so a blob can hang
   * off the section's left and right edges as intended.
   */
  decoration?: React.ReactNode;
  /** A fading hairline across the top edge. Off for the first section. */
  divider?: boolean;
  className?: string;
  children: React.ReactNode;
};

/**
 * The page's vertical rhythm lives here, in one place. Every section uses it,
 * so spacing stays consistent as sections are added or removed.
 *
 * `overflow-x-clip`, NOT `overflow-hidden`. It contains the drifting
 * decoration so it cannot cause a horizontal scrollbar — but unlike `hidden`,
 * `clip` does not create a scroll container. That matters:
 * `animation-timeline: view()` resolves against the nearest scrollport, so an
 * `overflow-hidden` section would capture its children's timelines and freeze
 * every scroll animation inside it.
 */
export function Section({
  id,
  tone = "white",
  decoration,
  divider = true,
  className = "",
  children,
}: Props) {
  return (
    <section
      id={id}
      className={`relative overflow-x-clip ${tone === "blush" ? "tone-blush" : "tone-white"} px-5 py-20 sm:px-8 sm:py-28 ${className}`}
    >
      {divider ? (
        <div
          aria-hidden="true"
          className="section-rule absolute inset-x-0 top-0"
        />
      ) : null}

      {decoration}

      {/* z-10 lifts the content above the decoration regardless of DOM order */}
      <div className="relative z-10 mx-auto w-full max-w-5xl">{children}</div>
    </section>
  );
}
