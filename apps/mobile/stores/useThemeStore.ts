import AsyncStorage from "@react-native-async-storage/async-storage";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "apt-theme";

export interface ThemeState {
  themeMode: ThemeMode;
}

interface ThemeActions {
  setThemeMode: (mode: ThemeMode) => void;
  reset: () => void;
}

export const initialState: ThemeState = {
  themeMode: "system",
};

export const useThemeStore = create<ThemeState & ThemeActions>()(
  persist(
    (set) => ({
      ...initialState,
      setThemeMode: (mode) => set({ themeMode: mode }),
      reset: () => set(initialState),
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ themeMode }) => ({ themeMode }),
      // Fires on success and on a failed read; either way the saved-theme
      // lookup is over, so startup must not wait on it any longer.
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error("Failed to restore the saved theme, using System", error);
        }
        useThemeHydrationStore.setState({ hydrated: true });
      },
    }
  )
);

/**
 * Whether the saved theme lookup has finished. Kept out of the persisted store
 * so flipping it never writes the default over a saved choice.
 */
export const useThemeHydrationStore = create<{ hydrated: boolean }>(() => ({
  hydrated: false,
}));
