"use client";

import Image from "next/image";
import { wedding } from "@/config/wedding";
import { dateParts } from "@/lib/date";
import { Ornament } from "../Ornament";
import { Envelope } from "./SceneObject";
import { WrittenNames } from "./WrittenNames";
import { nameOutlines } from "./name-outlines.generated";

/*
  Panel I — who, when, where, and the one sentence that matters.

  The hero photograph is the only image on this panel and the only one on
  the whole invitation that loads eagerly: it is the largest thing a guest
  sees first, so it is the LCP element and lazy-loading it would be a
  measurable delay for no benefit.

  Everything here is sized in `dvh`-aware clamps rather than fixed
  type sizes. A no-scroll panel has no escape valve — if the copy grows
  taller than the viewport it is simply lost, so the type shrinks with the
  screen instead of the panel growing past it.
*/
export function PanelWelcome({
  onAdvance,
  active,
}: {
  onAdvance: () => void;
  active: boolean;
}) {
  const { weekday, month, day, year } = dateParts(wedding.date);
  const ceremony = wedding.events[0];

  const initials = `${wedding.couple.partnerOne.trim()[0]}${wedding.couple.partnerTwo.trim()[0]}`;

  /*
    WEDDING.TS STAYS THE ONLY FILE ANYONE HAS TO EDIT, and this line is what
    keeps that true.

    The handwriting is drawn from letterform outlines generated for two
    specific names. Change either name and the artwork no longer matches the
    invitation — so rather than shipping the wrong names beautifully, the
    panel falls back to the plain text rendering, which reads whatever
    wedding.ts says. Nothing breaks; the animation simply reverts to the
    older sweep until someone re-runs the generator:

        python scripts/generate-name-outlines.py

    It is also the rollback lever. Force this to false and the whole feature
    is off, with no files removed.
  */
  const written =
    nameOutlines.lineA.text === wedding.couple.partnerOne &&
    nameOutlines.lineB.text === wedding.couple.partnerTwo;

  return (
    <div className={`panel panel-welcome ${active ? "is-active" : ""}`}>
      {/* The photograph, shown at full strength — nothing is layered over
          it. That makes the type on this panel legible only for as long as
          the picture behind it stays light; see the note in globals.css
          where the wash used to be defined. */}
      <div className="panel-welcome-photo" aria-hidden="true">
        {/* A frame around the photograph, because `fill` writes
            `height:100%;top:0` as INLINE styles and a stylesheet cannot
            outrank those without `!important`. The cap that keeps the
            rings on screen therefore lives on this div, which is mine,
            and the image fills it. See globals.css. */}
        <div className="panel-welcome-photo-frame">
        {/* quality 90, not the default 75. With no wash over it any more
            this photograph is seen at full strength, and webp at 75 leaves
            visible banding across a large near-white field like this one.
            The value must also be listed in next.config.ts — see there. */}
        <Image
          src={wedding.heroImage.src}
          alt=""
          fill
          priority
          /*
            UNOPTIMIZED, WHICH IS RARE HERE AND DELIBERATE: the file is
            served exactly as it sits on disk, every pixel of it.

            The optimiser was doing two things to this photograph, and
            both are reductions. It re-encoded to WebP at quality 90,
            which is lossy; and `sizes="100vw"` makes it pick a width
            from the device list, so a 1536px-wide source could be handed
            back at 1200 on a phone. Neither is visible side by side, but
            both are exactly what "do not reduce the resolution" rules
            out.

            WHAT IT COSTS: this is the LCP element and the PNG is 789KB,
            where an optimised WebP would have been a fraction of that.
            If load time ever matters more than the last pixel, the
            middle ground is to drop `unoptimized` and set
            `quality={100}` — full resolution, still re-encoded.

            Same reasoning as the payment QR codes in PanelDetails, which
            are unoptimized for the same "leave my pixels alone" reason.
          */
          unoptimized
          sizes="100vw"
          className="object-cover"
        />
        </div>
      </div>

      <div className="panel-inner panel-welcome-body">
        {/* The copy sits straight on the photograph now. `.hero-glass` is
            still here because it owns the column layout — the flex
            direction, the gap and the padding that `.panel-inner` handed
            to it — but it no longer draws anything: no frost, no veil, no
            border, no shadow. See globals.css.

            THE `Tilt` WRAPPER WENT WITH THE GLASS. It existed to lean the
            PANE toward the cursor, and its sheen and hover shadow are
            drawn at the pane's own corners. With nothing left to draw,
            both would have shown as a rectangle sliding about on top of
            the photograph. The other three cards on this invitation keep
            their tilt; this one has no card to tilt. */}
        <div className="hero-glass">
          <p className="stagger-1 panel-eyebrow">{wedding.invitation.heading}</p>

        {/* No stagger on the h1 itself — the three lines inside it arrive
            one at a time instead. It is still one heading to a screen
            reader; it is three beats to the eye. */}
        <h1 className={`panel-welcome-names ${written ? "is-written" : ""}`}>
          {written ? (
            <>
              {/* One text source, announced once. The SVG is aria-hidden, so
                  a screen reader hears "Ana and Jan" and nothing else — and
                  the real names stay in the DOM for copy and translation,
                  which drawn letterforms cannot provide. */}
              <span className="sr-only">
                {wedding.couple.partnerOne} and {wedding.couple.partnerTwo}
              </span>
              <span className="stagger-2 block">
                <WrittenNames />
              </span>
            </>
          ) : (
            <>
              {/* Two layers per name, and only one of them is real text to a
                  screen reader. `.name-fill` is the name itself, held
                  colourless until the outline has drawn; `.name-stroke` is an
                  aria-hidden copy on top of it, swept in from the left. A
                  pseudo-element would have been less markup, but VoiceOver
                  reads generated content and the names would be announced
                  twice. */}
              <span className="stagger-2 block panel-welcome-name-a">
                <span className="name-fill">{wedding.couple.partnerOne}</span>
                <span className="name-stroke" aria-hidden="true">
                  {wedding.couple.partnerOne}
                </span>
              </span>
              <span className="stagger-3 panel-welcome-amp" aria-hidden="true">
                &amp;
              </span>
              {/* aria-hidden on the ampersand above and the word here keeps a
                  screen reader saying "Ana and Jan", not "amp". */}
              <span className="sr-only">and</span>
              <span className="stagger-4 block panel-welcome-name-b">
                <span className="name-fill">{wedding.couple.partnerTwo}</span>
                <span className="name-stroke" aria-hidden="true">
                  {wedding.couple.partnerTwo}
                </span>
              </span>
            </>
          )}
        </h1>

        <Ornament draw className="stagger-5 welcome-ornament mt-3" />

        <p className="stagger-6 panel-welcome-date">
          <span>{weekday}</span>
          <span className="panel-welcome-dot" aria-hidden="true" />
          <span>
            {month} {day}, {year}
          </span>
        </p>

        {/* Two lines, not one separated by a dot. The venue name is long
            enough to wrap on its own at most widths, and a wrapped name
            followed by "· 11:00 AM" reads as a fragment rather than as a
            time. Blocks rather than a <br>, so the split survives the name
            wrapping and the time never ends up orphaned mid-line. */}
        <p className="stagger-7 panel-welcome-venue">
          <span className="panel-welcome-venue-name">
            {wedding.reveal.ceremonyVenue ? ceremony.venue : wedding.detailsPlaceholder}
          </span>
          {/*
            The hour, one character at a time.

            TWO COPIES, AND ONLY ONE OF THEM IS TEXT TO A SCREEN READER.
            Splitting a string into per-character spans is what lets each
            one animate, and it is also what makes VoiceOver read it as
            "one, one, colon, zero, zero" — a time announced as digits is
            worse than no animation at all. The split copy is aria-hidden
            and an unsplit one carries the meaning. Same arrangement as the
            written names above.

            NBSP for the space, because a plain space between two
            inline-blocks collapses and "11:00AM" is not the time.
          */}
          {/* The hour goes with the venue: see wedding.ts. The whole block
              is dropped rather than replaced, because the name above has
              already said "To be announced" and saying it twice reads as
              a fault. */}
          {wedding.reveal.times ? (
          <span className="panel-welcome-venue-time">
            <span className="sr-only">{ceremony.time}</span>
            <span aria-hidden="true">
              {[...ceremony.time].map((glyph, i) => (
                <span
                  key={i}
                  className="time-char"
                  style={{ ["--char" as string]: i }}
                >
                  {glyph === " " ? "\u00A0" : glyph}
                </span>
              ))}
            </span>
          </span>
          ) : null}
        </p>

        <p className="stagger-8 panel-welcome-note">{wedding.invitation.body[0]}</p>

          <div className="stagger-9 pt-2">
            <Envelope onClick={onAdvance} initials={initials} />
            </div>
          </div>

      </div>
    </div>
  );
}
