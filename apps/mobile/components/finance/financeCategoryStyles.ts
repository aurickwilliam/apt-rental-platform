import type { FinanceCategory } from "@repo/utils";

/** Literal utilities so Uniwind can discover every category's themed fill. */
export const FINANCE_CATEGORY_BACKGROUND_CLASSES = {
  maintenance: "bg-finance-maintenance",
  furniture: "bg-finance-furniture",
  turnover: "bg-finance-turnover",
  insurance: "bg-finance-insurance",
  taxes: "bg-finance-taxes",
  utilities: "bg-finance-utilities",
  fees: "bg-finance-fees",
  emergency: "bg-finance-emergency",
  vacancy: "bg-finance-vacancy",
  other: "bg-finance-other",
} satisfies Record<FinanceCategory, string>;

/**
 * Saturated category colors for solid surfaces with white text (the category
 * total card). Same values as the web report; the soft fills above stay the
 * themed tokens for list rows.
 */
export const FINANCE_CATEGORY_SOLID_COLORS = {
  maintenance: "#376BF5",
  furniture: "#7C3AED",
  turnover: "#C2410C",
  insurance: "#0F766E",
  taxes: "#92400E",
  utilities: "#0369A1",
  fees: "#A21CAF",
  emergency: "#15803D",
  vacancy: "#B45309",
  other: "#4B5563",
} satisfies Record<FinanceCategory, string>;
