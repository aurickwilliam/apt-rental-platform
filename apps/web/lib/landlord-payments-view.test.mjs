import assert from "node:assert/strict";
import test from "node:test";
import {
  ALL_YEARS,
  availableLedgerYears,
  countByTab,
  filterByYear,
  isAwaitingCashConfirmation,
  ledgerPeriodLabel,
  matchesTab,
  sortLedger,
  summarizeLedger,
} from "./landlord-payments-view.ts";

const row = (id, status, date, amount = 1000, method = "gcash") => ({ id, status, date, amount, method });

const rows = [
  row("a", "Paid", "2026-09-24", 45000),
  row("b", "Paid", "2026-08-05", 45000, "cash"),
  row("c", "Pending", "2026-10-02", 45000, "cash"),
  row("d", "Pending", "2026-10-03", 5000, "gcash"),
  row("e", "Rejected", "2025-12-01", 45000, "cash"),
  row("f", "Failed", "2025-11-01", 45000),
];

test("years are listed newest first from the row dates", () => {
  assert.deepEqual(availableLedgerYears(rows), ["2026", "2025"]);
});

test("filterByYear keeps one year, or everything for the all-years value", () => {
  assert.deepEqual(filterByYear(rows, "2025").map((r) => r.id), ["e", "f"]);
  assert.equal(filterByYear(rows, ALL_YEARS).length, rows.length);
});

test("tabs group failed, unpaid and rejected as declined", () => {
  assert.equal(matchesTab(row("x", "Unpaid", "2026-01-01"), "declined"), true);
  assert.equal(matchesTab(row("x", "Paid", "2026-01-01"), "declined"), false);
  assert.deepEqual(countByTab(rows), { all: 6, paid: 2, pending: 2, declined: 2 });
});

test("only pending cash payments await the landlord", () => {
  assert.equal(isAwaitingCashConfirmation(rows[2]), true);
  assert.equal(isAwaitingCashConfirmation(rows[3]), false);
  assert.equal(isAwaitingCashConfirmation(rows[1]), false);
});

test("summary totals paid money only and separates cash awaiting confirmation", () => {
  const summary = summarizeLedger(rows);
  assert.equal(summary.collected, 90000);
  assert.equal(summary.paidCount, 2);
  assert.equal(summary.awaitingCount, 1);
  assert.equal(summary.awaitingAmount, 45000);
  assert.equal(summary.declinedCount, 2);
  assert.deepEqual(summary.lastPaid, { date: "2026-09-24", amount: 45000 });
});

test("summary of nothing is zeroed with no last payment", () => {
  assert.deepEqual(summarizeLedger([]), {
    collected: 0,
    paidCount: 0,
    awaitingCount: 0,
    awaitingAmount: 0,
    declinedCount: 0,
    lastPaid: null,
  });
});

test("null amounts count as zero", () => {
  assert.equal(summarizeLedger([row("n", "Paid", "2026-01-01", null)]).collected, 0);
});

test("sort does not mutate and honors direction", () => {
  const input = [rows[1], rows[0]];
  assert.deepEqual(sortLedger(input, "newest").map((r) => r.id), ["a", "b"]);
  assert.deepEqual(sortLedger(input, "oldest").map((r) => r.id), ["b", "a"]);
  assert.deepEqual(input.map((r) => r.id), ["b", "a"]);
});

test("period label carries the year and tolerates bad input", () => {
  assert.equal(ledgerPeriodLabel("2026-09-01"), "September 2026");
  assert.equal(ledgerPeriodLabel(null), "—");
  assert.equal(ledgerPeriodLabel("nonsense"), "nonsens");
});
