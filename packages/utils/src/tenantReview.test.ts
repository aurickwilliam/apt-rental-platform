import {
  isTenantReviewable,
  summarizeTenantReviews,
  validateTenantReview,
} from "./tenantReview";

describe("tenant review rules shared by web and mobile", () => {
  const now = new Date("2026-10-31T12:00:00Z");

  it.each([
    ["ended", null, true],
    ["ended", "2027-01-01", true],
    ["active", "2026-10-31", true],
    ["active", "2026-10-30", true],
    ["active", "2026-11-01", false],
    ["active", null, false],
    ["active", "bad-date", false],
    [null, null, false],
  ])("status %s, lease end %s -> %s", (status, leaseEnd, expected) => {
    expect(isTenantReviewable({ status, lease_end: leaseEnd }, now)).toBe(expected);
  });

  it("is never reviewable on an invalid clock unless the tenancy ended", () => {
    const bad = new Date("bad");
    expect(isTenantReviewable({ status: "active", lease_end: "2020-01-01" }, bad)).toBe(false);
    expect(isTenantReviewable({ status: "ended", lease_end: null }, bad)).toBe(true);
  });

  it("validates the rating and comment length", () => {
    expect(validateTenantReview(5, "")).toEqual({});
    expect(validateTenantReview(0, "")).toHaveProperty("rating");
    expect(validateTenantReview(6, "")).toHaveProperty("rating");
    expect(validateTenantReview(3.5, "")).toHaveProperty("rating");
    expect(validateTenantReview(4, "a".repeat(1000))).toEqual({});
    expect(validateTenantReview(4, "a".repeat(1001))).toHaveProperty("comment");
    expect(validateTenantReview(4, `  ${"a".repeat(1000)}  `)).toEqual({});
  });

  it("averages individual ratings to one decimal", () => {
    expect(summarizeTenantReviews([])).toEqual({ average: 0, count: 0 });
    expect(summarizeTenantReviews([5, 4, 4])).toEqual({ average: 4.3, count: 3 });
    expect(summarizeTenantReviews([5, Number.NaN])).toEqual({ average: 5, count: 1 });
  });
});
