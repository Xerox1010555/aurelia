/**
 * Watch Builder I — canvas textures & materials.
 * Watch space: dial normal = +Z · 12 o'clock = +Y · crown = +X.
 */
import * as THREE from "three";
import type { Config, WatchModel } from "@/lib/catalog";
import { BEZEL_SETS, DIALS, dialById, bezelOptionFor } from "@/lib/catalog";
import { S3 } from "./s3";
import { TAU } from "./viewState";

const GOLD = 0xe2b96b;
const STEEL = 0xd7d8dc;

function roundRectPath(x: CanvasRenderingContext2D, a: number, b: number, w: number, h: number, r: number): void {
  x.beginPath();
  x.moveTo(a + r, b);
  x.arcTo(a + w, b, a + w, b + h, r);
  x.arcTo(a + w, b + h, a, b + h, r);
  x.arcTo(a, b + h, a, b, r);
  x.arcTo(a, b, a + w, b, r);
  x.closePath();
}

function spacedText(
  x: CanvasRenderingContext2D,
  str: string,
  cx: number,
  y: number,
  font: string,
  sp: number
): void {
  x.font = font;
  const ws: number[] = [];
  let w = 0;
  for (const ch of str) {
    const cw = x.measureText(ch).width;
    ws.push(cw);
    w += cw + sp;
  }
  w -= sp;
  let px = cx - w / 2;
  const prev = x.textAlign;
  x.textAlign = "left";
  let i = 0;
  for (const ch of str) {
    x.fillText(ch, px, y);
    px += ws[i++] + sp;
  }
  x.textAlign = prev;
}

function arcText(
  x: CanvasRenderingContext2D,
  str: string,
  cx: number,
  cy: number,
  r: number,
  centerA: number,
  sp: number
): void {
  let a = centerA - (sp * (str.length - 1)) / 2;
  for (const ch of str) {
    x.save();
    x.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    x.rotate(a + Math.PI / 2);
    x.fillText(ch, 0, 0);
    x.restore();
    a += sp;
  }
}

function finishTex(cnv: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(cnv);
  tex.anisotropy = S3.maxAniso;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Dial face (1024²) with sunburst, minute track, typography, date & chrono sockets. */
export function makeDialTexture(model: WatchModel, cfg: Config): THREE.CanvasTexture {
  const S = 1024;
  const cx = S / 2;
  const cy = S / 2;
  const R = S / 2;
  const cnv = document.createElement("canvas");
  cnv.width = cnv.height = S;
  const x = cnv.getContext("2d")!;
  const d = dialById(cfg.dial);
  const light = cfg.dial !== "black" && cfg.dial !== "green" && cfg.dial !== "blue";
  const ink = light ? "#262218" : "#ece7da";

  x.fillStyle = d.hex;
  x.beginPath();
  x.arc(cx, cy, R, 0, TAU);
  x.fill();

  /* sunburst brushing */
  x.save();
  x.translate(cx, cy);
  for (let i = 0; i < 540; i++) {
    const a = (i / 540) * TAU;
    x.strokeStyle = (i % 2 ? "rgba(255,255,255," : "rgba(0,0,0,") + (0.015 + Math.random() * 0.03) + ")";
    x.lineWidth = 1.7;
    x.beginPath();
    x.moveTo(0, 0);
    x.lineTo(Math.cos(a) * R, Math.sin(a) * R);
    x.stroke();
  }
  x.restore();

  const vg = x.createRadialGradient(cx, cy, R * 0.25, cx, cy, R);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, light ? "rgba(0,0,0,.16)" : "rgba(0,0,0,.4)");
  x.fillStyle = vg;
  x.beginPath();
  x.arc(cx, cy, R, 0, TAU);
  x.fill();

  /* minute track */
  x.strokeStyle = ink;
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * TAU;
    const major = i % 5 === 0;
    const r1 = R * 0.958;
    const r2 = R * (major ? 0.9 : 0.928);
    x.lineWidth = major ? 2.6 : 1.2;
    x.globalAlpha = major ? 0.85 : 0.5;
    x.beginPath();
    x.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    x.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    x.stroke();
  }
  x.globalAlpha = 1;

  /* typography — fictional house, no trademarked dial phrases */
  x.fillStyle = ink;
  x.textBaseline = "middle";
  spacedText(x, "AURELIA", cx, cy - R * 0.42, '600 54px "Cormorant Garamond", Georgia, serif', 15);
  x.globalAlpha = 0.8;
  spacedText(x, model.subdials ? "GRAND COMPLICATION" : "AUTOMATIQUE", cx, cy - R * 0.3, "500 21px Inter, Arial, sans-serif", 7);
  x.globalAlpha = 0.62;
  spacedText(x, "CHRONOMETER CERTIFIED", cx, cy + R * 0.33, "500 20px Inter, Arial, sans-serif", 4.5);
  spacedText(x, "−2/+2 SECONDS", cx, cy + R * 0.41, "500 20px Inter, Arial, sans-serif", 4.5);
  x.globalAlpha = 0.4;
  spacedText(x, "GENÈVE", cx, cy + R * 0.865, "500 17px Inter, Arial, sans-serif", 6);
  x.globalAlpha = 1;

  /* date window at 3 o'clock */
  if (model.cyclops) {
    const dw = R * 0.155;
    const dh = R * 0.2;
    const dx = cx + R * 0.585;
    x.fillStyle = "#f2efe6";
    roundRectPath(x, dx - dw / 2, cy - dh / 2, dw, dh, 9);
    x.fill();
    x.strokeStyle = "rgba(0,0,0,.4)";
    x.lineWidth = 2.5;
    x.stroke();
    x.fillStyle = "#17150f";
    x.font = "600 56px Inter, Arial, sans-serif";
    x.textAlign = "center";
    x.fillText(String(new Date().getDate()), dx, cy + 3);
    x.textAlign = "left";
  }

  /* chrono subdial sockets */
  if (model.subdials) {
    const r = R * 0.2;
    ([
      [cx - R * 0.42, cy],
      [cx + R * 0.42, cy],
      [cx, cy + R * 0.42],
    ] as const).forEach(([sx, sy]) => {
      x.fillStyle = model.mini.sub ?? "#141419";
      x.beginPath();
      x.arc(sx, sy, r, 0, TAU);
      x.fill();
      x.strokeStyle = "rgba(255,255,255,.28)";
      x.lineWidth = 2;
      x.stroke();
      x.strokeStyle = "rgba(255,255,255,.07)";
      x.lineWidth = 1.4;
      for (let rr = r * 0.3; rr < r * 0.9; rr += r * 0.18) {
        x.beginPath();
        x.arc(sx, sy, rr, 0, TAU);
        x.stroke();
      }
      x.strokeStyle = "rgba(240,238,228,.85)";
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        x.lineWidth = i % 3 === 0 ? 2.2 : 1.1;
        x.beginPath();
        x.moveTo(sx + Math.cos(a) * r * 0.8, sy + Math.sin(a) * r * 0.8);
        x.lineTo(sx + Math.cos(a) * r * 0.93, sy + Math.sin(a) * r * 0.93);
        x.stroke();
      }
      x.fillStyle = "rgba(240,238,228,.9)";
      x.beginPath();
      x.arc(sx, sy, 4, 0, TAU);
      x.fill();
    });
  }

  return finishTex(cnv);
}

