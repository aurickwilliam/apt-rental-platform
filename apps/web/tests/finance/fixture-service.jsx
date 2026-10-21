// In-memory transport for browser interaction checks. Never connects to Supabase.
import { useSyncExternalStore } from "react";
import { financeErrorMessage, shiftFinanceMonth } from "@repo/utils";
export { financeErrorMessage };

export const currentMonth = "2026-10";
export const properties = [
  "Bayview",
  "Canal House",
  "Garden Court",
  "River Place",
].map((name, index) => ({
  id: `10000000-0000-4000-8000-00000000000${index}`,
  name,
}));
const state = (window.financeTest = {
  reportFail: false,
  /** A missing finance table/RPC answers like Postgres does. */
  reportMissing: false,
  indicatorFail: false,
  ledgerFail: false,
  reviewFail: false,
  budgetFail: false,
  expenseFail: false,
  delay: 30,
  /** Months whose review is confirmed; a write reopens the month it touches. */
  reviewedMonths: [],
  /** Page size is deliberately small so Load more exercises the keyset. */
  expensePageSize: 2,
  /** Saved plans, one per property/month/category/kind, like the table. */
  budgets: [
    {
      id: "budget-a",
      apartment_id: properties[0].id,
      month: "2026-10",
      category: "maintenance",
      kind: "expense",
      amount: 3000,
      spent: 4200,
      target_amount: null,
      months_remaining: null,
    },
    {
      id: "budget-b",
      apartment_id: properties[1].id,
      month: "2026-10",
      category: "maintenance",
      kind: "expense",
      amount: 10000,
      spent: 0,
      target_amount: null,
      months_remaining: null,
    },
    {
      id: "budget-c",
      apartment_id: properties[2].id,
      month: "2026-10",
      category: "utilities",
      kind: "expense",
      amount: 0,
      spent: 0,
      target_amount: null,
      months_remaining: null,
    },
  ],
  expenses: [
    {
      id: "expense-a",
      apartment_id: properties[0].id,
      category: "maintenance",
      treatment: "operating",
      amount: 2500,
      spent_on: "2026-10-05",
      description: "Kitchen sink repair",
    },
    {
      id: "expense-b",
      apartment_id: properties[1].id,
      category: "maintenance",
      treatment: "operating",
      amount: 1500,
      spent_on: "2026-10-11",
      description: "Repaint gate",
    },
    {
      id: "expense-c",
      apartment_id: properties[2].id,
      category: "maintenance",
      treatment: "capital",
      amount: 4000,
      spent_on: "2026-10-19",
      description: "Turnover repaint",
    },
    {
      id: "expense-d",
      apartment_id: properties[3].id,
      category: "utilities",
      treatment: "operating",
      amount: 800,
      spent_on: "2026-10-02",
      description: "Association dues",
    },
    {
      id: "expense-e",
      apartment_id: properties[0].id,
      category: "maintenance",
      treatment: "operating",
      amount: 3200,
      spent_on: "2026-09-09",
      description: "September tiling",
    },
    {
      id: "expense-f",
      apartment_id: properties[1].id,
      category: "turnover",
      treatment: "capital",
      amount: 4000,
      spent_on: "2026-09-20",
      description: "September turnover clean",
    },
  ],
  noProperties: false,
  noActivity: false,
  noBillable: false,
  noPlans: false,
  noExpenses: false,
  /** Adds a second spending category to the report's category rows. */
  extraCategory: false,
  pendingReads: 0,
  writes: [],
  reads: [],
  identity: {
    user: { id: "auth-a" },
    profile: { id: "owner-a", roles: ["landlord"] },
    loading: false,
  },
});
export function useUser() {
  return useSyncExternalStore(
    (listener) => {
      window.addEventListener("fixture-identity", listener);
      return () => window.removeEventListener("fixture-identity", listener);
    },
    () => state.identity,
  );
}
const wait = () => new Promise((resolve) => setTimeout(resolve, state.delay));

