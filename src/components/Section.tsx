type Props = {
  id: string;
  /** blush-50 gives the alternating wash between white bands. */
  tone?: "white" | "blush";
  className?: string;
  children: React.ReactNode;
};

/**
 * The page's vertical rhythm lives here, in one place. Every section
 * uses it, so spacing stays consistent as sections are added or removed.
 */
export function Section({ id, tone = "white", className = "", children }: Props) {
  return (
    <section
      id={id}
      className={`${tone === "blush" ? "bg-blush-50" : "bg-white"} px-5 py-20 sm:px-8 sm:py-28 ${className}`}
    >
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </section>
  );
}
