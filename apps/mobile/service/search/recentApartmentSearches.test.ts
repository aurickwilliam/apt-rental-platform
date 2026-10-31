import {
  addRecentApartmentSearch,
  MAX_RECENT_APARTMENT_SEARCHES,
  type RecentApartmentSearch,
} from "./recentApartmentSearches";

const make = (id: string): RecentApartmentSearch => ({
  id,
  name: `Unit ${id}`,
  location: "Barangay, City",
});

describe("addRecentApartmentSearch", () => {
  it("puts the newest first and drops an older copy", () => {
    const result = addRecentApartmentSearch([make("a"), make("b")], make("b"));
    expect(result.map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("keeps only the newest five", () => {
    const current = ["1", "2", "3", "4", "5"].map(make);
    const result = addRecentApartmentSearch(current, make("6"));
    expect(result).toHaveLength(MAX_RECENT_APARTMENT_SEARCHES);
    expect(result[0].id).toBe("6");
    expect(result.map((item) => item.id)).not.toContain("5");
  });
});
