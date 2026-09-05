"use client";

import { PANELS } from "./Deck";

/**
 * The four numerals along the bottom — where you are, and the way to
 * anywhere else.
 *
 * This exists because the pattern this invitation is built on trades
 * engagement for patience: a guided sequence is lovely the first time
 * and infuriating the fourth, when all somebody wants is the address.
 * So the sequence is the invitation and this is the shortcut, and both
 * are always available.
 *
 * Rendered as a real list of buttons with `aria-current`, so a screen
 * reader announces which panel is showing rather than reading four
 * identical numerals. Each button is 44px tall including its padding —
 * the numerals look delicate but the target is not.
 */
export function DeckNav({
  index,
  onJump,
}: {
  index: number;
  onJump: (next: number) => void;
}) {
  return (
    <nav className="deck-nav" aria-label="Invitation sections">
      <ol className="flex items-center gap-1 sm:gap-2">
        {PANELS.map((panel, i) => {
          const current = i === index;
          return (
            <li key={panel.id}>
              <button
                type="button"
                onClick={() => onJump(i)}
                aria-current={current ? "step" : undefined}
                /* The numeral alone would be a poor label — "II" tells a
                   screen-reader user nothing about where it goes. */
                aria-label={`${panel.label} (section ${i + 1} of ${PANELS.length})`}
                className={`deck-nav-dot ${current ? "is-current" : ""}`}
              >
                <span aria-hidden="true" className="deck-nav-numeral">
                  {panel.numeral}
                </span>
                <span aria-hidden="true" className="deck-nav-rule" />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
