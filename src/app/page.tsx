import { Deck } from "@/components/deck/Deck";
import { Petals } from "@/components/Petals";

/*
  The whole invitation is one deck of four panels: welcome, photographs,
  the day, the reply. Nothing on this page scrolls — see the SHELL block
  in globals.css — so the order is not "what a guest reads on the way
  down" but "where a guest is taken next".

  Petals stay. They are fixed, time-based and decorative, so they are the
  one piece of the old page that a no-scroll layout does not break; they
  drift over all four panels and tie them together.

  What a scroll-free page had to give up, and why:
    • ScrollPacer, Drift, Reveal, the hero parallax and the gallery's
      tilt-in were all driven by `animation-timeline`, which resolves
      against a scrollport. With nothing to scroll they would freeze at
      their first keyframe — a page of half-faded, half-rotated
      elements — so they are gone rather than merely unused.
    • Nav and Footer were anchor-link furniture for a long page. The
      deck's numerals do that job now, inside the viewport.
*/
export default function Home() {
  return (
    <>
      <Petals />
      <Deck />
    </>
  );
}
