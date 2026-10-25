/**
 * Watch Builder II — procedural assembly, explode, swap, live configuration patching.
 * Direct port of the legacy builder tuned for three ≥ 0.180.
 */
import * as THREE from "three";
import { gsap } from "gsap";
import type { Config, WatchModel } from "@/lib/catalog";
import { BEZEL_SETS } from "@/lib/catalog";
import { isMobile, prefersReduced } from "@/lib/runtime";
import { S3 } from "./s3";
import { view, TAU } from "./viewState";
import { buildMaterials, type MaterialSet } from "./assets";
import type { Config as Cfg } from "@/lib/catalog";

export interface WatchUserData {
  spin: THREE.Group;
  parts: Record<string, THREE.Group>;
  hands: {
    h?: THREE.Group;
    m?: THREE.Group;
    s?: THREE.Group;
    gmt?: THREE.Group;
    sub?: THREE.Group;
  };
  spinners: Array<{ o: THREE.Object3D; s: number; osc?: boolean }>;
  M: MaterialSet;
  model: WatchModel;
  cfg: Cfg;
  cfgKey: Cfg;
  swapY: number;
  update(now: Date, t: number): void;
}

type WatchRoot = THREE.Group & { userData: WatchUserData };

/* ── geometry helpers ── */

function latheFrom(pts: Array<[number, number]>, seg: number): THREE.BufferGeometry {
  const g = new THREE.LatheGeometry(
    pts.map((p) => new THREE.Vector2(p[0], p[1])),
    seg
  );
  g.rotateX(Math.PI / 2);
  return g;
}

function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function roundedBoxGeo(w: number, h: number, d: number, r: number): THREE.ExtrudeGeometry {
  const g = new THREE.ExtrudeGeometry(roundedRectShape(w, h, r), {
    depth: d - 0.024,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 4,
  });
  g.center();
  return g;
}

function gearShape(rO: number, rI: number, teeth: number): THREE.Shape {
  const s = new THREE.Shape();
  const N = teeth * 2;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * TAU;
    const r = i % 2 === 0 ? rO : rI;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) s.moveTo(px, py);
    else s.lineTo(px, py);
  }
  s.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, rI * 0.4, 0, TAU, true);
  s.holes.push(hole);
  return s;
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, role?: string): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  if (role) m.userData.role = role;
  return m;
}

function shadowed<T extends THREE.Object3D>(m: T, on: boolean): T {
  if (on && "castShadow" in m) (m as unknown as { castShadow: boolean }).castShadow = true;
  return m;
}

function fluteGeometry(geo: THREE.BufferGeometry, amp: number, teeth: number): THREE.BufferGeometry {
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const px = p.getX(i);
    const pz = p.getZ(i);
    const r = Math.hypot(px, pz);
    if (r < 0.5) continue;
    const a = Math.atan2(pz, px);
    const wv = Math.abs(Math.sin((a * teeth) / 2));
    const nr = r * (1 + amp * Math.pow(wv, 0.7));
    p.setX(i, Math.cos(a) * nr);
    p.setZ(i, Math.sin(a) * nr);
  }
  geo.computeVertexNormals();
  return geo;
}

/* ── hands ── */

function mercedesHand(len: number, cr: number, w: number, M: MaterialSet, shadows: boolean): THREE.Group {
  const g = new THREE.Group();
  const depth = 0.011;
  const stem = mesh(new THREE.BoxGeometry(w * 0.62, len * 0.5, depth), M.hands, "hands");
  stem.position.y = len * 0.25;
  g.add(stem);
  const ring = mesh(new THREE.TorusGeometry(cr, w * 0.3, 10, 28), M.hands, "hands");
  ring.position.y = len * 0.56;
  g.add(ring);
  for (let i = 0; i < 3; i++) {
    const a0 = Math.PI / 2 + (i * TAU) / 3 - 0.42;
    const a1 = a0 + 0.84;
    const sh = new THREE.Shape();
    sh.absarc(0, 0, cr * 0.95, a0, a1, false);
    sh.absarc(0, 0, cr * 0.34, a1, a0, true);
    const sec = mesh(new THREE.ShapeGeometry(sh, 10), M.hands, "hands");
    sec.position.y = len * 0.56;
    g.add(sec);
  }
  const baseY = len * 0.56 + cr * 0.9;
  const tipY = len;
  const sh2 = new THREE.Shape();
  sh2.moveTo(-w * 0.32, baseY);
  sh2.lineTo(w * 0.32, baseY);
  sh2.lineTo(w * 0.15, tipY);
  sh2.lineTo(-w * 0.15, tipY);
  sh2.closePath();
  g.add(mesh(new THREE.ExtrudeGeometry(sh2, { depth, bevelEnabled: false }), M.hands, "hands"));
  const lume = mesh(new THREE.BoxGeometry(w * 0.3, (tipY - baseY) * 0.55, 0.005), M.lume, "lume");
  lume.position.set(0, baseY + ((tipY - baseY) * 0.32), depth + 0.002);
  g.add(lume);
  return shadowed(g, shadows);
}

