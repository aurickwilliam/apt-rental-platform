/**
 * Validated URL state for the Profit & planning routes (parity plan §4.1).
 * The applied month, property and tab are the only finance values that may
 * live in the URL; form drafts and unsaved amounts never do. Unknown values
 * read as the defaults and never throw. Month windowing delegates to the
 * shared `financeMonthFromParam`, passed in as a parameter so this module
 * stays import-free for direct node tests.
 */

export type FinanceTab = "overview" | "expenses" | "budget";

export const FINANCE_TABS: readonly FinanceTab[] = ["overview", "expenses", "budget"];

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

/** A malformed or foreign property id reads as All properties. */
export function financeApartmentParam(value: SearchParamValue): string | null {
  const raw = firstValue(value).trim();
  return APARTMENT_ID_PATTERN.test(raw) ? raw : null;
}

export function financeTabParam(value: SearchParamValue): FinanceTab {
  const raw = firstValue(value);
  return (FINANCE_TABS as readonly string[]).includes(raw) ? (raw as FinanceTab) : "overview";
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
