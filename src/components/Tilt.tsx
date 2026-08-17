"use client";

import { useCallback, useRef } from "react";

/**
 * Tilts its child toward the cursor, with a highlight that follows.
 *
 * The pointer handler writes CSS custom properties straight onto the node
 * and never touches React state. A mouse move can fire 100+ times a second;
 * routing that through setState would re-render the subtree every frame for
 * an effect the compositor can do on its own.
 *
 * All the styling lives in `.tilt` / `.tilt-sheen` in globals.css, behind
 * `hover: hover`, `pointer: fine` and `prefers-reduced-motion`. This
 * component only supplies numbers — so on a phone, or for a guest who has
 * asked for less motion, these properties are simply never read.
 */
export function Tilt({
  children,
  className = "",
  /** Maximum rotation in degrees at the card's corners. */
  max = 6,
  /** How far the card rises toward the viewer, in pixels. */
  lift = 6,
  /** Adds the cursor-following highlight. Needs a positioned child. */
  sheen = true,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  lift?: number;
  sheen?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const latest = useRef({ x: 0, y: 0 });

  const handleMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const node = ref.current;
      if (!node) return;

      // Keep the newest position, then coalesce to one style write per frame.
      // Storing it separately matters: pointer events outpace the display, and
      // a plain "skip if already scheduled" guard would render the *first*
      // position of each frame and quietly lag behind the cursor.
      latest.current = { x: event.clientX, y: event.clientY };
      if (frame.current !== null) return;

      frame.current = window.requestAnimationFrame(() => {
        frame.current = null;
        const rect = node.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const x = (latest.current.x - rect.left) / rect.width; // 0 → 1
        const y = (latest.current.y - rect.top) / rect.height;

        node.style.setProperty("--tilt-ry", `${(x - 0.5) * 2 * max}deg`);
        // Negated: pushing the cursor down should tip the card's top toward you.
        node.style.setProperty("--tilt-rx", `${-(y - 0.5) * 2 * max}deg`);
        node.style.setProperty("--tilt-lift", `${-lift}px`);
        node.style.setProperty("--glare-x", `${x * 100}%`);
        node.style.setProperty("--glare-y", `${y * 100}%`);
      });
    },
    [max, lift],
  );

  const handleLeave = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    if (frame.current !== null) {
      window.cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    node.style.setProperty("--tilt-ry", "0deg");
    node.style.setProperty("--tilt-rx", "0deg");
    node.style.setProperty("--tilt-lift", "0px");
  }, []);

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`tilt ${sheen ? "tilt-sheen" : ""} relative ${className}`}
    >
      {children}
    </div>
  );
}
