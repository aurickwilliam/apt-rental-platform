import assert from "node:assert/strict";
import { test } from "node:test";

import { financeMonthFromParam } from "../../../packages/utils/src/landlordFinance.ts";

import {
  FINANCE_ACCESS_ERROR,
  canManageLandlordFinances,
  landlordFinanceAccessRedirect,
} from "./landlord-finance-access.ts";
import {
  financeApartmentParam,
  financeMonthParam,
  financeTabParam,
  parseLandlordFinanceParams,
} from "./landlord-finance-params.ts";
import { createFinancePages, emptyFinancePages } from "./landlord-finance-pages.ts";

/**
 * Web-side tests for the Profit & planning resource layer
 * (docs/plans/landlord-web-budget-analytics-parity.md §9.2, Phase 2): URL
 * parsing and access rules are pure, and the pages controller carries the
 * account-transition / request-race / stale-scope / error-handling semantics
 * the two paginated hooks run in React.
 */

const CURRENT = "2026-10";
const PROPERTY_ID = "550e8400-e29b-41d4-a716-446655440000";

test("applied months run through the shared 24-month window", () => {
  const cases = [
    ["2026-10", CURRENT],
    ["2026-09", "2026-09"],
    ["2024-11", "2024-11"],
    ["2024-10", CURRENT], // one month beyond the picker window
    ["2027-01", CURRENT], // future
    ["2026-13", CURRENT], // malformed
    ["not-a-month", CURRENT],
    ["2026-10 ", "2026-10"],
    ["", CURRENT],
    [undefined, CURRENT],
  ];
  for (const [value, expected] of cases) {
    assert.equal(financeMonthParam(value, CURRENT, financeMonthFromParam), expected);
  }
  // Repeated keys resolve to their first value, like Next.js searchParams.
  assert.equal(
    financeMonthParam(["2026-05", "2026-09"], CURRENT, financeMonthFromParam),
    "2026-05",
  );
});

test("property ids accept only UUIDs; anything else reads as All properties", () => {
  assert.equal(financeApartmentParam(PROPERTY_ID), PROPERTY_ID);
  assert.equal(financeApartmentParam(PROPERTY_ID.toUpperCase()), PROPERTY_ID.toUpperCase());
  assert.equal(financeApartmentParam(` ${PROPERTY_ID} `), PROPERTY_ID);
  assert.equal(financeApartmentParam("550e8400"), null);
  assert.equal(financeApartmentParam(""), null);
  assert.equal(financeApartmentParam(null), null);
  assert.equal(financeApartmentParam(undefined), null);
  assert.equal(financeApartmentParam(["broken", PROPERTY_ID]), null);
});

test("tabs read as overview unless they are one of the three finance tabs", () => {
  assert.equal(financeTabParam("overview"), "overview");
  assert.equal(financeTabParam("expenses"), "expenses");
  assert.equal(financeTabParam("budget"), "budget");
  assert.equal(financeTabParam("Overview"), "overview");
  assert.equal(financeTabParam("tenant"), "overview");
  assert.equal(financeTabParam(["expenses"]), "expenses");
  assert.equal(financeTabParam(undefined), "overview");
});

test("the whole route parses with one shared implementation", () => {
  assert.deepStrictEqual(
    parseLandlordFinanceParams(
      { month: "2026-02", apartmentId: PROPERTY_ID, tab: "expenses" },
      CURRENT,
      financeMonthFromParam,
    ),
    { month: "2026-02", apartmentId: PROPERTY_ID, tab: "expenses" },
  );
  assert.deepStrictEqual(
    parseLandlordFinanceParams({}, CURRENT, financeMonthFromParam),
    { month: CURRENT, apartmentId: null, tab: "overview" },
  );
  assert.deepStrictEqual(
    parseLandlordFinanceParams({ month: "2099-04", apartmentId: "junk", tab: "budget" }, CURRENT, financeMonthFromParam),
    { month: CURRENT, apartmentId: null, tab: "budget" },
  );
});

