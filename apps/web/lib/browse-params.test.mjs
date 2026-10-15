import assert from "node:assert/strict";
import { test } from "node:test";
import { isDefaultBrowseParams } from "../app/browse/lib/browse-params.ts";

test("no params and page 1 are the default discovery state", () => {
  assert.equal(isDefaultBrowseParams({}), true);
  assert.equal(isDefaultBrowseParams({ page: "1" }), true);
  assert.equal(isDefaultBrowseParams({ search: "" }), true);
});

test("search, filters and paging switch to the results grid", () => {
  assert.equal(isDefaultBrowseParams({ search: "parada" }), false);
  assert.equal(isDefaultBrowseParams({ verified: "1" }), false);
  assert.equal(isDefaultBrowseParams({ price_max: "10000" }), false);
  assert.equal(isDefaultBrowseParams({ page: "2" }), false);
});
