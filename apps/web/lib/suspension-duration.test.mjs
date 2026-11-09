import assert from "node:assert/strict";
import { test } from "node:test";
import { suspensionEnd } from "./suspension-duration.ts";

const NOW = Date.parse("2026-11-04T00:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

test("permanent, missing and null durations have no end date", () => {
  assert.equal(suspensionEnd("permanent", NOW), null);
  assert.equal(suspensionEnd(undefined, NOW), null);
  assert.equal(suspensionEnd(null, NOW), null);
});

test("7, 30 and 90 days end that many days from now", () => {
  for (const days of [7, 30, 90]) {
    assert.equal(suspensionEnd(String(days), NOW), new Date(NOW + days * DAY).toISOString());
  }
});

test("anything else is rejected", () => {
  for (const value of ["1", "0", "-7", "365", "7.5", "", "abc", 7, {}]) {
    assert.equal(suspensionEnd(value, NOW), undefined);
  }
});
