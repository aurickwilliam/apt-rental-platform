import assert from "node:assert/strict";
import { test } from "node:test";
import {
  apartmentHref,
  coveredCities,
  formatDurationMonths,
  formatStayRange,
  landlordProfileHref,
  memberSinceYear,
  profileDisplayName,
  profileLocation,
  stayDurationMonths,
  summarizeListingVerification,
  summarizeReviewRatings,
  summarizeStayHistory,
  summarizeUnits,
  tenantProfileHref,
} from "./public-profile.ts";

test("profile links follow the viewer's portal and encode the id", () => {
  assert.equal(landlordProfileHref("public", "abc"), "/browse/landlords/abc");
  assert.equal(landlordProfileHref("tenant", "abc"), "/tenant/landlords/abc");
  assert.equal(tenantProfileHref("a/b"), "/landlord/tenants/a%2Fb");
  assert.equal(apartmentHref("public", "x"), "/browse/x");
  assert.equal(apartmentHref("tenant", "x"), "/tenant/browse/x");
});

test("display name and location fall back cleanly", () => {
  assert.equal(profileDisplayName("Ana", "Cruz", "Landlord"), "Ana Cruz");
  assert.equal(profileDisplayName(null, "", "Landlord"), "Landlord");
  assert.equal(profileLocation("Caloocan", "Metro Manila"), "Caloocan, Metro Manila");
  assert.equal(profileLocation(null, " "), null);
});

test("member since uses the Manila year and tolerates bad input", () => {
  assert.equal(memberSinceYear("2025-12-31T17:00:00Z"), "2026");
  assert.equal(memberSinceYear("not a date"), null);
  assert.equal(memberSinceYear(null), null);
});

test("review ratings summarize into a mean and a 1–5 distribution", () => {
  const summary = summarizeReviewRatings([5, 4, 4, 3, 2, 5]);
  assert.equal(summary.average, 3.8);
  assert.equal(summary.count, 6);
  assert.deepEqual(summary.distribution, { 1: 0, 2: 1, 3: 1, 4: 2, 5: 2 });

  const empty = summarizeReviewRatings([null, undefined, 0, 6]);
  assert.equal(empty.average, null);
  assert.equal(empty.count, 0);
  assert.deepEqual(empty.distribution, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
});

test("listing verification counts only confirmed listings", () => {
  assert.deepEqual(summarizeListingVerification([true, false, true, null]), { verified: 2, total: 4 });
  assert.deepEqual(summarizeListingVerification([]), { verified: 0, total: 0 });
});

test("stay ranges read as month spans and fall back safely", () => {
  assert.equal(formatStayRange("2024-01-15T00:00:00Z", "2025-03-10T00:00:00Z"), "Jan 2024 - Mar 2025");
  assert.equal(formatStayRange("2024-01-15T00:00:00Z", null), "Jan 2024 - Present");
  assert.equal(formatStayRange(null, null), "Dates not available");
});

test("unit summary counts listed and occupied apartments", () => {
  assert.deepEqual(summarizeUnits(["available", "occupied", "unverified", "occupied"]), {
    total: 4,
    available: 2,
    occupied: 2,
  });
  assert.deepEqual(summarizeUnits([]), { total: 0, available: 0, occupied: 0 });
});

test("covered cities rank by listings, then name, and cap the list", () => {
  assert.deepEqual(coveredCities(["Navotas", " Malabon ", "Navotas", null, "Caloocan", "Malabon"]), [
    "Malabon",
    "Navotas",
    "Caloocan",
  ]);
  assert.deepEqual(coveredCities(["B", "A", "C"], 2), ["A", "B"]);
});

test("stay durations round to whole months and reject bad ranges", () => {
  assert.equal(stayDurationMonths("2024-01-01", "2025-01-01"), 12);
  assert.equal(stayDurationMonths("2024-01-01", "2024-01-05"), 1);
  assert.equal(stayDurationMonths("2024-06-01", "2024-01-01"), null);
  assert.equal(stayDurationMonths(null, "2024-01-01"), null);
});

test("duration labels and history summary read naturally", () => {
  assert.equal(formatDurationMonths(1), "1 month");
  assert.equal(formatDurationMonths(12), "1 year");
  assert.equal(formatDurationMonths(27), "2 years 3 months");
  assert.deepEqual(summarizeStayHistory([6, null, 18]), { completedStays: 3, longestStayMonths: 18 });
  assert.deepEqual(summarizeStayHistory([]), { completedStays: 0, longestStayMonths: null });
});
