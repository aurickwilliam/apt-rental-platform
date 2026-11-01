import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as documents from "./application-documents.ts";
import { compile, deferred, hookRuntime, settle } from "./test-support/hook-runtime.mjs";
import * as presentationSeed from "../service/presentation-seed.ts";

const plain = value => JSON.parse(JSON.stringify(value));
const source = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const jsx = (type, props) => ({ type, props });
const jsxRuntime = { jsx, jsxs: jsx, Fragment: "Fragment" };

function database(tables, overrides = {}) {
  const calls = [];
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: "auth-a" } } }) },
    from(table) {
      const call = { table, filters: [], orders: [], limits: [] };
      const q = {
        select(fields, options) { call.fields = fields; call.options = options; return q; },
        eq(...args) { call.filters.push(["eq", ...args]); return q; },
        is(...args) { call.filters.push(["is", ...args]); return q; },
        in(...args) { call.filters.push(["in", ...args]); return q; },
        order(...args) { call.orders.push(args); return q; },
        limit(...args) { call.limits.push(args); return q; },
        maybeSingle() { call.single = true; return q; },
        single() { call.single = true; return q; },
        then(yes, no) {
          calls.push(call);
          const run = async () => {
            const override = overrides[table];
            if (override) await override;
            let rows = [...(tables[table] ?? [])];
            for (const [kind, field, value] of call.filters) {
              if (kind === "eq") rows = rows.filter(row => !(field in row) || row[field] === value);
              if (kind === "is") rows = rows.filter(row => !(field in row) || row[field] === value);
              if (kind === "in") rows = rows.filter(row => !(field in row) || value.includes(row[field]));
            }
            const bound = call.limits.find(args => args.length === 1)?.[0];
            if (bound !== undefined) rows = rows.slice(0, bound);
            return { data: call.single ? rows[0] ?? null : rows, error: null, count: rows.length };
          };
          return run().then(yes, no);
        },
      };
      return q;
    },
  };
  return { client, calls };
}

const app = id => ({
  id, tenant_id: "tenant-a", apartment_id: "apt-a", status: "pending", created_at: "2026-10-20",
  employment_type: "Student", occupation: "Student", monthly_income: 0, move_in_date: "2026-11-01", no_occupants: 2,
  gov_id_url: `tenant-a/${id}/id-front.jpg`, gov_id_back_url: `tenant-a/${id}/id-back.jpg`, proof_of_income_url: null, proof_of_billing_url: null, nbi_clearance_url: null,
  apartments: { name: "Home", monthly_rent: 8000, status: "available", city: "C", apartment_images: [{ url: "full", url_thumb: "thumb", is_cover: true }] },
  users: { first_name: "Ana", last_name: "Reyes", email: "a@example.test" },
});

test("tenant summary skips signing/import work; direct detail preserves complete fields and signs only that tenant's selected application", async () => {
  const db = database({ rental_application: [app("a"), app("b"), { ...app("other"), tenant_id: "other" }] });
  const signed = [];
  const service = compile("service/tenantApplicationsService.ts", {
    "@repo/supabase/browser": { createClient: () => db.client },
    "@/lib/application-documents": documents,
    "@/service/applicationDocumentsService": { resolveApplicationDocumentUrls: async paths => {
      signed.push(plain(paths));
      return { urls: Object.fromEntries(paths.map(path => [path, "signed-fixture"])) };
    } },
  });
  const summary = await service.fetchTenantApplications("tenant-a", { includeDocuments: false });
  assert.equal(summary.length, 2); assert.equal(signed.length, 0);
  const detail = await service.fetchTenantApplications("tenant-a", { applicationId: "b" });
  const full = await service.fetchTenantApplications("tenant-a");
  assert.deepEqual(plain(detail[0]), plain(full[1]));
  const withoutUrls = row => ({ ...row, documents: row.documents.map(doc => ({ ...doc, signedUrl: null })) });
  assert.deepEqual(plain(summary[1]), plain(withoutUrls(detail[0])));
  assert.equal(signed[0].length, 2);
  assert.ok(signed[0].every(path => path.includes("/b/")));
  assert.deepEqual(plain(db.calls[1].filters), [["eq", "tenant_id", "tenant-a"], ["eq", "id", "b"]]);
  assert.deepEqual(plain(db.calls[1].limits), [[1]]);
  assert.deepEqual(plain(await service.fetchTenantApplications("tenant-a", { applicationId: "other" })), []);
});

