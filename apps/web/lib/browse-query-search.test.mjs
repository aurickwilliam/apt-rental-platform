import assert from "node:assert/strict";
import test from "node:test";
import { compile } from "./test-support/hook-runtime.mjs";

const { applyBrowseFilters, applyBrowseSort, searchPattern } = compile(
  "app/browse/lib/browse-query.ts",
  {},
);

function recorder() {
  const calls = [];
  const q = new Proxy(
    {},
    { get: (_, name) => (...args) => (calls.push([name, ...args]), q) },
  );
  return { q, calls };
}

test("search text with commas and brackets stays inside one quoted pattern", () => {
  assert.equal(searchPattern("Tonsuya, Malabon"), '"%Tonsuya, Malabon%"');
  assert.equal(searchPattern("a)"), '"%a)%"');
});

test("quotes, backslashes and LIKE wildcards are escaped", () => {
  assert.equal(searchPattern('5" 100%'), '"%5\\" 100\\\\%%"');
  assert.equal(searchPattern("a_b"), '"%a\\\\_b%"');
});

test("the or filter uses the quoted pattern for all three columns", () => {
  const { q, calls } = recorder();
  applyBrowseFilters(q, { search: "Tonsuya, Malabon" });
  const p = '"%Tonsuya, Malabon%"';
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0])), [
    "or",
    `name.ilike.${p},city.ilike.${p},barangay.ilike.${p}`,
  ]);
});

test("most popular puts unrated listings last", () => {
  const { q, calls } = recorder();
  applyBrowseSort(q, { sort: "most_popular" });
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0])), [
    "order",
    "average_rating",
    { ascending: false, nullsFirst: false },
  ]);
});