test("finance access is active landlord membership only", () => {
  assert.equal(canManageLandlordFinances({ roles: ["landlord"], isSuspended: false }), true);
  // Mixed admin/landlord profiles transact like any landlord; admin-only
  // grants nothing.
  assert.equal(canManageLandlordFinances({ roles: ["admin", "landlord"], isSuspended: false }), true);
  assert.equal(canManageLandlordFinances({ roles: ["admin"], isSuspended: false }), false);
  assert.equal(canManageLandlordFinances({ roles: ["tenant"], isSuspended: false }), false);
  assert.equal(canManageLandlordFinances({ roles: [], isSuspended: false }), false);
  assert.equal(canManageLandlordFinances({ roles: ["landlord"], isSuspended: true }), false);
});

test("finance redirects: signed-out, suspended notice, browsing fallback, else entry", () => {
  assert.equal(
    landlordFinanceAccessRedirect({ authUserId: null, roles: [], isSuspended: false }),
    "/sign-in",
  );
  assert.equal(
    landlordFinanceAccessRedirect({ authUserId: "u1", roles: ["landlord"], isSuspended: true }),
    "/suspended",
  );
  assert.equal(landlordFinanceAccessRedirect({ authUserId: "u1", roles: ["tenant"], isSuspended: false }), "/browse");
  assert.equal(landlordFinanceAccessRedirect({ authUserId: "u1", roles: ["admin"], isSuspended: false }), "/browse");
  assert.equal(
    landlordFinanceAccessRedirect({ authUserId: "u1", roles: ["admin", "landlord"], isSuspended: false }),
    null,
  );
  assert.equal(
    landlordFinanceAccessRedirect({ authUserId: "u1", roles: ["landlord"], isSuspended: false }),
    null,
  );
});

test("the client access gate sentence matches the mobile wording", () => {
  assert.equal(FINANCE_ACCESS_ERROR, "Switch to your landlord portal to manage finances.");
});

// ---------------------------------------------------------------------------
// Pages controller — keyset accumulation guarded by scope and sequence.
// ---------------------------------------------------------------------------

function createPagesHarness() {
  const applied = [];
  const controller = createFinancePages({
    apply: (key, snapshot) => {
      applied.push({ key, snapshot: { ...snapshot } });
    },
    toMessage: (error) => (error && error.message) || "unreadable",
  });
  return { controller, applied, last: () => applied.at(-1) };
}

function deferredPage() {
  let resolvePage;
  let rejectPage;
  const promise = new Promise((resolve, reject) => {
    resolvePage = resolve;
    rejectPage = reject;
  });
  return { promise, resolvePage, rejectPage };
}

/** A controllable fetcher that records every call, awaiting `settle()`. */
function deferredFetcher(name, calls) {
  const page = deferredPage();
  const fetcher = () => {
    calls.push(name);
    return page.promise;
  };
  return { fetcher, resolvePage: page.resolvePage, rejectPage: page.rejectPage, name };
}

test("an idle snapshot has no rows, no cursor and no errors", () => {
  assert.deepStrictEqual(emptyFinancePages(), {
    rows: [],
    next: null,
    loadingMore: false,
    error: null,
    pageError: null,
  });
});

test("a superseded first page never reaches the trail after a scope change", async () => {
  const { controller, applied, last } = createPagesHarness();
  const calls = [];
  const stale = deferredFetcher("stale", calls);
  const fresh = deferredFetcher("fresh", calls);

  const staleOp = controller.open({ key: "owner-a|2026-09|", scope: "a" }, stale.fetcher);
  const freshOp = controller.open({ key: "owner-a|2026-10|", scope: "b" }, fresh.fetcher);

  stale.resolvePage({ rows: ["stale-row"], next: null });
  await staleOp; // resolves; its result must be discarded
  fresh.resolvePage({ rows: ["fresh-row"], next: null });
  await freshOp;

  assert.deepStrictEqual(last(), {
    key: "owner-a|2026-10|",
    snapshot: { rows: ["fresh-row"], next: null, loadingMore: false, error: null, pageError: null },
  });
  assert.ok(!applied.some((entry) => entry.key === "owner-a|2026-09|"));
});