test("landlord application detail returns the same complete row without a collection payload; mutations stay outside the loader", async () => {
  const db = database({ rental_application: [app("a"), app("b")] });
  const service = compile("service/landlordApplicationsService.ts", {
    "@repo/supabase/browser": { createClient: () => db.client },
    "@repo/utils": { formatAddress: () => "Address" },
  });
  const list = await service.fetchLandlordApplications();
  const detail = await service.fetchLandlordApplications("b");
  assert.deepEqual(plain(detail), plain([list[1]]));
  assert.ok(db.calls[1].filters.some(([kind, field, value]) => kind === "eq" && field === "id" && value === "b"));
  assert.ok(db.calls[1].limits.some(args => args.length === 1 && args[0] === 1));
  assert.ok(db.calls[1].fields.includes("gov_id_back_url"));
});

test("landlord maintenance list does not sign photos; selected detail retains fee/status data and signs only its own photos", async () => {
  const row = id => ({ id, landlord_id: "owner", title: id, message: "Issue", status: "resolved", fee_status: "waived", fee_amount: 120,
    image_urls: [`owner/${id}`], apartment: { name: "Home", apartment_images: [] }, tenant: { first_name: "Ana" } });
  const db = database({ maintenance_request: [row("a"), row("b")] });
  const signed = [];
  const service = compile("service/landlordMaintenanceService.ts", {
    "@repo/supabase/browser": { createClient: () => db.client },
    "@repo/utils": { formatAddress: () => "Address", normalizeMaintenanceFeeStatus: value => value },
    "@/service/maintenanceService": { resolveMaintenanceImageUrls: async paths => {
      if (paths.length) signed.push(plain(paths));
      return { urls: Object.fromEntries(paths.map(path => [path, "signed-fixture"])) };
    } },
  });
  const list = await service.fetchLandlordMaintenanceRequests("owner", { includePhotos: false });
  assert.equal(signed.length, 0);
  const direct = await service.fetchLandlordMaintenanceRequests("owner", { requestId: "b", includePhotos: true });
  assert.deepEqual(signed, [["owner/b"]]);
  assert.deepEqual(plain(direct[0]), { ...plain(list[1]), photos: ["signed-fixture"] });
  assert.equal(direct[0].fee_status, "waived");
  assert.equal(direct[0].fee_amount, 120);
  assert.ok(db.calls[1].filters.some(([, field, value]) => field === "landlord_id" && value === "owner"));
  assert.equal((await service.fetchLandlordMaintenanceRequests("not-owner", { requestId: "b" })).length, 0);
});

test("visit detail has owner/id filters and unchanged resolved dates; list thumbnails do not require full galleries", async () => {
  const row = id => ({ id, landlord_id: "owner", visit_date: "2026-11-01", time: "09:00", status: "rescheduled", confirmed_visit_date: "2026-11-03", confirmed_time: "10:00", tenant: { first_name: "Ana" }, apartment: { name: "Home", apartment_images: [{ url: "full", url_thumb: "thumb", is_cover: true }] } });
  const db = database({ visit_request: [row("a"), row("b")] });
  const service = compile("service/landlordVisitRequestsService.ts", {
    "@repo/supabase/browser": { createClient: () => db.client },
    "@/service/landlordApplicationsService": { getLandlordContext: async () => ({ landlordId: "owner" }) },
  });
  const list = await service.fetchLandlordVisitRequests();
  const direct = await service.fetchLandlordVisitRequests("b");
  assert.deepEqual(plain(direct), plain([list[1]]));
  assert.equal(direct[0].resolved_visit_date, "2026-11-03");
  assert.equal(direct[0].resolved_visit_time, "10:00");
  assert.equal(direct[0].apartment.cover_url, "thumb");
  assert.ok(db.calls[1].filters.some(([, field, value]) => field === "landlord_id" && value === "owner"));
  assert.ok(db.calls[1].filters.some(([, field, value]) => field === "id" && value === "b"));
  assert.ok(db.calls[0].limits.some(args => args[1]?.referencedTable === "apartment.apartment_images"));
});

