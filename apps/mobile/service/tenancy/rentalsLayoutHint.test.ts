import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  loadRentalsLayoutHint,
  rentalsLayoutHintKey,
  saveRentalsLayoutHint,
} from "./rentalsLayoutHint";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const getItem = AsyncStorage.getItem as jest.Mock;
const setItem = AsyncStorage.setItem as jest.Mock;

describe("rentals layout hint", () => {
  beforeEach(() => {
    getItem.mockReset();
    setItem.mockReset();
  });

  it("is stored per account", async () => {
    await saveRentalsLayoutHint("auth-1", "applications");

    expect(setItem).toHaveBeenCalledWith(rentalsLayoutHintKey("auth-1"), "applications");
    expect(rentalsLayoutHintKey("auth-1")).not.toBe(rentalsLayoutHintKey("auth-2"));
  });

  it("loads a saved hint", async () => {
    getItem.mockResolvedValue("tenancy");

    await expect(loadRentalsLayoutHint("auth-1")).resolves.toBe("tenancy");
    expect(getItem).toHaveBeenCalledWith(rentalsLayoutHintKey("auth-1"));
  });

  it("ignores missing or unknown values", async () => {
    getItem.mockResolvedValueOnce(null).mockResolvedValueOnce("landlord");

    await expect(loadRentalsLayoutHint("auth-1")).resolves.toBeNull();
    await expect(loadRentalsLayoutHint("auth-1")).resolves.toBeNull();
  });

  it("never throws when storage fails", async () => {
    getItem.mockRejectedValue(new Error("storage unavailable"));
    setItem.mockRejectedValue(new Error("storage unavailable"));

    await expect(loadRentalsLayoutHint("auth-1")).resolves.toBeNull();
    await expect(saveRentalsLayoutHint("auth-1", "tenancy")).resolves.toBeUndefined();
  });
});
