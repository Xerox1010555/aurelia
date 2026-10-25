/**
 * Marks the moment zustand `persist` rehydration (plus route-locale adoption
 * and shared-URL config intake) has finished. WatchStage awaits this before
 * booting the 3D scene with the *final* model/cfg — preventing double swaps.
 */
let resolver: (() => void) | null = null;
const promise = new Promise<void>((res) => {
  resolver = res;
});

export const hydration = {
  promise,
  done() {
    resolver?.();
    resolver = null;
  },
};
