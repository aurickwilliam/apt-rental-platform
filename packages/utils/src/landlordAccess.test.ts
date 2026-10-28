import {
  canUseLandlordFeatures,
  getLandlordAccessState,
  isLandlordAccessBlocked,
} from "./landlordAccess";

describe("landlord access", () => {
  it("allows only verified accounts", () => {
    expect(canUseLandlordFeatures("verified")).toBe(true);
    for (const status of ["unverified", "pending", "rejected", "", null, undefined]) {
      expect(canUseLandlordFeatures(status)).toBe(false);
    }
  });

  it("separates a review in progress from missing verification", () => {
    expect(getLandlordAccessState("verified")).toBe("verified");
    expect(getLandlordAccessState("pending")).toBe("pending");
    expect(getLandlordAccessState("rejected")).toBe("unverified");
    expect(getLandlordAccessState(null)).toBe("unverified");
  });

  it("blocks only accounts that hold the landlord role", () => {
    expect(isLandlordAccessBlocked(["landlord"], "unverified")).toBe(true);
    expect(isLandlordAccessBlocked(["landlord", "tenant"], "pending")).toBe(true);
    expect(isLandlordAccessBlocked(["landlord"], "verified")).toBe(false);
    expect(isLandlordAccessBlocked(["tenant"], "unverified")).toBe(false);
    expect(isLandlordAccessBlocked(["admin"], "unverified")).toBe(false);
  });
});
