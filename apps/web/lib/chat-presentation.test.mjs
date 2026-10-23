import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { formatChatAttachmentSize } from "../../../packages/utils/src/chatAttachments.ts";
import { isSameChatDay } from "../../../packages/utils/src/chatDay.ts";
import { getReplyCaption } from "../../../packages/utils/src/replyCaption.ts";
import { EMOJI_ONLY_SAMPLES, emojiFontSizeForCount } from "../../../packages/constants/src/chatEmoji.ts";
import { conversationPreview, emojiCount, isEmojiOnlyMessage, latestOutgoingMessageId, replyQuoteSnippet } from "./chat-message-presentation.ts";
import { applyReadReceipt } from "../app/components/chat/conversationEvents.ts";

for (const portal of ["tenant", "landlord"]) {
  test(`${portal}: consecutive message grouping matches mobile: same sender and day, no time limit`, () => {
    const source = readFileSync(new URL("../app/components/chat/ConversationView.tsx", import.meta.url), "utf8");
    const start = source.indexOf("function getGroupPosition");
    const end = source.indexOf("function TypingIndicator");
    const code = ts.transpileModule(source.slice(start, end) + "\nexports.group = getGroupPosition;", { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    const exports = {};
    vm.runInNewContext(code, { exports, isSameChatDay });
    const message = (sender, seconds) => ({ sender_id: sender, created_at: new Date(seconds * 1000).toISOString() });
    // A long pause never splits a run (mobile has no time rule); only a sender change does.
    const rows = [message("a", 0), message("a", 60), message("a", 360), message("a", 7200), message("b", 7201)];
    assert.deepEqual(rows.map((_, i) => exports.group(rows, i)), ["first", "middle", "middle", "last", "single"]);
    // A new calendar day starts a new run: the divider sits between the two bubbles.
    const days = [message("a", 0), message("a", 86400 * 2)];
    assert.deepEqual(days.map((_, i) => exports.group(days, i)), ["single", "single"]);
    assert.equal(exports.group([], 0), "single");
  });
}

const nodes = (element) => !element || typeof element !== "object" ? [] : [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)];

for (const portal of ["tenant", "landlord"]) {
  test(`${portal}: timeline uses the full conversation width with compact edge spacing`, () => {
    const source = readFileSync(new URL("../app/components/chat/ConversationView.tsx", import.meta.url), "utf8");
    assert.match(source, /data-message-timeline className="flex w-full min-w-0 flex-col"/);
    assert.match(source, /overflow-x-hidden overflow-y-auto bg-background\/50 px-3 py-4/);
    assert.doesNotMatch(source, /mx-auto flex w-full max-w-5xl/);
  });
}

function harness(file, browser = { getSelection: () => null }) {
  const state = [], refs = [];
  let stateIndex = 0, refIndex = 0;
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    react: {
      useState: (initial) => {
        const index = stateIndex++;
        if (!(index in state)) state[index] = initial;
        return [state[index], (next) => { state[index] = typeof next === "function" ? next(state[index]) : next; }];
      },
      useRef: (initial) => refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }),
      useEffect: () => {}, useId: () => "composer-hint", useCallback: (fn) => fn,
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@heroui/react": { Button: "Button", TextArea: "TextArea", Popover: Object.assign(() => {}, { Content: "PopoverContent", Dialog: "PopoverDialog" }) },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
    "@repo/utils": { formatChatAttachmentSize, getReplyCaption },
    "./attachments": { attachmentDisplayUrl: (m) => m.resolvedUrl, hasAttachment: (m) => Boolean(m.attachment_path) },
    "./reactionEmojis": { HEART_REACTION: "❤️" },
    "@/lib/chat-message-presentation": { emojiCount, isEmojiOnlyMessage, replyQuoteSnippet },
    "@repo/constants": { emojiFontSizeForCount },
  };
  const source = readFileSync(new URL(`../app/components/chat/${file}.tsx`, import.meta.url), "utf8");
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, require: (name) => dependencies[name] ?? { default: name }, setTimeout, clearTimeout, requestAnimationFrame: (fn) => fn(), window: browser,
  });
  return { refs, render: (props) => { stateIndex = 0; refIndex = 0; return nodes(exports.default(props)); } };
}

