import assert from "node:assert/strict";
import { test } from "node:test";
import { financeReportHref } from "./landlord-finance-params.ts";
import {
  createFinancePages,
  mergeFinancePageRows,
} from "./landlord-finance-pages.ts";
import {
  financeGuidelineSections,
  financePlanTotals,
  financeRentIndicator,
  financeTrendWindow,
  formatFinanceMoney,
  toggleFinanceTrendSeries,
} from "../../../packages/utils/src/landlordFinance.ts";
import { formatPesoDisplay } from "../../../packages/utils/src/formatCurrencyInput.ts";
import { financeSignedMoneyFixtures } from "../../../packages/utils/src/landlordFinanceFixtures.ts";

test("finance links change scope atomically and retain repeated unrelated triggers", () => {
  const href = financeReportHref(
    "month=2026-09&apartmentId=old&tab=overview&notifications=open&settings=security&x=a&x=b",
    { month: "2026-10", apartmentId: null, tab: "expenses" },
  );
  const params = new URL(href, "https://apt.test").searchParams;
  assert.equal(params.get("month"), "2026-10");
  assert.equal(params.get("tab"), "expenses");
  assert.equal(params.get("apartmentId"), null);
  assert.equal(params.get("notifications"), "open");
  assert.equal(params.get("settings"), "security");
  assert.deepEqual(params.getAll("x"), ["a", "b"]);
  assert.ok(
    financeReportHref(
      "",
      { month: "2026-10" },
      "/landlord/analytics/property-performance",
    ).startsWith("/landlord/analytics/property-performance?"),
  );
});

test("losses keep a minus sign without changing the unsigned peso input formatter", () => {
  for (const fixture of financeSignedMoneyFixtures)
    assert.equal(
      formatFinanceMoney(fixture.amount, formatPesoDisplay),
      fixture.expected,
    );
  assert.equal(formatFinanceMoney(-10000, formatPesoDisplay), "−₱ 10,000");
  assert.equal(formatFinanceMoney(-0.5, formatPesoDisplay), "−₱ 0.5");
  assert.equal(formatFinanceMoney(0, formatPesoDisplay), "₱ 0");
  assert.equal(formatPesoDisplay(-10000), "₱ 10,000");
});

test("attention checks individual overages even if grouped limits cover their total", () => {
  const budgets = [
    { kind: "expense", amount: 100, spent: 200 },
    { kind: "expense", amount: 1000, spent: 0 },
    { kind: "reserve", amount: 500, spent: 900 },
  ];
  assert.deepEqual(financePlanTotals(budgets), {
    spending: 1100,
    reserve: 500,
    overLimit: true,
  });
  assert.deepEqual(financePlanTotals([]), {
    spending: 0,
    reserve: 0,
    overLimit: false,
  });
});

test("trend windows stay bounded and net eligibility follows only displayed reviews", () => {
  const months = Array.from({ length: 8 }, (_, index) => ({
    month: `2026-0${index + 1}`,
    collected: index * 1000,
    operating: 100,
    capital: 50,
    reviewed: index > 1,
  }));
  assert.equal(financeTrendWindow(months, 6).points.length, 6);
  assert.equal(financeTrendWindow(months, 6).allReviewed, true);
  assert.equal(financeTrendWindow(months, 12).allReviewed, false);
  assert.equal(financeTrendWindow(months.slice(-2), 12).points.length, 2);
  assert.deepEqual(financeTrendWindow([], 6), {
    points: [],
    allReviewed: false,
    hasActivity: false,
  });
});

test("trend controls never hide both cash series; net remains an independent option", () => {
  const state = { collected: true, expenses: false, net: true };
  assert.equal(toggleFinanceTrendSeries(state, "collected"), state);
  assert.deepEqual(toggleFinanceTrendSeries(state, "net"), {
    ...state,
    net: false,
  });
  assert.deepEqual(toggleFinanceTrendSeries(state, "expenses"), {
    ...state,
    expenses: true,
  });
});

test("rent indicators use the full picker window and distinguish missing data", () => {
  const data = [
    { month: "2024-11", collected: 100 },
    { month: "2026-10", collected: 0 },
  ];
  assert.equal(
    financeRentIndicator("2024-11", "2026-10", data, false),
    "rent collected",
  );
  assert.equal(
    financeRentIndicator("2026-10", "2026-10", data, false),
    "no rent collected",
  );
  assert.equal(
    financeRentIndicator("2024-10", "2026-10", data, false),
    "outside report range",
  );
  assert.equal(
    financeRentIndicator("2026-11", "2026-10", data, false),
    "outside report range",
  );
  assert.equal(
    financeRentIndicator("2024-11", "2026-10", data, true),
    "rent data unavailable",
  );
  assert.equal(
    financeRentIndicator("2026-09", "2026-10", data, false),
    "rent data unavailable",
  );
});

test("guidelines retain financial limitations and recorded cut-off date", () => {
  const sections = financeGuidelineSections("2026-10-20");
  assert.equal(sections.length, 7);
  assert.match(
    sections.map((section) => section.body).join(" "),
    /not tax, accounting, legal or investment advice/,
  );
  assert.match(sections[4].body, /2026-10-20/);
  assert.match(
    sections[6].body,
    /ended leases with a recorded end date.*Removed listings.*test funds/,
  );
});

test("a refresh overlapping a new scope can never relabel the previous scope's rows", async () => {
  const applied = [];
  const pages = createFinancePages({
    apply: (key, snapshot) => applied.push({ key, ...snapshot }),
    toMessage: () => "offline",
  });
  await pages.open({ key: "owner-a", scope: "a" }, async () => ({
    rows: [{ id: "a" }],
    next: "cursor-a",
  }));
  let complete;
  const pending = pages.open(
    { key: "owner-b", scope: "b" },
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  let loadMoreCalls = 0;
  await pages.loadMore(async () => {
    loadMoreCalls += 1;
    return { rows: [], next: null };
  });
  assert.equal(loadMoreCalls, 0);
  await pages.refresh(async () => {
    throw new Error("offline");
  });
  assert.deepEqual(applied.at(-1).rows, []);
  complete({ rows: [{ id: "stale-b" }], next: null });
  await pending;
  assert.deepEqual(applied.at(-1).rows, []);
});

test("overlapping keyset pages keep each record once in its original order", () => {
  assert.deepEqual(
    mergeFinancePageRows(
      [{ id: "a" }, { id: "b" }],
      [{ id: "b" }, { id: "c" }],
    ),
    [{ id: "a" }, { id: "b" }, { id: "c" }],
  );
});
