/** Geometry of the tab row the sliding indicator moves along. */
export interface TabIndicatorLayout {
  /** Width of one tab item. */
  itemWidth: number;
  /** Space between tab items. */
  gap: number;
  /** Space before the first tab item. */
  padding: number;
  count: number;
}

/** Left edge of the indicator when it rests on the tab at `index`. */
export function indicatorRestX(index: number, layout: TabIndicatorLayout): number {
  'worklet';
  return layout.padding + index * (layout.itemWidth + layout.gap);
}

/** Keeps a dragged indicator between the first and last tab. */
export function clampIndicatorX(x: number, layout: TabIndicatorLayout): number {
  'worklet';
  const min = indicatorRestX(0, layout);
  const max = indicatorRestX(Math.max(0, layout.count - 1), layout);
  return Math.min(max, Math.max(min, x));
}

/** The tab whose resting position is closest to the indicator's left edge. */
export function nearestTabIndex(x: number, layout: TabIndicatorLayout): number {
  'worklet';
  const step = layout.itemWidth + layout.gap;
  if (step <= 0 || layout.count <= 0) return 0;
  const index = Math.round((x - layout.padding) / step);
  return Math.min(layout.count - 1, Math.max(0, index));
}

/** Whether a touch at `touchX` (row coordinates) is on the indicator at `indicatorX`. */
export function isTouchOnIndicator(
  touchX: number,
  indicatorX: number,
  itemWidth: number
): boolean {
  'worklet';
  return touchX >= indicatorX && touchX <= indicatorX + itemWidth;
}
