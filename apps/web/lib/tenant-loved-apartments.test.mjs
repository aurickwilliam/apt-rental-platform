import assert from "node:assert/strict";
import { test } from "node:test";

import {
  rankTenantLovedApartments,
  REVIEW_CONFIDENCE_THRESHOLD,
} from "./tenant-loved-apartments.ts";

const apartment = (id, average_rating, no_ratings, created_at) => ({
  id,
  average_rating,
  no_ratings,
  created_at,
});

test("a well-reviewed apartment outranks one with only a single perfect rating", () => {
  const ranked = rankTenantLovedApartments([
    apartment("single-perfect", 5, 1, "2026-10-01T00:00:00.000Z"),
    apartment("proven-favorite", 4.7, 20, "2026-09-01T00:00:00.000Z"),
    apartment("market-baseline", 4.5, 100, "2026-08-01T00:00:00.000Z"),
  ]);

  assert.equal(ranked[0].id, "proven-favorite");
  assert.equal(REVIEW_CONFIDENCE_THRESHOLD, 5);
});

test("newest eligible apartments fill slots after reviewed listings", () => {
  const ranked = rankTenantLovedApartments([
    apartment("reviewed", 4.5, 4, "2026-08-01T00:00:00.000Z"),
    apartment("older-unreviewed", null, 0, "2026-09-01T00:00:00.000Z"),
    apartment("newer-unreviewed", null, 0, "2026-10-01T00:00:00.000Z"),
  ]);

  assert.deepEqual(ranked.map(({ id }) => id), [
    "reviewed",
    "newer-unreviewed",
    "older-unreviewed",
  ]);
});
