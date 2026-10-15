import assert from "node:assert/strict";
import { test } from "node:test";
import { statusToneFor } from "./status-tone.ts";

test("positive statuses are success", () => {
  for (const status of ["verified", "Approved", "resolved", "PAID", "available", "visible"]) {
    assert.equal(statusToneFor(status), "success", status);
  }
});

test("waiting statuses are warning, whatever the spelling", () => {
  for (const status of ["pending", "Applied", "In Progress", "in_progress", "rescheduled", "under_maintenance", "open"]) {
    assert.equal(statusToneFor(status), "warning", status);
  }
});

test("negative statuses are danger", () => {
  for (const status of ["rejected", "Cancelled", "unpaid", "failed", "expired", "hidden", "suspended"]) {
    assert.equal(statusToneFor(status), "danger", status);
  }
});

test("unknown, closed and empty statuses are neutral", () => {
  for (const status of ["closed", "occupied", "unverified", "", null, undefined]) {
    assert.equal(statusToneFor(status), "neutral", String(status));
  }
});