test("an overlapping reload of the same scope wins over the earlier request", async () => {
  const { controller, applied, last } = createPagesHarness();
  const calls = [];
  const first = deferredFetcher("first", calls);
  const retried = deferredFetcher("retried", calls);

  const opened = controller.open({ key: "k", scope: "same" }, first.fetcher);
  const refreshed = controller.refresh(retried.fetcher);

  first.resolvePage({ rows: ["late"], next: null });
  await opened; // discarded — the refresh is newer work
  retried.resolvePage({ rows: ["retried-row"], next: null });
  await refreshed;

  assert.equal(last().snapshot.rows[0], "retried-row");
  assert.equal(applied.length, 1);
  assert.deepStrictEqual(calls, ["first", "retried"]);
});

test("opening the settled same scope again does not fetch twice", async () => {
  const { controller } = createPagesHarness();
  const calls = [];
  const page = deferredFetcher("only", calls);

  // The second open runs while the first page is still unsettled — the same
  // key must not queue a second fetch in either phase.
  const firstOp = controller.open({ key: "k", scope: "a" }, page.fetcher);
  const secondOp = controller.open({ key: "k", scope: "a" }, page.fetcher);
  page.resolvePage({ rows: ["r1"], next: null });
  await firstOp;
  await secondOp;

  assert.deepStrictEqual(calls, ["only"]);
  assert.ok(secondOp instanceof Promise);
});

test("load-more appends a single-flight page and closes the trail", async () => {
  const { controller, last } = createPagesHarness();
  const calls = [];
  const first = deferredFetcher("first", calls);
  const more = deferredFetcher("more", calls);
  const duplicate = deferredFetcher("duplicate", calls);

  const opened = controller.open({ key: "k", scope: "a" }, first.fetcher);
  first.resolvePage({ rows: ["r1"], next: "c1" });
  await opened;

  const moreOp = controller.loadMore(more.fetcher);
  const duplicateOp = controller.loadMore(duplicate.fetcher); // single flight
  more.resolvePage({ rows: ["r2"], next: null });
  await moreOp;
  await duplicateOp;

  assert.deepStrictEqual(calls, ["first", "more"]);
  assert.deepStrictEqual(last().snapshot.rows, ["r1", "r2"]);
  assert.equal(last().snapshot.next, null);
  assert.equal(last().snapshot.loadingMore, false);
});

test("a load-more result is discarded after the scope changes", async () => {
  const { controller, applied, last } = createPagesHarness();
  const calls = [];
  const first = deferredFetcher("first", calls);
  const stalePage = deferredFetcher("stale-page", calls);
  const nextScope = deferredFetcher("next-scope", calls);

  const opened = controller.open({ key: "owner-a|2026-10|m", scope: "a" }, first.fetcher);
  first.resolvePage({ rows: ["a1"], next: "c1" });
  await opened;

  const moreOp = controller.loadMore(stalePage.fetcher);
  const switched = controller.open({ key: "owner-a|2026-11|", scope: "b" }, nextScope.fetcher);

  stalePage.resolvePage({ rows: ["late-page"], next: null });
  await moreOp; // discarded — the scope moved on
  nextScope.resolvePage({ rows: ["b1"], next: null });
  await switched;

  assert.ok(!applied.some((entry) => entry.snapshot.rows.includes("late-page")));
  assert.deepStrictEqual(last().snapshot.rows, ["b1"]);
});

test("a first-page failure surfaces its message and a retry restores the trail", async () => {
  const { controller, last, applied } = createPagesHarness();
  const calls = [];
  const failing = deferredFetcher("failing", calls);
  const retry = deferredFetcher("retry", calls);

  const opened = controller.open({ key: "k", scope: "a" }, failing.fetcher);
  failing.rejectPage(new Error("boom"));
  await opened;

  assert.deepStrictEqual(last().snapshot, {
    rows: [],
    next: null,
    loadingMore: false,
    error: "boom",
    pageError: null,
  });

  const retryOp = controller.refresh(retry.fetcher);
  retry.resolvePage({ rows: ["r1"], next: "c1" });
  await retryOp;

  assert.deepStrictEqual(last().snapshot, {
    rows: ["r1"],
    next: "c1",
    loadingMore: false,
    error: null,
    pageError: null,
  });
  assert.equal(applied.length, 2);
});

