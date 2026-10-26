import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { applyBrowseFilters, applyBrowseSort } from "../app/browse/lib/browse-query.ts";

const source = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

// A query builder that records each call and returns itself, like PostgREST's.
function recorder() {
  const calls = [];
  const builder = new Proxy({}, {
    get: (_, method) => (...args) => {
      calls.push([method, ...args]);
      return builder;
    },
  });
  return { builder, calls };
}

test("browse filters map URL params onto the shared query", () => {
  const { builder, calls } = recorder();
  applyBrowseFilters(builder, {
    locations: "Malabon,Navotas",
    price_min: "5000",
    price_max: "20000",
    bedrooms: "4+",
    verified: "1",
    amenities: "wifi,tv",
    search: "Caloocan",
  });
  assert.deepEqual(calls, [
    ["in", "city", ["Malabon", "Navotas"]],
    ["gte", "monthly_rent", 5000],
    ["lte", "monthly_rent", 20000],
    ["gte", "no_bedrooms", 4],
    ["contains", "amenities", ["wifi", "tv"]],
    ["eq", "is_verified", true],
    ["or", "name.ilike.%Caloocan%,city.ilike.%Caloocan%,barangay.ilike.%Caloocan%"],
  ]);
});

test("default budget and size bounds add no filters, and sorting ends with a stable id tiebreak", () => {
  const filtered = recorder();
  applyBrowseFilters(filtered.builder, { price_min: "1000", price_max: "50000", size_min: "10", size_max: "300" });
  assert.deepEqual(filtered.calls, []);

  const sorted = recorder();
  applyBrowseSort(sorted.builder, { sort: "price_asc" });
  assert.deepEqual(sorted.calls, [
    ["order", "monthly_rent", { ascending: true }],
    ["order", "id", { ascending: true }],
  ]);
});

test("map search reads through the same filter builders as the list, inside a bounding box", () => {
  const map = source("app/browse/lib/fetch-map-results.ts");
  assert.match(map, /applyBrowseFilters\(query, params\)/);
  assert.match(map, /applyBrowseSort\(query, params\)/);
  for (const column of ["minLat", "maxLat", "minLng", "maxLng"]) assert.match(map, new RegExp(`bbox\\.${column}`));
  assert.match(source("app/browse/lib/fetch-browse-results.ts"), /applyBrowseFilters\(query, params\)/);
});

test("both map routes exist with their own loading boundary; the tenant route authorizes first", () => {
  for (const base of ["app/browse/map", "app/tenant/browse/map"]) {
    assert.ok(existsSync(new URL(`../${base}/page.tsx`, import.meta.url)), `${base}/page.tsx`);
    assert.match(source(`${base}/loading.tsx`), /MapSearchSkeleton/);
  }
  const tenant = source("app/tenant/browse/map/page.tsx");
  assert.ok(tenant.indexOf('requirePortalViewer("tenant")') > -1);
  assert.ok(tenant.indexOf('requirePortalViewer("tenant")') < tenant.indexOf("<MapSearchClient"));
});

test("search and filter changes on the map update the URL in place instead of remounting the page", () => {
  const client = source("app/browse/map/components/MapSearchClient.tsx");
  assert.match(client, /navigate=\{replaceUrl\}/);
  // A native history update only reaches useSearchParams when it doesn't reuse the router's own state.
  assert.doesNotMatch(client, /replaceState\(window\.history\.state/);
  assert.match(client, /replaceState\(null/);
});
