// Start as the panel enters, finish with its centre at 45% of the viewport.
// Travel = half the panel height + half the viewport, with no added page height.
export const MANAGE_SCROLL_OFFSETS = ["start 0.95", "center 0.45"] as const;
export const MANAGE_SCROLL_MAP = {
  // Rental management is readable before messaging starts; both rest from 80% onward.
  dashboardOpacity: { progress: [0, 0.24], values: [0, 1] },
  dashboardX: { progress: [0, 0.5], values: [-16, 0] },
  dashboardY: { progress: [0, 0.5], values: [32, 0] },
  dashboardScale: { progress: [0, 0.5], values: [0.98, 1] },
  chatOpacity: { progress: [0.3, 0.6], values: [0, 1] },
  chatX: { progress: [0.3, 0.8], values: [18, 0] },
  chatY: { progress: [0.3, 0.8], values: [36, 0] },
  chatScale: { progress: [0.3, 0.8], values: [0.98, 1] },
};

export function manageScrollProgress(top: number, viewportHeight: number, panelHeight: number) {
  if (viewportHeight <= 0 || panelHeight <= 0) return 1;
  const travel = (viewportHeight + panelHeight) / 2;
  return Math.max(0, Math.min(1, (viewportHeight * 0.95 - top) / travel));
}
