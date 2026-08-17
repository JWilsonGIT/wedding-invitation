import Image from "next/image";
import { wedding } from "@/config/wedding";
import { dateParts } from "@/lib/date";
import { Ornament } from "./Ornament";

export function Hero() {
  const { weekday, month, day, year } = dateParts(wedding.date);
  const ceremony = wedding.events[0];

  return (
    <section
      id="top"
      /* svh, not vh — vh sits behind mobile browser chrome and would push
         the RSVP button below the fold on a phone. */
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-5 py-20 sm:px-8 sm:py-28"
    >
      {/* The photo reads as a soft watermark, not a landing-page hero —
          it's an invitation, so the words come first. */}
      <Image
        src={wedding.heroImage.src}
        alt={wedding.heroImage.alt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-white/80" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-white via-white/55 to-white"
      />

      <div className="relative w-full max-w-3xl">
        <div className="border border-rose-400/45 px-6 py-10 text-center sm:px-14 sm:py-20">
          <p className="text-[0.7rem] font-medium tracking-[0.3em] text-rose-600 uppercase">
            {wedding.invitation.heading}
          </p>

          <h1 className="mt-6 font-display font-light text-ink-900 sm:mt-8">
            <span className="block text-5xl leading-[1.05] tracking-[0.04em] sm:text-6xl md:text-7xl">
              {wedding.couple.partnerOne}
            </span>
            {/* rose-500 is cleared for display text at this size only */}
            <span
              aria-hidden="true"
              className="my-2 block text-3xl text-rose-500 sm:my-3 sm:text-4xl"
            >
              &amp;
            </span>
            <span className="sr-only"> and </span>
            <span className="block text-5xl leading-[1.05] tracking-[0.04em] sm:text-6xl md:text-7xl">
              {wedding.couple.partnerTwo}
            </span>
          </h1>

          <Ornament className="mt-7 sm:mt-9" />

          <p className="mt-6 text-xs font-medium tracking-[0.24em] text-ink-600 uppercase sm:mt-8 sm:text-sm">
            {weekday} · {month} {day}, {year}
          </p>
          <p className="mt-3 text-sm text-ink-400">
            {ceremony.venue} · {ceremony.time}
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:mt-11 sm:flex-row sm:items-center">
            <a
              href="#rsvp"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-rose-600 px-7 py-3 text-sm font-medium tracking-wide text-white transition-colors hover:bg-rose-700"
            >
              RSVP
            </a>
            <a
              href="#the-day"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-blush-200 bg-white/70 px-7 py-3 text-sm font-medium tracking-wide text-rose-600 transition-colors hover:border-rose-400 hover:bg-white"
            >
              The Details
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
