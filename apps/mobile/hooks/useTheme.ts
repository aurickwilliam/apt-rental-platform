import { useLayoutEffect } from "react";
import { Uniwind, useUniwind } from "uniwind";

import { COLORS } from "@repo/constants";

import {
  useThemeHydrationStore,
  useThemeStore,
} from "../stores/useThemeStore";

/**
 * Resolved palette for inline styles. Reads Uniwind's active theme, the same
 * source the utility classes and HeroUI Native use, so a forced choice and an
 * OS appearance change in System mode all update together.
 */
export function useColors() {
  const { theme } = useUniwind();
  const isDark = theme === "dark";

  return { colors: isDark ? COLORS.dark : COLORS.light, isDark };
}

/** Resolved palette and `isDark` — kept for existing consumers. */
export function useTheme() {
  return useColors();
}

/** The saved preference ('system' | 'light' | 'dark') and its setter. */
export function useThemePreference() {
  const themeMode = useThemeStore((state) => state.themeMode);
  const setThemeMode = useThemeStore((state) => state.setThemeMode);

  return { themeMode, setThemeMode };
}

/**
 * The single place the saved preference is applied. Mount once at the root.
 * `Uniwind.setTheme("system")` clears any forced override and resumes
 * following the device. Returns false until the saved choice has loaded, so
 * the root can keep the splash up instead of showing a wrong-theme frame.
 */
export function useThemeSync() {
  const hydrated = useThemeHydrationStore((state) => state.hydrated);
  const themeMode = useThemeStore((state) => state.themeMode);

  useLayoutEffect(() => {
    if (hydrated) Uniwind.setTheme(themeMode);
  }, [hydrated, themeMode]);

  return hydrated;
}