test("a load-more failure keeps rows and cursor, then retries the same trail", async () => {
  const { controller, last } = createPagesHarness();
  const calls = [];
  const first = deferredFetcher("first", calls);
  const failing = deferredFetcher("failing", calls);
  const retry = deferredFetcher("retry", calls);

  const opened = controller.open({ key: "k", scope: "a" }, first.fetcher);
  first.resolvePage({ rows: ["r1"], next: "c1" });
  await opened;

  const failingOp = controller.loadMore(failing.fetcher);
  failing.rejectPage(new Error("network"));
  await failingOp;

  assert.deepStrictEqual(last().snapshot, {
    rows: ["r1"],
    next: "c1",
    loadingMore: false,
    error: null,
    pageError: "network",
  });

  const retryOp = controller.loadMore(retry.fetcher);
  retry.resolvePage({ rows: ["r2"], next: null });
  await retryOp;

  assert.deepStrictEqual(last().snapshot.rows, ["r1", "r2"]);
  assert.equal(last().snapshot.pageError, null);
  assert.equal(last().snapshot.next, null);
});

test("refresh keeps shown rows while reloading, on failure and until the new page lands", async () => {
  const { controller, last } = createPagesHarness();
  const calls = [];
  const first = deferredFetcher("first", calls);
  const failing = deferredFetcher("failing", calls);

  const opened = controller.open({ key: "k", scope: "a" }, first.fetcher);
  first.resolvePage({ rows: ["r1"], next: "c1" });
  await opened;

  // A two-page trail, so the reload visibly shortens it after success.
  const more = deferredFetcher("more", calls);
  const moreOp = controller.loadMore(more.fetcher);
  more.resolvePage({ rows: ["r2"], next: null });
  await moreOp;

  const refreshOp = controller.refresh(failing.fetcher);
  failing.rejectPage(new Error("offline"));
  await refreshOp;

  assert.deepStrictEqual(last().snapshot, {
    rows: ["r1", "r2"],
    next: null,
    loadingMore: false,
    error: "offline",
    pageError: null,
  });

  const good = deferredFetcher("good", calls);
  const retryOp = controller.refresh(good.fetcher);
  good.resolvePage({ rows: ["fresh"], next: "c2" });
  await retryOp;

  assert.deepStrictEqual(last().snapshot, {
    rows: ["fresh"],
    next: "c2",
    loadingMore: false,
    error: null,
    pageError: null,
  });
});

test("reset clears the trail and discards in-flight work", async () => {
  const { controller, applied, last } = createPagesHarness();
  const calls = [];
  const first = deferredFetcher("first", calls);

  const opened = controller.open({ key: "k", scope: "a" }, first.fetcher);
  first.resolvePage({ rows: ["r1"], next: "c1" });
  await opened;

  controller.reset();

  // Load-more after reset is a no-op: no scope is active.
  const afterOp = controller.loadMore(() => {
    calls.push("unexpected");
    return Promise.resolve({ rows: ["x"], next: null });
  });
  await afterOp;

  // A first-page fetch opened before the reset must be discarded on arrival.
  const stale = deferredFetcher("stale", calls);
  controller.open({ key: "k2", scope: "b" }, stale.fetcher);
  controller.reset();
  stale.resolvePage({ rows: ["resurrected"], next: null });
  await flush();

  assert.ok(!calls.includes("unexpected"));
  assert.ok(!applied.some((entry) => entry.snapshot.rows.includes("resurrected")));
  assert.equal(applied.length, 1); // only the first trail's accepted page
  assert.deepStrictEqual(last().snapshot.rows, ["r1"]);
});

function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}
