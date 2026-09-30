import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  loadSearchPreference,
  sanitizeSearchPreference,
  saveSearchPreference,
} from "./searchPreference";

const mockGetUser = jest.fn();

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock("@repo/supabase", () => ({
  supabase: {
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
  },
}));

const getItem = AsyncStorage.getItem as jest.Mock;
const setItem = AsyncStorage.setItem as jest.Mock;

describe("search preference sanitization", () => {
  it("accepts a well-formed preference", () => {
    const saved = sanitizeSearchPreference({
      city: "Caloocan",
      committedSearch: "  studio  ",
      filters: {
        budget: [5000, 20000],
        unitTypes: ["Studio"],
        sortBy: "price_asc",
        bedrooms: "1",
        bathrooms: "1",
        sizeRange: [15, 60],
        furnishing: ["Semi-Furnished"],
        floorLevel: ["Low Floor (1–5F)"],
        leaseDuration: ["6 Months"],
        amenities: ["WiFi"],
        verifiedOnly: true,
      },
      isGridView: false,
    });

    expect(saved?.city).toBe("Caloocan");
    expect(saved?.committedSearch).toBe("studio");
    expect(saved?.filters?.budget).toEqual([5000, 20000]);
    expect(saved?.isGridView).toBe(false);
  });

  it("falls back to defaults for unknown or out-of-range values", () => {
    const saved = sanitizeSearchPreference({
      city: "Quezon City",
      committedSearch: 42,
      filters: {
        budget: ["cheap", "expensive"],
        unitTypes: ["Castle"],
        sortBy: "oldest",
        bedrooms: "9",
        bathrooms: "9",
        sizeRange: [500, 100],
        furnishing: "everything",
        floorLevel: null,
        leaseDuration: [],
        amenities: [7, null],
        verifiedOnly: "yes",
      },
      isGridView: "grid",
    });

    expect(saved?.city).toBe("CAMANAVA");
    expect(saved?.committedSearch).toBe("");
    expect(saved?.filters?.budget).toEqual([1000, 50000]);
    expect(saved?.filters?.sortBy).toBe("newest");
    expect(saved?.filters?.bedrooms).toBe("Any");
    expect(saved?.filters?.amenities).toEqual([]);
    expect(saved?.filters?.verifiedOnly).toBe(false);
    expect(saved?.isGridView).toBe(true);
  });

  it("rejects non-object payloads and preserves an explicit null filter set", () => {
    expect(sanitizeSearchPreference("not-json")).toBeNull();
    expect(sanitizeSearchPreference(null)).toBeNull();
    expect(sanitizeSearchPreference({ city: "Caloocan", filters: null })?.filters).toBeNull();
  });
});

describe("account-scoped search preference storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getItem.mockResolvedValue(null);
    setItem.mockResolvedValue(undefined);
    mockGetUser.mockResolvedValue({ data: { user: { id: "account-a" } } });
  });

  it("scopes saved state to the current account", async () => {
    await saveSearchPreference({
      city: "Caloocan",
      committedSearch: "studio",
      filters: null,
      isGridView: true,
    });

    expect(setItem).toHaveBeenCalledWith(
      "apt-search:account-a",
      expect.stringContaining("studio"),
    );

    mockGetUser.mockResolvedValue({ data: { user: { id: "account-b" } } });
    getItem.mockImplementation(async (key: string) => (key === "apt-search:account-a" ? null : null));
    expect(await loadSearchPreference()).toBeNull();
    expect(getItem).toHaveBeenCalledWith("apt-search:account-b");
  });

  it("does not read or write when signed out", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    expect(await loadSearchPreference()).toBeNull();
    await saveSearchPreference({ city: "CAMANAVA", committedSearch: "", filters: null, isGridView: true });
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("returns null for corrupted stored data", async () => {
    getItem.mockResolvedValue("{{{not json");
    expect(await loadSearchPreference()).toBeNull();
  });
});
