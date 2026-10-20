import assert from "node:assert/strict";
import { test } from "node:test";
import { buildFinancePlan, FINANCE_MONTHS, validateFinancePlan } from "./finance-planner.mjs";
import { stableId, previewToken } from "./planner.mjs";
import { operationSql, parseArgs, selectPlan } from "../db-populate.mjs";
import { suggestFinanceBudget } from "../../packages/utils/src/landlordFinance.ts";

const options = { years: 3, seed: "apt-demo-v1", asOf: "2026-10-17" };
function fixture() {
  const users = Array.from({ length: 6 }, (_, i) => ({ id: stableId("finance-fixture", `user:${i}`),
    roles: i === 1 ? ["landlord", "tenant", "admin"] : i === 4 ? ["admin"] : ["landlord"],
    is_suspended: i === 3, account_status: i === 2 ? "unverified" : "verified" }));
  const apartments = users.slice(0, 5).flatMap((u) => Array.from({ length: 3 }, (_, i) => ({
    id: stableId("finance-fixture", `${u.id}:apt:${i}`), landlord_id: u.id,
    monthly_rent: 12345.67, status: i === 1 ? "occupied" : "available", deleted_at: null, is_hidden_by_admin: false,
  })));
  return { tables: { users, apartments, landlord_expenses: [], landlord_budgets: [], landlord_finance_reviews: [],
    tenancies: [], rental_application: [], visit_request: [], payment: [], maintenance_request: [], favorites: [], reviews: [], chat: [], conversation_preferences: [], user_blocks: [] }, storage: [] };
}

test("finance is deterministic, input-order independent, owner-balanced and leaves input untouched", () => {
  const inventory = fixture();
  const before = structuredClone(inventory);
  const a = buildFinancePlan(inventory, options);
  assert.deepEqual(inventory, before);
  assert.deepEqual(buildFinancePlan(inventory, options), a);
  for (const rows of Object.values(inventory.tables)) rows.reverse();
  assert.deepEqual(buildFinancePlan(inventory, options), a);
  assert.equal(a.summary.landlordsCovered, 3);
  assert.equal(a.summary.skipped.finance_landlords_without_properties, 1);
  assert.equal(a.summary.counts.landlord_expenses, 3 * 2 * FINANCE_MONTHS * 2);
  assert.equal(a.summary.counts.landlord_budgets, 3 * 2 * FINANCE_MONTHS * 4);
  const owners = new Set(a.rows.map((r) => r.data.landlord_id));
  assert.ok(owners.has(before.tables.users[1].id), "mixed admin/landlord is a normal finance owner");
  assert.ok(owners.has(before.tables.users[2].id), "verification is not a finance permission");
  assert.ok(!owners.has(before.tables.users[3].id));
  assert.ok(!owners.has(before.tables.users[4].id));
});

test("every spending limit has matching actuals, under/over cases, capital costs and valid reserve goals", () => {
  const inventory = fixture();
  for (let i = 0; i < 12; i++) {
    const plan = buildFinancePlan(inventory, { ...options, seed: `finance-${i}` });
    assert.equal(validateFinancePlan(plan, inventory), true);
    const expenses = plan.rows.filter((r) => r.table === "landlord_expenses").map((r) => r.data);
    const budgets = plan.rows.filter((r) => r.table === "landlord_budgets").map((r) => r.data);
    assert.ok(expenses.some((e) => e.treatment === "capital"));
    assert.ok(expenses.some((e) => e.spent_on.startsWith(options.asOf.slice(0, 7))));
    const comparisons = budgets.filter((b) => b.kind === "expense").map((b) => {
      const spent = expenses.filter((e) => e.apartment_id === b.apartment_id && e.category === b.category && `${e.spent_on.slice(0, 7)}-01` === b.month).reduce((sum, e) => sum + Number(e.amount), 0);
      assert.ok(spent > 0);
      return spent > Number(b.amount);
    });
    assert.ok(comparisons.includes(true) && comparisons.includes(false));
    for (const b of budgets.filter((b) => b.kind === "reserve")) assert.equal(Number(b.amount), suggestFinanceBudget({ ...b, target_amount: Number(b.target_amount) }).amount);
    assert.ok(expenses.every((e) => e.spent_on <= plan.asOf));
  }
});

