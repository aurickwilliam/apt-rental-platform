import assert from "node:assert/strict";
import test from "node:test";
import { BrowserResourceCache, browserResourceId, getBrowserResourceCache } from "./browser-resource-cache.ts";

const key = (overrides = {}) => ({ authUserId: "auth-a", profileId: "profile-a", portal: "tenant", resource: "shortlist", params: [null, 50], ...overrides });
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { resolve, promise }; };
function fixture(options = {}) {
  let now = 1_000;
  const cache = new BrowserResourceCache({ now: () => now, ...options });
  cache.setAccount("auth-a");
  return { cache, advance: ms => { now += ms; } };
}
const read = (cache, k = key()) => cache.getSnapshot(k);

test("browser cache never exists on the server and route keys contain every isolation dimension", () => {
  assert.equal(getBrowserResourceCache(), null);
  const original = browserResourceId(key());
  for (const change of [{ authUserId: "b" }, { profileId: "b" }, { portal: "admin" }, { portal: "landlord" }, { resource: "other" }, { params: ["next", 50] }]) {
    assert.notEqual(browserResourceId(key(change)), original);
  }
});

test("cold load starts with no data and a genuine loading state; resolved snapshots are stable", async () => {
  const { cache } = fixture();
  const gate = deferred();
  assert.equal(read(cache).loading, true);
  const request = cache.load(key(), () => gate.promise, "Failed");
  assert.equal(read(cache).hasData, false);
  gate.resolve(["card"]);
  await request;
  const snapshot = read(cache);
  assert.deepEqual(snapshot.data, ["card"]);
  assert.equal(snapshot.loading, false);
  assert.equal(read(cache), snapshot);
});

test("warm revisit and Back/Forward-equivalent remounts synchronously reuse valid data without another request", async () => {
  const { cache } = fixture();
  let requests = 0;
  const load = async () => { requests++; return ["card"]; };
  await cache.load(key(), load, "Failed");
  for (let visit = 0; visit < 5; visit++) {
    assert.deepEqual(read(cache).data, ["card"]);
    await cache.load(key(), load, "Failed");
  }
  assert.equal(requests, 1);
});

test("stale data revalidates in the background without a skeleton, using exact fresh/retention boundaries", async () => {
  const { cache, advance } = fixture();
  await cache.load(key(), async () => ["old"], "Failed");
  advance(30_000);
  const gate = deferred();
  const request = cache.load(key(), () => gate.promise, "Failed");
  assert.deepEqual(read(cache).data, ["old"]);
  assert.equal(read(cache).loading, false);
  assert.equal(read(cache).refreshing, true);
  gate.resolve(["new"]);
  await request;
  assert.deepEqual(read(cache).data, ["new"]);
  advance(120_000);
  assert.equal(read(cache).hasData, false);
  assert.equal(read(cache).loading, true);
});

test("hard expiry prevents a late older refresh from resurrecting expired content", async () => {
  const { cache, advance } = fixture();
  await cache.load(key(), async () => ["old"], "Failed");
  advance(30_000);
  const gate = deferred();
  const old = cache.load(key(), () => gate.promise, "Failed");
  advance(90_000);
  cache.expire(key());
  assert.equal(read(cache).hasData, false);
  await cache.load(key(), async () => ["fresh"], "Failed");
  gate.resolve(["too late"]);
  await old;
  assert.deepEqual(read(cache).data, ["fresh"]);
});

test("concurrent reads, retry and refocus share one identical in-flight request", async () => {
  const { cache } = fixture();
  const gate = deferred();
  let requests = 0;
  const load = () => { requests++; return gate.promise; };
  const first = cache.load(key(), load, "Failed");
  const second = cache.load(key(), load, "Failed", true);
  assert.equal(first, second);
  gate.resolve([]);
  await first;
  assert.equal(requests, 1);
});

test("rapid switching between keys deduplicates their requests and never displays the other key's result", async () => {
  const { cache } = fixture();
  const other = key({ params: ["page-2", 50] });
  const a = deferred();
  const b = deferred();
  const first = cache.load(key(), () => a.promise, "Failed");
  const second = cache.load(other, () => b.promise, "Failed");
  assert.equal(cache.load(key(), () => a.promise, "Failed"), first);
  b.resolve(["B"]);
  await second;
  assert.equal(read(cache).hasData, false);
  assert.deepEqual(read(cache, other).data, ["B"]);
  a.resolve(["A"]);
  await first;
  assert.deepEqual(read(cache).data, ["A"]);
});

