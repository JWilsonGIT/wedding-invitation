"use client";

import { useEffect, useRef, useState } from "react";
import { wedding, venueIsPublic } from "@/config/wedding";

/*
  The four things a guest clicks to move through the invitation: a sealed
  envelope, a framed photograph, a signpost, and a chair drawn out at the
  table.

  Each is a real <button> with a real label and a caption a guest can read;
  the drawing is decoration layered on top of a control, never a <div> with
  an onClick. That is what keeps the whole invitation keyboard-navigable —
  tab lands on the object, Enter opens the next scene, and a screen reader
  hears "Open the invitation" rather than "graphic".

  All four animate on hover, on focus and on click, with transform and
  opacity only, and every part that moves is named in globals.css so
  `prefers-reduced-motion` can switch the lot off in a single place.
*/

/*
  Every object now plays something before it hands over to the deck, so the
  care the envelope needed is care all four need. It lives here once
  instead of four times:

    • Reduced motion skips the animation and advances at once. The CSS
      kill-switch cannot help, because the WAIT is in JavaScript, not in
      the keyframes — a guest who asked for less motion would otherwise
      sit through the delay staring at a still image.
    • A second click while one is running is ignored, so an eager
      double-click cannot fire two navigations.
    • Timers are cleared on unmount, or a guest who leaves mid-animation
      is navigated by a component that no longer exists.

  The reset fires after the panel is safely off-screen — the morph is
  620ms — so an object is back to its resting state if a guest returns to
  it, rather than snapping back in front of them.
*/
const RESET_GAP = 700;

function useSceneAction(runMs: number) {
  const [active, setActive] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const run = (onClick: () => void) => {
    if (active) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClick();
      return;
    }

    setActive(true);
    timers.current.push(
      window.setTimeout(onClick, runMs),
      window.setTimeout(() => setActive(false), runMs + RESET_GAP),
    );
  };

  return [active, run] as const;
}

function SceneButton({
  onClick,
  label,
  caption,
  hint,
  busy = false,
  children,
}: {
  onClick: () => void;
  /** What a screen reader hears. Says where it goes, not what it looks like. */
  label: string;
  /** The words under the object. A guest should not have to guess. */
  caption: string;
  hint?: string;
  /** Mid-animation. Announced, and the pointer stops inviting another click. */
  busy?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-busy={busy || undefined}
      className="scene-object"
    >
      <span className="scene-object-art" aria-hidden="true">
        {/* Its own element on purpose: the slow idle bob and the hover lift
            would otherwise both be trying to own one transform, and the
            animation would win permanently. */}
        <span className="scene-object-float">{children}</span>
      </span>
      <span className="scene-object-caption">{caption}</span>
      {hint ? <span className="scene-object-hint">{hint}</span> : null}
    </button>
  );
}

/* ── I → II ─────────────────────────────────────────────────────────
  A sealed envelope, monogrammed with the couple's initials — the one place
  on the page their names appear abbreviated. Hovering lifts the flap a
  little, as a hint.

  Clicking it does not jump straight to the next panel: the seal breaks,
  the flap swings back, the card rises out, and only then does the deck
  move. The whole sequence is 860ms — long enough to feel like opening
  something, short enough that a guest who just wants the address is not
  held hostage. Anyone impatient can press the numerals instead.

  Three details that matter more than the drawing:

    • Reduced motion skips the whole thing and advances at once. A guest
      who has asked for less motion should not be made to sit through an
      animation, and the CSS kill-switch cannot help here because the
      WAIT is in JavaScript, not in the keyframes.
    • A second click during the opening is ignored, so an eager
      double-click cannot fire two navigations.
    • The timer is cleared on unmount, or a guest who leaves mid-opening
      would be navigated by a component that no longer exists.
*/
const OPEN_MS = 860;

