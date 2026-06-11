import { useEffect } from "react";
import { Appearance, useColorScheme as useSystemColorScheme } from "react-native";

import { COLORS } from "@repo/constants";

import { type ThemeMode, useThemeStore } from "../stores/useThemeStore";

export function useTheme() {
  const { themeMode, setThemeMode } = useThemeStore();
  const systemScheme = useSystemColorScheme(); // 'light' | 'dark' | null

  // Resolve actual scheme — fall back to 'light' if system returns null
  const resolvedScheme =
    themeMode === "system" ? (systemScheme ?? "light") : themeMode;

  const isDark = resolvedScheme === "dark";
  const colors = isDark ? COLORS.dark : COLORS.light;

  // Appearance.setColorScheme is what Uniwind reads from under the hood.
  // It accepts 'light' | 'dark' | null — null means "follow system".
  useEffect(() => {
    Appearance.setColorScheme(themeMode === "system" ? null : themeMode);
  }, [themeMode]);

  const toggleTheme = () => setThemeMode(isDark ? "light" : "dark");

  const cycleTheme = () => {
    const order: ThemeMode[] = ["system", "light", "dark"];
    const next = order[(order.indexOf(themeMode) + 1) % order.length];
    setThemeMode(next);
  };

  return {
    /** Resolved COLORS palette — use for inline styles */
    colors,
    /** true when the resolved scheme is dark */
    isDark,
    /** The stored preference: 'light' | 'dark' | 'system' */
    themeMode,
    /** Set a specific mode */
    setThemeMode,
    /** Toggle between light ↔ dark (drops 'system') */
    toggleTheme,
    /** Cycle through system → light → dark → system */
    cycleTheme,
  };
}

/** Convenience alias — just need the palette without controls */
export function useColors() {
  const { colors, isDark } = useTheme();
  return { colors, isDark };
}