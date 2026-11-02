import assert from "node:assert/strict";
import { test } from "node:test";
import {
  apartmentHref,
  clampProfileReviewPage,
  coveredCities,
  formatDurationMonths,
  formatStayRange,
  landlordProfileHref,
  parseProfileApartmentId,
  landlordReviewsHref,
  memberSinceYear,
  ownTenantRatingsByTenancy,
  parseProfileReviewSort,
  profileDisplayName,
  profileLocation,
  profileReviewPageCount,
  PROFILE_REVIEWS_PAGE_SIZE,
  stayDurationMonths,
  summarizeListingVerification,
  summarizeReviewRatings,
  summarizeStayHistory,
  summarizeUnits,
  tenantProfileHref,
  toPastStay,
  toTenantRatingCard,
} from "./public-profile.ts";

test("profile links follow the viewer's portal and encode the id", () => {
  assert.equal(landlordProfileHref("public", "abc"), "/browse/landlords/abc");
  assert.equal(landlordProfileHref("tenant", "abc"), "/tenant/landlords/abc");
  assert.equal(tenantProfileHref("a/b"), "/landlord/tenants/a%2Fb");
  assert.equal(apartmentHref("public", "x"), "/browse/x");
  assert.equal(apartmentHref("tenant", "x"), "/tenant/browse/x");
  assert.equal(apartmentHref("landlord", "x"), "/landlord/browse/x");
  assert.equal(landlordProfileHref("landlord", "abc"), "/landlord/landlords/abc");
  assert.equal(landlordReviewsHref("landlord", "abc"), "/landlord/landlords/abc/reviews");
});

test("a profile link can carry the listing the visitor came from", () => {
  const apartment = "1b4e28ba-2fa1-4d3c-9d4e-5b1c2a3d4e5f";
  assert.equal(landlordProfileHref("tenant", "abc", apartment), `/tenant/landlords/abc?apartmentId=${apartment}`);
  assert.equal(landlordProfileHref("public", "abc", null), "/browse/landlords/abc");
  // The reviews page never inherits it.
  assert.equal(landlordReviewsHref("tenant", "abc"), "/tenant/landlords/abc/reviews");
});

