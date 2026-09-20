"use client";

import Image from "next/image";
import { useState } from "react";
import { wedding, venueIsPublic, type WeddingEvent } from "@/config/wedding";
import { MapEmbed } from "../MapEmbed";
import { Chair } from "./SceneObject";

/*
  Panel IV — where, and how to actually get there.

  "How do I find it" is the most practical question a guest has, and until
  now the answer was two clicks deep behind a door on the previous panel.
  Here it is the whole screen.

  ONE MAP, SWITCHED — not two side by side. Two maps in a panel that cannot
  scroll means two SMALL maps, and a map too small to read is decoration.
  A guest is going to one place at a time anyway, so the panel shows one at
  full size and lets them flip between them. It also survives a phone,
  which two stacked maps would not.

  The switcher is a pair of buttons with `aria-pressed`, deliberately NOT a
  tablist: a tablist owns the arrow keys, and the arrow keys already belong
  to the deck. Choosing the simpler control keeps both working.
*/
export function PanelWhere({
  onAdvance,
  active,
}: {
  onAdvance: () => void;
  active: boolean;
}) {
  const [which, setWhich] = useState(0);
  /*
    One flag for the whole inversion — the photo layer, the panel class and
    the two `is-onDark` copies. Same shape as Panel III: with the image the
    panel is dark and its copy is white, without it the copy stays dark ink
    on the original ground, and neither half can be left behind.
  */
  const onPhoto = Boolean(wedding.whereImage);
  /*
    ONLY THE VENUES THAT ARE PUBLIC. A place that is still withheld must
    not appear here at all: not as a tab, not as an address, and above
    all not as a map, because the embed would disclose it to Google even
    with the words off the screen.

    The deck drops this panel entirely when the list would be empty —
    see Deck.tsx — so there is always at least one here.
  */
  const venues: readonly WeddingEvent[] = wedding.events.filter((e) =>
    venueIsPublic(e.id),
  );
  const venue = venues[which] ?? venues[0];

  return (
    <div
      className={`panel panel-where ${onPhoto ? "is-onPhoto" : ""} ${active ? "is-active" : ""}`}
    >
      {/* The ground the switcher and the map stand on. Decorative, so it is
          aria-hidden with an empty alt — a screen reader hears the venue and
          the address, not a description of the wallpaper.

          EAGER, NOT `priority`, the same reasoning as Panels II, III and V:
          it must not compete with the hero, but lazy would mean a guest
          arrives to a bare panel and watches the photograph appear behind
          them, because every panel in this deck shares one set of
          coordinates. */}
      {wedding.whereImage ? (
        <div className="panel-where-photo" aria-hidden="true">
          <Image
            src={wedding.whereImage.src}
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
          <p className={`stagger-1 panel-eyebrow ${onPhoto ? "is-onDark" : ""}`}>Getting There</p>
          <h2 className={`stagger-2 panel-title ${onPhoto ? "is-onDark" : ""}`}>Where</h2>
        </header>

        {/* No stagger here. This is a layout box with no background or
            border of its own, so nothing shows if it never animates — and
            staggering it would nest an animation inside an animation,
            compounding both blurs and starting the children before their
            own parent had finished arriving. */}
        <div className="where-card">
          {/* A bare two-column grid with no box of its own, so the stagger
              sits on the buttons instead and they arrive in turn.

              HIDDEN WHEN THERE IS ONLY ONE PLACE TO SHOW. A switcher with
              a single permanently-pressed tab reads as a broken control,
              and it offers a choice that does not exist. */}
          {venues.length > 1 ? (
          <div className="where-switch" role="group" aria-label="Choose a place">
            {venues.map((v, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setWhich(i)}
                aria-pressed={which === i}
                className={`stagger-${i + 3} where-tab ${which === i ? "is-on" : ""}`}
              >
                <span className="where-tab-label">{v.label}</span>
                {wedding.reveal.times ? (
                  <span className="where-tab-time">{v.time}</span>
                ) : null}
              </button>
            ))}
          </div>
          ) : null}

          {/*
            aria-live, because the switch changes content elsewhere on the
            screen: without it a screen-reader user presses a button and is
            told nothing happened.
          */}
          <div className="where-detail" aria-live="polite">
            {/* Its own box, so a wide-but-short screen can set the words
                beside the map instead of stacking them above it. */}
            <div className="where-text">
              {/* With the switcher gone, this is the only thing naming the
                  event, and "Where" alone does not say which one. */}
              {venues.length > 1 ? null : (
                <p className="stagger-4 where-single-label">{venue.label}</p>
              )}
              <h3 className="stagger-5 where-venue">{venue.venue}</h3>
              {venue.venueMeta ? <p className="stagger-6 where-meta">{venue.venueMeta}</p> : null}
              <p className="stagger-7 where-address">{venue.address}</p>
            </div>

            {/* Google for the map and the place listing, Waze because in the
                Philippines it is what most people actually drive with —
                MapEmbed owns both, including the coordinate handling Waze
                needs. */}
            {/* morph-flat: the map morphs on scale and opacity but skips
                the blur. It is a live Google iframe and the heaviest thing
                on the page — blurring it forces a full readback of its
                compositing every frame, for a softness nobody is looking
                at while they read the address beside it.

                Passed as a className rather than wrapped in a div: a
                wrapper would displace `.where-detail > div:last-child` and
                cost the map its margin reset in landscape. */}
            <MapEmbed
              query={venue.mapsQuery}
              mapsUrl={venue.mapsUrl}
              coords={venue.coords}
              venue={venue.venue}
              compact
              className="stagger-8 morph-flat"
            />
          </div>
        </div>

        <div className="stagger-9 panel-foot">
          <Chair onClick={onAdvance} />
        </div>
      </div>
    </div>
  );
}
