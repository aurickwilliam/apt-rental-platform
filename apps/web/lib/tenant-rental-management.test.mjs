import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { canRequestMaintenance, maintenanceHref } from "./tenant-maintenance.ts";
import { applicationDetailHref } from "./application-navigation.ts";

const source = file => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const jsx = (type, props) => ({ type, props });
function compile(file, modules) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    { exports, require: name => { assert.ok(name in modules, name); return modules[name]; }, URLSearchParams, console });
  return exports;
}
const nodes = node => !node || typeof node !== "object" ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];

test("maintenance requires an active tenancy, never application approval or a lease-date window", () => {
  const lease = { id: "lease", status: "active", lease_start: "2026-11-03", lease_end: "2026-12-01", apartment: { name: "Unit A" } };
  assert.equal(canRequestMaintenance(lease), true);
  // Status is the app's existing active-tenancy definition: a future start or a
  // passed lease end on an active row stays eligible, as it did before.
  assert.equal(canRequestMaintenance({ ...lease, lease_start: "2099-01-01" }), true);
  assert.equal(canRequestMaintenance({ ...lease, lease_end: "2020-01-01" }), true);
  for (const value of [null, undefined, { ...lease, status: "pending" }, { ...lease, status: "approved" }, { ...lease, status: "ended" }, { ...lease, status: "cancelled" }]) {
    assert.equal(canRequestMaintenance(value), false);
  }
  assert.equal(maintenanceHref("lease"), "/tenant/maintenance?tenancyId=lease#new-request");
  assert.equal(maintenanceHref("lease", "requests"), "/tenant/maintenance?tenancyId=lease#requests");
});

test("repair card appears only for eligible tenancy and links to the one Maintenance module", () => {
  const component = compile("app/tenant/my-rental/components/MaintenanceEntryCard.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx }, "next/link": { default: "Link" }, "@tabler/icons-react": { IconTool: "Tool" },
    "@/lib/tenant-maintenance": { canRequestMaintenance, maintenanceHref },
  }).default;
  for (const status of ["pending", "approved", "ended"]) assert.equal(component({ tenancy: { status, lease_start: "2020-01-01", lease_end: null } }), null);
  assert.equal(component({ tenancy: null }), null);
  const tree = nodes(component({ tenancy: { id: "lease", status: "active", lease_start: "2020-01-01", lease_end: null, apartment: { name: "Unit A" } } }));
  const links = tree.filter(node => node.type === "Link");
  assert.deepEqual(links.map(node => node.props.href), [maintenanceHref("lease"), maintenanceHref("lease", "requests")]);
  assert.deepEqual(links.map(node => node.props.children), ["Request maintenance", "View requests"]);
});

