import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compile, deferred, hookRuntime, settle } from "./test-support/hook-runtime.mjs";

const plain = value => JSON.parse(JSON.stringify(value));
const source = file => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("discovery needs one RPC and no count; count-dependent callers retain their query and identical mapping", async () => {
  const count = deferred();
  let rpcs = 0, counts = 0;
  const raw = { id: "verified", title: "Verified", apartments: [{ id: "apt", name: "Home", monthly_rent: 8000, barangay: "B", city: "C", is_verified: true, apartment_images: [{ url: "full", url_thumb: "thumb", is_cover: true }] }] };
  const client = {
    rpc: async (name, args) => {
      rpcs++;
      assert.equal(name, "get_search_sections");
      assert.deepEqual(plain(args), { p_city: "CAMANAVA", p_limit: 8 });
      return { data: { sections: [raw, { id: "empty", apartments: [] }] }, error: null };
    },
    from(table) {
      counts++;
      assert.equal(table, "apartments");
      const query = { select(columns, options) {
        assert.equal(columns, "id"); assert.deepEqual(plain(options), { count: "exact", head: true }); return query;
      }, is: () => query, eq: () => query, in: () => count.promise };
      return query;
    },
  };
  const h = compile("app/browse/lib/fetch-browse-sections.ts", { "@repo/supabase/server": {} });
  const sections = await h.fetchDiscoverySections(client, "/tenant/browse");
  assert.equal(rpcs, 1); assert.equal(counts, 0);
  assert.equal(sections.length, 1);
  assert.equal(sections[0].apartments[0].image, "thumb");
  assert.equal(sections[0].seeAllHref, "/tenant/browse?verified=1");
  let complete = false;
  const full = h.fetchBrowseSections(client, "/tenant/browse").then(value => { complete = true; return value; });
  await settle(); assert.equal(complete, false);
  count.resolve({ count: 42, error: null });
  const result = await full;
  assert.equal(result.totalCount, 42);
  assert.deepEqual(plain(result.sections), plain(sections));
  assert.equal(counts, 1);
  assert.match(source("app/browse/components/BrowseDiscoveryContent.tsx"), /fetchBrowseResults\(supabase, \{\}\)/, "RPC-empty fallback retains the normal filtered query");
  client.rpc = async () => ({ data: null, error: { message: "Unavailable" } });
  assert.deepEqual(plain(await h.fetchDiscoverySections(client)), []);
});

test("server-known secondary identity removes context reads, while handovers hide old application data and reject late results", async () => {
  const runtime = hookRuntime();
  let contexts = 0;
  const reads = [];
  const pending = deferred();
  const resource = compile("hooks/use-async-resource.ts", { react: runtime.react });
  const { useTenantApplications } = compile("hooks/use-tenant-applications.ts", {
    react: runtime.react,
    "@/hooks/use-async-resource": resource,
    "@/service/favoritesService": { getTenantContext: async () => { contexts++; return { tenantId: "fallback" }; } },
    "@/service/tenantApplicationsService": { fetchTenantApplications: async id => { reads.push(id); return id === "tenant-b" ? pending.promise : [{ id: `${id}-app` }]; } },
  });
  const render = id => runtime.render(() => useTenantApplications(id));
  render("tenant-a"); runtime.flush(); await settle();
  assert.equal(render("tenant-a").applications[0].id, "tenant-a-app");
  assert.equal(contexts, 0);
  const old = render("tenant-a");
  assert.equal(render("tenant-b").applications.length, 0);
  runtime.flush(); await settle();
  render(undefined); runtime.flush(); await settle();
  assert.equal(contexts, 1, "omitted identity retains existing authentication path");
  pending.resolve([{ id: "late-b" }]); await settle();
  assert.equal(render(undefined).applications[0].id, "fallback-app");
  const readCount = reads.length;
  await old.refresh();
  assert.equal(reads.length, readCount);
  runtime.unmount();
});

test("My Rental retires the secondary identity with the existing account-keyed seed and opts out only of unused preview signing", () => {
  const client = source("app/tenant/my-rental/MyRentalClient.tsx");
  assert.match(client, /identity\.authUserId === initialContext\.authUserId && identity\.generation === 0/);
  assert.match(client, /useTenantApplications\(initialContext\?\.tenantId\)/);
  assert.match(client, /useMaintenanceRequestHistory\(tenancy\?\.apartment\.id \?\? null, initialContext\?\.tenantId, false\)/);
  assert.match(source("app/tenant/my-rental/page.tsx"), /tenantId: profile\.id/);
  assert.match(source("hooks/use-maintenance-request-history.ts"), /cancelRequest[\s\S]*await getTenantContext\(\)/, "mutation identity check is unchanged");
});

