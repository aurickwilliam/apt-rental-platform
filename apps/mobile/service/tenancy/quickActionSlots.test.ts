import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadQuickActionSlots, normalizeQuickActionSlots, placeQuickAction, saveQuickActionSlots, tenantQuickActionsKey } from "./quickActionsPreference";

jest.mock("@react-native-async-storage/async-storage", () => ({ getItem: jest.fn(), setItem: jest.fn() }));

describe("quick action slots", () => {
  beforeEach(() => jest.clearAllMocks());
  it("pads legacy arrangements to five slots", () => {
    expect(normalizeQuickActionSlots(["faq", "settings"])).toEqual(["faq", "settings", null, null, null]);
  });
  it("removes unknown and duplicate IDs without moving other slots", () => {
    expect(normalizeQuickActionSlots(["faq", "faq", "unknown", "settings"])).toEqual(["faq", null, null, "settings", null]);
  });
  it("adds only to empty slots", () => {
    const slots = normalizeQuickActionSlots(["faq"]);
    expect(placeQuickAction(slots, "favorites", 0)).toEqual(slots);
    expect(placeQuickAction(slots, "favorites", 2)).toEqual(["faq", null, "favorites", null, null]);
  });
  it("swaps occupied slots and moves into empty slots", () => {
    const slots = normalizeQuickActionSlots(["faq", "settings"]);
    expect(placeQuickAction(slots, "faq", 1)).toEqual(["settings", "faq", null, null, null]);
    expect(placeQuickAction(slots, "faq", 3)).toEqual([null, "settings", null, "faq", null]);
    expect(placeQuickAction(slots, "faq", -1)).toEqual(slots);
  });
  it("persists empty positions and loads legacy data", async () => {
    const slots = normalizeQuickActionSlots([null, "faq", null, "settings"]);
    await saveQuickActionSlots("account", slots);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(tenantQuickActionsKey("account"), JSON.stringify({ version: 1, slots }));
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ version: 1, slots }));
    expect(await loadQuickActionSlots("account")).toEqual(slots);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(["faq"]));
    expect(await loadQuickActionSlots("account")).toEqual(["faq", null, null, null, null]);
  });
});
