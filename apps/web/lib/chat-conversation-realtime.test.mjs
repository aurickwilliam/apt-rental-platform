import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const events = compile("../app/components/chat/conversationEvents.ts", {});

/** Plain host-realm copy, so `deepEqual` never trips over vm prototypes. */
const plain = (value) => JSON.parse(JSON.stringify(value));
const flush = () => new Promise((resolve) => setImmediate(resolve));

function compile(file, modules, globals = {}) {
  const exports = {};
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2017,
        module: ts.ModuleKind.CommonJS,
      },
    }).outputText,
    { exports, require: (name) => modules[name] ?? { default: name }, ...globals }
  );
  return exports;
}

/** Message ids as a host-realm array (vm arrays fail `deepEqual` identity). */
const ids = (h) => Array.from(h.getMessages(), (row) => row.id);

function createHarness(overrides = {}) {
  const cells = [];
  const effects = [];
  const logs = [];
  const order = [];
  const removals = [];
  const created = [];
  const tracked = [];
  const updates = [];
  const channels = [];
  const reads = [];
  const refreshCalls = [];
  const documentListeners = new Map();
  const sends = [];
  let messages = [];
  let refreshImpl = async () => {};

  const react = {
    useCallback: (callback) => callback,
    useEffect: (effect) => {
      effects.push(effect);
    },
    useRef: (initial) => ({ current: initial }),
    useState: (initial) => {
      const cell = { value: initial };
      cells.push(cell);
      return [
        cell.value,
        (next) => {
          cell.value = typeof next === "function" ? next(cell.value) : next;
        },
      ];
    },
  };

  const makeChannel = (topic) => {
    const channel = {
      topic: `realtime:${topic}`,
      bindings: [],
      subscribeCallback: null,
      tornDown: false,
      removed: false,
      on(type, filter, callback) {
        channel.bindings.push({ type, filter, callback });
        return channel;
      },
      subscribe(callback) {
        channel.subscribeCallback = callback;
        return channel;
      },
      send(message) {
        sends.push(plain(message));
        return Promise.resolve("ok");
      },
      track(payload) {
        tracked.push(payload);
        return Promise.resolve("ok");
      },
      teardown() {
        channel.tornDown = true;
      },
    };
    return channel;
  };

  const supabase = {
    channel(topic, options) {
      const channel = makeChannel(topic);
      channel.options = options;
      channels.push(channel);
      created.push(channel);
      order.push("create");
      return channel;
    },
    getChannels: () => channels.filter((channel) => !channel.removed),
    removeChannel: async (channel) => {
      channel.removed = true;
      removals.push(channel);
      order.push("remove");
      return "ok";
    },
    from(table) {
      return {
        update(values) {
          const record = { table, values, eq: [] };
          updates.push(record);
          const chain = {
            eq: (column, value) => {
              record.eq.push([column, value]);
              return chain;
            },
          };
          return chain;
        },
      };
    },
  };

  const document = {
    visibilityState: "visible",
    addEventListener: (type, handler) => documentListeners.set(type, handler),
    removeEventListener: (type) => documentListeners.delete(type),
  };

  const hookModule = compile(
    "../app/components/chat/useConversationRealtime.ts",
    { react, "./conversationEvents": events },
    // The typing auto-clear uses the host (possibly timer-mocked) setTimeout.
    { document, setTimeout, clearTimeout, console: { error: (...parts) => logs.push(parts) } }
  );

  const hookResult = hookModule.default({
    supabase,
    conversationId: "user-a_user-b",
    currentUserId: "user-a",
    contactId: "user-b",
    conversationKey: "user-b|apt-1",
    apartmentId: "apt-1",
    setMessages: (next) => {
      messages = typeof next === "function" ? next(messages) : next;
    },
    refreshMessages: () => {
      refreshCalls.push(1);
      return refreshImpl();
    },
    onConversationRead: () => reads.push(1),
    ...overrides,
  });

  return {
    hookResult,
    cells,
    created,
    removals,
    tracked,
    sends,
    updates,
    logs,
    reads,
    channels,
    refreshCalls,
    documentListeners,
    order,
    run: () => effects.map((effect) => effect()).filter(Boolean),
    seed: (rows) => {
      messages = rows;
    },
    getMessages: () => messages,
    setRefresh: (impl) => {
      refreshImpl = impl;
    },
    setVisibility: (state) => {
      document.visibilityState = state;
    },
  };
}

const chatRow = (extra = {}) => ({
  id: "m1",
  sender_id: "user-b",
  receiver_id: "user-a",
  message: "hello",
  message_type: "text",
  is_read: false,
  read_at: null,
  apartment_id: "apt-1",
  created_at: "2026-01-01T10:00:00.000Z",
  updated_at: "2026-01-01T10:00:00.000Z",
  ...extra,
});

