"use client";

import { useEffect, useRef } from "react";
import type { MiniPalette } from "@/lib/catalog";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * CSS wristwatch silhouette with live hands (self-contained, zero WebGL).
 * Palette drives --bez/--dial/etc.; `panda` adds white subdial grids,
 * `half` renders the duotone bezel.
 */
export default function MiniWatch({ p, live = true }: { p: MiniPalette; live?: boolean }) {
  const hm = useRef<HTMLSpanElement>(null);
  const hh = useRef<HTMLSpanElement>(null);
  const hs = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!live) return;
    let raf = 0;
    const tick = () => {
      const d = new Date();
      const ms = d.getMilliseconds();
      const s = d.getSeconds() + ms / 1000;
      const m = d.getMinutes() + s / 60;
      const h = (d.getHours() % 12) + m / 60;
      if (hs.current) hs.current.style.transform = `rotate(${(s / 60) * 360}deg)`;
      if (hm.current) hm.current.style.transform = `rotate(${(m / 60) * 360}deg)`;
      if (hh.current) hh.current.style.transform = `rotate(${(h / 12) * 360}deg)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live]);

  const a = new Date(); // date wheel
  const day = pad(a.getDate());

  return (
    <span
      className="mini"
      data-panda={p.panda || undefined}
      data-half={p.half || undefined}
      style={
        {
          "--bez": p.bez,
          "--bez2": p.bez2 ?? p.bez,
          "--dial": p.dial,
          "--hands": p.hands ?? "#d9dade",
          "--accent": p.accent ?? "#c9a961",
          "--mini-sub": p.sub ?? "transparent",
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <i className="m-lug tl" />
      <i className="m-lug tr" />
      <i className="m-lug bl" />
      <i className="m-lug br" />
      <i className="m-crown" />
      <i className="m-bez" />
      <i className="m-dial">
        {p.half ? <i className="m-halfsplit" /> : null}
        {p.panda ? (
          <>
            <i className="m-sub l" />
            <i className="m-sub r" />
          </>
        ) : null}
        <i className="m-date">{day}</i>
        <span className="h-h" ref={hh} />
        <span className="h-m" ref={hm} />
        <span className="h-s" ref={hs} />
        <i className="h-pip" />
      </i>
    </span>
  );
}
