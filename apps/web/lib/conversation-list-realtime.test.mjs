import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { conversationPreview } from "./chat-message-presentation.ts";

// Runs the hook's effects against a fake Supabase channel and a fake toast.
function setup(overrides = {}) {
  const handlers = [];
  const toasts = [];
  const applied = [];
  let removed = 0;
  const contacts = {
    "u1:apt": { id: "u1", conversationKey: "u1:apt", name: "Ana Cruz" },
    "u2:apt": { id: "u2", conversationKey: "u2:apt", name: "Muted Mo", isMuted: true },
    "u3:apt": { id: "u3", conversationKey: "u3:apt", name: "Blocked Bo", blockedByMe: true },
  };
  const channel = {
    on(_type, filter, handler) { handlers.push({ filter, handler }); return channel; },
    subscribe() { return channel; },
  };
  const supabase = { channel: () => channel, removeChannel: () => { removed += 1; } };
  const cleanups = [];
  const react = {
    useMemo: (fn) => fn(),
    useRef: (initial) => ({ current: initial }),
    useEffect: (effect) => { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); },
  };
  const source = readFileSync(new URL("../app/components/chat/useConversationListRealtime.tsx", import.meta.url), "utf8");
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    {
      exports,
      require: (name) => ({
        react,
        "@heroui/react": { toast: (title, options) => toasts.push({ title, options }) },
        "@repo/supabase/browser": { createClient: () => supabase },
        "@/lib/chat-message-presentation": { conversationPreview },
        "@/app/components/profile/UserAvatar": { default: "UserAvatar" },
        "react/jsx-runtime": { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
      })[name],
    },
  );
  exports.default({
    currentUserId: "me",
    activeKey: null,
    findContact: (key) => contacts[key],
    applyLatestMessage: (key, latest, countAsUnread) => applied.push({ key, latest, countAsUnread }),
    refreshIfNewConversation: () => false,
    ...overrides,
  });
  const incoming = handlers.find((h) => h.filter.filter === "receiver_id=eq.me").handler;
  const outgoing = handlers.find((h) => h.filter.filter === "sender_id=eq.me").handler;
  return { incoming, outgoing, toasts, applied, removed: () => removed, cleanups };
}

const row = (extra = {}) => ({
  sender_id: "u1", receiver_id: "me", apartment_id: "apt", message: "hello", message_type: "text", created_at: "2026-10-24T09:00:00Z", ...extra,
});

test("a message received in a chat that is not open updates the row, counts unread and toasts", () => {
  const { incoming, applied, toasts } = setup();
  incoming({ new: row() });
  assert.deepEqual(applied.map((a) => [a.key, a.countAsUnread, a.latest.fromMe, a.latest.message]), [["u1:apt", true, false, "hello"]]);
  assert.equal(toasts.length, 1);
  // The name is the toast's title, in the primary colour; the sender's avatar replaces the info icon.
  assert.equal(toasts[0].title.props.children, "Ana Cruz");
  assert.match(toasts[0].title.props.className, /text-primary/);
  assert.equal(toasts[0].options.description, "hello");
  assert.equal(toasts[0].options.indicator.type, "UserAvatar");
  assert.equal(toasts[0].options.indicator.props.alt, "Ana Cruz");
  assert.equal(toasts[0].options.indicator.props.initials, "AC");
  assert.equal(toasts[0].options.actionProps, undefined, "no View button");
});

test("media messages toast with the mobile wording", () => {
  const { incoming, toasts } = setup();
  incoming({ new: row({ message: null, message_type: "image" }) });
  assert.equal(toasts[0].options.description, "Sent a photo");
});

test("the open conversation updates its row but neither counts unread nor toasts", () => {
  const { incoming, applied, toasts } = setup({ activeKey: "u1:apt" });
  incoming({ new: row() });
  assert.deepEqual(applied.map((a) => a.countAsUnread), [false]);
  assert.equal(toasts.length, 0);
});

test("muted and blocked chats update quietly", () => {
  const { incoming, applied, toasts } = setup();
  incoming({ new: row({ sender_id: "u2" }) });
  incoming({ new: row({ sender_id: "u3" }) });
  assert.deepEqual(applied.map((a) => a.countAsUnread), [true, true]);
  assert.equal(toasts.length, 0);
});

test("your own messages move the row (from any device) without unread or a toast", () => {
  const { outgoing, applied, toasts } = setup();
  outgoing({ new: row({ sender_id: "me", receiver_id: "u1", message: "on my way" }) });
  assert.deepEqual(applied.map((a) => [a.key, a.latest.fromMe, a.countAsUnread]), [["u1:apt", true, false]]);
  assert.equal(toasts.length, 0);
});

test("a conversation that is not listed yet reloads the lists instead", () => {
  const refreshed = [];
  const { incoming, applied } = setup({ refreshIfNewConversation: (key) => { refreshed.push(key); return true; } });
  incoming({ new: row({ sender_id: "stranger", apartment_id: null }) });
  assert.deepEqual(refreshed, ["stranger:none"]);
  assert.equal(applied.length, 0);
});

test("leaving the page removes the channel", () => {
  const { cleanups, removed } = setup();
  cleanups.forEach((cleanup) => cleanup());
  assert.equal(removed(), 1);
});
