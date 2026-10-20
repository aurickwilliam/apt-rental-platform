import assert from "node:assert/strict";
import test from "node:test";
import { NotificationFeedStore } from "./notification-feed-store.ts";

const row = (id, is_read = false) => ({ id, is_read, created_at: "2026-10-18T12:00:00Z" });
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
function fixture(load = async () => [row("a"), row("b")]) {
  let loads = 0, connections = 0, disconnections = 0, idle = 0;
  let event;
  const errors = [];
  const store = new NotificationFeedStore({
    load: () => { loads++; return load(); },
    connect: onChange => { connections++; event = onChange; return () => disconnections++; },
    onIdle: () => idle++,
    onError: (...args) => errors.push(args),
  });
  return { store, errors, event: () => event(), counts: () => ({ loads, connections, disconnections, idle }) };
}

test("sidebar, mobile menu, drawer and bell share one initial request and connection", async () => {
  const f = fixture();
  const updates = [0, 0, 0, 0];
  const detach = updates.map((_, i) => f.store.subscribe(() => updates[i]++));
  await f.store.refresh();
  assert.deepEqual(f.counts(), { loads: 1, connections: 1, disconnections: 0, idle: 0 });
  assert.ok(updates.every(n => n > 0));
  const snapshot = f.store.getSnapshot();
  assert.equal(f.store.getSnapshot(), snapshot, "snapshot identity is stable between publications");
  detach[0](); detach[1](); detach[2]();
  await Promise.resolve();
  assert.equal(f.counts().disconnections, 0);
  detach[3]();
  await Promise.resolve();
  assert.equal(f.counts().disconnections, 1);
  assert.deepEqual(f.store.getSnapshot().notifications, []);
});

test("Strict Mode and synchronous portal handovers do not duplicate requests", async () => {
  const f = fixture();
  f.store.subscribe(() => {})();
  const detach = f.store.subscribe(() => {});
  await f.store.refresh();
  assert.equal(f.counts().loads, 1);
  assert.equal(f.counts().connections, 1);
  detach();
  await Promise.resolve();
});

test("concurrent refreshes deduplicate, with one trailing fetch for a Realtime burst", async () => {
  const first = deferred();
  let call = 0;
  const f = fixture(() => ++call === 1 ? first.promise : Promise.resolve([row("new"), row("a")]));
  const detach = f.store.subscribe(() => {});
  const request = f.store.refresh();
  assert.equal(f.store.refresh(), request);
  await Promise.resolve();
  f.event(); f.event(); f.event();
  first.resolve([row("a")]);
  await request;
  assert.equal(f.counts().loads, 2);
  assert.deepEqual(f.store.getSnapshot().notifications.map(n => n.id), ["new", "a"]);
  assert.equal(f.counts().connections, 1);
  detach();
});

test("successful optimistic reads synchronize immediately and survive an older refetch", async () => {
  const write = deferred();
  const f = fixture();
  const detach = f.store.subscribe(() => {});
  await f.store.refresh();
  const read = f.store.markRead(["a"], () => write.promise);
  assert.deepEqual(f.store.getSnapshot().notifications.map(n => n.is_read), [true, false]);
  await f.store.refresh();
  assert.equal(f.store.getSnapshot().notifications[0].is_read, true);
  write.resolve(); await read;
  await f.store.refresh();
  assert.equal(f.store.getSnapshot().notifications[0].is_read, true);
  assert.deepEqual(f.store.getSnapshot().notifications.map(n => n.id), ["a", "b"]);
  detach();
});

test("failed optimistic reads roll back for all consumers and revalidate once", async () => {
  const write = deferred();
  const f = fixture();
  const detach = f.store.subscribe(() => {});
  await f.store.refresh();
  const read = f.store.markRead(["a"], () => write.promise);
  assert.equal(f.store.getSnapshot().notifications[0].is_read, true);
  write.reject(new Error("refused")); await read;
  await f.store.refresh();
  assert.equal(f.store.getSnapshot().notifications[0].is_read, false);
  assert.equal(f.errors.length, 1);
  assert.equal(f.counts().loads, 2);
  detach();
});

test("overlapping single and bulk reads do not roll back another successful read", async () => {
  const first = deferred(), second = deferred();
  const f = fixture();
  const detach = f.store.subscribe(() => {});
  await f.store.refresh();
  const a = f.store.markRead(["a"], () => first.promise);
  const all = f.store.markRead(["a", "b"], () => second.promise);
  first.resolve(); await a;
  second.reject(new Error("bulk refused")); await all;
  await f.store.refresh();
  assert.deepEqual(f.store.getSnapshot().notifications.map(n => n.is_read), [true, false]);
  detach();
});

test("account disposal rejects late data and mutation responses; a new account is isolated", async () => {
  const response = deferred(), write = deferred();
  const old = fixture(() => response.promise);
  const detach = old.store.subscribe(() => {});
  const request = old.store.refresh();
  await Promise.resolve();
  const read = old.store.markRead(["old"], () => write.promise);
  detach(); await Promise.resolve();
  const next = fixture(async () => [row("new-account")]);
  const stop = next.store.subscribe(() => {});
  await next.store.refresh();
  response.resolve([row("old-account")]); write.resolve();
  await Promise.all([request, read]);
  assert.deepEqual(old.store.getSnapshot().notifications, []);
  assert.deepEqual(next.store.getSnapshot().notifications.map(n => n.id), ["new-account"]);
  stop();
});

test("load failures retain known activity and a later refresh recovers", async () => {
  let fail = false;
  const f = fixture(async () => { if (fail) throw new Error("offline"); return [row("a")]; });
  const detach = f.store.subscribe(() => {});
  await f.store.refresh(); fail = true;
  await f.store.refresh();
  assert.equal(f.store.getSnapshot().error, "Couldn't load your notifications.");
  assert.equal(f.store.getSnapshot().notifications[0].id, "a");
  fail = false; await f.store.refresh();
  assert.equal(f.store.getSnapshot().error, null);
  detach();
});

test("Realtime read updates and deletions publish to every consumer", async () => {
  let rows = [row("a"), row("b")];
  const f = fixture(async () => rows);
  const seen = [];
  const detach = f.store.subscribe(() => seen.push(f.store.getSnapshot()));
  await f.store.refresh();
  rows = [row("a", true), row("b")];
  f.event(); await f.store.refresh();
  assert.deepEqual(f.store.getSnapshot().notifications.map(n => n.is_read), [true, false]);
  rows = [row("a", true)];
  f.event(); await f.store.refresh();
  assert.deepEqual(f.store.getSnapshot().notifications.map(n => n.id), ["a"]);
  assert.equal(seen.at(-1), f.store.getSnapshot());
  detach();
});
