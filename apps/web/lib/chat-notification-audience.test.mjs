import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as audience from "./notification-audience.ts";
import { NotificationFeedStore } from "./notification-feed-store.ts";

function load(file, modules, extra = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS },
  }).outputText, { exports, require: name => {
    assert.ok(name in modules, `Missing dependency: ${name}`);
    return modules[name];
  }, ...extra });
  return exports;
}
const helper = load("./chat-notification-audience.ts", { "./notification-audience": audience });
const { getLegacyChatApartmentIds, resolveChatNotificationAudiences } = helper;
const VIEWER = "39d239dc-3df7-4be7-a534-f127310e1c3b";
const PEER = "fffe3a40-7fa6-4079-81c8-28d1301b8814";
const OTHER = "11111111-1111-4111-8111-111111111111";
const OWN = "81ad4faf-b38d-4e29-b5d8-5e63df8b9b8a";
const RENTED = "dfddbfce-8611-403b-aefe-ac6e770b8f35";
const owners = [{ id: OWN, landlord_id: VIEWER }, { id: RENTED, landlord_id: PEER }];
const row = (id, data = {}, extra = {}) => ({
  id, user_id: VIEWER, type: "message", title: "Sender", message: "hello", is_read: false,
  created_at: "2026-10-18T08:15:08.703202Z",
  data: { screen: "chat", senderId: PEER, apartmentId: OWN, ...data }, ...extra,
});
const resolve = rows => resolveChatNotificationAudiences(rows, VIEWER, owners);
const visible = (rows, portal) => [...audience.getVisibleUnreadIds(rows, portal)];
const deferred = () => {
  let resolve;
  const promise = new Promise(yes => { resolve = yes; });
  return { promise, resolve };
};

test("apartment relationship, not single/dual/Admin memberships, determines text, image and reaction audiences", () => {
  for (const roles of [["tenant"], ["landlord"], ["tenant", "landlord"], ["admin", "landlord"]]) {
    const rows = resolve([
      row("owned-text", {}, { roles }),
      row("rented-image", { apartmentId: RENTED }, { roles, message: "Sent an image" }),
      row("sire-reaction", { event: "reaction", messagePreview: "sire", emoji: "😂" }, { roles }),
    ]);
    assert.deepEqual(visible(rows, "landlord"), ["owned-text", "sire-reaction"]);
    assert.deepEqual(visible(rows, "tenant"), ["rented-image"]);
    assert.deepEqual(visible(rows, "admin"), []);
  }
});

test("explicit valid recipientPortal wins; invalid explicit metadata never becomes a legacy guess", () => {
  const rows = [row("explicit", { recipientPortal: "tenant" }), ...["admin", "account", "both", null, 42, ""].map(
    (recipientPortal, index) => row(`invalid-${index}`, { recipientPortal }),
  )];
  assert.deepEqual([...getLegacyChatApartmentIds(rows, VIEWER)], []);
  const result = resolve(rows);
  assert.deepEqual(visible(result, "tenant"), ["explicit"]);
  assert.deepEqual(visible(result, "landlord"), []);
  assert.deepEqual(visible(result, "admin"), []);
});

test("only required distinct valid legacy apartment IDs are collected", () => {
  const rows = [row("a"), row("duplicate"), row("rented", { apartmentId: RENTED }),
    row("explicit", { apartmentId: OTHER, recipientPortal: "landlord" }),
    row("malformed", { apartmentId: "not-a-uuid" }), row("missing-peer", { senderId: null }),
    row("not-chat", { screen: "payments" }, { type: "payment" }),
    row("wrong-account", {}, { user_id: OTHER })];
  assert.deepEqual([...getLegacyChatApartmentIds(rows, VIEWER)], [OWN, RENTED]);
});

test("missing, inaccessible, deleted or conflicting context stays unresolved and unchanged", () => {
  const cases = [row("missing", { apartmentId: null }), row("bad", { apartmentId: "bad" }),
    row("self", { senderId: VIEWER }), row("no-peer", { senderId: null }),
    row("other-owner"), row("wrong-account", {}, { user_id: OTHER }),
    row("null-data", {}, { data: null }), row("array-data", {}, { data: [] })];
  const before = JSON.stringify(cases);
  const result = resolveChatNotificationAudiences(cases, VIEWER, [{ id: OWN, landlord_id: OTHER }]);
  assert.ok(result.every(n => n.resolvedChatAudience === "unresolved"));
  for (const portal of ["tenant", "landlord", "admin"]) assert.deepEqual(visible(result, portal), []);
  assert.equal(JSON.stringify(cases), before, "no record or read-state mutation");
  assert.equal(resolveChatNotificationAudiences([row("deleted")], VIEWER, [])[0].resolvedChatAudience, "unresolved");
  assert.equal(resolveChatNotificationAudiences([row("conflict")], VIEWER,
    [{ id: OWN, landlord_id: VIEWER }, { id: OWN, landlord_id: PEER }])[0].resolvedChatAudience, "unresolved");
});

test("known account-wide and Admin review records are not reinterpreted as chat", () => {
  const account = row("account", { screen: "verification" }, { type: "system", title: "Account verification approved" });
  const admin = row("admin", { screen: "passportReview" }, { type: "system", title: "New passport document submitted" });
  const result = resolve([account, admin]);
  assert.equal(result[0], account);
  assert.equal(result[1], admin);
  assert.deepEqual(visible(result, "tenant"), ["account"]);
  assert.deepEqual(visible(result, "landlord"), ["account"]);
  assert.deepEqual(visible(result, "admin"), ["account", "admin"]);
});

