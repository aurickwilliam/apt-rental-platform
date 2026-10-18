/** Shared finance rules. Cash collections, rental-period dues and reserves are distinct. */
export const FINANCE_CATEGORIES = [
  { id: "maintenance", label: "Maintenance & repairs" },
  { id: "furniture", label: "Furniture & appliances" },
  { id: "turnover", label: "Turnover & refurbishment" },
  { id: "insurance", label: "Insurance" },
  { id: "taxes", label: "Taxes & permits" },
  { id: "utilities", label: "Owner-paid utilities & dues" },
  { id: "fees", label: "Management & payment fees" },
  { id: "emergency", label: "Emergency reserve" },
  { id: "vacancy", label: "Vacancy & late-payment buffer" },
  { id: "other", label: "Other" },
] as const;

export type FinanceCategory = (typeof FINANCE_CATEGORIES)[number]["id"];
export type ExpenseTreatment = "operating" | "capital";
export type BudgetKind = "expense" | "reserve";
export const MAX_FINANCE_AMOUNT = 999_999_999.99;
export const FINANCE_PAGE_SIZE = 30;

export function financeCategoryLabel(category: string): string {
  return FINANCE_CATEGORIES.find((item) => item.id === category)?.label ?? category;
}

export function manilaToday(now: Date = new Date()): string {
  return new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function shiftFinanceMonth(month: string, offset: number): string {
  const [year, number] = month.slice(0, 7).split("-").map(Number);
  return new Date(Date.UTC(year, number - 1 + offset, 1)).toISOString().slice(0, 7);
}

export function financeMonthLabel(month: string): string {
  return new Date(`${month.slice(0, 7)}-01T12:00:00Z`).toLocaleDateString("en-PH", {
    month: "long", year: "numeric", timeZone: "Asia/Manila",
  });
}

/** Resolves a `YYYY-MM` route param to a month the finance report accepts. */
export function financeMonthFromParam(value: unknown, currentMonth: string): string {
  return typeof value === "string" &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(value) &&
    value <= currentMonth &&
    value >= shiftFinanceMonth(currentMonth, -23)
    ? value
    : currentMonth;
}

/** Empty, scientific notation, negative, non-finite and >2 decimal values are rejected. */
export function parseFinanceAmount(value: string, allowZero = false): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount <= MAX_FINANCE_AMOUNT && (allowZero ? amount >= 0 : amount > 0)
    ? amount : null;
}

export function validateExpenseDate(value: string, today = manilaToday()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Enter a date as YYYY-MM-DD.";
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return "Enter a valid date.";
  if (value > today) return "Record expenses already paid, not future spending.";
  if (value < "2000-01-01") return "Choose a date from 2000 onwards.";
  return null;
}

export interface FinanceMonth {
  month: string;
  collected: number;
  operating: number;
  capital: number;
  reviewed: boolean;
}

export interface FinanceBudget {
  id: string;
  apartment_id: string;
  month: string;
  category: FinanceCategory;
  kind: BudgetKind;
  amount: number;
  target_amount: number | null;
  months_remaining: number | null;
}

export interface FinanceSuggestion {
  category: FinanceCategory;
  kind: BudgetKind;
  amount: number;
  title: string;
  basis: string;
}

/** Rules use only entered goals or reviewed spending, never invented market estimates. */
export function suggestFinanceBudget(
  budget: Pick<FinanceBudget, "category" | "kind" | "target_amount" | "months_remaining">,
  reviewedHistory: readonly number[] = [],
): FinanceSuggestion | null {
  if (budget.target_amount && budget.months_remaining && budget.months_remaining > 0) {
    return {
      category: budget.category, kind: budget.kind,
      amount: Math.ceil((budget.target_amount / budget.months_remaining) * 100) / 100,
      title: `Plan for ${financeCategoryLabel(budget.category).toLowerCase()}`,
      basis: `Your entered target divided across ${budget.months_remaining} months. This is a plan, not money transferred.`,
    };
  }
  if (budget.kind !== "expense" || reviewedHistory.length < 3) return null;
  return {
    category: budget.category, kind: "expense",
    amount: Math.ceil(reviewedHistory.reduce((sum, value) => sum + value, 0) / reviewedHistory.length),
    title: `Review your ${financeCategoryLabel(budget.category).toLowerCase()} budget`,
    basis: `Average recorded spending across ${reviewedHistory.length} reviewed months. Adjust for upcoming work.`,
  };
}

export function financeIncome(month: FinanceMonth): number | null {
  return month.reviewed ? Math.round((month.collected - month.operating) * 100) / 100 : null;
}

export function financeAfterReserve(month: FinanceMonth, plannedReserve: number): number | null {
  const income = financeIncome(month);
  return income === null ? null : Math.round((income - month.capital - plannedReserve) * 100) / 100;
}

export function rentAgeBucket(daysLate: number): "not_due" | "1–7 days" | "8–30 days" | "31+ days" {
  if (daysLate <= 0) return "not_due";
  if (daysLate <= 7) return "1–7 days";
  return daysLate <= 30 ? "8–30 days" : "31+ days";
}
