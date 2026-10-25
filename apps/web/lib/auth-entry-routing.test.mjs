import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest, NextResponse } from "next/server.js";
import { compile, deferred, settle } from "./test-support/hook-runtime.mjs";
import * as portals from "../../../packages/supabase/src/portal-preference.ts";
import * as onboarding from "../../../packages/supabase/src/pending-onboarding.ts";
import * as recovery from "../../../packages/supabase/src/password-recovery.ts";

const origin = "https://apt.example";
const tenant = { roles: ["tenant"], account_status: "verified", mobile_number: "phone", is_suspended: false };
const landlord = { ...tenant, roles: ["landlord"] };
const dual = { ...tenant, roles: ["tenant", "landlord"] };
const admin = { ...tenant, roles: ["admin", "tenant"] };
const pending = { ...tenant, account_status: "unverified", mobile_number: null };

function harness(options = {}) {
  const profile = "profile" in options ? options.profile : tenant;
  const user = options.signedOut ? null : { id: "auth-a", app_metadata: { provider: "google" }, user_metadata: {} };
  const counts = { auth: 0, profiles: 0, suspension: 0, signOut: 0, exchange: 0 };
  const columns = [], filters = [], writes = [];
  let middlewareCookies;
  let callbackCookies;
  const sessionCookies = new Map();
  const cookieStore = {
    get: name => sessionCookies.get(name) ?? (name === portals.PORTAL_COOKIE && options.preference ? { value: options.preference } : undefined),
    getAll: () => [...sessionCookies.values()],
    set: (name, value, settings) => sessionCookies.set(name, { name, value, ...settings }),
  };
  const rotated = [
    { name: "sb-test-auth-token.0", value: "rotated-0", options: { path: "/", httpOnly: true, secure: true, sameSite: "lax", maxAge: 3600 } },
    { name: "sb-test-auth-token.1", value: "rotated-1", options: { path: "/", httpOnly: true, secure: true, sameSite: "lax", maxAge: 3600 } },
  ];
  const client = {
    auth: {
      async getUser() {
        counts.auth++;
        await options.authGate;
        if (options.rotate) middlewareCookies?.setAll(rotated);
        return { data: { user }, error: options.authError ?? null };
      },
      async signOut() { counts.signOut++; return { error: null }; },
      async exchangeCodeForSession() {
        counts.exchange++;
        if (options.rotate) callbackCookies.setAll(rotated);
        return { error: options.exchangeError ?? null };
      },
    },
    from(table) {
      assert.equal(table, "users"); counts.profiles++;
      const q = {
        select(value) { columns.push(value); return q; },
        eq(...args) { filters.push(args); return q; },
        async maybeSingle() { await options.profileGate; return { data: profile, error: options.profileError ?? null }; },
        async single() { return { data: profile, error: options.profileError ?? null }; },
      };
      return q;
    },
    async rpc(name, args) {
      if (name === "get_my_suspension_status") {
        counts.suspension++;
        return { data: options.suspensionUnknown ? null : { suspended: options.suspended ?? false }, error: options.suspensionError ?? null };
      }
      writes.push([name, args]);
      return { error: null };
    },
  };
  const globals = { URL, process: { env: { NEXT_PUBLIC_SUPABASE_URL: "https://supabase.example", NEXT_PUBLIC_SUPABASE_ANON_KEY: "public", NODE_ENV: "production" } }, console: { warn() {}, error() {} } };
  const middleware = compile("../../packages/supabase/src/middleware.ts", {
    "@supabase/ssr": { createServerClient: (_url, _key, config) => { middlewareCookies = config.cookies; return client; } },
    "next/server": { NextResponse }, "./pending-onboarding": onboarding,
    "./portal-preference": portals, "./password-recovery": recovery,
  }, globals);
  const server = compile("../../packages/supabase/src/server.ts", {
    "@supabase/ssr": { createServerClient: (_url, _key, config) => { callbackCookies = config.cookies; return client; } },
    "next/headers": { cookies: async () => cookieStore },
  }, globals);
  const callback = compile("app/auth/callback/route.ts", {
    "next/server": { NextResponse }, "@repo/supabase/server": server,
    "next/headers": { cookies: async () => cookieStore },
    "@repo/supabase/pending-onboarding": onboarding, "@/lib/portal-preference": portals,
  }, globals);
  return { counts, columns, filters, writes, sessionCookies,
    async root(path = "/", extraCookies = {}) {
      const req = new NextRequest(`${origin}${path}`);
      if (options.preference) req.cookies.set(portals.PORTAL_COOKIE, options.preference);
      for (const [name, value] of Object.entries(extraCookies)) req.cookies.set(name, value);
      return middleware.updateSession(req);
    },
    oauth(query = "") { return callback.GET(new Request(`${origin}/auth/callback?code=test${query}`)); },
  };
}

function destination(response) {
  const value = response.headers.get("location");
  if (!value) return null;
  const url = new URL(value);
  assert.equal(url.origin, origin);
  return url.pathname + url.search;
}

