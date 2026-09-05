"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { wedding, type WeddingEvent } from "@/config/wedding";
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

  const close = useCallback(() => {
    setOpen(null);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      /* An open door swallows the arrow keys — otherwise reading the
         ceremony details would slide the whole invitation. */
      if (event.key.startsWith("Arrow")) event.stopPropagation();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, close]);

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
    { id: "ceremony", label: "First", title: ceremony.label, meta: ceremony.time },
    { id: "gathering", label: "Then", title: gathering.label, meta: gathering.time },
    { id: "attire", label: "Please", title: "What to Wear", meta: "Pinks & khaki" },
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
                aria-label={`${card.title} — open for details`}
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
            {open === "gifts" ? <GiftsSheet /> : null}
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
  return (
    <div className="sheet-body">
      <p className="sheet-label">{event.label}</p>
      <h3 className="sheet-title">{event.venue}</h3>
      {event.venueMeta ? <p className="sheet-meta">{event.venueMeta}</p> : null}
      <p className="sheet-time">{event.time}</p>
      <p className="sheet-address">{event.address}</p>
      {event.note ? <p className="sheet-note">{event.note}</p> : null}

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
            <p className="attire-what">{party.attire}</p>
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
          Kindly avoid {pleaseAvoid.join(" and ").toLowerCase()}.
        </p>
      ) : null}
    </div>
  );
}

function GiftsSheet() {
  const { message, methods } = wedding.gifts;
  return (
    <div className="sheet-body">
      <p className="sheet-label">With Thanks</p>
      <h3 className="sheet-title">Gifts</h3>
      <p className="sheet-meta">{message}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {methods.map((method) => (
          <div key={method.name} className="gift-card">
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
            {method.qr ? (
              <Image
                src={method.qr}
                alt={`${method.name} QR code for ${method.accountName}`}
                width={140}
                height={140}
                className="mt-4 rounded-md border border-blush-200"
              />
            ) : null}
            <p className="gift-account">{method.accountName}</p>
            <p className="gift-number">{method.accountNumber}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
