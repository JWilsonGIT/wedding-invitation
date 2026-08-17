import type { CSSProperties } from "react";

/**
 * Lifts content out of depth as it scrolls into view.
 *
 * A server component with no JavaScript in it at all — the motion is a
 * native CSS scroll-driven animation (see `.reveal-3d` in globals.css).
 * That is a real upgrade on the IntersectionObserver version this
 * replaced: nothing ships to the browser, nothing hydrates, the animation
 * runs on the compositor rather than the main thread, and progress is
 * bound to scroll position so it tracks a finger and reverses on the way
 * back up.
 *
 * Guests on a browser without scroll-driven animations, or with reduced
 * motion requested, simply see the finished page.
 */
export function Reveal({
  children,
  stagger = 0,
  className = "",
}: {
  children: React.ReactNode;
  /**
   * Position in a group, 0-based. Shifts this item's scroll range so cards
   * sharing a row arrive one after another instead of in lockstep.
   */
  stagger?: number;
  className?: string;
}) {
  return (
    <div
      className={`reveal-3d ${className}`}
      style={
        {
          "--reveal-from": `${4 + stagger * 8}%`,
          "--reveal-to": `${80 + stagger * 8}%`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