function secondHand(len: number, M: MaterialSet): THREE.Group {
  const g = new THREE.Group();
  const bar = mesh(new THREE.BoxGeometry(0.013, len * 0.82, 0.008), M.hands, "hands");
  bar.position.y = len * 0.21;
  g.add(bar);
  const cw = mesh(new THREE.TorusGeometry(0.034, 0.011, 8, 20), M.hands, "hands");
  cw.position.y = -len * 0.27;
  g.add(cw);
  const hub = mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.022, 16).rotateX(Math.PI / 2), M.hands, "hands");
  g.add(hub);
  return g;
}

function gmtHand(M: MaterialSet): THREE.Group {
  const g = new THREE.Group();
  const bar = mesh(new THREE.BoxGeometry(0.016, 0.5, 0.009), M.hands, "hands");
  bar.position.y = 0.2;
  g.add(bar);
  const sh = new THREE.Shape();
  sh.moveTo(0, 0.58);
  sh.lineTo(0.032, 0.42);
  sh.lineTo(-0.032, 0.42);
  sh.closePath();
  g.add(mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.009, bevelEnabled: false }), M.hands, "hands"));
  const lume = mesh(new THREE.BoxGeometry(0.02, 0.09, 0.005), M.lume, "lume");
  lume.position.set(0, 0.33, 0.011);
  g.add(lume);
  return g;
}

/* ── bracelet (instanced links around wrist axis) ── */

function buildStrap(M: MaterialSet, cfg: Cfg, s: 1 | -1, shadows: boolean): THREE.Group {
  const g = new THREE.Group();
  const R = 1.73;
  const zc = -1.55;
  const phi0 = 0.665;
  const dPhi = 0.127;
  const N = 9;
  const jub = cfg.bracelet === "jubilee";
  const cols: Array<[number, number, "braceA" | "braceB"]> = jub
    ? [
        [-0.395, 0.185, "braceB"],
        [-0.2, 0.185, "braceB"],
        [0, 0.2, "braceA"],
        [0.2, 0.185, "braceB"],
        [0.395, 0.185, "braceB"],
      ]
    : [
        [-0.345, 0.26, "braceB"],
        [0, 0.52, "braceA"],
        [0.345, 0.26, "braceB"],
      ];
  const end = shadowed(mesh(roundedBoxGeo(0.98, 0.14, 0.1, 0.03), M.braceA, "braceA"), shadows);
  end.position.set(0, s * 1.0, -0.12);
  end.rotation.x = s * 0.28;
  g.add(end);
  const geoCache = new Map<number, THREE.BufferGeometry>();
  cols.forEach(([cx, w, matName]) => {
    let geo = geoCache.get(w);
    if (!geo) {
      geo = roundedBoxGeo(w, 0.205, 0.085, 0.018);
      geoCache.set(w, geo);
    }
    const inst = new THREE.InstancedMesh(geo, M[matName], N);
    inst.userData.role = matName;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < N; i++) {
      const phi = phi0 + dPhi * i;
      const sc = 1 - i * 0.016;
      dummy.position.set(cx * sc, s * Math.sin(phi) * R, zc + Math.cos(phi) * R);
      dummy.rotation.set(-s * phi, 0, 0);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    shadowed(inst, shadows);
    g.add(inst);
  });
  return g;
}

/* ── full assembly ── */