test("reviewed, manually expensed and conflicting budget months are preserved without upserts", () => {
  const inventory = fixture();
  const original = buildFinancePlan(inventory, options);
  const a = original.rows.find((r) => r.table === "landlord_expenses").data;
  const scope = { landlord_id: a.landlord_id, apartment_id: a.apartment_id };
  inventory.tables.landlord_finance_reviews.push({ ...scope, month: "2026-10-01" });
  inventory.tables.landlord_expenses.push({ ...scope, id: stableId("finance-fixture", "manual"), spent_on: "2026-09-05", amount: 100 });
  inventory.tables.landlord_budgets.push({ ...scope, month: "2026-08-01", category: "maintenance", kind: "expense", amount: 0 });
  const before = structuredClone(inventory);
  const plan = buildFinancePlan(inventory, options);
  assert.deepEqual(inventory, before);
  assert.equal(plan.summary.skipped.finance_reviewed_months_preserved, 1);
  assert.equal(plan.summary.skipped.finance_existing_expense_months_preserved, 1);
  assert.equal(plan.summary.skipped.finance_existing_budget_months_preserved, 1);
  assert.ok(plan.rows.every((r) => r.data.apartment_id !== a.apartment_id || !["2026-10", "2026-09", "2026-08"].includes((r.data.month ?? r.data.spent_on).slice(0, 7))));
});

test("empty/fully protected portfolios are reported, never force-populated", () => {
  const inventory = fixture();
  inventory.tables.apartments.forEach((a) => { a.is_hidden_by_admin = true; });
  const plan = buildFinancePlan(inventory, options);
  assert.equal(plan.rows.length, 0);
  assert.equal(plan.summary.landlordsCovered, 0);
  assert.ok(plan.summary.skipped.finance_landlords_without_properties > 0);
});

test("fully reviewed first-choice properties do not starve an owner with other safe listings", () => {
  const inventory = fixture();
  const original = buildFinancePlan(inventory, options);
  const owner = inventory.tables.users[0].id;
  const chosen = new Set(original.rows.filter((r) => r.data.landlord_id === owner).map((r) => r.data.apartment_id));
  for (const apartment_id of chosen) {
    for (const month of ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]) inventory.tables.landlord_finance_reviews.push({ landlord_id: owner, apartment_id, month: `${month}-01` });
  }
  const result = buildFinancePlan(inventory, options);
  assert.equal(result.summary.landlordsCovered, 3);
  assert.ok(result.rows.some((r) => r.data.landlord_id === owner && !chosen.has(r.data.apartment_id)));
});

test("first-day/leap-year dates, cents and unsafe plan tampering are validated", () => {
  for (const asOf of ["2024-02-01", "2024-02-29", "2026-01-01"]) {
    const plan = buildFinancePlan(fixture(), { ...options, asOf });
    assert.ok(plan.rows.filter((r) => r.table === "landlord_expenses").every((r) => r.data.spent_on <= asOf));
  }
  for (const mutate of [
    (p) => { p.version = 999; },
    (p) => { p.rows[0].table = "users"; },
    (p) => { p.rows[0].data.amount = "NaN"; },
    (p) => { p.rows[0].data.spent_on = "2026-12-31"; },
    (p) => { p.rows[0].data.category = "emergency"; },
    (p) => { p.rows[0].data.landlord_id = fixture().tables.users[4].id; },
  ]) {
    const plan = buildFinancePlan(fixture(), options);
    mutate(plan);
    assert.throws(() => validateFinancePlan(plan, fixture()));
  }
});

test("saved plans are reused verbatim; finance receipts cannot authorize rental operations", () => {
  const inventory = fixture();
  const fresh = selectPlan(inventory, options);
  assert.equal(fresh.finance.component, "finance");
  const legacy = { version: 1, ...options, rows: [], summary: {} };
  inventory.run = { id: stableId(options.seed, "run"), status: "applied", plan: legacy };
  assert.strictEqual(selectPlan(inventory, options), legacy);
  const extension = selectPlan(inventory, options, true);
  inventory.financeRun = { status: "cleaned", plan: extension };
  inventory.tables.apartments = [];
  assert.strictEqual(selectPlan(inventory, options, true), extension);
  assert.notEqual(previewToken("state", "finance:apply", extension), previewToken("state", "apply", extension));
  assert.match(operationSql("apply", extension, "state", inventory.run.id, true, true), /begin read only;[\s\S]*demo_population.execute_finance/);
  assert.throws(() => parseArgs(["--finance"]));
  assert.equal(parseArgs(["--finance", "--verify", "--run", inventory.run.id]).finance, true);
  inventory.run.status = "cleaned";
  assert.throws(() => selectPlan(inventory, options, true));
});
