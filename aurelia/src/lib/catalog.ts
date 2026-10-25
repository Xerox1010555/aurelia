/**
 * AURELIA catalog — fictional brand, fictional references (legal guardrail:
 * no real-world trademarked model names are used anywhere in this rebuild).
 */

export type Lang = "en" | "ar";
export type Theme = "dark" | "light";
export type CurrencyCode = "USD" | "EGP" | "AED" | "SAR";
export type BezelKind = "dive" | "tachy" | "gmt" | "fluted";
export type OptionGroupKey = "metal" | "dial" | "bezel" | "bracelet";

export interface MetalOption { id: string; price: number }
export interface BraceletOption { id: string; price: number }
export interface DialOption { id: string; hex: string; price: number }
export interface BezelOption { id: string; ceramic?: string; a?: string; b?: string; price: number }
export type BezelSet = BezelOption[];

export interface MiniPalette {
  bez: string;
  bez2?: string;
  dial: string;
  hands?: string;
  accent?: string;
  sub?: string;
  panda?: boolean;
  half?: boolean;
}

export interface WatchModel {
  id: string;
  ref: string;
  basePrice: number;
  name: Record<Lang, string>;
  tagline: Record<Lang, string>;
  bezel: BezelKind;
  bracelet: string;
  dial: string;
  metal: string;
  water: string;
  size: string;
  calibre: string;
  cyclops: boolean;
  subdials: boolean;
  gmt: boolean;
  guards: boolean;
  mini: MiniPalette;
}

export interface Config {
  dial: string;
  bezel: string;
  metal: string;
  bracelet: string;
}

export interface Boutique {
  id: string;
  city: Record<Lang, string>;
  addr: string;
  hours: string;
}

export const METALS: MetalOption[] = [
  { id: "steel", price: 0 },
  { id: "twotone", price: 3400 },
  { id: "gold", price: 5200 },
];

export const BRACELETS: BraceletOption[] = [
  { id: "oyster", price: 0 },
  { id: "jubilee", price: 850 },
];

export const DIALS: DialOption[] = [
  { id: "black", hex: "#0d0e11", price: 0 },
  { id: "champagne", hex: "#d9c49a", price: 0 },
  { id: "green", hex: "#0c3b2a", price: 600 },
  { id: "blue", hex: "#132a52", price: 600 },
  { id: "silver", hex: "#d6d6d0", price: 0 },
  { id: "ivoire", hex: "#efece3", price: 0 },
];

export const BEZEL_SETS: Record<BezelKind, BezelSet> = {
  dive: [
    { id: "black", ceramic: "#0b0e12", price: 0 },
    { id: "green", ceramic: "#0a2f22", price: 700 },
    { id: "blue", ceramic: "#0a1e3d", price: 700 },
  ],
  tachy: [
    { id: "black", ceramic: "#101114", price: 0 },
    { id: "green", ceramic: "#0a2f22", price: 700 },
    { id: "blue", ceramic: "#0a1e3d", price: 700 },
  ],
  gmt: [
    { id: "duplex", a: "#9e1c24", b: "#0b2a5e", price: 0 },
    { id: "blue", a: "#0b2a5e", b: "#0b2a5e", price: 400 },
    { id: "black", a: "#101114", b: "#101114", price: 0 },
  ],
  fluted: [{ id: "gold", price: 0 }],
};

export const LABELS = {
  dials: {
    en: { black: "Noir", champagne: "Champagne", green: "Olive", blue: "Azzurro", silver: "Argent", ivoire: "Ivoire" },
    ar: { black: "أسود", champagne: "شامبانيا", green: "زيتوني", blue: "أزرق", silver: "فضي", ivoire: "عاجي" },
  },
  bezels: {
    en: { black: "Ceramic Noir", green: "Ceramic Green", blue: "Ceramic Blue", duplex: "Duplex", gold: "Fluted" },
    ar: { black: "سيراميك أسود", green: "سيراميك أخضر", blue: "سيراميك أزرق", duplex: "دوبلكس", gold: "محزّز" },
  },
  metals: {
    en: { steel: "Atelier Steel", twotone: "Bicolore", gold: "Yellow Gold" },
    ar: { steel: "فولاذ أتيليه", twotone: "ثنائي اللون", gold: "ذهب أصفر" },
  },
  bracelets: {
    en: { oyster: "Continental", jubilee: "Tressé" },
    ar: { oyster: "كونتيننتال", jubilee: "تريسيه" },
  },
} as const;

export type LabelGroup = keyof typeof LABELS;

