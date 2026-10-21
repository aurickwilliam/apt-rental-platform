import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

import { sortNotificationsNewestFirst } from "../../../packages/utils/src/notificationOrder.ts";

// The module under test imports @repo/utils for its sort; transpile it the
// same way the drawer harness transpiles TSX and hand it the real helper.
function load(file, modules) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (name) => {
      assert.ok(name in modules, `Missing test dependency: ${name}`);
      return modules[name];
    },
  });
  return exports;
}

const {
  MESSAGE_GROUP_WINDOW_MS,
  composeNotificationGroupLabel,
  formatMessageGroupCount,
  getChatMessageIdentity,
  groupNotificationFeed,
} = load(`${"../../../packages/utils/src/"}notificationGroups.ts`, {
  "./notificationOrder": { sortNotificationsNewestFirst },
});

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const BASE = Date.parse("2026-10-18T10:00:00.000Z");

const at = (offsetMs) => new Date(BASE + offsetMs).toISOString();

const row = ({ at: createdAt, id, type = "message", data, is_read = false } = {}) => ({
  id,
  type,
  title: "MAHARTT Navales",
  message: "raymo",
  data:
    data === undefined
      ? { screen: "chat", conversationKey: "chat:apt-1:peer-1:me", senderId: "peer-1", apartmentId: "apt-1" }
      : data,
  is_read,
  created_at: createdAt,
});

const chat = (minutes, extra = {}) => row({ at: at(minutes * MINUTE), ...extra });

const messageGroups = (units) => units.filter((unit) => unit.kind === "message-group");
const singles = (units) => units.filter((unit) => unit.kind === "single");
// The module runs in a vm realm, so its arrays carry that realm's prototype;
// copy ids/kinds into the test realm before comparing.
const memberIds = (unit) => [...unit.members.map((member) => member.id)];
const unitKinds = (units) => [...units.map((unit) => unit.kind)];
const singleIds = (units) => [...units.map((unit) => unit.notification.id)];

test("consecutive messages from one sender collapse into one newest-first group", () => {
  const units = groupNotificationFeed([
    chat(14, { id: "c" }),
    chat(5, { id: "b" }),
    chat(0, { id: "a" }),
  ]);
  assert.equal(units.length, 1);
  const [group] = units;
  assert.equal(group.kind, "message-group");
  assert.equal(group.count, 3);
  assert.deepEqual(
    memberIds(group),
    ["c", "b", "a"],
    "members stay newest first",
  );
  assert.equal(group.latest.id, "c");
  assert.equal(group.hasUnread, true);
  assert.equal(group.created_at, at(14 * MINUTE), "summary timestamp is the newest member's");
  assert.equal(group.id, group.key, "the unit id doubles as its stable key");
  assert.equal(
    group.key,
    "chat:apt-1:peer-1:me\u0000peer-1\u0000a",
    "identity is the oldest loaded member, not the newest",
  );
});

test("the window rolls while activity continues and splits after a quiet gap", () => {
  const chained = groupNotificationFeed([chat(28, { id: "c" }), chat(14, { id: "b" }), chat(0, { id: "a" })]);
  assert.equal(chained.length, 1, "10:00 + 10:14 + 10:28 is one rolling group");
  assert.equal(chained[0].count, 3);
  assert.deepEqual(memberIds(chained[0]), ["c", "b", "a"]);

  const split = groupNotificationFeed([
    chat(44, { id: "d" }),
    chat(28, { id: "c" }),
    chat(14, { id: "b" }),
    chat(0, { id: "a" }),
  ]);
  assert.deepEqual(
    unitKinds(split),
    ["single", "message-group"],
    "a 16-minute gap starts a new group",
  );
  assert.equal(split[0].notification.id, "d");
  assert.deepEqual(memberIds(split[1]), ["c", "b", "a"]);
  assert.notEqual(split[0].id, split[1].id, "separate bursts keep separate identities");
});