export async function fetchFinances(scope) {
  const fail = state.reportFail || state.indicatorFail;
  const reviewed = state.reviewedMonths.includes(scope.month);
  state.reads.push({ ...scope });
  state.pendingReads += 1;
  await wait();
  state.pendingReads -= 1;
  if (state.reportMissing) throw { code: "PGRST202" };
  if (fail) throw { code: "NETWORK" };
  // Figures belong to the signed-in owner, so switching accounts must change
  // them — the UI may never show the previous owner's numbers.
  const owner = state.identity.profile?.id ?? "owner-a";
  const ownerFigures =
    owner === "owner-b"
      ? { collected: 12000, operating: 4000 }
      : { collected: 50000, operating: 11500 };
  const months = Array.from({ length: 12 }, (_, index) => ({
    month: shiftFinanceMonth(scope.month, index - 11),
    collected: scope.apartmentId ? 9000 : ownerFigures.collected,
    operating: scope.apartmentId ? 10000 : ownerFigures.operating,
    capital: 3000,
    reviewed,
  }));
  const report = {
    properties,
    months,
    incomeMonths: Array.from({ length: 24 }, (_, index) => ({
      month: shiftFinanceMonth(currentMonth, index - 23),
      collected: index % 2 ? 1000 : 0,
    })),
    comparison: { collected: 40000, operating: 10000, reviewed },
    categories: [
      { category: "maintenance", amount: 14500, previous_amount: 10000 },
    ],
    budgets: state.budgets
      .filter(
        (row) =>
          row.month === scope.month &&
          (!scope.apartmentId || row.apartment_id === scope.apartmentId),
      )
      .map((row) => ({ ...row })),
    performance: properties.map((property, index) => ({
      ...property,
      month: scope.month,
      collected: 9000 - index * 1000,
      operating: 10000,
      capital: 500,
      reviewed: index === 3 ? false : reviewed,
    })),
    collections: {
      expected: 70000,
      collected: 10000,
      pending: 20000,
      overdue: 40000,
      overdueCount: 2,
      age7: 10000,
      age30: 20000,
      ageOlder: 10000,
    },
    unclassified: 100,
  };
  if (state.noProperties) { report.properties = []; report.performance = []; }
  if (state.noActivity) report.months = report.months.map((month) => ({ ...month, collected: 0, operating: 0, capital: 0 }));
  if (state.noBillable) report.collections = Object.fromEntries(Object.keys(report.collections).map((key) => [key, 0]));
  if (state.noPlans) report.budgets = [];
  if (state.noExpenses) report.categories = [];
  if (state.extraCategory)
    report.categories = [
      ...report.categories,
      { category: "turnover", amount: 3000, previous_amount: 2000 },
    ];
  return report;
}
export async function fetchRentLedger(scope, status, after) {
  await wait();
  if (state.ledgerFail) throw new Error("offline");
  return {
    rows: Array.from({ length: after ? 1 : 30 }, (_, index) => ({
      id: `${status}-${after ? 30 : index}`,
      apartment_id: properties[0].id,
      apartment_name: properties[0].name,
      tenant_name: `Tenant ${after ? 30 : index}`,
      due_date: `${scope.month}-05`,
      expected: 10000,
      collected: 4000,
      outstanding: 6000,
      days_late: 15,
      status,
    })),
    next: after ? null : "cursor-30",
  };
}
export async function saveBudget(budget) {
  await wait();
  if (state.budgetFail) throw new Error("offline");
  // The database upserts one plan per property/month/category/kind, so
  // saving the same plan again updates it instead of adding a second row.
  const existing = state.budgets.find(
    (row) =>
      row.apartment_id === budget.apartment_id &&
      row.month === budget.month &&
      row.category === budget.category &&
      row.kind === budget.kind,
  );
  if (existing) {
    existing.amount = budget.amount;
    existing.target_amount = budget.target_amount ?? null;
    existing.months_remaining = budget.months_remaining ?? null;
  } else {
    state.budgets.push({
      id: `budget-${state.budgets.length + 1}`,
      apartment_id: budget.apartment_id,
      month: budget.month,
      category: budget.category,
      kind: budget.kind,
      amount: budget.amount,
      spent: 0,
      target_amount: budget.target_amount ?? null,
      months_remaining: budget.months_remaining ?? null,
    });
  }
  state.writes.push(budget);
}
export async function confirmExpenseReview(scope) {
  await wait();
  if (state.reviewFail) throw new Error("offline");
  state.writes.push({ review: scope });
  if (!state.reviewedMonths.includes(scope.month))
    state.reviewedMonths.push(scope.month);
}

