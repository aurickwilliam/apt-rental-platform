import { COLORS } from "@repo/constants";
import type { FinanceCategory } from "@repo/utils";

/** Decorative budget category surfaces, never indicators of financial status. */
export const FINANCE_CATEGORY_BACKGROUNDS = {
  light: {
    maintenance: "#EDF3FF",
    furniture: "#F3EEFF",
    turnover: "#FFF0E6",
    insurance: "#E8F5F3",
    taxes: "#F7F1E5",
    utilities: "#EAF6FC",
    fees: "#F6EDF5",
    emergency: "#EAF5EC",
    vacancy: "#FFF5DF",
    other: "#F0F2F5",
  },
  dark: {
    maintenance: "#1B2538",
    furniture: "#282238",
    turnover: "#30251F",
    insurance: "#192C2A",
    taxes: "#2B271E",
    utilities: "#1B2932",
    fees: "#302330",
    emergency: "#1D2B21",
    vacancy: "#30291B",
    other: "#25282D",
  },
} satisfies Record<"light" | "dark", Record<FinanceCategory, string>>;

/** Mobile surface roles. Keep the CSS mappings in app/global.css in sync. */
export const MOBILE_COLORS = {
  light: {
    ...COLORS.light,
    financeOverBudgetText: "#C4111E",
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
    financeOverBudgetText: "#F87171",
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
