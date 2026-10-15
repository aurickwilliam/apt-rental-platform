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
for (const path of [
  "../app/browse/lib/fetch-browse-results.ts",
  "../app/browse/lib/fetch-browse-sections.ts",
  "../app/(main)/page.tsx",
  "../app/browse/[apartmentId]/components/ApartmentDetailView.tsx",
]) {
  test(`${path} filters discovery before pagination/counting`, () => {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(source, /\.in\("status", \["available", "unverified"\]\)/);
  });
}

test("detail lookup and saved favorites remain independent of discovery availability", () => {
  const detail = readFileSync(new URL("../app/browse/[apartmentId]/components/ApartmentDetailView.tsx", import.meta.url), "utf8");
  const lookup = detail.slice(0, detail.indexOf("const user ="));
  assert.doesNotMatch(lookup, /\.in\(["']status["']/);
  const favorites = readFileSync(new URL("../service/favoritesService.ts", import.meta.url), "utf8");
  assert.doesNotMatch(favorites, /\.in\(["']status["']/);
});
