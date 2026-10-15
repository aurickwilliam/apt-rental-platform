import assert from "node:assert/strict";
import { test } from "node:test";
import { RequestCache } from "./profile-request-cache.ts";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

test("concurrent consumers share one in-flight request", async () => {
  let calls = 0;
  const gate = deferred();
  const cache = new RequestCache(async () => {
    calls += 1;
    await gate.promise;
    return { id: 1 };
  });
  const [a, b, c] = await Promise.all([
    (async () => {
      const p = cache.get("user-a");
      gate.resolve();
      return p;
    })(),
    cache.get("user-a"),
    cache.get("user-a"),
  ]);
  assert.equal(calls, 1);
  assert.deepEqual(a, { id: 1 });
  assert.deepEqual(b, { id: 1 });
  assert.deepEqual(c, { id: 1 });
});

test("different keys load independently", async () => {
  const seen = [];
  const cache = new RequestCache(async (key) => {
    seen.push(key);
    return `value-for-${key}`;
  });
  const [a, b] = await Promise.all([cache.get("user-a"), cache.get("user-b")]);
  assert.equal(a, "value-for-user-a");
  assert.equal(b, "value-for-user-b");
  assert.deepEqual(seen.sort(), ["user-a", "user-b"]);
});

test("resolved values are reused within the TTL and reloaded after", async () => {
  let calls = 0;
  let now = 1_000;
  const cache = new RequestCache(
    async () => {
      calls += 1;
      return { n: calls };
    },
    { staleTimeMs: 30_000, now: () => now },
  );
  assert.deepEqual(await cache.get("user-a"), { n: 1 });
  now += 29_999;
  assert.deepEqual(await cache.get("user-a"), { n: 1 });
  assert.equal(calls, 1);
  now += 2;
  assert.deepEqual(await cache.get("user-a"), { n: 2 });
  assert.equal(calls, 2);
});

test("without a TTL only in-flight requests are shared", async () => {
  let calls = 0;
  const cache = new RequestCache(async () => {
    calls += 1;
    return calls;
  });
  assert.equal(await cache.get("user-a"), 1);
  assert.equal(await cache.get("user-a"), 2);
  assert.equal(calls, 2);
});

test("rejections are never cached", async () => {
  let calls = 0;
  const cache = new RequestCache(async () => {
    calls += 1;
    if (calls === 1) throw new Error("network down");
    return "recovered";
  });
  await assert.rejects(() => cache.get("user-a"), /network down/);
  assert.equal(await cache.get("user-a"), "recovered");
  assert.equal(calls, 2);
});

test("invalidating a key reloads only that key", async () => {
  const calls = [];
  const cache = new RequestCache(
    async (key) => {
      calls.push(key);
      return `${key}@${calls.length}`;
    },
    { staleTimeMs: 60_000 },
  );
  await cache.get("user-a");
  await cache.get("user-b");
  cache.invalidate("user-a");
  await cache.get("user-a");
  await cache.get("user-b");
  assert.deepEqual(calls, ["user-a", "user-b", "user-a"]);
});

test("full invalidation drops every key", async () => {
  let calls = 0;
  const cache = new RequestCache(
    async () => {
      calls += 1;
      return calls;
    },
    { staleTimeMs: 60_000 },
  );
  await cache.get("user-a");
  await cache.get("user-b");
  cache.invalidate();
  await cache.get("user-a");
  assert.equal(calls, 3);
});

test("a stale in-flight resolution never repopulates after invalidation", async () => {
  const gates = [];
  const cache = new RequestCache(
    async (key) => {
      const gate = deferred();
      gates.push({ key, gate });
      await gate.promise;
      return `fresh-for-${key}`;
    },
    { staleTimeMs: 60_000 },
  );
  // Sign-out (or account switch) lands while the first load is pending.
  const first = cache.get("user-a");
  cache.invalidate();
  gates[0].gate.resolve();
  assert.equal(await first, "fresh-for-user-a");
  // The late resolution must not have been stored: the next read reloads.
  const second = cache.get("user-a");
  gates[1].gate.resolve();
  assert.equal(await second, "fresh-for-user-a");
  assert.equal(gates.length, 2);
});

test("a newer pending entry survives an older one's late settlement", async () => {
  const gates = [];
  const cache = new RequestCache(async () => {
    const gate = deferred();
    gates.push(gate);
    const n = gates.length;
    await gate.promise;
    return `load-${n}`;
  });
  const first = cache.get("user-a");
  // Newer load for the same key replaces the pending entry.
  cache.invalidate("user-a");
  const second = cache.get("user-a");
  // Old settles late: must not delete or overwrite the newer entry.
  gates[0].resolve();
  assert.equal(await first, "load-1");
  gates[1].resolve();
  assert.equal(await second, "load-2");
  assert.equal(gates.length, 2);
});

test("write-through set() serves later reads without loading", async () => {
  let calls = 0;
  const cache = new RequestCache(
    async () => {
      calls += 1;
      return "loaded";
    },
    { staleTimeMs: 60_000 },
  );
  cache.set("user-a", "refreshed");
  assert.equal(await cache.get("user-a"), "refreshed");
  assert.equal(calls, 0);
});
