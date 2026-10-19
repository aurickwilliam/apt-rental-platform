import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { filterMaintenanceList, maintenanceSummary, maintenanceReportedAge, sortMaintenanceList } from "../app/landlord/maintenance-requests/lib/maintenance-list.ts";

const requests = [
  { id: "a", apartment_id: "p1", issue_title: "Leaking sink", description: "Water under kitchen sink", apartment_name: "Cove", apartment_city: "Caloocan", apartment_address: "First St", tenant_name: "Alice", tenant_email: "alice@example.test", status: "Pending", urgency: "high", reported_at: "2026-10-18T00:00:00Z" },
  { id: "b", apartment_id: "p2", issue_title: "Loose switch", description: "Light switch not working", apartment_name: "Studio", apartment_city: "Malabon", apartment_address: "Second St", tenant_name: "Ben", status: "Resolved", urgency: "medium", reported_at: "2026-10-01T00:00:00Z" },
  { id: "c", apartment_id: "p1", issue_title: "Pest control", description: "Ants", apartment_name: "Cove", apartment_city: "Caloocan", apartment_address: "First St", tenant_name: "Cara", status: "Cancelled", urgency: "low", reported_at: "2026-01-01T00:00:00Z" },
  { id: "d", apartment_id: "p2", issue_title: "Door handle", description: "Loose handle", apartment_name: "Studio", apartment_city: "Malabon", apartment_address: "Second St", tenant_name: "Dan", status: "In Progress", urgency: "high", reported_at: "2026-09-01T00:00:00Z" },
];
const filters = { search: "", status: "All", urgency: "All", city: "All", property: "All", days: "All" };
const now = Date.parse("2026-10-19T00:00:00Z");

test("Maintenance summaries include pending requests in the total and count real terminal statuses", () => {
  assert.deepEqual(maintenanceSummary(requests), { total: 4, resolved: 1, inProgress: 1, cancelled: 1 });
});

test("Maintenance combines issue/tenant/property/location search with property, urgency, status and reported-date filters", () => {
  assert.deepEqual(filterMaintenanceList(requests, { ...filters, search: " KITCHEN " }).map(request => request.id), ["a"]);
  assert.deepEqual(filterMaintenanceList(requests, { ...filters, search: "First St" }).map(request => request.id), ["a", "c"]);
  assert.deepEqual(filterMaintenanceList(requests, { ...filters, search: "alice@example" }).map(request => request.id), ["a"]);
  assert.deepEqual(filterMaintenanceList(requests, { ...filters, city: "Malabon", property: "p2", urgency: "medium", status: "Resolved", days: "30" }, now).map(request => request.id), ["b"]);
  assert.deepEqual(filterMaintenanceList(requests, { ...filters, days: "7" }, now).map(request => request.id), ["a"]);
  assert.deepEqual(filterMaintenanceList(requests, { ...filters, days: "90" }, now).map(request => request.id), ["a", "b", "d"]);
});

test("Maintenance sorts chronologically or by urgency rank rather than urgency label spelling", () => {
  assert.deepEqual(sortMaintenanceList(requests, { column: "reported_at", direction: "descending" }).map(request => request.id), ["a", "b", "d", "c"]);
  assert.deepEqual(sortMaintenanceList(requests, { column: "urgency", direction: "descending" }).map(request => request.id), ["a", "d", "b", "c"]);
  assert.deepEqual(sortMaintenanceList(requests, { column: "urgency", direction: "ascending" }).map(request => request.id), ["c", "b", "a", "d"]);
  assert.deepEqual(requests.map(request => request.id), ["a", "b", "c", "d"]);
});

test("Reported-age text handles recent, older, future and invalid dates", () => {
  assert.equal(maintenanceReportedAge("2026-10-19T00:00:00Z", now), "Today");
  assert.equal(maintenanceReportedAge("2026-10-17T00:00:00Z", now), "2 days ago");
  assert.equal(maintenanceReportedAge("2025-10-19T00:00:00Z", now), "1 year ago");
  assert.equal(maintenanceReportedAge("2026-10-21T00:00:00Z", now), "in 2 days");
  assert.equal(maintenanceReportedAge("invalid", now), "Date unavailable");
});

test("Maintenance thumbnails use the existing landlord-scoped bounded query without treating private issue photos as listing photos", async () => {
  const calls = [];
  const query = {
    select(value) { calls.push(["select", value]); return this; },
    eq(...args) { calls.push(["eq", ...args]); return this; },
    order(...args) { calls.push(["order", ...args]); return this; },
    limit(...args) { calls.push(["limit", ...args]); return this; },
    then(resolve, reject) { return Promise.resolve({ data: [{ id: "a", apartment_id: "p1", title: "Leak", message: "Under sink", status: "pending", urgency: "high", image_urls: ["private-photo.jpg"],
      apartment: { name: "Cove", monthly_rent: 15000, apartment_images: [{ url: "/full.jpg", url_thumb: "/thumb.jpg" }] },
      tenant: { first_name: "Alice", email: "alice@example.test" },
    }], error: null }).then(resolve, reject); },
  };
  const source = readFileSync(new URL("../service/landlordMaintenanceService.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const dependencies = {
    "@repo/supabase/browser": { createClient: () => ({ from: table => { calls.push(["from", table]); return query; } }) },
    "@repo/utils": { formatAddress: () => "First St" },
    "@/service/maintenanceService": { resolveMaintenanceImageUrls: async () => ({ urls: { "private-photo.jpg": "signed-private-photo" } }) },
  };
  const context = { exports: {}, require: name => { assert.ok(name in dependencies); return dependencies[name]; } };
  vm.runInNewContext(compiled, context);
  const result = await context.exports.fetchLandlordMaintenanceRequests("landlord-one");
  assert.equal(result[0].apartment_id, "p1");
  assert.equal(result[0].apartment_thumbnail_url, "/thumb.jpg");
  assert.equal(result[0].apartment_monthly_rent, 15000);
  assert.equal(result[0].tenant_email, "alice@example.test");
  assert.equal(result[0].photos[0], "signed-private-photo");
  assert.ok(calls.some(call => call[0] === "eq" && call[1] === "landlord_id" && call[2] === "landlord-one"));
  assert.ok(calls.some(call => call[0] === "limit" && call[1] === 200));
  assert.ok(calls.some(call => call[0] === "limit" && call[1] === 1 && call[2].referencedTable === "apartment.apartment_images"));
});
