import assert from "node:assert/strict";
import test from "node:test";
import { compile } from "./test-support/hook-runtime.mjs";

const { propertyStatusLabel, canChangeListingVisibility } = compile("lib/property-listing-visibility.ts", {});
const { changePropertyVisibility } = compile("service/propertyVisibilityService.ts", {});
const { applyVisibleListings } = compile("app/browse/lib/browse-query.ts", {});

test("only vacant available/maintenance properties offer visibility actions", () => {
  assert.equal(canChangeListingVisibility("available", false), true);
  assert.equal(canChangeListingVisibility("under_maintenance", false), true);
  for (const status of ["occupied", "unverified", "unknown", ""]) {
    assert.equal(canChangeListingVisibility(status, false), false);
  }
  for (const status of ["available", "under_maintenance", "occupied"]) {
    assert.equal(canChangeListingVisibility(status, true), false);
  }
  assert.equal(propertyStatusLabel("under_maintenance"), "Hidden · Under maintenance");
  assert.equal(propertyStatusLabel("occupied"), "occupied");
});

function client(result) {
  const calls = [];
  const builder = {};
  for (const name of ["from", "update", "eq", "is", "select"]) {
    builder[name] = (...args) => { calls.push([name, ...args]); return builder; };
  }
  builder.maybeSingle = async () => result;
  return { builder, calls };
}

test("hide and show write only status, conditional on the previously read status", async () => {
  for (const [before, after] of [["available", "under_maintenance"], ["under_maintenance", "available"]]) {
    const { builder, calls } = client({ data: { status: after }, error: null });
    const result = await changePropertyVisibility(builder, "unit", before);
    assert.equal(result.success, true);
    assert.equal(result.status, after);
    assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
      ["from", "apartments"], ["update", { status: after }], ["eq", "id", "unit"],
      ["eq", "status", before], ["is", "deleted_at", null], ["select", "status"],
    ]);
  }
});

test("refused writes preserve database messages; stale and inaccessible rows are not successes", async () => {
  const refused = client({ data: null, error: { message: "This property has an active tenancy." } });
  const failure = await changePropertyVisibility(refused.builder, "unit", "available");
  assert.equal(failure.success, false);
  assert.equal(failure.error, "This property has an active tenancy.");
  const stale = client({ data: null, error: null });
  const result = await changePropertyVisibility(stale.builder, "unit", "under_maintenance");
  assert.equal(result.success, false);
  assert.match(result.error, /Refresh the page/);
});

test("browse discovery excludes maintenance and occupied properties without overriding admin visibility", () => {
  const calls = [];
  const builder = {};
  for (const name of ["is", "eq", "in"]) {
    builder[name] = (...args) => { calls.push([name, ...args]); return builder; };
  }
  applyVisibleListings(builder);
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    ["is", "deleted_at", null], ["eq", "is_hidden_by_admin", false], ["in", "status", ["available", "unverified"]],
  ]);
});
