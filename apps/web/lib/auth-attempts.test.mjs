import assert from "node:assert/strict";
import { test } from "node:test";
import { compile } from "./test-support/hook-runtime.mjs";
import { signInThrottleKeys } from "./sign-in-throttle.ts";

// The server-side attempt counting shared by the web actions and the mobile
// routes. These tests drive the real module with a fake Auth client and a fake
// throttle that returns the seconds you give it.
const plain = (value) => JSON.parse(JSON.stringify(value));
const invalidOtp = (error) => error?.code === "otp_expired";

function load({ checks = {}, failureBlocks = 0, signIn, verify } = {}) {
  const calls = [];
  const warnings = [];
  const throttle = { id: "throttle" };
  const loaded = compile(
    "lib/auth-attempts.ts",
    {
      "@repo/utils": {
        checkAuthThrottle: async (_client, purpose, subject) => { calls.push(["check", purpose, subject]); return checks[purpose] ?? 0; },
        recordAuthFailure: async (_client, purpose, subject) => { calls.push(["fail", purpose, subject]); return failureBlocks; },
        clearAuthThrottle: async (_client, purpose, subject) => { calls.push(["clear", purpose, subject]); },
        isInvalidOtpError: invalidOtp,
      },
      "@/lib/sign-in-throttle": { signInThrottleKeys },
    },
    { console: { warn: (...args) => warnings.push(args), error() {} } },
  );
  const auth = {
    signInWithPassword: async (credentials) => { calls.push(["signIn", credentials]); return signIn ?? { data: { user: { id: "u1" }, session: { access_token: "a", refresh_token: "r" } }, error: null }; },
    verifyOtp: async (params) => { calls.push(["verifyOtp", params]); return verify ?? { data: { user: { id: "u1" }, session: { access_token: "a", refresh_token: "r" } }, error: null }; },
  };
  return { ...loaded, auth, throttle, calls, warnings };
}

const signInInput = (h, extra = {}) => ({ auth: h.auth, throttle: h.throttle, email: "Ana@Example.com", password: "pw", clientIp: "203.0.113.5", ...extra });
const names = (calls) => calls.map(([name]) => name);

test("sign-in: a spent window locks before the password is tried", async () => {
  const h = load({ checks: { signin_email_ip: 600, signin_ip: 120 } });
  const result = plain(await h.attemptSignIn(signInInput(h)));
  assert.deepEqual(result, { ok: false, kind: "locked", retryAfterSeconds: 600 });
  assert.ok(!names(h.calls).includes("signIn"));
  assert.deepEqual(h.warnings, [["Auth lockout:", "signin"]], "a subject-free lockout log");
});

test("sign-in: a wrong password counts on every window and the last attempt locks at once", async () => {
  const wrong = { data: { user: null, session: null }, error: { code: "invalid_credentials", message: "Invalid login credentials" } };
  const open = load({ signIn: wrong });
  const first = plain(await open.attemptSignIn(signInInput(open)));
  assert.equal(first.kind, "error");
  assert.equal(first.error.code, "invalid_credentials");
  assert.deepEqual(open.calls.filter(([n]) => n === "fail").map(([, purpose]) => purpose), ["signin_email_ip", "signin_email_hour", "signin_ip"]);

  const spent = load({ signIn: wrong, failureBlocks: 899 });
  assert.deepEqual(plain(await spent.attemptSignIn(signInInput(spent))), { ok: false, kind: "locked", retryAfterSeconds: 899 });
});

test("sign-in: captcha, unconfirmed and Auth throttle errors never count", async () => {
  for (const error of [
    { code: "captcha_failed", message: "captcha protection: request disallowed" },
    { code: "email_not_confirmed", message: "Email not confirmed" },
    { code: "over_request_rate_limit", message: "rate limit", status: 429 },
  ]) {
    const h = load({ signIn: { data: { user: null, session: null }, error } });
    const result = plain(await h.attemptSignIn(signInInput(h)));
    assert.equal(result.kind, "error");
    assert.equal(result.error.code, error.code);
    assert.ok(!names(h.calls).includes("fail"), error.code);
  }
});

test("sign-in: success clears this email's windows but never the IP window", async () => {
  const h = load();
  const result = await h.attemptSignIn(signInInput(h, { captchaToken: "tok" }));
  assert.equal(result.ok, true);
  assert.equal(result.session.access_token, "a");
  assert.deepEqual(h.calls.filter(([n]) => n === "clear").map(([, purpose]) => purpose), ["signin_email_ip", "signin_email_hour"]);
  assert.deepEqual(plain(h.calls.find(([n]) => n === "signIn")[1].options), { captchaToken: "tok" });
  const noCaptcha = load();
  await noCaptcha.attemptSignIn(signInInput(noCaptcha));
  assert.equal(noCaptcha.calls.find(([n]) => n === "signIn")[1].options, undefined);
});

test("code: normalizes the email and code, and a verified code clears the window", async () => {
  const h = load();
  const result = await h.attemptCodeVerification({ auth: h.auth, throttle: h.throttle, purpose: "signup_otp", otpType: "signup", email: "  Ana@Example.com ", code: " 123456 " });
  assert.equal(result.ok, true);
  assert.deepEqual(plain(h.calls.find(([n]) => n === "verifyOtp")[1]), { email: "ana@example.com", token: "123456", type: "signup" });
  assert.deepEqual(h.calls.find(([n]) => n === "clear"), ["clear", "signup_otp", "ana@example.com"]);
});

test("code: a blocked email never reaches Auth", async () => {
  const h = load({ checks: { recovery_otp: 300 } });
  const result = plain(await h.attemptCodeVerification({ auth: h.auth, throttle: h.throttle, purpose: "recovery_otp", otpType: "recovery", email: "a@b.co", code: "123456" }));
  assert.deepEqual(result, { ok: false, kind: "locked", retryAfterSeconds: 300 });
  assert.ok(!names(h.calls).includes("verifyOtp"));
});

test("code: a wrong code is counted, and the one that spends the window locks", async () => {
  const bad = { data: { user: null, session: null }, error: { code: "otp_expired", message: "Token has expired or is invalid" } };
  const h = load({ verify: bad });
  assert.deepEqual(plain(await h.attemptCodeVerification({ auth: h.auth, throttle: h.throttle, purpose: "signup_otp", otpType: "signup", email: "a@b.co", code: "000000" })), { ok: false, kind: "invalid_code" });
  assert.ok(names(h.calls).includes("fail"));

  const spent = load({ verify: bad, failureBlocks: 880 });
  assert.deepEqual(plain(await spent.attemptCodeVerification({ auth: spent.auth, throttle: spent.throttle, purpose: "signup_otp", otpType: "signup", email: "a@b.co", code: "000000" })), { ok: false, kind: "locked", retryAfterSeconds: 880 });
});

test("code: Auth throttling or a network error is not a wrong code", async () => {
  const h = load({ verify: { data: { user: null, session: null }, error: { code: "over_request_rate_limit", message: "slow down", status: 429 } } });
  const result = plain(await h.attemptCodeVerification({ auth: h.auth, throttle: h.throttle, purpose: "signup_otp", otpType: "signup", email: "a@b.co", code: "123456" }));
  assert.equal(result.kind, "error");
  assert.ok(!names(h.calls).includes("fail"));
});

test("code: empty input is refused before any request", async () => {
  const h = load();
  const result = plain(await h.attemptCodeVerification({ auth: h.auth, throttle: h.throttle, purpose: "signup_otp", otpType: "signup", email: "  ", code: "123456" }));
  assert.equal(result.kind, "error");
  assert.equal(h.calls.length, 0);
});
