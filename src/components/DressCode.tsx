import { wedding } from "@/config/wedding";
import { Section } from "./Section";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

export function DressCode() {
  const { heading, intro, swatches, notes, pleaseAvoid } = wedding.dressCode;

  return (
    <Section id="dress-code" tone="blush">
      <SectionHeading eyebrow="Dress Code" intro={intro}>
        {heading}
      </SectionHeading>

      <Reveal>
        {/* Swatches. The colour name is spelled out beneath each circle —
            colour alone is never the only cue (WCAG 1.4.1). */}
        <ul className="mt-14 flex flex-wrap items-start justify-center gap-x-8 gap-y-7 sm:gap-x-12">
          {swatches.map((swatch) => (
            <li key={swatch.name} className="flex flex-col items-center gap-3">
              <span
                aria-hidden="true"
                style={{ backgroundColor: swatch.hex }}
                className="size-16 rounded-full ring-1 ring-blush-200 ring-offset-2 ring-offset-blush-50 sm:size-20"
              />
              <span className="text-xs tracking-[0.14em] text-ink-600 uppercase">
                {swatch.name}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mx-auto mt-14 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          {notes.map((note) => (
            <div
              key={note.who}
              className="rounded-lg border border-blush-200 bg-white px-6 py-5 text-center"
            >
              <dt className="text-[0.7rem] font-medium tracking-[0.22em] text-rose-600 uppercase">
                {note.who}
              </dt>
              <dd className="mt-2.5 text-base text-ink-600">{note.what}</dd>
            </div>
          ))}
        </dl>

        {pleaseAvoid.length > 0 ? (
          <p className="mt-8 text-center text-sm text-ink-400">
            Kindly avoid {formatList(pleaseAvoid)}.
          </p>
        ) : null}
      </Reveal>
    </Section>
  );
}

/** "a, b and c" — reads better than a bare comma list. */
function formatList(items: readonly string[]): string {
  const lower = items.map((item) => item.toLowerCase());
  if (lower.length <= 1) return lower.join("");
  return `${lower.slice(0, -1).join(", ")} and ${lower.at(-1)}`;
}
