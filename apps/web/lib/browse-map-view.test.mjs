import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_MAP_VIEW,
  browseFilterParams,
  filterParamsKey,
  filtersFromKey,
  mapViewParams,
  parseMapView,
} from "../app/browse/lib/map-view.ts";

const params = (query) => new URLSearchParams(query);

test("camera round-trips through the URL", () => {
  const view = { lat: 14.65432, lng: 120.98765, zoom: 15 };
  assert.deepEqual(parseMapView(params(mapViewParams(view))), view);
});

test("missing or invalid camera params fall back to the default view", () => {
  assert.deepEqual(parseMapView(params("")), DEFAULT_MAP_VIEW);
  assert.deepEqual(parseMapView(params("lat=abc&lng=120.9")), DEFAULT_MAP_VIEW);
  assert.deepEqual(parseMapView(params("lat=14.6")), DEFAULT_MAP_VIEW, "both coordinates are required");
  assert.deepEqual(parseMapView(params("lat=95&lng=120.9&z=12")), DEFAULT_MAP_VIEW, "out-of-range latitude");
});

test("zoom is clamped and defaults when absent", () => {
  assert.equal(parseMapView(params("lat=14.6&lng=120.9")).zoom, DEFAULT_MAP_VIEW.zoom);
  assert.equal(parseMapView(params("lat=14.6&lng=120.9&z=99")).zoom, 21);
  assert.equal(parseMapView(params("lat=14.6&lng=120.9&z=0")).zoom, 3);
});

test("filters drop the camera and paging but keep every other param", () => {
  const filters = browseFilterParams(
    params("lat=14.6&lng=120.9&z=14&page=3&search=Caloocan&verified=1&locations=Malabon,Navotas"),
  );
  assert.deepEqual(filters, { search: "Caloocan", verified: "1", locations: "Malabon,Navotas" });
});

test("filter keys round-trip, including values with reserved characters", () => {
  const filters = { search: "A&B = C", locations: "Malabon,Navotas" };
  assert.deepEqual(filtersFromKey(filterParamsKey(filters)), filters);
});

test("filter keys ignore param order", () => {
  assert.equal(
    filterParamsKey({ verified: "1", search: "a" }),
    filterParamsKey({ search: "a", verified: "1" }),
  );
  assert.notEqual(filterParamsKey({ search: "a" }), filterParamsKey({ search: "b" }));
});
