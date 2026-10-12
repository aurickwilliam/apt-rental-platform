import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  THEME_STORAGE_KEY,
  initialState,
  useThemeHydrationStore,
  useThemeStore,
} from "./useThemeStore";

const persisted = (themeMode: string) =>
  JSON.stringify({ state: { themeMode }, version: 0 });

const flushWrites = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("useThemeStore", () => {
  beforeEach(async () => {
    useThemeStore.getState().reset();
    await flushWrites(); // let the reset's own persist write land before clearing
    await AsyncStorage.clear();
    useThemeHydrationStore.setState({ hydrated: false });
    jest.restoreAllMocks();
  });

  it("defaults to System for first-time users", async () => {
    await useThemeStore.persist.rehydrate();

    expect(useThemeStore.getState().themeMode).toBe(initialState.themeMode);
    expect(useThemeStore.getState().themeMode).toBe("system");
    expect(useThemeHydrationStore.getState().hydrated).toBe(true);
  });

  it.each(["light", "dark", "system"] as const)("restores a saved %s choice", async (mode) => {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, persisted(mode));

    await useThemeStore.persist.rehydrate();

    expect(useThemeStore.getState().themeMode).toBe(mode);
    expect(useThemeHydrationStore.getState().hydrated).toBe(true);
  });

  it("persists each choice, including a return to System", async () => {
    for (const mode of ["dark", "light", "system"] as const) {
      useThemeStore.getState().setThemeMode(mode);
      await Promise.resolve();

      const saved = JSON.parse((await AsyncStorage.getItem(THEME_STORAGE_KEY)) ?? "{}");
      expect(saved.state).toEqual({ themeMode: mode });
    }
  });

  it("reports hydration and falls back to System when storage cannot be read", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("storage down"));

    await useThemeStore.persist.rehydrate();

    expect(error).toHaveBeenCalled();
    expect(useThemeStore.getState().themeMode).toBe("system");
    expect(useThemeHydrationStore.getState().hydrated).toBe(true);
  });

  it("does not write the default over a saved choice while hydrating", async () => {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, persisted("dark"));
    // The AsyncStorage mock is already a jest.fn that remembers earlier calls
    const setItem = AsyncStorage.setItem as jest.Mock;
    setItem.mockClear();

    await useThemeStore.persist.rehydrate();

    expect(setItem).not.toHaveBeenCalled();
    expect(await AsyncStorage.getItem(THEME_STORAGE_KEY)).toBe(persisted("dark"));
  });
});