export function Envelope({ onClick, initials }: { onClick: () => void; initials: string }) {
  const [opening, run] = useSceneAction(OPEN_MS);
  const handleClick = () => run(onClick);

  return (
    <SceneButton
      onClick={handleClick}
      busy={opening}
      label="Open the invitation and see our photos"
      caption="Open the invitation"
      /* No `hint`. It read "or press the right arrow key" and was the only
         place the deck advertised its keyboard shortcut — removed as a
         visual choice. Nothing about the keyboard changed: the envelope is
         a real button, so Tab then Enter still advances, the arrow keys
         still work, and the deck numerals are still focusable. The
         affordance is simply no longer announced. */
    >
      <svg
        viewBox="0 0 132 96"
        className={`scene-envelope ${opening ? "is-opening" : ""}`}
        role="presentation"
      >
        {/* body */}
        <rect x="6" y="20" width="120" height="70" rx="6" className="env-body" />
        {/* the two creases that read as paper rather than a box */}
        <path d="M6 26 66 62 126 26" className="env-crease" />
        <path d="M6 84 48 56M126 84 84 56" className="env-crease-soft" />
        {/* The card inside. Invisible until the envelope opens — it has no
            business being visible on a sealed envelope. */}
        <g className="env-letter">
          <rect x="26" y="30" width="80" height="50" rx="3" className="env-letter-card" />
          <path d="M36 44h60M36 54h60M36 64h38" className="env-letter-lines" />
        </g>

        {/* the flap, hinged along its top edge */}
        <path d="M6 26 66 62 126 26 126 20 66 4 6 20Z" className="env-flap" />
        {/* wax seal */}
        <g className="env-seal">
          <circle cx="66" cy="52" r="15" className="env-seal-wax" />
          <circle cx="66" cy="52" r="15" className="env-seal-ring" />
          <text x="66" y="57.5" textAnchor="middle" className="env-seal-mark">
            {initials}
          </text>
        </g>
      </svg>
    </SceneButton>
  );
}

/* ── II → III ───────────────────────────────────────────────────────
   An arch-topped photograph on a stand. The arch is the invitation's one
   bridal motif, reused here so the object belongs to the page rather than
   looking borrowed from an icon set. */
/* The shutter. Shorter than the envelope's 860ms — that one is the grand
   opening of the invitation and has earned its length; this is a camera
   going off. */
const SHUTTER_MS = 520;

export function PhotoFrame({ onClick }: { onClick: () => void }) {
  const [firing, run] = useSceneAction(SHUTTER_MS);
  return (
    <SceneButton
      onClick={() => run(onClick)}
      busy={firing}
      label="Open the details of the day: the ceremony, the reception, what to wear and gifts"
      caption="The day itself"
      hint="two places, one afternoon"
    >
      <svg
        viewBox="0 0 108 112"
        className={`scene-frame ${firing ? "is-firing" : ""}`}
        role="presentation"
      >
        <g className="frame-tilt">
          {/* arch frame */}
          <path
            d="M16 96V50a38 38 0 0 1 76 0v46a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4Z"
            className="frame-mat"
          />
          {/* the photograph inside it */}
          <path
            d="M25 92V50a29 29 0 0 1 58 0v42a2 2 0 0 1-2 2H27a2 2 0 0 1-2-2Z"
            className="frame-photo"
          />
          {/* two figures, kept to silhouettes — a literal couple at this
              size would read as clip art */}
          <circle cx="46" cy="58" r="6" className="frame-figure" />
          <path d="M38 92V74a8 8 0 0 1 16 0v18Z" className="frame-figure" />
          <circle cx="64" cy="60" r="5.5" className="frame-figure" />
          <path d="M57 92V76a7 7 0 0 1 14 0v16Z" className="frame-figure" />

          {/* A raised arm each, on the OUTSIDE shoulder so the wave has
              somewhere to go — swung inward it would cross the other
              figure and read as one person with four arms.

              Drawn already raised rather than hanging: the animation
              swings the hand, it does not lift the arm, so a guest who
              has asked for less motion still sees two figures waving
              rather than two standing to attention. Each is hinged at its
              own shoulder — see `.frame-arm` in globals.css.

              THE HAND HEIGHTS ARE THE LIMIT, NOT A CHOICE. Raised above
              about y=57 the hand leaves the inner arch, which is a circle
              of radius 29 centred on (54,50) and closes in fast near the
              top: at y=57 it spans x 25.9 to 82.1, and a hand swinging
              9deg either way with a 1.5 round cap reaches 28.1 at its
              furthest. Two units of margin. The right hand sits at x=75
              rather than 76 for the same reason — at 76 it came within
              0.7 of the arch on the outswing.

              The two hands are at different heights because the figures
              are: the left one is the taller of the pair. */}
          <path d="M39 78 33 57" className="frame-arm frame-arm-a" />
          <path d="M70 80 75 59" className="frame-arm frame-arm-b" />
        </g>
        {/* the stand */}
        <path d="M54 100v6M40 108h28" className="frame-stand" />
      </svg>
    </SceneButton>
  );
}

