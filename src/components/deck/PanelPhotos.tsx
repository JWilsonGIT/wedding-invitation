"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { wedding } from "@/config/wedding";
import { PhotoFrame } from "./SceneObject";
import { Tilt } from "../Tilt";

const images = wedding.gallery.images;

/*
  The collage is a solved tiling: every photograph's cell and span are
  generated in scripts/gen-collage.mjs and written into globals.css, and
  the two grids there are sized for EXACTLY EIGHTEEN photographs — 7x6 on
  a wide screen, 5x8 on a phone, each an exact cover with no spare cells.

  So a different number of photographs cannot use it. Nineteen has nowhere
  to go; seventeen leaves a hole where a photograph should be, which reads
  as a loading failure rather than as space. Both fall back to a plain
  even grid instead, which works at any count.
*/
const isCollage = images.length === 18;

/*
  Tile widths, for the image loader.

  A 2x2 tile is two sevenths of the stage on a wide screen and two fifths
  on a phone; a 1x1 is half that. These are the LARGER case in each
  bracket, deliberately — a soft photograph is far more noticeable than a
  slightly over-fetched one, and the collage crops every image to its
  cell anyway, so an image that arrives a little large loses nothing.

  Not `index === 0` any more. In the pile the first photograph was the
  hero and always the biggest; in the collage the generator decides which
  cells are 2x2, and it is not always the first. The `big` flag below is
  read from the tiling rather than assumed.
*/
const BIG_SIZES = "(min-width: 768px) 300px, 60vw";
const SMALL_SIZES = "(min-width: 768px) 160px, 32vw";

/* Which photographs land on a 2x2 cell, taken from the generated tiling in
   globals.css. Kept here only to size the image request — the layout
   itself is entirely CSS. */
const BIG_TILES = new Set([1, 2, 3, 4, 5, 6]);
/* Six on the wide grid, five on the phone — the generator emits the 2x2
   tiles first in both, so the first six covers the larger case and errs
   large on the smaller one, which is the direction that costs nothing. */

/*
  Panel II — the photographs, as a pile of prints on the one dark surface.

  Charcoal is doing real work rather than being a mood: white-bordered
  prints need something to sit ON. On a pale ground the borders dissolve
  into the page and the pile stops reading as objects; on charcoal every
  print has an edge and a shadow, and six photographs become one thing.

  The whole pile is capped by VIEWPORT HEIGHT, not width — the rule the
  rest of this deck follows. Prints are allowed to bleed off the edges of
  the stage and are clipped there, which is what stops six photographs
  looking like six photographs politely arranged.
*/
/* How long a card takes to leave the top of the stack. Must match
   `lightbox-card-out` in globals.css, or the outgoing print is unmounted
   mid-flight (too short) or lingers invisibly over the new one (too long). */
const EXIT_MS = 380;

type Leaving = {
  index: number;
  /** 1 when stepping forward, -1 back. The card exits the way you came from. */
  dir: 1 | -1;
  /** Measured before the swap, so the card keeps its own aspect on the way out. */
  w: number;
  h: number;
};