for (const [name, options, expected] of [
  ["Tenant", {}, "/tenant/my-rental"],
  ["Landlord", { profile: landlord }, "/landlord/dashboard"],
  ["dual Tenant choice", { profile: dual, preference: "tenant" }, "/tenant/my-rental"],
  ["dual Landlord choice", { profile: dual, preference: "landlord" }, "/landlord/dashboard"],
  ["stale cookie", { preference: "landlord" }, "/tenant/my-rental"],
  ["invalid cookie", { profile: dual, preference: "admin" }, "/landlord/dashboard"],
  ["Admin priority", { profile: admin, preference: "tenant" }, "/admin/dashboard"],
  ["onboarding before portal", { profile: pending }, "/sign-up?from=google-new"],
  ["completed unverified account", { profile: { ...tenant, account_status: "unverified" } }, "/tenant/my-rental"],
  ["pending verification account", { profile: { ...tenant, account_status: "pending" } }, "/tenant/my-rental"],
  ["suspended visible profile", { profile: { ...tenant, is_suspended: true } }, "/suspended"],
  ["suspended hidden profile", { profile: null, suspended: true }, "/suspended"],
  ["missing profile", { profile: null }, "/sign-up?from=profile-missing"],
]) {
  test(`authenticated exact root: ${name}`, async () => {
    const h = harness({ ...options, rotate: true });
    const response = await h.root("/?campaign=example");
    assert.equal(response.status, 307);
    assert.equal(destination(response), expected);
    assert.equal(await response.text(), "", "a middleware redirect returns no public layout HTML");
    assert.equal(response.headers.get("x-middleware-next"), null);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    for (const [index, cookie] of response.cookies.getAll().entries()) {
      assert.equal(cookie.value, `rotated-${index}`);
      assert.equal(cookie.httpOnly, true); assert.equal(cookie.secure, true);
      assert.equal(cookie.path, "/"); assert.equal(cookie.sameSite, "lax"); assert.equal(cookie.maxAge, 3600);
    }
    assert.equal(response.cookies.getAll().length, 2, "all refreshed cookie chunks survive");
    assert.equal(h.counts.auth, 1); assert.equal(h.counts.profiles, 1);
    assert.deepEqual(h.columns, ["roles, account_status, mobile_number, is_suspended"]);
    assert.deepEqual(h.filters, [["user_id", "auth-a"]]);
    assert.equal(h.counts.suspension, options.profile === null ? 1 : 0, "no redundant status RPC for a visible profile");
    if (expected.startsWith("/tenant/") || expected.startsWith("/landlord/") || expected.startsWith("/admin/")) {
      const follow = await h.root(expected);
      assert.equal(destination(follow), null, "the selected authorized portal does not bounce to root");
    }
  });
}

test("root failures never guess a destination or create a sign-in/root loop", async () => {
  for (const options of [
    { profile: null, profileError: { code: "unavailable" } },
    { profile: null, suspensionError: { code: "unavailable" } },
    { profile: null, suspensionUnknown: true },
    { profile: { ...tenant, roles: [] } },
    { authError: { name: "AuthApiError" } },
  ]) {
    const h = harness(options);
    assert.equal(destination(await h.root()), null);
    assert.equal(h.counts.auth, 1);
    assert.equal(h.counts.signOut, 0);
    if (options.authError) assert.equal(h.counts.profiles, 0);
  }
});

test("signed-out root and unrelated public routes stay public without profile reads", async () => {
  for (const options of [{ signedOut: true }, {}]) {
    for (const path of options.signedOut ? ["/", "/browse", "/about"] : ["/browse", "/browse/listing", "/about", "/company"]) {
      const h = harness(options);
      assert.equal(destination(await h.root(path)), null);
      assert.equal(h.counts.auth, 1); assert.equal(h.counts.profiles, 0);
    }
  }
});

test("recovery takes priority over authenticated root routing", async () => {
  const h = harness();
  const response = await h.root("/", { [recovery.RECOVERY_MARKER_COOKIE]: recovery.createRecoveryMarkerValue(Date.now()) });
  assert.equal(destination(response), "/sign-in");
  assert.equal(h.counts.signOut, 1); assert.equal(h.counts.profiles, 0);
});

test("delayed Auth and profile reads finish before middleware returns any root response", async () => {
  const auth = deferred(), profile = deferred();
  const h = harness({ authGate: auth.promise, profileGate: profile.promise });
  let returned = false;
  const response = h.root().then(value => { returned = true; return value; });
  await settle();
  assert.equal(returned, false); assert.equal(h.counts.profiles, 0);
  auth.resolve(); await settle();
  assert.equal(returned, false); assert.equal(h.counts.profiles, 1);
  profile.resolve();
  assert.equal(destination(await response), "/tenant/my-rental");
  assert.equal(h.counts.auth, 1);
});