/** Diver bezel insert (512², planar ring 0.655→0.875). */
export function makeDiveInsert(opt: { ceramic?: string }): THREE.CanvasTexture {
  const S = 512;
  const cx = S / 2;
  const cy = S / 2;
  const cnv = document.createElement("canvas");
  cnv.width = cnv.height = S;
  const x = cnv.getContext("2d")!;
  const u = (v: number) => v * (256 / 0.875);
  x.fillStyle = opt.ceramic ?? "#0b0e12";
  x.beginPath();
  x.arc(cx, cy, u(0.875), 0, TAU);
  x.arc(cx, cy, u(0.655), 0, TAU, true);
  x.fill();
  const shine = x.createLinearGradient(0, 0, 0, S);
  shine.addColorStop(0, "rgba(255,255,255,.09)");
  shine.addColorStop(0.5, "rgba(255,255,255,0)");
  x.fillStyle = shine;
  x.beginPath();
  x.arc(cx, cy, u(0.875), 0, TAU);
  x.arc(cx, cy, u(0.655), 0, TAU, true);
  x.fill();

  x.fillStyle = x.strokeStyle = "#e2e6ea";
  x.beginPath();
  x.moveTo(cx - u(0.045), cy - u(0.855));
  x.lineTo(cx + u(0.045), cy - u(0.855));
  x.lineTo(cx, cy - u(0.7));
  x.closePath();
  x.fill();
  x.fillStyle = "#d8efe0";
  x.beginPath();
  x.arc(cx, cy - u(0.8), u(0.022), 0, TAU);
  x.fill();
  x.strokeStyle = "#e2e6ea";
  for (let i = 0; i <= 15; i++) {
    const a = (i / 60) * TAU - Math.PI / 2;
    const major = i % 5 === 0;
    x.lineWidth = major ? 5 : 3;
    x.beginPath();
    x.moveTo(cx + Math.cos(a) * u(0.865), cy + Math.sin(a) * u(0.865));
    x.lineTo(cx + Math.cos(a) * u(major ? 0.72 : 0.78), cy + Math.sin(a) * u(major ? 0.72 : 0.78));
    x.stroke();
  }
  x.fillStyle = "#dfe3e8";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.font = "600 46px Inter, Arial, sans-serif";
  [10, 20, 30, 40, 50].forEach((v) => {
    const a = (v / 60) * TAU - Math.PI / 2;
    x.save();
    x.translate(cx + Math.cos(a) * u(0.775), cy + Math.sin(a) * u(0.775));
    x.rotate(a + Math.PI / 2);
    x.fillText(String(v), 0, 0);
    x.restore();
  });
  return finishTex(cnv);
}

