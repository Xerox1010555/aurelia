"use client";

import { useEffect, useRef } from "react";
import { isFine } from "@/lib/runtime";

/** Gold cursor halo + dot with magnetic attraction to `[data-magnetic]`. */
export default function Cursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFine()) return;
    const cursor = cursorRef.current;
    const dot = dotRef.current;
    if (!cursor || !dot) return;
    document.documentElement.classList.add("has-cursor");

    let cx = -100;
    let cy = -100;
    let dx = -100;
    let dy = -100;
    let tx = -100;
    let ty = -100;
    let raf = 0;
    let running = true;

    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      const t = e.target as HTMLElement | null;
      const hot = t?.closest?.("a, button, .chip, input, [data-cursor]");
      cursor.classList.toggle("grow", Boolean(hot));
      const mag = t?.closest?.("[data-magnetic]") as HTMLElement | null;
      if (mag) {
        const r = mag.getBoundingClientRect();
        const mx = (e.clientX - (r.left + r.width / 2)) * 0.18;
        const my = (e.clientY - (r.top + r.height / 2)) * 0.18;
        mag.style.transform = `translate(${mx}px, ${my}px)`;
      } else {
        document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
          el.style.transform = "";
        });
      }
    };

    const loop = () => {
      dx += (tx - dx) * 0.35;
      dy += (ty - dy) * 0.35;
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      dot.style.transform = `translate(${dx}px, ${dy}px)`;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      if (running) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        el.style.transform = "";
      });
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <>
      <div id="cursor" ref={cursorRef} aria-hidden="true" />
      <div id="cursorDot" ref={dotRef} aria-hidden="true" />
    </>
  );
}