export function buildWatch(model: WatchModel, cfg: Cfg, shadows: boolean, mobile: boolean): WatchRoot {
  const M = buildMaterials(model, cfg);
  const seg = mobile ? 64 : 96;
  const V3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const root = new THREE.Group() as WatchRoot;
  const spin = new THREE.Group();
  root.add(spin);
  const parts: Record<string, THREE.Group> = {};
  const hands: WatchUserData["hands"] = {};
  const spinners: WatchUserData["spinners"] = [];

  const P = (name: string, off: THREE.Vector3, rot = 0) => {
    const g = new THREE.Group();
    g.userData.off = off;
    g.userData.rot = rot;
    spin.add(g);
    parts[name] = g;
    return g;
  };

  /* mid-case, rehaut, lugs, crown, guards */
  const caseG = P("case", V3(0, 0, -0.52));
  caseG.add(
    shadowed(mesh(latheFrom([[0.62, -0.145], [0.86, -0.145], [0.985, -0.06], [1.02, 0.05], [0.985, 0.14], [0.9, 0.185], [0.66, 0.205]], seg), M.caseM, "caseM"), shadows)
  );
  caseG.add(mesh(latheFrom([[0.63, 0.205], [0.662, 0.292]], seg), M.dark, "dark"));
  ([[1, 1], [1, -1], [-1, 1], [-1, -1]] as const).forEach(([sx, sy]) => {
    const lug = shadowed(mesh(roundedBoxGeo(0.17, 0.27, 0.2, 0.05), M.caseM, "caseM"), shadows);
    lug.position.set(sx * 0.53, sy * 0.87, -0.03);
    lug.rotation.z = -sx * sy * 0.15;
    lug.rotation.x = sy * 0.1;
    caseG.add(lug);
  });
  const crownG = new THREE.Group();
  crownG.position.set(1.1, 0, -0.02);
  crownG.add(
    shadowed(mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.13, 28).rotateZ(Math.PI / 2), M.polish, "polish"), shadows)
  );
  const cap = mesh(new THREE.CylinderGeometry(0.052, 0.078, 0.045, 20).rotateZ(Math.PI / 2), M.polish, "polish");
  cap.position.x = 0.085;
  crownG.add(cap);
  const knurl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.128, 0.018, 0.02), M.polish, 20);
  knurl.userData.role = "polish";
  const kd = new THREE.Object3D();
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * TAU;
    kd.position.set(0, Math.sin(a) * 0.085, Math.cos(a) * 0.085);
    kd.rotation.set(a, 0, 0);
    kd.updateMatrix();
    knurl.setMatrixAt(i, kd.matrix);
  }
  knurl.instanceMatrix.needsUpdate = true;
  crownG.add(knurl);
  caseG.add(crownG);
  if (model.guards) {
    ([1, -1] as const).forEach((sy) => {
      const guard = shadowed(mesh(roundedBoxGeo(0.08, 0.22, 0.28, 0.04), M.caseM, "caseM"), shadows);
      guard.position.set(0.96, sy * 0.16, -0.02);
      guard.rotation.z = sy * 0.42;
      guard.rotation.x = sy * 0.1;
      caseG.add(guard);
    });
  }

  /* caseback (detaches in exploded view) */
  const backG = P("back", V3(0, 0, -0.95));
  backG.add(
    shadowed(mesh(latheFrom([[0, -0.19], [0.4, -0.2], [0.66, -0.19], [0.86, -0.145]], seg), M.caseM, "caseM"), shadows)
  );

  /* bezel */
  const bezG = P("bezel", V3(0, 0, 1.05));
  const bezProfile: Array<[number, number]> = [[0.66, 0.205], [0.905, 0.205], [0.905, 0.245], [0.88, 0.3], [0.66, 0.3]];
  let bezBase: THREE.Mesh;
  if (model.bezel === "fluted") {
    bezBase = mesh(latheFrom([[0.66, 0.205], [0.9, 0.205], [0.9, 0.265], [0.875, 0.3], [0.66, 0.3]], seg), M.polish, "polish");
    fluteGeometry(bezBase.geometry, 0.016, 60);
  } else if (model.bezel === "gmt") {
    bezBase = mesh(latheFrom(bezProfile, seg), M.polish, "polish");
  } else {
    bezBase = mesh(latheFrom(bezProfile, seg), M.ceramic!, "ceramic");
  }
  bezG.add(shadowed(bezBase, shadows));
  if (M.insertMap) {
    const ins = new THREE.Mesh(
      new THREE.RingGeometry(0.655, 0.875, seg),
      new THREE.MeshStandardMaterial({ map: M.insertMap, transparent: true, roughness: 0.24, metalness: 0.15, envMapIntensity: 1.1 })
    );
    ins.position.z = 0.306;
    ins.userData.isInsert = true;
    bezG.add(ins);
  }
  if (model.bezel === "dive") {
    const pip = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.008, 16).rotateX(Math.PI / 2), M.lume, "lume");
    pip.position.set(0, 0.775, 0.312);
    bezG.add(pip);
  }

  /* dial + applied indices */
  const dialG = P("dial", V3(0, 0, 0.42));
  const dial = mesh(new THREE.CircleGeometry(0.63, seg), M.dial, "dial");
  dial.position.z = 0.205;
  dialG.add(dial);
  for (let h = 1; h <= 12; h++) {
    if (h === 3 && model.cyclops) continue;
    const a = (h / 12) * TAU;
    const px = Math.sin(a) * 0.515;
    const py = Math.cos(a) * 0.515;
    let im: THREE.Mesh;
    if (h === 12) {
      const s = new THREE.Shape();
      s.moveTo(0, -0.052);
      s.lineTo(0.06, 0.05);
      s.lineTo(-0.06, 0.05);
      s.closePath();
      im = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false }), M.hands, "hands");
    } else if (h === 6 || h === 9) {
      im = mesh(new THREE.BoxGeometry(0.035, 0.13, 0.02), M.hands, "hands");
    } else {
      im = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 24).rotateX(Math.PI / 2), M.hands, "hands");
    }
    im.position.set(px, py, 0.208);
    im.rotation.z = -a;
    shadowed(im, shadows);
    dialG.add(im);
    const lume = mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.008, 12).rotateX(Math.PI / 2), M.lume, "lume");
    lume.position.set(px, py, 0.222);
    dialG.add(lume);
  }
  if (model.subdials) {
    const subHand = new THREE.Group();
    const sbar = mesh(new THREE.BoxGeometry(0.008, 0.095, 0.006), M.hands, "hands");
    sbar.position.y = 0.032;
    subHand.add(sbar);
    subHand.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 12).rotateX(Math.PI / 2), M.hands, "hands"));
    subHand.position.set(-0.2646, 0, 0.215);
    dialG.add(subHand);
    hands.sub = subHand;
  }

  /* movement — plate, gears, balance, rotor, jewels */
  const movG = P("movement", V3(0, 0, 0.16));
  const plate = mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.05, 48).rotateX(Math.PI / 2), M.dark, "dark");
  plate.position.z = 0.02;
  movG.add(plate);
  ([[0.17, 0.11, 14, 0.16, 0.14, 0.062, "gold"], [0.12, 0.075, 11, -0.2, 0.02, 0.068, "hands"], [0.1, 0.06, 9, 0.02, -0.2, 0.074, "gold"]] as const).forEach(
    ([rO, rI, teeth, gx, gy, gz, matName]) => {
      const gear = mesh(new THREE.ExtrudeGeometry(gearShape(rO, rI, teeth), { depth: 0.018, bevelEnabled: false }), M[matName as "gold" | "hands"], "gold" === matName ? "gold" : "hands");
      gear.position.set(gx, gy, gz);
      movG.add(gear);
      spinners.push({ o: gear, s: 0.25 + teeth * 0.02 });
      const jewel = mesh(new THREE.SphereGeometry(0.018, 10, 8), M.ruby, "ruby");
      jewel.position.set(gx, gy, gz + 0.022);
      movG.add(jewel);
    }
  );
  const bal = mesh(new THREE.TorusGeometry(0.1, 0.014, 10, 28), M.hands, "hands");
  bal.position.set(-0.02, 0.28, 0.06);
  movG.add(bal);
  spinners.push({ o: bal, s: 0, osc: true });
  const rotor = new THREE.Group();
  const half = mesh(new THREE.CircleGeometry(0.52, 32, Math.PI, Math.PI), M.gold, "gold");
  half.position.z = -0.005;
  rotor.add(half);
  rotor.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 20).rotateX(Math.PI / 2), M.hands, "hands"));
  rotor.position.z = 0;
  rotor.rotation.z = 0.8;
  movG.add(rotor);
  spinners.push({ o: rotor, s: 0.35 });

  /* hands (each its own explode layer) */
  const hourG = P("hour", V3(0, 0, 0.6));
  hands.h = mercedesHand(0.35, 0.075, 0.052, M, shadows);
  hands.h.position.z = 0.228;
  hourG.add(hands.h);
  const minG = P("min", V3(0, 0, 0.74));
  hands.m = mercedesHand(0.53, 0.062, 0.044, M, shadows);
  hands.m.position.z = 0.246;
  minG.add(hands.m);
  const secG = P("sec", V3(0, 0, 0.88));
  hands.s = secondHand(0.6, M);
  hands.s.position.z = 0.262;
  secG.add(hands.s);
  if (model.gmt) {
    const gmtG = P("gmt", V3(0, 0, 0.67));
    hands.gmt = gmtHand(M);
    hands.gmt.position.z = 0.237;
    gmtG.add(hands.gmt);
  }

  /* crystal + cyclops */
  const cryG = P("crystal", V3(0, 0, 1.5));
  const dome = mesh(latheFrom([[0, 0.1], [0.28, 0.096], [0.46, 0.078], [0.585, 0.042], [0.635, 0.004]], 64), M.crystal);
  dome.position.z = 0.272;
  dome.renderOrder = 5;
  cryG.add(dome);
  if (model.cyclops) {
    const cyc = new THREE.Mesh(new THREE.SphereGeometry(0.105, 24, 14, 0, TAU, 0, Math.PI * 0.42), M.crystal);
    cyc.geometry.rotateX(Math.PI / 2);
    cyc.scale.z = 0.5;
    cyc.position.set(0.37, 0, 0.318);
    cyc.renderOrder = 6;
    cryG.add(cyc);
  }

  /* bracelet */
  const top = P("braceTop", V3(0, 0.8, 0.28), -0.55);
  top.add(buildStrap(M, cfg, 1, shadows));
  const bot = P("braceBot", V3(0, -0.8, 0.28), 0.55);
  bot.add(buildStrap(M, cfg, -1, shadows));

  root.userData = {
    spin,
    parts,
    hands,
    spinners,
    M,
    model,
    cfg: { ...cfg },
    cfgKey: { ...cfg },
    swapY: 0,
    update(now: Date, t: number) {
      const ms = now.getMilliseconds();
      const sec = now.getSeconds() + ms / 1000;
      const mi = now.getMinutes() + sec / 60;
      const h = (now.getHours() % 12) + mi / 60;
      if (hands.s) hands.s.rotation.z = -(sec / 60) * TAU;
      if (hands.m) hands.m.rotation.z = -(mi / 60) * TAU;
      if (hands.h) hands.h.rotation.z = -(h / 12) * TAU;
      if (hands.gmt) hands.gmt.rotation.z = -((now.getUTCHours() + now.getUTCMinutes() / 60) / 24) * TAU;
      if (hands.sub) hands.sub.rotation.z = -(sec / 60) * TAU;
      spinners.forEach((sp) => {
        if (sp.osc) sp.o.rotation.z = Math.sin(t * 9) * 0.55;
        else sp.o.rotation.z += sp.s * 0.016;
      });
    },
  };
  return root;
}

