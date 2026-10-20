import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { latestOutgoingMessageId } from "./chat-message-presentation.ts";
import { applyReadReceipt } from "../app/components/chat/conversationEvents.ts";

for (const portal of ["tenant", "landlord"]) {
  test(`${portal}: consecutive message grouping keeps the inclusive five-minute rule`, () => {
    const source = readFileSync(new URL(`../app/${portal}/messages/components/ConversationView.tsx`, import.meta.url), "utf8");
    const start = source.indexOf("const RUN_GAP_MS");
    const end = source.indexOf("function TypingIndicator");
    const code = ts.transpileModule(source.slice(start, end) + "\nexports.group = getGroupPosition;", { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    const exports = {};
    vm.runInNewContext(code, { exports });
    const message = (sender, seconds) => ({ sender_id: sender, created_at: new Date(seconds * 1000).toISOString() });
    const rows = [message("a", 0), message("a", 60), message("a", 360), message("a", 661), message("b", 662)];
    assert.deepEqual(rows.map((_, i) => exports.group(rows, i)), ["first", "middle", "last", "single", "single"]);
    assert.equal(exports.group([], 0), "single");
  });
}

const nodes = (element) => !element || typeof element !== "object" ? [] : [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)];

function harness(file) {
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
    "./attachments": { attachmentDisplayUrl: (m) => m.resolvedUrl, hasAttachment: (m) => Boolean(m.attachment_path) },
    "./reactionEmojis": { HEART_REACTION: "❤️" },
  };
  const source = readFileSync(new URL(`../app/components/chat/${file}.tsx`, import.meta.url), "utf8");
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, require: (name) => dependencies[name] ?? { default: name }, setTimeout, clearTimeout, requestAnimationFrame: (fn) => fn(),
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
      assert.equal(tree[0].props.className.includes("ml-9"), !isMine);
      assert.equal(tree[0].props.className.includes("max-w-[calc(100%-5.5rem)]"), !isMine);
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
  for (const portal of ["tenant", "landlord"]) {
    const source = readFileSync(new URL(`../app/${portal}/messages/components/ConversationView.tsx`, import.meta.url), "utf8");
    assert.match(source, /isContextMenuOpen=\{contextMenu\?\.message\.id === msg\.id\}/);
    assert.match(source, /overflow-x-hidden overflow-y-auto/);
    assert.match(source, /otherUserAvatar=\{activeContact.avatar\}/);
    assert.match(source, /isLatestOutgoing=\{msg.id === latestOutgoingId\}/);
  }
});
