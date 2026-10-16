import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getConflictingAmenities,
  isRetiredAmenity,
  toggleAmenitySelection,
} from "../../../packages/constants/src/apartment/amenity-rules.ts";

test("picking one side of a conflict turns the other off", () => {
  assert.deepEqual(toggleAmenitySelection(["wifi", "nonsmoking"], "smoking"), ["wifi", "smoking"]);
  assert.deepEqual(toggleAmenitySelection(["smoking"], "nonsmoking"), ["nonsmoking"]);
  assert.deepEqual(
    toggleAmenitySelection(["kitchen", "stove", "wifi", "kettle"], "no_cooking"),
    ["wifi", "no_cooking"],
  );
  assert.deepEqual(toggleAmenitySelection(["no_cooking", "wifi"], "microwave"), ["wifi", "microwave"]);
});

test("toggling a selected amenity removes only it", () => {
  assert.deepEqual(toggleAmenitySelection(["wifi", "kitchen"], "kitchen"), ["wifi"]);
});

test("unrelated amenities are untouched", () => {
  assert.deepEqual(toggleAmenitySelection(["kitchen"], "wifi"), ["kitchen", "wifi"]);
  assert.deepEqual(getConflictingAmenities("wifi"), []);
});

test("the Furnished perk is retired", () => {
  assert.equal(isRetiredAmenity("furniture"), true);
  assert.equal(isRetiredAmenity("wifi"), false);
});
