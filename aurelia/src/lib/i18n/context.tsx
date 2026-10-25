"use client";

import { createContext, useContext, useMemo } from "react";
import type { Lang } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import { translate } from "@/lib/i18n/dictionaries";
import { labelOf, type LabelGroup } from "@/lib/catalog";

/**
 * Locale-aware i18n. During SSR and the first client render the `locale`
 * from the route wins (perfect hydration match); after the store rehydrates
 * the persisted preference takes over — identical value, since PrefsSync
 * adopts the route locale into the store.
 */
const LangCtx = createContext<Lang>("en");

export function LangProvider({ locale, children }: { locale: Lang; children: React.ReactNode }) {
  return <LangCtx.Provider value={locale}>{children}</LangCtx.Provider>;
}

export function useLang(): Lang {
  const routeLang = useContext(LangCtx);
  const hydrated = useApp((s) => s.hydrated);
  const storeLang = useApp((s) => s.lang);
  return hydrated ? storeLang : routeLang;
}

export function useT() {
  const lang = useLang();
  return useMemo(
    () => ({
      lang,
      t: (key: string) => translate(lang, key),
      /** Trusted static markup from the repo dictionary (contains <em> only). */
      tHtml: (key: string) => ({ __html: translate(lang, key) }),
      label: (group: LabelGroup, id: string) => labelOf(group, id, lang),
      isAr: lang === "ar",
    }),
    [lang]
  );
}
