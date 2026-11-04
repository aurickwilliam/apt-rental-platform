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

test("report status filter defaults to open", () => {
  assert.equal(parseReportStatusFilter(undefined), "open");
  assert.equal(parseReportStatusFilter("bogus"), "open");
  assert.equal(parseReportStatusFilter("all"), "all");
  assert.equal(parseReportStatusFilter("dismissed"), "dismissed");
});
