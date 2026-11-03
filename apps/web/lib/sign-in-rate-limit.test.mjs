import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clearSignInFailures,
  clientIpFromHeaders,
  isSignInBlocked,
  normalizeSignInEmail,
  pruneSignInBuckets,
  recordSignInFailure,
  signInEmailKey,
  signInIpKey,
  SIGN_IN_MAX_FAILURES,
  SIGN_IN_WINDOW_MS,
  SIGN_IN_THROTTLE_MESSAGE,
} from "./sign-in-rate-limit.ts";

const NOW = 1_800_000_000_000;

function blockedBuckets(key, failures, now = NOW) {
  const buckets = new Map();
  for (let i = 0; i < failures; i += 1) recordSignInFailure(buckets, key, now);
  return buckets;
}

test("the first failure opens one window for the whole lifetime", () => {
  const buckets = new Map();
  recordSignInFailure(buckets, signInEmailKey("a@b.com"), NOW);

  for (const at of [NOW, NOW + SIGN_IN_WINDOW_MS - 1000]) {
    assert.deepEqual(isSignInBlocked(buckets, signInEmailKey("a@b.com"), at), {
      blocked: false,
      retryAfterSeconds: 0,
    });
  }
  // The window releases exactly SIGN_IN_WINDOW_MS after the first failure.
  assert.deepEqual(isSignInBlocked(buckets, signInEmailKey("a@b.com"), NOW + SIGN_IN_WINDOW_MS), {
    blocked: false,
    retryAfterSeconds: 0,
  });
});

test("lockout begins at SIGN_IN_MAX_FAILURES failures and reports the remaining time", () => {
  const key = signInEmailKey("a@b.com");
  const buckets = blockedBuckets(key, SIGN_IN_MAX_FAILURES - 1);
  assert.equal(isSignInBlocked(buckets, key, NOW).blocked, false);

  recordSignInFailure(buckets, key, NOW);
  const decision = isSignInBlocked(buckets, key, NOW);
  assert.equal(decision.blocked, true);
  assert.equal(decision.retryAfterSeconds, Math.ceil(SIGN_IN_WINDOW_MS / 1000));

  // Failures inside a spent window never re-lock it from `now`.
  assert.equal(
    isSignInBlocked(buckets, key, NOW + SIGN_IN_WINDOW_MS + 60_000).blocked,
    false
  );
});

test("an open window tallies into its original start; a released window starts fresh", () => {
  const key = signInEmailKey("a@b.com");
  const buckets = new Map();
  recordSignInFailure(buckets, key, NOW);
  recordSignInFailure(buckets, key, NOW + 60_000);

  assert.equal(buckets.get(key).windowStartedAt, NOW);

  // Recording after the window released replaces it, not another lockout.
  recordSignInFailure(buckets, key, NOW + SIGN_IN_WINDOW_MS + 1000);
  assert.equal(buckets.get(key).windowStartedAt, NOW + SIGN_IN_WINDOW_MS + 1000);
  assert.equal(isSignInBlocked(buckets, key, NOW + SIGN_IN_WINDOW_MS + 60_000).blocked, false);
});

test("email and IP buckets are independent; one locking does not block the other", () => {
  const buckets = new Map();
  const emailKey = signInEmailKey("a@b.com");
  const ipKey = signInIpKey("203.0.113.9");

  for (let i = 0; i < SIGN_IN_MAX_FAILURES; i += 1) recordSignInFailure(buckets, emailKey, NOW);

  assert.equal(isSignInBlocked(buckets, emailKey, NOW).blocked, true);
  assert.equal(isSignInBlocked(buckets, ipKey, NOW).blocked, false);
});

test("a successful sign-in clears the key's window entirely", () => {
  const key = signInEmailKey("a@b.com");
  const buckets = blockedBuckets(key, SIGN_IN_MAX_FAILURES);

  clearSignInFailures(buckets, key);
  assert.equal(buckets.has(key), false);
  assert.equal(isSignInBlocked(buckets, key, NOW).blocked, false);
});

test("prune drops spent windows and trims overflow oldest-first, keeping live keys", () => {
  const buckets = new Map();
  const alive = signInIpKey("203.0.113.10");
  const stale = signInIpKey("203.0.113.11");
  recordSignInFailure(buckets, alive, NOW);
  recordSignInFailure(buckets, stale, NOW - SIGN_IN_WINDOW_MS * 3);

  pruneSignInBuckets(buckets, NOW);
  assert.deepEqual([...buckets.keys()], [alive]);

  // Cap: oldest-inserted garbage goes first even while still unexpired.
  const big = new Map();
  for (let i = 0; i < 6_000; i += 1) big.set(`ip:10.0.0.${i % 255}|${i}`, { failures: 1, windowStartedAt: NOW });
  pruneSignInBuckets(big, NOW, 1_000);
  assert.equal(big.size, 1_000);
});

test("email keys normalize case and whitespace; different mailboxes stay separate", () => {
  assert.equal(signInEmailKey(" A@B.com "), signInEmailKey("a@b.com"));
  assert.notEqual(signInEmailKey("a@b.com"), signInEmailKey("b@b.com"));
  assert.equal(signInIpKey("203.0.113.9"), "ip:203.0.113.9");
  assert.equal(normalizeSignInEmail("  A@Example.COM \n"), "a@example.com");
});

test("client IP comes from the caller's hop of x-forwarded-for, then x-real-ip", () => {
  assert.equal(
    clientIpFromHeaders({ "x-forwarded-for": "203.0.113.9, 10.0.0.1, 10.0.0.2", "x-real-ip": null }),
    "203.0.113.9"
  );
  assert.equal(
    clientIpFromHeaders({ "x-forwarded-for": null, "x-real-ip": "198.51.100.7" }),
    "198.51.100.7"
  );
  assert.equal(
    clientIpFromHeaders({ "x-forwarded-for": "198.51.100.7", "x-real-ip": "192.0.2.1" }),
    "198.51.100.7"
  );
  // Garbage and empty chains leave no IP key rather than sharing one bucket.
  assert.equal(clientIpFromHeaders({ "x-forwarded-for": ",", "x-real-ip": null }), "");
  assert.equal(clientIpFromHeaders({ "x-forwarded-for": null, "x-real-ip": null }), "");
});

test("the throttle message is generic and never hints about account existence", () => {
  const text = SIGN_IN_THROTTLE_MESSAGE.toLowerCase();
  assert.match(text, /too many sign-in attempts/);
  for (const forbidden of ["account", "password", "email", "exist", "invalid", "correct"]) {
    assert.ok(!text.includes(forbidden), `throttle message must not contain "${forbidden}"`);
  }
});