test("the window includes exactly 15 minutes and splits past it", () => {
  const boundary = groupNotificationFeed([
    row({ at: "2026-10-18T10:15:00.000Z", id: "newer" }),
    row({ at: "2026-10-18T10:00:00.000Z", id: "older" }),
  ]);
  assert.equal(boundary.length, 1);
  assert.equal(boundary[0].count, 2, "exactly 15 minutes still joins");

  const past = groupNotificationFeed([
    row({ at: "2026-10-18T10:15:00.001Z", id: "newer" }),
    row({ at: "2026-10-18T10:00:00.000Z", id: "older" }),
  ]);
  assert.equal(past.length, 2, "one millisecond past the window splits");

  // Sub-millisecond fractions decide when the millisecond delta equals the
  // window: a later fraction exceeds it, an earlier one stays inside.
  const laterFraction = groupNotificationFeed([
    row({ at: "2026-10-18T10:15:00.000800Z", id: "newer" }),
    row({ at: "2026-10-18T10:00:00.000400Z", id: "older" }),
  ]);
  assert.equal(laterFraction.length, 2, "15:00.0004 apart splits");

  const earlierFraction = groupNotificationFeed([
    row({ at: "2026-10-18T10:15:00.000400Z", id: "newer" }),
    row({ at: "2026-10-18T10:00:00.000800Z", id: "older" }),
  ]);
  assert.equal(earlierFraction.length, 1, "14:59.9996 apart joins");
});

test("identical timestamps group deterministically in query order", () => {
  const sameMoment = at(5 * MINUTE);
  const units = groupNotificationFeed([
    row({ at: sameMoment, id: "c" }),
    row({ at: sameMoment, id: "a" }),
    row({ at: sameMoment, id: "b" }),
  ]);
  assert.equal(units.length, 1);
  assert.deepEqual(
    memberIds(units[0]),
    ["a", "b", "c"],
    "ties follow the feed's created_at DESC, id ASC order",
  );
  assert.equal(units[0].latest.id, "a");
});

test("different senders and conversations never merge", () => {
  const units = groupNotificationFeed([
    row({ at: at(2 * MINUTE), id: "peer-1-a" }),
    row({
      at: at(1 * MINUTE),
      id: "peer-2-a",
      data: { screen: "chat", conversationKey: "chat:apt-1:peer-2:me", senderId: "peer-2", apartmentId: "apt-1" },
    }),
    row({
      at: at(0),
      id: "peer-1-other-apt",
      data: { screen: "chat", conversationKey: "chat:apt-9:peer-1:me", senderId: "peer-1", apartmentId: "apt-9" },
    }),
  ]);
  assert.equal(messageGroups(units).length, 0);
  assert.deepEqual(singleIds(units), ["peer-1-a", "peer-2-a", "peer-1-other-apt"]);
});

test("reactions and unknown chat events stay individual even with a shared identity", () => {
  const units = groupNotificationFeed([
    row({
      at: at(10 * MINUTE),
      id: "reaction",
      data: {
        screen: "chat",
        event: "reaction",
        conversationKey: "chat:apt-1:peer-1:me",
        senderId: "peer-1",
        apartmentId: "apt-1",
        messagePreview: "raymo",
      },
    }),
    row({
      at: at(9 * MINUTE),
      id: "future-event",
      data: { screen: "chat", event: "typing", conversationKey: "chat:apt-1:peer-1:me", senderId: "peer-1" },
    }),
    chat(8, { id: "message-1" }),
    chat(7, { id: "message-2" }),
  ]);
  assert.deepEqual(
    unitKinds(units),
    ["single", "single", "message-group"],
  );
  assert.deepEqual(singleIds(singles(units)), ["reaction", "future-event"]);
  assert.equal(messageGroups(units)[0].count, 2, "events never join the message burst");
});

test("missing or ambiguous identity keeps a row individual", () => {
  const cases = [
    { id: "no-key", data: { screen: "chat", senderId: "peer-1" } },
    { id: "blank-key", data: { screen: "chat", conversationKey: "  ", senderId: "peer-1" } },
    { id: "no-sender", data: { screen: "chat", conversationKey: "chat:apt-1:x:y" } },
    { id: "blank-sender", data: { screen: "chat", conversationKey: "chat:apt-1:x:y", senderId: " " } },
    { id: "no-data", data: null },
    { id: "string-data", data: "chat" },
    { id: "wrong-screen", data: { screen: "payments", conversationKey: "chat:apt-1:x:y", senderId: "peer-1" } },
    {
      id: "not-message",
      type: "system",
      data: { screen: "chat", conversationKey: "chat:apt-1:x:y", senderId: "peer-1" },
    },
  ];
  const units = groupNotificationFeed(cases.map(({ id, data, type }) => row({ at: at(0), id, data, type })));
  assert.equal(units.length, cases.length);
  assert.ok(units.every((unit) => unit.kind === "single"));

  for (const { id, data, type } of cases) {
    assert.equal(getChatMessageIdentity(row({ at: at(0), id, data, type })), null, id);
  }
});