test("shared composer sends Enter once, preserves Shift+Enter and guards IME composition", () => {
  const h = harness("MessageInput");
  const sent = [];
  const props = { onSend: (value) => sent.push(value) };
  let tree = h.render(props);
  const field = () => tree.find((n) => n.type === "TextArea").props;
  field().onChange({ target: { value: "First\nSecond" } });
  tree = h.render(props);
  let prevented = 0;
  const key = (overrides = {}) => field().onKeyDown({ key: "Enter", shiftKey: false, nativeEvent: { isComposing: false }, preventDefault: () => prevented++, ...overrides });
  key({ shiftKey: true });
  key({ nativeEvent: { isComposing: true } });
  key({ keyCode: 229 });
  assert.equal(sent.length, 0);
  assert.equal(prevented, 0);
  key();
  assert.deepEqual(sent, ["First\nSecond"]);
  assert.equal(prevented, 1);
  tree = h.render(props);
  assert.equal(field().value, "");
});

test("composer is one pill: emoji left, then the field, then photo and GIF on the right", () => {
  const tree = harness("MessageInput").render({});
  const field = tree.find(n => n.props["data-composer-field"] !== undefined);
  const contents = nodes(field);
  assert.ok(contents.some(n => n.type === "TextArea" && n.props.placeholder === "Message..."));
  const order = ["Insert emoji", "Message", "Attach photos, videos or documents", "Send a GIF"].map(label => contents.findIndex(n => n.props["aria-label"] === label));
  assert.ok(order.every(i => i >= 0), "every control lives inside the pill");
  assert.deepEqual([...order].sort((x, y) => x - y), order);
  assert.equal(contents.some(n => n.type === "IconMoodSmileFilled"), true);
  assert.equal(tree.some(n => n.props["aria-label"] === "Send message"), false);
  assert.equal(tree.some(n => n.type === "IconCirclePlusFilled" || n.type === "IconMicrophone"), false);
  assert.ok(tree.some(n => n.type === "p" && n.props.className === "sr-only"));
});

test("typing swaps the photo and GIF icons for the send button; clearing brings them back", () => {
  const h = harness("MessageInput");
  const sent = [];
  const props = { onSend: (text) => sent.push(text) };
  const has = (tree, label) => tree.some(n => n.props["aria-label"] === label);
  let tree = h.render(props);
  assert.ok(has(tree, "Attach photos, videos or documents"));
  assert.ok(has(tree, "Send a GIF"));
  assert.equal(has(tree, "Send message"), false);

  tree.find(n => n.type === "TextArea").props.onChange({ target: { value: "hello" } });
  tree = h.render(props);
  assert.equal(has(tree, "Attach photos, videos or documents"), false);
  assert.equal(has(tree, "Send a GIF"), false);
  assert.ok(nodes(tree.find(n => n.props["data-composer-field"] !== undefined)).some(n => n.props["aria-label"] === "Send message"));
  tree.find(n => n.props["aria-label"] === "Send message").props.onPress();
  assert.deepEqual(sent, ["hello"]);

  tree = h.render(props);
  assert.ok(has(tree, "Send a GIF"));
  assert.equal(has(tree, "Send message"), false);
});

test("composer only scrolls after its growing draft reaches the height limit", () => {
  const source = readFileSync(new URL("../app/components/chat/MessageInput.tsx", import.meta.url), "utf8");
  const start = source.indexOf("    const field = inputRef.current;");
  const end = source.indexOf("  }, [value]);", start);
  const resize = new Function("inputRef", source.slice(start, end));
  for (const scrollHeight of [42, 90, 240]) {
    const style = { height: "", overflowY: "" };
    const field = { style, scrollHeight, offsetHeight: 44, get clientHeight() { return style.height === "auto" ? 42 : Math.max(44, parseFloat(style.height)) - 2; } };
    resize({ current: field });
    assert.equal(style.height, `${Math.min(scrollHeight + 2, 144)}px`);
    assert.equal(style.overflowY, scrollHeight > 142 ? "auto" : "hidden");
  }
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.apt-message-draft::-webkit-scrollbar-button\s*\{[^}]*display: none/s);
});

