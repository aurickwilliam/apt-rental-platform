import assert from "node:assert/strict";
import test from "node:test";
import {
  isViewingConversation,
  markConversationNotificationsReadWith,
  matchesConversation,
  normalizeApartmentId,
  retryBounded,
  unreadIdsForConversation,
} from "./conversation-notification-sync.ts";
import { NotificationFeedStore } from "./notification-feed-store.ts";

const CASE = "user-case";
const OTHER = "user-other";
const APT = "apt-1";

const note = (id, senderId, apartmentId, created_at, extra = {}) => ({
  id,
  user_id: "me",
  type: "message",
  is_read: false,
  created_at,
  data: { screen: "chat", senderId, apartmentId },
  ...extra,
});

/** A recording fake of the Supabase update chain, applying the filters to rows. */
function fakeSource(rows, { fail = false } = {}) {
  const calls = [];
  return {
    calls,
    from(table) {
      assert.equal(table, "notifications");
      return {
        update(values) {
          const filters = [];
          const q = {
            eq: (c, v) => (filters.push(["eq", c, v]), q),
            is: (c, v) => (filters.push(["is", c, v]), q),
            lte: (c, v) => (filters.push(["lte", c, v]), q),
            select: async () => {
              calls.push({ values, filters });
              if (fail) return { data: null, error: new Error("denied") };
              const hit = rows.filter((row) => filters.every(([op, col, val]) => {
                const get = (path) => {
                  if (path === "data->>senderId") return row.data.senderId ?? null;
                  if (path === "data->>apartmentId") return row.data.apartmentId ?? null;
                  return row[path];
                };
                if (op === "eq") return get(col) === val;
                if (op === "is") return get(col) === val;
                return Date.parse(get(col)) <= Date.parse(val);
              }));
              for (const row of hit) row.is_read = true;
              return { data: hit.map((row) => ({ id: row.id })), error: null };
            },
          };
          return q;
        },
      };
    },
  };
}

const identity = { contactId: CASE, apartmentId: APT };

test("a thread's notifications are matched by structured identity only", () => {
  assert.equal(matchesConversation(note("a", CASE, APT, "2026-11-07T10:00:00Z"), identity), true);
  assert.equal(matchesConversation(note("b", OTHER, APT, "2026-11-07T10:00:00Z"), identity), false, "other sender");
  assert.equal(matchesConversation(note("c", CASE, "apt-2", "2026-11-07T10:00:00Z"), identity), false, "other listing");
  assert.equal(matchesConversation(note("d", CASE, null, "2026-11-07T10:00:00Z"), identity), false, "inquiry is its own thread");
  assert.equal(matchesConversation({ type: "payment", data: { senderId: CASE, apartmentId: APT } }, identity), false);
  // Sender names and previews never matter; older rows without a sender id are never guessed.
  assert.equal(matchesConversation({ type: "message", title: "Case Oh", data: { screen: "chat" } }, identity), false);
  assert.equal(matchesConversation({ type: "message", data: null }, identity), false);
});

test("a missing listing and the 'none' key part are the same inquiry thread", () => {
  const inquiry = { contactId: CASE, apartmentId: null };
  assert.equal(normalizeApartmentId("none"), null);
  assert.equal(matchesConversation(note("a", CASE, null, "2026-11-07T10:00:00Z"), inquiry), true);
  assert.equal(matchesConversation(note("b", CASE, undefined, "2026-11-07T10:00:00Z"), inquiry), true);
  assert.equal(matchesConversation(note("c", CASE, APT, "2026-11-07T10:00:00Z"), inquiry), false);
});

test("unread ids stop at the cutoff and skip read rows", () => {
  const rows = [
    note("old", CASE, APT, "2026-11-07T10:00:00Z"),
    note("cut", CASE, APT, "2026-11-07T10:05:00Z"),
    note("later", CASE, APT, "2026-11-07T10:06:00Z"),
    note("read", CASE, APT, "2026-11-07T10:01:00Z", { is_read: true }),
    note("other", OTHER, APT, "2026-11-07T10:00:00Z"),
  ];
  assert.deepEqual(unreadIdsForConversation(rows, identity, "2026-11-07T10:05:00Z"), ["old", "cut"]);
  assert.deepEqual(unreadIdsForConversation(rows, identity, "not a date"), []);
});

test("the database update is recipient-scoped, structured, cut off and update-only", async () => {
  const rows = [
    note("a", CASE, APT, "2026-11-07T10:00:00Z"),
    note("b", CASE, APT, "2026-11-07T10:05:00Z"),
    note("after", CASE, APT, "2026-11-07T10:06:00Z"),
    note("elsewhere", CASE, "apt-2", "2026-11-07T10:00:00Z"),
    note("someone", OTHER, APT, "2026-11-07T10:00:00Z"),
  ];
  const source = fakeSource(rows);
  const changed = await markConversationNotificationsReadWith(source, {
    userId: "me", identity, upTo: "2026-11-07T10:05:00Z", now: () => new Date("2026-11-07T11:00:00Z"),
  });
  assert.deepEqual(changed, ["a", "b"]);
  assert.deepEqual(rows.filter((r) => r.is_read).map((r) => r.id), ["a", "b"]);
  const { values, filters } = source.calls[0];
  assert.deepEqual(values, { is_read: true, read_at: "2026-11-07T11:00:00.000Z" }, "only read state is written");
  assert.deepEqual(filters.find(([, c]) => c === "user_id"), ["eq", "user_id", "me"]);
  assert.deepEqual(filters.find(([, c]) => c === "type"), ["eq", "type", "message"]);

  // Idempotent reopen: nothing left to change, no error.
  assert.deepEqual(
    await markConversationNotificationsReadWith(source, { userId: "me", identity, upTo: "2026-11-07T10:05:00Z" }),
    [],
  );
});

