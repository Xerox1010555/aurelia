/**
 * Smooth inertia scrolling over native scroll (Lenis-style) — legacy `Smooth` port.
 * Only engages on fine pointers with full-motion preference.
 */
import { isFine, prefersReduced } from "@/lib/runtime";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const Smooth = (() => {
  let target = 0;
  let current = 0;
  let rafId: number | null = null;
  let active = false;

  const locked = () => document.body.classList.contains("lock");
  const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  function loop() {
    current += (target - current) * 0.0875;
    if (Math.abs(target - current) < 0.4) {
      current = target;
      window.scrollTo(0, current);
      rafId = null;
      return;
    }
    window.scrollTo(0, current);
    rafId = requestAnimationFrame(loop);
  }
  const kick = () => {
    if (!rafId) rafId = requestAnimationFrame(loop);
  };

  function init() {
    if (!isFine() || prefersReduced()) return;
    active = true;
    target = current = window.scrollY;
    window.addEventListener(
      "wheel",
      (e) => {
        if (locked() || e.ctrlKey || e.metaKey || e.defaultPrevented) return;
        let dy = e.deltaY;
        if (e.deltaMode === 1) dy *= 18;
        else if (e.deltaMode === 2) dy *= window.innerHeight;
        const t = clamp(target + dy, 0, maxScroll());
        if (t === target) return;
        e.preventDefault();
        target = t;
        kick();
      },
      { passive: false }
    );
    window.addEventListener(
      "scroll",
      () => {
        if (!rafId) target = current = window.scrollY;
      },
      { passive: true }
    );
  }

  function scrollTo(y: number) {
    const yy = clamp(y, 0, maxScroll());
    if (!active) {
      window.scrollTo({ top: yy, behavior: prefersReduced() ? "auto" : "smooth" });
      return;
    }
    target = yy;
    kick();
  }

  return { init, scrollTo, isActive: () => active };
})();

export default Smooth;