test("property description preserves lease dates with two reads; apartment-only pages use one; complete overview stays four reads", async () => {
  const apartment = { id: "apt", landlord_id: "owner", name: "Home", apartment_images: [], amenities: [] };
  const tenancy = { id: "tenancy", apartment_id: "apt", status: "active", lease_start: "2026-01-01", lease_end: "2027-01-01", tenant: { id: "tenant", first_name: "Ana" } };
  const db = database({ apartments: [apartment], tenancies: [tenancy], maintenance_request: [], payment: [] });
  const service = compile("service/landlordUnitDetailService.ts", { "@/app/tenant/payment/utils": { periodMonthLabel: () => "October" } });
  const description = await service.fetchLandlordUnitDescription(db.client, "apt");
  assert.equal(db.calls.length, 2);
  assert.deepEqual(plain(description.tenant), { leaseStart: tenancy.lease_start, leaseEnd: tenancy.lease_end });
  await service.fetchLandlordUnitApartment(db.client, "apt");
  assert.equal(db.calls.length, 3);
  const full = await service.fetchLandlordUnitDetail(db.client, "apt");
  assert.equal(db.calls.length, 7);
  assert.deepEqual(plain(description.apartment), plain(full.apartment));
  assert.deepEqual(plain(description.tenant), { leaseStart: full.tenant.leaseStart, leaseEnd: full.tenant.leaseEnd });
});

test("lightweight property paths preserve authentication, role, owner and error guards", async () => {
  for (const scenario of ["allowed", "signed-out", "tenant", "not-owner", "missing", "failed"]) {
    let reads = 0;
    const db = database({ users: [{ id: "owner", roles: [scenario === "tenant" ? "tenant" : "landlord"] }] });
    if (scenario === "signed-out") db.client.auth.getUser = async () => ({ data: { user: null } });
    const load = async () => {
      reads++;
      if (scenario === "failed") throw new Error("Failed");
      return scenario === "missing" ? null : { id: "apt", landlord_id: scenario === "not-owner" ? "other" : "owner" };
    };
    const h = compile("app/landlord/properties/[apartmentId]/lib/get-unit-detail.tsx", {
      "react/jsx-runtime": jsxRuntime,
      "@repo/supabase/server": { createClient: async () => db.client },
      "@/lib/server-identity": { getServerIdentity: async () => ({ supabase: db.client, user: scenario === "signed-out" ? null : { id: "auth-a" }, profile: { id: "owner", roles: [scenario === "tenant" ? "tenant" : "landlord"] } }) },
      "@/service/landlordUnitDetailService": { fetchLandlordUnitApartment: load },
    });
    const result = await h.getLandlordApartment("apt");
    assert.equal("error" in result, scenario !== "allowed");
    assert.equal(reads, ["signed-out", "tenant"].includes(scenario) ? 0 : 1);
  }
});

test("read-only rating widgets do not run review eligibility, but review screens retain it", () => {
  const ids = [];
  const runtime = hookRuntime();
  const h = compile("hooks/use-apartment-reviews.ts", {
    react: runtime.react,
    "@/service/reviewsService": { mapReviewRow: row => row },
    "./use-review-eligibility": { useReviewEligibility: id => { ids.push(id); return {}; } },
  });
  runtime.render(() => h.useApartmentReviews("apt", false));
  runtime.render(() => h.useApartmentReviews("apt"));
  assert.deepEqual(ids, [undefined, "apt"]);
  for (const component of ["RatingsSection", "ApartmentReviewsPreview"]) assert.match(source(`app/browse/[apartmentId]/components/${component}.tsx`), /useApartmentReviews\(apartmentId, false\)/);
  assert.doesNotMatch(source("app/browse/[apartmentId]/components/ApartmentRatingsView.tsx"), /useApartmentReviews\(apartmentId, false\)/);
});

