"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { wedding } from "@/config/wedding";
import { Section } from "./Section";
import { SectionHeading } from "./SectionHeading";
import { Tilt } from "./Tilt";

const images = wedding.gallery.images;

/*
  The mosaic has two tile sizes, so it needs two `sizes`. One shared
  value cannot work: the first two photographs are 2x2 and reach ~517px
  on a full-width collage, where a single "25vw" would ask for half that
  and hand back a soft, upscaled photograph.

  1088px is where the section's max-w-5xl column stops growing and pins
  at 1024px. The vw figures deliberately ignore the section padding,
  which makes them slightly generous — the right direction for `sizes`.
*/
const TILE_LARGE = "(min-width: 1088px) 528px, (min-width: 768px) 50vw, 50vw";
const TILE_SMALL = "(min-width: 1088px) 264px, (min-width: 768px) 25vw, 50vw";

/*
  The mosaic names exactly six slots, so it only holds together with
  exactly six photographs: a seventh would overflow the locked box, and
  a fifth would leave a hole in it. wedding.ts is meant to be edited
  freely by someone who is not a developer, so any other count falls
  back to the plain grid rather than breaking the page.
*/
/* NOTE: this component is no longer rendered — page.tsx mounts the deck,
   and the .mosaic styles it relies on have been removed. Kept only so the
   file still typechecks; the range mirrors the deck gallery. */
const isMosaic = images.length >= 6 && images.length <= 12;

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

      <ul
        className={
          isMosaic
            ? "mosaic mt-14"
            : "mt-14 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3"
        }
      >
        {images.map((image, index) => (
          /* Each photo tilts up out of the page on its own scroll range,
             so the collage assembles itself rather than appearing at once. */
          <li key={image.src} className="tilt-3d">
            {/* h-full the whole way down — li, Tilt, button, span. In the
                mosaic the cell decides the height, and the photo has to
                fill whatever the tracks have given it at this instant. One
                break in the chain and the tile collapses to nothing. */}
            <Tilt className={isMosaic ? "h-full" : "arch"} max={7} lift={5}>
              <button
                type="button"
                onClick={(event) => {
                  triggerRef.current = event.currentTarget;
                  setOpenIndex(index);
                }}
                /* Square corners in the mosaic: the tiles are squares set
                   in a tight grid, and a radius on each one would round the
                   seams into a row of lozenges. The arch — the bridal motif
                   used everywhere else — is kept for the fallback grid, where
                   the tiles stand apart and can carry it. */
                className={`group block w-full overflow-hidden border border-blush-200 bg-blush-50 ${
                  isMosaic ? "h-full" : "arch"
                }`}
                aria-label={`View larger: ${image.alt}`}
              >
                <span
                  className={
                    isMosaic
                      ? "relative block h-full"
                      : "relative block aspect-[4/5]"
                  }
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes={
                      isMosaic
                        ? index < 2
                          ? TILE_LARGE
                          : TILE_SMALL
                        : "(min-width: 768px) 33vw, 50vw"
                    }
                    /* Every tile is square, so object-cover crops each
                       photograph to its centre — portrait and landscape
                       sources alike come out as squares. */
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
              className="mx-auto max-h-[85vh] w-auto object-contain"
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
