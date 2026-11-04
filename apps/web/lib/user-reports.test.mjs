import assert from "node:assert/strict";
import { test } from "node:test";
import { parseReportStatusFilter, parseReportTypeFilter } from "./user-reports.ts";

test("report type filter accepts the four kinds and defaults to all", () => {
  for (const type of ["user", "apartment", "landlord", "tenant"]) {
    assert.equal(parseReportTypeFilter(type), type);
  }
  assert.equal(parseReportTypeFilter(undefined), "all");
  assert.equal(parseReportTypeFilter("all"), "all");
  assert.equal(parseReportTypeFilter("admin"), "all");
  assert.equal(parseReportTypeFilter(["apartment", "tenant"]), "apartment");
});

test("report status filter defaults to all so resolved reports stay listed", () => {
  assert.equal(parseReportStatusFilter(undefined), "all");
  assert.equal(parseReportStatusFilter("bogus"), "all");
  assert.equal(parseReportStatusFilter("open"), "open");
  assert.equal(parseReportStatusFilter("dismissed"), "dismissed");
});

test("report search drops characters that change a database filter and caps the length", async () => {
  const { parseReportSearch, REPORT_SEARCH_MAX_LENGTH } = await import("./user-reports.ts");
  assert.equal(parseReportSearch(undefined), "");
  assert.equal(parseReportSearch("  Irene's   Housing "), "Irene's Housing");
  assert.equal(parseReportSearch("a%b,c(d)e*f\\g"), "a b c d e f g");
  assert.equal(parseReportSearch(["Maria", "ignored"]), "Maria");
  assert.equal(parseReportSearch("x".repeat(500)).length, REPORT_SEARCH_MAX_LENGTH);
});

test("report filter params leave defaults out of the URL", async () => {
  const { reportFilterParams, parseReportFilters } = await import("./user-reports.ts");
  assert.deepEqual(reportFilterParams({ q: "", status: "all", type: "all" }, 1), {
    q: null,
    status: null,
    type: null,
    page: null,
  });
  assert.deepEqual(reportFilterParams({ q: "irene", status: "resolved", type: "apartment" }, 3), {
    q: "irene",
    status: "resolved",
    type: "apartment",
    page: 3,
  });
  assert.deepEqual(parseReportFilters({ q: "irene", status: "bogus", type: "tenant" }), {
    q: "irene",
    status: "all",
    type: "tenant",
  });
});
