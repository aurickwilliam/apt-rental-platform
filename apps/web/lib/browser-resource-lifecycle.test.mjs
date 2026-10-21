import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { BrowserResourceCache, DISABLED_RESOURCE } from "./browser-resource-cache.ts";

const flush = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; };
const key = { authUserId: "auth-a", profileId: "profile-a", portal: "tenant", resource: "favorites", params: [] };
function compile(file, modules, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => { assert.ok(name in modules, name); return modules[name]; }, console, ...globals });
  return exports;
}

test("resource hook renders a warm snapshot immediately and keeps the correct key across rapid route changes", async () => {
  const cache = new BrowserResourceCache();
  cache.setAccount("auth-a");
  await cache.load(key, async () => ["retained"], "Failed");
  const effects = [];
  const timers = [];
  const listeners = new Map();
  const resource = compile("../hooks/use-browser-resource.ts", {
    react: {
      useMemo: fn => fn(), useCallback: fn => fn,
      useEffect: effect => effects.push(effect),
      useSyncExternalStore: (_subscribe, get) => get(),
    },
    "@/lib/browser-resource-cache": { getBrowserResourceCache: () => cache, browserResourceId: k => JSON.stringify(k), DISABLED_RESOURCE },
  }, {
    window: { setTimeout: (fn, delay) => { timers.push({ fn, delay }); return 1; }, clearTimeout: () => {}, addEventListener: (event, fn) => listeners.set(event, fn), removeEventListener: event => listeners.delete(event) },
    document: { visibilityState: "visible", addEventListener: (event, fn) => listeners.set(event, fn), removeEventListener: event => listeners.delete(event) },
  });
  let loads = 0;
  const warm = resource.useBrowserResource(key, async () => { loads++; return []; }, "Failed");
  assert.deepEqual(warm.data, ["retained"]);
  assert.equal(warm.loading, false);
  const cleanup = effects.map(effect => effect()).filter(Boolean);
  await flush();
  assert.equal(loads, 0);
  assert.ok(timers[0].delay > 0 && timers[0].delay <= 120_000);
  const other = resource.useBrowserResource({ ...key, params: ["next"] }, async () => [], "Failed");
  assert.equal(other.hasData, false);
  assert.equal(other.data, undefined);
  for (const dispose of cleanup) dispose();
  assert.equal(listeners.size, 0);
});

function lifecycle() {
  const cache = new BrowserResourceCache();
  const effects = [];
  const listeners = new Map();
  const sessions = [];
  let auth;
  let pathname = "/tenant/favorites";
  let unsubscribed = false;
  const channels = [];
  const ref = { current: { sequence: 0 } };
  const component = compile("../app/components/layout/ResourceCacheLifecycle.tsx", {
    react: { useRef: () => ref, useEffect: effect => effects.push(effect) },
    "next/navigation": { usePathname: () => pathname },
    "@repo/supabase/browser": { createClient: () => ({ auth: {
      onAuthStateChange: fn => { auth = fn; return { data: { subscription: { unsubscribe: () => { unsubscribed = true; } } } }; },
      getSession: () => { const gate = deferred(); sessions.push(gate); return gate.promise; },
    } }) },
    "@/lib/browser-resource-cache": { getBrowserResourceCache: () => cache },
  }, {
    window: { addEventListener: (event, fn) => listeners.set(event, fn), removeEventListener: event => listeners.delete(event) },
    BroadcastChannel: class { constructor() { channels.push(this); } close() { this.closed = true; } },
  });
  component.default();
  const mountCleanup = effects[0]();
  let routeCleanup = effects[1]();
  return {
    cache, sessions, listeners, auth: (event, id) => auth(event, id ? { user: { id } } : null),
    channel: () => channels[0],
    changePath(path) { routeCleanup?.(); pathname = path; effects.length = 0; component.default(); routeCleanup = effects[1](); },
    cleanup() { routeCleanup?.(); mountCleanup(); }, unsubscribed: () => unsubscribed,
  };
}

test("Auth lifecycle isolates account switches, keeps same-account refreshes, and resets on logout/USER_UPDATED", async () => {
  const h = lifecycle();
  h.auth("INITIAL_SESSION", "auth-a");
  await h.cache.load(key, async () => ["A"], "Failed");
  h.auth("TOKEN_REFRESHED", "auth-a");
  assert.deepEqual(h.cache.getSnapshot(key).data, ["A"]);
  h.auth("SIGNED_IN", "auth-b");
  assert.equal(h.cache.getSnapshot(key).hasData, false);
  h.auth("SIGNED_IN", "auth-a");
  assert.equal(h.cache.getSnapshot(key).hasData, false);
  await h.cache.load(key, async () => ["A2"], "Failed");
  h.auth("USER_UPDATED", "auth-a");
  assert.equal(h.cache.getSnapshot(key).hasData, false);
  h.auth("SIGNED_OUT", null);
  assert.equal(h.cache.getSnapshot(key).enabled, false);
  h.cleanup();
  h.auth("INITIAL_SESSION", "auth-a");
  assert.equal(h.cache.getSnapshot(key).enabled, false, "A retired subscription cannot restore ownership");
  assert.equal(h.unsubscribed(), true);
  assert.equal(h.listeners.size, 0);
  assert.equal(h.channel().closed, true);
});

test("late local session reads cannot undo logout; auth routes and cross-tab server sign-outs retire data", async () => {
  const h = lifecycle();
  h.auth("INITIAL_SESSION", "auth-a");
  h.listeners.get("focus")();
  const late = h.sessions.at(-1);
  h.auth("SIGNED_OUT", null);
  late.resolve({ data: { session: { user: { id: "auth-a" } } }, error: null });
  await flush();
  assert.equal(h.cache.getSnapshot(key).enabled, false);
  h.auth("SIGNED_IN", "auth-a");
  await h.cache.load(key, async () => ["A"], "Failed");
  h.changePath("/sign-in");
  assert.equal(h.cache.getSnapshot(key).enabled, false);
  h.auth("SIGNED_IN", "auth-a");
  await h.cache.load(key, async () => ["A"], "Failed");
  h.channel().onmessage({ data: "reset" });
  assert.equal(h.cache.getSnapshot(key).hasData, false);
  h.cleanup();
});

test("client sign-out clears browser resources before invoking the server action and preserves redirect signals", async () => {
  const order = [];
  const redirect = new Error("NEXT_REDIRECT");
  const service = compile("../service/signOutService.ts", {
    "@/lib/browser-resource-cache": { resetBrowserResources: () => order.push("reset") },
    "@/app/(auth)/actions/sign-out": { signOut: async () => { order.push("server action"); throw redirect; } },
  });
  await assert.rejects(service.signOut(), error => error === redirect);
  assert.deepEqual(order, ["reset", "server action"]);
});
