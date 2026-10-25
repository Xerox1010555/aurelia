"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Config, CurrencyCode, Lang, OptionGroupKey, Theme } from "@/lib/catalog";
import { BEZEL_SETS, defaultConfigFor, modelById } from "@/lib/catalog";
import { configFingerprint, configPrice } from "@/lib/pricing";

export interface CartLine {
  key: string;
  modelId: string;
  cfg: Config;
  unitPrice: number;
  qty: number;
}

interface AppState {
  lang: Lang;
  currency: CurrencyCode;
  theme: Theme;
  activeModel: string;
  cfg: Config;
  cart: CartLine[];
  menuOpen: boolean;
  cartOpen: boolean;
  checkoutOpen: boolean;
  toast: string;
  toastSeq: number;
  hydrated: boolean;

  markHydrated(): void;
  setLang(lang: Lang): void;
  setCurrency(c: CurrencyCode): void;
  setTheme(t: Theme): void;
  selectModel(id: string): void;
  setOption(group: OptionGroupKey, id: string): void;
  addToCart(modelId: string, cfg: Config, announce?: boolean): void;
  changeQty(key: string, delta: number): void;
  removeFromCart(key: string): void;
  clearCart(): void;
  setMenuOpen(open: boolean): void;
  setCartOpen(open: boolean): void;
  setCheckoutOpen(open: boolean): void;
  showToast(msg: string): void;
}

export const clampQty = (n: number) => Math.max(1, Math.min(9, n));

function syncHash(model: string, cfg: Config) {
  if (typeof window === "undefined") return;
  try {
    const h =
      "#" +
      new URLSearchParams({
        model,
        dial: cfg.dial,
        bezel: cfg.bezel,
        metal: cfg.metal,
        bracelet: cfg.bracelet,
      }).toString();
    if (window.location.hash !== h) {
      window.history.replaceState(null, "", h);
    }
  } catch {
    /* history API unavailable */
  }
}

/** Validate a configuration coming from a shared URL hash against the catalog. */
export function isValidConfig(modelId: string, cfg: Partial<Config> | null): cfg is Config {
  if (!cfg) return false;
  const model = modelById(modelId);
  const set = BEZEL_SETS[model.bezel] ?? [];
  return (
    Boolean(cfg.metal && ["steel", "twotone", "gold"].includes(cfg.metal)) &&
    Boolean(cfg.dial && ["black", "champagne", "green", "blue", "silver", "ivoire"].includes(cfg.dial)) &&
    Boolean(cfg.bracelet && ["oyster", "jubilee"].includes(cfg.bracelet)) &&
    Boolean(cfg.bezel && set.some((b) => b.id === cfg.bezel))
  );
}

/** Read `#model=…&dial=…&bezel=…&metal=…&bracelet=…`; returns null when absent/invalid. */
export function readHashConfig(): { modelId: string; cfg: Config } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = (window.location.hash || "").slice(1);
    if (!raw || raw.length < 10) return null;
    const q = new URLSearchParams(raw);
    const modelId = q.get("model");
    if (!modelId) return null;
    const cfg: Partial<Config> = {
      dial: q.get("dial") ?? undefined,
      bezel: q.get("bezel") ?? undefined,
      metal: q.get("metal") ?? undefined,
      bracelet: q.get("bracelet") ?? undefined,
    };
    if (!isValidConfig(modelId, cfg)) return null;
    return { modelId, cfg };
  } catch {
    return null;
  }
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      lang: "en",
      currency: "USD",
      theme: "dark",
      activeModel: "abyss",
      cfg: defaultConfigFor(modelById("abyss")),
      cart: [],
      menuOpen: false,
      cartOpen: false,
      checkoutOpen: false,
      toast: "",
      toastSeq: 0,
      hydrated: false,

      markHydrated: () => set({ hydrated: true }),

      setLang: (lang) => set({ lang }),

      setCurrency: (currency) => set({ currency }),

      setTheme: (theme) => set({ theme }),

      selectModel: (id) => {
        const { activeModel } = get();
        if (activeModel === id) return;
        const cfg = defaultConfigFor(modelById(id));
        set({ activeModel: id, cfg });
        syncHash(id, cfg);
      },

      setOption: (group, id) => {
        const { activeModel, cfg } = get();
        if (group === "bezel") {
          const set = BEZEL_SETS[modelById(activeModel).bezel];
          if (!set || !set.some((b) => b.id === id)) return;
        }
        const next = { ...cfg, [group]: id } as Config;
        set({ cfg: next });
        syncHash(activeModel, next);
      },

      addToCart: (modelId, cfg, announce = false) => {
        const key = configFingerprint(modelId, cfg);
        const unitPrice = configPrice(modelById(modelId), cfg);
        const cart = [...get().cart];
        const found = cart.find((it) => it.key === key);
        if (found) {
          found.qty = clampQty(found.qty + 1);
        } else {
          cart.push({ key, modelId, cfg: { ...cfg }, unitPrice, qty: 1 });
          if (cart.length > 24) cart.shift();
        }
        set({ cart, ...(announce ? { toast: "toast.added", toastSeq: get().toastSeq + 1 } : {}) });
      },

      changeQty: (key, delta) => {
        const cart = get()
          .cart.map((it) => (it.key === key ? { ...it, qty: clampQty(it.qty + delta) } : it))
          .filter((it) => it.qty > 0);
        set({ cart });
      },

      removeFromCart: (key) => set({ cart: get().cart.filter((it) => it.key !== key) }),

      clearCart: () => set({ cart: [] }),

      setMenuOpen: (menuOpen) => set({ menuOpen }),
      setCartOpen: (cartOpen) => set({ cartOpen }),
      setCheckoutOpen: (checkoutOpen) => set({ checkoutOpen }),

      showToast: (msg) => set({ toast: msg, toastSeq: get().toastSeq + 1 }),
    }),
    {
      name: "aurelia:prefs-v2",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        lang: s.lang,
        currency: s.currency,
        theme: s.theme,
        activeModel: s.activeModel,
        cfg: s.cfg,
        cart: s.cart,
      }),
    }
  )
);
