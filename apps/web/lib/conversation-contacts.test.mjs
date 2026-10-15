import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildPortalContacts,
  getContactConversationKey,
  resolveContactAvatar,
} from "./conversation-contacts.ts";

const row = (overrides) => ({
  other_user_id: "landlord-1",
  other_user_name: "Lan Lord",
  other_user_avatar: null,
  apartment_id: "apt-1",
  apartment_name: "Sunrise",
  unread_count: 0,
  ...overrides,
});

const pinnedContact = {
  id: "landlord-1",
  conversationKey: "landlord-1:apt-1",
  name: "Lan Lord",
  avatar: "",
  apartment: "Current: Sunrise",
  apartmentId: "apt-1",
  unreadCount: 0,
};

const options = (rows, pinned = []) => ({
  rows,
  pinned,
  describeApartment: (name) => (name ? `Inquiry: ${name}` : "Inquiry"),
});

test("conversation keys use 'none' for chats without an apartment", () => {
  assert.equal(getContactConversationKey("user-1", "apt-1"), "user-1:apt-1");
  assert.equal(getContactConversationKey("user-1", null), "user-1:none");
});

test("pinned contacts take their unread count from the conversation rows", () => {
  const { pinned, others } = buildPortalContacts(
    options([row({ unread_count: 3 })], [pinnedContact]),
  );

  assert.equal(pinned[0].unreadCount, 3);
  assert.deepEqual(others, []);
});

test("pinned contacts without messages yet stay listed with no unread", () => {
  const { pinned } = buildPortalContacts(options([], [pinnedContact]));

  assert.equal(pinned.length, 1);
  assert.equal(pinned[0].unreadCount, 0);
});

test("other conversations keep the RPC order and include chats the user started", () => {
  const { others } = buildPortalContacts(
    options([
      row({ other_user_id: "landlord-2", apartment_id: "apt-2", apartment_name: "Loft", unread_count: 1 }),
      row({ other_user_id: "landlord-3", apartment_id: "apt-3", apartment_name: "Villa" }),
    ]),
  );

  assert.deepEqual(
    others.map((contact) => [contact.conversationKey, contact.apartment, contact.unreadCount]),
    [
      ["landlord-2:apt-2", "Inquiry: Loft", 1],
      ["landlord-3:apt-3", "Inquiry: Villa", 0],
    ],
  );
});

test("chats without an apartment are kept, with a generic subtitle", () => {
  const { others } = buildPortalContacts(
    options([row({ other_user_id: "user-9", apartment_id: null, apartment_name: null })]),
  );

  assert.equal(others[0].conversationKey, "user-9:none");
  assert.equal(others[0].apartment, "Inquiry");
  assert.equal(others[0].apartmentId, null);
});

test("names are trimmed and missing names become empty", () => {
  const { others } = buildPortalContacts(
    options([
      row({ other_user_id: "a", other_user_name: " Ana " }),
      row({ other_user_id: "b", other_user_name: null }),
    ]),
  );

  assert.deepEqual(others.map((contact) => contact.name), ["Ana", ""]);
});

test("avatars fall back to empty (initials), never a third-party placeholder", () => {
  assert.equal(resolveContactAvatar(null), "");
  assert.equal(resolveContactAvatar(undefined), "");
  assert.equal(resolveContactAvatar("  "), "");
  assert.equal(resolveContactAvatar(" https://cdn.example/a.png "), "https://cdn.example/a.png");

  const { others } = buildPortalContacts(options([row({ other_user_avatar: null })]));
  assert.equal(others[0].avatar, "");
});
