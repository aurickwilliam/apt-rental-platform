import assert from "node:assert/strict";
import { test } from "node:test";
import { compile } from "./test-support/hook-runtime.mjs";

// The mobile auth routes (app/api/auth/mobile/*): request parsing, the response
// contract the phone relies on, and the rule that nothing sensitive is logged.
const SECRET = "hunter2-very-secret";
const EMAIL = "ana@example.com";
const TOKENS = { access_token: "access-tok", refresh_token: "refresh-tok" };

const isRateLimit = (error) => error?.code === "over_request_rate_limit" || error?.status === 429;
const isInvalidCredentials = (error) => error.code === "invalid_credentials" || error.message === "Invalid login credentials";

const http = compile(
  "lib/mobile-auth-http.ts",
  {
    "@repo/utils": { AUTH_THROTTLE_MESSAGE: "Too many attempts.", isAuthRateLimitError: isRateLimit },
    "@/lib/auth-attempts": { isInvalidCredentialsError: isInvalidCredentials },
  },
  { Response },
);

const post = (body, headers = {}) =>
  new Request("https://apt.test/api/auth/mobile/x", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

test("sign-in body: accepts the expected shape and rejects bad input", async () => {
  const ok = http.parseSignInBody(await http.readJsonObject(post({ email: EMAIL, password: SECRET, captchaToken: "t" })));
  assert.deepEqual({ ...ok }, { email: EMAIL, password: SECRET, captchaToken: "t" });
  assert.deepEqual({ ...http.parseSignInBody({ email: EMAIL, password: SECRET }) }, { email: EMAIL, password: SECRET });
  for (const bad of [
    null,
    {},
    { email: EMAIL },
    { email: 5, password: SECRET },
    { email: EMAIL, password: "" },
    { email: "a".repeat(255), password: SECRET },
    { email: EMAIL, password: "p".repeat(257) },
    { email: EMAIL, password: SECRET, captchaToken: 7 },
    { email: EMAIL, password: SECRET, captchaToken: "t".repeat(4097) },
  ]) {
    assert.equal(http.parseSignInBody(bad), null, JSON.stringify(bad)?.slice(0, 40));
  }
});

test("verify-code body: needs a known flow", () => {
  assert.deepEqual({ ...http.parseVerifyCodeBody({ email: EMAIL, code: "123456", flow: "recovery" }) }, { email: EMAIL, code: "123456", flow: "recovery" });
  assert.equal(http.parseVerifyCodeBody({ email: EMAIL, code: "123456", flow: "admin" }), null);
  assert.equal(http.parseVerifyCodeBody({ email: EMAIL, code: "1".repeat(17), flow: "signup" }), null);
  assert.equal(http.parseVerifyCodeBody({ email: EMAIL, flow: "signup" }), null);
});

test("readJsonObject: refuses missing, oversized, array and malformed bodies", async () => {
  assert.equal(await http.readJsonObject(post("{nope")), null);
  assert.equal(await http.readJsonObject(post("[1,2]")), null);
  assert.equal(await http.readJsonObject(post("null")), null);
  assert.equal(await http.readJsonObject(post({ pad: "x".repeat(9000) })), null);
  assert.equal(await http.readJsonObject(post({ a: 1 }, { "content-length": "999999" })), null);
});

test("responses: tokens only on success, always no-store", async () => {
  const ok = http.signInResponse({ ok: true, session: { ...TOKENS, expires_in: 3600, user: { email: EMAIL } }, user: { email: EMAIL } });
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("cache-control"), "no-store");
  assert.deepEqual(await ok.json(), { ok: true, session: TOKENS }, "only the two tokens leave the server");

  const noSession = http.signInResponse({ ok: true, session: null, user: {} });
  assert.equal(noSession.status, 500);
});

test("responses: a lock is a 429 with Retry-After and the seconds", async () => {
  const locked = http.signInResponse({ ok: false, kind: "locked", retryAfterSeconds: 420 });
  assert.equal(locked.status, 429);
  assert.equal(locked.headers.get("retry-after"), "420");
  assert.deepEqual(await locked.json(), { ok: false, error: { code: "auth_locked", message: "Too many attempts." }, retryAfterSeconds: 420 });
});

test("responses: Auth errors pass through with the right status", async () => {
  const wrong = http.signInResponse({ ok: false, kind: "error", error: { code: "invalid_credentials", message: "Invalid login credentials" } });
  assert.equal(wrong.status, 401);
  assert.deepEqual((await wrong.json()).error, { code: "invalid_credentials", message: "Invalid login credentials" });

  const unconfirmed = http.signInResponse({ ok: false, kind: "error", error: { code: "email_not_confirmed", message: "Email not confirmed" } });
  assert.equal(unconfirmed.status, 400);
  assert.equal((await unconfirmed.json()).error.message, "Email not confirmed");

  assert.equal(http.signInResponse({ ok: false, kind: "error", error: { code: "over_request_rate_limit", message: "x" } }).status, 429);

  const badCode = http.codeResponse({ ok: false, kind: "invalid_code" });
  assert.equal(badCode.status, 401);
  assert.equal((await badCode.json()).error.code, "otp_expired");
});

