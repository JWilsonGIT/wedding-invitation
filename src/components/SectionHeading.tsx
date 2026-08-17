import { Ornament } from "./Ornament";

/** I, II, III … Only ever needs a handful; a lookup beats a converter here. */
const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

type Props = {
  /** Small letterspaced label above the heading. */
  eyebrow?: string;
  /** The heading itself, set in the display serif. */
  children: React.ReactNode;
  /** Optional single line of context below. */
  intro?: string;
  /**
   * 1-based position in the page. Renders a large ghosted Roman numeral
   * behind the heading, which is what gives each section a sense of
   * arrival rather than just being the next band down.
   */
  index?: number;
};

export function SectionHeading({ eyebrow, children, intro, index }: Props) {
  const numeral = index ? NUMERALS[index - 1] : null;

  return (
    <header className="relative flex flex-col items-center text-center">
      {numeral ? (
        // Decorative only — the heading below already says where we are.
        <span aria-hidden="true" className="section-numeral">
          {numeral}
        </span>
      ) : null}

      <div className="relative">
        {eyebrow ? (
          /* Hairlines either side of the eyebrow — the detail that makes a
             label read as typeset rather than merely placed.

             rose-700, not rose-600: at 11.2px with wide tracking this is the
             smallest text on the page and it can sit over a drifting blush
             layer, where rose-600 measured 4.0:1, under the 4.5 minimum. */
          <div className="mb-5 flex items-center justify-center gap-3">
            <span
              aria-hidden="true"
              className="h-px w-6 bg-gradient-to-r from-transparent to-rose-400 sm:w-10"
            />
            <p className="text-[0.7rem] font-medium tracking-[0.28em] text-rose-700 uppercase">
              {eyebrow}
            </p>
            <span
              aria-hidden="true"
              className="h-px w-6 bg-gradient-to-l from-transparent to-rose-400 sm:w-10"
            />
          </div>
        ) : null}

        <h2 className="font-display text-3xl leading-tight font-light text-ink-900 sm:text-4xl md:text-[2.75rem]">
          {children}
        </h2>
      </div>

      <Ornament className="mt-6" />

      {intro ? (
        <p className="relative mt-6 max-w-xl text-base leading-relaxed text-ink-600">
          {intro}
        </p>
      ) : null}
    </header>
  );
}