test("document bubbles show a named, private link rather than an image", () => {
  const h = harness("MessageBubble");
  const message = { id: "document", message: null, message_type: "file", attachment_path: "sender/file.pdf", attachment_name: "Lease.pdf", attachment_size: 2048, attachment_mime_type: "application/pdf", resolvedUrl: "https://example.com/signed-file", reactions: [] };
  for (const isPending of [false, true]) {
    const tree = h.render({ message: { ...message, isPending }, isMine: true });
    const body = tree.find(n => typeof n.type === "function" && n.type.name === "AttachmentBody");
    assert.ok(body);
    const content = nodes(body.type(body.props));
    const link = content.find(n => n.type === "a");
    assert.equal(link.props["aria-label"], "Open Lease.pdf");
    assert.equal(link.props.href, isPending ? undefined : message.resolvedUrl);
    assert.equal(link.props.rel, "noopener noreferrer");
    assert.ok(content.some(n => n.props.children === "Lease.pdf"));
    assert.equal(content.some(n => n.type === "img"), false);
  }
});

test("emoji insertion replaces the selection and restores the caret", () => {
  const h = harness("MessageInput");
  let tree = h.render({});
  tree.find((n) => n.type === "TextArea").props.onChange({ target: { value: "Hello selected world" } });
  tree = h.render({});
  let caret;
  tree.find((n) => n.type === "TextArea").props.ref.current = {
    selectionStart: 6, selectionEnd: 14, focus: () => {}, setSelectionRange: (start, end) => { caret = [start, end]; },
  };
  tree.find((n) => n.props["aria-label"] === "Insert emoji").props.onClick();
  tree = h.render({});
  tree.find((n) => n.type === "./EmojiInsertPanel").props.onSelect("😀");
  tree = h.render({});
  assert.equal(tree.find((n) => n.type === "TextArea").props.value, "Hello 😀 world");
  assert.deepEqual(caret, [8, 8]);
});

test("bubbles omit inline timestamps while preserving sending status and actions", () => {
  const h = harness("MessageBubble");
  const message = { id: "temp-one", message: "Sending", sender_id: "me", reactions: [], created_at: "2026-10-20T10:00:00Z", isPending: true };
  const callbacks = { onToggleReaction: () => assert.fail("pending reaction"), onReply: () => assert.fail("pending reply"), onOpenContextMenu: () => assert.fail("pending menu") };
  let tree = h.render({ message, isMine: true, ...callbacks });
  assert.equal(tree.filter((n) => n.props["aria-label"] === "Message actions").length, 0);
  assert.equal(tree.filter((n) => n.type === "time").length, 0);
  assert.ok(tree.some((n) => n.props.children === "Sending…"));
  tree = h.render({ message: { ...message, id: "real", isPending: false }, isMine: true, groupPosition: "middle", ...callbacks });
  assert.equal(tree.filter((n) => n.type === "time").length, 0);
  assert.equal(tree.filter((n) => n.props["aria-label"] === "Message actions").length, 1);
});

test("sender avatars appear only at incoming run ends, with a consistent gutter", () => {
  const h = harness("MessageBubble");
  const message = { id: "real", message: "Hello", reactions: [], created_at: "2026-10-20T10:00:00Z", is_read: true };
  for (const isMine of [true, false]) {
    for (const groupPosition of ["single", "first", "middle", "last"]) {
      const tree = h.render({ message, isMine, groupPosition, otherUserName: "Alex Santos", otherUserAvatar: "contact-photo" });
      assert.equal(tree.filter((n) => n.type === "time").length, 0);
      const avatars = tree.filter((n) => n.props["data-message-sender-avatar"] !== undefined);
      assert.equal(avatars.length, !isMine && ["single", "last"].includes(groupPosition) ? 1 : 0);
      assert.equal(tree[0].props.className.includes("ml-10"), !isMine);
      assert.equal(tree[0].props.className.includes("max-w-[calc(100%-6rem)]"), !isMine);
      const avatar = tree.find((n) => n.props.className === "apt-message-sender-avatar");
      if (avatar) {
        assert.equal(avatar.props.src, "contact-photo");
        assert.equal(avatar.props.initials, "AS");
      }
    }
  }
});

