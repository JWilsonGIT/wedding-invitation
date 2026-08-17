"use client";

import { useEffect, useRef } from "react";

/**
 * Fades content up as it scrolls into view.
 *
 * Three deliberate choices here:
 *
 * 1. No React state. This is a visual effect driven by an external
 *    observer, so the attribute is set on the node directly. Routing it
 *    through setState would cascade a render for every section on the page.
 *
 * 2. Content starts visible and is only hidden once JS is running, so a
 *    guest with JS blocked — or an old browser without IntersectionObserver
 *    — sees the whole invitation rather than a page of blank space.
 *
 * 3. Anything already on screen at load is left alone. Hiding it and
 *    fading it back in would flash on first paint, and content the guest
 *    can already see has nothing to animate into.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  /** Stagger, in milliseconds. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    // Already in view — leave it be (see note 3 above).
    if (node.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    node.dataset.reveal = "hidden";

    let timer: number | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        timer = window.setTimeout(() => {
          node.dataset.reveal = "shown";
        }, delay);
        observer.disconnect();
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