export function PanelPhotos({
  onAdvance,
  active,
}: {
  onAdvance: () => void;
  active: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  /*
    THE CARD ON ITS WAY OUT. It has to stay mounted for a moment after the
    index moves on, or there is nothing to animate away and the stack is
    just a cross-fade.

    It carries its own MEASURED width and height, which is the part that
    is easy to miss: these photographs are a mix of portrait and
    landscape, so an outgoing card left to fill the box would inherit the
    INCOMING one's shape. A portrait print would snap to a landscape
    frame and letterbox itself against the white card for the whole exit.
    Measuring before the swap keeps it the shape it was.
  */
  const [leaving, setLeaving] = useState<Leaving | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<number | null>(null);

  const close = useCallback(() => {
    setOpenIndex(null);
    /* A card mid-exit when the lightbox shuts would be the first thing on
       screen the next time it opens. */
    setLeaving(null);
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);


  const step = useCallback(
    (delta: number) => {
      if (openIndex === null) return;
      const next = (openIndex + delta + images.length) % images.length;

      /*
        Reduced motion gets the next photograph and nothing else. With no
        animation to run, a card parked on top for 380ms would just be a
        stale picture sitting over the right one.
      */
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const box = cardRef.current?.getBoundingClientRect();
        /* If the outgoing photograph had not painted yet there is no box
           to preserve, and a card dealt away at the wrong size is worse
           than no card at all. Skip the flourish and just swap. */
        if (box && box.width > 1 && box.height > 1) {
          setLeaving({
            index: openIndex,
            dir: delta > 0 ? 1 : -1,
            w: box.width,
            h: box.height,
          });
          if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
          leaveTimer.current = window.setTimeout(() => setLeaving(null), EXIT_MS);
        }
      }

      setOpenIndex(next);
    },
    [openIndex, images.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    closeRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      /* stopPropagation, not just a local handler: the deck listens for
         arrows too, and a guest stepping through photographs must not
         also be sliding the whole invitation sideways underneath. */
      if (event.key === "Escape") {
        close();
      } else if (event.key === "ArrowRight") {
        event.stopPropagation();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.stopPropagation();
        step(-1);
      }
    };
    /* Capture phase, so this runs before the deck's window listener. */
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [openIndex, close, step]);

  const activePhoto = openIndex === null ? null : images[openIndex];

  return (
    <div className={`panel panel-photos ${active ? "is-active" : ""}`}>
      {/* The surface the prints lie on. Same shape as the hero's photograph:
          a decorative layer under `.panel-inner`, aria-hidden with an empty
          alt, so a screen reader hears the gallery and not a description of
          its wallpaper.

          EAGER, BUT NOT `priority`, and the distinction matters here.

          `priority` preloads at high fetch priority — right for the hero,
          which is the LCP element, and wrong for this, which would then
          compete with the thing a guest is actually looking at.

          But the default, lazy, is worse. Every panel in this deck is laid
          out at the same coordinates, so a lazy image only begins loading
          when its panel becomes the one on screen — which means a guest
          arrives to the plum gradient and watches the photograph appear
          behind them. `eager` starts the fetch without jumping the queue,
          and the writing on Panel I buys nearly five seconds for it to
          finish before anyone can reach this panel. */}
      {wedding.gallery.background ? (
        <div className="panel-photos-photo" aria-hidden="true">
          <Image
            src={wedding.gallery.background.src}
            alt=""
            fill
            loading="eager"
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="panel-inner">
        <header className="panel-head">
          <p className="stagger-1 panel-eyebrow is-onDark">Gallery</p>
          <h2 className="stagger-2 panel-title is-onDark">{wedding.gallery.heading}</h2>
        </header>

        <div className="panel-photos-stage">
          <ul
            className={
              isCollage ? "prints prints-in" : "grid grid-cols-2 gap-3 md:grid-cols-3"
            }
          >
            {images.map((image, index) => (
              <li key={image.src} className={isCollage ? "print-slot" : undefined}>
                {/* `lift={0}` because `.print-slot`'s own hover already
                    scales the tile up — a second lift reads as a lurch. The
                    SHEEN is gated to the collage: a tile catches light because
                    it is a glossy surface being turned, and the plain fallback
                    grid is not trying to be one. See globals.css. */}
                <Tilt className="print-tilt" max={8} lift={0} sheen={isCollage}>
                <button
                  type="button"
                  onClick={(event) => {
                    triggerRef.current = event.currentTarget;
                    setOpenIndex(index);
                  }}
                  className={isCollage ? "print" : "mosaic-tile"}
                  aria-label={`View larger: ${image.alt}`}
                >
                  <span className={isCollage ? "print-photo" : "relative block h-full"}>
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes={BIG_TILES.has(index + 1) ? BIG_SIZES : SMALL_SIZES}
                      className="object-cover"
                    />
                  </span>
                </button>
                </Tilt>
              </li>
            ))}
          </ul>
        </div>

        <div className="stagger-6 panel-foot">
          <PhotoFrame onClick={onAdvance} />
        </div>
      </div>

      {activePhoto ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activePhoto.alt}
          onClick={close}
          className="lightbox"
        >
          <button ref={closeRef} type="button" onClick={close} aria-label="Close" className="lightbox-close">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <LightboxNav side="left" onClick={() => step(-1)} />
          <LightboxNav side="right" onClick={() => step(1)} />

          <div onClick={(event) => event.stopPropagation()} className="lightbox-stage">
            <div className="lightbox-deck">
              {/* The pile the top card is lifted off. Two edges is enough:
                  a third reads as clutter at this size, and none at all
                  leaves the card floating with nothing to be the top OF.
                  They sit behind and take the current card's exact box,
                  so they follow a portrait-to-landscape change for free. */}
              <span className="lightbox-under is-two" aria-hidden="true" />
              <span className="lightbox-under is-one" aria-hidden="true" />

              {/* The card being dealt away. `key` on the index so React
                  builds a NEW element per step rather than reusing this
                  one, which would leave the animation already finished. */}
              {leaving ? (
                <div
                  key={`leaving-${leaving.index}`}
                  aria-hidden="true"
                  style={{
                    width: leaving.w || undefined,
                    height: leaving.h || undefined,
                    ["--exit-x" as string]: leaving.dir > 0 ? "-62%" : "62%",
                    ["--exit-rot" as string]: leaving.dir > 0 ? "-11deg" : "11deg",
                  }}
                  className="lightbox-card is-leaving"
                >
                  <Image
                    src={images[leaving.index].src}
                    alt=""
                    width={images[leaving.index].width}
                    height={images[leaving.index].height}
                    sizes="(min-width: 768px) 70vh, 90vw"
                    loading="eager"
                    className="lightbox-image"
                  />
                </div>
              ) : null}

              <div
                key={openIndex}
                ref={cardRef}
                style={{
                  ["--from-rot" as string]: leaving?.dir === -1 ? "2.4deg" : "-2.4deg",
                }}
                className="lightbox-card is-current"
              >
                <Image
                  src={activePhoto.src}
                  alt={activePhoto.alt}
                  width={activePhoto.width}
                  height={activePhoto.height}
                  sizes="(min-width: 768px) 70vh, 90vw"
                  /* EAGER, and the lightbox is the one place it is
                     obviously right: a guest has just tapped this exact
                     photograph. Lazy also left the card with no box at
                     all until the bytes arrived, because .lightbox-image
                     sets `width: auto` and an unloaded image has no
                     intrinsic size to be auto ABOUT. */
                  loading="eager"
                  className="lightbox-image"
                />
              </div>
            </div>

            <p className="lightbox-count">
              {(openIndex ?? 0) + 1} of {images.length}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LightboxNav({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      className={`lightbox-nav ${side === "left" ? "is-left" : "is-right"}`}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={side === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}
