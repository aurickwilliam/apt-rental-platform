// Native ScrollView geometry, not evidence of reading or policy acceptance.
export interface PolicyReadingMeasurements {
  viewportHeight: number;
  contentHeight: number;
  endY: number;
  offsetY: number;
}

export const POLICY_SCROLL_TOLERANCE = 2;

export function isPolicyLayoutReady(value: PolicyReadingMeasurements): boolean {
  return [value.viewportHeight, value.contentHeight, value.endY, value.offsetY].every(Number.isFinite)
    && value.viewportHeight > 0
    && value.contentHeight > 0
    && value.endY > 0
    && value.contentHeight + POLICY_SCROLL_TOLERANCE >= value.endY;
}

export function hasReachedPolicyEnd(value: PolicyReadingMeasurements): boolean {
  return isPolicyLayoutReady(value)
    && Math.max(0, value.offsetY) + value.viewportHeight >= value.contentHeight - POLICY_SCROLL_TOLERANCE;
}