/* ── explode / dispose ── */

export function applyExplode(w: WatchRoot, k: number): void {
  const parts = w.userData.parts;
  for (const name in parts) {
    const p = parts[name];
    const u = p.userData as { off: THREE.Vector3; rot: number };
    p.position.set(u.off.x * k, u.off.y * k, u.off.z * k);
    if (u.rot) p.rotation.x = u.rot * k;
  }
}

export function disposeWatch(w: THREE.Object3D): void {
  w.traverse((o) => {
    const anyO = o as THREE.Mesh;
    if (anyO.geometry) anyO.geometry?.dispose();
  });
  const mats = new Set<THREE.Material | THREE.Material[]>();
  w.traverse((o) => {
    const anyO = o as THREE.Mesh;
    if (anyO.material) mats.add(anyO.material as THREE.Material);
  });
  mats.forEach((mm) => {
    const list = Array.isArray(mm) ? mm : [mm];
    list.forEach((m) => {
      const withMap = m as THREE.Material & { map?: THREE.Texture | null };
      if (withMap.map) withMap.map.dispose();
      m.dispose();
    });
  });
}

/* ── model swap with cinematic transition ── */

let currentWatch: WatchRoot | null = null;
let swapBusy = false;
let pendingSwap: { model: WatchModel; cfg: Cfg; opts?: Partial<SwapOptions> } | null = null;
let flashSprite: THREE.Sprite | null = null;

