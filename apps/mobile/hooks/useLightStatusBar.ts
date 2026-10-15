import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";

import { useColors } from "@/hooks/useTheme";

// White status-bar icons while `enabled` and the screen is focused (e.g. over
// a photo header), back to the theme's style otherwise. The root layout sets
// the theme style; this only overrides it for the focused screen.
export function useLightStatusBar(enabled: boolean) {
  const { isDark } = useColors();

  useFocusEffect(
    useCallback(() => {
      const themeStyle = isDark ? "light" : "dark";
      setStatusBarStyle(enabled ? "light" : themeStyle, true);
      return () => setStatusBarStyle(themeStyle, true);
    }, [enabled, isDark]),
  );
}
