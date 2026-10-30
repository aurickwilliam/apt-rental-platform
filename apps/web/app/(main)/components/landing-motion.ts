export const LANDING_EASE = [0.22, 1, 0.36, 1] as const;
export const LANDING_REVEAL_DURATION = 0.56;
export const LANDING_VIEWPORT = { once: true, amount: 0.15 } as const;

const DISCOVER_VIEWPORT_START = 0.95;
const DISCOVER_VIEWPORT_END = 0.45;
// Local travel = half the viewport + half the panel; finish while it is still in view.
export const DISCOVER_SCROLL_OFFSETS = [`start ${DISCOVER_VIEWPORT_START}`, `center ${DISCOVER_VIEWPORT_END}`] as const;
export const DISCOVER_SCROLL_MAP = {
  // Establish browsing first; the larger details travel follows without spring lag.
  backOpacity: { progress: [0, 0.22], values: [0, 1] },
  backY: { progress: [0, 0.6], values: [48, 0] },
  backScale: { progress: [0, 0.6], values: [0.96, 1] },
  frontOpacity: { progress: [0.3, 0.6], values: [0, 1] },
  frontX: { progress: [0.3, 0.8], values: [44, 0] },
  frontY: { progress: [0.3, 0.8], values: [76, 0] },
  frontScale: { progress: [0.3, 0.8], values: [0.92, 1] },
};

export function discoverScrollProgress(top: number, viewportHeight: number, panelHeight: number) {
  if (viewportHeight <= 0 || panelHeight <= 0) return 1;
  const travel = panelHeight / 2 + viewportHeight * (DISCOVER_VIEWPORT_START - DISCOVER_VIEWPORT_END);
  return Math.max(0, Math.min(1, (viewportHeight * DISCOVER_VIEWPORT_START - top) / travel));
}

/** Hold staggered elements at their first frame without delaying the animation's start. */
export function landingReveal(delay = 0, distance = 12, scaleFrom = 1, entranceDuration = LANDING_REVEAL_DURATION) {
  const duration = entranceDuration + delay;
  return {
    target: {
      opacity: delay ? [0, 0, 1] : [0, 1],
      y: delay ? [distance, distance, 0] : [distance, 0],
      scale: delay ? [scaleFrom, scaleFrom, 1] : [scaleFrom, 1],
    },
    transition: {
      duration,
      // Ease only the moving segment so the browser doesn't compress the stagger hold.
      ease: delay ? ["linear" as const, LANDING_EASE] : LANDING_EASE,
      times: delay ? [0, delay / duration, 1] : [0, 1],
    },
  };
}
