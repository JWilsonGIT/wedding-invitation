import { wedding } from "@/config/wedding";
import { Section } from "./Section";
import { Ornament } from "./Ornament";
import { Reveal } from "./Reveal";
import { Drift } from "./Drift";

export function InvitationNote() {
  const [lead, ...rest] = wedding.invitation.body;

  return (
    <Section
      id="invitation"
      tone="blush"
      decoration={
        <>
          {/* Two different speeds — that difference is the parallax */}
          <Drift className="-top-20 -left-[12%] size-80" speed={56} tone="rose" />
          <Drift className="-right-[14%] bottom-0 size-96" speed={22} tone="blush" />
        </>
      }
    >
      <Reveal className="mx-auto max-w-2xl text-center">
        <Ornament />

        {/* The lead line carries the emotion, so it gets the serif. */}
        <p className="mt-8 font-display text-2xl leading-relaxed font-light text-ink-900 sm:text-[1.75rem]">
          {lead}
        </p>

        {rest.map((paragraph) => (
          <p
            key={paragraph}
            className="mt-6 text-base leading-relaxed text-ink-600"
          >
            {paragraph}
          </p>
        ))}
      </Reveal>
    </Section>
  );
}