export interface SwapOptions {
  soft?: boolean;
}

function ensureFlash(): void {
  if (flashSprite || !S3.ready) return;
  const src = S3.glow.length ? S3.glow[0].material.map : null;
  if (!src) return;
  flashSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: src, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  flashSprite.position.set(0, 0, 0.6);
  flashSprite.renderOrder = 20;
  S3.scene!.add(flashSprite);
}

export function currentWatchModel(): WatchModel | null {
  return currentWatch?.userData.model ?? null;
}export function swapWatch(model: WatchModel, cfg: Cfg, opts: SwapOptions = {}): void {
  if (!S3.ready) return;
  if (swapBusy) {
    pendingSwap = { model, cfg, opts };
    return;
  }
  const reduced = prefersReduced();
  const build = () => {
    const mobile = isMobile();
    const w = buildWatch(model, cfg, !mobile, mobile);
    S3.watchHold!.add(w);
    currentWatch = w;
    applyExplode(w, view.ex);
    if (!reduced) {
      gsap.fromTo(w.scale, { x: 0.6, y: 0.6, z: 0.6 }, { x: 1, y: 1, z: 1, duration: opts.soft ? 0.5 : 0.85, ease: "power3.out" });
      gsap.fromTo(w.userData, { swapY: opts.soft ? -0.7 : -2.4 }, { swapY: 0, duration: opts.soft ? 0.5 : 1.1, ease: "power3.out" });
      if (!opts.soft) {
        gsap.fromTo(w.userData.parts.bezel.rotation, { z: 2.4 }, { z: 0, duration: 1.1, ease: "power3.out" });
        ensureFlash();
        if (flashSprite) {
          gsap.fromTo(flashSprite.scale, { x: 0.4, y: 0.4, z: 1 }, { x: 5.4, y: 5.4, z: 1, duration: 0.8, ease: "power2.out" });
          gsap.fromTo(flashSprite.material, { opacity: 0.85 }, { opacity: 0, duration: 0.8, ease: "power2.out" });
        }
      }
    }
  };
  const old = currentWatch;
  if (old) {
    swapBusy = true;
    const fin = () => {
      S3.watchHold!.remove(old);
      disposeWatch(old);
      build();
      swapBusy = false;
      if (pendingSwap) {
        const p = pendingSwap;
        pendingSwap = null;
        swapWatch(p.model, p.cfg, p.opts ?? {});
      }
    };
    if (!reduced) {
      gsap
        .timeline({ onComplete: fin })
        .to(old.userData, { swapY: "+=2.4", duration: 0.45, ease: "power2.in" }, 0)
        .to(old.scale, { x: 0.6, y: 0.6, z: 0.6, duration: 0.45, ease: "power2.in" }, 0);
    } else {
      fin();
    }
  } else {
    build();
  }
}

