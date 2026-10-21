import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as rules from "../../../packages/utils/src/chatAttachments.ts";

const source = readFileSync(new URL("../app/components/chat/attachments.ts", import.meta.url), "utf8");
const exports = {};
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
  exports, require: (name) => { assert.equal(name, "@repo/utils"); return rules; }, File, console,
});

test("PDF and DOCX validate up to exactly 25 MB; oversize, empty and unsupported files fail", async () => {
  for (const [extension, type] of Object.entries(rules.CHAT_DOCUMENT_MIME_TYPES)) {
    for (const size of [1, rules.MAX_CHAT_ATTACHMENT_BYTES]) {
      assert.equal(await exports.validateAttachmentFile({ name: `lease.${extension}`, type, size }), null);
    }
    assert.match(await exports.validateAttachmentFile({ name: `lease.${extension}`, type, size: rules.MAX_CHAT_ATTACHMENT_BYTES + 1 }), /larger than 25 MB/);
    assert.match(await exports.validateAttachmentFile({ name: `lease.${extension}`, type, size: 0 }), /empty/);
    assert.equal(exports.resolveMessageType(type), "file");
    assert.ok(exports.CHAT_ATTACHMENT_ACCEPT.includes(`.${extension}`));
  }
  for (const type of ["text/html", "application/javascript", "application/msword", "application/zip"]) {
    assert.match(await exports.validateAttachmentFile({ name: "unsafe.pdf", type, size: 10 }), /isn't a supported file/);
  }
  assert.equal(await exports.validateAttachmentFile({ name: "photo.png", type: "image/png", size: 10 }), null);
});

test("missing document MIME types use only known PDF/DOCX extensions", async () => {
  for (const type of ["", "application/octet-stream"]) {
    for (const extension of ["PDF", "DOCX"]) {
      const file = { name: `lease.${extension}`, type, size: 10 };
      assert.equal(await exports.validateAttachmentFile(file), null);
      assert.equal(exports.resolveMessageType(rules.chatAttachmentMimeType(file)), "file");
    }
  }
  assert.match(await exports.validateAttachmentFile({ name: "script.exe", type: "", size: 10 }), /isn't a supported file/);
});

test("document uploads preserve bytes, names, size, extension and MIME without image compression", async () => {
  const calls = [];
  const supabase = { storage: { from: (bucket) => {
    assert.equal(bucket, "chat-images");
    return { upload: async (path, file, options) => { calls.push({ path, file, options }); return { error: null }; } };
  } } };
  const files = [new File(["%PDF-1.7"], "lease.pdf", { type: "application/pdf" }), new File(["docx-bytes"], "contract.DOCX")];
  const { uploaded, failures } = await exports.uploadChatAttachments(supabase, "sender", files);
  assert.equal(failures.length, 0);
  assert.equal(uploaded.length, 2);
  for (const [i, attachment] of uploaded.entries()) {
    assert.equal(attachment.messageType, "file");
    assert.equal(attachment.name, files[i].name);
    assert.equal(attachment.size, files[i].size);
    assert.equal(attachment.thumbnailPath, null);
    const call = calls.find(c => c.path === attachment.path);
    assert.equal(call.file, files[i]);
    assert.equal(call.options.contentType, rules.chatAttachmentMimeType(files[i]));
    assert.equal(call.options.upsert, false);
    assert.match(call.path, new RegExp(`^sender/[^/]+\\.${i === 0 ? "pdf" : "docx"}$`));
  }
});
