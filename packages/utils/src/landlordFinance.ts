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
/** Matches the database `landlord_expenses.description` length check. */
export const MAX_FINANCE_DESCRIPTION_LENGTH = 200;

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

/** Resolves a route param to a budget category the finance forms accept. */
export function financeCategoryFromParam(value: unknown): FinanceCategory | undefined {
  return typeof value === "string" &&
    FINANCE_CATEGORIES.some((item) => item.id === value)
    ? (value as FinanceCategory)
    : undefined;
}

/** Resolves a route param to a budget kind ("expense" | "reserve"). */
export function budgetKindFromParam(value: unknown): BudgetKind | undefined {
  return value === "expense" || value === "reserve" ? value : undefined;
}

/** The categories a budget form offers for a plan kind; reserves may use every category. */
export function budgetCategoryOptions(
  kind: BudgetKind,
): (typeof FINANCE_CATEGORIES)[number][] {
  return FINANCE_CATEGORIES.filter(
    (item) => kind === "reserve" || !["emergency", "vacancy"].includes(item.id),
  );
}

/** Spending budgets cannot hold reserve-only categories (emergency, vacancy). */
export function isBudgetCategoryAllowed(kind: BudgetKind, category: FinanceCategory): boolean {
  return kind === "reserve" || !["emergency", "vacancy"].includes(category);
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

/** A budget row with the month's recorded spending for its property and category. */
export interface FinanceBudgetProgress extends FinanceBudget {
  spent: number;
}

export interface BudgetProgress {
  over: boolean;
  /** Null when the limit is zero, so no percentage can be shown. */
  percent: number | null;
  difference: number;
  /** Progress-bar width, capped at 100. */
  barWidth: number;
}

/** Actual-versus-plan arithmetic shared by the budget list and its drill-down. */
export function budgetProgress(amount: number, spent: number): BudgetProgress {
  return {
    over: spent > amount,
    percent: amount > 0 ? Math.round((spent / amount) * 100) : null,
    difference: Math.abs(amount - spent),
    barWidth:
      amount > 0 ? Math.min(100, (spent / amount) * 100) : spent > 0 ? 100 : 0,
  };
}

export interface BudgetCategoryEntry {
  budgetId: string;
  apartmentId: string;
  amount: number;
  spent: number;
  target_amount: number | null;
  months_remaining: number | null;
}

/** One category's budgets across the properties in scope, with their totals. */
export interface BudgetCategoryGroup {
  category: FinanceCategory;
  kind: BudgetKind;
  amount: number;
  spent: number;
  entries: BudgetCategoryEntry[];
}

const FINANCE_CATEGORY_ORDER = new Map<string, number>(
  FINANCE_CATEGORIES.map((item, index) => [item.id, index]),
);

/**
 * Collapses one budget per property into one row per category, so the plan is
 * readable by category and the drill-down can list the properties holding it.
 * Categories follow `FINANCE_CATEGORIES`; entries keep the report's order.
 */
export function groupBudgetsByCategory(
  budgets: readonly FinanceBudgetProgress[],
): BudgetCategoryGroup[] {
  const groups = new Map<string, BudgetCategoryGroup>();
  for (const budget of budgets) {
    const key = `${budget.kind}:${budget.category}`;
    const group = groups.get(key) ?? {
      category: budget.category,
      kind: budget.kind,
      amount: 0,
      spent: 0,
      entries: [],
    };
    group.amount += budget.amount;
    group.spent += budget.spent;
    group.entries.push({
      budgetId: budget.id,
      apartmentId: budget.apartment_id,
      amount: budget.amount,
      spent: budget.spent,
      target_amount: budget.target_amount,
      months_remaining: budget.months_remaining,
    });
    groups.set(key, group);
  }
  const rank = (category: FinanceCategory) =>
    FINANCE_CATEGORY_ORDER.get(category) ?? FINANCE_CATEGORIES.length;
  return [...groups.values()].sort(
    (a, b) => rank(a.category) - rank(b.category) || a.kind.localeCompare(b.kind),
  );
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

export function financeIncome(
  month: Pick<FinanceMonth, "collected" | "operating" | "reviewed">,
): number | null {
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

// ---------------------------------------------------------------------------
// Report payload — the shape of `get_landlord_finances` as the client sees it.
// Transport stays in each app's service; these types and the decode below are
// the shared contract so web and mobile cannot diverge in interpretation.
// ---------------------------------------------------------------------------

/** An owned listing as the report returns it (id and label only). */
export interface FinanceProperty {
  id: string;
  name: string;
}

/** One property's cash report month, plus ranking identifiers. */
export interface PropertyPerformance extends FinanceMonth {
  id: string;
  name: string;
}

/** Which months of the full picker window currently hold collected rent. */
export interface FinanceIncomeMonth {
  month: string;
  collected: number;
}

/** RPC JSON keys stay snake_case; only `income_months` is renamed, to the
 *  optional `incomeMonths`. */
export interface FinanceData {
  properties: FinanceProperty[];
  months: FinanceMonth[];
  incomeMonths?: FinanceIncomeMonth[];
  comparison: { collected: number; operating: number; reviewed: boolean };
  categories: {
    category: FinanceCategory;
    amount: number | null;
    previous_amount: number;
  }[];
  budgets: (FinanceBudget & { spent: number })[];
  performance: PropertyPerformance[];
  collections: {
    expected: number;
    collected: number;
    pending: number;
    overdue: number;
    overdueCount: number;
    age7: number;
    age30: number;
    ageOlder: number;
  };
  unclassified: number;
}

/** Applied filters for the report and every finance read it feeds. */
export interface FinanceScope {
  month: string;
  apartmentId: string | null;
}

/** A saved, owner-recorded expense row. */
export interface ExpenseRecord {
  id: string;
  apartment_id: string;
  category: FinanceCategory;
  treatment: ExpenseTreatment;
  amount: number;
  spent_on: string;
  description: string;
}

/** A form draft: identical to a record, carrying a retry-stable id. */
export interface ExpenseDraft extends Omit<ExpenseRecord, "id"> {
  id: string;
}

/** Keyset cursor for the transactions list. */
export interface ExpenseCursor {
  spent_on: string;
  id: string;
}

export type CollectionStatus = "collected" | "pending" | "overdue";

/** One tenancy's rental-period row from `landlord_rent_ledger`. */
export interface RentLedgerRow {
  id: string;
  apartment_id: string;
  apartment_name: string;
  tenant_name: string;
  due_date: string;
  expected: number;
  collected: number;
  outstanding: number;
  days_late: number;
  status: CollectionStatus;
}

/** Validates the report JSON without renaming its keys. The same messages are
 *  thrown on every platform instead of presenting unknown data as zeros. */
export function decodeFinanceReport(data: unknown): FinanceData {
  if (
    !data || typeof data !== "object" || Array.isArray(data) ||
    !Array.isArray((data as { months?: unknown }).months)
  ) {
    throw new Error("The finance report could not be read.");
  }
  const report = data as FinanceData;
  const raw = data as { income_months?: unknown };
  if (raw.income_months === undefined) return report;
  if (!Array.isArray(raw.income_months)) {
    throw new Error("The finance month summary could not be read.");
  }
  const incomeMonths = raw.income_months.map((row): FinanceIncomeMonth => {
    if (
      !row || typeof row !== "object" || Array.isArray(row) ||
      typeof (row as { month?: unknown }).month !== "string" ||
      !/^\d{4}-(0[1-9]|1[0-2])$/.test((row as { month: string }).month) ||
      typeof (row as { collected?: unknown }).collected !== "number" ||
      !Number.isFinite((row as { collected: number }).collected)
    ) {
      throw new Error("The finance month summary could not be read.");
    }
    return {
      month: (row as FinanceIncomeMonth).month,
      collected: (row as FinanceIncomeMonth).collected,
    };
  });
  return { ...report, incomeMonths };
}

/** Older deployments return only the 12-month chart window. Combines two
 *  bounded cached reports to cover the picker without requiring a DB change. */
export function financeIncomeMonthsFromReports(
  earlier: readonly FinanceMonth[],
  latest: readonly FinanceMonth[],
): FinanceIncomeMonth[] {
  return [...earlier, ...latest].map(({ month, collected }) => ({ month, collected }));
}

/**
 * Keyset page for the transactions list: the service fetches
 * `FINANCE_PAGE_SIZE + 1` ordered rows, so an extra row probes the next page.
 * Supabase returns null when the query matched nothing.
 */
export function financeExpensePage(
  fetched: readonly ExpenseRecord[] | null,
): { rows: ExpenseRecord[]; next: ExpenseCursor | null } {
  const rows = (fetched ?? []).slice(0, FINANCE_PAGE_SIZE);
  const last = rows.at(-1);
  return {
    rows,
    next:
      fetched && fetched.length > FINANCE_PAGE_SIZE && last
        ? { spent_on: last.spent_on, id: last.id }
        : null,
  };
}

/** The same keyset contract for the rental-period ledger, cursored by row id. */
export function financeLedgerPage(
  fetched: readonly RentLedgerRow[] | null,
): { rows: RentLedgerRow[]; next: string | null } {
  const rows = (fetched ?? []).slice(0, FINANCE_PAGE_SIZE);
  return {
    rows,
    next:
      fetched && fetched.length > FINANCE_PAGE_SIZE
        ? (rows.at(-1)?.id ?? null)
        : null,
  };
}

export type PropertyPerformanceMetric = "collected" | "expenses" | "net";

/** Expenses cover operating and capital spending; net income stays null until review. */
export function financePerformanceValue(
  property: Pick<FinanceMonth, "collected" | "operating" | "capital" | "reviewed">,
  metric: PropertyPerformanceMetric,
): number | null {
  if (metric === "net") return financeIncome(property);
  return metric === "expenses"
    ? property.operating + property.capital
    : property.collected;
}

/** Descending numeric order; unreviewed income ranks after known amounts,
 *  undecided ties fall back to the property name. */
export function rankFinanceProperties(
  properties: readonly PropertyPerformance[],
  metric: PropertyPerformanceMetric,
): PropertyPerformance[] {
  return [...properties].sort((a, b) => {
    const value = financePerformanceValue(a, metric);
    const other = financePerformanceValue(b, metric);
    return value === null
      ? other === null
        ? a.name.localeCompare(b.name)
        : 1
      : other === null
        ? -1
        : other - value;
  });
}

/** The earnings summary comparison line, worded once for both apps. The peso
 *  formatter is injected so this module stays import-free for direct browser
 *  and node imports. */
export function financeComparisonSentence(
  currentMonth: boolean,
  active: FinanceMonth,
  comparison: FinanceData["comparison"],
  formatPeso: (amount: number) => string,
): string {
  const income = financeIncome(active);
  const canCompareIncome = income !== null && comparison.reviewed;
  const delta = canCompareIncome
    ? income - (comparison.collected - comparison.operating)
    : active.collected - comparison.collected;
  const metric = canCompareIncome ? "operating income" : "collected rent";
  const period = currentMonth ? "same elapsed days last month" : "last month";
  return delta === 0
    ? `No change in ${metric} vs ${period}`
    : `${delta > 0 ? "↑" : "↓"} ${formatPeso(Math.abs(delta))} ${delta > 0 ? "more" : "less"} ${metric} vs ${period}`;
}

// ---------------------------------------------------------------------------
// Finance form defaults — seeded exactly the same on both platforms.
// ---------------------------------------------------------------------------

/** Only improvement categories default to capital; everything else is operating. */
export function financeCategoryTreatmentDefault(
  category: FinanceCategory,
): ExpenseTreatment {
  return category === "furniture" || category === "turnover"
    ? "capital"
    : "operating";
}

/** A new expense is paid today inside the report month, otherwise on the month's first day. */
export function financeExpenseDateDefault(
  month: string,
  today: string = manilaToday(),
): string {
  return month === today.slice(0, 7) ? today : `${month}-01`;
}

/** Annual bills and taxes spread across a year by default; other goals across 6 months. */
export function financeBudgetMonthsDefault(category: FinanceCategory): 6 | 12 {
  return category === "insurance" || category === "taxes" ? 12 : 6;
}

/** A validated optional goal. Without a target, no goal is invented even though
 *  the form still shows a default spread. */
export interface FinanceGoalEntry {
  target_amount: number | null;
  months_remaining: number | null;
  targetError: string | null;
  monthsError: string | null;
}

/** Parses the optional goal inputs: a target needs a positive amount and 1–600
 *  whole months; month errors only apply when a target is present. */
export function financeGoalFromForm(target: string, months: string): FinanceGoalEntry {
  const hasTarget = !!target.trim();
  const targetValue = hasTarget ? parseFinanceAmount(target) : null;
  const monthsValue = /^\d+$/.test(months) ? Number(months) : 0;
  const inRange = monthsValue >= 1 && monthsValue <= 600;
  return {
    target_amount: targetValue,
    months_remaining: targetValue === null ? null : monthsValue,
    targetError: hasTarget && targetValue === null
      ? "Enter a positive target amount."
      : null,
    monthsError: hasTarget && !inRange
      ? "Enter a whole number from 1 to 600."
      : null,
  };
}

// ---------------------------------------------------------------------------
// Failure copy — one shared mapping, so both apps say the same thing.
// ---------------------------------------------------------------------------

/** One user-facing sentence for any finance failure. A missing RPC
 *  (`PGRST202`) or table (`42P01`) means the deployment predates this feature;
 *  anything else keeps the generic retry sentence. Transport lives in each
 *  app's service; the wording is the shared contract. */
export function financeErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error.code === "PGRST202" || error.code === "42P01")
  ) {
    return "Finance tracking needs the latest database update. Please contact support.";
  }
  return "We couldn’t save or load your finances. Check your connection and try again.";
}