test("application cards retain all real statuses and clear detail navigation without nested buttons", () => {
  const icons = new Proxy({}, { get: (_, name) => name });
  const styles = compile("app/tenant/applications/lib/statusStyles.ts", { "@tabler/icons-react": icons });
  const returns = [];
  const component = compile("app/tenant/my-rental/components/ApplicationStatusCard.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx }, "next/link": { default: "Link" }, "next/image": { default: "Image" },
    "@tabler/icons-react": icons, "@repo/utils": { formatDate: () => "Nov 3, 2026" },
    "@/app/tenant/applications/lib/statusStyles": styles, "@/app/components/display/StatusChip": { default: "StatusChip" },
    "@/lib/public-apartment-image": { canOptimizePublicApartmentImage: () => false },
    "@/lib/application-navigation": {
      applicationDetailHref,
      rememberApplicationReturn: (id, href) => returns.push([id, href]),
    },
  }).default;
  for (const status of ["pending", "approved", "rejected", "cancelled", "closed"]) {
    const tree = nodes(component({ id: "application", apartmentId: "apartment", apartmentName: "Long apartment name ".repeat(10), status, location: "Long address ".repeat(10), createdAt: "2026-11-03", thumbnailUrl: "photo", mobileLocation: "Longos, Malabon", returnHref: "/tenant/my-rental?applicationStatus=pending" }));
    const text = tree.flatMap(node => [node.props.children].flat(Infinity)).filter(value => typeof value === "string").join(" ");
    const style = styles.getApplicationStatusStyle(status);
    assert.ok(style.summary.length > 0);
    assert.ok(text.includes(style.label));
    assert.ok(text.includes(style.summary));
    assert.ok(text.includes("Nov 3, 2026"));
    assert.equal(text.includes("Awaiting landlord review"), status === "pending");
    const link = tree.find(node => node.type === "Link");
    assert.equal(link.props.href, applicationDetailHref({ applicationId: "application", apartmentId: "apartment", returnHref: "/tenant/my-rental?applicationStatus=pending" }));
    assert.equal(link.props.children, "View application");
    assert.equal(link.props["aria-label"], `View application for ${"Long apartment name ".repeat(10)}`);
    link.props.onClick();
    assert.deepEqual(returns.at(-1), ["application", "/tenant/my-rental?applicationStatus=pending"]);
    assert.equal(tree.some(node => node.type === "Image"), true);
  }

  const missingImage = nodes(component({ id: "application", apartmentId: "apartment", apartmentName: null, status: "pending", location: "", createdAt: "2026-11-03", thumbnailUrl: null, mobileLocation: "", returnHref: "/tenant/my-rental" }));
  assert.equal(missingImage.some(node => node.type === "Image"), false);
  assert.equal(missingImage.some(node => node.type === "IconPhoto"), true);
});

test("cancellation only reports success when the caller-owned pending update returns a row", async () => {
  for (const outcome of [{ data: null, error: null }, { data: null, error: { message: "Denied" } }, { data: { id: "app" }, error: null }]) {
    const calls = [];
    const client = { from: table => {
      calls.push(["from", table]);
      const query = {
        update: value => { calls.push(["update", value]); return query; },
        eq: (...args) => { calls.push(["eq", ...args]); return query; },
        select: value => { calls.push(["select", value]); return query; },
        maybeSingle: async () => outcome,
      };
      return query;
    } };
    const service = compile("service/tenantApplicationsService.ts", {
      "@repo/supabase/browser": { createClient: () => client }, "@/lib/application-documents": {},
    });
    if (outcome.data) await service.cancelTenantApplication("app");
    else await assert.rejects(service.cancelTenantApplication("app"), outcome.error ? /Denied/ : /no longer pending/);
    assert.ok(calls.some(call => JSON.stringify(call) === JSON.stringify(["eq", "status", "pending"])));
    assert.ok(calls.some(call => JSON.stringify(call) === JSON.stringify(["select", "id"])));
  }
});

test("maintenance history stays caller scoped even without an active rental", async () => {
  const calls = [];
  const query = { select: () => query, eq: (...args) => { calls.push(args); return query; }, order: () => query,
    limit: value => { assert.equal(value, 100); return Promise.resolve({ data: [], error: null }); } };
  const service = compile("service/maintenanceService.ts", { "@repo/supabase/browser": { createClient: () => ({ from: () => query }) } });
  assert.deepEqual(JSON.parse(JSON.stringify(await service.fetchMaintenanceRequestHistory(null, "tenant", false))), []);
  assert.deepEqual(calls, [["tenant_id", "tenant"]]);
});

