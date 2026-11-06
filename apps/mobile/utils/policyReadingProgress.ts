// Native ScrollView geometry, not evidence of reading or policy acceptance.
export interface PolicyReadingMeasurements {
  viewportHeight: number;
  contentHeight: number;
  endY: number;
  offsetY: number;
}

export const POLICY_SCROLL_TOLERANCE = 2;
export const POLICY_SCROLL_BOTTOM_PADDING = 16;

export function isPolicyLayoutReady(value: PolicyReadingMeasurements): boolean {
  return [value.viewportHeight, value.contentHeight, value.endY, value.offsetY].every(Number.isFinite)
    && value.viewportHeight > 0
    && value.contentHeight > 0
    && value.endY > 0
    // Match the trailing marker to this layout, not a marker from before text
    // reflow. The only space after it is the reader's decorative bottom padding.
    && Math.abs(value.contentHeight - value.endY - POLICY_SCROLL_BOTTOM_PADDING) <= POLICY_SCROLL_TOLERANCE;
}

export function hasReachedPolicyEnd(value: PolicyReadingMeasurements): boolean {
  return isPolicyLayoutReady(value)
    && Math.max(0, value.offsetY) + value.viewportHeight >= value.endY - POLICY_SCROLL_TOLERANCE;
}
