import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createRecoveryMarkerValue,
  isBackgroundRequest,
  isSupabaseAuthCookie,
  readRecoveryMarker,
  recoveryRouteDecision,
  RECOVERY_MARKER_COOKIE_OPTIONS,
  RECOVERY_MARKER_MAX_AGE_SECONDS,
  RECOVERY_SESSION_TTL_MS,
} from "../../../packages/supabase/src/password-recovery.ts";

const NOW = 1_800_000_000_000;
const RESET = "/forgot-password/reset-password";
const START = "/forgot-password";

function decide(marker, hasUser, pathname, isBackgroundRequest = false) {
  return recoveryRouteDecision({ marker, hasUser, pathname, isBackgroundRequest });
}

test("the marker reads as none, active or stale", () => {
  assert.equal(readRecoveryMarker(undefined, NOW), "none");
  assert.equal(readRecoveryMarker(createRecoveryMarkerValue(NOW), NOW), "active");
  assert.equal(readRecoveryMarker(String(NOW - RECOVERY_SESSION_TTL_MS), NOW), "active");
  assert.equal(readRecoveryMarker(String(NOW - RECOVERY_SESSION_TTL_MS - 1), NOW), "stale");
});

test("a malformed or future marker counts as an abandoned recovery", () => {
  for (const value of ["", "abc", "12.5", "-5"]) {
    assert.equal(readRecoveryMarker(value, NOW), "stale");
  }
  assert.equal(readRecoveryMarker(String(NOW + 60_000), NOW), "stale");
});

test("the marker cookie is HTTP-only and lasts as long as the Auth cookies (400 days)", () => {
  assert.equal(RECOVERY_MARKER_COOKIE_OPTIONS.httpOnly, true);
  assert.equal(RECOVERY_MARKER_COOKIE_OPTIONS.path, "/");
  assert.equal(RECOVERY_MARKER_COOKIE_OPTIONS.maxAge, RECOVERY_MARKER_MAX_AGE_SECONDS);
  assert.equal(RECOVERY_MARKER_MAX_AGE_SECONDS, 400 * 24 * 60 * 60);
});

test("only top-level page loads count as foreground requests", () => {
  const headers = (entries) => (name) => entries[name] ?? null;
  // Next.js router fetches (prefetch or client navigation): Next strips its own headers.
  assert.equal(isBackgroundRequest(headers({ "sec-fetch-dest": "empty" })), true);
  // Browser speculative loads of a document.
  assert.equal(isBackgroundRequest(headers({ "sec-fetch-dest": "document", "sec-purpose": "prefetch;prerender" })), true);
  assert.equal(isBackgroundRequest(headers({ purpose: "prefetch" })), true);
  // Real page loads, and clients that send no fetch metadata.
  assert.equal(isBackgroundRequest(headers({ "sec-fetch-dest": "document" })), false);
  assert.equal(isBackgroundRequest(headers({})), false);
});

test("without a marker only the reset page is guarded", () => {
  assert.deepEqual(decide("none", true, RESET), { action: "redirect", to: START, clearMarker: false });
  assert.deepEqual(decide("none", false, RESET), { action: "redirect", to: START, clearMarker: false });
  assert.deepEqual(decide("none", true, "/tenant"), { action: "continue" });
  assert.deepEqual(decide("none", false, START), { action: "continue" });
  assert.deepEqual(decide("none", true, "/", true), { action: "continue" });
});

test("an active recovery may use the reset page", () => {
  assert.deepEqual(decide("active", true, RESET), { action: "allow" });
  assert.deepEqual(decide("active", true, RESET, true), { action: "allow" });
});

test("leaving the reset page ends the recovery", () => {
  assert.deepEqual(decide("active", true, START), { action: "end_session", to: START });
  assert.deepEqual(decide("active", true, "/forgot-password/updated"), { action: "end_session", to: START });
  assert.deepEqual(decide("active", true, "/"), { action: "end_session", to: "/sign-in" });
  assert.deepEqual(decide("active", true, "/tenant/dashboard"), { action: "end_session", to: "/sign-in" });
});

test("background requests never end a recovery", () => {
  assert.deepEqual(decide("active", true, "/", true), { action: "no_content" });
  assert.deepEqual(decide("stale", true, RESET, true), { action: "no_content" });
  assert.deepEqual(decide("active", false, "/", true), { action: "no_content" });
});

test("an abandoned recovery is signed out wherever it reappears", () => {
  assert.deepEqual(decide("stale", true, RESET), { action: "end_session", to: START });
  assert.deepEqual(decide("stale", true, START), { action: "end_session", to: START });
  assert.deepEqual(decide("stale", true, "/landlord"), { action: "end_session", to: "/sign-in" });
});

test("a marker without a session is cleared", () => {
  assert.deepEqual(decide("active", false, RESET), { action: "redirect", to: START, clearMarker: true });
  assert.deepEqual(decide("stale", false, RESET), { action: "redirect", to: START, clearMarker: true });
  assert.deepEqual(decide("active", false, "/"), { action: "clear_marker" });
  assert.deepEqual(decide("stale", false, START), { action: "clear_marker" });
});

test("only Supabase Auth cookies are treated as session cookies", () => {
  assert.equal(isSupabaseAuthCookie("sb-abcd-auth-token"), true);
  assert.equal(isSupabaseAuthCookie("sb-abcd-auth-token.0"), true);
  assert.equal(isSupabaseAuthCookie("sb-abcd-auth-token-code-verifier"), true);
  assert.equal(isSupabaseAuthCookie("apt-password-recovery"), false);
  assert.equal(isSupabaseAuthCookie("apt-portal"), false);
});
