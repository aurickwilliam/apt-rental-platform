import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { isApartmentUnavailable } from "./apartment-availability.ts";

test("occupied and maintenance units cannot start an application from details", () => {
  for (const status of ["occupied", "under_maintenance"]) {
    assert.equal(isApartmentUnavailable(status), true);
  }
  for (const status of ["available", "unverified", null, undefined]) {
    assert.equal(isApartmentUnavailable(status), false);
  }
});

// Query-contract checks cover server components without adding a React renderer
// or loading Next's server-only Supabase client into the node:test runner.
for (const [path, expectedStatusFilter] of [
  ["../app/browse/lib/fetch-browse-results.ts", /\.in\("status", \["available", "unverified"\]\)/],
  ["../app/browse/lib/fetch-map-results.ts", /\.in\("status", \["available", "unverified"\]\)/],
  ["../app/browse/lib/fetch-browse-sections.ts", /\.in\("status", \["available", "unverified"\]\)/],
  ["../app/(main)/page.tsx", /\.eq\("status", "available"\)/],
  ["../app/browse/[apartmentId]/components/ApartmentDetailView.tsx", /\.in\("status", \["available", "unverified"\]\)/],
]) {
  test(`${path} filters discovery before pagination/counting`, () => {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(source, expectedStatusFilter);
  });
}

test("detail lookup and saved favorites remain independent of discovery availability", () => {
  const detail = readFileSync(new URL("../app/browse/[apartmentId]/components/ApartmentDetailView.tsx", import.meta.url), "utf8");
  const lookup = detail.slice(0, detail.indexOf("const user ="));
  assert.doesNotMatch(lookup, /\.in\(["']status["']/);
  const favorites = readFileSync(new URL("../service/favoritesService.ts", import.meta.url), "utf8");
  assert.doesNotMatch(favorites, /\.in\(["']status["']/);
});
