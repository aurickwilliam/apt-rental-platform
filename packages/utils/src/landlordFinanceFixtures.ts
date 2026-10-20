import type {
  BudgetCategoryGroup,
  BudgetProgress,
  BudgetKind,
  ExpenseRecord,
  ExpenseTreatment,
  FinanceBudgetProgress,
  FinanceCategory,
  FinanceGoalEntry,
  FinanceIncomeMonth,
  FinanceMonth,
  FinanceSuggestion,
  RentLedgerRow,
} from "./landlordFinance";

/**
 * Cross-app parity contract for the landlord Profit & planning feature
 * (docs/plans/landlord-web-budget-analytics-parity.md §9.1). Pure data with no
 * runtime imports, so Jest (apps/mobile suite), node strip-types
 * (apps/web `lib/*.test.mjs`) and both apps consume the same tables. Expected
 * values are hand-written from the shared rules; tests assert the shared
 * `landlordFinance` helpers reproduce them on every platform.
 */

export const financeParityFixtures = {
  /** Headline income and cash-after-plan arithmetic, including unreviewed scopes. */
  income: [
    {
      name: "reviewed scope reports income and cash after reserves",
      month: { month: "2026-10", collected: 50000, operating: 11500, capital: 3000, reviewed: true },
      reserve: 7500,
      income: 38500,
      afterReserve: 28000,
    },
    {
      name: "unreviewed scope stays not calculated",
      month: { month: "2026-10", collected: 50000, operating: 11500, capital: 3000, reviewed: false },
      reserve: 7500,
      income: null,
      afterReserve: null,
    },
    {
      name: "losses keep their sign",
      month: { month: "2026-10", collected: 50000, operating: 60000, capital: 0, reviewed: true },
      reserve: 0,
      income: -10000,
      afterReserve: -10000,
    },
  ] as readonly {
    name: string;
    month: FinanceMonth;
    reserve: number;
    income: number | null;
    afterReserve: number | null;
  }[],

  /** Actual-versus-plan progress, including zero limits. */
  budgetProgress: [
    {
      name: "over budget",
      amount: 3000,
      spent: 4200,
      expected: { over: true, percent: 140, difference: 1200, barWidth: 100 },
    },
    {
      name: "inside budget",
      amount: 3000,
      spent: 1200,
      expected: { over: false, percent: 40, difference: 1800, barWidth: 40 },
    },
    {
      name: "zero limit without spending",
      amount: 0,
      spent: 0,
      expected: { over: false, percent: null, difference: 0, barWidth: 0 },
    },
    {
      name: "zero limit with spending",
      amount: 0,
      spent: 500,
      expected: { over: true, percent: null, difference: 500, barWidth: 100 },
    },
  ] as readonly {
    name: string;
    amount: number;
    spent: number;
    expected: BudgetProgress;
  }[],

  /** Goal-based suggestions round up to a cent; no goal means no suggestion. */
  suggestions: [
    {
      name: "annual bill spread across the year",
      budget: { category: "furniture", kind: "reserve", target_amount: 12000, months_remaining: 12 },
      expected: {
        category: "furniture",
        kind: "reserve",
        amount: 1000,
        title: "Plan for furniture & appliances",
        basis: "Your entered target divided across 12 months. This is a plan, not money transferred.",
      },
    },
    {
      name: "targets round up to a cent",
      budget: { category: "turnover", kind: "expense", target_amount: 100, months_remaining: 3 },
      expected: {
        category: "turnover",
        kind: "expense",
        amount: 33.34,
        title: "Plan for turnover & refurbishment",
        basis: "Your entered target divided across 3 months. This is a plan, not money transferred.",
      },
    },
    {
      name: "no goal and no history gives no suggestion",
      budget: { category: "maintenance", kind: "expense", target_amount: null, months_remaining: null },
      expected: null,
    },
  ] as readonly {
    name: string;
    budget: Pick<FinanceSuggestion, "category" | "kind"> & {
      target_amount: number | null;
      months_remaining: number | null;
    };
    expected: FinanceSuggestion | null;
  }[],

  /** Spending and reserves never merge, even on a shared category. */
  grouping: {
    name: "spending plans group across properties; reserves stay separate",
    budgets: [
      {
        id: "b1", apartment_id: "p1", month: "2026-10", category: "maintenance",
        kind: "expense", amount: 1000, target_amount: null, months_remaining: null, spent: 1200,
      },
      {
        id: "b2", apartment_id: "p2", month: "2026-10", category: "maintenance",
        kind: "expense", amount: 500, target_amount: null, months_remaining: null, spent: 0,
      },
      {
        id: "b3", apartment_id: "p3", month: "2026-10", category: "maintenance",
        kind: "reserve", amount: 200, target_amount: null, months_remaining: null, spent: 0,
      },
      {
        id: "b4", apartment_id: "p1", month: "2026-10", category: "furniture",
        kind: "expense", amount: 300, target_amount: null, months_remaining: null, spent: 100,
      },
    ] as FinanceBudgetProgress[],
    expected: [
      {
        category: "maintenance",
        kind: "expense",
        amount: 1500,
        spent: 1200,
        entries: [
          { budgetId: "b1", apartmentId: "p1", amount: 1000, spent: 1200, target_amount: null, months_remaining: null },
          { budgetId: "b2", apartmentId: "p2", amount: 500, spent: 0, target_amount: null, months_remaining: null },
        ],
      },
      {
        category: "maintenance",
        kind: "reserve",
        amount: 200,
        spent: 0,
        entries: [
          { budgetId: "b3", apartmentId: "p3", amount: 200, spent: 0, target_amount: null, months_remaining: null },
        ],
      },
      {
        category: "furniture",
        kind: "expense",
        amount: 300,
        spent: 100,
        entries: [
          { budgetId: "b4", apartmentId: "p1", amount: 300, spent: 100, target_amount: null, months_remaining: null },
        ],
      },
    ] as BudgetCategoryGroup[],
  },

  /** Ranking: descending values, unreviewed income after numbers, ties by name. */
  performance: {
    properties: [
      { id: "p-a", name: "Alpha", month: "2026-10", collected: 100, operating: 50, capital: 0, reviewed: true },
      { id: "p-b", name: "Beta", month: "2026-10", collected: 30, operating: 10, capital: 0, reviewed: false },
      { id: "p-c", name: "Zeta", month: "2026-10", collected: 30, operating: 10, capital: 0, reviewed: false },
      { id: "p-d", name: "Extra", month: "2026-10", collected: 200, operating: 900, capital: 0, reviewed: true },
    ],
    expected: [
      { metric: "collected", order: ["p-d", "p-a", "p-b", "p-c"] },
      { metric: "expenses", order: ["p-d", "p-a", "p-b", "p-c"] },
      { metric: "net", order: ["p-a", "p-d", "p-b", "p-c"] },
    ] as readonly { metric: "collected" | "expenses" | "net"; order: string[] }[],
  },

  /** Shared late-rent aging boundaries (en dashes are part of the labels). */
  aging: [
    { daysLate: 0, bucket: "not_due" },
    { daysLate: -3, bucket: "not_due" },
    { daysLate: 1, bucket: "1–7 days" },
    { daysLate: 7, bucket: "1–7 days" },
    { daysLate: 8, bucket: "8–30 days" },
    { daysLate: 30, bucket: "8–30 days" },
    { daysLate: 31, bucket: "31+ days" },
    { daysLate: 45, bucket: "31+ days" },
  ] as readonly { daysLate: number; bucket: "not_due" | "1–7 days" | "8–30 days" | "31+ days" }[],

  /** The earnings summary comparison line, formatted with the real peso helper. */
  compareSentences: [
    {
      name: "reviewed deltas compare operating income",
      currentMonth: false,
      active: { month: "2026-10", collected: 50000, operating: 11500, capital: 3000, reviewed: true },
      comparison: { collected: 40000, operating: 8000, reviewed: true },
      expected: "↑ ₱ 6,500 more operating income vs last month",
    },
    {
      name: "unreviewed comparison falls back to collected rent",
      currentMonth: false,
      active: { month: "2026-10", collected: 50000, operating: 11500, capital: 3000, reviewed: true },
      comparison: { collected: 32000, operating: 1000, reviewed: false },
      expected: "↑ ₱ 18,000 more collected rent vs last month",
    },
    {
      name: "current month compares the same elapsed days",
      currentMonth: true,
      active: { month: "2026-10", collected: 40000, operating: 11500, capital: 3000, reviewed: true },
      comparison: { collected: 45000, operating: 5000, reviewed: true },
      expected: "↓ ₱ 11,500 less operating income vs same elapsed days last month",
    },
    {
      name: "zero deltas keep explicit wording",
      currentMonth: false,
      active: { month: "2026-10", collected: 50000, operating: 11500, capital: 3000, reviewed: true },
      comparison: { collected: 38500, operating: 0, reviewed: true },
      expected: "No change in operating income vs last month",
    },
    {
      name: "unreviewed headline compares collected rent for the current month",
      currentMonth: true,
      active: { month: "2026-10", collected: 31000, operating: 4000, capital: 0, reviewed: false },
      comparison: { collected: 30000, operating: 1200, reviewed: false },
      expected: "↑ ₱ 1,000 more collected rent vs same elapsed days last month",
    },
  ] as readonly {
    name: string;
    currentMonth: boolean;
    active: FinanceMonth;
    comparison: { collected: number; operating: number; reviewed: boolean };
    expected: string;
  }[],

  /**
   * Report decoding: the summary key is renamed, older deployments pass
   * through, and malformed data throws the shared messages.
   */
  decode: [
    {
      name: "the summary is mapped from the RPC's snake_case key",
      payload: {
        properties: [],
        months: [
          { month: "2026-09", collected: 42000, operating: 9000, capital: 1000, reviewed: true },
          { month: "2026-10", collected: 31000, operating: 4000, capital: 0, reviewed: false },
        ],
        comparison: { collected: 42000, operating: 9000, reviewed: true },
        categories: [],
        budgets: [],
        performance: [],
        collections: {
          expected: 42000, collected: 31000, pending: 8000, overdue: 3000,
          overdueCount: 1, age7: 2000, age30: 1000, ageOlder: 0,
        },
        unclassified: 0,
        income_months: [{ month: "2026-10", collected: 31000 }, { month: "2026-11", collected: 0 }],
      },
      ok: {
        properties: [],
        months: [
          { month: "2026-09", collected: 42000, operating: 9000, capital: 1000, reviewed: true },
          { month: "2026-10", collected: 31000, operating: 4000, capital: 0, reviewed: false },
        ],
        comparison: { collected: 42000, operating: 9000, reviewed: true },
        categories: [],
        budgets: [],
        performance: [],
        collections: {
          expected: 42000, collected: 31000, pending: 8000, overdue: 3000,
          overdueCount: 1, age7: 2000, age30: 1000, ageOlder: 0,
        },
        unclassified: 0,
        income_months: [{ month: "2026-10", collected: 31000 }, { month: "2026-11", collected: 0 }],
        incomeMonths: [{ month: "2026-10", collected: 31000 }, { month: "2026-11", collected: 0 }],
      },
    },
    {
      name: "older deployments without the summary still load",
      payload: {
        properties: [],
        months: [],
        comparison: { collected: 0, operating: 0, reviewed: false },
        categories: [],
        budgets: [],
        performance: [],
        collections: {
          expected: 0, collected: 0, pending: 0, overdue: 0,
          overdueCount: 0, age7: 0, age30: 0, ageOlder: 0,
        },
        unclassified: 0,
      },
      ok: {
        properties: [],
        months: [],
        comparison: { collected: 0, operating: 0, reviewed: false },
        categories: [],
        budgets: [],
        performance: [],
        collections: {
          expected: 0, collected: 0, pending: 0, overdue: 0,
          overdueCount: 0, age7: 0, age30: 0, ageOlder: 0,
        },
        unclassified: 0,
      },
    },
    {
      name: "a summary key that is not an array is rejected",
      payload: {
        months: [], comparison: { collected: 0, operating: 0, reviewed: false }, income_months: "maybe",
      },
      error: "The finance month summary could not be read.",
    },
    {
      name: "malformed summary rows are rejected instead of shown as zero rent",
      payload: {
        months: [], comparison: { collected: 0, operating: 0, reviewed: false },
        income_months: [{ month: "2026-13", collected: 10 }],
      },
      error: "The finance month summary could not be read.",
    },
    {
      name: "a report without its months array is rejected",
      payload: { bogus: true },
      error: "The finance report could not be read.",
    },
    {
      name: "a summary row without a number of collected rent is rejected",
      payload: {
        months: [], comparison: { collected: 0, operating: 0, reviewed: false },
        income_months: [{ month: "2026-10", collected: NaN }],
      },
      error: "The finance month summary could not be read.",
    },
  ] as readonly {
    name: string;
    payload: Record<string, unknown>;
    ok?: Record<string, unknown>;
    error?: string;
  }[],

  /** The 24-month picker fallback when a deployment lacks `income_months`. */
  incomeMonthsFallback: {
    earlier: [
      { month: "2025-10", collected: 5000, operating: 0, capital: 0, reviewed: false },
      { month: "2025-11", collected: 6000, operating: 0, capital: 0, reviewed: false },
    ],
    latest: [
      { month: "2026-09", collected: 42000, operating: 9000, capital: 1000, reviewed: true },
      { month: "2026-10", collected: 31000, operating: 4000, capital: 0, reviewed: false },
    ],
    expected: [
      { month: "2025-10", collected: 5000 },
      { month: "2025-11", collected: 6000 },
      { month: "2026-09", collected: 42000 },
      { month: "2026-10", collected: 31000 },
    ] as FinanceIncomeMonth[],
  },

  /** Keyset pages: 30-row window, one probed overflow row. */
  expensePage: (() => {
    const row = (index: number): ExpenseRecord => ({
      id: `e${String(index).padStart(2, "0")}`,
      apartment_id: "a1",
      category: "maintenance",
      treatment: "operating",
      amount: 100,
      spent_on: "2026-10-05",
      description: "Repair",
    });
    const filled = Array.from({ length: 31 }, (_, index) => row(index));
    const exact = Array.from({ length: 30 }, (_, index) => row(index));
    return {
      cases: [
        { name: "an overflow row offers the next cursor", fetched: filled, rows: filled.slice(0, 30), next: { spent_on: "2026-10-05", id: "e29" } },
        { name: "an exact page stops there", fetched: exact, rows: exact, next: null },
        { name: "an empty query has no cursor", fetched: null, rows: [], next: null },
      ],
    };
  })(),

  /** Same keyset contract for the rental-period ledger, cursored by row id. */
  ledgerPage: (() => {
    const row = (index: number): RentLedgerRow => ({
      id: `l${String(index).padStart(2, "0")}`,
      apartment_id: "a1",
      apartment_name: "Sample Court",
      tenant_name: "Sample Tenant",
      due_date: "2026-10-05",
      expected: 12000,
      collected: 5000,
      outstanding: 7000,
      days_late: index,
      status: index >= 1 ? ("overdue" as const) : ("pending" as const),
    });
    const filled = Array.from({ length: 31 }, (_, index) => row(index));
    return {
      cases: [
        { name: "an overflow row offers the next id", fetched: filled, rows: filled.slice(0, 30), next: "l29" },
        { name: "an empty query has no cursor", fetched: null, rows: [], next: null },
      ],
    };
  })(),

  /** Peso inputs must be plain positive decimals (zero only when allowed). */
  amountParsing: [
    { value: "12.34", allowZero: false, parsed: 12.34 },
    { value: "12.3", allowZero: false, parsed: 12.3 },
    { value: " 7 ", allowZero: false, parsed: 7 },
    { value: "999999999.99", allowZero: false, parsed: 999999999.99 },
    { value: "0", allowZero: false, parsed: null },
    { value: "0.00", allowZero: true, parsed: 0 },
    { value: "", allowZero: false, parsed: null },
    { value: "abc", allowZero: false, parsed: null },
    { value: "1e5", allowZero: false, parsed: null },
    { value: "-5", allowZero: false, parsed: null },
    { value: "12.345", allowZero: false, parsed: null },
    { value: "1000000000", allowZero: false, parsed: null },
  ] as readonly { value: string; allowZero: boolean; parsed: number | null }[],

  /** Expense dates: calendar-correct, never future, from 2000 onwards. */
  dateValidation: [
    { name: "a past date passes", value: "2026-10-16", today: "2026-10-17", error: null },
    { name: "dates after today are rejected", value: "2026-10-18", today: "2026-10-17", error: "Record expenses already paid, not future spending." },
    { name: "impossible calendar dates are rejected", value: "2026-02-30", today: "2026-10-17", error: "Enter a valid date." },
    { name: "day overflow cannot slip through ISO parsing", value: "2026-01-32", today: "2026-10-17", error: "Enter a valid date." },
    { name: "malformed shapes are rejected", value: "2026-1-5", today: "2026-10-17", error: "Enter a date as YYYY-MM-DD." },
    { name: "dates from before 2000 are rejected", value: "1999-12-31", today: "2026-10-17", error: "Choose a date from 2000 onwards." },
  ] as readonly { name: string; value: string; today: string; error: string | null }[],

  /** Route months outside the 24-month report window fall to the current month. */
  monthParam: [
    { value: "2026-09", currentMonth: "2026-10", resolved: "2026-09" },
    { value: "2024-11", currentMonth: "2026-10", resolved: "2024-11" },
    { value: "2024-10", currentMonth: "2026-10", resolved: "2026-10" },
    { value: "2027-01", currentMonth: "2026-10", resolved: "2026-10" },
    { value: "bogus", currentMonth: "2026-10", resolved: "2026-10" },
  ] as readonly { value: string; currentMonth: string; resolved: string }[],

  /** Spending categories exclude reserve-only kinds; reserves take everything. */
  categoryOptions: [
    {
      kind: "expense",
      ids: ["maintenance", "furniture", "turnover", "insurance", "taxes", "utilities", "fees", "other"],
    },
    {
      kind: "reserve",
      ids: ["maintenance", "furniture", "turnover", "insurance", "taxes", "utilities", "fees", "emergency", "vacancy", "other"],
    },
  ] as readonly { kind: BudgetKind; ids: FinanceCategory[] }[],

  /** Only improvements and replacements default to capital. */
  treatmentDefault: [
    { category: "furniture", treatment: "capital" },
    { category: "turnover", treatment: "capital" },
    { category: "maintenance", treatment: "operating" },
    { category: "insurance", treatment: "operating" },
    { category: "other", treatment: "operating" },
  ] as readonly { category: FinanceCategory; treatment: ExpenseTreatment }[],

  /** New expenses default to today inside the report month, else the month's first day. */
  dateDefault: [
    { month: "2026-10", today: "2026-10-17", date: "2026-10-17" },
    { month: "2026-09", today: "2026-10-17", date: "2026-09-01" },
  ] as readonly { month: string; today: string; date: string }[],

  /** Annual bills default to a year; other goals to 6 months. */
  monthsDefault: [
    { category: "insurance", months: 12 },
    { category: "taxes", months: 12 },
    { category: "maintenance", months: 6 },
    { category: "other", months: 6 },
  ] as readonly { category: FinanceCategory; months: 6 | 12 }[],

  /** Optional goals: without a target nothing is invented; ranges are shared. */
  goalEntry: [
    {
      name: "no target invents no goal",
      target: "   ",
      months: "3",
      expected: { target_amount: null, months_remaining: null, targetError: null, monthsError: null },
    },
    {
      name: "a valid goal stays as entered",
      target: "12000",
      months: "12",
      expected: { target_amount: 12000, months_remaining: 12, targetError: null, monthsError: null },
    },
    {
      name: "months must be a whole number from 1 to 600",
      target: "125.50",
      months: "0",
      expected: { target_amount: 125.5, months_remaining: 0, targetError: null, monthsError: "Enter a whole number from 1 to 600." },
    },
    {
      name: "the target must be positive",
      target: "-5",
      months: "600",
      expected: { target_amount: null, months_remaining: null, targetError: "Enter a positive target amount.", monthsError: null },
    },
    {
      name: "500 months is out of range",
      target: "100",
      months: "601",
      expected: { target_amount: 100, months_remaining: 601, targetError: null, monthsError: "Enter a whole number from 1 to 600." },
    },
    {
      name: "an empty months field with a target is still invalid",
      target: "100",
      months: "",
      expected: { target_amount: 100, months_remaining: 0, targetError: null, monthsError: "Enter a whole number from 1 to 600." },
    },
    {
      name: "zero targets count as absent but rejected",
      target: "0",
      months: "3",
      expected: { target_amount: null, months_remaining: null, targetError: "Enter a positive target amount.", monthsError: null },
    },
  ] as readonly {
    name: string;
    target: string;
    months: string;
    expected: FinanceGoalEntry;
  }[],
};
