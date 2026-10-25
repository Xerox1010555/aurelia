/**
 * THREE core engine — renderer, studio environment, lights, atmosphere,
 * render loop, pointer input. Direct port of legacy module 03/06 to three ≥ 0.180.
 */
import * as THREE from "three";
import { gsap } from "gsap";
import { isMobile, prefersReduced, isFine } from "@/lib/runtime";
import { S3 } from "./s3";
import { view, intro, motion } from "./viewState";
import { applyExplode, disposeWatch, currentWatchModel } from "./builder";

const TAU = Math.PI * 2;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

let rafId: number | null = null;
let running = false;
let lastT = 0;
let disposeGuard = false;

const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
const drag = { on: false, lastX: 0, lastY: 0, vel: 0, y: 0, pinch: 0 };
let spinAuto = 0;

/* ── studio environment (soft-box PMREM) ── */

function buildStudioEnvironment(): void {
  const env = new THREE.Scene();
  const panel = (w: number, h: number, color: THREE.Color, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  env.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(20, 16, 12),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(0.012, 0.012, 0.014), side: THREE.BackSide })
    )
  );
  panel(9, 4.5, new THREE.Color(7, 7, 7), 0, 6.5, 1.5);
  panel(2.2, 11, new THREE.Color(4.4, 3.4, 1.9), -7, 1.2, 2.5);
  panel(2.2, 11, new THREE.Color(1.5, 2.0, 3.1), 7, 0.4, -1.0);
  panel(6, 2.4, new THREE.Color(1.4, 1.4, 1.5), 0, -1.2, 6.5);
  panel(4, 4, new THREE.Color(0.55, 0.62, 0.55), 1, 2.0, -6.0);
  if (!S3.renderer) return;
  const pmrem = new THREE.PMREMGenerator(S3.renderer);
  const rt = pmrem.fromScene(env, 0.035);
  S3.scene!.environment = rt.texture;
  S3.envTex = rt.texture;
  pmrem.dispose();
}

function buildLights(): void {
  const key = new THREE.SpotLight(0xfff1da, 4.7, 40, 0.65, 0.9, 1.2);
  key.position.set(3.6, 5.2, 4.6);
  const mobile = isMobile();
  if (!mobile) {
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0004;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 20;
  }
  S3.scene!.add(key);
  S3.scene!.add(key.target);

  const rim = new THREE.DirectionalLight(0xd8b46a, 1.35);
  rim.position.set(-4.4, 2.4, -3.6);
  const fill = new THREE.DirectionalLight(0x9db8d9, 0.38);
  fill.position.set(-2.2, -1.4, 4.2);
  const amb = new THREE.AmbientLight(0x232326, 0.65);
  S3.scene!.add(rim, fill, amb);
}

function buildFloor(): void {
  if (isMobile()) return;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.3 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.75;
  floor.receiveShadow = true;
  S3.scene!.add(floor);
}

/* gold dust */
function buildParticles(): void {
  const COUNT = isMobile() ? 130 : 340;
  const cnv = document.createElement("canvas");
  cnv.width = cnv.height = 64;
  const ctx = cnv.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,240,200,1)");
  g.addColorStop(0.35, "rgba(232,205,130,.55)");
  g.addColorStop(1, "rgba(201,169,97,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const spriteTex = new THREE.CanvasTexture(cnv);
  spriteTex.colorSpace = THREE.SRGBColorSpace;

  const pos = new Float32Array(COUNT * 3);
  const spd = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 11;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 6.5;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 4.5 - 0.5;
    spd[i] = 0.05 + Math.random() * 0.14;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.045,
    map: spriteTex,
    color: 0xc9a961,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  S3.parts = new THREE.Points(geo, mat);
  S3.parts.userData = { spd, base: pos.slice() };
  S3.scene!.add(S3.parts);
}