function serviceFixture({ rows = [], apartments = owners, ownershipError = null, ownershipWait = null } = {}) {
  const calls = [];
  const errors = [];
  const ownershipStarted = deferred();
  const service = load("../service/notificationService.ts", {
    "@/lib/chat-notification-audience": helper,
    "@repo/supabase/browser": { createClient: () => ({ from: table => {
      calls.push(["from", table]);
      const query = {
        select: columns => { calls.push(["select", columns]); return query; },
        eq: (key, value) => { calls.push(["eq", key, value]); return query; },
        order: (key, value) => { calls.push(["order", key, value.ascending]); return query; },
        limit: async limit => { calls.push(["limit", limit]); return { data: rows, error: null }; },
        in: async (key, ids) => {
          calls.push(["in", key, [...ids]]);
          ownershipStarted.resolve();
          if (ownershipWait) await ownershipWait;
          return { data: apartments, error: ownershipError };
        },
      };
      return query;
    } }) },
  }, { console: { error: (...args) => errors.push(args) } });
  return { service, calls, errors, ownershipStarted: ownershipStarted.promise };
}

test("service batches ownership once, selects only owner columns, and publishes only resolved rows", async () => {
  const f = serviceFixture({ rows: [row("a"), row("b"), row("c", { apartmentId: RENTED })] });
  const rows = await f.service.fetchNotifications(VIEWER);
  assert.deepEqual(f.calls.filter(call => call[0] === "from"), [["from", "notifications"], ["from", "apartments"]]);
  assert.deepEqual(f.calls.filter(call => call[0] === "in"), [["in", "id", [OWN, RENTED]]]);
  assert.ok(f.calls.some(call => call[0] === "select" && call[1] === "id, landlord_id"));
  assert.deepEqual(visible(rows, "landlord"), ["a", "b"]);
  assert.deepEqual(visible(rows, "tenant"), ["c"]);
});

test("service skips ownership when explicit metadata or non-chat rows suffice", async () => {
  const f = serviceFixture({ rows: [row("explicit", { recipientPortal: "landlord" }), row("missing", { apartmentId: null })] });
  const rows = await f.service.fetchNotifications(VIEWER);
  assert.equal(f.calls.filter(call => call[0] === "from").length, 1);
  assert.deepEqual(visible(rows, "landlord"), ["explicit"]);
});

test("ownership failure retains explicit/non-chat notifications but never exposes unresolved chat", async () => {
  const f = serviceFixture({ rows: [row("legacy"), row("explicit", { recipientPortal: "tenant" }),
    row("account", { screen: "verification" }, { type: "system", title: "Account verification approved" })],
    ownershipError: new Error("private details must not be logged") });
  const result = await f.service.fetchNotifications(VIEWER);
  assert.deepEqual(visible(result, "tenant"), ["explicit", "account"]);
  assert.deepEqual(visible(result, "landlord"), ["account"]);
  assert.equal(result[0].is_read, false);
  assert.equal(f.errors.length, 1);
  assert.doesNotMatch(JSON.stringify(f.errors), /private details/);
});

test("shared store waits for ownership, deduplicates readers and rejects late resolution after disposal", async () => {
  const wait = deferred();
  const f = serviceFixture({ rows: [row("legacy")], ownershipWait: wait.promise });
  let connections = 0;
  const store = new NotificationFeedStore({
    load: () => f.service.fetchNotifications(VIEWER),
    connect: () => { connections++; return () => {}; }, onIdle: () => {}, onError: () => {},
  });
  const stopA = store.subscribe(() => {});
  const stopB = store.subscribe(() => {});
  const pending = store.refresh();
  await f.ownershipStarted;
  assert.equal(store.getSnapshot().notifications.length, 0, "no raw chat is published during the ownership request");
  assert.equal(store.refresh(), pending);
  assert.equal(connections, 1);
  assert.equal(f.calls.filter(call => call[0] === "from" && call[1] === "apartments").length, 1);
  stopA(); stopB(); await Promise.resolve();
  wait.resolve(); await pending;
  assert.equal(store.getSnapshot().notifications.length, 0, "retired account cannot publish late audience resolution");
});

test("Realtime during ownership loading refetches once and optimistic reads keep the resolved audience", async () => {
  const wait = deferred();
  const f = serviceFixture({ rows: [row("landlord"), row("tenant", { apartmentId: RENTED })], ownershipWait: wait.promise });
  let event;
  let connections = 0;
  const seen = [];
  const store = new NotificationFeedStore({
    load: () => f.service.fetchNotifications(VIEWER),
    connect: onChange => { event = onChange; connections++; return () => {}; },
    onIdle: () => {}, onError: () => {},
  });
  const stop = store.subscribe(() => seen.push(store.getSnapshot()));
  try {
    const pending = store.refresh();
    await f.ownershipStarted;
    event(); event();
    assert.equal(store.getSnapshot().notifications.length, 0);
    wait.resolve(); await pending;
    assert.equal(connections, 1);
    assert.equal(f.calls.filter(call => call[0] === "from" && call[1] === "apartments").length, 2,
      "one initial resolution plus one deduplicated trailing Realtime resolution");
    assert.ok(seen.every(snapshot => snapshot.notifications.every(n => n.resolvedChatAudience !== undefined)));
    const rows = store.getSnapshot().notifications;
    assert.deepEqual(visible(rows, "tenant"), ["tenant"]);
    assert.deepEqual(visible(rows, "landlord"), ["landlord"]);
    await store.markRead(audience.getVisibleUnreadIds(rows, "landlord"), async () => {});
    await store.refresh();
    assert.deepEqual(visible(store.getSnapshot().notifications, "landlord"), []);
    assert.deepEqual(visible(store.getSnapshot().notifications, "tenant"), ["tenant"]);
    assert.equal(store.getSnapshot().notifications[0].resolvedChatAudience, "landlord");
  } finally { stop(); }
});
