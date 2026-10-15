import { getApplyDisabledReason } from "./applyEligibility";

describe("getApplyDisabledReason", () => {
  it("allows applying while the apartment is still loading", () => {
    expect(getApplyDisabledReason(null, "user-1")).toBeNull();
  });

  it("blocks the owner from applying to their own listing", () => {
    expect(
      getApplyDisabledReason({ status: "available", landlordId: "user-1" }, "user-1"),
    ).toBe("Your Listing");
  });

  it.each(["occupied", "under_maintenance"] as const)("blocks %s apartments", (status) => {
    expect(getApplyDisabledReason({ status, landlordId: "owner" }, "user-1")).toBe(
      "Not Available",
    );
  });

  it.each(["available", "unverified"] as const)("allows %s apartments", (status) => {
    expect(getApplyDisabledReason({ status, landlordId: "owner" }, "user-1")).toBeNull();
  });
});
