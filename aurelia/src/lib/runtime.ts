/** Client-env probes with SSR-safe guards. Call at render/effect time, not at module init. */

export function mq(query: string): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(query).matches;
}

export const isFine = () => mq("(pointer:fine)");
export const isTouch = () => mq("(pointer:coarse)");
export const prefersReduced = () => mq("(prefers-reduced-motion: reduce)");
export const isMobile = () => mq("(max-width: 900px)") || isTouch();

export function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl") || c.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}
