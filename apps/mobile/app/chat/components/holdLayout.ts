export interface HoldAnchor {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
}

export interface HoldViewport {
  screenH: number;
  usableTop: number;
  usableBottom: number;
}

export interface HoldLayout {
  /** Menu top: always centered in the usable viewport. */
  menuTop: number;
  /** Bubble top: original position, or fallback when colliding. */
  bubbleTop: number;
  /** True when the bubble had to move (drives the shift animation). */
  bubbleMoved: boolean;
}

const GAP = 8;

/**
 * Hold-stack positioning.
 *
 * Priority: (1) the bubble keeps its measured position; (2) the menu is
 * centered in the usable viewport; (3) the bubble moves ONLY on overlap
 * with the menu or viewport breach, to the nearest free side.
 *
 * The bubble and card share the same side alignment, so any vertical-range
 * intersection (plus the spacing gap) counts as a collision.
 */
export function computeHoldLayout(
  anchor: HoldAnchor,
  menuH: number,
  viewport: HoldViewport
): HoldLayout {
  const { usableTop, usableBottom } = viewport;
  const usableH = usableBottom - usableTop;

  // Menu owns its logic: centered in the usable viewport, clamped inside it.
  const menuTop = Math.max(
    usableTop,
    Math.min(usableTop + (usableH - menuH) / 2, usableBottom - menuH)
  );
  const menuBottom = menuTop + menuH;

  const bubbleH = anchor.height;
  const origTop = anchor.pageY;

  const overlapsMenu =
    origTop + bubbleH + GAP > menuTop && origTop < menuBottom + GAP;
  const breachesViewport =
    origTop < usableTop || origTop + bubbleH > usableBottom;

  if (!overlapsMenu && !breachesViewport) {
    return { menuTop, bubbleTop: origTop, bubbleMoved: false };
  }

  // Fallback: nearest free side — above the menu when the bubble's center
  // sits above the menu's center, else below. Clamped to usable bounds.
  const bubbleCenter = origTop + bubbleH / 2;
  const menuCenter = menuTop + menuH / 2;
  const aboveTop = menuTop - GAP - bubbleH;
  const belowTop = menuBottom + GAP;
  const bubbleTop =
    bubbleCenter <= menuCenter
      ? Math.max(usableTop, aboveTop)
      : Math.min(belowTop, usableBottom - bubbleH);

  return { menuTop, bubbleTop, bubbleMoved: true };
}