/** Two-time-zone insert (day/duotone halves + 24 h graduation). */
export function makeGmtInsert(opt: { a?: string; b?: string }): THREE.CanvasTexture {
  const S = 512;
  const cx = S / 2;
  const cy = S / 2;
  const cnv = document.createElement("canvas");
  cnv.width = cnv.height = S;
  const x = cnv.getContext("2d")!;
  const u = (v: number) => v * (256 / 0.875);
  const A = opt.a ?? "#9e1c24";
  const B = opt.b ?? "#0b2a5e";
  const band = (c: string, a0: number, a1: number) => {
    x.fillStyle = c;
    x.beginPath();
    x.arc(cx, cy, u(0.875), a0, a1);
    x.arc(cx, cy, u(0.655), a1, a0, true);
    x.fill();
  };
  band(B, -Math.PI / 2, Math.PI / 2);
  band(A, Math.PI / 2, (3 * Math.PI) / 2);
  const shine = x.createLinearGradient(0, 0, 0, S);
  shine.addColorStop(0, "rgba(255,255,255,.08)");
  shine.addColorStop(0.55, "rgba(255,255,255,0)");
  x.fillStyle = shine;
  x.beginPath();
  x.arc(cx, cy, u(0.875), 0, TAU);
  x.arc(cx, cy, u(0.655), 0, TAU, true);
  x.fill();

  x.fillStyle = x.strokeStyle = "#e8eaee";
  x.beginPath();
  x.moveTo(cx - u(0.045), cy - u(0.855));
  x.lineTo(cx + u(0.045), cy - u(0.855));
  x.lineTo(cx, cy - u(0.7));
  x.closePath();
  x.fill();
  x.strokeStyle = "#e8eaee";
  for (let h = 0; h < 24; h++) {
    const a = (h / 24) * TAU - Math.PI / 2;
    const major = h % 2 === 0;
    x.lineWidth = major ? 4.5 : 2.5;
    x.beginPath();
    x.moveTo(cx + Math.cos(a) * u(0.865), cy + Math.sin(a) * u(0.865));
    x.lineTo(cx + Math.cos(a) * u(major ? 0.775 : 0.815), cy + Math.sin(a) * u(major ? 0.775 : 0.815));
    x.stroke();
  }
  x.font = "600 44px Inter, Arial, sans-serif";
  x.textAlign = "center";
  x.textBaseline = "middle";
  for (let h = 2; h <= 22; h += 2) {
    const a = (h / 24) * TAU - Math.PI / 2;
    x.save();
    x.translate(cx + Math.cos(a) * u(0.7), cy + Math.sin(a) * u(0.7));
    x.rotate(a + Math.PI / 2);
    x.fillText(String(h), 0, 0);
    x.restore();
  }
  return finishTex(cnv);
}

/** Chronograph tachymeter insert. */
export function makeTachyInsert(opt: { ceramic?: string }): THREE.CanvasTexture {
  const S = 512;
  const cx = S / 2;
  const cy = S / 2;
  const cnv = document.createElement("canvas");
  cnv.width = cnv.height = S;
  const x = cnv.getContext("2d")!;
  const u = (v: number) => v * (256 / 0.875);
  x.fillStyle = opt.ceramic ?? "#101114";
  x.beginPath();
  x.arc(cx, cy, u(0.875), 0, TAU);
  x.arc(cx, cy, u(0.655), 0, TAU, true);
  x.fill();
  const shine = x.createLinearGradient(0, 0, 0, S);
  shine.addColorStop(0, "rgba(255,255,255,.07)");
  shine.addColorStop(0.5, "rgba(255,255,255,0)");
  x.fillStyle = shine;
  x.beginPath();
  x.arc(cx, cy, u(0.875), 0, TAU);
  x.arc(cx, cy, u(0.655), 0, TAU, true);
  x.fill();

  x.fillStyle = "#e8eaee";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.font = "600 34px Inter, Arial, sans-serif";
  [400, 300, 250, 200, 170, 150, 130, 120, 110, 100, 90, 80, 70, 65, 60].forEach((v) => {
    const a = ((3600 / v) / 60) * TAU - Math.PI / 2;
    x.save();
    x.translate(cx + Math.cos(a) * u(0.765), cy + Math.sin(a) * u(0.765));
    x.rotate(a + Math.PI / 2);
    x.fillText(String(v), 0, 0);
    x.restore();
  });
  x.font = "500 27px Inter, Arial, sans-serif";
  arcText(x, "TACHYMETER", cx, cy, u(0.72), -Math.PI / 2, 0.088);
  x.globalAlpha = 0.7;
  x.font = "500 22px Inter, Arial, sans-serif";
  arcText(x, "UNITS PER HOUR", cx, cy, u(0.72), Math.PI / 2, 0.075);
  x.globalAlpha = 1;
  return finishTex(cnv);
}

