import assert from "node:assert/strict";
import { test } from "node:test";
import { isOverdue, summarizeDashboard } from "./summarize-dashboard.ts";

const TODAY = new Date(2026, 7, 15); // Aug 15, 2026

test("populated portfolio rolls up revenue, occupancy, and collection", () => {
  const data = summarizeDashboard(
    [{ status: "occupied" }, { status: "available" }],
    [
      { amount: 12000, date: "2026-08-01", status: "paid", due_date: "2026-08-05" },
      { amount: 8000, date: "2026-07-01", status: "paid", due_date: "2026-07-05" },
      { amount: 12000, date: "2026-08-01", status: "pending", due_date: "2026-08-20" },
      { amount: 9000, date: "2026-07-01", status: "unpaid", due_date: "2026-07-05" },
    ],
    TODAY,
  );

  assert.equal(data.totalProperties, 2);
  assert.equal(data.occupancyRate, 50);
  assert.equal(data.totalRevenueThisMonth, 12000);
  assert.equal(data.pendingPayments, 2);
  assert.deepEqual(
    data.rentCollection.map((s) => s.value),
    [2, 1, 1],
  );
  assert.equal(data.monthlyRevenue.length, 7);
  assert.equal(data.monthlyRevenue.at(-1)?.revenue, 12000);
  assert.equal(data.hasPayments, true);
});

test("zero properties yields a null occupancy rate and empty states", () => {
  const data = summarizeDashboard([], [], TODAY);

  assert.equal(data.totalProperties, 0);
  assert.equal(data.occupancyRate, null);
  assert.equal(data.totalRevenueThisMonth, 0);
  assert.equal(data.pendingPayments, 0);
  assert.deepEqual(
    data.rentCollection.map((s) => s.value),
    [0, 0, 0],
  );
  assert.equal(data.hasPayments, false);
});

test("overdue is derived from past due dates with unsettled statuses", () => {
  assert.equal(isOverdue("pending", "2026-08-14", "2026-08-15"), true);
  assert.equal(isOverdue("partial", "2026-08-14", "2026-08-15"), true);
  assert.equal(isOverdue("unpaid", "2026-08-14", "2026-08-15"), true);
  assert.equal(isOverdue("paid", "2026-08-14", "2026-08-15"), false);
  assert.equal(isOverdue("pending", "2026-08-15", "2026-08-15"), false);
  assert.equal(isOverdue("pending", "2026-08-20", "2026-08-15"), false);
  assert.equal(isOverdue("pending", null, "2026-08-15"), false);
});
