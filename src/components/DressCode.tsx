import { wedding } from "@/config/wedding";
import { Section } from "./Section";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";
import { Tilt } from "./Tilt";

export function DressCode() {
  const { heading, intro, parties, pleaseAvoid } = wedding.dressCode;

  return (
    <Section id="dress-code" tone="blush">
      <SectionHeading eyebrow="Dress Code" intro={intro} index={2}>
        {heading}
      </SectionHeading>

      {/* Split by party rather than one mixed row of colours: a guest should
          see their own palette, not have to work out which half is theirs. */}
      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
        {parties.map((party, index) => (
          <Reveal key={party.who} stagger={index} className="h-full">
            <Tilt className="h-full rounded-xl">
              <div className="card-accent relative flex h-full flex-col items-center overflow-hidden rounded-xl border border-blush-200 bg-white px-6 py-8 text-center">
                <h3 className="text-[0.7rem] font-medium tracking-[0.24em] text-rose-700 uppercase">
                  {party.who}
                </h3>

                <p className="mt-3 font-display text-xl leading-snug text-ink-900">
                  {party.attire}
                </p>

                {/* The colour name is spelled out under each circle — colour is
                    never the only cue, and a guest shopping for "Dusty Rose"
                    needs the word, not a swatch they cannot sample. */}
                <ul className="mt-7 flex flex-wrap items-start justify-center gap-x-6 gap-y-5">
                  {party.swatches.map((swatch) => (
                    <li
                      key={swatch.name}
                      className="flex w-16 flex-col items-center gap-2.5"
                    >
                      <span
                        aria-hidden="true"
                        style={{ backgroundColor: swatch.hex }}
                        className="size-14 rounded-full ring-1 ring-gray-200 ring-offset-2 ring-offset-white sm:size-16"
                      />
                      <span className="text-[0.65rem] leading-tight tracking-[0.1em] text-ink-600 uppercase">
                        {swatch.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Tilt>
          </Reveal>
        ))}
      </div>

      {pleaseAvoid.length > 0 ? (
        <p className="mt-9 text-center text-sm text-ink-400">
          Kindly avoid {formatList(pleaseAvoid)}.
        </p>
      ) : null}
    </Section>
  );
}

/** "a, b and c" — reads better than a bare comma list. */
function formatList(items: readonly string[]): string {
  const lower = items.map((item) => item.toLowerCase());
  if (lower.length <= 1) return lower.join("");
  return `${lower.slice(0, -1).join(", ")} and ${lower.at(-1)}`;
}
