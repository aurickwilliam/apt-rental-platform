import assert from "node:assert/strict";
import { test } from "node:test";

import { composeNotificationRowLabel } from "./notification-row.ts";

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
