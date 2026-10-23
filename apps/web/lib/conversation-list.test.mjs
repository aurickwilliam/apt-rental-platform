import assert from "node:assert/strict";
import { test } from "node:test";
import {
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

test("arrangeContacts pins first (newest pin first), then unread, and sets archived apart", () => {
  const list = [
    contact("read"),
    contact("unread", { unreadCount: 1 }),
    contact("oldPin", { isPinned: true, pinnedAt: "2026-10-01T00:00:00Z" }),
    contact("newPin", { isPinned: true, pinnedAt: "2026-10-20T00:00:00Z" }),
    contact("gone", { isArchived: true }),
    contact("manual", { markedUnread: true }),
  ];
  const { inbox, archived } = arrangeContacts(list);
  assert.deepEqual(inbox.map((c) => c.id), ["newPin", "oldPin", "unread", "manual", "read"]);
  assert.deepEqual(archived.map((c) => c.id), ["gone"]);
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
