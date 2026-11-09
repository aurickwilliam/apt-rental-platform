import { canChangeListingVisibility, nextListingVisibilityStatus, propertyStatusLabel } from "./listingVisibility";

describe("landlord listing visibility shared by web and mobile", () => {
  it("offers a reversible pause only for available properties with no tenancy", () => {
    expect(nextListingVisibilityStatus("available")).toBe("under_maintenance");
    expect(nextListingVisibilityStatus("under_maintenance")).toBe("available");
    for (const status of ["available", "under_maintenance"]) {
      expect(canChangeListingVisibility(status, false)).toBe(true);
      expect(canChangeListingVisibility(status, true)).toBe(false);
    }
  });
  it.each(["occupied", "unverified", "", "unknown"])("never restores an unsupported %s status as available", status => {
    expect(canChangeListingVisibility(status, false)).toBe(false);
    expect(() => nextListingVisibilityStatus(status)).toThrow("Only available properties");
  });
  it("clearly distinguishes a maintenance pause from occupancy", () => {
    expect(propertyStatusLabel("under_maintenance")).toBe("Hidden · Under maintenance");
    expect(propertyStatusLabel("occupied")).toBe("occupied");
  });
});
