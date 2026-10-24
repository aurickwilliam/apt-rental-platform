import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compile, deferred, hookRuntime, settle } from "./test-support/hook-runtime.mjs";
import * as seeds from "../service/presentation-seed.ts";

const plain = value => JSON.parse(JSON.stringify(value));
const source = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const jsx = (type, props, key) => ({ type, props, key });
const jsxRuntime = { jsx, jsxs: jsx, Fragment: "Fragment" };
const pendingOnboarding = compile("../../packages/supabase/src/pending-onboarding.ts", {});
const seedLoader = compile("lib/presentation-seed-server.ts", { "server-only": {} });
const seed = (data, resourceId) => ({ authUserId: "auth-a", profileId: "owner-a", renderedAt: "2026-10-24T00:00:00.000Z", error: null, resourceId, data });

/** Model React's request dispatcher, not a persistent application cache. */
function serverIdentity() {
  let request = new Map();
  let authUserId = "auth-a";
  let profile = { id: "owner-a", roles: ["tenant", "landlord", "admin"], account_status: "verified", mobile_number: "phone", is_suspended: false };
  let profileError = null, authError = null, suspended = false;
  let authReads = 0, profileReads = 0;
  const filters = [];
  const client = {
    auth: { getUser: async () => { authReads++; return { data: { user: authUserId ? { id: authUserId, user_metadata: {} } : null }, error: authError }; } },
    from(table) {
      assert.equal(table, "users");
      profileReads++;
      const q = { select: () => q, eq: (...args) => { filters.push(args); return q; }, maybeSingle: async () => ({ data: profile, error: profileError }) };
      return q;
    },
    rpc: async name => { assert.equal(name, "get_my_suspension_status"); return { data: { suspended }, error: null }; },
  };
  const cache = fn => (...args) => {
    if (!request.has(fn)) request.set(fn, new Map());
    const entries = request.get(fn), key = JSON.stringify(args);
    if (!entries.has(key)) entries.set(key, fn(...args));
    return entries.get(key);
  };
  const navigation = { redirect: path => { throw new Error(`redirect:${path}`); }, notFound: () => { throw new Error("not-found"); } };
  const identity = compile("lib/server-identity.ts", {
    "server-only": {}, react: { cache }, "next/navigation": navigation,
    "@repo/supabase/server": { createClient: async () => client },
    "@repo/supabase/pending-onboarding": pendingOnboarding,
  });
  // Two-step login is off unless a test sets ADMIN_MFA_REQUIRED.
  const env = {};
  const mfa = { state: { currentLevel: "aal1", hasVerifiedFactor: true } };
  const admin = compile("app/admin/_lib/require-admin.ts", {
    react: { cache }, "next/navigation": navigation, "@/lib/server-identity": identity,
    "@/lib/admin-mfa": compile("lib/admin-mfa.ts", {}),
    "@/lib/server-admin-mfa": { getAdminMfaState: async () => mfa.state },
  }, { process: { env } });
  return { identity, admin, client, filters, env, mfa, counts: () => ({ authReads, profileReads }),
    next(options = {}) {
      request = new Map();
      if ("authUserId" in options) authUserId = options.authUserId;
      if ("profile" in options) profile = options.profile;
      profileError = options.profileError ?? null; authError = options.authError ?? null; suspended = options.suspended ?? false;
    },
  };
}