test("application actions retain confirmation, write locking and existing visit status protections", () => {
  const detail = source("app/tenant/applications/[applicationId]/ApplicationDetailClient.tsx");
  assert.match(detail, /effectiveApartmentId = application\.apartment_id/);
  assert.match(detail, /showRequestVisit = !visitRequest && !visitError && !action\.blocked && application\.status === "pending"/);
  assert.match(detail, /onRequestAgain=\{application\.status === "pending" \? handleRequestAgain : undefined\}/);
  assert.match(detail, /tenant-application-cancel min-h-11/);
  assert.match(detail, /Cancel this application\?/);
  assert.match(detail, /Keep application/);
  assert.match(detail, /if \(actionsBlocked \|\| application\.status !== "pending"\) return/);
  assert.match(detail, /result === "confirmed"/);
  // Dedicated detail route: Back prefers the browser history only when this
  // tab opened the page from the list; otherwise it pushes a validated target.
  assert.match(detail, /applicationBackTarget\(\{/);
  assert.match(detail, /canGoBack: typeof window !== "undefined" && window\.history\.length > 1/);
  assert.match(detail, /target\.kind === "history"/);
  assert.match(detail, /router\.push\(target\.href\)/);
  assert.match(detail, /marker\?\.applicationId === applicationId \? marker\.href : null/);
  assert.match(detail, /safeApplicationReturnPath\(target\)/);
  // The header keeps status beside the apartment name and shows a short
  // summary, while the image keeps one 16:10 proportion at every width.
  assert.match(detail, /style\.summary/);
  assert.match(detail, /aspect-\[16\/10\] w-full/);
  assert.doesNotMatch(detail, /max-h-72/);
  const filters = source("app/tenant/my-rental/components/ApplicationsList.tsx");
  assert.match(filters, /IconAdjustmentsHorizontal as Filter/);
  assert.match(filters, /aria-pressed=\{selected\}/);
  assert.match(filters, /parseApplicationListFilters/);
  assert.match(filters, /window\.history\.replaceState/);
  assert.match(filters, /takeApplicationReturnScroll/);
  assert.match(filters, /returnHref=\{listHref\}/);
  for (const status of ["pending", "approved", "rejected", "cancelled", "closed"]) assert.ok(filters.includes(`value: "${status}"`));
});

test("maintenance submission rechecks the selected caller-owned rental before uploads and deduplicates attempts", async () => {
  const rentals = [{ id: "lease", landlord_id: "owner", status: "active", lease_start: "2020-01-01", lease_end: null }];
  for (const rows of [[], rentals, [...rentals, { ...rentals[0], id: "other" }]]) {
    const filters = [], writes = [], uploads = [];
    const query = { select: () => query, eq: (...args) => { filters.push(args); return query; }, limit: () => query,
      then: (yes, no) => Promise.resolve({ data: rows, error: null }).then(yes, no) };
    const hook = compile("hooks/use-submit-maintenance-request.ts", {
      react: { useState: value => [value, () => {}], useRef: value => ({ current: value }) },
      "@/lib/tenant-maintenance": { canRequestMaintenance },
      "@/service/favoritesService": { getTenantContext: async () => ({ tenantId: "tenant" }) },
      "@repo/supabase/browser": { createClient: () => ({ from: table => { assert.equal(table, "tenancies"); return query; } }) },
      "@/service/maintenanceService": { uploadMaintenanceImages: async files => { uploads.push(files); return ["tenant/photo"]; }, removeMaintenanceImages: async () => {},
        insertMaintenanceRequest: async payload => { writes.push(payload); return { id: "request" }; } },
    }).useSubmitMaintenanceRequest();
    const args = { apartmentId: "apartment", tenancyId: "lease", form: { title: "Leak", category: "plumbing_water_fixtures", message: "Water is leaking.", urgency: "medium" }, files: [{}] };
    const first = hook.submit(args);
    const duplicate = await hook.submit(args);
    assert.equal(duplicate.success, false);
    const result = await first;
    assert.equal(result.success, rows.length === 1);
    assert.equal(writes.length, rows.length === 1 ? 1 : 0);
    assert.equal(uploads.length, rows.length === 1 ? 1 : 0);
    for (const pair of [["tenant_id", "tenant"], ["apartment_id", "apartment"], ["id", "lease"], ["status", "active"]]) {
      assert.ok(filters.some(item => JSON.stringify(item) === JSON.stringify(pair)));
    }
    if (writes.length) {
      assert.equal(writes[0].tenancy_id, "lease");
      assert.equal(writes[0].landlord_id, "owner");
    }
  }
});
