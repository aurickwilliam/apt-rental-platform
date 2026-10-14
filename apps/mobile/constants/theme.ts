import { COLORS } from "@repo/constants";

/** Mobile surface roles. Keep the CSS mappings in app/global.css in sync. */
export const MOBILE_COLORS = {
  light: {
    ...COLORS.light,
    background: "#F5F7FB",
    groupedBackground: "#F5F7FB",
    surface: "#FFFFFF",
    surfaceSecondary: "#F1F3F5",
    surfaceTertiary: "#E9ECEF",
    overlay: "#FFFFFF",
    border: "#E5EAF2",
    textSecondary: "#626B73",
    gray500: "#626B73",
  },
  dark: {
    ...COLORS.dark,
    background: "#121212",
    groupedBackground: "#121212",
    surface: "#1E1E1E",
    surfaceSecondary: "#242424",
    surfaceTertiary: "#2A2A2A",
    overlay: "#242424",
    border: "#3D3D3D",
    gray500: COLORS.dark.textSecondary,
  },
};
