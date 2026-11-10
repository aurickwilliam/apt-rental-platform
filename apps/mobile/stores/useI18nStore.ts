import AsyncStorage from "@react-native-async-storage/async-storage";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { LanguageCode } from "@repo/i18n";

/** Device-local explicit choice. Detection is never written here. */
export const LANGUAGE_STORAGE_KEY = "apt-language";

export interface I18nState {
  /** `null` until the user picks a language; the device decides until then. */
  language: LanguageCode | null;
}

interface I18nActions {
  setLanguage: (language: LanguageCode) => void;
  reset: () => void;
}

export const initialState: I18nState = {
  language: null,
};

export const useI18nStore = create<I18nState & I18nActions>()(
  persist(
    (set) => ({
      ...initialState,
      setLanguage: (language) => set({ language }),
      reset: () => set(initialState),
    }),
    {
      name: LANGUAGE_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ language }) => ({ language }),
      // Fires on success and on a failed read; either way the saved-language
      // lookup is over, so startup must not wait on it any longer.
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error("Failed to restore the saved language, using English", error);
        }
        useI18nHydrationStore.setState({ hydrated: true });
      },
    },
  ),
);

/**
 * Whether the saved-language lookup has finished. Kept out of the persisted
 * store so flipping it never writes a default over a saved choice.
 */
export const useI18nHydrationStore = create<{ hydrated: boolean }>(() => ({
  hydrated: false,
}));