export interface MaterialSet {
  caseM: THREE.MeshPhysicalMaterial;
  polish: THREE.MeshPhysicalMaterial;
  gold: THREE.MeshPhysicalMaterial;
  hands: THREE.MeshPhysicalMaterial;
  braceA: THREE.MeshPhysicalMaterial;
  braceB: THREE.MeshPhysicalMaterial;
  dark: THREE.MeshPhysicalMaterial;
  lume: THREE.MeshStandardMaterial;
  ruby: THREE.MeshStandardMaterial;
  dial: THREE.MeshStandardMaterial;
  crystal: THREE.MeshPhysicalMaterial;
  ceramic?: THREE.MeshPhysicalMaterial;
  insertMap?: THREE.CanvasTexture;
  bzOpt: { id: string; ceramic?: string; a?: string; b?: string; price: number };
  dialMap: THREE.CanvasTexture;
}

/** Material factory (fresh per build → clean disposal). */
export function buildMaterials(model: WatchModel, cfg: Config): MaterialSet {
  const isGold = cfg.metal === "gold";
  const isTwo = cfg.metal === "twotone";
  const caseColor = isGold ? GOLD : STEEL;
  const bezelColor = isGold || isTwo ? GOLD : STEEL;
  const handsColor = isGold || isTwo ? GOLD : STEEL;

  const phys = (o: THREE.MeshPhysicalMaterialParameters & { envMapIntensity?: number }) => {
    const m = new THREE.MeshPhysicalMaterial(o as THREE.MeshPhysicalMaterialParameters);
    m.envMapIntensity = o.envMapIntensity ?? 1.15;
    return m;
  };

  const dialMap = makeDialTexture(model, cfg);
  const M: MaterialSet = {
    caseM: phys({ color: caseColor, metalness: 1, roughness: 0.34, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
    polish: phys({ color: bezelColor, metalness: 1, roughness: 0.13, clearcoat: 0.9, clearcoatRoughness: 0.16, envMapIntensity: 1.35 }),
    gold: phys({ color: GOLD, metalness: 1, roughness: 0.2, clearcoat: 0.85, clearcoatRoughness: 0.2, envMapIntensity: 1.35 }),
    hands: phys({ color: handsColor, metalness: 1, roughness: 0.18, clearcoat: 0.9, clearcoatRoughness: 0.15, envMapIntensity: 1.4 }),
    braceA: phys({ color: isGold || isTwo ? GOLD : STEEL, metalness: 1, roughness: 0.12, clearcoat: 0.9, clearcoatRoughness: 0.14, envMapIntensity: 1.3 }),
    braceB: phys({ color: isGold ? GOLD : STEEL, metalness: 1, roughness: 0.36, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
    dark: phys({ color: 0x3a3d43, metalness: 1, roughness: 0.5 }),
    lume: new THREE.MeshStandardMaterial({ color: 0xdfeee2, emissive: 0x5d8f74, emissiveIntensity: 0.55, roughness: 0.4 }),
    ruby: new THREE.MeshStandardMaterial({ color: 0x9c1024, emissive: 0x6e0a1c, emissiveIntensity: 0.8, roughness: 0.15, metalness: 0.2 }),
    dial: new THREE.MeshStandardMaterial({ map: dialMap, roughness: 0.52, metalness: 0.42, envMapIntensity: 0.9 }),
    crystal: phys({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.02,
      transmission: 1,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      side: THREE.DoubleSide,
      envMapIntensity: 1.6,
    }),
    dialMap,
    bzOpt: bezelOptionFor(model, cfg.bezel),
  };

  if (model.bezel === "dive" || model.bezel === "tachy") {
    M.ceramic = phys({
      color: M.bzOpt.ceramic ?? "#0b0e12",
      metalness: 0.25,
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.15,
    });
    M.insertMap = model.bezel === "dive" ? makeDiveInsert(M.bzOpt) : makeTachyInsert(M.bzOpt);
  } else if (model.bezel === "gmt") {
    M.insertMap = makeGmtInsert(M.bzOpt);
  }
  return M;
}

export { GOLD, STEEL };
export const isLightDial = (id: string) => Boolean(DIALS.find((d) => d.id === id && ["champagne", "silver", "ivoire"].includes(d.id)));
