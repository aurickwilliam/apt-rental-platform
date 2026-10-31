import {
  prepareTenantReview,
  summarizeTenantReviews,
  toTenantReviewRecords,
  validateTenantReview,
  type TenantReviewRow,
} from "./tenantReview";

const row = (overrides: Partial<TenantReviewRow> = {}): TenantReviewRow => ({
  id: "r1",
  tenancy_id: "t1",
  landlord_id: "l1",
  rating: 4,
  comment: "Paid on time",
  created_at: "2026-10-01T00:00:00Z",
  updated_at: null,
  landlord_first_name: "Ana",
  landlord_last_name: "Cruz",
  landlord_avatar_url: null,
  apartment_name: "Unit 5",
  lease_start: "2026-01-01",
  lease_end: "2026-06-01",
  is_mine: false,
  ...overrides,
});

describe("tenant review rules shared by web and mobile", () => {
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

  describe("prepareTenantReview", () => {
    it("builds the RPC arguments with a trimmed comment", () => {
      expect(prepareTenantReview({ tenancyId: "t1", rating: 4, comment: "  Tidy  " })).toEqual({
        ok: true,
        args: { p_tenancy_id: "t1", p_rating: 4, p_comment: "Tidy" },
      });
    });

    it("leaves the comment out when it is blank", () => {
      expect(prepareTenantReview({ tenancyId: "t1", rating: 5, comment: "   " })).toEqual({
        ok: true,
        args: { p_tenancy_id: "t1", p_rating: 5 },
      });
    });

    it("returns the first validation message instead of calling the database", () => {
      expect(prepareTenantReview({ tenancyId: "t1", rating: 0, comment: "" })).toEqual({
        ok: false,
        error: "Choose a rating from 1 to 5.",
      });
      const tooLong = prepareTenantReview({ tenancyId: "t1", rating: 3, comment: "a".repeat(1001) });
      expect(tooLong.ok).toBe(false);
    });
  });

  describe("toTenantReviewRecords", () => {
    it("maps rows, coercing numeric ratings and null comments", () => {
      const [record] = toTenantReviewRecords([row({ rating: "5" as unknown as number, comment: null, is_mine: true })]);
      expect(record).toMatchObject({
        tenancyId: "t1",
        landlordId: "l1",
        rating: 5,
        comment: "",
        landlordName: "Ana Cruz",
        apartmentName: "Unit 5",
        isMine: true,
      });
    });

    it("falls back to 'Landlord' when the author has no name", () => {
      const [record] = toTenantReviewRecords([row({ landlord_first_name: null, landlord_last_name: " " })]);
      expect(record.landlordName).toBe("Landlord");
    });

    it("keeps missing stay context as null", () => {
      const [record] = toTenantReviewRecords([row({ apartment_name: null, lease_start: null, lease_end: null })]);
      expect(record.apartmentName).toBeNull();
      expect(record.leaseStart).toBeNull();
    });
  });
});