test("only a single well-formed apartment id is read from the profile URL", () => {
  const apartment = "1b4e28ba-2fa1-4d3c-9d4e-5b1c2a3d4e5f";
  assert.equal(parseProfileApartmentId(apartment), apartment);
  assert.equal(parseProfileApartmentId(undefined), null);
  assert.equal(parseProfileApartmentId("not-a-uuid"), null);
  assert.equal(parseProfileApartmentId([apartment, apartment]), null);
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

test("a past stay carries its landlord, a duration, and links only to a visible listing", () => {
  const row = {
    id: "t1",
    lease_start: "2025-09-01T00:00:00+08:00",
    lease_end: "2026-03-01T00:00:00+08:00",
    apartments: {
      id: "a1",
      name: "Punturin Family 3BR",
      barangay: "Punturin",
      city: "Valenzuela",
      is_hidden_by_admin: false,
      landlord: { id: "l1", first_name: "Maria", last_name: "Santos" },
    },
  };
  const stay = toPastStay(row);
  assert.equal(stay.apartmentId, "a1");
  assert.equal(stay.location, "Punturin, Valenzuela");
  assert.equal(stay.durationLabel, "6 months");
  assert.deepEqual(stay.landlord, { id: "l1", name: "Maria Santos" });

  const hidden = toPastStay({ ...row, apartments: { ...row.apartments, is_hidden_by_admin: true } });
  assert.equal(hidden.apartmentId, null, "hidden listings render as plain text");
  assert.equal(hidden.landlord?.id, "l1");
});

test("a past stay degrades when the apartment, landlord or dates are missing", () => {
  const gone = toPastStay({ id: "t2", lease_start: null, lease_end: null, apartments: null });
  assert.equal(gone.apartmentName, "Apartment");
  assert.equal(gone.apartmentId, null);
  assert.equal(gone.landlord, null);
  assert.equal(gone.durationLabel, null);
  assert.equal(gone.stayPeriod, "Dates not available");

  const unnamed = toPastStay({
    id: "t3",
    lease_start: "2025-01-01T00:00:00+08:00",
    lease_end: null,
    apartments: {
      id: "a3", name: "Unit", barangay: null, city: null, is_hidden_by_admin: null,
      landlord: { id: "l3", first_name: null, last_name: null },
    },
  });
  assert.equal(unnamed.landlord?.name, "Landlord");
  assert.equal(unnamed.durationLabel, null, "an open lease has no length yet");
  assert.equal(unnamed.apartmentId, "a3");
});

test("review sort reads from the URL and falls back to newest first", () => {
  assert.equal(parseProfileReviewSort("highest"), "highest");
  assert.equal(parseProfileReviewSort("lowest"), "lowest");
  assert.equal(parseProfileReviewSort("recent"), "recent");
  assert.equal(parseProfileReviewSort("bogus"), "recent");
  assert.equal(parseProfileReviewSort(null), "recent");
  assert.equal(parseProfileReviewSort(undefined), "recent");
});

test("review pages cover every row and clamp out-of-range requests", () => {
  assert.equal(profileReviewPageCount(0), 1, "an empty list still reads as page 1 of 1");
  assert.equal(profileReviewPageCount(1), 1);
  assert.equal(profileReviewPageCount(PROFILE_REVIEWS_PAGE_SIZE), 1);
  assert.equal(profileReviewPageCount(PROFILE_REVIEWS_PAGE_SIZE + 1), 2);
  assert.equal(profileReviewPageCount(41), 3);
  assert.equal(profileReviewPageCount(-5), 1, "a negative count never asks for zero pages");

  assert.equal(clampProfileReviewPage(1, 41), 1);
  assert.equal(clampProfileReviewPage(3, 41), 3);
  assert.equal(clampProfileReviewPage(99, 41), 3, "a hand-typed page lands on the last page");
  assert.equal(clampProfileReviewPage(0, 41), 1);
  assert.equal(clampProfileReviewPage(-4, 41), 1);
  assert.equal(clampProfileReviewPage(Number.NaN, 41), 1);
  assert.equal(clampProfileReviewPage(2.7, 41), 2);
});

test("the reviews link keeps default params out of the URL", () => {
  assert.equal(landlordReviewsHref("public", "abc"), "/browse/landlords/abc/reviews");
  assert.equal(landlordReviewsHref("tenant", "abc"), "/tenant/landlords/abc/reviews");
  assert.equal(
    landlordReviewsHref("public", "abc", { sort: "highest" }),
    "/browse/landlords/abc/reviews?sort=highest",
  );
  assert.equal(
    landlordReviewsHref("tenant", "abc", { page: 3, sort: "lowest" }),
    "/tenant/landlords/abc/reviews?sort=lowest&page=3",
  );
  assert.equal(
    landlordReviewsHref("public", "abc", { page: 1, sort: "recent" }),
    "/browse/landlords/abc/reviews",
    "page 1 and the default sort add no query string",
  );
  assert.equal(
    landlordReviewsHref("public", "a/b", { page: 2 }),
    "/browse/landlords/a%2Fb/reviews?page=2",
  );
});

const tenantRecord = (overrides = {}) => ({
  id: "r1",
  tenancyId: "t1",
  landlordId: "l1",
  rating: 4,
  comment: "Paid on time",
  createdAt: "2026-10-01T00:00:00Z",
  landlordName: "Ana Cruz",
  landlordAvatarUrl: null,
  apartmentName: "Unit 5",
  leaseStart: "2026-01-01",
  leaseEnd: "2026-06-01",
  isMine: false,
  ...overrides,
});

test("a landlord's rating of a tenant becomes a profile review card", () => {
  const card = toTenantRatingCard(tenantRecord());
  assert.equal(card.reviewerName, "Ana Cruz");
  assert.equal(card.text, "Paid on time");
  assert.equal(card.rating, 4);
  assert.equal(card.apartmentName, "Unit 5");
  assert.equal(card.reviewerAvatar, undefined);
  assert.equal(card.stayPeriod, formatStayRange("2026-01-01", "2026-06-01"));
  assert.equal(card.isMine, false);
  assert.equal(toTenantRatingCard(tenantRecord({ isMine: true })).isMine, true);
});

test("a rating without stay dates has no stay line, and a rating-only review has empty text", () => {
  const card = toTenantRatingCard(tenantRecord({ leaseStart: null, leaseEnd: null, comment: "", landlordAvatarUrl: "a.png" }));
  assert.equal(card.stayPeriod, undefined);
  assert.equal(card.text, "");
  assert.equal(card.reviewerAvatar, "a.png");
});

test("only the signed-in landlord's own ratings are offered for editing, by tenancy", () => {
  const own = ownTenantRatingsByTenancy([
    tenantRecord({ tenancyId: "t1", isMine: true, rating: 5, comment: "" }),
    tenantRecord({ id: "r2", tenancyId: "t2", isMine: false }),
    tenantRecord({ id: "r3", tenancyId: "t3", isMine: true, comment: "Tidy" }),
  ]);
  assert.deepEqual([...own.keys()], ["t1", "t3"]);
  assert.deepEqual(own.get("t1"), { rating: 5, comment: null });
  assert.deepEqual(own.get("t3"), { rating: 4, comment: "Tidy" });
});