/* fake bloom sprites */
function buildGlow(): void {
  const cnv = document.createElement("canvas");
  cnv.width = cnv.height = 256;
  const ctx = cnv.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(201,169,97,.34)");
  g.addColorStop(0.5, "rgba(160,130,70,.10)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mk = (scale: number, x: number, y: number, z: number, op: number) => {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    s.scale.set(scale, scale, 1);
    s.position.set(x, y, z);
    S3.scene!.add(s);
    return s;
  };
  S3.glow = [mk(9.5, 0, 0.4, -2.6, 0.55), mk(5, -4.2, 2.6, -3.2, 0.22), mk(4, 4.4, -2.2, -3.4, 0.16)];
}

export function disposeThree(): void {
  if (disposeGuard || !S3.ready) return;
  disposeGuard = true;
  S3.scene?.traverse((o) => {
    const anyO = o as THREE.Mesh;
    if (anyO.geometry) anyO.geometry?.dispose();
    if (anyO.material) {
      const ms = Array.isArray(anyO.material) ? anyO.material : [anyO.material];
      ms.forEach((m) => {
        const wm = m as THREE.Material & { map?: THREE.Texture | null };
        if (wm.map && wm.map !== S3.envTex) wm.map.dispose();
        m.dispose();
      });
    }
  });
  S3.scene?.clear();
  S3.renderer?.dispose();
  S3.ready = false;
  disposeGuard = false;
}

/* ── init ── */

export function initThree(canvas: HTMLCanvasElement): boolean {
  try {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isMobile(),
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.75 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    if (!isMobile()) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    S3.renderer = renderer;
    S3.maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;
    S3.canvas = canvas;

    S3.scene = new THREE.Scene();
    S3.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 60);
    S3.camera.position.set(0, 0, 6.6);

    canvas.addEventListener(
      "webglcontextlost",
      (e) => {
        e.preventDefault();
        stopLoop();
        disposeThree();
        document.documentElement.classList.add("no-webgl");
        console.warn("[AURELIA] WebGL context lost — static fallback engaged.");
      },
      false
    );

    buildStudioEnvironment();
    buildLights();
    buildFloor();
    buildParticles();
    buildGlow();

    if (!S3.watchRig) {
      S3.watchRig = new THREE.Group();
      S3.watchHold = new THREE.Group();
      S3.watchRig.add(S3.watchHold);
      S3.scene.add(S3.watchRig);
    }
    S3.ready = true;
    return true;
  } catch (err) {
    console.warn("3D disabled:", err instanceof Error ? err.message : err);
    S3.ready = false;
    return false;
  }
}

export function resizeThree(): void {
  if (!S3.ready || !S3.camera || !S3.renderer) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  S3.camera.aspect = w / h;
  S3.camera.updateProjectionMatrix();
  S3.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.75 : 2));
  S3.renderer.setSize(w, h, false);
}

/* ── loop ── */