/* ── III → IV ───────────────────────────────────────────────────────
   A signpost with two arms pointing opposite ways — the whole shape of the
   day in one object: two places, and the afternoon spent travelling the
   short distance between them. */
const POINT_MS = 560;

const publicVenues = wedding.events.filter((e) => venueIsPublic(e.id)).length;

export function Signpost({ onClick }: { onClick: () => void }) {
  const [pointing, run] = useSceneAction(POINT_MS);
  return (
    <SceneButton
      onClick={() => run(onClick)}
      busy={pointing}
      label={
        publicVenues === 1
          ? "See where the ceremony is, with a map and directions"
          : "See where the ceremony and the reception are, with maps and directions"
      }
      caption="Getting there"
      /* Only promise the maps that exist. With one venue still withheld
         there is exactly one map behind this, and "both places" sends a
         guest looking for a second one. */
      hint={publicVenues === 1 ? "map and directions" : "maps for both places"}
    >
      <svg
        viewBox="0 0 116 108"
        className={`scene-signpost ${pointing ? "is-pointing" : ""}`}
        role="presentation"
      >
        {/* the post */}
        <path d="M54 26v70" className="sign-post" />
        {/* upper arm, pointing right */}
        <g className="sign-arm sign-arm-a">
          <path d="M50 30h44l10 9-10 9H50Z" className="sign-board" />
          <path d="M58 39h28" className="sign-writing" />
        </g>
        {/* lower arm, pointing left */}
        <g className="sign-arm sign-arm-b">
          <path d="M58 56H22l-10 9 10 9h36Z" className="sign-board" />
          <path d="M30 65h20" className="sign-writing" />
        </g>
        {/* the ground it stands in */}
        <ellipse cx="54" cy="98" rx="20" ry="4.5" className="sign-ground" />
      </svg>
    </SceneButton>
  );
}

/* ── IV → V ─────────────────────────────────────────────────────────
   A chair drawn out from a laid table. This is the one object whose
   meaning the copy already carried: the reply deadline has always read
   "so we can set the table". */
const SEAT_MS = 560;

export function Chair({ onClick }: { onClick: () => void }) {
  const [seating, run] = useSceneAction(SEAT_MS);
  return (
    <SceneButton
      onClick={() => run(onClick)}
      busy={seating}
      label="Reply to the invitation and take your seat"
      caption="Take your seat"
      hint="one seat, reserved in your name"
    >
      <svg
        viewBox="0 0 128 104"
        className={`scene-chair ${seating ? "is-seating" : ""}`}
        role="presentation"
      >
        {/* table edge and cloth, to the left */}
        <path d="M0 46h46v5H0z" className="chair-table" />
        <path d="M4 51h38l-4 30H8Z" className="chair-cloth" />
        {/* a setting on the table — the seat that is waiting */}
        <ellipse cx="24" cy="43" rx="13" ry="4" className="chair-plate" />
        <ellipse cx="24" cy="42" rx="8" ry="2.4" className="chair-plate-inner" />

        {/* the chair, drawn out and turned very slightly toward you */}
        <g className="chair-tilt">
          <path d="M70 34h34a4 4 0 0 1 4 4v26H70a4 4 0 0 1-4-4V38a4 4 0 0 1 4-4Z" className="chair-back" />
          <path d="M74 42h26M74 50h26" className="chair-slat" />
          <path d="M62 64h50a3 3 0 0 1 3 3v4H59a3 3 0 0 1 3-7Z" className="chair-seat" />
          <path d="M64 71v25M112 71v25M70 96h4M108 96h4" className="chair-legs" />
        </g>
      </svg>
    </SceneButton>
  );
}
