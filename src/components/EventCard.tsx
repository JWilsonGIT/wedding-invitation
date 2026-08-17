import type { WeddingEvent } from "@/config/wedding";
import { MapEmbed } from "./MapEmbed";

/**
 * One card, used for every event in the day. The church and Max's differ
 * only in the data handed to it — so adding a third stop needs no new
 * component, just another entry in `wedding.events`.
 */
export function EventCard({ event, index }: { event: WeddingEvent; index: number }) {
  return (
    <article className="flex flex-col rounded-xl border border-blush-200 bg-white p-6 sm:p-8">
      <div className="flex items-center gap-3">
        {/* Ordinal, not a program: it says "this happens, then this". */}
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full border border-blush-200 bg-blush-50 font-display text-xs text-rose-600"
        >
          {index + 1}
        </span>
        <p className="text-[0.7rem] font-medium tracking-[0.24em] text-rose-600 uppercase">
          {event.label}
        </p>
      </div>

      <h3 className="mt-4 font-display text-2xl leading-snug font-normal text-ink-900 sm:text-[1.7rem]">
        {event.venue}
      </h3>

      <p className="mt-3 font-display text-lg text-rose-600">{event.time}</p>

      <address className="mt-3 text-sm leading-relaxed text-ink-600 not-italic">
        {event.address}
      </address>

      {event.note ? (
        <p className="mt-5 rounded-md border border-blush-200 bg-blush-50 px-4 py-3 text-sm leading-relaxed text-ink-600">
          {event.note}
        </p>
      ) : null}

      {/* Pushes the map to the card's bottom so both cards align in the grid */}
      <div className="mt-auto">
        <MapEmbed
          query={event.mapsQuery}
          mapsUrl={event.mapsUrl}
          venue={event.venue}
        />
      </div>
    </article>
  );
}
