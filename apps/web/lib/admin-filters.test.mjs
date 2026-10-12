import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildListHref,
  formatOptionLabels,
  formatResultRange,
  parseIsoDate,
  parseListParam,
  parseOption,
  resolveJoinedRange,
  sortDescriptorFor,
  sortForColumn,
} from "./admin-filters.ts";

const SORTS = [
  { id: "newest", label: "Newest", column: "joined", direction: "descending" },
  { id: "oldest", label: "Oldest", column: "joined", direction: "ascending" },
  { id: "updated", label: "Recently updated" },
];

test("parseOption falls back on unknown values", () => {
  assert.equal(parseOption("pending", ["all", "pending"], "all"), "pending");
  assert.equal(parseOption("drop table", ["all", "pending"], "all"), "all");
  assert.equal(parseOption(undefined, ["all", "pending"], "all"), "all");
});

test("parseListParam keeps allowed, trimmed, unique values", () => {
  assert.deepEqual(
    parseListParam(" tenant,admin,hacker,tenant ", ["tenant", "landlord", "admin"]),
    ["tenant", "admin"],
  );
  assert.deepEqual(parseListParam("", ["tenant"]), []);
  assert.deepEqual(parseListParam(undefined, ["tenant"]), []);
});

test("parseIsoDate rejects malformed and rolled-over dates", () => {
  assert.equal(parseIsoDate("2026-10-12"), "2026-10-12");
  assert.equal(parseIsoDate("2026-02-31"), null);
  assert.equal(parseIsoDate("2026-1-5"), null);
  assert.equal(parseIsoDate("yesterday"), null);
  assert.equal(parseIsoDate(undefined), null);
});

test("resolveJoinedRange handles presets relative to now", () => {
  const now = new Date("2026-10-12T00:00:00Z");
  assert.equal(resolveJoinedRange("any", null, null, now), null);
  assert.deepEqual(resolveJoinedRange("7d", null, null, now), {
    from: "2026-10-05T00:00:00.000Z",
  });
});

test("resolveJoinedRange makes custom ranges inclusive in Manila time", () => {
  assert.deepEqual(resolveJoinedRange("custom", "2026-10-01", "2026-10-31"), {
    from: "2026-10-01T00:00:00+08:00",
    before: "2026-11-01T00:00:00+08:00",
  });
});

test("resolveJoinedRange ignores incomplete or reversed custom ranges", () => {
  assert.equal(resolveJoinedRange("custom", "2026-10-01", null), null);
  assert.equal(resolveJoinedRange("custom", "2026-10-31", "2026-10-01"), null);
});

test("sort helpers map between sort keys and column headers", () => {
  assert.deepEqual(sortDescriptorFor(SORTS, "oldest"), {
    column: "joined",
    direction: "ascending",
  });
  assert.equal(sortDescriptorFor(SORTS, "updated"), undefined);
  assert.equal(sortForColumn(SORTS, "joined", "descending"), "newest");
  assert.equal(sortForColumn(SORTS, "name", "ascending"), undefined);
});

test("buildListHref drops empty values and joins arrays", () => {
  assert.equal(
    buildListHref("/admin/users", {
      q: "  ana ",
      role: ["tenant", "admin"],
      access: "",
      joined: undefined,
      page: 2,
    }),
    "/admin/users?q=ana&role=tenant%2Cadmin&page=2",
  );
  assert.equal(buildListHref("/admin/users", { role: [] }), "/admin/users");
});

test("formatResultRange describes the visible slice", () => {
  assert.equal(formatResultRange(1, 30, 124, "users"), "Showing 1–30 of 124 users");
  assert.equal(formatResultRange(5, 30, 124, "users"), "Showing 121–124 of 124 users");
  assert.equal(formatResultRange(1, 30, 0, "users"), "No users found");
});

test("formatOptionLabels lists selected labels in option order", () => {
  const options = [
    { id: "tenant", label: "Tenant" },
    { id: "landlord", label: "Landlord" },
    { id: "admin", label: "Administrator" },
  ];
  assert.equal(formatOptionLabels(options, ["admin", "tenant"]), "Tenant, Administrator");
  assert.equal(formatOptionLabels(options, []), "");
});