test("one actual read receipt renders the recipient avatar and accessible Seen description", () => {
  const h = harness("MessageBubble");
  const base = { id: "real", sender_id: "me", receiver_id: "peer", message: "Hello", reactions: [], created_at: "2026-10-20T10:00:00Z", is_read: false };
  const props = { isMine: true, isLatestOutgoing: true, otherUserName: "Alex Santos", otherUserAvatar: "recipient-photo" };
  const unread = h.render({ ...props, message: base });
  assert.equal(unread.filter((n) => n.props["aria-label"] === "Seen by Alex Santos").length, 0);
  // Exercise the existing realtime read reducer without a reload or new store.
  const [read] = applyReadReceipt([base], { id: "real", is_read: true, read_at: "2026-10-20T10:01:00Z" });
  const seen = h.render({ ...props, message: read });
  assert.equal(seen.filter((n) => n.props["aria-label"] === "Seen by Alex Santos").length, 1);
  const avatar = seen.find((n) => n.props.className === "apt-message-seen-avatar");
  assert.equal(avatar.props.src, "recipient-photo");
  assert.equal(avatar.props.initials, "AS");
  const status = (tree) => tree.find((n) => n.props["data-message-read-status"] !== undefined);
  assert.equal(status(unread).props.className, status(seen).props.className);
  for (const overrides of [{ isLatestOutgoing: false }, { isMine: false }, { message: { ...read, isPending: true } }, { message: { ...read, id: "temp-read" } }]) {
    const tree = h.render({ ...props, message: read, ...overrides });
    assert.equal(tree.filter((n) => n.props["aria-label"] === "Seen by Alex Santos").length, 0);
  }
});

test("missing avatar uses the same real contact's initials, never a fabricated image", () => {
  const h = harness("MessageBubble");
  const message = { id: "real", message: "Hello", reactions: [], is_read: true };
  for (const isMine of [true, false]) {
    const tree = h.render({ message, isMine, isLatestOutgoing: true, otherUserName: "Alex Santos", otherUserAvatar: "" });
    const avatar = tree.find((n) => n.props.className === (isMine ? "apt-message-seen-avatar" : "apt-message-sender-avatar"));
    assert.equal(avatar.props.src, "");
    assert.equal(avatar.props.initials, "AS");
  }
});

test("latest outgoing selection prevents duplicate or stale Seen indicators across runs", () => {
  const sent = (id, overrides = {}) => ({ id, sender_id: "me", receiver_id: "peer", is_read: true, ...overrides });
  const rows = [sent("first"), sent("incoming", { sender_id: "peer", receiver_id: "me" }), sent("latest", { is_read: false })];
  assert.equal(latestOutgoingMessageId(rows, "me", "peer"), "latest");
  rows.push(sent("reply", { sender_id: "peer", receiver_id: "me" }));
  assert.equal(latestOutgoingMessageId(rows, "me", "peer"), "latest");
  rows.push(sent("temp-pending", { isPending: true }));
  assert.equal(latestOutgoingMessageId(rows, "me", "peer"), "temp-pending");
  rows.push(sent("wrong-recipient", { receiver_id: "another-peer" }));
  assert.equal(latestOutgoingMessageId(rows, "me", "peer"), "temp-pending");
  assert.equal(latestOutgoingMessageId(rows, "me", null), null);
  assert.equal(latestOutgoingMessageId([], "me", "peer"), null);
});

