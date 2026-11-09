import { hasReachedPolicyEnd, isPolicyLayoutReady, POLICY_SCROLL_TOLERANCE } from "./policyReadingProgress";

const measured = { viewportHeight: 400, contentHeight: 1200, endY: 1184, offsetY: 0 };

it("requires real viewport, content and trailing-marker measurements before unlocking", () => {
  expect(isPolicyLayoutReady(measured)).toBe(true);
  for (const key of ["viewportHeight", "contentHeight", "endY"] as const) {
    for (const value of [0, -1, NaN, Infinity]) {
      expect(hasReachedPolicyEnd({ ...measured, [key]: value, offsetY: 1200 })).toBe(false);
    }
  }
  expect(isPolicyLayoutReady({ ...measured, contentHeight: 100, endY: 1184 })).toBe(false);
  expect(hasReachedPolicyEnd({ ...measured, offsetY: NaN })).toBe(false);
});

it("accepts the real end marker without requiring blank padding, tolerates rounding, and handles short documents", () => {
  expect(hasReachedPolicyEnd(measured)).toBe(false);
  expect(hasReachedPolicyEnd({ ...measured, offsetY: 783 - POLICY_SCROLL_TOLERANCE })).toBe(false);
  expect(hasReachedPolicyEnd({ ...measured, offsetY: 784 - POLICY_SCROLL_TOLERANCE })).toBe(true);
  expect(hasReachedPolicyEnd({ ...measured, offsetY: 800 })).toBe(true);
  expect(hasReachedPolicyEnd({ ...measured, contentHeight: 300, endY: 284 })).toBe(true);
  expect(hasReachedPolicyEnd({ ...measured, offsetY: -80 })).toBe(false);
});

it("rejects a trailing marker from before content reflow until both measurements agree", () => {
  expect(isPolicyLayoutReady({ ...measured, contentHeight: 1800 })).toBe(false);
  expect(hasReachedPolicyEnd({ ...measured, contentHeight: 1800, offsetY: 800 })).toBe(false);
  expect(isPolicyLayoutReady({ ...measured, contentHeight: 1800, endY: 1784 })).toBe(true);
  expect(hasReachedPolicyEnd({ ...measured, contentHeight: 1800, endY: 1784, offsetY: 800 })).toBe(false);
});