test("layout, portal loader and Admin guard share one authoritative identity/profile per request, never across requests", async () => {
  const h = serverIdentity();
  const [layout, tenant, landlord, admin] = await Promise.all([
    h.identity.getServerIdentity(), h.identity.requirePortalViewer("tenant"), h.identity.requirePortalViewer("landlord"), h.admin.requireAdmin(),
  ]);
  assert.equal(layout.profile.id, "owner-a");
  assert.equal(tenant.supabase, h.client); assert.equal(landlord.profile.id, admin.id);
  assert.deepEqual(Object.keys(admin).sort(), ["id", "first_name", "last_name", "email", "roles", "avatar_url"].sort(), "the shared profile must not widen the Admin guard's return contract");
  assert.deepEqual(h.counts(), { authReads: 1, profileReads: 1 });
  assert.deepEqual(h.filters, [["user_id", "auth-a"]]);
  h.next({ authUserId: "auth-b", profile: { id: "owner-b", roles: ["landlord"], account_status: "verified", mobile_number: "phone" } });
  const next = await h.identity.requirePortalViewer("landlord");
  assert.equal(next.profile.id, "owner-b");
  assert.deepEqual(h.counts(), { authReads: 2, profileReads: 2 });
  assert.deepEqual(h.filters.at(-1), ["user_id", "auth-b"]);
  assert.match(source("lib/server-identity.ts"), /getServerIdentity = cache\(async/);
  assert.doesNotMatch(source("lib/server-identity.ts"), /unstable_cache\s*\(|"use cache"|new Map|globalThis|getClaims/);
});

test("Admin Profile Edit consumes the authorized request profile without another Auth or profile query", async () => {
  const h = serverIdentity();
  const page = compile("app/admin/profile/edit/page.tsx", {
    "react/jsx-runtime": jsxRuntime, "next/link": { default: "Link" },
    "@heroui/react": { Card: { Content: "Card.Content" } },
    "@tabler/icons-react": { IconChevronLeft: "ChevronLeft", IconPencil: "Pencil" },
    "@/lib/server-identity": h.identity, "../../_lib/require-admin": h.admin,
    "@/app/components/profile/ProfileForm": { default: "ProfileForm" },
  });
  await Promise.all([h.admin.requireAdmin(), page.default()]);
  assert.deepEqual(h.counts(), { authReads: 1, profileReads: 1 });
  const nodes = node => !node || typeof node !== "object" ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
  const form = nodes(await page.default()).find(node => node.type === "ProfileForm");
  assert.equal(form.props.photoEditing.authUserId, "auth-a");
  assert.equal(form.props.initial.roles, undefined); assert.equal(form.props.initial.is_suspended, undefined);
  assert.equal(form.props.initial.preferences, undefined);
  assert.deepEqual(h.counts(), { authReads: 1, profileReads: 1 });
});

test("Tenant, Landlord and Admin guards fail closed for signed-out, wrong-role, suspended, hidden, failed and onboarding identities", async () => {
  const scenarios = [
    [{ authUserId: null }, /sign-in/],
    [{ profile: { id: "owner", roles: [], account_status: "verified" } }, /browse|not-found/],
    [{ profile: { id: "owner", roles: ["tenant", "landlord", "admin"], is_suspended: true } }, /suspended/],
    [{ profile: null, suspended: true }, /suspended|not-found/],
    [{ profile: null, profileError: { message: "denied" } }, /Unable to verify|not-found/],
    [{ profile: { id: "owner", roles: ["tenant"], account_status: "unverified", mobile_number: null } }, /sign-up|not-found/],
    [{ authError: { name: "AuthApiError" } }, /sign-in/],
  ];
  for (const [options, expected] of scenarios) {
    for (const portal of ["tenant", "landlord", "admin"]) {
      const h = serverIdentity(); h.next(options);
      await assert.rejects(h.identity.requirePortalViewer(portal), expected);
    }
    const h = serverIdentity(); h.next(options);
    await assert.rejects(h.admin.requireAdmin(), /sign-in|not-found|Unable to verify|suspended/);
  }
  const h = serverIdentity();
  h.next({ profile: { id: "owner", roles: ["landlord"], account_status: "verified" } });
  await assert.rejects(h.identity.requirePortalViewer("tenant"), /browse/);
  await assert.rejects(h.admin.requireAdmin(), /not-found/);
});

test("seeds carry initialized errors instead of invented empty success and remain fresh request values", async () => {
  const first = await seedLoader.loadPresentationSeed("a", "owner", async () => ["current"], [], "Read unavailable", "resource");
  assert.deepEqual(plain(first.data), ["current"]); assert.equal(first.resourceId, "resource");
  assert.equal(first.error, null); assert.ok(Number.isFinite(Date.parse(first.renderedAt)));
  const failed = await seedLoader.loadPresentationSeed("a", "owner", async () => { throw new Error("denied"); }, [], "Read unavailable");
  assert.equal(failed.error, "Read unavailable"); assert.deepEqual(plain(failed.data), []);
  assert.notEqual(failed, first);
});

for (const kind of ["applications", "maintenance", "visits"]) {
  test(`Landlord ${kind}: hydration skips all reads, Refresh reconciles, account/resource changes reject seeds and late callbacks`, async () => {
    const runtime = hookRuntime();
    let identity = { authUserId: "auth-a", generation: 0 }, contexts = 0, reads = 0;
    const queued = [], initial = seed([{ id: "server", status: "Pending" }]);
    const resource = compile("hooks/use-async-resource.ts", { react: runtime.react });
    const read = async () => { reads++; return queued.length ? queued.shift().promise : [{ id: "fresh" }]; };
    const common = { react: runtime.react, "@/hooks/use-async-resource": resource,
      "@/hooks/use-auth-identity": { useAuthIdentity: () => identity }, "@/service/presentation-seed": seeds,
      "@/service/landlordApplicationsService": { getLandlordContext: async () => { contexts++; return { landlordId: identity.authUserId }; }, fetchLandlordApplications: read },
      "@/service/landlordMaintenanceService": { fetchLandlordMaintenanceRequests: read },
      "@/service/landlordVisitRequestsService": { fetchLandlordVisitRequests: read }, "@repo/utils": {},
    };
    const hook = kind === "applications" ? compile("hooks/use-landlord-applications.ts", common).useLandlordApplications
      : kind === "maintenance" ? compile("hooks/use-landlord-maintenance-requests.ts", common).useLandlordMaintenanceRequests
        : compile("hooks/use-landlord-visit-requests.ts", common).useLandlordVisitRequests;
    const render = id => runtime.render(() => hook(id, initial));
    const rows = state => kind === "applications" ? state.applications : kind === "maintenance" ? state.requests : state.visitRequests;
    const refresh = state => (state.refresh ?? state.refetch)();
    assert.equal(rows(render())[0].id, "server"); runtime.flush(); await settle();
    assert.equal(reads, 0); assert.equal(contexts, 0);
    await refresh(render()); assert.equal(rows(render())[0].id, "fresh"); assert.equal(reads, 1);
    const retired = render(), late = deferred(); queued.push(late);
    const pending = refresh(retired); await settle();
    identity = { authUserId: "auth-b", generation: 1 };
    assert.equal(rows(render()).length, 0); runtime.flush(); await settle();
    late.resolve([{ id: "wrong-account" }]); await pending;
    assert.equal(rows(render())[0].id, "fresh");
    const count = reads; await refresh(retired); assert.equal(reads, count);
    identity = { authUserId: null, generation: 2 }; render(); runtime.flush(); await settle();
    assert.equal(rows(render()).length, 0);
    identity = { authUserId: "auth-a", generation: 3 };
    assert.equal(rows(render()).length, 0, "A → B → A cannot resurrect the original seed"); runtime.flush(); await settle();
    assert.equal(rows(render())[0].id, "fresh");
    assert.equal(rows(render("another-resource")).length, 0);
    runtime.unmount();
  });
}

test("Tenant application and maintenance history seeds skip hydration reads; owner/resource changes and mutations retain fresh scoped reads", async () => {
  const runtime = hookRuntime(), resource = compile("hooks/use-async-resource.ts", { react: runtime.react });
  let reads = 0, contexts = 0;
  const initial = seed([{ id: "app-server" }], "app-a");
  const hook = compile("hooks/use-tenant-applications.ts", {
    react: runtime.react, "@/hooks/use-async-resource": resource,
    "@/service/favoritesService": { getTenantContext: async () => { contexts++; return { tenantId: "owner-a" }; } },
    "@/service/tenantApplicationsService": { fetchTenantApplications: async (id, options) => { reads++; assert.equal(options.includeDocuments, false); return [{ id: `${id}-fresh` }]; } },
  }).useTenantApplications;
  const render = (owner = "owner-a", id = "app-a") => runtime.render(() => hook(owner, id, false, initial));
  assert.equal(render().applications[0].id, "app-server"); runtime.flush(); await settle(); assert.equal(reads, 0);
  await render().refresh(); assert.equal(render().applications[0].id, "owner-a-fresh");
  assert.equal(render("owner-b").applications.length, 0); runtime.flush(); await settle();
  assert.equal(render("owner-b").applications[0].id, "owner-b-fresh"); assert.equal(contexts, 0);
  runtime.unmount();

  const historyRuntime = hookRuntime(); let writes = 0, historyReads = 0;
  const historyResource = compile("hooks/use-async-resource.ts", { react: historyRuntime.react });
  const history = compile("hooks/use-maintenance-request-history.ts", {
    react: historyRuntime.react, "@/hooks/use-async-resource": historyResource,
    "@/service/favoritesService": { getTenantContext: async () => { contexts++; return { tenantId: "owner-a" }; } },
    "@/service/maintenanceService": {
      fetchMaintenanceRequestHistory: async (apartmentId, ownerId, photos) => { historyReads++; assert.equal(ownerId, "owner-a"); assert.equal(photos, false); return [{ id: "new", status: "Pending" }]; },
      cancelMaintenanceRequest: async (id, ownerId) => { assert.equal(ownerId, "owner-a"); assert.equal(id, "request"); writes++; },
    },
  }).useMaintenanceRequestHistory;
  const historySeed = seed([{ id: "request", status: "Pending" }], "apt-a");
  const renderHistory = (id = "apt-a") => historyRuntime.render(() => history(id, "owner-a", false, historySeed));
  assert.equal(renderHistory().requests[0].id, "request"); historyRuntime.flush(); await settle(); assert.equal(historyReads, 0);
  assert.equal((await renderHistory().cancelRequest("request")).success, true);
  assert.equal(writes, 1); assert.equal(contexts, 1); assert.equal(renderHistory().requests[0].status, "Cancelled");
  assert.equal(renderHistory("apt-b").requests.length, 0); historyRuntime.flush(); await settle();
  assert.equal(renderHistory("apt-b").requests[0].id, "new");
  historyRuntime.unmount();
});

test("the presentation boundary retires the entire subtree on account generation, sign-out, and new server request", () => {
  const runtime = hookRuntime(); let identity = { authUserId: "auth-a", generation: 0 };
  const Boundary = compile("app/components/display/PresentationBoundary.tsx", {
    "react/jsx-runtime": jsxRuntime, "@/hooks/use-auth-identity": { useAuthIdentity: () => identity }, "@/service/presentation-seed": seeds,
  }).default;
  const initial = seed(["private"]), render = (value = initial) => runtime.render(() => Boundary({ initial: value, children: selected => selected?.data ?? [] }));
  const first = render(); assert.deepEqual(plain(first.props.children), ["private"]);
  identity = { authUserId: "auth-b", generation: 1 }; const second = render();
  assert.notEqual(first.key, second.key); assert.deepEqual(plain(second.props.children), []);
  identity = { authUserId: "auth-a", generation: 2 }; assert.deepEqual(plain(render().props.children), []);
  identity = { authUserId: null, generation: 3 }; assert.deepEqual(plain(render().props.children), []);
  identity = { authUserId: "auth-a", generation: 0 };
  assert.notEqual(first.key, render({ ...initial, renderedAt: "new-request" }).key);
});

for (const [route, service, method, component] of [
  ["applications", "landlordApplicationsService", "fetchLandlordApplications", "ApplicationsClient"],
  ["maintenance-requests", "landlordMaintenanceService", "fetchLandlordMaintenanceRequests", "MaintenanceRequestsClient"],
  ["visit-requests", "landlordVisitRequestsService", "fetchLandlordVisitRequests", "VisitRequestsClient"],
]) {
  test(`${route} server wrapper authorizes before reads, injects the caller client, and never truncates its existing presentation contract`, async () => {
    const records = Array.from({ length: 1201 }, (_, index) => ({ id: `record-${index}` }));
    let allowed = false, reads = 0; const client = {};
    const page = compile(`app/landlord/${route}/page.tsx`, {
      "react/jsx-runtime": jsxRuntime,
      "@/lib/server-identity": { requirePortalViewer: async portal => { assert.equal(portal, "landlord"); if (!allowed) throw new Error("denied"); return { supabase: client, user: { id: "auth-a" }, profile: { id: "owner-a" } }; } },
      "@/lib/presentation-seed-server": seedLoader,
      [`@/service/${service}`]: { [method]: async (...args) => {
        assert.ok(allowed); reads++;
        if (route === "maintenance-requests") { assert.equal(args[0], "owner-a"); assert.equal(args[1].includePhotos, false); assert.equal(args[2], client); }
        else { assert.equal(args[0], undefined); assert.equal(args[1], client); assert.equal(args[2], "owner-a"); }
        return records;
      } }, [`./${component}`]: { default: component },
    });
    await assert.rejects(page.default(), /denied/); assert.equal(reads, 0);
    allowed = true; const result = await page.default();
    assert.equal(result.props.initial.data.length, records.length); assert.equal(result.props.initial.data, records);
    assert.equal(reads, 1); assert.equal(result.props.initial.profileId, "owner-a");
  });
}

test("Tenant detail loads exact application and owner-scoped visits in parallel without signing; personal data reuses identity", async () => {
  const application = deferred(), visits = deferred(); let appReads = 0, visitReads = 0;
  const client = {}, profile = { id: "owner-a", first_name: "Tenant", last_name: "A", email: "test@example.test" };
  const page = compile("app/tenant/applications/[applicationId]/page.tsx", {
    "react/jsx-runtime": jsxRuntime,
    "@/lib/server-identity": { requirePortalViewer: async portal => { assert.equal(portal, "tenant"); return { supabase: client, user: { id: "auth-a" }, profile }; } },
    "@/lib/presentation-seed-server": seedLoader,
    "@/lib/application-profile": compile("lib/application-profile.ts", {}),
    "@/service/tenantApplicationsService": { fetchTenantApplications: (owner, options, boundClient) => {
      assert.equal(owner, "owner-a"); assert.equal(boundClient, client); assert.deepEqual(plain(options), { applicationId: "app-a", includeDocuments: false }); appReads++; return application.promise;
    } },
    "@/service/visitRequestsService": { fetchVisitRequest: (id, owner, boundClient) => { assert.equal(id, "app-a"); assert.equal(owner, "owner-a"); assert.equal(boundClient, client); visitReads++; return visits.promise; } },
    "./ApplicationDetailClient": { default: "Client" },
  });
  const pending = page.default({ params: Promise.resolve({ applicationId: "app-a" }) }); await settle();
  assert.equal(appReads, 1); assert.equal(visitReads, 1);
  application.resolve([{ id: "app-a", documents: [{ path: "private/path", signedUrl: null }] }]);
  visits.resolve({ current: null, history: [] });
  const result = await pending;
  assert.equal(result.props.initial.resourceId, "app-a");
  assert.equal(result.props.initial.data.personalInfo.data.fullName, "Tenant A");
  assert.equal(result.props.initial.data.application.data[0].documents[0].signedUrl, null);
  assert.match(source("app/tenant/applications/[applicationId]/ApplicationDetailClient.tsx"), /useApplicationDocumentUrls\(/);
});

test("server/client reads share exact mapping, owner/resource filters, ordering and existing limits without private signing", async () => {
  const raw = {
    id: "record-a", tenant_id: "owner-a", apartment_id: "apt-a", status: "pending", title: "Issue", message: "Message",
    created_at: "2026-10-24", image_urls: ["owner-a/photo"], urgency: "high", fee_amount: 125, fee_status: "waived",
    move_in_date: "2026-11-01", no_occupants: 2, has_pets: true, has_smoker: false, need_parking: true,
    occupation: "Engineer", employment_type: "Employed", monthly_income: 20000, gov_id_url: "owner-a/id", gov_id_back_url: null,
    visit_date: "2026-10-25", time: "10:00", confirmed_visit_date: "2026-10-26", confirmed_time: "11:00",
    apartments: { name: "Unit", monthly_rent: 5000, landlord_id: "owner-a", apartment_images: [{ url: "cdn/full", url_thumb: "cdn/thumb", is_cover: true }] },
    apartment: { name: "Unit", monthly_rent: 5000, apartment_images: [{ url: "cdn/full", url_thumb: "cdn/thumb", is_cover: true }] },
    tenant: { first_name: "Tenant", last_name: "A" }, users: { first_name: "Tenant", last_name: "A" },
  };
  function database() {
    const calls = [];
    return { calls, client: { from(table) {
      const call = { table, filters: [], orders: [], limits: [] }; calls.push(call);
      const q = { select(fields) { call.fields = fields; return q; }, eq(...args) { call.filters.push(args); return q; },
        order(...args) { call.orders.push(args); return q; }, limit(...args) { call.limits.push(args); return q; },
        then: (yes, no) => Promise.resolve({ data: [raw], error: null }).then(yes, no) };
      return q;
    } } };
  }
  for (const [file, method, serverArgs, clientArgs, ownerKey, topLimit] of [
    ["landlordApplicationsService", "fetchLandlordApplications", [undefined, "CLIENT", "owner-a"], [undefined, undefined, "owner-a"], "apartments.landlord_id", null],
    ["landlordMaintenanceService", "fetchLandlordMaintenanceRequests", ["owner-a", { includePhotos: false }, "CLIENT"], ["owner-a", { includePhotos: false }], "landlord_id", 200],
    ["landlordVisitRequestsService", "fetchLandlordVisitRequests", [undefined, "CLIENT", "owner-a"], [undefined, undefined, "owner-a"], "landlord_id", null],
    ["tenantApplicationsService", "fetchTenantApplications", ["owner-a", { applicationId: "record-a", includeDocuments: false }, "CLIENT"], ["owner-a", { applicationId: "record-a", includeDocuments: false }], "tenant_id", 1],
    ["maintenanceService", "fetchMaintenanceRequestHistory", ["apt-a", "owner-a", false, "CLIENT"], ["apt-a", "owner-a", false], "tenant_id", 100],
    ["visitRequestsService", "fetchVisitRequest", ["record-a", "owner-a", "CLIENT"], ["record-a", "owner-a"], "tenant_id", null],
  ]) {
    const server = database(), browser = database();
    let browserCreates = 0;
    const service = compile(`service/${file}.ts`, {
      "@repo/supabase/browser": { createClient: () => { browserCreates++; return browser.client; } },
      "@repo/utils": { formatAddress: () => "Address", normalizeMaintenanceFeeStatus: value => value },
      "@/service/landlordApplicationsService": { getLandlordContext: () => assert.fail("Known owner must not re-resolve context") },
      "@/service/maintenanceService": { resolveMaintenanceImageUrls: () => assert.fail("Server/list presentation must not sign private photos") },
      "@/lib/application-documents": compile("lib/application-documents.ts", {}),
    });
    const initial = await service[method](...serverArgs.map(arg => arg === "CLIENT" ? server.client : arg));
    assert.equal(browserCreates, 0, `${file} server reader must use its injected client`);
    const refreshed = await service[method](...clientArgs);
    assert.equal(browserCreates, 1);
    assert.deepEqual(plain(initial), plain(refreshed), file);
    assert.deepEqual(plain(server.calls), plain(browser.calls), file);
    assert.ok(server.calls[0].filters.some(([key, value]) => key === ownerKey && value === "owner-a"), file);
    assert.deepEqual(server.calls[0].limits.filter(args => args.length === 1), topLimit === null ? [] : [[topLimit]], file);
    if (file === "tenantApplicationsService" || file === "visitRequestsService") assert.ok(server.calls[0].filters.some(([key, value]) => key === (file === "visitRequestsService" ? "application_id" : "id") && value === "record-a"));
    if (file === "landlordMaintenanceService") { assert.equal(initial[0].fee_status, "waived"); assert.equal(initial[0].fee_amount, 125); assert.deepEqual(plain(initial[0].photos), []); }
    if (file === "tenantApplicationsService") { assert.equal(initial[0].has_pets, true); assert.equal(initial[0].documents[0].signedUrl, null); }
    if (file === "landlordVisitRequestsService") assert.equal(initial[0].resolved_visit_date, "2026-10-26");
  }
});

test("My Rental streams applications without blocking tenancy or seeding authoritative finance", async () => {
  const pendingApps = deferred(); let appReads = 0;
  const page = compile("app/tenant/my-rental/page.tsx", {
    "react/jsx-runtime": jsxRuntime,
    "@/lib/server-identity": { requirePortalViewer: async () => ({ supabase: {}, user: { id: "auth-a" }, profile: { id: "owner-a" } }) },
    "@/lib/presentation-seed-server": seedLoader,
    "@/service/tenantApplicationsService": { fetchTenantApplications: () => { appReads++; return pendingApps.promise; } },
    "@/service/tenancy-context": { fetchActiveTenancyWith: async () => ({ id: "lease-a" }) },
    "./MyRentalClient": { default: "Client" },
  });
  const result = await page.default();
  assert.equal(appReads, 1); assert.equal(result.props.initialContext.tenancy.id, "lease-a");
  assert.equal(result.props.initialContext.tenancy.bill, undefined);
  let settled = false; const applicationSeed = result.props.initialContext.applications.then(value => { settled = true; return value; });
  await settle(); assert.equal(settled, false);
  pendingApps.resolve([{ id: "app-a" }]);
  assert.equal((await applicationSeed).data[0].id, "app-a");
  assert.match(source("app/tenant/my-rental/MyRentalClient.tsx"), /<Suspense fallback=\{null\}>\s*<RentalApplications activeLease/);
  assert.match(source("app/tenant/my-rental/components/RentalApplications.tsx"), /initial \? use\(initial\)/);
});

test("Tenant Maintenance's initial active rental and history settle without client identity or history reads", async () => {
  const context = { authUserId: "auth-a", tenantId: "owner-a", tenancy: { id: "lease-a", apartment: { id: "apt-a" } }, error: null };
  const runtime = hookRuntime(), resource = compile("hooks/use-async-resource.ts", { react: runtime.react });
  let identity = { authUserId: "auth-a", generation: 0 }, reads = 0;
  const hook = compile("hooks/use-maintenance-tenancy.ts", {
    react: runtime.react, "@/hooks/use-async-resource": resource, "@/hooks/use-auth-identity": { useAuthIdentity: () => identity },
    "@/service/favoritesService": { getTenantContext: async () => ({ tenantId: "owner-b" }) },
    "@/service/tenancyService": { fetchActiveTenancy: async owner => { reads++; return { id: `${owner}-lease` }; } },
  }).useMaintenanceTenancy;
  const render = () => runtime.render(() => hook(context));
  assert.equal(render().tenancy.id, "lease-a"); runtime.flush(); await settle(); assert.equal(reads, 0);
  identity = { authUserId: "auth-b", generation: 1 };
  assert.equal(render().tenancy, null); assert.equal(render().tenantId, null); runtime.flush(); await settle();
  assert.equal(render().tenancy.id, "owner-b-lease");
  identity = { authUserId: null, generation: 2 }; render(); runtime.flush(); await settle(); assert.equal(render().tenancy, null);
  runtime.unmount();
});

test("Admin guard asks for the second step only when two-step login is required", async () => {
  const h = serverIdentity();
  h.next();
  h.mfa.state = { currentLevel: "aal1", hasVerifiedFactor: true };
  assert.equal((await h.admin.requireAdmin()).id, "owner-a", "off by default: a basic session still works");

  h.env.ADMIN_MFA_REQUIRED = "yes";
  h.next();
  assert.equal((await h.admin.requireAdmin()).id, "owner-a", "only the exact string 'true' turns it on");

  h.env.ADMIN_MFA_REQUIRED = "true";
  for (const hasVerifiedFactor of [true, false]) {
    h.next();
    h.mfa.state = { currentLevel: "aal1", hasVerifiedFactor };
    await assert.rejects(h.admin.requireAdmin(), /redirect:\/two-step-login/);
  }

  h.next();
  h.mfa.state = { currentLevel: "aal2", hasVerifiedFactor: true };
  assert.equal((await h.admin.requireAdmin()).id, "owner-a");

  // Signed-out, wrong-role and suspended accounts are turned away before any code is asked for.
  h.mfa.state = { currentLevel: "aal1", hasVerifiedFactor: false };
  h.next({ profile: { id: "owner-a", roles: ["tenant"], account_status: "verified", mobile_number: "phone", is_suspended: false } });
  await assert.rejects(h.admin.requireAdmin(), /not-found/);
  h.next({ profile: { id: "owner-a", roles: ["admin"], account_status: "verified", mobile_number: "phone", is_suspended: true } });
  await assert.rejects(h.admin.requireAdmin(), /suspended/);
});
