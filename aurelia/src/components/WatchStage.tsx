"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Preloader from "@/components/Preloader";
import { useApp } from "@/lib/store";
import { webglAvailable } from "@/lib/runtime";
import { modelById } from "@/lib/catalog";
import { hydration } from "@/lib/hydration";
import { intro } from "@/lib/three/viewState";

type EngineModule = typeof import("@/lib/three/engine");
type BuilderModule = typeof import("@/lib/three/builder");
type ChoreoModule = typeof import("@/lib/three/choreography");

interface Api {
  eng: EngineModule;
  bld: BuilderModule;
  ch: ChoreoModule | null;
  ok: boolean;
}

const syncKey = (m: string, cfg: { dial: string; bezel: string; metal: string; bracelet: string }) =>
  `${m}|${cfg.dial}|${cfg.bezel}|${cfg.metal}|${cfg.bracelet}`;

/**
 * Owns the fixed WebGL stage, the engine lifecycle and all store→engine
 * bridges. Renders behind every section; the Preloader gate sits on top.
 */
export default function WatchStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<Api | null>(null);
  const syncedRef = useRef<string | null>(null);
  const [ready, setReady] = useState<Promise<void> | null>(null);
  const [api, setApi] = useState<Api | null>(null);

  const activeModel = useApp((s) => s.activeModel);
  const cfg = useApp((s) => s.cfg);
  const theme = useApp((s) => s.theme);
  const lang = useApp((s) => s.lang);

  /* boot once */
  useEffect(() => {
    let cancelled = false;
    let resolveReady!: () => void;
    const readyPromise = new Promise<void>((res) => {
      resolveReady = res;
    });
    setReady(readyPromise);

    (async () => {
      await hydration.promise;
      if (cancelled) return;
      const [eng, bld, ch] = await Promise.all([
        import("@/lib/three/engine"),
        import("@/lib/three/builder"),
        import("@/lib/three/choreography"),
      ]);
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) {
        document.documentElement.classList.add("no-webgl");
        setApi({ eng, bld, ch, ok: false });
        resolveReady();
        return;
      }
      const ok = webglAvailable() && eng.initThree(canvas);
      if (!ok) document.documentElement.classList.add("no-webgl");
      if (ok) {
        const st = useApp.getState();
        bld.swapWatch(modelById(st.activeModel), st.cfg, { soft: true });
        syncedRef.current = syncKey(st.activeModel, st.cfg);
        eng.bindInput(document.getElementById("dragZone"));
        eng.resizeThree();
        ch.initChoreography();
      }
      setApi({ eng, bld, ch, ok });
      apiRef.current = { eng, bld, ch, ok };

      try {
        if (document.fonts?.ready) {
          await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
        }
      } catch {
        /* fonts probe failure is non-fatal */
      }
      resolveReady();
    })();

    const onVis = () => {
      const a = apiRef.current;
      if (!a?.ok) return;
      if (document.hidden) a.eng.stopLoop();
      else a.eng.startLoop();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      const a = apiRef.current;
      if (a) {
        a.eng.stopLoop();
        a.ch?.disposeChoreography();
        a.eng.disposeThree();
        apiRef.current = null;
      }
    };
  }, []);

  /* model / config → engine */
  useEffect(() => {
    if (!api?.ok) return;
    const bld = api.bld;
    const next = syncKey(activeModel, cfg);
    if (next === syncedRef.current) return;
    const prevModel = syncedRef.current?.split("|")[0];
    syncedRef.current = next;
    const model = modelById(activeModel);
    if (prevModel !== activeModel) bld.swapWatch(model, cfg, {});
    else bld.applyConfigPatch(model, cfg, true);
  }, [api, activeModel, cfg]);

  /* theme → english/document + scene dim */
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (api?.ok) api.eng.applyThemeToScene(theme);
  }, [api, theme]);

  /* language → document attrs */
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [api, lang]);

  /* store → engine resize bridge */
  useEffect(() => {
    if (!api) return;
    const a = apiRef.current;
    const onResize = () => a?.eng.resizeThree();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [api]);

  /* reveal sequence when the gate finishes */
  const onReveal = useCallback(() => {
    const a = apiRef.current;
    const gl = document.getElementById("gl");
    if (gl) gl.classList.add("on");
    document.getElementById("heroTitle")?.classList.add("revealed");
    if (a?.ok) {
      a.eng.startLoop();
      gsap.to(intro, { s: 1, y: 0, duration: 1.7, ease: "power3.out" });
    }
  }, []);

  return (
    <>
      <canvas id="gl" ref={canvasRef} aria-hidden="true" />
      <div id="dragZone" aria-hidden="true" />
      <Preloader ready={ready} onDone={onReveal} />
    </>
  );
}
