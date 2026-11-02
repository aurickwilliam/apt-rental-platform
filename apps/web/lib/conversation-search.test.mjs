import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_RECENT_MESSAGE_SEARCHES,
  addRecentMessageSearch,
  filterConversationContacts,
  parseRecentMessageSearches,
  recentMessageSearchesKey,
} from "./conversation-search.ts";

const contact = (id, name, apartment, apartmentId = "apt") => ({
  id,
  conversationKey: `${id}:${apartmentId}`,
  name,
  avatar: "",
  apartment,
  apartmentId,
  unreadCount: 0,
});

const contacts = [
  contact("a", "Case Oh", "Sunrise Residences"),
  contact("b", "Ryan Gosling", "Bagumbayan North Flats"),
  contact("c", "Maria Santos", "No apartment linked", null),
];

test("a blank query keeps every conversation", () => {
  assert.equal(filterConversationContacts(contacts, "").length, 3);
  assert.equal(filterConversationContacts(contacts, "   ").length, 3);
});

test("matches the contact name, ignoring case and extra spaces", () => {
  assert.deepEqual(filterConversationContacts(contacts, "  gOSLING ").map((c) => c.id), ["b"]);
});

test("matches the apartment name", () => {
  assert.deepEqual(filterConversationContacts(contacts, "bagumbayan").map((c) => c.id), ["b"]);
});

test("every word must match, in any order, across name and apartment", () => {
  assert.deepEqual(filterConversationContacts(contacts, "sunrise case").map((c) => c.id), ["a"]);
  assert.deepEqual(filterConversationContacts(contacts, "case bagumbayan"), []);
});

test("an unlinked conversation is not matched by its placeholder subtitle", () => {
  assert.deepEqual(filterConversationContacts(contacts, "apartment"), []);
  assert.deepEqual(filterConversationContacts(contacts, "maria").map((c) => c.id), ["c"]);
});

test("recent searches put the newest first, drop duplicates and cap the list", () => {
  assert.deepEqual(addRecentMessageSearch(["ryan", "case"], "  Case  "), ["Case", "ryan"]);
  assert.deepEqual(addRecentMessageSearch(["ryan"], "   "), ["ryan"]);
  let list = [];
  for (let i = 0; i < 8; i++) list = addRecentMessageSearch(list, `term ${i}`);
  assert.equal(list.length, MAX_RECENT_MESSAGE_SEARCHES);
  assert.equal(list[0], "term 7");
});

test("saved recents are read defensively and keyed per account", () => {
  assert.deepEqual(parseRecentMessageSearches(null), []);
  assert.deepEqual(parseRecentMessageSearches("not json"), []);
  assert.deepEqual(parseRecentMessageSearches('{"a":1}'), []);
  assert.deepEqual(parseRecentMessageSearches('["ok", 3, "", "  "]'), ["ok"]);
  assert.notEqual(recentMessageSearchesKey("one"), recentMessageSearchesKey("two"));
  assert.equal(recentMessageSearchesKey(null), recentMessageSearchesKey(undefined));
});
