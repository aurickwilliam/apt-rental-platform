import type { TutorialPortal } from '@repo/utils';

import type { TutorialRect } from './targetRegistry';

export interface CalloutInput {
  /** The spotlight box (target plus padding), or null when there is no target. */
  hole: TutorialRect | null;
  window: { width: number; height: number };
  insets: { top: number; bottom: number };
  maxCardWidth?: number;
}

export interface CalloutLayout {
  /** `above` / `below` hover next to the target with an arrow; `floating` has no target. */
  placement: 'above' | 'below' | 'floating';
  left: number;
  width: number;
  /** Distance from the card's left edge to the arrow's center. */
  arrowCenter: number | null;
  /** Vertical anchor: `bottom` for a card above the target, `top` for one below. */
  top?: number;
  bottom?: number;
}

const SIDE_MARGIN = 16;
const ARROW_GAP = 14;
const ARROW_EDGE_INSET = 24;
const DEFAULT_MAX_CARD_WIDTH = 360;

/**
 * Where the tutorial card hovers: on the side of the target with more room
 * (above a bottom tab bar, below a header button), horizontally centered on the
 * target and kept inside the screen, with an arrow that still points at the
 * target after the card is clamped. With no target the card floats at the
 * bottom of the screen.
 */
export function computeCalloutLayout({
  hole,
  window,
  insets,
  maxCardWidth = DEFAULT_MAX_CARD_WIDTH,
}: CalloutInput): CalloutLayout {
  const width = Math.min(maxCardWidth, window.width - SIDE_MARGIN * 2);
  const clampLeft = (left: number) =>
    Math.min(Math.max(left, SIDE_MARGIN), window.width - SIDE_MARGIN - width);

  if (!hole) {
    return {
      placement: 'floating',
      left: clampLeft((window.width - width) / 2),
      width,
      arrowCenter: null,
      bottom: Math.max(insets.bottom, SIDE_MARGIN) + 8,
    };
  }

  const centerX = hole.x + hole.width / 2;
  const left = clampLeft(centerX - width / 2);
  const arrowCenter = Math.min(
    Math.max(centerX - left, ARROW_EDGE_INSET),
    width - ARROW_EDGE_INSET,
  );
  const targetCenterY = hole.y + hole.height / 2;

  if (targetCenterY > window.height / 2) {
    return {
      placement: 'above',
      left,
      width,
      arrowCenter,
      bottom: window.height - hole.y + ARROW_GAP,
    };
  }
  return {
    placement: 'below',
    left,
    width,
    arrowCenter,
    top: hole.y + hole.height + ARROW_GAP,
  };
}

// The iOS tab bar is native, so its buttons cannot be measured. Its items
// share the bar's width evenly, which is enough to point at the right one.
const TAB_ORDER: Record<TutorialPortal, readonly string[]> = {
  tenant: ['rentals', 'search', 'chat', 'profile'],
  landlord: ['dashboard', 'units', 'chat', 'profile'],
};

const NATIVE_TAB_BAR_HEIGHT = 62;
/** The floating bar sits this far above the bottom safe area's edge. */
const NATIVE_TAB_BAR_BOTTOM_OVERLAP = 13;
const NATIVE_TAB_BAR_SIDE_INSET = 20;

/** Estimated box of a native tab button, or null for a tab that is not in the bar. */
export function estimateNativeTabRect(
  portal: TutorialPortal,
  tab: string | null,
  window: { width: number; height: number },
  insets: { bottom: number },
): TutorialRect | null {
  if (!tab) return null;
  const tabs = TAB_ORDER[portal];
  const index = tabs.indexOf(tab);
  if (index === -1) return null;

  const barWidth = window.width - NATIVE_TAB_BAR_SIDE_INSET * 2;
  const itemWidth = barWidth / tabs.length;
  return {
    x: NATIVE_TAB_BAR_SIDE_INSET + itemWidth * index,
    y: window.height - Math.max(insets.bottom - NATIVE_TAB_BAR_BOTTOM_OVERLAP, 8) - NATIVE_TAB_BAR_HEIGHT,
    width: itemWidth,
    height: NATIVE_TAB_BAR_HEIGHT,
  };
}
