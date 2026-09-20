"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { wedding, anyVenuePublic, venueIsPublic, type WeddingEvent } from "@/config/wedding";
import { formatFullDate } from "@/lib/date";
import { Signpost } from "./SceneObject";
import { Tilt } from "../Tilt";

/*
  Panel III — everything a guest needs, four cards deep.

  Folding four sections into one panel could easily have become the most
  crowded screen of the invitation. It becomes the most interactive one
  instead: the panel shows four arched doors, and the content lives behind
  whichever one a guest opens. That keeps every card inside one viewport,
  and it means a guest reads only what they came for.

  The arch is the church-door motif — the same ellipse used for the photo
  frames, at the scale of a doorway. It is the reason this panel reads as
  belonging to a wedding rather than to a settings screen.
*/

type CardId = "ceremony" | "gathering" | "attire" | "gifts";

/*
  See the `cards` array below for why this is not simply the time.

  It uses the venue's own SHORT line rather than its full name, and the
  reason is measured rather than assumed. At 1280x860 the full name fits
  on one line, so the problem is invisible on a desktop; on a 375px phone
  the card is 162px wide and "Diocesan Shrine and Parish of Saint
  Clement" runs to two lines, taking the door from 113px to 130px. One
  taller card in a row of four is the kind of thing that reads as a bug
  in the grid rather than as a longer name.
*/
function eventMeta(event: WeddingEvent): string {
  if (wedding.reveal.times) return event.time;
  if (venueIsPublic(event.id)) return event.venueMeta ?? event.venue;
  return wedding.detailsPlaceholder;
}
type GiftMethod = (typeof wedding.gifts.methods)[number];

