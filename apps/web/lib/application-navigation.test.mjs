import assert from "node:assert/strict";
import test from "node:test";

import {
  APPLICATION_RETURN_TTL_MS,
  applicationBackTarget,
  applicationDetailHref,
  applicationListHref,
  clearApplicationReturn,
  filterApplicationList,
  parseApplicationListFilters,
  parseApplicationSort,
  parseApplicationStatuses,
  readApplicationReturn,
  rememberApplicationReturn,
  safeApplicationReturnPath,
  takeApplicationReturnScroll,
} from "./application-navigation.ts";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    size: () => values.size,
  };
}

test("filter and sort URL values accept only real APT application states", () => {
  assert.deepEqual(parseApplicationStatuses("approved,pending,approved,unknown"), ["pending", "approved"]);
  assert.deepEqual(parseApplicationStatuses("Closed, rejected"), ["rejected", "closed"]);
  assert.deepEqual(parseApplicationStatuses(null), []);
  assert.deepEqual(parseApplicationStatuses(""), []);

  assert.equal(parseApplicationSort("oldest"), "oldest");
  assert.equal(parseApplicationSort("newest"), "newest");
  assert.equal(parseApplicationSort("sideways"), "pending_first");
  assert.equal(parseApplicationSort(null), "pending_first");

  assert.deepEqual(
    parseApplicationListFilters("?applicationStatus=pending,approved&applicationSort=newest"),
    { statuses: ["pending", "approved"], sort: "newest" },
  );
  assert.deepEqual(parseApplicationListFilters("?applicationStatus=bogus"), {
    statuses: [],
    sort: "pending_first",
  });
});

test("My Applications filter links round-trip and keep unrelated URL state", () => {
  const defaults = { statuses: [], sort: "pending_first" };
  assert.equal(applicationListHref(defaults), "/tenant/my-rental");
  assert.deepEqual(
    parseApplicationListFilters(
      applicationListHref({ statuses: ["pending", "approved"], sort: "oldest" }),
    ),
    { statuses: ["pending", "approved"], sort: "oldest" },
  );
  assert.equal(
    applicationListHref({ statuses: ["pending"], sort: "oldest" }, "?notifications=open&applicationStatus=approved"),
    "/tenant/my-rental?notifications=open&applicationStatus=pending&applicationSort=oldest",
  );
  assert.equal(
    applicationListHref(defaults, "?notifications=open&applicationStatus=approved&applicationSort=newest"),
    "/tenant/my-rental?notifications=open",
  );
});

test("detail links carry a validated list return target and no open redirect", () => {
  const href = applicationDetailHref({
    applicationId: "application id",
    apartmentId: "apartment",
    returnHref: "/tenant/my-rental?applicationStatus=pending",
  });
  assert.equal(
    href,
    "/tenant/applications/application%20id?apartmentId=apartment&from=%2Ftenant%2Fmy-rental%3FapplicationStatus%3Dpending",
  );

  for (const unsafe of [
    "https://evil.test/tenant/my-rental",
    "//evil.test/tenant/my-rental",
    "/browse/apartment",
    "/tenant/my-rental/../admin",
    "tenant/my-rental",
    "\\tenant\\my-rental",
    "/tenant/my-rental\n",
    "/tenant/my-rental?applicationStatus=bogus",
    "/tenant/applications/application",
  ]) {
    assert.equal(safeApplicationReturnPath(unsafe), "/tenant/my-rental", unsafe);
  }
  assert.equal(
    safeApplicationReturnPath("/tenant/my-rental?applicationSort=oldest&applicationStatus=closed"),
    "/tenant/my-rental?applicationStatus=closed&applicationSort=oldest",
  );
  assert.equal(safeApplicationReturnPath(null), "/tenant/my-rental");
});

