import assert from "node:assert/strict";
import { test } from "node:test";
import {
  laterLockout,
  lockoutSecondsLeft,
  lockoutStorageKey,
  parseStoredLockout,
  serializeLockout,
} from "./auth-lockout-store.ts";

test("round-trips a stored lock and ignores garbage", () => {
  const lock = { until: 1_700_000_900_000, subject: "abc123" };
  assert.deepEqual(parseStoredLockout(serializeLockout(lock)), lock);
  assert.equal(parseStoredLockout(null), null);
  assert.equal(parseStoredLockout("{nope"), null);
  assert.equal(parseStoredLockout('{"until":"soon","subject":"x"}'), null);
  assert.equal(parseStoredLockout('{"until":5}'), null);
});

test("counts down whole seconds for the same email only", () => {
  const lock = { until: 1_000_000_000_000, subject: "abc" };
  const now = 1_000_000_000 - 90;
  assert.equal(lockoutSecondsLeft(lock, "abc", now), 90);
  assert.equal(lockoutSecondsLeft(lock, "other", now), 0);
  assert.equal(lockoutSecondsLeft(lock, "abc", 1_000_000_000), 0);
  assert.equal(lockoutSecondsLeft(lock, "abc", 1_000_000_000 + 5), 0);
  assert.equal(lockoutSecondsLeft(null, "abc", now), 0);
});

test("rounds a partial second up", () => {
  assert.equal(lockoutSecondsLeft({ until: 10_500, subject: "a" }, "a", 10), 1);
});

test("keeps the later lock and scopes storage keys", () => {
  const early = { until: 1, subject: "a" };
  const late = { until: 2, subject: "a" };
  assert.equal(laterLockout(early, late), late);
  assert.equal(laterLockout(late, null), late);
  assert.equal(laterLockout(null, null), null);
  assert.notEqual(lockoutStorageKey("signin"), lockoutStorageKey("signup_otp"));
});