test("incoming avatar belongs to the bubble, outside replies and reactions; receipt follows reactions", () => {
  const h = harness("MessageBubble");
  for (const message_type of ["text", "image", "video", "gif"]) {
    const message = { id: "media", message: "Caption", message_type, attachment_path: message_type === "text" ? null : "photo", resolvedUrl: "media-url", is_read: true, reactions: [{ emoji: "❤️", is_mine: true }], replyTo: { message: "Quoted reply", messageType: "text" } };
    const tree = h.render({ message, isMine: false });
    const boundary = tree.find((n) => n.props.className?.includes("apt-message-interaction"));
    assert.equal(nodes(boundary).filter((n) => n.props["data-message-sender-avatar"] !== undefined).length, 1);
    assert.equal(nodes(boundary).filter((n) => n.props.reactions).length, 0);
    const outgoing = h.render({ message, isMine: true, isLatestOutgoing: true });
    assert.ok(outgoing.findIndex((n) => n.props.reactions) < outgoing.findIndex((n) => n.props["data-message-read-status"] !== undefined));
  }
});

test("reactions align to the bubble's right edge for incoming, outgoing and quoted media messages", () => {
  const h = harness("MessageBubble");
  for (const isMine of [false, true]) {
    for (const message_type of ["text", "image", "video", "gif"]) {
      const message = { id: "reacted", message: "Hi", message_type, reactions: [{ emoji: "❤️", is_mine: true }], replyTo: { message: "A much longer quoted message", messageType: "text" } };
      const tree = h.render({ message, isMine });
      const wrapper = tree.find(n => n.props["data-message-with-reactions"] !== undefined);
      assert.match(wrapper.props.className, /flex-col items-end/);
      const children = nodes(wrapper);
      assert.ok(children.some(n => n.props.className?.includes("apt-message-bubble")));
      assert.equal(children.some(n => n.props["aria-label"] === "Jump to original message"), false);
      const badges = children.find(n => n.props.reactions);
      const badgeRow = badges.type(badges.props);
      assert.match(badgeRow.props.className, /justify-end/);
      assert.match(badgeRow.props.className, /self-end/);
    }
  }
});

test("reaction badges stay compact and only display counts above one", () => {
  const h = harness("MessageBubble");
  for (const count of [1, 2]) {
    const reactions = Array.from({ length: count }, (_, i) => ({ emoji: "😂", is_mine: i === 0 }));
    const tree = h.render({ message: { id: "compact", message: "Hi", reactions }, isMine: false });
    const badges = tree.find(n => n.props.reactions);
    const row = badges.type(badges.props);
    assert.match(row.props.className, /-mt-3/);
    const chip = nodes(row).find(n => n.type === "button");
    // Same 24px grey circle as mobile's ReactionBadge, whoever sent the message.
    assert.match(chip.props.className, /h-6/);
    assert.match(chip.props.className, /bg-muted/);
    assert.match(chip.props.className, count === 1 ? /w-6 shrink-0 p-0/ : /min-w-6 px-1/);
    assert.match(chip.props["aria-label"], new RegExp(`${count} reaction`));
    assert.equal(nodes(chip).some(n => n.type === "span" && n.props.children === count), count > 1);
    assert.equal(chip.props["aria-pressed"], true);
  }
});

test("hover boundary contains only the bubble and toolbar, not the quote or timestamp", () => {
  const h = harness("MessageBubble");
  const message = {
    id: "short", message: "Hi", reactions: [], created_at: "2026-10-20T10:00:00Z",
    replyTo: { message: "A much longer quoted message", messageType: "text" },
  };
  const tree = h.render({ message, isMine: false, groupPosition: "last" });
  const boundary = tree.find((node) => node.props.className?.includes("apt-message-interaction"));
  const content = nodes(boundary);
  assert.equal(boundary.props["data-group-position"], "last");
  assert.equal(boundary.props["data-interactive"], true);
  assert.equal(boundary.props["data-overlay-open"], false);
  assert.equal(content.filter((node) => node.props.className?.includes("apt-message-bubble")).length, 1);
  assert.equal(content.filter((node) => node.props["aria-label"] === "Message actions").length, 1);
  assert.equal(content.filter((node) => node.type === "time" || node.props.onClick).length, 0);
  assert.doesNotMatch(boundary.props.className, /(?:^|\s)(?:w-full|p[xy]?-\d)/);
});

