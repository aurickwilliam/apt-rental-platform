import { isReviewStayEligible } from "./reviewEligibility";

describe("review stay eligibility shared by web and mobile", () => {
  const now = new Date("2026-10-24T12:00:00Z");
  it.each([
    ["2026-07-24", null, true],
    ["2026-07-25", null, false],
    ["2026-10-20", "2026-10-24", true],
    ["2026-10-20", "2026-10-25", false],
    ["2026-10-20", null, false],
    [null, "2026-10-20", false],
    ["bad-date", null, false],
    ["2026-02-30", null, false],
    ["2026-10-20", "bad-date", false],
    ["2026-07-24T00:00:00Z", null, true],
  ])("start %s, end %s -> %s", (start, end, expected) => {
    expect(isReviewStayEligible(start, end, now)).toBe(expected);
  });
  it("clamps month subtraction like PostgreSQL rather than rolling into March", () => {
    expect(isReviewStayEligible("2026-03-01", null, new Date("2026-05-31T12:00:00Z"))).toBe(false);
    expect(isReviewStayEligible("2026-02-28", null, new Date("2026-05-31T12:00:00Z"))).toBe(true);
    expect(isReviewStayEligible("2024-02-29", null, new Date("2024-05-31T12:00:00Z"))).toBe(true);
  });
  it("handles year boundaries and invalid clocks", () => {
    expect(isReviewStayEligible("2025-11-24", null, new Date("2026-02-24T00:00:00Z"))).toBe(true);
    expect(isReviewStayEligible("2020-01-01", null, new Date("bad"))).toBe(false);
  });
});
