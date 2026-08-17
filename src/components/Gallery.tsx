"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { wedding } from "@/config/wedding";
import { Section } from "./Section";
import { SectionHeading } from "./SectionHeading";
import { Tilt } from "./Tilt";

const images = wedding.gallery.images;

export function Gallery() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  /* Remember which thumbnail opened the lightbox so focus can go back
     there on close — otherwise keyboard users land at the top of the page. */
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpenIndex(null);
    triggerRef.current?.focus();
  }, []);

  const step = useCallback((delta: number) => {
    setOpenIndex((current) =>
      current === null ? null : (current + delta + images.length) % images.length,
    );
  }, []);

  useEffect(() => {
    if (openIndex === null) return;

    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };

    document.addEventListener("keydown", onKeyDown);
    // Stop the page scrolling behind the overlay
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex, close, step]);

  const active = openIndex === null ? null : images[openIndex];

  return (
    <Section id="gallery">
      <SectionHeading eyebrow="Gallery" index={3}>
        {wedding.gallery.heading}
      </SectionHeading>

      <ul className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {images.map((image, index) => (
          /* Each photo tilts up out of the page on its own scroll range,
             so the grid assembles itself rather than appearing at once. */
          <li key={image.src} className="tilt-3d">
            <Tilt className="arch" max={7} lift={5}>
              <button
                type="button"
                onClick={(event) => {
                  triggerRef.current = event.currentTarget;
                  setOpenIndex(index);
                }}
                /* The arch is the one unmistakably bridal shape on the page —
                   a chapel window, and the frame every wedding photographer
                   already shoots for. */
                className="arch group block w-full overflow-hidden border border-blush-200 bg-blush-50"
                aria-label={`View larger: ${image.alt}`}
              >
                <span className="relative block aspect-[4/5]">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 768px) 33vw, 50vw"
                    className="object-cover transition-transform duration-500 ease-gentle group-hover:scale-[1.04]"
                  />
                </span>
              </button>
            </Tilt>
          </li>
        ))}
      </ul>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          onClick={close}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-900/80 p-4 backdrop-blur-sm"
        >
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-white/95 text-ink-900"
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
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <NavButton side="left" onClick={() => step(-1)} />
          <NavButton side="right" onClick={() => step(1)} />

          <div
            /* Clicks on the image itself must not close the overlay */
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-[85vh] w-full max-w-3xl"
          >
            <Image
              src={active.src}
              alt={active.alt}
              width={active.width}
              height={active.height}
              sizes="(min-width: 768px) 768px, 100vw"
              className="mx-auto max-h-[85vh] w-auto rounded-lg object-contain"
            />
          </div>
        </div>
      ) : null}
    </Section>
  );
}

function NavButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      className={`absolute ${side === "left" ? "left-3" : "right-3"} top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-900`}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={side === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}
