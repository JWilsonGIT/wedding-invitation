"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { PanelWelcome } from "./PanelWelcome";
import { PanelPhotos } from "./PanelPhotos";
import { PanelDetails } from "./PanelDetails";
import { PanelWhere } from "./PanelWhere";
import { PanelRsvp } from "./PanelRsvp";
import { DeckNav } from "./DeckNav";

/*
  ═══════════════════════════════════════════════════════════════════
  THE DECK — four panels, no scrolling anywhere

  The whole invitation is one viewport wide and one viewport tall. The
  four panels sit in a row on a track four times that wide, and moving
  between them is a single `transform` on the track. Nothing scrolls;
  `html, body { overflow: hidden }` in globals.css makes sure of it.

  A guest advances by clicking the thematic object in each scene — the
  sealed envelope, the framed photograph, the chair drawn out at the
  table. Each object is a real <button>, so it is reachable by keyboard
  and announced by a screen reader; the drawing is decoration layered
  on top of a proper control, never a div pretending to be one.

  THREE THINGS THAT ARE EASY TO GET WRONG HERE, AND ARE HANDLED:

    • The URL. A deck that keeps one URL for four screens cannot be
      shared or bookmarked, and eats the back button. Each panel owns a
      hash and every move is a pushState, so back/forward walk the deck
      and #details can be sent straight to a guest.

    • Focus. Moving a panel with `transform` does not move focus, so a
      keyboard guest would be left tabbing around a screen they can no
      longer see. On every change focus moves to the arriving panel, and
      the three panels that are off-screen are `inert` — untabbable,
      invisible to screen readers, genuinely inactive rather than merely
      out of sight.

    • Impatience. Nobody should have to click through three scenes to
      find the address. The numerals at the bottom jump straight to any
      panel, which is also what makes this an invitation rather than a
      slideshow a guest has to sit through.
  ═══════════════════════════════════════════════════════════════════ */

export const PANELS = [
  { id: "welcome", numeral: "I", label: "Welcome" },
  { id: "photos", numeral: "II", label: "Photographs" },
  { id: "details", numeral: "III", label: "The Day" },
  { id: "where", numeral: "IV", label: "Where" },
  { id: "rsvp", numeral: "V", label: "Reply" },
] as const;

const indexFromHash = (hash: string) => {
  const found = PANELS.findIndex((p) => p.id === hash.replace(/^#/, ""));
  return found === -1 ? 0 : found;
};

/*
  ── The URL *is* the state ───────────────────────────────────────────
  Which panel is showing lives in `location.hash`, not in React. That is
  what makes back/forward and a shared #details link work without a
  second source of truth to keep in sync — so it is read through
  useSyncExternalStore rather than mirrored into useState.

  `pushState` does not fire `popstate` (only the user pressing back
  does), so `navigate` notifies subscribers itself.
*/
let listeners: (() => void)[] = [];

function subscribe(onChange: () => void) {
  listeners = [...listeners, onChange];
  window.addEventListener("popstate", onChange);
  window.addEventListener("hashchange", onChange);
  return () => {
    listeners = listeners.filter((l) => l !== onChange);
    window.removeEventListener("popstate", onChange);
    window.removeEventListener("hashchange", onChange);
  };
}

const getSnapshot = () => indexFromHash(window.location.hash);
/* The server has no location, so it always renders the first panel and
   hydration corrects it — an instant cut, since the slide transition is
   not armed until after the first paint. */
const getServerSnapshot = () => 0;

function navigate(id: string) {
  /*
    Set the entrance direction BEFORE the pushState that triggers the
    re-render. The keyframe reads --enter-scale when the animation starts,
    so setting it afterwards would be one frame too late and the content
    would settle the wrong way.

    Nothing travels any more, so direction rides the scale instead:
    forward, content settles DOWN into place from very slightly too big;
    back, it grows up into place from very slightly too small.

    Only navigations the invitation itself initiates are covered — every
    object, every numeral. Browser back/forward keeps whatever direction
    was last set, which is a small inconsistency and not worth a second
    source of truth to fix.
  */
  const from = indexFromHash(window.location.hash);
  const to = PANELS.findIndex((p) => p.id === id);
  /* setProperty, not setAttribute("style", ...) — the latter replaces the
     whole inline style block, so it would silently drop anything else ever
     set on the deck. */
  document
    .querySelector<HTMLElement>(".deck")
    ?.style.setProperty("--enter-scale", to >= from ? "1.024" : "0.976");

  window.history.pushState({ panel: id }, "", `#${id}`);
  listeners.forEach((l) => l());
}

export function Deck() {
  const index = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  /* Focus must not be stolen on load — only on a move a guest made. */
  const firstRun = useRef(true);

  const go = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(PANELS.length - 1, next));
    if (clamped === indexFromHash(window.location.hash)) return;
    navigate(PANELS[clamped].id);
  }, []);

  /* Arm the slide only after the first paint, so landing on a shared
     #details link looks like arriving rather than being flung three
     panels sideways. Done by class, not state — there is nothing here
     React needs to re-render for.

     A timer rather than requestAnimationFrame: rAF does not run while the
     tab is hidden, so a guest who opens the invitation in a background
     tab would come back to a deck that never slides at all. Timers still
     fire there, just throttled. */
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const id = window.setTimeout(() => el.classList.add("is-ready"), 60);
    return () => window.clearTimeout(id);
  }, []);

  /* ── Focus follows the panel ─────────────────────────────────── */
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    /* preventScroll matters: the document must never scroll, and focusing
       a region is exactly the kind of thing that would nudge it. */
    panelRefs.current[index]?.focus({ preventScroll: true });
  }, [index]);

  /* ── Keyboard: the deck is a horizontal sequence, so arrows ──── */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      /* Never hijack arrows while someone is typing their name. */
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      ) {
        return;
      }
      if (event.key === "ArrowRight" || event.key === "PageDown") go(index + 1);
      if (event.key === "ArrowLeft" || event.key === "PageUp") go(index - 1);
      if (event.key === "Home") go(0);
      if (event.key === "End") go(PANELS.length - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go]);

  const panels = [
    <PanelWelcome key="welcome" onAdvance={() => go(1)} active={index === 0} />,
    <PanelPhotos key="photos" onAdvance={() => go(2)} active={index === 1} />,
    <PanelDetails key="details" onAdvance={() => go(3)} active={index === 2} />,
    <PanelWhere key="where" onAdvance={() => go(4)} active={index === 3} />,
    <PanelRsvp key="rsvp" active={index === 4} />,
  ];

  return (
    <div className="deck">
      {/* The track no longer moves — it is the surface the panels are
          stacked on. is-ready still arms the morph after the first paint. */}
      <div ref={trackRef} className="deck-track">
        {PANELS.map((panel, i) => (
          <section
            key={panel.id}
            id={panel.id}
            ref={(node) => {
              panelRefs.current[i] = node;
            }}
            tabIndex={-1}
            aria-label={`${panel.label} — panel ${i + 1} of ${PANELS.length}`}
            /* inert, not just hidden: an off-screen panel must not be
               tabbable, searchable, or readable by a screen reader. */
            inert={i !== index}
            className={`deck-panel ${i === index ? "is-current" : ""}`}
          >
            {panels[i]}
          </section>
        ))}
      </div>

      <DeckNav index={index} onJump={go} />
    </div>
  );
}