test("subscribes only to published chat tables with participant filters", async () => {
  const h = createHarness();
  h.run();
  await flush();

  assert.equal(h.created.length, 1);
  const [channel] = h.created;
  assert.equal(channel.topic, "realtime:conversation:user-a_user-b");
  // No presence config at all: typing moved off presence because its client
  // update limit (5 per 30 s) closed the whole channel mid-chat.
  assert.equal(channel.options, undefined);

  const postgres = channel.bindings.filter((b) => b.type === "postgres_changes");
  assert.deepEqual(
    postgres.map((b) => ({
      event: b.filter.event,
      table: b.filter.table,
      filter: b.filter.filter,
    })),
    [
      { event: "INSERT", table: "chat", filter: "sender_id=eq.user-b" },
      { event: "UPDATE", table: "chat", filter: "receiver_id=eq.user-b" },
      // Unsends: Postgres DELETE events can't be filtered; ids outside this
      // thread are ignored by `removeMessage`.
      { event: "DELETE", table: "chat", filter: undefined },
    ]
  );
  // Regression guard: `chat_reactions` is not in `supabase_realtime`, and
  // binding it silently disabled the whole channel.
  assert.equal(
    JSON.stringify(channel.bindings.map((b) => b.filter)).includes("chat_reactions"),
    false
  );
  // Typing arrives as Broadcast on the message channel; no presence binding
  // may come back — a single presence binding fails the whole join.
  assert.ok(channel.bindings.some((b) => b.type === "broadcast" && b.filter.event === "typing"));
  assert.equal(channel.bindings.some((b) => b.type === "presence"), false);
  assert.ok(channel.bindings.some((b) => b.type === "system"));
  assert.equal(typeof channel.subscribeCallback, "function");
});

test("incoming inserts merge once, mark read and clear the contact badge", async () => {
  const h = createHarness();
  h.run();
  await flush();
  const insert = h.created[0].bindings.find((b) => b.filter?.event === "INSERT");

  insert.callback({ new: chatRow() });
  assert.deepEqual(ids(h), ["m1"]);
  assert.equal(h.updates.length, 1);
  assert.deepEqual(h.updates[0].eq, [
    ["id", "m1"],
    ["receiver_id", "user-a"],
    ["is_read", false],
  ]);
  assert.equal(h.updates[0].values.is_read, true);
  assert.equal(typeof h.updates[0].values.read_at, "string");
  assert.equal(h.reads.length, 1);

  insert.callback({ new: chatRow() });
  assert.equal(h.getMessages().length, 1);

  // Wrong apartment context or receiver never lands in the thread.
  insert.callback({ new: chatRow({ id: "m2", apartment_id: "apt-2" }) });
  insert.callback({ new: chatRow({ id: "m3", receiver_id: "user-c" }) });
  assert.deepEqual(ids(h), ["m1"]);
});

test("read receipts patch the matching sent message and ignore strays", async () => {
  const h = createHarness();
  h.run();
  await flush();
  const update = h.created[0].bindings.find((b) => b.filter?.event === "UPDATE");

  const sent = chatRow({ sender_id: "user-a", receiver_id: "user-b" });
  h.seed([sent]);
  update.callback({
    new: { ...sent, is_read: true, read_at: "2026-01-01T10:05:00.000Z" },
  });
  assert.equal(h.getMessages()[0].is_read, true);
  assert.equal(h.getMessages()[0].read_at, "2026-01-01T10:05:00.000Z");

  const before = h.getMessages();
  update.callback({ new: { id: "unknown", is_read: true, read_at: null } });
  assert.equal(h.getMessages(), before);
});

test("unsend deletes from either side drop the message and ignore other threads", async () => {
  const h = createHarness();
  h.run();
  await flush();
  const remove = h.created[0].bindings.find((b) => b.filter?.event === "DELETE");

  h.seed([chatRow({ id: "m1" }), chatRow({ id: "m2", created_at: "2026-01-01T10:01:00.000Z" })]);
  remove.callback({ old: { id: "m1" } });
  assert.deepEqual(ids(h), ["m2"]);

  const before = h.getMessages();
  remove.callback({ old: { id: "elsewhere" } });
  remove.callback({ old: {} });
  assert.equal(h.getMessages(), before);
});