test("rental maintenance summary reuses scoped identity and skips signing, while mutations keep their own context check", async () => {
  const runtime = hookRuntime();
  let contexts = 0;
  const reads = [];
  const resource = compile("hooks/use-async-resource.ts", { react: runtime.react });
  const { useMaintenanceRequestHistory } = compile("hooks/use-maintenance-request-history.ts", {
    react: runtime.react,
    "@/hooks/use-async-resource": resource,
    "@/service/favoritesService": { getTenantContext: async () => { contexts++; return { tenantId: "tenant-a" }; } },
    "@/service/maintenanceService": {
      fetchMaintenanceRequestHistory: async (...args) => { reads.push(args); return [{ id: "r1", status: "Pending" }]; },
      cancelMaintenanceRequest: async () => {},
    },
  });
  const render = (apartment = "apt-a", tenant = "tenant-a") => runtime.render(() => useMaintenanceRequestHistory(apartment, tenant, false));
  render(); runtime.flush(); await settle();
  assert.deepEqual(reads, [["apt-a", "tenant-a", false]]);
  assert.equal(contexts, 0);
  await render().cancelRequest("r1");
  assert.equal(contexts, 1, "writes never trust the supplied read filter");
  render("apt-b", "tenant-b"); runtime.flush(); await settle();
  assert.deepEqual(reads[1], ["apt-b", "tenant-b", false]);
  render(null); runtime.flush(); await settle();
  assert.equal(reads.length, 2, "no rental means no maintenance query");
  runtime.unmount();
});

function dashboard(overrides = {}) {
  const calls = [];
  const profile = { id: "person", first_name: "Ana", last_name: "Reyes", email: "a@example.test", avatar_url: "avatar", roles: ["tenant"] };
  const results = {
    usersCount: { count: 10 }, apartmentsCount: { count: 20 }, user_verificationsCount: { count: 2 }, apartment_verificationsCount: { count: 3 },
    userQueue: { data: [{ id: "uv", user_id: "person", submitted_at: "2026-10-20" }] },
    apartmentQueue: { data: [{ id: "av", apartment_id: "apt", landlord_id: "person", submitted_at: "2026-10-21" }] },
    recentUsers: { data: [{ ...profile, created_at: "2026-10-22" }] },
    recentApartments: { data: [{ id: "apt", name: "Home", city: "C", created_at: "2026-10-22" }] },
    recentActivity: { data: [{ id: "audit", admin_id: "person", action: "review_user", created_at: "2026-10-22" }] },
    profiles: { data: [profile] }, apartments: { data: [{ id: "apt", name: "Home", city: "C" }] },
    images: { data: [{ apartment_id: "apt", url: "full", url_thumb: "thumb" }] },
    ...overrides,
  };
  const client = { from(table) {
    const call = { table, filters: [], orders: [] };
    const q = {
      select(columns, options) { call.columns = columns; call.options = options; return q; },
      eq(...args) { call.filters.push(["eq", ...args]); return q; },
      is(...args) { call.filters.push(["is", ...args]); return q; },
      in(...args) { call.filters.push(["in", ...args]); return q; },
      order(...args) { call.orders.push(args); return q; },
      limit(value) { call.limit = value; return q; },
      then(resolve, reject) {
        let key = call.options?.head ? `${table}Count` : table === "user_verifications" ? "userQueue" : table === "apartment_verifications" ? "apartmentQueue" : table === "admin_audit_logs" ? "recentActivity" : table === "apartment_images" ? "images" : table === "users" ? call.columns.includes("roles") ? "profiles" : "recentUsers" : call.columns.includes("created_at") ? "recentApartments" : "apartments";
        call.key = key; calls.push(call);
        return Promise.resolve(results[key]).then(value => ({ data: null, count: null, error: null, ...value })).then(resolve, reject);
      },
    };
    return q;
  } };
  const h = compile("app/admin/dashboard/lib/get-dashboard-data.ts", { "@repo/supabase/server": { createClient: async () => client } });
  return { h, calls };
}

test("admin totals, users and activity settle with image enrichment blocked; no extra or broader queries", async () => {
  const image = deferred();
  const { h, calls } = dashboard({ images: image.promise });
  const regions = await h.getDashboardRegions();
  let queueReady = false, apartmentsReady = false;
  const queue = regions.queue.then(value => { queueReady = true; return value; });
  const apartments = regions.recentApartments.then(value => { apartmentsReady = true; return value; });
  const [totals, users, activity] = await Promise.all([regions.totals, regions.recentUsers, regions.recentActivity]);
  assert.deepEqual(plain(totals), { data: { users: 10, apartments: 20, pendingUsers: 2, pendingApartments: 3 }, hasError: false });
  assert.equal(users.data[0].name, "Ana Reyes");
  assert.equal(activity.data[0].detail, "Ana Reyes");
  assert.equal(activity.data[0].name, "review user");
  assert.equal(queueReady, false); assert.equal(apartmentsReady, false);
  image.resolve({ data: [{ apartment_id: "apt", url: "full", url_thumb: "thumb" }] });
  assert.equal((await queue).data[0].id, "av");
  assert.equal((await apartments).data[0].image, "thumb");
  assert.equal(calls.length, 12, "same nine base reads and three shared enrichment reads");
  assert.equal(calls.filter(call => call.key === "profiles").length, 1);
  const photos = calls.find(call => call.key === "images");
  assert.equal(photos.limit, 100);
  assert.deepEqual(plain(photos.filters), [["in", "apartment_id", ["apt"]]]);
  assert.equal(calls.find(call => call.key === "userQueue").limit, 8);
  assert.equal(calls.find(call => call.key === "recentUsers").limit, 5);
});

