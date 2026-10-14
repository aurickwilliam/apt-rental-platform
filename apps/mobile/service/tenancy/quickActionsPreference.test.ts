import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  DEFAULT_TENANT_QUICK_ACTION_IDS,
  loadTenantQuickActionIds,
  normalizeTenantQuickActionIds,
  saveTenantQuickActionIds,
  tenantQuickActionsKey,
} from "./quickActionsPreference";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const getItem = AsyncStorage.getItem as jest.Mock;
const setItem = AsyncStorage.setItem as jest.Mock;

describe("tenant quick action preferences", () => {
  beforeEach(() => {
    getItem.mockReset();
    setItem.mockReset();
  });

  it("uses the five default actions when no preference has been saved", async () => {
    getItem.mockResolvedValue(null);

    await expect(loadTenantQuickActionIds("auth-1")).resolves.toEqual(
      DEFAULT_TENANT_QUICK_ACTION_IDS,
    );
  });

  it("stores the chosen actions per account", async () => {
    await saveTenantQuickActionIds("auth-1", ["favorites", "faq"]);

    expect(setItem).toHaveBeenCalledWith(
      tenantQuickActionsKey("auth-1"),
      JSON.stringify(["favorites", "faq"]),
    );
    expect(tenantQuickActionsKey("auth-1")).not.toBe(tenantQuickActionsKey("auth-2"));
  });

  it("keeps only unique supported actions, up to the display limit", () => {
    expect(
      normalizeTenantQuickActionIds([
        "receipts",
        "receipts",
        "applications",
        "repairs",
        "repair-history",
        "my-rental",
        "favorites",
        "not-an-action",
      ]),
    ).toEqual(["receipts", "applications", "repairs", "repair-history", "my-rental"]);
  });

  it("falls back to defaults for malformed saved data", async () => {
    getItem.mockResolvedValue("not-json");

    await expect(loadTenantQuickActionIds("auth-1")).resolves.toEqual(
      DEFAULT_TENANT_QUICK_ACTION_IDS,
    );
  });
});
