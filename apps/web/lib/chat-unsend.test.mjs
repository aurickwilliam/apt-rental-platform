import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// unsend.ts imports app modules by extensionless paths, so load it the way the
// component tests do: transpile, then stub its two local imports.
function loadUnsend() {
  const source = readFileSync(new URL("../app/components/chat/unsend.ts", import.meta.url), "utf8");
  const exports = {};
  const dependencies = {
    "./attachments": { CHAT_IMAGES_BUCKET: "chat-images" },
    "./conversationEvents": { isOptimisticMessage: (m) => m.isPending === true || m.id.startsWith("temp-") },
  };
  vm.runInNewContext(
    ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, require: (name) => dependencies[name], console: { warn: () => {} } },
  );
  return exports;
}

const unsend = loadUnsend();
// Values built inside the VM come from another realm; compare plain copies.
const plain = (value) => JSON.parse(JSON.stringify(value));

test("mobile conversation key matches mobile's buildConversationKey format", () => {
  assert.equal(unsend.mobileConversationKey("u-b", "u-a", "apt-1"), "chat:apt-1:u-a:u-b");
  assert.equal(unsend.mobileConversationKey("u-a", "u-b", null), "chat:none:u-a:u-b");
});

test("only your own saved messages can be unsent", () => {
  assert.equal(unsend.canUnsendMessage({ id: "m1", sender_id: "me" }, "me"), true);
  assert.equal(unsend.canUnsendMessage({ id: "m1", sender_id: "them" }, "me"), false);
  assert.equal(unsend.canUnsendMessage({ id: "temp-1", sender_id: "me" }, "me"), false);
  assert.equal(unsend.canUnsendMessage({ id: "m2", sender_id: "me", isPending: true }, "me"), false);
});

function fakeSupabase({ deleted = [{ id: "m1" }], deleteError = null } = {}) {
  const calls = [];
  const chain = {
    delete() { calls.push(["delete"]); return chain; },
    eq(column, value) { calls.push(["eq", column, value]); return chain; },
    select(columns) { calls.push(["select", columns]); return Promise.resolve({ data: deleted, error: deleteError }); },
  };
  return {
    calls,
    storage: { from: (bucket) => ({ remove: async (paths) => { calls.push(["remove", bucket, paths]); return { error: null }; } }) },
    from: (table) => { calls.push(["from", table]); return chain; },
  };
}

test("deleteChatMessage removes files first, then the sender-scoped row", async () => {
  const supabase = fakeSupabase();
  await unsend.deleteChatMessage(supabase, {
    message: { id: "m1", attachment_path: "a/photo.jpg", attachment_thumbnail_path: "a/thumb.jpg" },
    senderId: "me",
  });
  assert.deepEqual(plain(supabase.calls), [
    ["remove", "chat-images", ["a/photo.jpg", "a/thumb.jpg"]],
    ["from", "chat"], ["delete"], ["eq", "id", "m1"], ["eq", "sender_id", "me"], ["select", "id"],
  ]);
});

test("deleteChatMessage skips storage for text and fails when no row was deleted", async () => {
  const supabase = fakeSupabase({ deleted: [] });
  await assert.rejects(unsend.deleteChatMessage(supabase, { message: { id: "m1" }, senderId: "me" }), /could not be unsent/);
  assert.equal(supabase.calls.some(([kind]) => kind === "remove"), false);
});

test("the unsend broadcast reaches mobile's chat topic and always releases the channel", async () => {
  const sent = [];
  const removed = [];
  const supabase = {
    channel: (topic) => ({ topic, httpSend: async (event, payload) => { sent.push({ topic, event, payload }); return { success: true }; } }),
    removeChannel: async (channel) => { removed.push(channel.topic); },
  };
  await unsend.broadcastMessageDeleted(supabase, { messageId: "m1", senderId: "u-b", receiverId: "u-a", apartmentId: "apt-1" });
  assert.deepEqual(plain(sent), [{ topic: "chat:msg:chat:apt-1:u-a:u-b", event: "message_deleted", payload: { id: "m1", apartment_id: "apt-1" } }]);
  assert.deepEqual(removed, ["chat:msg:chat:apt-1:u-a:u-b"]);
});
