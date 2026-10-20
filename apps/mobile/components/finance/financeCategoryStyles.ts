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
