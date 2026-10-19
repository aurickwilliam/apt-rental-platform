import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { applicationSummary, applicationStatusLabel, filterApplicationList, sortApplicationList } from "../app/landlord/applications/lib/application-list.ts";

const rows = [
  { id: "a", apartment_id: "p1", tenant_name: "Alice", tenant_email: "alice@example.test", apartment_name: "Cove", apartment_city: "Caloocan", apartment_address: "First St", created_at: "2026-10-18T00:00:00Z", status: "Applied" },
  { id: "b", apartment_id: "p2", tenant_name: "Ben", apartment_name: "Studio", apartment_city: "Malabon", apartment_address: "Second St", created_at: "2026-10-01T00:00:00Z", status: "Approved" },
  { id: "c", apartment_id: "p1", tenant_name: "Cara", apartment_name: "Cove", apartment_city: "Caloocan", apartment_address: "First St", created_at: "2026-01-01T00:00:00Z", status: "Rejected" },
  { id: "d", apartment_id: "p2", tenant_name: "Dan", apartment_name: "Studio", apartment_city: "Malabon", apartment_address: "Second St", created_at: "2026-09-01T00:00:00Z", status: "Cancelled" },
];
const filters = { search: "", status: "All", city: "All", property: "All", days: "All" };
const now = Date.parse("2026-10-19T00:00:00Z");

test("Application summaries include cancelled records in the total and map Applied to Pending only for display", () => {
  assert.deepEqual(applicationSummary(rows), { total: 4, approved: 1, rejected: 1, pending: 1 });
  assert.equal(applicationStatusLabel("Applied"), "Pending");
  assert.equal(applicationStatusLabel("Cancelled"), "Cancelled");
});

test("Application search and filters combine tenant/property/location/date without mutating the records", () => {
  assert.deepEqual(filterApplicationList(rows, { ...filters, search: " FIRST st " }).map(row => row.id), ["a", "c"]);
  assert.deepEqual(filterApplicationList(rows, { ...filters, search: "alice@example" }).map(row => row.id), ["a"]);
  assert.deepEqual(filterApplicationList(rows, { ...filters, city: "Malabon", property: "p2", status: "Approved", days: "30" }, now).map(row => row.id), ["b"]);
  assert.deepEqual(filterApplicationList(rows, { ...filters, days: "7" }, now).map(row => row.id), ["a"]);
  assert.deepEqual(filterApplicationList(rows, { ...filters, days: "90" }, now).map(row => row.id), ["a", "b", "d"]);
  assert.equal(filterApplicationList(rows, { ...filters, property: "missing" }).length, 0);
  assert.deepEqual(rows.map(row => row.id), ["a", "b", "c", "d"]);
});

test("Application list sorting follows submission date, names, locations and displayed statuses", () => {
  assert.deepEqual(sortApplicationList(rows, { column: "created_at", direction: "descending" }).map(row => row.id), ["a", "b", "d", "c"]);
  assert.deepEqual(sortApplicationList(rows, { column: "tenant_name", direction: "descending" }).map(row => row.id), ["d", "c", "b", "a"]);
  assert.deepEqual(sortApplicationList(rows, { column: "status", direction: "ascending" }).map(row => row.id), ["b", "d", "a", "c"]);
  assert.deepEqual(sortApplicationList(rows, { column: "apartment_name", direction: "ascending" }).map(row => row.id), ["a", "c", "b", "d"]);
});

test("Applications query retrieves one cover-first thumbnail per property and retains rows with no photos", async () => {
  const calls = [];
  const query = {
    select(value) { calls.push(["select", value]); return this; },
    order(...args) { calls.push(["order", ...args]); return this; },
    limit(...args) { calls.push(["limit", ...args]); return this; },
    then(resolve, reject) { return Promise.resolve({ data: [
      { id: "a", status: "pending", apartments: { name: "Cove", apartment_images: [{ url: "/full.jpg", url_thumb: "/thumb.jpg" }] }, users: {} },
      { id: "b", status: "cancelled", apartments: { name: "Studio", apartment_images: [] }, users: {} },
    ], error: null }).then(resolve, reject); },
  };
  const source = readFileSync(new URL("../service/landlordApplicationsService.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {}, require: name => {
    if (name === "@repo/supabase/browser") return { createClient: () => ({ from: table => { calls.push(["from", table]); return query; } }) };
    if (name === "@repo/utils") return { formatAddress: () => "Address" };
    throw new Error(`Unexpected import: ${name}`);
  } };
  vm.runInNewContext(compiled, context);
  const result = await context.exports.fetchLandlordApplications();
  assert.equal(result[0].apartment_thumbnail_url, "/thumb.jpg");
  assert.equal(result[1].apartment_thumbnail_url, null);
  assert.equal(result[1].status, "Cancelled");
  const limit = calls.find(call => call[0] === "limit");
  assert.equal(limit[1], 1);
  assert.equal(limit[2].referencedTable, "apartments.apartment_images");
  assert.ok(calls.some(call => call[0] === "order" && call[1] === "is_cover" && call[2].ascending === false));
  assert.match(calls.find(call => call[0] === "select")[1], /apartment_images\(url, url_thumb, is_cover\)/);
});