test("admin queue does not wait for recent users or count queries; full snapshot preserves every dataset", async () => {
  const slow = deferred();
  const { h } = dashboard({ recentUsers: slow.promise, usersCount: slow.promise });
  const regions = await h.getDashboardRegions();
  const queue = await regions.queue;
  assert.equal(queue.hasError, false);
  assert.deepEqual(plain(queue.data.map(row => row.id)), ["av", "uv"]);
  slow.resolve({ count: 10, data: [] });
  await Promise.all(Object.values(regions));
  const snapshot = await dashboard().h.getDashboardData();
  assert.deepEqual(plain(snapshot), {
    totals: { users: 10, apartments: 20, pendingUsers: 2, pendingApartments: 3 },
    queue: [
      { id: "av", kind: "apartments", role: "tenant", name: "Home", detail: "Ana Reyes", submittedAt: "2026-10-21", image: "thumb" },
      { id: "uv", kind: "users", role: "tenant", name: "Ana Reyes", detail: "a@example.test", submittedAt: "2026-10-20", image: "avatar" },
    ],
    recentUsers: [{ id: "person", href: "/admin/users/person", name: "Ana Reyes", detail: "a@example.test", image: "avatar", date: "2026-10-22" }],
    recentApartments: [{ id: "apt", href: "/admin/apartments/apt", name: "Home", detail: "C", image: "thumb", date: "2026-10-22" }],
    recentActivity: [{ id: "audit", href: "/admin/activity", name: "review user", detail: "Ana Reyes", image: null, date: "2026-10-22" }],
    hasError: false,
  });
});

test("admin errors are localized and visible without publishing invented totals or blocking independent content", async () => {
  const { h } = dashboard({ images: { error: { message: "Denied" } }, usersCount: { error: { message: "Count failed" }, count: null } });
  const regions = await h.getDashboardRegions();
  assert.equal((await regions.totals).data.users, null);
  assert.equal((await regions.totals).hasError, true);
  assert.equal((await regions.queue).hasError, true);
  assert.equal((await regions.recentApartments).hasError, true);
  assert.equal((await regions.recentActivity).hasError, false);
  assert.equal((await regions.recentUsers).hasError, false);
  const transport = await dashboard({ images: Promise.reject(new Error("Transport")) }).h.getDashboardData();
  assert.equal(transport.hasError, true);
  const page = source("app/admin/dashboard/page.tsx");
  assert.ok(page.indexOf("await requireAdmin()") < page.indexOf("await getDashboardRegions()"));
  assert.doesNotMatch(page, /await getDashboardData\(/);
  for (const region of ["totals", "queue", "recentUsers", "recentApartments", "recentActivity"]) assert.ok(page.includes(`pending={regions.${region}}`));
});

test("admin shell returns after authorization without awaiting any region, and denied access starts no dashboard reads", async () => {
  const pending = deferred();
  const jsx = (type, props) => ({ type, props });
  let allowed = true, loads = 0;
  const { default: Page } = compile("app/admin/dashboard/page.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    react: { Suspense: "Suspense" },
    "next/link": { default: "Link" },
    "@/components/ui/skeleton": { Skeleton: "Skeleton" },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
    "../_lib/require-admin": { requireAdmin: async () => { if (!allowed) throw new Error("Denied"); return { first_name: "Admin" }; } },
    "./components/DashboardTrends": { default: "Trends" },
    "./components/CurrentMonthCalendar": { default: "Calendar" },
    "./components/PlatformTotalCard": { default: "Total" },
    "./components/RecentApartmentCard": { default: "Apartment" },
    "./components/RecentUserCard": { default: "User" },
    "./components/VerificationQueue": { default: "Queue" },
    "./components/DashboardCharts": { QueueChart: "QueueChart" },
    "./lib/get-dashboard-data": {
      getDashboardTrends: () => pending.promise,
      getDashboardRegions: async () => { loads++; return Object.fromEntries(["totals", "queue", "recentUsers", "recentApartments", "recentActivity"].map(key => [key, pending.promise])); },
    },
  });
  const shell = await Page({ searchParams: Promise.resolve({}) });
  assert.equal(shell.type, "div");
  assert.equal(loads, 1);
  const nodes = node => !node || typeof node !== "object" ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
  assert.equal(nodes(shell).filter(node => node.type === "Suspense").length, 7);
  allowed = false;
  await assert.rejects(Page({ searchParams: Promise.resolve({}) }), /Denied/);
  assert.equal(loads, 1);
  pending.resolve({});
});
