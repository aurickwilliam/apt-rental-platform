import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function load(globals = {}) {
  const source = readFileSync(new URL("../app/components/chat/copyImage.ts", import.meta.url), "utf8");
  const exports = {};
  const dependencies = { "./attachments": { attachmentDisplayUrl: (m) => m.resolvedUrl ?? m.attachment_url ?? null } };
  vm.runInNewContext(
    ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, require: (name) => dependencies[name], ...globals },
  );
  return exports;
}

test("only photos and GIFs with a resolved URL can be copied as images", () => {
  const { canCopyImageMessage } = load();
  assert.equal(canCopyImageMessage({ message_type: "image", resolvedUrl: "u" }), true);
  assert.equal(canCopyImageMessage({ message_type: "gif", attachment_url: "u" }), false);
  assert.equal(canCopyImageMessage({ message_type: "image" }), false);
  assert.equal(canCopyImageMessage({ message_type: "video", resolvedUrl: "u" }), false);
  assert.equal(canCopyImageMessage({ message_type: "file", resolvedUrl: "u" }), false);
  assert.equal(canCopyImageMessage({ message_type: "text", message: "hi" }), false);
});

test("a PNG goes to the clipboard as-is, as a promise-based ClipboardItem", async () => {
  const written = [];
  class ClipboardItem { constructor(items) { this.items = items; } }
  const png = { type: "image/png" };
  const { copyChatImage } = load({
    ClipboardItem,
    navigator: { clipboard: { write: async (items) => written.push(items) } },
    fetch: async () => ({ ok: true, blob: async () => png }),
  });
  await copyChatImage({ message_type: "image", resolvedUrl: "https://x/y.png" });
  assert.equal(written.length, 1);
  assert.equal(await written[0][0].items["image/png"], png);
});

test("copy fails clearly when the browser can't write images or the file won't load", async () => {
  const unsupported = load({ navigator: { clipboard: {} } });
  await assert.rejects(unsupported.copyChatImage({ message_type: "image", resolvedUrl: "u" }), /isn't supported/);

  class ClipboardItem { constructor(items) { this.items = items; } }
  const broken = load({
    ClipboardItem,
    navigator: { clipboard: { write: async (items) => { await items[0].items["image/png"]; } } },
    fetch: async () => ({ ok: false }),
  });
  await assert.rejects(broken.copyChatImage({ message_type: "image", resolvedUrl: "u" }), /Couldn't load/);
});
