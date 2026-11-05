/** Scroll offset below which the bar is always shown. */
export const TAB_BAR_ALWAYS_SHOW_OFFSET = 48;

/** Downward travel (px) before the bar hides. */
export const TAB_BAR_HIDE_DISTANCE = 12;

/** Upward travel (px) before the bar returns. */
export const TAB_BAR_SHOW_DISTANCE = 8;

/** Distance from the bottom edge (px) within which the bar is always shown. */
export const TAB_BAR_BOTTOM_EDGE = 48;

export interface TabBarScrollSample {
  prevY: number;
  y: number;
  contentHeight: number;
  layoutHeight: number;
  hidden: boolean;
}

/**
 * Decides whether the floating tab bar should be hidden for a scroll event.
 * Hides on downward scroll, returns on upward scroll or at the top/bottom
 * edge. Overscroll (rubber-banding) never changes the state.
 */
export function nextTabBarVisibility({
  prevY,
  y,
  contentHeight,
  layoutHeight,
  hidden,
}: TabBarScrollSample): boolean {
  const maxY = Math.max(0, contentHeight - layoutHeight);

  // Nothing to scroll: the bar has no reason to hide.
  if (maxY === 0) return false;

  // Rubber-band overscroll at either end: keep the current state.
  if (y < 0 || (maxY > 0 && y > maxY)) {
    return y < 0 ? false : hidden;
  }

  if (y <= TAB_BAR_ALWAYS_SHOW_OFFSET) return false;
  if (maxY > 0 && maxY - y <= TAB_BAR_BOTTOM_EDGE) return false;

  const delta = y - prevY;
  if (delta >= TAB_BAR_HIDE_DISTANCE) return true;
  if (delta <= -TAB_BAR_SHOW_DISTANCE) return false;
  return hidden;
}
