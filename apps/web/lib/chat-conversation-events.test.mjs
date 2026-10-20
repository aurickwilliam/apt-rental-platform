import assert from "node:assert/strict";
import test from "node:test";

import {
  applyReadReceipt,
  compareChatMessages,
  isOptimisticMessage,
  mergeIncomingMessage,
  reconcileMessages,
} from "../app/components/chat/conversationEvents.ts";

const message = (id, created_at, extra = {}) => ({
  id,
  sender_id: "user-b",
  receiver_id: "user-a",
  message: "hello",
  message_type: "text",
  is_read: false,
  read_at: null,
  apartment_id: null,
  created_at,
  updated_at: created_at,
  reactions: [],
  ...extra,
});

test("incoming events dedupe by id and keep chronological order", () => {
  const newer = message("m2", "2026-01-01T10:00:02.000Z");
  const older = message("m1", "2026-01-01T10:00:00.000Z");
  const middle = message("m3", "2026-01-01T10:00:01.000Z");

  let rows = mergeIncomingMessage([], newer);
  rows = mergeIncomingMessage(rows, older);
  rows = mergeIncomingMessage(rows, middle);
  assert.deepEqual(rows.map((row) => row.id), ["m1", "m3", "m2"]);

  // A redelivery is a no-op that keeps the same array, so nothing re-renders.
  assert.equal(mergeIncomingMessage(rows, { ...older }), rows);
});

test("ties break by id and optimistic rows stay pinned to the bottom", () => {
  const a = message("aaa", "2026-01-01T10:00:00.000Z");
  const b = message("bbb", "2026-01-01T10:00:00.000Z");
  assert.deepEqual(mergeIncomingMessage([b], a).map((row) => row.id), ["aaa", "bbb"]);

  // The pending bubble's client timestamp is earlier than the incoming row's;
  // it must still render last because it isn't on the server yet.
  const pending = message("temp-1", "2025-12-31T23:59:00.000Z", { isPending: true });
  const incoming = message("m9", "2026-01-01T10:00:05.000Z");
  assert.deepEqual(mergeIncomingMessage([pending], incoming).map((row) => row.id), [
    "m9",
    "temp-1",
  ]);

  assert.equal(isOptimisticMessage(pending), true);
  assert.equal(isOptimisticMessage(message("temp-2", "2026-01-01T10:00:00.000Z")), true);
  assert.equal(isOptimisticMessage(a), false);
});

test("realtime payloads without the joined reactions field still render", () => {
  const raw = message("m10", "2026-01-01T10:00:00.000Z");
  delete raw.reactions;
  const [merged] = mergeIncomingMessage([], raw);
  assert.ok(Array.isArray(merged.reactions));
  assert.deepEqual(merged.reactions, []);
});

test("a stale refresh keeps newer arrivals, history and pending sends", () => {
  const history = message("m0", "2026-01-01T09:59:00.000Z");
  const fetched = message("m1", "2026-01-01T10:00:00.000Z");
  // Arrived over Realtime while the refresh read was in flight.
  const arrival = message("m3", "2026-01-01T10:00:09.000Z");
  const pending = message("temp-1", "2026-01-01T10:00:10.000Z", { isPending: true });

  const merged = reconcileMessages([history, fetched, arrival, pending], [
    fetched,
    message("m2", "2026-01-01T10:00:05.000Z"),
  ]);

  assert.deepEqual(merged.map((row) => row.id), ["m0", "m1", "m2", "m3", "temp-1"]);
  // Fetched rows win for the ids they contain.
  assert.equal(merged.find((row) => row.id === "m1"), fetched);
});

test("reconciling an unchanged list keeps the array identity", () => {
  const one = message("m1", "2026-01-01T10:00:00.000Z");
  const two = message("m2", "2026-01-01T10:00:01.000Z");
  const rows = [one, two];
  assert.equal(reconcileMessages(rows, [one, two]), rows);
});

test("read receipts patch sent messages without clobbering unknown rows", () => {
  const sent = message("m1", "2026-01-01T10:00:00.000Z", {
    sender_id: "user-a",
    receiver_id: "user-b",
  });
  const rows = [sent];

  const patched = applyReadReceipt(rows, {
    id: "m1",
    is_read: true,
    read_at: "2026-01-01T10:01:00.000Z",
  });
  assert.notEqual(patched, rows);
  assert.equal(patched[0].is_read, true);
  assert.equal(patched[0].read_at, "2026-01-01T10:01:00.000Z");

  // Repeating the same receipt changes nothing.
  assert.equal(
    applyReadReceipt(patched, {
      id: "m1",
      is_read: true,
      read_at: "2026-01-01T10:01:00.000Z",
    }),
    patched
  );
  // A receipt for a row that is no longer held is ignored.
  assert.equal(applyReadReceipt(rows, { id: "gone", is_read: true, read_at: null }), rows);
  // A receipt without a timestamp keeps whatever is stored.
  assert.equal(
    applyReadReceipt(rows, { id: "m1", is_read: true, read_at: null })[0].read_at,
    null
  );
});

test("the comparator is total and deterministic", () => {
  const a = message("a", "2026-01-01T10:00:00.000Z");
  assert.equal(compareChatMessages(a, a), 0);
  assert.ok(compareChatMessages(a, message("b", "2026-01-01T10:00:00.000Z")) < 0);
  assert.ok(compareChatMessages(a, message("a", "2026-01-01T10:00:01.000Z")) < 0);
});
