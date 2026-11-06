import assert from "node:assert/strict";
import { test } from "node:test";
import { compile } from "./test-support/hook-runtime.mjs";

// The action runs in a separate VM realm, so compare plain copies of its values.
const plain = (value) => JSON.parse(JSON.stringify(value));

// The sign-up / confirm-email code step runs on the server so the guess limit
// cannot be skipped from the browser. These tests drive the real action with a
// fake throttle and a fake Auth client.

// compile() returns the module's exports directly.
function load(options) {
  const calls = [];
  const throttle = { id: "service-role-throttle-client" };
  const { blockedFor = 0, authError = null, userId = "user-1", failureBlocks = 0 } = options ?? {};
  const loaded = compile("app/(auth)/actions/verify-signup-code.ts", {
    "@repo/supabase/server": {
      createClient: async () => ({
        auth: {
          verifyOtp: async (input) => {
            calls.push(["verifyOtp", input]);
            return authError ? { data: { user: null }, error: authError } : { data: { user: { id: userId } }, error: null };
          },
        },
      }),
    },
    "@repo/utils": {
      checkAuthThrottle: async (client, purpose, subject) => { calls.push(["check", client, purpose, subject]); return blockedFor; },
      recordAuthFailure: async (client, purpose, subject) => { calls.push(["fail", client, purpose, subject]); return failureBlocks; },
      clearAuthThrottle: async (client, purpose, subject) => { calls.push(["clear", client, purpose, subject]); },
      isInvalidOtpError: (error) => error?.code === "otp_expired",
    },
    "@/lib/auth-throttle-server": { getAuthThrottleClient: () => throttle },
  });
  return { verifySignupCode: loaded.verifySignupCode, calls, throttle };
}

test("a blocked email never reaches Auth", async () => {
  const { verifySignupCode, calls } = load({ blockedFor: 600 });
  assert.deepEqual(plain(await verifySignupCode("Ana@Example.com", "123456")), { ok: false, reason: "rate_limited" });
  assert.ok(!calls.some(([name]) => name === "verifyOtp"));
});

test("a correct code verifies, clears the window and returns the user", async () => {
  const { verifySignupCode, calls, throttle } = load();
  assert.deepEqual(plain(await verifySignupCode("  Ana@Example.com ", " 123456 ")), { ok: true, userId: "user-1" });
  assert.deepEqual(plain(calls.find(([name]) => name === "verifyOtp")[1]), { email: "ana@example.com", token: "123456", type: "signup" });
  const clear = calls.find(([name]) => name === "clear");
  assert.deepEqual(clear, ["clear", throttle, "signup_otp", "ana@example.com"]);
});

test("a wrong code is recorded with the server-side throttle client", async () => {
  const { verifySignupCode, calls, throttle } = load({ authError: { code: "otp_expired" } });
  assert.deepEqual(plain(await verifySignupCode("ana@example.com", "000000")), { ok: false, reason: "invalid_code" });
  assert.deepEqual(calls.find(([name]) => name === "fail"), ["fail", throttle, "signup_otp", "ana@example.com"]);
});

test("the failure that spends the window reports rate_limited", async () => {
  const { verifySignupCode } = load({ authError: { code: "otp_expired" }, failureBlocks: 899 });
  assert.deepEqual(plain(await verifySignupCode("ana@example.com", "000000")), { ok: false, reason: "rate_limited" });
});

test("network or Auth throttle errors never count as a wrong code", async () => {
  const { verifySignupCode, calls } = load({ authError: { code: "over_request_rate_limit" } });
  assert.deepEqual(plain(await verifySignupCode("ana@example.com", "123456")), { ok: false, reason: "failed" });
  assert.ok(!calls.some(([name]) => name === "fail"));
});

test("malformed input is refused before any request", async () => {
  const { verifySignupCode, calls } = load();
  assert.deepEqual(plain(await verifySignupCode("   ", "123456")), { ok: false, reason: "failed" });
  assert.deepEqual(plain(await verifySignupCode(undefined, "123456")), { ok: false, reason: "failed" });
  assert.equal(calls.length, 0);
});
