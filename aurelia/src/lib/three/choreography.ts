/**
 * Scroll choreography — direct port of legacy ScrollTrigger wiring.
 * Mutates `view` + `motion.spinTarget`; pure DOM/GSAP, no react state.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isMobile, prefersReduced } from "@/lib/runtime";
import { view, motion, TAU } from "./viewState";

type Pose = Partial<typeof view>;

let disposed = false;

export function initChoreography(): void {
  const $ = (s: string) => document.querySelector(s);
  const $$ = (s: string) => Array.from(document.querySelectorAll(s));
  disposed = false;
  gsap.registerPlugin(ScrollTrigger);

  gsap.to("#heroTitle", {
    opacity: 0,
    y: -90,
    ease: "none",
    scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom 30%", scrub: true },
  });

  const stl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: "#story",
      start: "top bottom",
      end: "bottom bottom",
      scrub: 1.1,
      onUpdate: (self) => {
        const d = document.getElementById("railDot");
        if (d) d.style.transform = "translateY(" + self.progress * 38 + "vh)";
      },
    },
  });
  stl
    .to(view, { rotY: 1.35, rotX: 0.22, camZ: 5.1 }, 0)
    .to(view, { ex: 1, camZ: 4.45, rotY: 2.6 }, 0.2)
    .to(view, { rotY: 3.7 }, 0.44)
    .to(view, { ex: 0, camZ: 5.4, rotY: 5.1 }, 0.6)
    .to(view, { rotY: TAU, rotX: 0, camZ: 6.4 }, 0.84);

  $$(".callout").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 70 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 82%", toggleActions: "play none none reverse" },
      }
    );
  });

  const desktop = !isMobile();
  const pose = (o: Pose) => gsap.to(view, Object.assign({}, o, { duration: 1.25, ease: "power3.inOut", overwrite: "auto" as const }));
  const P_collection: Pose = desktop
    ? { wX: -1.5, wY: 0.05, wScale: 0.95, camZ: 6.2, rotX: 0.04 }
    : { wX: 0, wY: 1.02, wScale: 0.62, camZ: 6.6, rotX: 0.05 };
  const P_config: Pose = desktop
    ? { wX: 1.5, wY: 0, wScale: 1.06, camZ: 5.9, rotX: -0.04 }
    : { wX: 0, wY: 1.05, wScale: 0.6, camZ: 6.6, rotX: -0.04 };
  const P_craft: Pose = desktop
    ? { wX: 0, wY: 0, wScale: 0.8, camZ: 7.4, rotX: 0.1 }
    : { wX: 0, wY: 1.1, wScale: 0.5, camZ: 7.2, rotX: 0.1 };
  const P_rest: Pose = desktop
    ? { wX: 0, wY: 0, wScale: 0.7, camZ: 7.8, rotX: 0.06 }
    : { wX: 0, wY: 1.15, wScale: 0.46, camZ: 7.8, rotX: 0.06 };
  const mk = (sel: string, target: Pose) =>
    ScrollTrigger.create({
      trigger: sel,
      start: "top 62%",
      end: "bottom 38%",
      onEnter: () => {
        motion.spinTarget = 0.03;
        pose(Object.assign({}, target, { rotY: TAU }));
      },
      onEnterBack: () => {
        motion.spinTarget = 0.03;
        pose(Object.assign({}, target, { rotY: TAU }));
      },
    });
  mk("#collection", P_collection);
  mk("#configurator", P_config);
  mk("#craft", P_craft);
  mk("#testimonials", P_rest);
  mk("#boutiques", P_rest);

  ScrollTrigger.create({
    trigger: "#hero",
    start: "top top",
    end: "bottom 40%",
    onEnterBack: () => {
      motion.spinTarget = prefersReduced() ? 0 : 0.22;
      pose({ wX: 0, wY: 0, wScale: 1, camZ: 6.6, rotY: -0.55, rotX: -0.1 });
    },
  });
  ScrollTrigger.create({
    trigger: "#story",
    start: "top bottom",
    end: "bottom bottom",
    onEnter: () => {
      motion.spinTarget = prefersReduced() ? 0 : 0.34;
    },
    onLeave: () => {
      motion.spinTarget = 0.03;
    },
    onEnterBack: () => {
      motion.spinTarget = prefersReduced() ? 0 : 0.34;
    },
    onLeaveBack: () => {
      motion.spinTarget = prefersReduced() ? 0 : 0.22;
    },
  });

  ScrollTrigger.create({
    trigger: "#footer",
    start: "top 85%",
    onEnter: () => gsap.to("#gl", { opacity: 0.16, duration: 0.8 }),
    onLeaveBack: () => gsap.to("#gl", { opacity: 1, duration: 0.8 }),
  });

  ScrollTrigger.batch(".rv", {
    start: "top 88%",
    onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 0.9, stagger: 0.09, ease: "power3.out", overwrite: true }),
  });

  $$(".h2 .li").forEach((el) => {
    gsap.set(el, { yPercent: 115 });
    gsap.to(el, {
      yPercent: 0,
      duration: 1.1,
      ease: "power4.out",
      scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" },
    });
  });

  $$(".c-val").forEach((el) => {
    const num = el.querySelector("span");
    const to = parseFloat(el.getAttribute("data-to") ?? "0") || 0;
    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => {
        const o = { v: 0 };
        gsap.to(o, {
          v: to,
          duration: 1.8,
          ease: "power2.out",
          onUpdate: () => {
            if (num) num.textContent = String(Math.round(o.v));
          },
        });
      },
    });
  });

  ["collection", "configurator", "craft", "boutiques"].forEach((id) => {
    ScrollTrigger.create({
      trigger: "#" + id,
      start: "top 55%",
      end: "bottom 45%",
      onToggle: (self) => {
        $$(".nav-links a").forEach((a) => {
          if (a.getAttribute("href") === "#" + id) a.classList.toggle("active", self.isActive);
        });
      },
    });
  });

  /* headline line-masks start hidden until the hero reveal flips the class */
  /* (no gsap.set here — CSS owns the initial hidden state so the reveal is compositor-safe) */
}

export function disposeChoreography(): void {
  if (disposed) return;
  disposed = true;
  ScrollTrigger.getAll().forEach((t) => t.kill());
  gsap.globalTimeline.clear();
}
