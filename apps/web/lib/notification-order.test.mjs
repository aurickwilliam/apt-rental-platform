import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  compareNotificationsNewestFirst,
  groupNotificationsByLocalDate,
  sortNotificationsNewestFirst,
} from "../../../packages/utils/src/notificationOrder.ts";
import { getLocalCalendarDay, subscribeLocalCalendarDay } from "./notification-calendar.ts";

const now = new Date(2026, 9, 18, 12);
const row = (id, day, hour = 10, is_read = false) => ({
  id,
  created_at: new Date(2026, 9, day, hour).toISOString(),
  is_read,
});
const ids = rows => rows.map(n => n.id);

test("Today precedes Yesterday even when the input arrives oldest-first", () => {
  const groups = groupNotificationsByLocalDate([row("yesterday", 17), row("today", 18)], now);
  assert.deepEqual(groups.map(g => g.label), ["Today", "Yesterday"]);
});

test("items and multiple older date groups are newest-first without mutating input", () => {
  const input = [row("oldest", 2), row("morning", 17, 8), row("today", 18), row("older", 10), row("evening", 17, 20)];
  const before = [...input];
  const groups = groupNotificationsByLocalDate(input, now);
  assert.deepEqual(groups.map(g => ids(g.items)), [["today"], ["evening", "morning"], ["older"], ["oldest"]]);
  assert.deepEqual(input, before);
  assert.ok(groups.every((g, i) => i === 0 || groups[i - 1].dayStart > g.dayStart));
});

test("equal timestamps use id ASC regardless of input order or read state", () => {
  const input = [row("c", 18), row("a", 18, 10, true), row("b", 18)];
  assert.deepEqual(ids(sortNotificationsNewestFirst(input)), ["a", "b", "c"]);
  assert.deepEqual(ids(sortNotificationsNewestFirst([...input].reverse())), ["a", "b", "c"]);
  assert.equal(compareNotificationsNewestFirst(input[0], input[0]), 0);
});

test("PostgreSQL microseconds and equivalent timezone offsets retain query order", () => {
  const input = [
    { id: "a", created_at: "2026-10-18T01:00:00.123001Z" },
    { id: "z", created_at: "2026-10-18T01:00:00.123002Z" },
    { id: "b", created_at: "2026-10-18T09:00:00.123001+08:00" },
  ];
  assert.deepEqual(ids(sortNotificationsNewestFirst(input)), ["z", "a", "b"]);
});

test("All and Unread retain the same chronological subsequence", () => {
  const input = [row("old-unread", 10), row("read", 18, 8, true), row("new-unread", 18, 12), row("yesterday", 17)];
  const all = groupNotificationsByLocalDate(input, now).flatMap(g => g.items);
  const unread = groupNotificationsByLocalDate(input.filter(n => !n.is_read), now).flatMap(g => g.items);
  assert.deepEqual(ids(unread), ids(all.filter(n => !n.is_read)));
  assert.deepEqual(ids(unread), ["new-unread", "yesterday", "old-unread"]);
});

test("a Realtime refetch can add new and delayed rows at any input position", () => {
  const before = [row("yesterday", 17), row("morning", 18, 8)];
  const after = [...before, row("newest", 18, 13), row("delayed", 16)];
  assert.deepEqual(groupNotificationsByLocalDate(after, now).map(g => ids(g.items)), [
    ["newest", "morning"], ["yesterday"], ["delayed"],
  ]);
});

test("marking one or all notifications read never changes their relative order", () => {
  const input = [row("b", 18), row("older", 17), row("a", 18)];
  const order = ids(sortNotificationsNewestFirst(input));
  assert.deepEqual(ids(sortNotificationsNewestFirst(input.map(n => ({ ...n, is_read: n.id === "a" })))), order);
  assert.deepEqual(ids(sortNotificationsNewestFirst(input.map(n => ({ ...n, is_read: true })))), order);
});

test("local midnight and year boundaries re-label groups by calendar date", () => {
  const before = new Date(2026, 11, 31, 23, 59, 59);
  const after = new Date(2027, 0, 1, 0, 0, 1);
  const input = [
    { id: "before", created_at: before.toISOString() },
    { id: "after", created_at: after.toISOString() },
  ];
  assert.deepEqual(groupNotificationsByLocalDate(input, after).map(g => g.label), ["Today", "Yesterday"]);
  assert.equal(groupNotificationsByLocalDate([input[0]], before)[0].label, "Today");
  assert.equal(groupNotificationsByLocalDate([input[0]], after)[0].label, "Yesterday");
});

test("local calendar labels work east/west of UTC and through DST changes", () => {
  const moduleUrl = new URL("../../../packages/utils/src/notificationOrder.ts", import.meta.url).href;
  for (const TZ of ["Asia/Manila", "America/Los_Angeles", "America/New_York", "UTC"]) {
    execFileSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", `
      import assert from 'node:assert/strict';
      import { groupNotificationsByLocalDate } from ${JSON.stringify(moduleUrl)};
      for (const now of [new Date(2026, 9, 18, 0, 0, 1), new Date(2026, 2, 9, 0, 0, 1), new Date(2026, 10, 2, 0, 0, 1)]) {
        const today = new Date(now); today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        const input = [
          { id: 'last-second', created_at: new Date(today.getTime() - 1).toISOString() },
          { id: 'midnight', created_at: today.toISOString() },
          { id: 'yesterday-start', created_at: yesterday.toISOString() },
        ];
        const groups = groupNotificationsByLocalDate(input, now);
        assert.deepEqual(groups.map(g => g.label), ['Today', 'Yesterday']);
        assert.deepEqual(groups.map(g => g.items.map(n => n.id)), [['midnight'], ['last-second', 'yesterday-start']]);
      }
    `], { env: { ...process.env, TZ }, stdio: "pipe" });
  }
});

test("an open drawer refreshes labels at midnight, on resume, and cleans up its timer", t => {
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: new Date(2026, 9, 18, 23, 59, 59).getTime() });
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  globalThis.window = new EventTarget();
  globalThis.document = new EventTarget();
  let unsubscribe;
  t.after(() => {
    unsubscribe?.();
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
    if (originalDocument === undefined) delete globalThis.document; else globalThis.document = originalDocument;
    t.mock.timers.reset();
  });
  let changes = 0;
  const before = getLocalCalendarDay();
  unsubscribe = subscribeLocalCalendarDay(() => changes++);
  t.mock.timers.tick(1000);
  assert.equal(changes, 1);
  assert.ok(getLocalCalendarDay() > before);
  window.dispatchEvent(new Event("focus"));
  document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(changes, 3);
  unsubscribe();
  t.mock.timers.tick(24 * 60 * 60 * 1000);
  window.dispatchEvent(new Event("focus"));
  assert.equal(changes, 3);
});
