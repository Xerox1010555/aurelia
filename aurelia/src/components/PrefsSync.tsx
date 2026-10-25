"use client";

import { useEffect } from "react";
import { useApp, readHashConfig, type isValidConfig } from "@/lib/store";
import { hydration } from "@/lib/hydration";
import type { Lang } from "@/lib/catalog";

/**
 * One-shot client bootstrap:
 * rehydrate persisted prefs → adopt route locale → intake #cfg from URL → done.
 * Document-level `lang/dir/data-theme` attributes are owned by WatchStage so
 * they also apply when WebGL is unavailable.
 */
export default function PrefsSync({ locale }: { locale: Lang }) {
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await useApp.persist.rehydrate();
      } catch {
        /* private mode / storage disabled — defaults stay */
      }
      if (!alive) return;
      const st = useApp.getState();
      const lang: Lang = locale;
      const hc = readHashConfig();
      const patch: Partial<{ lang: Lang; activeModel: string; cfg: typeof st.cfg }> = { lang };
      if (hc) {
        patch.activeModel = hc.modelId;
        patch.cfg = hc.cfg;
      } else if (typeof window !== "undefined" && window.location.hash.length > 8) {
        /* stale/invalid hash — clear it so the UI never advertises a config it ignores */
        try {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        } catch {
          /* ignore */
        }
      }
      useApp.setState(patch);
      useApp.getState().markHydrated();
      hydration.done();
    })();
    return () => {
      alive = false;
    };
  }, [locale]);

  return null;
}