test("Tenant/Landlord/Admin and internal profile identities cannot share a cached result", async () => {
  const { cache } = fixture();
  await cache.load(key(), async () => ["private shortlist"], "Failed");
  for (const change of [{ portal: "landlord" }, { portal: "admin" }, { profileId: "different-profile" }]) {
    assert.equal(read(cache, key(change)).hasData, false);
  }
  const b = key({ authUserId: "auth-b" });
  assert.equal(read(cache, b).enabled, false);
  let queried = false;
  await cache.load(b, async () => { queried = true; return []; }, "Failed");
  assert.equal(queried, false);
});

test("logout and account switching clear data, retire pending responses, and do not reuse a previous login", async () => {
  const { cache } = fixture();
  const gate = deferred();
  const pending = cache.load(key(), () => gate.promise, "Failed");
  await Promise.resolve();
  cache.reset();
  assert.equal(read(cache).enabled, false);
  cache.setAccount("auth-b");
  const other = key({ authUserId: "auth-b", profileId: "profile-b" });
  await cache.load(other, async () => ["B"], "Failed");
  gate.resolve(["A"]);
  await pending;
  assert.deepEqual(read(cache, other).data, ["B"]);
  assert.equal(read(cache).hasData, false);
  cache.setAccount("auth-a");
  assert.equal(read(cache).hasData, false);
});

test("same-account token refresh preserves data while explicit reset retires it", async () => {
  const { cache } = fixture();
  await cache.load(key(), async () => ["card"], "Failed");
  cache.setAccount("auth-a");
  assert.deepEqual(read(cache).data, ["card"]);
  cache.reset();
  cache.setAccount("auth-a");
  assert.equal(read(cache).hasData, false);
});

test("mutation invalidation patches presentation immediately, requires revalidation and rejects pre-mutation responses", async () => {
  const { cache } = fixture();
  await cache.load(key(), async () => ["removed", "kept"], "Failed");
  const gate = deferred();
  const old = cache.load(key(), () => gate.promise, "Failed", true);
  await Promise.resolve();
  cache.invalidate(k => k.resource === "shortlist", rows => rows.filter(id => id !== "removed"));
  assert.deepEqual(read(cache).data, ["kept"]);
  assert.equal(read(cache).loading, false);
  assert.equal(read(cache).revision, 1);
  const next = cache.load(key(), async () => ["kept", "new"], "Failed");
  gate.resolve(["removed", "outdated"]);
  await Promise.all([old, next]);
  assert.deepEqual(read(cache).data, ["kept", "new"]);
});

test("an old request's finalizer cannot clear the newer in-flight request after invalidation", async () => {
  const { cache } = fixture();
  const a = deferred();
  const b = deferred();
  const old = cache.load(key(), () => a.promise, "Failed");
  await Promise.resolve();
  cache.invalidate(() => true);
  const newer = cache.load(key(), () => b.promise, "Failed");
  a.resolve(["old"]);
  await old;
  assert.equal(cache.load(key(), () => assert.fail("Duplicate request"), "Failed"), newer);
  b.resolve(["new"]);
  await newer;
});

test("failed refresh retains suitable prior content with an error and can recover; cold failures are not cached successes", async () => {
  const { cache, advance } = fixture();
  await cache.load(key(), async () => { throw new Error("Offline"); }, "Failed");
  assert.equal(read(cache).hasData, false);
  assert.equal(read(cache).loading, false);
  assert.equal(read(cache).error, "Offline");
  await cache.load(key(), async () => ["old"], "Failed");
  advance(30_000);
  await cache.load(key(), async () => { throw new Error("Offline"); }, "Failed");
  assert.deepEqual(read(cache).data, ["old"]);
  assert.equal(read(cache).error, "Offline");
  await cache.load(key(), async () => ["new"], "Failed", true);
  assert.equal(read(cache).error, null);
  assert.deepEqual(read(cache).data, ["new"]);
});

test("LRU eviction bounds retained entries and expiry sweeps remove unused routes", async () => {
  const { cache, advance } = fixture({ maxEntries: 2 });
  const b = key({ resource: "B" });
  const c = key({ resource: "C" });
  await cache.load(key(), async () => ["A"], "Failed");
  advance(1);
  await cache.load(b, async () => ["B"], "Failed");
  advance(1);
  read(cache);
  advance(1);
  await cache.load(c, async () => ["C"], "Failed");
  assert.equal(read(cache, b).hasData, false);
  assert.equal(read(cache).hasData, true);
  advance(120_000);
  await cache.load(b, async () => ["new B"], "Failed");
  assert.equal(read(cache).hasData, false);
  assert.equal(read(cache, c).hasData, false);
});