/** Helpers shared by the expense transports: the report window, review
 *  invalidation and owner checks mirror the database rules visually. */
const inExpenseWindow = (spentOn, month) =>
  spentOn >= `${month}-01` && spentOn < `${shiftFinanceMonth(month, 1)}-01`;

/** Any write reopens the review for every month the row's date touches —
 *  a date moved to another month invalidates both (the DB trigger rule). */
function reopenReview(month) {
  const index = state.reviewedMonths.indexOf(month);
  if (index >= 0) state.reviewedMonths.splice(index, 1);
}

export async function fetchExpensePage(ownerId, scope, category, cursor) {
  state.pendingReads += 1;
  await wait();
  state.pendingReads -= 1;
  if (ownerId !== state.identity.profile?.id) throw { code: "42501" };
  if (state.expenseFail) throw new Error("offline");
  const rows = state.expenses
    .filter(
      (row) =>
        inExpenseWindow(row.spent_on, scope.month) &&
        (!scope.apartmentId || row.apartment_id === scope.apartmentId) &&
        (!category || row.category === category),
    )
    .filter(
      (row) =>
        !cursor ||
        row.spent_on < cursor.spent_on ||
        (row.spent_on === cursor.spent_on && row.id < cursor.id),
    )
    .sort(
      (a, b) =>
        b.spent_on.localeCompare(a.spent_on) || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0),
    );
  const page = rows.slice(0, state.expensePageSize);
  const last = page.at(-1);
  return {
    rows: page,
    next: last ? { spent_on: last.spent_on, id: last.id } : null,
  };
}

export async function saveExpense(ownerId, draft, editing) {
  state.pendingReads += 1;
  await wait();
  state.pendingReads -= 1;
  if (ownerId !== state.identity.profile?.id) throw { code: "42501" };
  if (state.expenseFail) throw new Error("offline");
  if (
    editing &&
    !state.expenses.some(
      (row) => row.id === draft.id && row.apartment_id === draft.apartment_id,
    )
  ) {
    throw { code: "PGRST116" };
  }
  const previous = editing
    ? state.expenses.find((row) => row.id === draft.id)
    : null;
  if (previous) reopenReview(previous.spent_on.slice(0, 7));
  reopenReview(draft.spent_on.slice(0, 7));
  const row = { ...draft, apartment_id: draft.apartment_id };
  if (previous) {
    state.expenses.splice(
      state.expenses.findIndex((existing) => existing.id === draft.id),
      1,
      row,
    );
  } else {
    state.expenses.push(row);
  }
  state.writes.push({ kind: "expense", editing, ...draft });
}

export async function deleteExpense(ownerId, id) {
  state.pendingReads += 1;
  await wait();
  state.pendingReads -= 1;
  if (ownerId !== state.identity.profile?.id) throw { code: "42501" };
  if (state.expenseFail) throw new Error("offline");
  const index = state.expenses.findIndex((row) => row.id === id);
  if (index < 0) throw { code: "PGRST116" };
  const [deleted] = state.expenses.splice(index, 1);
  reopenReview(deleted.spent_on.slice(0, 7));
  state.writes.push({ kind: "expense", delete: id, spent_on: deleted.spent_on });
}

export async function deleteBudget(ownerId, id) {
  await wait();
  if (state.budgetFail) throw new Error("offline");
  if (ownerId !== state.identity.profile?.id) throw { code: "42501" };
  const index = state.budgets.findIndex((row) => row.id === id);
  if (index < 0) throw { code: "PGRST116" };
  const [deleted] = state.budgets.splice(index, 1);
  state.writes.push({ deleteBudget: deleted.id, kind: deleted.kind });
}
