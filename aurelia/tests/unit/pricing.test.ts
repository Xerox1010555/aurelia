import { describe, expect, it } from "vitest";
import {
  BEZEL_SETS,
  MODELS,
  defaultConfigFor,
  modelById,
  labelOf,
} from "@/lib/catalog";
import { configPrice, configFingerprint, formatPrice } from "@/lib/pricing";

describe("configPrice", () => {
  it("returns basePrice for an all-zero premium configuration", () => {
    MODELS.forEach((m) => {
      const zero = { dial: "black", bezel: "black", metal: "steel", bracelet: "oyster" };
      expect(configPrice(m, zero)).toBe(m.basePrice);
    });
  });

  it("adds every premium for a maxed configuration", () => {
    const abyss = modelById("abyss");
    const maxed = {
      dial: "green", // +600
      bezel: "green", // +700 (dive)
      metal: "gold", // +5200
      bracelet: "jubilee", // +850
    };
    // 14250 base + 7350 premiums
    expect(configPrice(abyss, maxed)).toBe(21600);
  });

  it("prices the two-tone dress reference with bracelet premium", () => {
    const eclat = modelById("eclat");
    const def = defaultConfigFor(eclat); // twotone +3400, jubilee +850
    expect(configPrice(eclat, def)).toBe(15950 + 3400 + 850);
  });

  it("is invariant to premium ordering (idempotent)", () => {
    const meridian = modelById("meridian");
    const a = configPrice(meridian, { dial: "blue", bezel: "blue", metal: "steel", bracelet: "oyster" });
    const b = configPrice(meridian, { dial: "black", bezel: "blue", metal: "steel", bracelet: "oyster" }) + 600;
    expect(a).toBe(b);
  });
});

describe("configFingerprint", () => {
  it("joins the five identity parts in a stable order", () => {
    expect(configFingerprint("abyss", { dial: "black", bezel: "black", metal: "steel", bracelet: "oyster" })).toBe(
      "abyss|black|black|steel|oyster"
    );
  });

  it("differs for different configurations", () => {
    const a = configFingerprint("abyss", { dial: "black", bezel: "black", metal: "steel", bracelet: "oyster" });
    const b = configFingerprint("abyss", { dial: "blue", bezel: "black", metal: "steel", bracelet: "oyster" });
    expect(a).not.toBe(b);
  });
});

describe("formatPrice", () => {
  it("formats USD with $ symbol", () => {
    expect(formatPrice(14250, "USD")).toBe("$14,250");
  });

  it("converts and rounds EGP with the static table", () => {
    expect(formatPrice(14250, "EGP")).toBe("E£692,550");
  });

  it("converts AED and SAR", () => {
    expect(formatPrice(1000, "AED")).toBe("AED 3,673");
    expect(formatPrice(1000, "SAR")).toBe("SAR 3,750");
  });
});

describe("catalog invariants", () => {
  it("exposes at least one valid bezel per model", () => {
    MODELS.forEach((m) => {
      const set = BEZEL_SETS[m.bezel];
      expect(set.length).toBeGreaterThan(0);
      expect(defaultConfigFor(m).bezel).toBe(set[0].id);
    });
  });

  it("labels fall back to en then the raw id", () => {
    expect(labelOf("dials", "black", "ar")).toBe("أسود");
    expect(labelOf("dials", "black", "en")).toBe("Noir");
    expect(labelOf("dials", "___missing___", "en")).toBe("___missing___");
  });
});
