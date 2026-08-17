"use client";

import { useEffect } from "react";

/**
 * Paces the page so a guest reads the invitation instead of flicking past it.
 *
 * A wheel flick can travel thousands of pixels in a moment. This holds a
 * target position and walks the real scroll toward it at a fixed speed, so
 * however hard someone spins the wheel the page still advances at a readable
 * rate — and the groom's walk, which is bound to scroll, is actually seen.
 *
 * ── WHAT IS DELIBERATELY LEFT ALONE ──────────────────────────────────────
 *
 * Touch is NOT intercepted. Damping touch means `touch-action: none` and
 * re-implementing momentum by hand: it breaks pull-to-refresh, fights the
 * platform's own physics, and feels broken on a phone in a way no amount of
 * tuning fixes. Flicks on mobile stay native.
 *
 * Keyboard, scrollbar dragging and find-in-page are NOT intercepted either.
 * Those are deliberate acts by someone who knows where they want to be, and
 * capturing them is how paced scrolling turns into a trap — particularly for
 * anyone using the keyboard to reach the RSVP form. The target resyncs
 * whenever the page moves by those means, so nothing snaps back afterwards.
 *
 * Guests who ask their system for reduced motion get native scrolling: the
 * smoothing IS the motion here, so there is nothing to soften.
 */

/** Pixels per second. The one number to change if the pace feels wrong. */
const MAX_SPEED = 1000;

/**
 * How far ahead a flick may queue up, in viewport heights. Without this a
 * violent scroll banks several seconds of travel and the page keeps gliding
 * long after the guest has stopped — which feels broken rather than gentle.
 */
const MAX_LOOKAHEAD = 1.1;

/** Distance over which the last stretch eases, so it settles instead of stopping dead. */
const SETTLE_PX = 120;

export function ScrollPacer() {
  useEffect(() => {
    // No wheel to pace on a touch device, and reduced motion means native.
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let target = window.scrollY;
    let frame: number | null = null;
    let lastTime = 0;
    let running = false;
    /**
     * When the loop last did any work. This backs a watchdog, and it earns its
     * keep: the wheel handler calls preventDefault and hands all scrolling to
     * the animation loop, so if that loop ever stops — a thrown frame, a
     * throttled timer — the page would be permanently unscrollable by wheel
     * with no way for a guest to recover. If a frame has not run recently, the
     * handler stands down and lets the browser scroll natively instead.
     */
    let lastFrameAt = 0;
    const WATCHDOG_MS = 250;
    /**
     * Set once a stall is seen, and never cleared. Standing down for a single
     * event is not enough: the next wheel would start the loop again, stall
     * again, and the guest would get every other event swallowed — a page that
     * scrolls at half rate feels more broken than one that simply scrolls. If
     * the loop cannot run here, give up on pacing altogether.
     */
    let surrendered = false;

    const maxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const clamp = (value: number) => Math.min(maxScroll(), Math.max(0, value));

    const step = (now: number) => {
      lastFrameAt = now;
      if (!lastTime) lastTime = now;
      // Cap dt so returning to a backgrounded tab does not jump the page.
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const current = window.scrollY;
      const diff = target - current;

      if (Math.abs(diff) < 0.5) {
        running = false;
        frame = null;
        lastTime = 0;
        return;
      }

      // Constant speed, tapering only across the final SETTLE_PX.
      const taper = Math.min(1, Math.abs(diff) / SETTLE_PX);
      const distance = Math.min(Math.abs(diff), MAX_SPEED * dt * taper + 0.5);

      window.scrollTo({
        top: current + Math.sign(diff) * distance,
        // `instant` matters: globals.css sets `scroll-behavior: smooth`, and
        // without this every frame would start its own smooth scroll and the
        // page would crawl.
        behavior: "instant",
      });

      frame = requestAnimationFrame(step);
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTime = 0;
      lastFrameAt = performance.now();
      frame = requestAnimationFrame(step);
    };

    /** True if the loop claims to be running but has clearly stalled. */
    const loopStalled = () =>
      running && performance.now() - lastFrameAt > WATCHDOG_MS;

    /** Is something under the cursor scrolling on its own? Then leave it be. */
    const scrollsInternally = (node: EventTarget | null, delta: number) => {
      let element = node instanceof HTMLElement ? node : null;
      while (element && element !== document.body && element !== document.documentElement) {
        const overflowY = getComputedStyle(element).overflowY;
        if (
          (overflowY === "auto" || overflowY === "scroll") &&
          element.scrollHeight > element.clientHeight
        ) {
          const atTop = element.scrollTop <= 0;
          const atBottom =
            element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
          if ((delta < 0 && !atTop) || (delta > 0 && !atBottom)) return true;
        }
        element = element.parentElement;
      }
      return false;
    };

    const onWheel = (event: WheelEvent) => {
      if (surrendered) return;
      // ctrl+wheel is pinch zoom; never touch it.
      if (event.ctrlKey || event.metaKey) return;

      // Normalise: some mice report lines or pages rather than pixels.
      const delta =
        event.deltaMode === 1
          ? event.deltaY * 16
          : event.deltaMode === 2
            ? event.deltaY * window.innerHeight
            : event.deltaY;

      if (delta === 0) return;
      if (scrollsInternally(event.target, delta)) return;

      // Loop has stalled — hand scrolling back to the browser for good rather
      // than swallowing events and leaving the page stuck or half-responsive.
      if (loopStalled()) {
        surrendered = true;
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null;
        running = false;
        lastTime = 0;
        target = window.scrollY;
        return;
      }

      event.preventDefault();

      const lookahead = window.innerHeight * MAX_LOOKAHEAD;
      const from = running ? target : window.scrollY;
      target = clamp(
        Math.min(
          window.scrollY + lookahead,
          Math.max(window.scrollY - lookahead, from + delta),
        ),
      );
      start();
    };

    // Keep in step with scrolling we did not cause — keyboard, scrollbar,
    // anchor links, find-in-page — so the next wheel tick does not snap back.
    const onScroll = () => {
      if (!running) target = window.scrollY;
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