test("deferred maintenance photos are batch-scoped, reject late URLs and never replace metadata loading", async () => {
  const runtime = hookRuntime();
  const first = deferred(), next = deferred();
  const calls = [];
  const resource = compile("hooks/use-async-resource.ts", { react: runtime.react });
  const h = compile("hooks/use-maintenance-photo-urls.ts", {
    react: runtime.react,
    "@/hooks/use-async-resource": resource,
    "@/service/maintenanceService": { resolveMaintenanceImageUrls: paths => { calls.push(plain(paths)); return paths[0] === "a" ? first.promise : next.promise; } },
  });
  const render = paths => runtime.render(() => h.useMaintenancePhotoUrls(paths));
  render(["a", "a"]); runtime.flush();
  assert.equal(render(["b"]).urls.a, undefined); runtime.flush();
  next.resolve({ urls: { b: "fixture-b" }, error: null }); await settle();
  first.resolve({ urls: { a: "old-a" }, error: null }); await settle();
  assert.equal(render(["b"]).urls.b, "fixture-b");
  assert.equal(render(["b"]).urls.a, undefined);
  assert.deepEqual(calls, [["a"], ["b"]]);
  render([]); runtime.flush(); await settle();
  assert.deepEqual(plain(render([]).urls), {});
  runtime.unmount();
});

for (const kind of ["applications", "maintenance"]) {
  test(`direct landlord ${kind} reads retire old account/resource results and callbacks`, async () => {
    const runtime = hookRuntime();
    let identity = { authUserId: "auth-a", generation: 0 };
    const late = deferred();
    const reads = [];
    const resource = compile("hooks/use-async-resource.ts", { react: runtime.react });
    const getLandlordContext = async () => ({ landlordId: identity.authUserId });
    const load = async (...args) => {
      reads.push(plain(args));
      const id = kind === "applications" ? args[0] : args[1].requestId;
      return id === "late" ? late.promise : [{ id }];
    };
    const deps = {
      react: runtime.react,
      "@/hooks/use-async-resource": resource,
      "@/hooks/use-auth-identity": { useAuthIdentity: () => identity },
      "@/service/presentation-seed": presentationSeed,
      "@/service/landlordApplicationsService": { getLandlordContext, fetchLandlordApplications: load },
      "@/service/landlordMaintenanceService": { fetchLandlordMaintenanceRequests: load },
      "@repo/utils": {},
    };
    const hook = kind === "applications"
      ? compile("hooks/use-landlord-applications.ts", deps).useLandlordApplications
      : compile("hooks/use-landlord-maintenance-requests.ts", deps).useLandlordMaintenanceRequests;
    const render = id => runtime.render(() => hook(id));
    const rows = value => kind === "applications" ? value.applications : value.requests;
    render("one"); runtime.flush(); await settle();
    assert.equal(rows(render("one"))[0].id, "one");
    const retired = render("one");
    render("late"); runtime.flush(); await settle();
    identity = { authUserId: "auth-b", generation: 1 };
    assert.equal(rows(render("two")).length, 0);
    runtime.flush(); await settle();
    late.resolve([{ id: "wrong-account" }]); await settle();
    assert.equal(rows(render("two"))[0].id, "two");
    const count = reads.length;
    assert.equal(await retired.refresh(), false);
    assert.equal(reads.length, count);
    identity = { authUserId: null, generation: 2 };
    assert.equal(rows(render("two")).length, 0);
    runtime.flush(); await settle();
    assert.equal(reads.length, count);
    runtime.unmount();
  });
}

