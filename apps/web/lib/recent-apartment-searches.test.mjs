import assert from "node:assert/strict";
import test from "node:test";
import {
  addRecentApartmentSearch,
  parseRecentApartmentSearches,
  recentApartmentHref,
  recentApartmentSearchesKey,
} from "./recent-apartment-searches.ts";

const make = id => ({ id, name: `Unit ${id}`, location: "Barangay, City" });

test("newest first, older copy dropped", () => {
  const result = addRecentApartmentSearch([make("a"), make("b")], make("b"));
  assert.deepEqual(result.map(item => item.id), ["b", "a"]);
});

test("keeps only the newest five", () => {
  const result = addRecentApartmentSearch(["1", "2", "3", "4", "5"].map(make), make("6"));
  assert.deepEqual(result.map(item => item.id), ["6", "1", "2", "3", "4"]);
});

test("ignores malformed storage", () => {
  assert.deepEqual(parseRecentApartmentSearches("nope"), []);
  assert.deepEqual(parseRecentApartmentSearches('[{"id":1},{"id":"a","name":"A","location":"L"}]').map(i => i.id), ["a"]);
});

test("guest and account lists are separate", () => {
  assert.notEqual(recentApartmentSearchesKey(null), recentApartmentSearchesKey("u1"));
});

test("listing links never include the map segment", () => {
  assert.equal(recentApartmentHref("/browse", "x"), "/browse/x");
  assert.equal(recentApartmentHref("/browse/map", "x"), "/browse/x");
  assert.equal(recentApartmentHref("/tenant/browse/map", "x"), "/tenant/browse/x");
});
