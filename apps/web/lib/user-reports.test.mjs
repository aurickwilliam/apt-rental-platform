import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatReportPerson,
  getReportReasonLabel,
  parseReportStatusFilter,
} from "./user-reports.ts";

test("status filter defaults to open reports", () => {
  assert.equal(parseReportStatusFilter(undefined), "open");
  assert.equal(parseReportStatusFilter("bogus"), "open");
  assert.equal(parseReportStatusFilter("resolved"), "resolved");
  assert.equal(parseReportStatusFilter(["dismissed", "open"]), "dismissed");
  assert.equal(parseReportStatusFilter("all"), "all");
});

test("reason labels cover every reason and fall back for unknown ones", () => {
  for (const reason of ["spam", "scam", "harassment", "inappropriate", "fake_profile", "other"]) {
    assert.notEqual(getReportReasonLabel(reason), "Other");
  }
  assert.equal(getReportReasonLabel("new_reason"), "Other");
});

test("people show a name, then email, then a placeholder", () => {
  assert.equal(formatReportPerson({ first_name: "Ana", last_name: "Cruz", email: "a@x.ph" }), "Ana Cruz");
  assert.equal(formatReportPerson({ first_name: null, last_name: null, email: "a@x.ph" }), "a@x.ph");
  assert.equal(formatReportPerson(null), "Deleted account");
});
