import assert from "node:assert/strict";
import test from "node:test";
import { paidAmountForPeriod, getCurrentRentStatus } from "../../../packages/utils/src/rentPeriod.ts";
import { paymentBreakdown } from "../../../packages/utils/src/tenancyBill.ts";

const moveIn = {
  billing_kind: "move_in", status: "paid", amount: 45500,
  rent_amount: 15000, deposit_amount: 15000, advance_amount: 15000, maintenance_amount: 500,
  period_start: "2026-10-01", advance_period_start: "2026-11-01", advance_period_end: "2026-11-30",
};

test("move-in total cannot count deposit or fees as paid rent", () => {
  assert.equal(paidAmountForPeriod([moveIn], "2026-10-01"), 15000);
  assert.equal(paidAmountForPeriod([moveIn], "2026-11-01"), 15000);
  assert.equal(paidAmountForPeriod([moveIn], "2026-12-01"), 0);
});

test("pending/rejected/failed initial payments grant no coverage", () => {
  for (const status of ["pending", "rejected", "failed"]) {
    const payments = [{ ...moveIn, status }];
    assert.equal(paidAmountForPeriod(payments, "2026-10-01"), 0);
    assert.equal(paidAmountForPeriod(payments, "2026-11-01"), 0);
  }
});

test("historical payments retain the original rent calculation", () => {
  assert.equal(paidAmountForPeriod([{ amount: 15000, status: "paid", period_start: "2026-10-01" }], "2026-10-01"), 15000);
});

test("receipt breakdown adds to the payment total and identifies month 2 dates", () => {
  const rows = paymentBreakdown(moveIn);
  assert.equal(rows.reduce((sum, row) => sum + row.amount, 0), moveIn.amount);
  assert.match(rows[1].label, /held separately/);
  assert.match(rows[2].label, /month 2.*2026-11-01.*2026-11-30/);
  assert.deepEqual(paymentBreakdown({}), []);
});

test("authoritative bill takes precedence over a bounded payment-history page", () => {
  const result = getCurrentRentStatus({
    lease_start: "2026-10-18", rent_due_day: 5, monthly_rent: 15000,
    apartment: { monthly_rent: 25000 }, currentPayment: null,
    bill: { monthlyRent: 15000, periodStart: "2026-11-01", periodEnd: "2026-11-30", dueDate: "2026-11-05", rentPaid: true },
  }, []);
  assert.equal(result.isFullyPaid, true);
  assert.equal(result.status, "Paid");
  assert.equal(result.monthlyRent, 15000);
  assert.equal(result.periodStart, "2026-11-01");
});