/** The four references — AURELIA, an independent house (fictional). */
export const MODELS: WatchModel[] = [
  {
    id: "abyss",
    ref: "AB-300M",
    basePrice: 14250,
    name: { en: "Abyss", ar: "أبيس" },
    tagline: {
      en: "The reference among divers' watches. Born 1953.",
      ar: "المرجع الأول بين ساعات الغوص. وُلدت عام 1953.",
    },
    bezel: "dive",
    bracelet: "oyster",
    dial: "black",
    metal: "steel",
    water: "300m",
    size: "41mm",
    calibre: "Cal. A-31",
    cyclops: true,
    subdials: false,
    gmt: false,
    guards: true,
    mini: { bez: "#101418", bez2: "#1b232c", dial: "#0d0e11", hands: "#d9dade", accent: "#c9a961" },
  },
  {
    id: "corsa",
    ref: "CO-413",
    basePrice: 26800,
    name: { en: "Corsa", ar: "كورسا" },
    tagline: {
      en: "Born for endurance racing. Cosmograph precision.",
      ar: "وُلدت لسباقات التحمل. دقة كوسموغراف.",
    },
    bezel: "tachy",
    bracelet: "oyster",
    dial: "panda",
    metal: "steel",
    water: "100m",
    size: "40mm",
    calibre: "Cal. C-41",
    cyclops: false,
    subdials: true,
    gmt: false,
    guards: false,
    mini: { bez: "#101114", bez2: "#191c22", dial: "#ece9e2", sub: "#141419", hands: "#2a2a30", accent: "#c9a961", panda: true },
  },
  {
    id: "eclat",
    ref: "EC-235",
    basePrice: 15950,
    name: { en: "Éclat", ar: "إيكلا" },
    tagline: {
      en: "The classic watch of reference. Born 1945.",
      ar: "الساعة الكلاسيكية بلا منازع. وُلدت عام 1945.",
    },
    bezel: "fluted",
    bracelet: "jubilee",
    dial: "champagne",
    metal: "twotone",
    water: "100m",
    size: "36mm",
    calibre: "Cal. A-31",
    cyclops: true,
    subdials: false,
    gmt: false,
    guards: false,
    mini: { bez: "#e0bd6d", bez2: "#c9a052", dial: "#d9c49a", hands: "#e6c678", accent: "#8f7434" },
  },
  {
    id: "meridian",
    ref: "MD-285",
    basePrice: 17250,
    name: { en: "Meridian", ar: "ميريديان" },
    tagline: {
      en: "Two time zones, one horizon. The traveller's icon.",
      ar: "منطقتا زمن، وأفقٌ واحد. أيقونة المسافرين.",
    },
    bezel: "gmt",
    bracelet: "oyster",
    dial: "black",
    metal: "steel",
    water: "100m",
    size: "40mm",
    calibre: "Cal. M-28",
    cyclops: true,
    subdials: false,
    gmt: true,
    guards: false,
    mini: { bez: "#9e1c24", bez2: "#0b2a5e", dial: "#0d0e11", hands: "#d9dade", accent: "#c9a961", half: true },
  },
];

export const BOUTIQUES: Boutique[] = [
  { id: "geneva", city: { en: "Geneva", ar: "جنيف" }, addr: "Rue du Rhône 42", hours: "Mon–Sat · 10:00—19:00" },
  { id: "dubai", city: { en: "Dubai", ar: "دبي" }, addr: "The Dubai Mall · Fashion Avenue", hours: "Daily · 10:00—00:00" },
  { id: "cairo", city: { en: "Cairo", ar: "القاهرة" }, addr: "First Mall · New Cairo", hours: "Daily · 11:00—22:00" },
  { id: "riyadh", city: { en: "Riyadh", ar: "الرياض" }, addr: "Kingdom Centre · Level 2", hours: "Daily · 10:00—23:00" },
];

export function modelById(id: string): WatchModel {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}

export function dialById(id: string): DialOption {
  return DIALS.find((d) => d.id === id) ?? DIALS[0];
}

export function bezelOptionFor(model: WatchModel, bezelId: string): BezelOption {
  const set = BEZEL_SETS[model.bezel] ?? BEZEL_SETS.dive;
  return set.find((b) => b.id === bezelId) ?? set[0];
}

export function labelOf(group: LabelGroup, id: string, lang: Lang): string {
  const g = LABELS[group] as Record<Lang, Record<string, string>>;
  return g[lang]?.[id] ?? g.en[id] ?? id;
}

/** Default configuration for a given model. */
export function defaultConfigFor(model: WatchModel): Config {
  return {
    dial: model.dial === "panda" ? "ivoire" : model.dial,
    bezel: (BEZEL_SETS[model.bezel] ?? BEZEL_SETS.dive)[0].id,
    metal: model.metal,
    bracelet: model.bracelet,
  };
}