// ---- routes ----
function loadRoutes({ attempt, codeAttempt, client = { auth: {} } } = {}) {
  const calls = [];
  const errors = [];
  const signOuts = [];
  const common = {
    "@/lib/auth-throttle-server": { getAuthThrottleClient: () => ({ id: "service-role-throttle" }) },
    "@/lib/mobile-auth-http": http,
    "@/lib/mobile-auth-server": { createStatelessAuthClient: () => client && { ...client, auth: { ...client.auth, signOut: async (...args) => { signOuts.push(args); return { error: null }; } } } },
  };
  const signIn = compile(
    "app/api/auth/mobile/sign-in/route.ts",
    {
      ...common,
      "@/lib/auth-attempts": { attemptSignIn: async (input) => { calls.push(["signIn", input]); if (attempt instanceof Error) throw attempt; return attempt; } },
      "@/lib/sign-in-rate-limit": { clientIpFromHeaders: (headers) => headers["x-vercel-forwarded-for"] ?? headers["x-real-ip"] ?? "" },
    },
    { console: { error: (...args) => errors.push(args), warn() {} } },
  );
  const verify = compile(
    "app/api/auth/mobile/verify-code/route.ts",
    {
      ...common,
      "@repo/utils": { hasEmailPasswordIdentity: (user) => !!user?.identities?.some((identity) => identity.provider === "email") },
      "@/lib/auth-attempts": { attemptCodeVerification: async (input) => { calls.push(["verify", input]); return codeAttempt; } },
    },
    { console: { error: (...args) => errors.push(args), warn() {} } },
  );
  return { signIn: signIn.POST, verify: verify.POST, calls, errors, signOuts };
}

test("sign-in route: rejects a bad body before touching Auth", async () => {
  const h = loadRoutes({ attempt: { ok: true, session: TOKENS, user: {} } });
  const response = await h.signIn(post({ email: EMAIL }));
  assert.equal(response.status, 400);
  assert.equal(h.calls.length, 0);
});

test("sign-in route: passes the email, password, captcha token and platform IP, and returns the tokens", async () => {
  const h = loadRoutes({ attempt: { ok: true, session: TOKENS, user: { id: "u" } } });
  const response = await h.signIn(post({ email: EMAIL, password: SECRET, captchaToken: "cf" }, { "x-vercel-forwarded-for": "203.0.113.9" }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, session: TOKENS });
  const input = h.calls[0][1];
  assert.equal(input.email, EMAIL);
  assert.equal(input.captchaToken, "cf");
  assert.equal(input.clientIp, "203.0.113.9");
});

test("sign-in route: a lock is shared and reported as 429", async () => {
  const h = loadRoutes({ attempt: { ok: false, kind: "locked", retryAfterSeconds: 880 } });
  const response = await h.signIn(post({ email: EMAIL, password: SECRET }));
  assert.equal(response.status, 429);
  assert.equal((await response.json()).retryAfterSeconds, 880);
});

test("sign-in route: missing Supabase settings answer 503, an unexpected throw answers 500 and logs no secrets", async () => {
  const unavailable = loadRoutes({ attempt: { ok: true, session: TOKENS, user: {} }, client: null });
  assert.equal((await unavailable.signIn(post({ email: EMAIL, password: SECRET }))).status, 503);

  const failing = loadRoutes({ attempt: new Error(`boom for ${EMAIL} with ${SECRET}`) });
  const response = await failing.signIn(post({ email: EMAIL, password: SECRET, captchaToken: "cf" }));
  assert.equal(response.status, 500);
  const logged = JSON.stringify(failing.errors) + (await response.text());
  assert.ok(!logged.includes(SECRET) && !logged.includes(EMAIL), "no password or email in logs or the response");
});

test("verify-code route: sign-up and recovery use their own windows and code types", async () => {
  const signup = loadRoutes({ codeAttempt: { ok: true, session: TOKENS, user: { id: "u" } } });
  const signupResponse = await signup.verify(post({ email: EMAIL, code: "123456", flow: "signup" }));
  assert.equal(signupResponse.status, 200);
  assert.deepEqual(await signupResponse.json(), { ok: true, status: "ready", session: TOKENS });
  assert.equal(signup.calls[0][1].purpose, "signup_otp");
  assert.equal(signup.calls[0][1].otpType, "signup");
  assert.equal(signup.signOuts.length, 0);

  const recovery = loadRoutes({ codeAttempt: { ok: true, session: TOKENS, user: { identities: [{ provider: "email" }] } } });
  const recoveryResponse = await recovery.verify(post({ email: EMAIL, code: "123456", flow: "recovery" }));
  assert.equal((await recoveryResponse.json()).status, "ready");
  assert.equal(recovery.calls[0][1].purpose, "recovery_otp");
  assert.equal(recovery.calls[0][1].otpType, "recovery");
});

test("verify-code route: a Google-only account finishing a reset gets no tokens and is signed out", async () => {
  const h = loadRoutes({ codeAttempt: { ok: true, session: TOKENS, user: { identities: [{ provider: "google" }] } } });
  const response = await h.verify(post({ email: EMAIL, code: "123456", flow: "recovery" }));
  const body = await response.json();
  assert.deepEqual(body, { ok: true, status: "google_only" });
  assert.ok(!JSON.stringify(body).includes("access-tok"));
  assert.equal(h.signOuts.length, 1);
  assert.deepEqual({ ...h.signOuts[0][0] }, { scope: "local" });
});

test("verify-code route: locks and wrong codes keep the app's contract", async () => {
  const locked = loadRoutes({ codeAttempt: { ok: false, kind: "locked", retryAfterSeconds: 300 } });
  const lockedResponse = await locked.verify(post({ email: EMAIL, code: "123456", flow: "signup" }));
  assert.equal(lockedResponse.status, 429);
  assert.equal((await lockedResponse.json()).retryAfterSeconds, 300);

  const wrong = loadRoutes({ codeAttempt: { ok: false, kind: "invalid_code" } });
  const wrongResponse = await wrong.verify(post({ email: EMAIL, code: "000000", flow: "signup" }));
  assert.equal(wrongResponse.status, 401);
  assert.equal((await wrongResponse.json()).error.code, "otp_expired");
});
