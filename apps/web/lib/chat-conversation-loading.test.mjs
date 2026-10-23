import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const flush = () => new Promise((resolve) => setImmediate(resolve));
const plain = (value) => JSON.parse(JSON.stringify(value));
const deferred = () => { let resolve; const promise = new Promise((yes) => { resolve = yes; }); return { promise, resolve }; };
function compile(file, modules, expose = "") {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS },
  }).outputText + expose, { exports, require: (name) => {
    assert.ok(name in modules, `Unexpected dependency: ${name}`);
    return modules[name];
  }, console });
  return exports;
}
const reactions = compile("../app/components/chat/chatReactions.ts", {});
const attachments = compile("../app/components/chat/attachments.ts", { "@repo/utils": { CHAT_DOCUMENT_MIME_TYPES: {} } });

function harness(rows) {
  const gates = { page: deferred(), reactions: deferred(), replies: deferred(), signing: deferred() };
  const started = [];
  const queries = [];
  const client = {
    from(table) {
      const record = { table, filters: [], orders: [] };
      queries.push(record);
      const query = {
        select: (fields) => { record.fields = fields; return query; },
        or: (filter) => { record.filters.push(["or", filter]); return query; },
        eq: (key, value) => { record.filters.push([key, value]); return query; },
        is: (key, value) => { record.filters.push([key, value]); return query; },
        order: (key, options) => { record.orders.push([key, options]); return query; },
        limit: (value) => { record.limit = value; return query; },
        abortSignal: () => query,
        in: (key, values) => { record.filters.push([key, Array.from(values)]); return query; },
        then: (yes, no) => {
          const kind = table === "chat_reactions" ? "reactions" : record.fields === "*" ? "page" : "replies";
          started.push(kind);
          return gates[kind].promise.then(yes, no);
        },
      };
      return query;
    },
    storage: { from: (bucket) => ({ createSignedUrls: (paths, ttl) => {
      assert.equal(bucket, "chat-images");
      assert.equal(ttl, 3600);
      started.push("signing");
      return gates.signing.promise;
    } }) },
  };
  const conversationModule = compile("../app/components/chat/useConversation.ts", {
    react: {}, "@repo/supabase/browser": {}, "./chatReactions": reactions,
    "./conversationEvents": {}, "./unsend": {}, "./attachments": attachments,
  }, "\nexports.loadConversation = loadConversation;");
  gates.page.resolve({ data: rows, error: null });
  return { gates, started, queries, load: (apartmentId = "apt-a", cursor, signal) => conversationModule.loadConversation(client, "user-a", "user-b", apartmentId, cursor, signal) };
}
const message = (id, extra = {}) => ({ id, sender_id: "user-b", receiver_id: "user-a", message: id, message_type: "text", created_at: `2026-10-01T00:00:0${id === "m2" ? 2 : 1}Z`, ...extra });

test("chat starts reactions, replies and secure signing concurrently, then publishes complete chronological rows once", async () => {
  const h = harness([
    message("m2", { reply_to: "original", attachment_path: "user-a/photo", attachment_thumbnail_path: "user-a/thumb" }),
    message("m1", { reply_to: "original" }),
  ]);
  let settled = false;
  const pending = h.load().then((rows) => { settled = true; return rows; });
  await flush();
  assert.deepEqual(new Set(h.started), new Set(["page", "reactions", "replies", "signing"]));
  assert.equal(settled, false);
  h.gates.reactions.resolve({ data: [{ message_id: "m2", user_id: "user-a", emoji: "👍" }] });
  h.gates.replies.resolve({ data: [{ id: "original", message: "Quoted text", sender_id: "user-a", message_type: "text" }] });
  await flush();
  assert.equal(settled, false, "No partially signed messages may be published");
  h.gates.signing.resolve({ data: [
    { path: "user-a/photo", signedUrl: "https://storage/new-photo" },
    { path: "user-a/thumb", signedUrl: "https://storage/invalid", error: "Denied" },
  ], error: null });
  const rows = await pending;
  assert.deepEqual(Array.from(rows, (row) => row.id), ["m1", "m2"]);
  assert.equal(rows[1].resolvedUrl, "https://storage/new-photo");
  assert.equal(rows[1].resolvedThumbnailUrl, null);
  assert.deepEqual(plain(rows[1].reactions), [{ emoji: "👍", user_id: "user-a", is_mine: true }]);
  assert.equal(rows[1].replyTo.message, "Quoted text");
  assert.deepEqual(h.queries.find((query) => query.table === "chat" && query.fields !== "*").filters, [["id", ["original"]]]);
});

test("chat retains participant/property scoping, newest-first keyset pagination and the existing page bound", async () => {
  const h = harness([]);
  const cursor = { created_at: "2026-10-01T00:00:01Z", id: "m1" };
  assert.deepEqual(plain(await h.load(null, cursor)), []);
  const [query] = h.queries;
  assert.deepEqual(query.filters, [
    ["or", "and(sender_id.eq.user-a,receiver_id.eq.user-b),and(sender_id.eq.user-b,receiver_id.eq.user-a)"],
    ["apartment_id", null],
    ["or", "created_at.lt.2026-10-01T00:00:01Z,and(created_at.eq.2026-10-01T00:00:01Z,id.lt.m1)"],
  ]);
  assert.deepEqual(plain(query.orders), [["created_at", { ascending: false }], ["id", { ascending: false }]]);
  assert.equal(query.limit, 100);
  assert.deepEqual(h.started, ["page"]);
});

test("chat keeps text/external GIFs usable without signing and handles inaccessible reply/reaction rows", async () => {
  const h = harness([message("m1", { reply_to: "deleted", attachment_url: "https://giphy.example/gif", message_type: "gif" })]);
  const pending = h.load();
  await flush();
  h.gates.reactions.resolve({ data: null, error: { message: "Unavailable" } });
  h.gates.replies.resolve({ data: [], error: null });
  const [row] = await pending;
  assert.deepEqual(plain(row.reactions), []);
  assert.equal(row.replyDeleted, true);
  assert.equal(row.replyTo, null);
  assert.equal(row.attachment_url, "https://giphy.example/gif");
  assert.equal(row.resolvedUrl, null);
  assert.ok(!h.started.includes("signing"));
});

test("chat rejects a cancelled history page even if enrichment finishes later", async () => {
  const h = harness([message("m1", { attachment_path: "user-a/photo" })]);
  const controller = new AbortController();
  const pending = h.load("apt-a", null, controller.signal);
  await flush();
  const rejected = assert.rejects(pending, /abort/i);
  controller.abort();
  h.gates.reactions.resolve({ data: [] });
  h.gates.signing.resolve({ data: [], error: null });
  await rejected;
});

test("chat signing deduplicates paths and never reuses a signed URL across reads", async () => {
  const calls = [];
  const client = { storage: { from: () => ({ createSignedUrls: async (paths) => {
    calls.push(Array.from(paths));
    return { data: [{ path: "user-a/photo", signedUrl: `https://storage/signature-${calls.length}` }], error: null };
  } }) } };
  const first = await attachments.resolveAttachmentUrls(client, ["user-a/photo", "user-a/photo"]);
  const second = await attachments.resolveAttachmentUrls(client, ["user-a/photo"]);
  assert.deepEqual(calls, [["user-a/photo"], ["user-a/photo"]]);
  assert.notEqual(first.get("user-a/photo"), second.get("user-a/photo"));
});
