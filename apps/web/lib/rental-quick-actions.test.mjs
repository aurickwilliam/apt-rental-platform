import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_RENTAL_QUICK_ACTION_IDS,
  MAX_RENTAL_QUICK_ACTIONS,
  normalizeRentalQuickActionIds,
  parseRentalQuickActions,
  rentalQuickActionsKey,
  serializeRentalQuickActions,
  toggleRentalQuickAction,
} from "./rental-quick-actions.ts";

test("nothing saved, or an unreadable value, means the default five", () => {
  for (const raw of [null, undefined, "", "nope", "[]", '{"other":1}']) {
    assert.deepEqual(parseRentalQuickActions(raw), [...DEFAULT_RENTAL_QUICK_ACTION_IDS]);
  }
  assert.equal(DEFAULT_RENTAL_QUICK_ACTION_IDS.length, MAX_RENTAL_QUICK_ACTIONS);
});

test("a saved choice keeps its order, drops unknown and repeated ids, and is capped at five", () => {
  assert.deepEqual(parseRentalQuickActions('{"ids":["profile","nope","receipts","profile"]}'), ["profile", "receipts"]);
  assert.deepEqual(parseRentalQuickActions('{"ids":[]}'), [], "an emptied card stays empty");
  assert.deepEqual(
    normalizeRentalQuickActionIds(["receipts", "repairs", "message-landlord", "signed-lease", "my-rental", "favorites"]),
    ["receipts", "repairs", "message-landlord", "signed-lease", "my-rental"],
  );
  assert.deepEqual(parseRentalQuickActions(serializeRentalQuickActions(["browse", "favorites"])), ["browse", "favorites"]);
});

test("toggling removes a chosen action, adds at the end, and refuses a sixth", () => {
  assert.deepEqual(toggleRentalQuickAction(["receipts", "repairs"], "receipts"), ["repairs"]);
  assert.deepEqual(toggleRentalQuickAction(["receipts"], "profile"), ["receipts", "profile"]);
  const full = [...DEFAULT_RENTAL_QUICK_ACTION_IDS];
  assert.deepEqual(toggleRentalQuickAction(full, "favorites"), full);
});

test("the stored choice is keyed by account", () => {
  assert.notEqual(rentalQuickActionsKey("auth-a"), rentalQuickActionsKey("auth-b"));
  assert.match(rentalQuickActionsKey("auth-a"), /auth-a$/);
});