function tick(now: number): void {
  rafId = requestAnimationFrame(tick);
  const t = now / 1000;
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  const w = currentWatchModel();

  mouse.x += (mouse.tx - mouse.x) * 0.06;
  mouse.y += (mouse.ty - mouse.y) * 0.06;
  spinAuto += dt * motion.spinTarget * (prefersReduced() ? 0 : 1);
  if (!drag.on && Math.abs(drag.vel) > 0.0002) {
    drag.y += drag.vel;
    drag.vel *= 0.94;
  }

  const rig = S3.watchRig;
  const hold = S3.watchHold;
  if (rig && hold) {
    const reduced = prefersReduced();
    const bob = reduced ? 0 : Math.sin(t * 0.9) * 0.045;
    rig.position.set(view.wX + mouse.x * 0.07, view.wY + mouse.y * 0.05 + bob + intro.y, 0);
    rig.scale.setScalar(Math.max(0.001, view.wScale * intro.s));
    hold.rotation.y = view.rotY + mouse.x * 0.16;
    hold.rotation.x = view.rotX + mouse.y * 0.12;
  }
  if (S3.camera) {
    S3.camera.position.set(0, 0, view.camZ + drag.pinch);
    S3.camera.lookAt(0, 0, 0);
  }

  if (w && S3.watchHold) {
    const watch = S3.watchHold.children.find((c) => (c as { userData?: { model?: { id?: string } } }).userData?.model) as import("./builder").WatchRoot | undefined;
    if (watch) {
      watch.userData.spin.rotation.y = spinAuto + drag.y + watch.userData.swapY;
      if (!swapBusyExternal()) watch.userData.parts.bezel.rotation.z = Math.sin(t * 0.35) * 0.05;
      applyExplode(watch, view.ex);
      watch.userData.update(new Date(), t);
    }
  }

  if (S3.parts && !prefersReduced()) {
    const posAttr = S3.parts.geometry.attributes.position as THREE.BufferAttribute;
    const spd = (S3.parts.userData as { spd: Float32Array }).spd;
    for (let i = 0; i < spd.length; i++) {
      let py = posAttr.getY(i) + spd[i] * dt;
      if (py > 3.4) py = -3.4;
      posAttr.setY(i, py);
      posAttr.setX(i, posAttr.getX(i) + Math.sin(t * 0.55 + i * 1.7) * 0.0006);
    }
    posAttr.needsUpdate = true;
    S3.parts.rotation.y = t * 0.01;
  }

  if (S3.renderer && S3.scene && S3.camera) S3.renderer.render(S3.scene, S3.camera);
}

let isSwapBusy = false;
export function setSwapBusy(v: boolean): void {
  isSwapBusy = v;
}
function swapBusyExternal(): boolean {
  return isSwapBusy;
}

export function startLoop(): void {
  if (running || !S3.ready || document.hidden) return;
  running = true;
  lastT = performance.now();
  rafId = requestAnimationFrame(tick);
}

export function stopLoop(): void {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

/* ── pointer input: parallax, drag-to-rotate, pinch-to-zoom ── */

export function bindInput(zone: HTMLElement | null): void {
  if (!zone) return;
  if (isFine()) {
    window.addEventListener(
      "mousemove",
      (e) => {
        mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
      },
      { passive: true }
    );
  }
  const ptrs = new Map<number, PointerEvent>();
  let pinchD0 = 0;
  let pinchZ0 = 0;
  zone.addEventListener("pointerdown", (e) => {
    zone.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, e);
    if (ptrs.size === 1) {
      drag.on = true;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      drag.vel = 0;
    }
    if (ptrs.size === 2) {
      const p = [...ptrs.values()];
      pinchD0 = Math.hypot(p[0].clientX - p[1].clientX, p[0].clientY - p[1].clientY);
      pinchZ0 = drag.pinch;
    }
  });
  zone.addEventListener("pointermove", (e) => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, e);
    if (ptrs.size === 2 && pinchD0) {
      const p = [...ptrs.values()];
      const d = Math.hypot(p[0].clientX - p[1].clientX, p[0].clientY - p[1].clientY);
      drag.pinch = clamp(pinchZ0 - (d - pinchD0) * 0.008, -1.3, 1.7);
      return;
    }
    if (!drag.on) return;
    const dx = e.clientX - drag.lastX;
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
    drag.y += dx * 0.006;
    drag.vel = dx * 0.006;
  });
  const up = (e: PointerEvent) => {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinchD0 = 0;
    if (!ptrs.size) drag.on = false;
  };
  zone.addEventListener("pointerup", up);
  zone.addEventListener("pointercancel", up);
}

/* ── theme dimming (legacy setTheme parity) ── */

export function applyThemeToScene(theme: "dark" | "light"): void {
  if (S3.parts) (S3.parts.material as THREE.PointsMaterial).opacity = theme === "light" ? 0.3 : 0.5;
  if (S3.glow.length) {
    S3.glow.forEach((s, i) => {
      (s.material as THREE.SpriteMaterial).opacity =
        (theme === "light" ? [0.16, 0.07, 0.05] : [0.55, 0.22, 0.16])[i] ?? 0.2;
    });
  }
}

export { view, intro, motion, TAU, disposeWatch };
