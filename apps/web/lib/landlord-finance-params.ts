/**
 * Validated URL state for the Profit & planning routes (parity plan §4.1).
 * The applied month, property and tab are the only finance values that may
 * live in the URL; form drafts and unsaved amounts never do. Unknown values
 * read as the defaults and never throw. Month windowing delegates to the
 * shared `financeMonthFromParam`, passed in as a parameter so this module
 * stays import-free for direct node tests.
 */

export type FinanceTab = "overview" | "expenses" | "budget";

export const FINANCE_TABS: readonly FinanceTab[] = [
  "overview",
  "expenses",
  "budget",
];

/** Values as Next.js searchParams carries them (string, or repeated keys). */
export type SearchParamValue = string | string[] | undefined;

export interface LandlordFinanceRouteParams {
  /** Applied report month, always inside the 24-month picker window. */
  month: string;
  /** Applied property id, or null for All properties. */
  apartmentId: string | null;
  tab: FinanceTab;
}

type FinanceMonthParser = (raw: string, currentMonth: string) => string;

/** Property ids are UUIDs; anything else reads as All properties. */
const APARTMENT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function firstValue(value: SearchParamValue): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Applied report month, or `currentMonth` for anything out of window. */
export function financeMonthParam(
  value: SearchParamValue,
  currentMonth: string,
  parseMonth: FinanceMonthParser,
): string {
  return parseMonth(firstValue(value).trim(), currentMonth);
}

/** UUID syntax only; ownership is resolved from the caller's report, never here. */
export function financeApartmentParam(value: SearchParamValue): string | null {
  const raw = firstValue(value).trim();
  return APARTMENT_ID_PATTERN.test(raw) ? raw : null;
}

export function financeTabParam(value: SearchParamValue): FinanceTab {
  const raw = firstValue(value);
  return (FINANCE_TABS as readonly string[]).includes(raw)
    ? (raw as FinanceTab)
    : "overview";
}

export interface FinanceCategoryRouteParams<Category = string> {
  /** Applied report month, always inside the 24-month picker window. */
  month: string;
  /** Applied property id, or null for All properties. */
  apartmentId: string | null;
  /** Known expense/budget category id, or null for the unfiltered list. */
  category: Category | null;
}

/** Accepts only known category ids; anything else reads as All categories.
 *  Generic so the shared FinanceCategory union comes back typed, not cast. */
export function financeCategoryParam<C extends string>(
  value: SearchParamValue,
  validCategories: readonly C[],
): C | null {
  const raw = firstValue(value);
  return validCategories.includes(raw as C) ? (raw as C) : null;
}

/** One parse for the transaction drill-down route — same None-throw rules. */
export function parseFinanceCategoryParams<C extends string>(
  searchParams: Record<string, SearchParamValue>,
  currentMonth: string,
  parseMonth: FinanceMonthParser,
  validCategories: readonly C[],
): FinanceCategoryRouteParams<C> {
  return {
    month: financeMonthParam(searchParams.month, currentMonth, parseMonth),
    apartmentId: financeApartmentParam(searchParams.apartmentId),
    category: financeCategoryParam(searchParams.category, validCategories),
  };
}

/** One parse for the whole route, so server pages and clients never drift. */
export function parseLandlordFinanceParams(
  searchParams: Record<string, SearchParamValue>,
  currentMonth: string,
  parseMonth: FinanceMonthParser,
): LandlordFinanceRouteParams {
  return {
    month: financeMonthParam(searchParams.month, currentMonth, parseMonth),
    apartmentId: financeApartmentParam(searchParams.apartmentId),
    tab: financeTabParam(searchParams.tab),
  };
}

/** Change applied finance state without dropping notifications/settings or other URL state. */
export function financeReportHref(
  query: string,
  patch: Partial<LandlordFinanceRouteParams>,
  path = "/landlord/analytics",
): string {
  const params = new URLSearchParams(query);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }
  return `${path}${params.size ? `?${params}` : ""}`;
}

/** Open one category's transaction drill-down for the applied report scope. */
export function financeCategoryHref(
  month: string,
  apartmentId: string | null,
  category: string,
): string {
  const params = new URLSearchParams({ month });
  if (apartmentId) params.set("apartmentId", apartmentId);
  params.set("category", category);
  return `/landlord/analytics/category-expenses?${params.toString()}`;
}

/** Plan kinds: spending limits and planned reserves stay separate. */
export type FinanceBudgetKind = "expense" | "reserve";

export interface FinanceBudgetCategoryRouteParams<Category = string> {
  /** Applied report month, always inside the 24-month picker window. */
  month: string;
  /** Applied property id, or null for All properties. */
  apartmentId: string | null;
  /** Known budget category id, or null when the category is unknown. */
  category: Category | null;
  /** Spending limits by default; an unknown kind never becomes a reserve. */
  kind: FinanceBudgetKind;
}

/** Unknown kinds read as spending limits, like the mobile category route. */
export function financeBudgetKindParam(
  value: SearchParamValue,
): FinanceBudgetKind {
  return firstValue(value) === "reserve" ? "reserve" : "expense";
}

/** One parse for the budget category drill-down route. */
export function parseFinanceBudgetParams<C extends string>(
  searchParams: Record<string, SearchParamValue>,
  currentMonth: string,
  parseMonth: FinanceMonthParser,
  validCategories: readonly C[],
): FinanceBudgetCategoryRouteParams<C> {
  return {
    month: financeMonthParam(searchParams.month, currentMonth, parseMonth),
    apartmentId: financeApartmentParam(searchParams.apartmentId),
    category: financeCategoryParam(searchParams.category, validCategories),
    kind: financeBudgetKindParam(searchParams.kind),
  };
}

/** Open one budget category's properties for the applied report scope. */
export function financeBudgetCategoryHref(
  month: string,
  apartmentId: string | null,
  category: string,
  kind: FinanceBudgetKind,
): string {
  const params = new URLSearchParams({ month });
  if (apartmentId) params.set("apartmentId", apartmentId);
  params.set("category", category);
  params.set("kind", kind);
  return `/landlord/analytics/budget-category?${params.toString()}`;
}
