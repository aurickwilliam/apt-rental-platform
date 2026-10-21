import assert from "node:assert/strict";
import { test } from "node:test";

import {
  FinanceReadCache,
  financeCacheKey,
  financeOwnerPrefix,
} from "./landlord-finance-cache.ts";

function clocked(options = {}) {
  let time = 0;
  const cache = new FinanceReadCache({
    freshMs: 1000,
    maxStaleMs: 5000,
    now: () => time,
    ...options,
  });
  return { cache, advance: (ms) => (time += ms) };
}

test("a fresh value is reused without loading", async () => {
  const { cache, advance } = clocked();
  let loads = 0;
  const load = async () => ++loads;
  assert.equal(await cache.read("a", load), 1);
  advance(500);
  assert.equal(await cache.read("a", load), 1);
  advance(600);
  assert.equal(await cache.read("a", load), 2);
});

test("concurrent reads share one load", async () => {
  const { cache } = clocked();
  let loads = 0;
  const load = () => new Promise((resolve) => setTimeout(() => resolve(++loads), 5));
  const [a, b] = await Promise.all([cache.read("k", load), cache.read("k", load)]);
  assert.equal(a, 1);
  assert.equal(b, 1);
  assert.equal(loads, 1);
});

test("peek paints stale values until maxStaleMs, then forgets them", async () => {
  const { cache, advance } = clocked();
  await cache.read("a", async () => "report");
  advance(3000);
  assert.equal(cache.peek("a"), "report");
  advance(3000);
  assert.equal(cache.peek("a"), undefined);
});

test("failures are never cached", async () => {
  const { cache } = clocked();
  await assert.rejects(cache.read("a", async () => Promise.reject(new Error("no"))));
  assert.equal(cache.peek("a"), undefined);
  assert.equal(await cache.read("a", async () => "ok"), "ok");
});

test("invalidate forces the next read to load and drops a load in flight", async () => {
  const { cache } = clocked();
  await cache.read("a", async () => 1);
  cache.invalidate("a");
  assert.equal(cache.peek("a"), undefined);
  let release;
  const slow = cache.read("a", () => new Promise((resolve) => (release = resolve)));
  cache.invalidate("a");
  release("stale");
  assert.equal(await slow, "stale");
  // The load that finished after the invalidation never committed.
  assert.equal(cache.peek("a"), undefined);
});

test("clearPrefix removes only that owner's reads", async () => {
  const { cache } = clocked();
  await cache.read(financeCacheKey("owner-a", "report", "2026-10", null), async () => "a");
  await cache.read(financeCacheKey("owner-b", "report", "2026-10", null), async () => "b");
  cache.clearPrefix(financeOwnerPrefix("owner-a"));
  assert.equal(cache.peek(financeCacheKey("owner-a", "report", "2026-10", null)), undefined);
  assert.equal(cache.peek(financeCacheKey("owner-b", "report", "2026-10", null)), "b");
});

test("keys differ per owner, kind and scope", () => {
  assert.notEqual(
    financeCacheKey("a", "report", "2026-10", null),
    financeCacheKey("b", "report", "2026-10", null),
  );
  assert.notEqual(
    financeCacheKey("a", "report", "2026-10", null),
    financeCacheKey("a", "report", "2026-10", "apt"),
  );
});

test("configured to zero, nothing is reused or painted stale", async () => {
  const { cache } = clocked({ freshMs: 0, maxStaleMs: 0 });
  let loads = 0;
  await cache.read("a", async () => ++loads);
  await cache.read("a", async () => ++loads);
  assert.equal(loads, 2);
  assert.equal(cache.peek("a"), undefined);
});