test("re-joins and refocus resync once, and hidden tabs stay quiet", async () => {
  const h = createHarness();
  h.run();
  await flush();
  const { subscribeCallback } = h.created[0];

  subscribeCallback("SUBSCRIBED");
  // Joining tracks no presence state — presence churn is what the client
  // rate limit punished.
  assert.equal(h.tracked.length, 0);
  assert.equal(h.refreshCalls.length, 0);

  subscribeCallback("SUBSCRIBED");
  assert.equal(h.refreshCalls.length, 1);
  await flush();

  let release;
  h.setRefresh(
    () =>
      new Promise((resolve) => {
        release = resolve;
      })
  );
  const visibility = h.documentListeners.get("visibilitychange");
  visibility();
  visibility();
  assert.equal(h.refreshCalls.length, 2);
  release();
  await flush();
  visibility();
  assert.equal(h.refreshCalls.length, 3);

  h.setVisibility("hidden");
  visibility();
  assert.equal(h.refreshCalls.length, 3);
});

test("channel errors and system subscription failures are logged", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const h = createHarness();
  h.run();
  await flush();
  const [channel] = h.created;

  // An open indicator must not outlive a channel failure.
  const typing = channel.bindings.find((b) => b.type === "broadcast");
  typing.callback({ payload: { userId: "user-b", isTyping: true } });
  assert.equal(h.cells[0].value, true);

  channel.subscribeCallback("CHANNEL_ERROR", new Error("boom"));
  channel.subscribeCallback("TIMED_OUT");
  channel.bindings
    .find((b) => b.type === "system")
    .callback({ status: "error", message: "replication unavailable" });

  assert.equal(h.cells[0].value, false);

  const logged = JSON.stringify(h.logs);
  assert.match(logged, /CHANNEL_ERROR/);
  assert.match(logged, /TIMED_OUT/);
  assert.match(logged, /replication unavailable/);
});

test("cleanup removes the channel, the listener and the typing publisher", async () => {
  const h = createHarness();
  const cleanups = h.run();
  await flush();
  const [channel] = h.created;

  await h.hookResult.broadcastTyping(true);
  assert.deepEqual(h.sends, [
    {
      type: "broadcast",
      event: "typing",
      payload: { userId: "user-a", isTyping: true },
    },
  ]);

  for (const cleanup of cleanups) cleanup();
  assert.ok(h.removals.includes(channel));
  assert.equal(h.documentListeners.has("visibilitychange"), false);

  // After cleanup there is no channel to publish through — a no-op, not an error.
  await h.hookResult.broadcastTyping(false);
  assert.equal(h.sends.length, 1);
});

test("a leftover channel for the same topic is closed before resubscribing", async () => {
  const h = createHarness();
  const leftover = {
    topic: "realtime:conversation:user-a_user-b",
    removed: false,
    tornDown: false,
    teardown() {
      leftover.tornDown = true;
    },
  };
  h.channels.push(leftover);
  h.run();
  await flush();

  assert.deepEqual(h.order, ["remove", "create"]);
  assert.equal(leftover.removed, true);
  assert.equal(leftover.tornDown, true);
  assert.equal(h.created.length, 1);
  assert.notEqual(h.created[0], leftover);
});

test("an empty conversation never subscribes", async () => {
  const h = createHarness({ conversationId: null, contactId: null });
  h.run();
  await flush();

  assert.equal(h.created.length, 0);
  assert.equal(h.documentListeners.has("visibilitychange"), false);
});

test("typing Broadcasts from the contact drive the indicator; everything else is filtered", async (t) => {
  // Mocked so typing's auto-clear timer never leaks into the event loop.
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const h = createHarness();
  h.run();
  await flush();
  const typing = h.created[0].bindings.find((b) => b.type === "broadcast");

  typing.callback({ payload: { userId: "user-b", isTyping: true } });
  assert.equal(h.cells[0].value, true);

  // Anyone who is not the active contact is ignored — stops included — and a
  // malformed or missing payload is swallowed instead of crashing.
  typing.callback({ payload: { userId: "user-a", isTyping: true } });
  typing.callback({ payload: { userId: "user-c", isTyping: false } });
  typing.callback(undefined);
  typing.callback({});
  assert.equal(h.cells[0].value, true);

  // Stopping clears the indicator and disarms the auto-clear.
  typing.callback({ payload: { userId: "user-b", isTyping: false } });
  assert.equal(h.cells[0].value, false);

  // The stale auto-clear of the earlier "true" never comes back on.
  t.mock.timers.tick(5000);
  assert.equal(h.cells[0].value, false);
});

test("a lost stop Broadcast auto-clears typing after the freshness window", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const h = createHarness();
  h.run();
  await flush();
  const typing = h.created[0].bindings.find((b) => b.type === "broadcast");

  typing.callback({ payload: { userId: "user-b", isTyping: true } });
  assert.equal(h.cells[0].value, true);

  t.mock.timers.tick(5000);
  assert.equal(h.cells[0].value, false);
});
