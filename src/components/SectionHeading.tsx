import { Ornament } from "./Ornament";

type Props = {
  /** Small letterspaced label above the heading. */
  eyebrow?: string;
  /** The heading itself, set in the display serif. */
  children: React.ReactNode;
  /** Optional single line of context below. */
  intro?: string;
};

export function SectionHeading({ eyebrow, children, intro }: Props) {
  return (
    <header className="flex flex-col items-center text-center">
      {eyebrow ? (
        // rose-600 — the only pink cleared for small text (5.1:1 on white)
        <p className="mb-4 text-[0.7rem] font-medium tracking-[0.28em] text-rose-600 uppercase">
          {eyebrow}
        </p>
      ) : null}

      <h2 className="font-display text-3xl leading-tight font-light text-ink-900 sm:text-4xl md:text-[2.75rem]">
        {children}
      </h2>

      <Ornament className="mt-6" />

      {intro ? (
        <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-600">
          {intro}
        </p>
      ) : null}
    </header>
  );
}
