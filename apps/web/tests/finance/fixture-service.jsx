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
  indicatorFail: false,
  ledgerFail: false,
  reviewFail: false,
  budgetFail: false,
  delay: 30,
  reviewed: false,
  noProperties: false,
  noActivity: false,
  noBillable: false,
  noPlans: false,
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
  const reviewed = state.reviewed;
  state.reads.push({ ...scope });
  state.pendingReads += 1;
  await wait();
  state.pendingReads -= 1;
  if (fail) throw { code: "NETWORK" };
  const months = Array.from({ length: 12 }, (_, index) => ({
    month: shiftFinanceMonth(scope.month, index - 11),
    collected: scope.apartmentId ? 9000 : 50000,
    operating: scope.apartmentId ? 10000 : 11500,
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
    budgets: [
      {
        id: "budget-a",
        apartment_id: properties[0].id,
        month: scope.month,
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
        month: scope.month,
        category: "maintenance",
        kind: "expense",
        amount: 10000,
        spent: 0,
        target_amount: null,
        months_remaining: null,
      },
    ],
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
  state.writes.push(budget);
}
export async function confirmExpenseReview(scope) {
  await wait();
  if (state.reviewFail) throw new Error("offline");
  state.writes.push({ review: scope });
  state.reviewed = true;
}
export async function fetchExpensePage() {
  return { rows: [], next: null };
}
export async function saveExpense() {
  throw new Error("Not part of this fixture");
}
export async function deleteExpense() {
  throw new Error("Not part of this fixture");
}
export async function deleteBudget() {
  throw new Error("Not part of this fixture");
}
