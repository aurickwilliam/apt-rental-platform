import { COLORS } from "@repo/constants";

/** Splash-matched backdrop (light blue / dark near-black) for the resolved theme. */
export function getSplashBackground(isDark: boolean) {
  return isDark ? COLORS.dark.white : COLORS.light.primary;
}