export function PanelDetails({
  onAdvance,
  active,
}: {
  onAdvance: () => void;
  active: boolean;
}) {
  const [open, setOpen] = useState<CardId | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  /* The enlarged QR code, stacked on top of the open Gifts sheet. */
  const [zoom, setZoom] = useState<GiftMethod | null>(null);
  const zoomTriggerRef = useRef<HTMLButtonElement | null>(null);
  const zoomCloseRef = useRef<HTMLButtonElement>(null);
  /*
    THE SAME STATE, MIRRORED INTO A REF, AND THE REASON IS ESCAPE.

    Both layers want that key, and the top one has to win. The sheet's
    handler is on `window` in the CAPTURE phase, so it does not matter
    where the event started or what the code is nested inside: capture
    listeners on the same target fire in the order they were added, and
    the sheet's is always added first because the sheet has to be open
    before a code inside it can be. A second listener for the zoom would
    therefore run second, by which time the sheet had already closed and
    taken the zoom down with it.

    So there is exactly ONE handler and it decides. It reads the ref
    rather than the state because the state is not in its dependency
    array: adding it there would re-run the effect on every open and
    close, and that effect also moves focus to the sheet's close button
    — which would yank focus back out of the zoom the moment it appeared.
  */
  const zoomOpenRef = useRef(false);
  useEffect(() => {
    zoomOpenRef.current = zoom !== null;
  }, [zoom]);

  const closeZoom = useCallback(() => {
    setZoom(null);
    zoomTriggerRef.current?.focus({ preventScroll: true });
  }, []);

  const close = useCallback(() => {
    setOpen(null);
    /* A code left open behind a closed door would be the first thing a
       guest saw on opening any other door. */
    setZoom(null);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        /* Top layer first: one Escape shuts the enlarged code and leaves
           the sheet where it was, which is what a guest who opened the
           code to look at it expects. */
        if (zoomOpenRef.current) closeZoom();
        else close();
        return;
      }
      /* An open door swallows the arrow keys — otherwise reading the
         ceremony details would slide the whole invitation. */
      if (event.key.startsWith("Arrow")) event.stopPropagation();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, close, closeZoom]);

  /* Focus follows the topmost layer. */
  useEffect(() => {
    if (zoom) zoomCloseRef.current?.focus({ preventScroll: true });
  }, [zoom]);

  /* Shut the door behind you on the way out, or coming back to this panel
     later would find it still standing open. */
  const goToDirections = () => {
    close();
    onAdvance();
  };

  /*
    The panel is a DIFFERENT PANEL depending on whether the photograph is
    there: on the image the date, the title and the signpost invert to
    white, and off it they stay dark ink on blush. One flag drives both,
    rather than the class list and the stylesheet each deciding
    separately and disagreeing the day someone removes the picture.
  */
  const onPhoto = Boolean(wedding.dayImage);

  const [ceremony, gathering] = wedding.events;

  /* The eyebrow reads as a sequence rather than repeating the title —
     "THE CEREMONY / The Ceremony" said the same thing twice. */
  const cards: { id: CardId; label: string; title: string; meta: string }[] = [
    /*
      THE META LINE SAYS THE MOST USEFUL THING IT CAN.

      It is the hour by preference, because that is what a guest checks
      first. But the two halves of an event become public separately, and
      a card reading "To be announced" over a venue whose address is on
      the very next panel is simply wrong: something IS known.

      So the order is time, then place, then the placeholder — and the
      placeholder is reached only when neither is public.
    */
    {
      id: "ceremony",
      label: "First",
      title: ceremony.label,
      meta: eventMeta(ceremony),
    },
    {
      id: "gathering",
      label: "Then",
      title: gathering.label,
      meta: eventMeta(gathering),
    },
    { id: "attire", label: "Please", title: "What to Wear", meta: "Pinks & Khaki" },
    { id: "gifts", label: "With Thanks", title: "Gifts", meta: "If you wish" },
  ];

  return (
    <div
      className={`panel panel-details ${onPhoto ? "is-onPhoto" : ""} ${active ? "is-active" : ""}`}
    >
      {/* The surface the doors stand on. Same shape as the hero's and the
          gallery's: a decorative layer under `.panel-inner`, aria-hidden
          with an empty alt, so a screen reader hears the day's details and
          not a description of the wallpaper.

          EAGER, NOT `priority` — the distinction is the one PanelPhotos
          explains. `priority` would make this compete with the hero, which
          is the LCP element; the default, lazy, would mean a guest arrives
          to the blush gradient and watches the photograph appear behind
          them, because every panel in this deck shares one set of
          coordinates and a lazy image only starts loading once its panel
          is on screen. */}
      {wedding.dayImage ? (
        <div className="panel-details-photo" aria-hidden="true">
          <Image
            src={wedding.dayImage.src}
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
          <p className={`stagger-1 panel-eyebrow ${onPhoto ? "is-onDark" : ""}`}>
            {formatFullDate(wedding.date)}
          </p>
          <h2 className={`stagger-2 panel-title ${onPhoto ? "is-onDark" : ""}`}>The Day</h2>
        </header>

        <ul className="doors">
          {cards.map((card, i) => (
            <li key={card.id} className={`door-slot stagger-${i + 3}`}>
              {/* `lift={0}` on purpose — the door's lift is done in CSS with
                  `:has()` so keyboard, touch and reduced-motion guests keep
                  it, and so the transform stays off the element carrying the
                  backdrop-filter. See `.door-tilt` in globals.css. */}
              <Tilt className="door-tilt" max={7} lift={0}>
              <button
                type="button"
                onClick={(event) => {
                  triggerRef.current = event.currentTarget;
                  setOpen(card.id);
                }}
                /* door-<id>, not :nth-child — the accent belongs to what
                   the card IS, so reordering the four cards moves the
                   colours with them. */
                className={`door door-${card.id}`}
                aria-label={`${card.title}, open for details`}
              >
                <span className="door-label">{card.label}</span>
                <span className="door-title">{card.title}</span>
                <span className="door-meta">{card.meta}</span>
                <span className="door-knob" aria-hidden="true" />
              </button>
              </Tilt>
            </li>
          ))}
        </ul>

        <div className="stagger-7 panel-foot">
          <Signpost onClick={onAdvance} />
        </div>
      </div>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={cards.find((c) => c.id === open)?.title}
          onClick={close}
          className="sheet-backdrop"
        >
          <div onClick={(event) => event.stopPropagation()} className="sheet">
            <button ref={closeRef} type="button" onClick={close} aria-label="Close" className="sheet-close">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            {open === "ceremony" ? (
              <VenueSheet event={ceremony} onDirections={goToDirections} />
            ) : null}
            {open === "gathering" ? (
              <VenueSheet event={gathering} onDirections={goToDirections} />
            ) : null}
            {open === "attire" ? <AttireSheet /> : null}
            {open === "gifts" ? (
              <GiftsSheet
                onZoom={(method, trigger) => {
                  zoomTriggerRef.current = trigger;
                  setZoom(method);
                }}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {/*
        A sibling of the sheet, not a child of it. Nested inside, a click
        on this backdrop would bubble to the sheet's own backdrop handler
        and close both layers at once; out here the two are independent,
        and a plain z-index puts this on top.
      */}
      {zoom ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${zoom.name} QR code`}
          onClick={closeZoom}
          className="qr-zoom"
        >
          <div onClick={(event) => event.stopPropagation()} className="qr-zoom-card">
            <button
              ref={zoomCloseRef}
              type="button"
              onClick={closeZoom}
              aria-label="Close"
              className="sheet-close"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <p className="qr-zoom-name">{zoom.name}</p>
            {zoom.qr ? (
              <Image
                src={zoom.qr}
                alt={`${zoom.name} QR code`}
                width={640}
                height={640}
                unoptimized
                className="qr-zoom-image"
              />
            ) : null}
            <p className="qr-zoom-number">{zoom.accountNumber}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/*
  No map in here any more. It used to carry a full embed, which meant the
  ceremony and the reception each had their map in two places — behind this
  door, and again on the Where panel that exists for exactly that. This
  sheet keeps what it is good at: the time, the address, and the one
  practical note about arriving. Directions are one tap away.
*/
function VenueSheet({
  event,
  onDirections,
}: {
  event: WeddingEvent;
  onDirections: () => void;
}) {
  const showVenue = venueIsPublic(event.id);
  return (
    <div className="sheet-body">
      <p className="sheet-label">{event.label}</p>
      {/*
        WHILE THE DETAILS ARE HIDDEN this sheet is the eyebrow, a
        placeholder and the note. The note stays because neither of them
        names a place or an hour: one asks guests to be seated a little
        early, the other says to come hungry.

        The directions button goes too. It jumps to the Where panel, and
        that panel is not in the deck while this is off — a button that
        advances to nowhere is worse than no button.
      */}
      <h3 className="sheet-title">
        {showVenue ? event.venue : wedding.detailsPlaceholder}
      </h3>
      {showVenue && event.venueMeta ? (
        <p className="sheet-meta">{event.venueMeta}</p>
      ) : null}
      {/* The time is its own switch: this sheet can name a place while
          the hour is still unsettled, which is the state the invitation
          is actually in. */}
      {wedding.reveal.times ? <p className="sheet-time">{event.time}</p> : null}
      {showVenue ? <p className="sheet-address">{event.address}</p> : null}
      {event.note ? <p className="sheet-note">{event.note}</p> : null}

      {/* Directions need BOTH: something to point at, and a panel to
          point at it with. */}
      {showVenue && anyVenuePublic ? (
      <button type="button" onClick={onDirections} className="sheet-directions">
        Maps and directions
        <svg
          viewBox="0 0 24 24"
          className="size-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h13M13 6l6 6-6 6" />
        </svg>
      </button>
      ) : null}
    </div>
  );
}

function AttireSheet() {
  const { intro, parties, pleaseAvoid } = wedding.dressCode;
  return (
    <div className="sheet-body">
      <p className="sheet-label">Dress Code</p>
      <h3 className="sheet-title">What to Wear</h3>
      <p className="sheet-meta">{intro}</p>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {parties.map((party) => (
          <div key={party.who} className={`attire-card attire-card-${party.tint}`}>
            <h4 className="attire-who">{party.who}</h4>
            {/* Emptied in wedding.ts leaves the card as its heading and
                its swatches, rather than an empty paragraph holding open
                the gap the line used to sit in. */}
            {party.attire ? <p className="attire-what">{party.attire}</p> : null}
            {/* The colour name is spelled out under each circle — colour is
                never the only cue, and a guest shopping for "Dusty Rose"
                needs the word. */}
            <ul className="attire-swatches">
              {party.swatches.map((swatch) => (
                <li key={swatch.name}>
                  <span aria-hidden="true" style={{ backgroundColor: swatch.hex }} className="attire-dot" />
                  <span className="attire-name">{swatch.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {pleaseAvoid.length > 0 ? (
        <p className="sheet-aside">
          Please avoid {pleaseAvoid.join(" and ").toLowerCase()}.
        </p>
      ) : null}
    </div>
  );
}

/*
  A card is a BUTTON when it has a code and a plain div when it does not.

  The alternative was a button everywhere with the handler doing nothing
  on the ones with no code, and that is the worse kind of broken: it looks
  pressable, it takes a tab stop, a screen reader announces it as a
  control, and then nothing happens. A method added without artwork
  should read as what it is, a label and a number to copy down.
*/
function GiftsSheet({
  onZoom,
}: {
  onZoom: (method: GiftMethod, trigger: HTMLButtonElement) => void;
}) {
  const { message, methods } = wedding.gifts;
  return (
    <div className="sheet-body">
      <p className="sheet-label">With Thanks</p>
      <h3 className="sheet-title">Gifts</h3>
      <p className="sheet-meta">{message}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {methods.map((method) => {
          const contents = (
            <>
            {/* The provider's mark. `alt=""` because the name is set
                directly below it, and describing the logo would make a
                screen reader say every method twice.

                `fill` rather than explicit dimensions: these four marks run
                from 1:1 to 3.44:1, so nothing useful could be hardcoded, and
                `object-contain` inside a fixed box is what makes four
                different shapes present as one row.

                `--logo-scale` is the optical correction on top of that — a
                square mark needs to be drawn larger than a wordmark to read
                as the same size. See wedding.ts for the measurements. */}
            {method.logo ? (
              <span className="gift-logo">
                <span
                  className="gift-logo-inner"
                  style={{ ["--logo-scale" as string]: method.logoScale }}
                >
                  <Image
                    src={method.logo}
                    alt=""
                    fill
                    sizes="180px"
                    className="object-contain"
                  />
                </span>
              </span>
            ) : null}
            <p className="gift-name">{method.name}</p>
            {/* `unoptimized`, which is rare and deliberate. The optimiser
                would resample the code to the display size and re-encode it
                as WebP at quality 75 — lossy compression of pure
                high-frequency black and white, which is the exact input it
                handles worst, and the ringing lands inside the module grid.
                These files are 9-15KB already, so there is nothing to win
                and a scan to lose. See scripts/crop-qr.mjs. */}
            {method.qr ? (
              <Image
                src={method.qr}
                alt={`${method.name} QR code`}
                width={320}
                height={320}
                unoptimized
                className="gift-qr"
              />
            ) : null}
            <p className="gift-number">{method.accountNumber}</p>
            </>
          );

          /* Two elements rather than one with a computed tag: a variable
             tag makes the props a union of button and div attributes, and
             an onClick typed for one is not assignable to the other. */
          return method.qr ? (
            <button
              key={method.name}
              type="button"
              onClick={(event: MouseEvent<HTMLButtonElement>) =>
                onZoom(method, event.currentTarget)
              }
              /* The code on the card is small on purpose, so the label has
                 to say what pressing it does. */
              aria-label={`${method.name}, show the QR code larger`}
              className="gift-card is-pressable"
            >
              {contents}
            </button>
          ) : (
            <div key={method.name} className="gift-card">
              {contents}
            </div>
          );
        })}
      </div>
    </div>
  );
}
