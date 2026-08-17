"use client";

import { useEffect, useState } from "react";
import { wedding } from "@/config/wedding";

const LINKS = [
  { href: "#invitation", label: "Invitation" },
  { href: "#the-day", label: "The Day" },
  { href: "#dress-code", label: "What to Wear" },
  { href: "#gallery", label: "Us" },
  { href: "#gifts", label: "Gifts" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  /* Transparent over the hero, solid once scrolled — so the invitation
     itself is the first thing a guest sees, not a navigation bar. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open
          ? "border-b border-blush-200 bg-white/92 backdrop-blur-sm"
          : "border-b border-transparent"
      }`}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8"
      >
        <a
          href="#top"
          className="min-w-0 truncate font-display text-lg font-normal tracking-wide text-ink-900"
        >
          {wedding.couple.shortNames}
        </a>

        {/* Desktop */}
        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              /* px/py lift even the shortest label ("Us") past the 24×24
                 WCAG 2.5.8 minimum target size */
              className="px-1.5 py-1 text-sm text-ink-600 transition-colors hover:text-rose-600"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#rsvp"
            className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700"
          >
            RSVP
          </a>
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <a
            href="#rsvp"
            className="rounded-md bg-rose-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700"
          >
            RSVP
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex size-10 items-center justify-center rounded-md border border-blush-200 bg-white text-ink-600"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {open ? (
        <div id="mobile-menu" className="border-t border-blush-200 bg-white md:hidden">
          <ul className="mx-auto max-w-5xl px-5 py-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-blush-100 py-3.5 text-sm text-ink-600 last:border-0"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </header>
  );
}
