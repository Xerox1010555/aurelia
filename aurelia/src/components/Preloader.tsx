"use client";

import { useEffect, useRef } from "react";

const C = 2 * Math.PI * 42;
const HOLD_PCT = 88;
const HOLD_MS = 1400;

/**
 * Entering-the-atelier gate. Deliberately gsap-free and rAF-free in its
 * finishing path: progress runs on a small interval loop and the exit uses a
 * CSS transition + class, so the gate can NEVER strand a visitor — not under
 * throttling, occlusion, or a suspended timer environment.
 * `ready` resolves once the scene took its first paint (or 3D unavailable).
 */
export default function Preloader({ ready, onDone }: { ready: Promise<void> | null; onDone: () => void }) {
  const numRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<SVGCircleElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const root = rootRef.current;
    const num = numRef.current;
    const arc = arcRef.current;
    if (!root || !num || !arc) return;

    arc.style.strokeDasharray = String(C);
    const start = Date.now();
    let cancelled = false;
    let finished = false;
    let readyArrived = false;

    const paint = (p: number) => {
      const clamped = Math.min(100, Math.max(0, p));
      num.textContent = String(Math.round(clamped));
      arc.style.strokeDashoffset = String(C * (1 - clamped / 100));
    };
    paint(0);

    const finish = () => {
      if (finished || cancelled) return;
      finished = true;
      paint(100);
      /* CSS exit — compositor-driven, survives rAF suspension */
      root.classList.add("pl-out");
      window.setTimeout(() => {
        if (cancelled) return;
        root.style.display = "none";
        try {
          doneRef.current();
        } catch {
          /* reveal handler failure must not trap the gate */
        }
      }, 900);
    };

    /* smooth-ish progress: 60 ms interval keeps advancing even when rAF is suspended;
       Date.now() (not performance.now) so frozen paint clocks can't stall the gate */
    const iv = window.setInterval(() => {
      if (cancelled || finished) return;
      const elapsed = Date.now() - start;
      const target = elapsed >= HOLD_MS ? HOLD_PCT : (elapsed / HOLD_MS) * HOLD_PCT;
      paint(target);
      if (readyArrived && elapsed >= HOLD_MS * 0.6) finish();
    }, 60);

    const pending = ready ?? Promise.resolve();
    pending
      .then(() => {
        readyArrived = true;
      })
      .catch(() => {
        readyArrived = true;
      });
    /* hard cap — never trap a visitor behind the gate */
    const cap = window.setTimeout(finish, 4800);

    return () => {
      cancelled = true;
      window.clearInterval(iv);
      window.clearTimeout(cap);
    };
  }, [ready]);

  return (
    <div id="preloader" ref={rootRef} role="status" aria-label="Loading">
      <div className="pl-box">
        <svg className="pl-svg" viewBox="0 0 100 100" aria-hidden="true">
          <circle className="pl-bg" cx="50" cy="50" r="42" fill="none" />
          <circle className="pl-c" ref={arcRef} cx="50" cy="50" r="42" fill="none" />
        </svg>
        <div className="pl-num" ref={numRef}>
          0
        </div>
        <div className="pl-lbl">ENTERING THE ATELIER</div>
      </div>
    </div>
  );
}
