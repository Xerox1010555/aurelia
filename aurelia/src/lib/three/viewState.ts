/**
 * View composition + shared motion state.
 * `view` is written by the scroll choreography and read every engine tick.
 * `motion.spinTarget` toggles idle auto-spin per scroll pose (legacy parity).
 */
export interface ViewState {
  camZ: number;
  wX: number;
  wY: number;
  wScale: number;
  rotY: number;
  rotX: number;
  /** 0 = assembled, 1 = fully exploded anatomy */
  ex: number;
}

export const view: ViewState = { camZ: 6.6, wX: 0, wY: 0, wScale: 1, rotY: -0.55, rotX: -0.1, ex: 0 };

export const motion = {
  /** idle spin speed (rad/s) */
  spinTarget: 0.22,
};

/** Intro state — tweened by the welcome reveal inside WatchStage. */
export const intro = { s: 0.001, y: -0.55 };

export function resetViewPose(desktop: boolean): void {
  if (desktop) Object.assign(view, { camZ: 6.6, wX: 0, wY: 0, wScale: 1, rotY: -0.55, rotX: -0.1, ex: 0 });
  else Object.assign(view, { camZ: 6.6, wX: 0, wY: 0, wScale: 1, rotY: -0.55, rotX: -0.1, ex: 0 });
}

export const TAU = Math.PI * 2;
