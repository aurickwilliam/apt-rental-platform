import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_DESCRIPTION_LENGTH,
  getDescriptionError,
} from "../../../packages/constants/src/apartment/apartment-description.ts";

test("description must not be empty", () => {
  assert.equal(getDescriptionError(""), "Apartment description is required.");
  assert.equal(getDescriptionError("   "), "Apartment description is required.");
});

test("description is limited to the shared maximum", () => {
  assert.equal(getDescriptionError("a".repeat(MAX_DESCRIPTION_LENGTH)), null);
  assert.match(getDescriptionError("a".repeat(MAX_DESCRIPTION_LENGTH + 1)) ?? "", /2,000 characters or fewer/);
});