for (const [name, options, query, expected, portal] of [
  ["returning Tenant", {}, "", "/tenant/my-rental", "tenant"],
  ["returning Landlord", { profile: landlord }, "", "/landlord/dashboard", "landlord"],
  ["dual preferred Tenant", { profile: dual, preference: "tenant" }, "", "/tenant/my-rental", "tenant"],
  ["stale preferred portal", { preference: "landlord" }, "", "/tenant/my-rental", "tenant"],
  ["explicit held role", { profile: dual, preference: "landlord" }, "&role=tenant", "/tenant/my-rental", "tenant"],
  ["safe public next", {}, "&next=%2Fbrowse%3Fcity%3DNavotas", "/browse?city=Navotas", "tenant"],
  ["safe private next", {}, "&next=%2Ftenant%2Fmessages", "/tenant/messages", "tenant"],
  ["verification handoff", {}, "&next=%2Fverify%2Fmobile%3Ftoken%3Dopaque", "/verify/mobile?token=opaque", "tenant"],
  ["unauthorized portal next", {}, "&next=%2Flandlord%2Fdashboard", "/tenant/my-rental", "tenant"],
  ["Admin priority", { profile: admin, preference: "tenant" }, "", "/admin/dashboard", null],
  ["Admin held consumer role", { profile: admin }, "&role=tenant", "/tenant/my-rental", "tenant"],
  ["onboarding", { profile: pending }, "", "/sign-up?from=google-new", null],
  ["onboarding selected role", { profile: pending }, "&role=tenant", "/complete-profile", null],
  ["pending verification", { profile: { ...tenant, account_status: "pending" } }, "", "/tenant/my-rental", "tenant"],
  ["suspended", { profile: null, suspended: true }, "", "/suspended", null],
]) {
  test(`OAuth: ${name}`, async () => {
    const h = harness(options);
    const response = await h.oauth(query);
    assert.equal(destination(response), expected);
    assert.equal(h.counts.auth, 1); assert.equal(h.counts.exchange, 1);
    assert.equal(response.cookies.get(portals.PORTAL_COOKIE)?.value ?? null, portal);
    assert.equal(h.counts.signOut, 0);
    assert.equal(h.counts.profiles, options.suspended ? 0 : 1);
    assert.equal(h.writes.length, 0, "returning sign-in must not grant roles");
  });
}

test("OAuth rejects external, protocol-relative, backslash and control-character next values", async () => {
  for (const next of ["https://evil.example", "//evil.example", "/\\evil.example", "/\n/evil.example", "/foo/../../landlord/dashboard"]) {
    const response = await harness().oauth(`&next=${encodeURIComponent(next)}`);
    assert.equal(destination(response), "/tenant/my-rental");
  }
});

test("OAuth Auth/profile failures sign out and return the existing error route, not root", async () => {
  for (const options of [{ profile: null }, { profileError: { code: "failed" } }, { authError: { name: "AuthApiError" } }, { signedOut: true }]) {
    const h = harness(options);
    assert.equal(destination(await h.oauth()), "/sign-in?error=auth_callback_error");
    assert.equal(h.counts.signOut, 1); assert.equal(h.counts.auth, 1);
  }
});

test("OAuth code exchange retains both Auth chunks in the server cookie store alongside the portal response cookie", async () => {
  const h = harness({ rotate: true });
  const response = await h.oauth();
  assert.equal(destination(response), "/tenant/my-rental");
  assert.equal(h.sessionCookies.size, 2);
  for (const [index, cookie] of [...h.sessionCookies.values()].entries()) {
    assert.equal(cookie.value, `rotated-${index}`);
    assert.equal(cookie.httpOnly, true); assert.equal(cookie.secure, true);
    assert.equal(cookie.maxAge, 3600); assert.equal(cookie.sameSite, "lax");
  }
  assert.equal(response.cookies.get(portals.PORTAL_COOKIE).value, "tenant");
  assert.equal(h.counts.auth, 1); assert.equal(h.counts.profiles, 1);
});

test("the destination Admin guard still requires MFA before returning a profile", async () => {
  for (const level of ["aal1", "aal2"]) {
    const guard = compile("app/admin/_lib/require-admin.ts", {
      "@/lib/server-identity": {
        getServerIdentity: async () => ({ user: { id: "auth-a", user_metadata: {} }, profile: admin, error: null }),
        requirePortalViewer: async portal => assert.equal(portal, "admin"),
      },
      "next/navigation": { redirect: path => { throw new Error(`redirect:${path}`); }, notFound: () => assert.fail("authorized Admin") },
      react: { cache: fn => fn }, "@/lib/admin-mfa": compile("lib/admin-mfa.ts", {}),
      "@/lib/server-admin-mfa": { getAdminMfaState: async () => ({ currentLevel: level, hasVerifiedFactor: true }) },
    }, { process: { env: { ADMIN_MFA_REQUIRED: "true" } } });
    if (level === "aal1") await assert.rejects(guard.requireAdmin(), /redirect:\/two-step-login/);
    else assert.deepEqual((await guard.requireAdmin()).roles, admin.roles);
  }
});
