import { wedding } from "@/config/wedding";
import { formatLongDate } from "@/lib/date";
import { Ornament } from "./Ornament";

export function Footer() {
  return (
    <footer className="border-t border-blush-200 bg-white px-5 py-16 text-center sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Ornament />

        <p className="mt-8 font-display text-3xl font-light tracking-[0.05em] text-ink-900">
          {wedding.couple.shortNames}
        </p>
        <p className="mt-3 text-xs tracking-[0.24em] text-ink-400 uppercase">
          {formatLongDate(wedding.date)}
        </p>
        <p className="mt-7 text-sm text-ink-600">
          Thank you for celebrating with us.
        </p>
      </div>
    </footer>
  );
}
