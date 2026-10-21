import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_NOTIFICATION_DISPLAY,
  NOTIFICATION_DISPLAY_STORAGE_KEY,
  parseNotificationDisplay,
  readNotificationDisplayRaw,
  saveNotificationDisplay,
} from "./notification-display-preferences.ts";

const memoryStorage = (initial = {}) => {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};

test("defaults to the floating bell opening from the right", () => {
  assert.deepEqual(DEFAULT_NOTIFICATION_DISPLAY, { entry: "bell", drawerSide: "right" });
  assert.deepEqual(parseNotificationDisplay(null), DEFAULT_NOTIFICATION_DISPLAY);
});

test("round-trips stored preferences", () => {
  const storage = memoryStorage();
  assert.equal(saveNotificationDisplay({ entry: "sidebar", drawerSide: "left" }, storage), true);
  assert.deepEqual(parseNotificationDisplay(readNotificationDisplayRaw(storage)), { entry: "sidebar", drawerSide: "left" });
});

test("ignores corrupt, partial and unknown values", () => {
  assert.deepEqual(parseNotificationDisplay("{nope"), DEFAULT_NOTIFICATION_DISPLAY);
  assert.deepEqual(parseNotificationDisplay("null"), DEFAULT_NOTIFICATION_DISPLAY);
  assert.deepEqual(parseNotificationDisplay(JSON.stringify({ entry: "toast", drawerSide: "top" })), DEFAULT_NOTIFICATION_DISPLAY);
  assert.deepEqual(parseNotificationDisplay(JSON.stringify({ entry: "sidebar" })), { entry: "sidebar", drawerSide: "right" });
});

test("survives unavailable or throwing storage", () => {
  assert.equal(saveNotificationDisplay(DEFAULT_NOTIFICATION_DISPLAY, null), false);
  const throwing = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
  assert.equal(saveNotificationDisplay(DEFAULT_NOTIFICATION_DISPLAY, throwing), false);
  assert.equal(readNotificationDisplayRaw(throwing), null);
  assert.equal(NOTIFICATION_DISPLAY_STORAGE_KEY, "apt-notifications-display:v1");
});