test("Passport prioritizes only visible image rendering; original URLs, private signing and verification loaders are unchanged", () => {
  const h = compile("app/components/passport/ValidIdCard.tsx", {
    "react/jsx-runtime": jsxRuntime, react: { useState: () => [false, () => {}] },
    "next/image": { default: "Image" }, "@heroui/react": { Card: { Content: "Content" }, Button: "Button", Skeleton: "Skeleton" },
    "@tabler/icons-react": { IconRefresh: "Refresh" }, "./PassportStatusChip": { default: "Status" },
    "@/app/components/i18n/LocaleProvider": {
      useTranslation: () => ({ language: "en", pending: false, setLanguage() {}, t: key => key }),
    },
  });
  const walk = node => !node || typeof node !== "object" ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(walk)];
  const image = walk(h.default({ idType: "Fixture", sides: [{ label: "Front", url: "fixture-image" }], loading: false, onOpenViewer() {} })).find(node => node.type === "Image");
  assert.equal(image.props.src, "fixture-image");
  assert.equal(image.props.unoptimized, true);
  assert.equal(image.props.loading, "eager");
  assert.equal(image.props.fetchPriority, "high");
  assert.doesNotMatch(source("app/components/passport/ValidIdCard.tsx"), /createClient|createSigned|cache|localStorage/);
});

test("admin analytics starts current-state reads alongside all-time date resolution and keeps identical reporting arguments", async () => {
  const start = deferred();
  const calls = [];
  const h = compile("app/admin/analytics/page.tsx", {
    "react/jsx-runtime": jsxRuntime, "@tabler/icons-react": { IconChartBar: "Icon" },
    "@repo/supabase/server": { createClient: async () => ({ rpc: (name, args) => {
      calls.push([name, plain(args ?? {})]);
      return name === "get_admin_analytics_start_date" ? start.promise : Promise.resolve({ data: name === "get_admin_analytics" ? {} : [], error: null });
    } }) },
    "../_lib/require-admin": { requireAdmin: async () => ({}) },
    "./AnalyticsControls": { default: "Controls" }, "./AnalyticsPanels": { default: "Panels" },
  });
  const pending = h.default({ searchParams: Promise.resolve({ days: "all" }) });
  await settle();
  assert.equal(calls.length, 4);
  assert.ok(calls.some(([name]) => name === "get_admin_listing_status"));
  assert.equal(calls.some(([name]) => name === "get_admin_analytics"), false);
  start.resolve({ data: "2026-01-01", error: null });
  await pending;
  assert.equal(calls.length, 7);
  assert.equal(calls.find(([name]) => name === "get_admin_analytics")[1].date_from, "2026-01-01");
  assert.equal(calls.filter(([name]) => name === "get_admin_listing_status").length, 1);
});

test("admin apartment counts start while preview reads are blocked; filters and exact-count definitions are preserved", async () => {
  const preview = deferred();
  const db = database({ apartments: [{ id: "apt", landlord_id: "owner", deleted_at: null }], users: [], apartment_images: [], apartment_verifications: [], tenancies: [], rental_application: [], visit_request: [], maintenance_request: [], reviews: [], admin_audit_logs: [] }, { apartment_images: preview.promise });
  const components = new Proxy({}, { get: (_, key) => key });
  const h = compile("app/admin/apartments/[id]/page.tsx", {
    "react/jsx-runtime": jsxRuntime,
    "next/navigation": { notFound: () => { throw new Error("Not found"); } },
    "@repo/supabase/server": { createClient: async () => db.client },
    "../../_lib/require-admin": { requireAdmin: async () => ({}) },
    "./components/ApartmentOverview": components,
    "./components/ApartmentSidebar": components,
    "./components/ApartmentOperations": components,
    "./components/DetailPrimitives": { fullName: () => "Name" },
  });
  const pending = h.default({ params: Promise.resolve({ id: "apt" }) });
  await settle();
  const counts = db.calls.filter(call => call.options?.head);
  assert.equal(counts.length, 16);
  assert.equal(counts.filter(call => call.table === "rental_application").length, 4);
  assert.equal(counts.filter(call => call.table === "visit_request").length, 6);
  assert.equal(counts.filter(call => call.table === "maintenance_request").length, 4);
  for (const call of counts) assert.equal(call.options.count, "exact");
  preview.resolve();
  await pending;
});