test("reply previews jump to the stable original ID, never start another reply or open message actions", () => {
  const h = harness("MessageBubble");
  for (const messageType of ["text", "image", "video", "gif", "file"]) {
    const jumped = [];
    const message = { id: "reply", message: "Reply body", reactions: [], reply_to: "original-id", replyTo: { id: "preview-id", message: messageType === "text" ? "Quoted text" : null, messageType } };
    const tree = h.render({ message, isMine: true, onReply: () => assert.fail("must not compose a reply"), onOpenContextMenu: () => assert.fail("must not open actions"), onJumpToOriginal: id => jumped.push(id), isReplyHighlighted: true });
    const preview = tree.find(node => node.props["aria-label"] === "Jump to original message");
    assert.equal(preview.type, "button");
    assert.equal(preview.props.type, "button");
    assert.match(preview.props.className, /cursor-pointer/);
    assert.match(preview.props.className, /focus-visible:ring-2/);
    let stopped = 0;
    preview.props.onClick({ stopPropagation: () => stopped++ });
    preview.props.onDoubleClick({ stopPropagation: () => stopped++ });
    preview.props.onKeyDown({ stopPropagation: () => stopped++ });
    assert.deepEqual(jumped, ["original-id"]);
    assert.equal(stopped, 3);
    const bubble = tree.find(node => node.props["data-chat-message-id"] === "reply");
    assert.equal(bubble.props["data-reply-highlight"], true);
  }
  const deleted = h.render({ message: { id: "reply", message: "Reply body", reactions: [], replyDeleted: true }, isMine: false });
  assert.equal(deleted.some(node => node.props["aria-label"] === "Jump to original message"), false);
  assert.ok(deleted.some(node => node.props.children === "Original message unavailable"));
});

test("selecting quoted text does not jump, while keyboard activation still works", () => {
  const selectedNode = {}, jumped = [];
  const h = harness("MessageBubble", { getSelection: () => ({ isCollapsed: false, anchorNode: selectedNode }) });
  const tree = h.render({ message: { id: "reply", message: "Body", reactions: [], replyTo: { id: "original", message: "Quoted text", messageType: "text" } }, isMine: true, onJumpToOriginal: id => jumped.push(id) });
  const preview = tree.find(node => node.props["aria-label"] === "Jump to original message");
  const event = { detail: 1, stopPropagation: () => {}, currentTarget: { contains: node => node === selectedNode } };
  preview.props.onClick(event);
  assert.deepEqual(jumped, []);
  preview.props.onClick({ ...event, detail: 0 });
  assert.deepEqual(jumped, ["original"]);
});

test("only the owning menu or reaction picker pins the interaction open", () => {
  const h = harness("MessageBubble");
  const props = { message: { id: "real", message: "Hi", reactions: [], created_at: "2026-10-20T10:00:00Z" }, isMine: true };
  const boundary = (tree) => tree.find((node) => node.props.className?.includes("apt-message-interaction"));
  assert.equal(boundary(h.render({ ...props, isContextMenuOpen: true })).props["data-overlay-open"], true);
  let tree = h.render({ ...props, isContextMenuOpen: false });
  assert.equal(boundary(tree).props["data-overlay-open"], false);
  const popover = tree.find((node) => node.props.onOpenChange);
  popover.props.onOpenChange(true);
  assert.equal(boundary(h.render(props)).props["data-overlay-open"], true);
  popover.props.onOpenChange(false);
  assert.equal(boundary(h.render(props)).props["data-overlay-open"], false);
});