test("the detail Back action uses history only for a fresh marker from the list", () => {
  const storage = memoryStorage();
  rememberApplicationReturn("application", "/tenant/my-rental?applicationStatus=pending", {
    storage,
    now: 1_000,
    scrollY: 420.6,
  });
  const marker = readApplicationReturn({ storage });
  assert.deepEqual(marker, {
    applicationId: "application",
    href: "/tenant/my-rental?applicationStatus=pending",
    at: 1_000,
    scrollY: 421,
  });

  assert.deepEqual(applicationBackTarget({ applicationId: "application", marker, now: 1_001 }), {
    kind: "history",
  });
  assert.deepEqual(
    applicationBackTarget({
      applicationId: "application",
      marker,
      now: 1_001,
      canGoBack: false,
      from: "/tenant/my-rental?applicationStatus=pending",
    }),
    { kind: "href", href: "/tenant/my-rental?applicationStatus=pending" },
  );
  assert.deepEqual(
    applicationBackTarget({
      applicationId: "application",
      marker,
      now: 1_001,
      from: "/tenant/my-rental?applicationStatus=approved",
    }),
    { kind: "href", href: "/tenant/my-rental?applicationStatus=approved" },
  );
  assert.deepEqual(
    applicationBackTarget({
      applicationId: "another-application",
      marker,
      now: 1_001,
      from: "/tenant/my-rental?applicationSort=newest",
    }),
    { kind: "href", href: "/tenant/my-rental?applicationSort=newest" },
  );
  assert.deepEqual(
    applicationBackTarget({
      applicationId: "application",
      marker,
      now: 1_000 + APPLICATION_RETURN_TTL_MS + 1,
    }),
    { kind: "href", href: "/tenant/my-rental?applicationStatus=pending" },
  );
  assert.deepEqual(
    applicationBackTarget({ applicationId: "application", marker: null, from: "https://evil.test" }),
    { kind: "href", href: "/tenant/my-rental" },
  );
});

test("list scroll restoration is one-shot and ignores other filtered views", () => {
  const storage = memoryStorage();
  rememberApplicationReturn("application", "/tenant/my-rental?applicationStatus=pending", {
    storage,
    now: 1_000,
    scrollY: 420,
  });

  assert.equal(
    takeApplicationReturnScroll("/tenant/my-rental?applicationStatus=approved", {
      storage,
      now: 2_000,
    }),
    null,
  );
  assert.equal(readApplicationReturn({ storage }).scrollY, 420);
  assert.equal(
    takeApplicationReturnScroll("/tenant/my-rental?applicationStatus=pending", {
      storage,
      now: 2_000,
    }),
    420,
  );
  assert.equal(readApplicationReturn({ storage }), null);
  assert.equal(
    takeApplicationReturnScroll("/tenant/my-rental?applicationStatus=pending", {
      storage,
      now: 2_001,
    }),
    null,
  );

  rememberApplicationReturn("application", "/tenant/my-rental", { storage, now: 5_000, scrollY: 10 });
  assert.equal(
    takeApplicationReturnScroll("/tenant/my-rental", {
      storage,
      now: 5_000 + APPLICATION_RETURN_TTL_MS + 1,
    }),
    null,
  );
  assert.equal(readApplicationReturn({ storage }), null);
});

test("application filtering keeps every real status and the existing ordering", () => {
  const applications = [
    { id: "approved", status: "approved", created_at: "2026-10-20T00:00:00Z" },
    { id: "pending-old", status: "pending", created_at: "2026-10-22T00:00:00Z" },
    { id: "pending-new", status: "pending", created_at: "2026-10-24T00:00:00Z" },
    { id: "rejected", status: "rejected", created_at: "2026-10-21T00:00:00Z" },
    { id: "cancelled", status: "cancelled", created_at: "2026-10-19T00:00:00Z" },
    { id: "closed", status: "closed", created_at: "2026-10-18T00:00:00Z" },
  ];
  const ids = (filters) => filterApplicationList(applications, filters).map((row) => row.id);

  assert.deepEqual(ids({ statuses: [], sort: "pending_first" }), [
    "pending-new",
    "pending-old",
    "rejected",
    "approved",
    "cancelled",
    "closed",
  ]);
  assert.deepEqual(ids({ statuses: [], sort: "newest" }), [
    "pending-new",
    "pending-old",
    "rejected",
    "approved",
    "cancelled",
    "closed",
  ]);
  assert.deepEqual(ids({ statuses: [], sort: "oldest" }), [
    "closed",
    "cancelled",
    "approved",
    "rejected",
    "pending-old",
    "pending-new",
  ]);
  assert.deepEqual(ids({ statuses: ["pending", "closed"], sort: "oldest" }), [
    "closed",
    "pending-old",
    "pending-new",
  ]);
  // Filtering never reorders or mutates the caller-owned array.
  assert.deepEqual(applications.map((row) => row.id), [
    "approved",
    "pending-old",
    "pending-new",
    "rejected",
    "cancelled",
    "closed",
  ]);
});

test("stored navigation markers recover from malformed or unavailable storage", () => {
  const storage = memoryStorage();
  storage.setItem("apt-application-return:v1", "{not json");
  assert.equal(readApplicationReturn({ storage }), null);
  clearApplicationReturn({ storage });
  assert.equal(storage.size(), 0);
  assert.equal(readApplicationReturn({ storage: { getItem() { throw new Error("blocked"); }, setItem() {}, removeItem() {} } }), null);
});
