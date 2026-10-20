import { createHash } from "node:crypto";
import { MAX_PLAN_ROWS, stableId, validateOptions } from "./planner.mjs";
import {
  budgetCategoryOptions, parseFinanceAmount, shiftFinanceMonth,
  suggestFinanceBudget, validateExpenseDate,
} from "../../packages/utils/src/landlordFinance.ts";

// Independent namespace: never change the rental generator's version or IDs.
export const FINANCE_VERSION = 1;
export const FINANCE_TABLES = ["landlord_expenses", "landlord_budgets"];
export const FINANCE_MONTHS = 6;
export const FINANCE_PROPERTIES_PER_OWNER = 2;
const hash = (value) => createHash("sha256").update(value).digest("hex");
const propertyMonth = (row, month) => `${row.landlord_id}:${row.apartment_id}:${month}`;
const budgetKey = (row) => `${propertyMonth(row, row.month)}:${row.category}:${row.kind}`;
const money = (cents) => (cents / 100).toFixed(2);

export function buildFinancePlan(inventory, options) {
  validateOptions(options);
  const { seed, years, asOf } = options;
  const source = inventory.tables;
  const rows = [];
  const skipped = {};
  const skip = (reason) => { skipped[reason] = (skipped[reason] ?? 0) + 1; };
  const reviews = new Set((source.landlord_finance_reviews ?? []).map((r) => propertyMonth(r, r.month)));
  const expenses = new Set((source.landlord_expenses ?? []).map((r) => propertyMonth(r, `${r.spent_on.slice(0, 7)}-01`)));
  const budgets = new Set((source.landlord_budgets ?? []).map(budgetKey));
  const owners = source.users.filter((u) => u.roles?.includes("landlord") && !u.is_suspended).sort((a, b) => a.id.localeCompare(b.id));
  const covered = new Set();
  const add = (table, key, data) => rows.push({ table, data: {
    id: stableId(seed, `finance:v${FINANCE_VERSION}:${key}`), ...data,
  } });

  for (const owner of owners) {
    // Finances do not require a tenant, Passport, or an occupied unit.
    const properties = source.apartments.filter((a) => a.landlord_id === owner.id && !a.deleted_at && !a.is_hidden_by_admin && ["available", "occupied"].includes(a.status) && Number(a.monthly_rent) > 0)
      .sort((a, b) => hash(`${seed}:finance:${a.id}`).localeCompare(hash(`${seed}:finance:${b.id}`)));
    if (!properties.length) { skip("finance_landlords_without_properties"); continue; }
    let populatedProperties = 0;
    for (const apartment of properties) {
      if (populatedProperties >= FINANCE_PROPERTIES_PER_OWNER) break;
      const previousCount = rows.length;
      // Illustrative demo amounts only, not market estimates. Integer cent
      // arithmetic avoids introducing floating-point rounding into expenses.
      const rentCents = Math.min(100_000_000, Math.max(100_000, Math.round(Number(apartment.monthly_rent) * 100)));
      const limitCents = Math.max(10_000, Math.floor(rentCents / 10));
      for (let offset = 0; offset < FINANCE_MONTHS; offset++) {
        const month = `${shiftFinanceMonth(asOf, -offset)}-01`;
        const scope = { landlord_id: owner.id, apartment_id: apartment.id };
        const key = propertyMonth(scope, month);
        // Inserting OR deleting an expense invalidates an existing review.
        // Preserve complete manual property-months, not just individual rows.
        if (reviews.has(key)) { skip("finance_reviewed_months_preserved"); continue; }
        if (expenses.has(key)) { skip("finance_existing_expense_months_preserved"); continue; }
        const capital = offset % 3 === 0;
        const categories = ["maintenance", capital ? "furniture" : "utilities"];
        const definitions = [
          ...categories.map((category) => ({ ...scope, month, category, kind: "expense", amount: money(limitCents), target_amount: null, months_remaining: null })),
          ...["insurance", "emergency"].map((category) => {
            const months = category === "insurance" ? 12 : 6;
            // Whole-peso monthly targets keep the shared suggestion and SQL's
            // decimal arithmetic identical, including fractional listing rents.
            const target = Math.ceil((category === "insurance" ? rentCents : rentCents * 2) / (months * 100)) * months * 100;
            const goal = { category, kind: "reserve", target_amount: Number(money(target)), months_remaining: months };
            return { ...scope, month, ...goal, amount: suggestFinanceBudget(goal).amount.toFixed(2), target_amount: money(target) };
          }),
        ];
        // No upserts, including a manually saved budget of zero pesos.
        if (definitions.some((b) => budgets.has(budgetKey(b)))) { skip("finance_existing_budget_months_preserved"); continue; }
        for (const budget of definitions) add("landlord_budgets", `${key}:budget:${budget.category}:${budget.kind}`, budget);
        const date = offset === 0 ? `${month.slice(0, 8)}${String(Math.min(5, Number(asOf.slice(8)))).padStart(2, "0")}` : `${month.slice(0, 8)}05`;
        categories.forEach((category, index) => {
          // Every populated month shows one under-limit and one over-limit row.
          const amount = index === 0 ? Math.floor(limitCents * 3 / 4) : Math.floor(limitCents * 5 / 4);
          add("landlord_expenses", `${key}:expense:${category}`, {
            ...scope, category, treatment: index === 1 && capital ? "capital" : "operating",
            amount: money(amount), spent_on: date,
            description: `Demo scenario: ${category === "furniture" ? "appliance replacement" : category === "maintenance" ? "routine plumbing repair" : "owner-paid common-area utilities"}.`,
            created_at: `${date}T10:00:00+08:00`,
          });
        });
        covered.add(owner.id);
      }
      if (rows.length > previousCount) populatedProperties++;
    }
    if (!covered.has(owner.id)) skip("finance_landlords_without_safe_months");
  }
  rows.sort((a, b) => FINANCE_TABLES.indexOf(a.table) - FINANCE_TABLES.indexOf(b.table) || a.data.id.localeCompare(b.data.id));
  if (rows.length > MAX_PLAN_ROWS) throw new Error("Generated finance dataset exceeds the 5,000-row safety limit.");
  const plan = { version: FINANCE_VERSION, component: "finance", seed, years, asOf, rows,
    summary: { counts: Object.fromEntries(FINANCE_TABLES.map((table) => [table, rows.filter((r) => r.table === table).length])),
      landlordsCovered: covered.size, eligibleLandlords: owners.length, months: FINANCE_MONTHS, skipped, simulatedHistory: true } };
  validateFinancePlan(plan, inventory);
  return plan;
}