test("CSS hover tolerance is localized and adjacent grouped messages split the 4px gap", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.apt-message-interaction\[data-interactive="true"\]::before\s*\{[^}]*inset:\s*-12px -124px/s);
  assert.match(css, /data-group-position="last"[^}]*top:\s*-2px/s);
  assert.match(css, /data-group-position="first"[^}]*bottom:\s*-2px/s);
  assert.match(css, /\.apt-message-interaction:hover > \.apt-message-actions/);
  assert.match(css, /\.apt-message-interaction:focus-within > \.apt-message-actions/);
  assert.doesNotMatch(css, /group\\\/message:hover/);
  const source = readFileSync(new URL("../app/components/chat/ConversationView.tsx", import.meta.url), "utf8");
  assert.match(source, /isContextMenuOpen=\{contextMenu\?\.message\.id === msg\.id\}/);
  assert.match(source, /overflow-x-hidden overflow-y-auto/);
  assert.match(source, /otherUserAvatar=\{activeContact.avatar\}/);
  assert.match(source, /isLatestOutgoing=\{msg.id === latestOutgoingId\}/);
});

test("emoji-only messages are detected and sized like mobile", () => {
  for (const text of EMOJI_ONLY_SAMPLES.emojiOnly) assert.equal(isEmojiOnlyMessage(text), true, text);
  for (const text of [...EMOJI_ONLY_SAMPLES.notEmojiOnly, null, undefined]) assert.equal(isEmojiOnlyMessage(text), false, String(text));
  const size = (text) => emojiFontSizeForCount(emojiCount(text));
  assert.equal(size("😂"), 46);
  assert.equal(size("👨‍👩‍👧"), 46);
  assert.equal(size("😂😂"), 40);
  assert.equal(size("😂😂😂"), 34);
  assert.equal(size("😂😂😂😂😂"), 34);
});

test("emoji-only text messages render large without a bubble background", () => {
  const h = harness("MessageBubble");
  const bubble = (message) => h.render({ message: { id: "m", message_type: "text", reactions: [], ...message }, isMine: true }).find((n) => n.props.className?.includes("apt-message-bubble"));
  const emoji = bubble({ message: "😂" });
  assert.match(emoji.props.className, /bg-transparent/);
  assert.match(emoji.props.className, /\bp-0\b/);
  assert.equal(nodes(emoji).find((n) => n.type === "p").props.style.fontSize, 46);
  const text = bubble({ message: "hello 😂" });
  assert.match(text.props.className, /bg-primary/);
  assert.equal(nodes(text).find((n) => n.type === "p").props.style, undefined);
});

test("reply bar names the target and previews text or attachments like mobile", () => {
  const h = harness("MessageInput");
  const text = (tree) => nodes(tree.find(n => n.props["data-fab-clearance"] === "messages-composer")).filter(n => n.type === "p").map(n => n.props.children);
  let tree = h.render({ replyTarget: { id: "m", message: "asdsa", message_type: "text" }, replyLabel: "yourself" });
  assert.ok(text(tree).flat().join(" ").includes("asdsa"));
  assert.ok(text(tree).some(c => Array.isArray(c) ? c.join("") === "Replying to yourself" : c === "Replying to yourself"));

  tree = h.render({ replyTarget: { id: "m", message: null, message_type: "image" }, replyLabel: "Charlie" });
  assert.ok(text(tree).includes("Photo"));
  assert.ok(tree.some(n => n.type === "IconPhoto"));
  tree = h.render({ replyTarget: { id: "m", message: null, message_type: "file", attachment_name: "lease.pdf" } });
  assert.ok(text(tree).includes("lease.pdf"));
});

test("quoted replies read like mobile: the text, else Photo / Video / GIF / Document", () => {
  assert.equal(replyQuoteSnippet({ message: "  hi  ", messageType: "text" }), "hi");
  assert.equal(replyQuoteSnippet({ message: "x".repeat(100), messageType: "text" }), `${"x".repeat(90)}…`);
  assert.equal(replyQuoteSnippet({ message: null, messageType: "image" }), "Photo");
  assert.equal(replyQuoteSnippet({ message: "", messageType: "video" }), "Video");
  assert.equal(replyQuoteSnippet({ message: null, messageType: "gif" }), "GIF");
  assert.equal(replyQuoteSnippet({ message: null, messageType: "file" }), "Document");
  assert.equal(replyQuoteSnippet({ message: null, messageType: "text" }), "");
});