/* ── live configuration patching ── */

const METAL_ROLES = ["caseM", "polish", "gold", "hands", "braceA", "braceB"] as const;

export function applyConfigPatch(model: WatchModel, cfg: Cfg, animate: boolean): void {
  const w = currentWatch;
  if (!w || w.userData.model.id !== model.id) return;
  const k = w.userData.cfgKey;
  const M = w.userData.M;
  const reduced = prefersReduced();
  const soft = animate && !reduced;
  const flash = () => {
    if (!soft) return;
    ensureFlash();
    if (flashSprite) gsap.fromTo(flashSprite.material, { opacity: 0.3 }, { opacity: 0, duration: 0.6, ease: "power2.out" });
  };

  if (k.dial !== cfg.dial) {
    k.dial = cfg.dial;
    const oldTex = M.dial.map;
    M.dial.map = makeDialTexture(model, cfg);
    M.dial.needsUpdate = true;
    if (oldTex) oldTex.dispose();
    flash();
  }
  if (k.bezel !== cfg.bezel) {
    k.bezel = cfg.bezel;
    const set = BEZEL_SETS[model.bezel];
    const opt = set.find((b) => b.id === cfg.bezel) ?? set[0];
    if (M.ceramic) {
      const c = new THREE.Color(opt.ceramic ?? "#0b0e12");
      if (soft) gsap.to(M.ceramic.color, { r: c.r, g: c.g, b: c.b, duration: 0.6, ease: "power2.out" });
      else M.ceramic.color.copy(c);
    }
    const bezG = w.userData.parts.bezel;
    const oldIns = bezG.children.find((c) => (c.userData as { isInsert?: boolean }).isInsert);
    if (oldIns) {
      bezG.remove(oldIns);
      const meshOld = oldIns as THREE.Mesh;
      meshOld.geometry?.dispose();
      const matOld = meshOld.material as THREE.Material & { map?: THREE.Texture | null };
      if (matOld?.map) matOld.map.dispose();
      matOld?.dispose();
    }
    if (model.bezel !== "fluted") {
      let texMap: THREE.CanvasTexture;
      if (model.bezel === "dive") texMap = makeInsertFor("dive", opt);
      else if (model.bezel === "gmt") texMap = makeInsertFor("gmt", opt);
      else texMap = makeInsertFor("tachy", opt);
      const ins = new THREE.Mesh(
        new THREE.RingGeometry(0.655, 0.875, isMobile() ? 64 : 96),
        new THREE.MeshStandardMaterial({ map: texMap, transparent: true, roughness: 0.24, metalness: 0.15, envMapIntensity: 1.1 })
      );
      ins.position.z = 0.306;
      ins.userData.isInsert = true;
      if (soft) gsap.fromTo(ins.material, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" });
      bezG.add(ins);
    }
    flash();
  }
  if (k.metal !== cfg.metal) {
    k.metal = cfg.metal;
    const newM = buildMaterials(model, { ...cfg });
    const used = new Set<THREE.Material>();
    w.traverse((o) => {
      const role = (o.userData as { role?: string }).role;
      if (role && (METAL_ROLES as readonly string[]).includes(role)) {
        const m = (newM as unknown as Record<string, THREE.Material>)[role];
        if (m) {
          (o as THREE.Mesh).material = m;
          used.add(m);
        }
      }
    });
    const oldMats = new Set<THREE.Material>();
    w.traverse((o) => {
      const role = (o.userData as { role?: string }).role;
      if (role && (METAL_ROLES as readonly string[]).includes(role)) {
        const mm = (o as THREE.Mesh).material as THREE.Material;
        if (mm && !used.has(mm)) oldMats.add(mm);
      }
    });
    oldMats.forEach((m) => {
      const wm = m as THREE.Material & { map?: THREE.Texture | null };
      if (wm.map) wm.map.dispose();
      m.dispose();
    });
    (Object.keys(newM) as Array<keyof MaterialSet>).forEach((key) => {
      const m = newM[key];
      if (m instanceof THREE.Material && !used.has(m)) {
        const wm = m as THREE.Material & { map?: THREE.Texture | null };
        if (wm.map) wm.map.dispose();
        m.dispose();
      }
    });
    /* keep the shared dial texture alive (it belongs to M.dial which is reused) */
    flash();
  }
  if (k.bracelet !== cfg.bracelet) {
    k.bracelet = cfg.bracelet;
    (["braceTop", "braceBot"] as const).forEach((name, i) => {
      const part = w.userData.parts[name];
      const olds: THREE.Object3D[] = [];
      part.traverse((o) => olds.push(o));
      part.clear();
      olds.forEach((o) => {
        const g = (o as THREE.Mesh).geometry;
        if (g) g.dispose();
      });
      part.add(buildStrap(M, cfg, i === 0 ? 1 : -1, !isMobile()));
    });
    flash();
  }
  w.userData.cfg = { ...cfg };
}

/* local re-export to avoid a circular import from assets at patch time */
/* local re-export to avoid circulars at patch time */
import { makeDialTexture, makeDiveInsert, makeGmtInsert, makeTachyInsert } from "./assets";

type InsertOpt = { ceramic?: string; a?: string; b?: string };
function makeInsertFor(kind: "dive" | "gmt" | "tachy", opt: InsertOpt): THREE.CanvasTexture {
  if (kind === "dive") return makeDiveInsert(opt);
  if (kind === "gmt") return makeGmtInsert(opt);
  return makeTachyInsert(opt);
}

export { type WatchRoot };