test("unrelated rows keep their positions and never break a chat chain", () => {
  const payment = row({
    at: at(5 * MINUTE),
    id: "payment",
    type: "payment",
    data: { screen: "payments", paymentId: "p1" },
  });
  const units = groupNotificationFeed([chat(10, { id: "new-message" }), payment, chat(0, { id: "old-message" })]);
  assert.deepEqual(
    unitKinds(units),
    ["message-group", "single"],
  );
  assert.equal(units[1].notification.id, "payment");
  assert.equal(units[0].count, 2, "interleaved rows do not count as a gap");
});

test("a partially read group stays unread; a fully read one does not", () => {
  const mixed = groupNotificationFeed([chat(2, { id: "read", is_read: true }), chat(1, { id: "unread" })]);
  assert.equal(mixed[0].hasUnread, true);

  const read = groupNotificationFeed([
    chat(2, { id: "a", is_read: true }),
    chat(1, { id: "b", is_read: true }),
  ]);
  assert.equal(read[0].hasUnread, false);
});

test("realtime arrivals keep the group key while the oldest member stays loaded", () => {
  const before = groupNotificationFeed([chat(2, { id: "b" }), chat(1, { id: "a" })]);
  const after = groupNotificationFeed([chat(9, { id: "c" }), chat(2, { id: "b" }), chat(1, { id: "a" })]);
  assert.equal(after.length, 1);
  assert.equal(after[0].count, 3);
  assert.equal(after[0].key, before[0].key, "expansion state must survive the arrival");
  assert.equal(after[0].latest.id, "c");

  const separateBurst = groupNotificationFeed([chat(2, { id: "x" }), chat(1, { id: "y" })]);
  assert.notEqual(separateBurst[0].key, before[0].key, "different bursts keep distinct keys");
});

test("newest-first order is preserved regardless of input order", () => {
  const shuffled = groupNotificationFeed([chat(1, { id: "a" }), chat(9, { id: "c" }), chat(2, { id: "b" })]);
  assert.equal(shuffled.length, 1, "all three are chained within the window");
  assert.deepEqual(memberIds(shuffled[0]), ["c", "b", "a"]);
});

test("a lone ordinary message retains its original row, id, timestamp and read state", () => {
  for (const is_read of [false, true]) {
    const notification = chat(1, { id: "only", is_read });
    const [unit] = groupNotificationFeed([notification]);
    assert.equal(unit.kind, "single");
    assert.equal(unit.notification, notification);
    assert.equal(unit.id, notification.id);
    assert.equal(unit.created_at, notification.created_at);
    assert.equal("members" in unit, false);
  }
});

test("a second realtime message promotes a single and a reduced feed demotes it again", () => {
  const older = chat(1, { id: "older" });
  const newer = chat(2, { id: "newer" });
  assert.equal(groupNotificationFeed([older])[0].kind, "single");
  const [group] = groupNotificationFeed([older, newer]);
  assert.equal(group.kind, "message-group");
  assert.deepEqual(memberIds(group), ["newer", "older"]);

  // The same normalization applies to a filtered input and to the latest-50
  // window after its oldest message has fallen out.
  const filtered = [older, newer].filter(notification => notification.id === "newer");
  const [remaining] = groupNotificationFeed(filtered);
  assert.equal(remaining.kind, "single");
  assert.equal(remaining.notification, newer);

  const otherRows = Array.from({ length: 49 }, (_, index) =>
    row({ at: at((index + 3) * MINUTE), id: `system-${index}`, type: "system" }),
  );
  const latest50 = sortNotificationsNewestFirst([older, newer, ...otherRows]).slice(0, 50);
  const units = groupNotificationFeed(latest50);
  assert.equal(units.length, 50);
  assert.ok(units.every(unit => unit.kind === "single"));
  assert.equal(units.at(-1).notification, newer);
  assert.deepEqual(singleIds(units), latest50.map(notification => notification.id));
});

test("empty input produces no units", () => {
  assert.equal(groupNotificationFeed([]).length, 0);
});

test("group copy spells out the sender, count, latest preview and unread state", () => {
  assert.equal(formatMessageGroupCount(6), "Sent you 6 messages");
  assert.equal(formatMessageGroupCount(1), "Sent you 1 message");

  assert.equal(
    composeNotificationGroupLabel({
      senderName: "MAHARTT Navales",
      count: 6,
      latest: "raymo",
      isUnread: true,
    }),
    "MAHARTT Navales, Sent you 6 messages, Latest: raymo, unread",
  );
  assert.equal(
    composeNotificationGroupLabel({ senderName: "MAHARTT Navales", count: 2, latest: null, isUnread: false }),
    "MAHARTT Navales, Sent you 2 messages",
  );
  assert.equal(MESSAGE_GROUP_WINDOW_MS, 15 * MINUTE);
});
