import assert from "node:assert/strict";
import { test } from "node:test";

import { composeNotificationRowLabel, getNotificationRowPresentation } from "./notification-row.ts";

test("composes a reaction row label from title, message, preview and unread state", () => {
  assert.equal(
    composeNotificationRowLabel({
      title: "Emma Stone",
      message: "Reacted ❤️ to your message",
      preview: "See you at 6pm",
      isRead: false,
    }),
    "Emma Stone, Reacted ❤️ to your message, See you at 6pm, unread",
  );
});

test("ordinary message and reaction content separate the inline action from its preview", () => {
  assert.deepEqual(getNotificationRowPresentation({ type: "message", message: "Hello", data: { screen: "chat" } }, null),
    { action: "sent you a message", preview: "Hello" });
  assert.deepEqual(getNotificationRowPresentation({ type: "message", message: "Reacted 😍 to your message", data: { event: "reaction" } }, "sire"),
    { action: "reacted 😍 to your message", preview: "sire" });
  assert.deepEqual(getNotificationRowPresentation({ type: "message", message: "Sent an image", data: {} }, null),
    { action: null, preview: "Sent an image" });
  for (const message of ["constructor", "toString", "__proto__"]) {
    assert.deepEqual(getNotificationRowPresentation({ type: "message", message, data: {} }, null),
      { action: null, preview: message });
  }
});

test("historical and malformed payloads preserve copy without inferring a sender or payment details", () => {
  for (const data of [null, undefined, {}, [], "chat", { event: "future", screen: "chat" }]) {
    for (const type of ["message", "payment", "maintenance", "apartment", "system", "future"]) {
      const message = "Cash payment of PHP 2,000 from May for Unit 3 — reference unchanged";
      assert.deepEqual(getNotificationRowPresentation({ type, message, data }, null),
        { action: null, preview: message });
    }
  }
  assert.deepEqual(getNotificationRowPresentation({ type: "message", message: null, data: { event: "reaction" } }, null),
    { action: null, preview: null }, "missing content does not invent a reaction sentence");
});

test("application, verification and unknown event copy stays intact", () => {
  for (const type of ["system", "apartment", "payment"]) {
    assert.deepEqual(getNotificationRowPresentation({ type, message: "A user submitted ID documents.", data: {} }, null),
      { action: null, preview: "A user submitted ID documents." });
  }
  assert.deepEqual(getNotificationRowPresentation({ type: "message", message: "Future action", data: { event: "future" } }, null),
    { action: null, preview: "Future action" });
});

test("accessible row names retain full preview, read state and timestamp", () => {
  assert.equal(composeNotificationRowLabel({ title: "Mhart Aaron", message: "sent you a message", preview: "Hello", isRead: false,
    timestamp: "Yesterday at 7:51 PM" }), "Mhart Aaron, sent you a message, Hello, unread, Yesterday at 7:51 PM");
});

test("drops the preview when the payload has none", () => {
  assert.equal(
    composeNotificationRowLabel({
      title: "Payment received",
      message: "Rent for October is paid",
      preview: null,
      isRead: true,
    }),
    "Payment received, Rent for October is paid",
  );
});

test("keeps partial rows readable", () => {
  assert.equal(
    composeNotificationRowLabel({ title: "Payment received", isRead: true }),
    "Payment received",
  );
  assert.equal(
    composeNotificationRowLabel({
      title: "Payment received",
      message: "",
      preview: "",
      isRead: false,
    }),
    "Payment received, unread",
  );
});