export function validateFinancePlan(plan, inventory) {
  validateOptions(plan);
  if (plan.component !== "finance" || plan.version !== FINANCE_VERSION || !Array.isArray(plan.rows) || plan.rows.length > MAX_PLAN_ROWS) throw new Error("Unsupported finance plan.");
  const users = new Map(inventory.tables.users.map((u) => [u.id, u]));
  const apartments = new Map(inventory.tables.apartments.map((a) => [a.id, a]));
  const ids = new Set();
  const keys = new Set((inventory.tables.landlord_budgets ?? []).map(budgetKey));
  for (const { table, data } of plan.rows) {
    if (!FINANCE_TABLES.includes(table) || ids.has(data.id)) throw new Error("Unexpected finance table or duplicate ID.");
    ids.add(data.id);
    const apartment = apartments.get(data.apartment_id);
    const owner = users.get(data.landlord_id);
    if (!owner?.roles?.includes("landlord") || owner.is_suspended || !apartment || apartment.landlord_id !== owner.id || apartment.deleted_at || apartment.is_hidden_by_admin || !["available", "occupied"].includes(apartment.status)) throw new Error("Invalid finance owner/property relationship.");
    const month = table === "landlord_budgets" ? data.month : `${data.spent_on?.slice(0, 7)}-01`;
    if (!/^\d{4}-(0[1-9]|1[0-2])-01$/.test(month) || month > `${plan.asOf.slice(0, 7)}-01` || month < `${shiftFinanceMonth(plan.asOf, 1 - FINANCE_MONTHS)}-01`) throw new Error("Finance month outside the frozen window.");
    if (parseFinanceAmount(String(data.amount), table === "landlord_budgets") === null) throw new Error("Invalid finance amount.");
    if (table === "landlord_expenses") {
      if (validateExpenseDate(data.spent_on, plan.asOf) || !["operating", "capital"].includes(data.treatment) || !budgetCategoryOptions("expense").some((c) => c.id === data.category) || !data.description?.startsWith("Demo scenario:") || data.description.length > 200 || data.created_at !== `${data.spent_on}T10:00:00+08:00`) throw new Error("Invalid demo expense.");
      if ((inventory.tables.landlord_finance_reviews ?? []).some((r) => propertyMonth(r, r.month) === propertyMonth(data, month)) || (inventory.tables.landlord_expenses ?? []).some((r) => propertyMonth(r, `${r.spent_on.slice(0, 7)}-01`) === propertyMonth(data, month))) throw new Error("Existing finance month must be preserved.");
    } else {
      if (!["expense", "reserve"].includes(data.kind) || !budgetCategoryOptions(data.kind).some((c) => c.id === data.category) || keys.has(budgetKey(data))) throw new Error("Invalid or conflicting demo budget.");
      keys.add(budgetKey(data));
      if ((data.target_amount === null) !== (data.months_remaining === null) || (data.target_amount !== null && (parseFinanceAmount(String(data.target_amount)) === null || !Number.isInteger(data.months_remaining) || data.months_remaining < 1 || data.months_remaining > 600))) throw new Error("Invalid finance goal.");
    }
  }
  return true;
}