test("a reply to a photo shows the quoted image, dimmed, under an Instagram-style caption", () => {
  const h = harness("MessageBubble");
  const render = (replyTo, isMine = true) => h.render({
    message: { id: "m", message: "And blazing", message_type: "text", reactions: [], reply_to: "q", replyTo },
    isMine,
    otherUserName: "Case",
  });
  const quoted = { id: "q", message: null, messageType: "image", senderId: "me", isSent: true, previewUrl: "https://signed/photo.jpg" };

  let tree = render(quoted);
  assert.ok(tree.some(n => n.type === "p" && n.props.children === "You replied to yourself"));
  const image = tree.find(n => n.type === "img");
  assert.equal(image.props.src, "https://signed/photo.jpg");
  assert.match(image.props.className, /opacity-60/);
  assert.equal(tree.some(n => n.type === "IconPlayerPlay"), false);

  // A video shows its poster with a play mark; a quote without an image keeps the icon card.
  tree = render({ ...quoted, messageType: "video", isSent: false });
  assert.ok(tree.some(n => n.type === "p" && n.props.children === "You replied to Case"));
  assert.ok(tree.some(n => n.type === "IconPlayerPlay"));
  tree = render({ ...quoted, previewUrl: null });
  assert.equal(tree.some(n => n.type === "img"), false);
  assert.ok(tree.some(n => n.type === "IconPhoto"));
});

test("clicking a chat photo opens the viewer after the double-click window; a double click does not", async () => {
  const h = harness("MessageBubble");
  const props = {
    message: { id: "p", message: null, message_type: "image", attachment_path: "x", resolvedUrl: "https://signed/photo.jpg", reactions: [] },
    isMine: true,
  };
  const viewerUrl = (tree) => tree.find((n) => n.type === "./ChatImageViewer").props.url;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let tree = h.render(props);
  assert.equal(viewerUrl(tree), null);
  // AttachmentBody is its own component: expand it to reach the button.
  const open = () => {
    const body = tree.find((n) => typeof n.type === "function" && n.props.onOpenImage);
    return nodes(body.type(body.props)).find((n) => n.props["aria-label"] === "View image");
  };

  open().props.onClick({ detail: 1 });
  assert.equal(viewerUrl(h.render(props)), null, "waits for a possible second click");
  await wait(350);
  assert.equal(viewerUrl(h.render(props)), "https://signed/photo.jpg");

  // Fresh bubble: click, then a second click inside the window cancels the open.
  const h2 = harness("MessageBubble");
  tree = h2.render(props);
  // One expansion = one component instance, so both clicks share the same timer.
  const button = open();
  button.props.onClick({ detail: 1 });
  button.props.onClick({ detail: 2 });
  await wait(350);
  assert.equal(viewerUrl(h2.render(props)), null);
});

test("conversation previews follow mobile: 'You: text' and 'You sent a photo' when you sent it", () => {
  assert.equal(conversationPreview({ lastMessage: " Hello ", lastSenderIsMe: false }), "Hello");
  assert.equal(conversationPreview({ lastMessage: "Hello", lastSenderIsMe: true }), "You: Hello");
  assert.equal(conversationPreview({ lastMessage: null, lastMessageType: "image", lastSenderIsMe: true }), "You sent a photo");
  assert.equal(conversationPreview({ lastMessage: "", lastMessageType: "image" }), "Sent a photo");
  assert.equal(conversationPreview({ lastMessageType: "video", lastSenderIsMe: true }), "You sent a video");
  assert.equal(conversationPreview({ lastMessageType: "gif" }), "Sent a GIF");
  assert.equal(conversationPreview({ lastMessageType: "file", lastSenderIsMe: true }), "You sent a document");
  assert.equal(conversationPreview({ lastMessageType: "text" }), null);
  assert.equal(conversationPreview({}), null);
});
