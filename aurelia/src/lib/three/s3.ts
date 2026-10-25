import type * as THREE from "three";

/**
 * Shared scene state — the direct port of the legacy `S3` singleton.
 * Populated by engine.boot3D(); consumed by builder.ts / choreography.ts.
 */
export interface S3State {
  ready: boolean;
  renderer: THREE.WebGLRenderer | null;
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  maxAniso: number;
  envTex: THREE.Texture | null;
  parts: THREE.Points | null;
  glow: THREE.Sprite[];
  watchRig: THREE.Group | null;
  watchHold: THREE.Group | null;
  canvas: HTMLCanvasElement | null;
}

export const S3: S3State = {
  ready: false,
  renderer: null,
  scene: null,
  camera: null,
  maxAniso: 1,
  envTex: null,
  parts: null,
  glow: [],
  watchRig: null,
  watchHold: null,
  canvas: null,
};
