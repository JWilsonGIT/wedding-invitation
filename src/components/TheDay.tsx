import { wedding } from "@/config/wedding";
import { formatFullDate } from "@/lib/date";
import { Section } from "./Section";
import { SectionHeading } from "./SectionHeading";
import { EventCard } from "./EventCard";
import { Reveal } from "./Reveal";

export function TheDay() {
  return (
    <Section id="the-day">
      <SectionHeading eyebrow={formatFullDate(wedding.date)}>
        The Day
      </SectionHeading>

      <p className="mx-auto mt-6 max-w-xl text-center text-base leading-relaxed text-ink-600">
        Two places, one afternoon. The ceremony at the church, then a meal
        together — that is the whole of it.
      </p>

      {/* One card component, two config entries. A third stop would need
          nothing but another item in wedding.events. */}
      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7">
        {wedding.events.map((event, index) => (
          <Reveal key={event.id} delay={index * 120} className="flex">
            <div className="flex w-full">
              <EventCard event={event} index={index} />
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