test("an inquiry thread filters on a missing listing, not on all listings", async () => {
  const rows = [
    note("inq", CASE, null, "2026-11-07T10:00:00Z"),
    note("apt", CASE, APT, "2026-11-07T10:00:00Z"),
  ];
  const changed = await markConversationNotificationsReadWith(fakeSource(rows), {
    userId: "me", identity: { contactId: CASE, apartmentId: null }, upTo: "2026-11-07T12:00:00Z",
  });
  assert.deepEqual(changed, ["inq"]);
});

test("a refused update throws so callers can retry", async () => {
  await assert.rejects(
    markConversationNotificationsReadWith(fakeSource([], { fail: true }), { userId: "me", identity, upTo: "2026-11-07T10:00:00Z" }),
    /denied/,
  );
});

test("retry is bounded, recovers, and stops when cancelled", async () => {
  const waits = [];
  const sleep = async (ms) => { waits.push(ms); };
  let attempts = 0;
  const flaky = async () => { attempts += 1; if (attempts < 3) throw new Error("offline"); };
  assert.equal(await retryBounded(flaky, { delays: [10, 20], sleep }), true);
  assert.deepEqual(waits, [10, 20]);

  attempts = 0;
  const always = async () => { attempts += 1; throw new Error("offline"); };
  assert.equal(await retryBounded(always, { delays: [10, 20], sleep }), false);
  assert.equal(attempts, 3, "never more than delays + 1 tries");

  attempts = 0;
  assert.equal(await retryBounded(always, { delays: [10, 20], sleep, isCancelled: () => true }), false);
  assert.equal(attempts, 0);
});

test("a hidden tab does not count as viewing", () => {
  assert.equal(isViewingConversation("hidden"), false);
  assert.equal(isViewingConversation("visible"), true);
});

// ── Feed store integration: badge and panel follow the persisted write ──────

const fixtureStore = (rows) => {
  let event;
  let current = rows.map((r) => ({ ...r }));
  const store = new NotificationFeedStore({
    load: async () => current.map((r) => ({ ...r })),
    connect: (onChange) => { event = onChange; return () => {}; },
    onIdle: () => {},
    onError: () => {},
  });
  return { store, event: () => event(), persist: (ids) => { current = current.map((r) => ids.includes(r.id) ? { ...r, is_read: true } : r); } };
};
const unread = (store) => store.getSnapshot().notifications.filter((n) => !n.is_read).map((n) => n.id);

test("opening a conversation clears only its notifications from the badge, and stays cleared after a refetch", async () => {
  const rows = [
    note("case-1", CASE, APT, "2026-11-07T10:00:00Z"),
    note("case-2", CASE, APT, "2026-11-07T10:05:00Z"),
    note("other-1", OTHER, APT, "2026-11-07T10:02:00Z"),
    note("case-newer", CASE, APT, "2026-11-07T10:09:00Z"),
  ];
  const f = fixtureStore(rows);
  const detach = f.store.subscribe(() => {});
  await f.store.refresh();
  assert.equal(unread(f.store).length, 4);

  const ids = unreadIdsForConversation(f.store.getSnapshot().notifications, identity, "2026-11-07T10:05:00Z");
  const ok = await f.store.markRead(ids, async () => f.persist(ids));
  assert.equal(ok, true);
  assert.deepEqual(unread(f.store), ["other-1", "case-newer"], "other threads and later messages keep their dots");

  // Duplicate Realtime events and reopen never inflate or revive the badge.
  f.event(); f.event();
  await f.store.refresh();
  assert.deepEqual(unread(f.store), ["other-1", "case-newer"]);
  assert.equal(await f.store.markRead([], async () => {}), false, "nothing to do is not a success");
  detach();
});

test("a failed write rolls the badge back and reports failure for the retry", async () => {
  const f = fixtureStore([note("a", CASE, APT, "2026-11-07T10:00:00Z")]);
  const detach = f.store.subscribe(() => {});
  await f.store.refresh();
  const ok = await f.store.markRead(["a"], async () => { throw new Error("offline"); });
  assert.equal(ok, false);
  await f.store.refresh();
  assert.deepEqual(unread(f.store), ["a"], "still unread, so the retry or next open can finish the job");
  const retried = await f.store.markRead(["a"], async () => f.persist(["a"]));
  assert.equal(retried, true);
  assert.deepEqual(unread(f.store), []);
  detach();
});

test("a stale response begun before the write cannot bring the dot back", async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  let slow = true;
  const store = new NotificationFeedStore({
    load: async () => { const rows = [note("a", CASE, APT, "2026-11-07T10:00:00Z")]; if (slow) { slow = false; await gate; } return rows; },
    connect: () => () => {},
    onIdle: () => {},
    onError: () => {},
  });
  const detach = store.subscribe(() => {});
  await new Promise((r) => setImmediate(r));
  await store.markRead(["a"], async () => {});
  release();
  await store.refresh();
  assert.deepEqual(store.getSnapshot().notifications.map((n) => n.is_read), [true]);
  detach();
});
