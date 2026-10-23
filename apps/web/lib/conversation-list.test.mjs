import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyLatestMessage,
  applyPreferenceChange,
  arrangeContacts,
  getConversationMenuItems,
  hasUnreadContact,
} from "./conversation-list.ts";

const contact = (id, extra = {}) => ({
  id,
  conversationKey: `${id}:apt`,
  name: `Person ${id}`,
  avatar: "",
  apartment: "Sunrise",
  apartmentId: "apt",
  unreadCount: 0,
  ...extra,
});

test("unread means unread messages or a manual mark", () => {
  assert.equal(hasUnreadContact(contact("a")), false);
  assert.equal(hasUnreadContact(contact("a", { unreadCount: 2 })), true);
  assert.equal(hasUnreadContact(contact("a", { markedUnread: true })), true);
});

test("arrangeContacts pins first (newest pin first), then newest message first, archived apart", () => {
  const list = [
    contact("old", { lastMessageTime: "2026-10-01T00:00:00Z" }),
    contact("new", { lastMessageTime: "2026-10-23T00:00:00Z" }),
    contact("oldPin", { isPinned: true, pinnedAt: "2026-10-01T00:00:00Z", lastMessageTime: "2026-10-30T00:00:00Z" }),
    contact("newPin", { isPinned: true, pinnedAt: "2026-10-20T00:00:00Z" }),
    contact("gone", { isArchived: true, lastMessageTime: "2026-10-05T00:00:00Z" }),
    contact("goneNewer", { isArchived: true, lastMessageTime: "2026-10-06T00:00:00Z" }),
    contact("silent"),
  ];
  const { inbox, archived } = arrangeContacts(list);
  assert.deepEqual(inbox.map((c) => c.id), ["newPin", "oldPin", "new", "old", "silent"]);
  assert.deepEqual(archived.map((c) => c.id), ["goneNewer", "gone"]);
});

test("a new message moves its row to the top of the unpinned group, behind pinned rows", () => {
  const list = [
    contact("pinned", { isPinned: true, pinnedAt: "2026-10-01T00:00:00Z", lastMessageTime: "2026-10-02T00:00:00Z" }),
    contact("first", { lastMessageTime: "2026-10-23T00:00:00Z" }),
    contact("second", { lastMessageTime: "2026-10-22T00:00:00Z" }),
    contact("fifth", { lastMessageTime: "2026-10-10T00:00:00Z" }),
  ];
  const sent = list.map((c) => (c.id === "fifth"
    ? applyLatestMessage(c, { message: "hey", messageType: "text", createdAt: "2026-10-24T09:00:00Z", fromMe: true }, false)
    : c));
  assert.deepEqual(arrangeContacts(sent).inbox.map((c) => c.id), ["pinned", "fifth", "first", "second"]);
});

test("applyLatestMessage sets the preview and counts unread only when asked", () => {
  const base = contact("a", { unreadCount: 1, lastMessage: "old", lastSenderIsMe: true });
  const received = applyLatestMessage(base, { message: "hi", messageType: "text", createdAt: "2026-10-24T00:00:00Z", fromMe: false }, true);
  assert.deepEqual(
    [received.lastMessage, received.lastMessageType, received.lastMessageTime, received.lastSenderIsMe, received.unreadCount],
    ["hi", "text", "2026-10-24T00:00:00Z", false, 2],
  );
  const viewing = applyLatestMessage(base, { message: null, messageType: "image", createdAt: "2026-10-24T00:00:00Z", fromMe: false }, false);
  assert.equal(viewing.unreadCount, 1);
  assert.equal(viewing.lastMessage, null);
});

test("applyPreferenceChange records the pin time and leaves other fields alone", () => {
  const pinned = applyPreferenceChange(contact("a"), { isPinned: true });
  assert.equal(pinned.isPinned, true);
  assert.equal(typeof pinned.pinnedAt, "string");
  const unpinned = applyPreferenceChange(pinned, { isPinned: false });
  assert.equal(unpinned.pinnedAt, null);
  const muted = applyPreferenceChange(contact("a", { isPinned: true, pinnedAt: "x" }), { isMuted: true });
  assert.equal(muted.isMuted, true);
  assert.equal(muted.pinnedAt, "x");
});

const labels = (items) => items.map((item) => item.label);

test("menu options mirror mobile's sheet and flip with state", () => {
  assert.deepEqual(labels(getConversationMenuItems(contact("a", { name: "Ana Cruz" }), false)), [
    "Pin", "Archive", "Mark as unread", "View apartment", "Mute notifications", "Report Ana", "Block Ana",
  ]);
  assert.deepEqual(
    labels(getConversationMenuItems(contact("a", { name: "Ana Cruz", isPinned: true, isArchived: true, unreadCount: 3, isMuted: true, blockedByMe: true, apartmentId: null }), false)),
    ["Unpin", "Unarchive", "Mark as read", "Unmute notifications", "Report Ana", "Unblock Ana"],
  );
});

test("app-pinned rows lock Pin and Archive; an active tenancy blocks Block with a reason", () => {
  const locked = getConversationMenuItems(contact("a", { isArchived: true }), true);
  const pin = locked.find((item) => item.action === "togglePin");
  const archive = locked.find((item) => item.action === "toggleArchive");
  assert.deepEqual([pin.label, pin.disabled, archive.label, archive.disabled], ["Unpin", true, "Archive", true]);

  const block = getConversationMenuItems(contact("a", { inActiveTenancy: true }), false).find((item) => item.action === "toggleBlock");
  assert.equal(block.disabled, true);
  assert.equal(block.destructive, true);
  assert.match(block.note, /after your tenancy ends/);
});
