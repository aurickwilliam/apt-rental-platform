import assert from "node:assert/strict";
import { test } from "node:test";
import { APARTMENT_FLOOR_AREA } from "../../../packages/constants/src/apartment/apartment-floor-area.ts";
import { APARTMENT_ROOM_LIMITS } from "../../../packages/constants/src/apartment/apartment-room-limits.ts";

test("Studio limits match the mobile listing rules", () => {
  assert.deepEqual(APARTMENT_ROOM_LIMITS.Studio, {
    bathrooms: { min: 1, max: 1 },
    bedrooms: { min: 1, max: 1 },
    maxOccupants: { min: 1, max: 2 },
  });
  assert.deepEqual(APARTMENT_FLOOR_AREA.Studio, { min: 18, max: 40 });
});
