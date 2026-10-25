import type { CurrencyCode, WatchModel, Config } from "./catalog";
import { METALS, BRACELETS, dialById, bezelOptionFor } from "./catalog";

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  EGP: "E£",
  AED: "AED ",
  SAR: "SAR ",
};

/** Static fallback table — live rates can replace these via fetch (see refreshRates in the legacy port). */
export const CURRENCY_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  EGP: 48.6,
  AED: 3.6725,
  SAR: 3.75,
};

export function formatPrice(usd: number, currency: CurrencyCode): string {
  const rate = CURRENCY_RATES[currency] ?? 1;
  const sym = CURRENCY_SYMBOLS[currency] ?? "$";
  return sym + Math.round(usd * rate).toLocaleString("en-US");
}

/**
 * Base price + option premiums. Mirrors the legacy `configPrice` exactly
 * so the visual demo and future server quote (/api/quote) agree — when the
 * backend lands, the server recompute is authoritative.
 */
export function configPrice(model: WatchModel, cfg: Config): number {
  let price = model.basePrice;
  const metal = METALS.find((m) => m.id === cfg.metal) ?? METALS[0];
  const bracelet = BRACELETS.find((b) => b.id === cfg.bracelet) ?? BRACELETS[0];
  const dial = dialById(cfg.dial);
  const bezel = bezelOptionFor(model, cfg.bezel);
  price += metal.price + bracelet.price + dial.price + (bezel.price ?? 0);
  return price;
}

/** Stable, path-safe identifier for a full configuration (cart dedup + future share URLs). */
export function configFingerprint(modelId: string, cfg: Config): string {
  return [modelId, cfg.dial, cfg.bezel, cfg.metal, cfg.bracelet].join("|");
}
