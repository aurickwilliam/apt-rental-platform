import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), "utf8");

const perkIds = (source) => new Set([...source.matchAll(/\bid:\s*"([a-z_]+)"/g)].map((match) => match[1]));

const webIds = perkIds(read("../app/components/inputs/perks.ts"));
const mobileIds = perkIds(read("../../mobile/constants/perks.ts"));

// The migration that owns the database list (guard_apartment_amenities).
const migration = read("../../../supabase/migrations/20261031120000_listing_data_guards.sql");
const catalogBlock = migration.match(/v_catalog constant text\[\] := array\[([\s\S]*?)\];/);
const databaseIds = new Set(catalogBlock ? [...catalogBlock[1].matchAll(/'([a-z_]+)'/g)].map((match) => match[1]) : []);

test("the database amenity list is found and is not empty", () => {
  assert.ok(databaseIds.size > 0, "could not read v_catalog from the migration");
});

test("every amenity the mobile picker offers is accepted by the database", () => {
  const missing = [...mobileIds].filter((id) => !databaseIds.has(id));
  assert.deepEqual(missing, [], `add to guard_apartment_amenities: ${missing.join(", ")}`);
});

test("every amenity the web picker offers is accepted by the database", () => {
  const missing = [...webIds].filter((id) => !databaseIds.has(id));
  assert.deepEqual(missing, [], `add to guard_apartment_amenities: ${missing.join(", ")}`);
});

test("the database does not list amenities that neither picker offers", () => {
  const extra = [...databaseIds].filter((id) => !mobileIds.has(id) && !webIds.has(id));
  assert.deepEqual(extra, [], `remove from guard_apartment_amenities: ${extra.join(", ")}`);
});

test("the web catalog is a subset of the mobile catalog", () => {
  const webOnly = [...webIds].filter((id) => !mobileIds.has(id));
  assert.deepEqual(webOnly, [], `web offers amenities mobile lacks: ${webOnly.join(", ")}`);
});
