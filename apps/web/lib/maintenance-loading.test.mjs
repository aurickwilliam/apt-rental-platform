import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const plain = (value) => JSON.parse(JSON.stringify(value));
function compile(file, modules) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: (name) => {
    assert.ok(name in modules, `Unexpected dependency: ${name}`);
    return modules[name];
  } });
  return exports;
}

function database(results) {
  const calls = [];
  const client = {
    from(table) {
      const call = { table, filters: [], orders: [] };
      calls.push(call);
      assert.ok(table in results, `Unexpected query: ${table}`);
      const query = {
        select: (fields) => { call.fields = fields; return query; },
        eq: (key, value) => { call.filters.push([key, value]); return query; },
        order: (key, options) => { call.orders.push([key, options]); return query; },
        limit: (value) => { call.limit = value; return query; },
        single: () => Promise.resolve(results[table]),
        maybeSingle: () => Promise.resolve(results[table]),
        then: (yes, no) => Promise.resolve(results[table]).then(yes, no),
      };
      return query;
    },
  };
  return { client, calls };
}

const active = { id: "lease-a", apartment: { id: "apt-a", name: "Unit A" }, status: "active" };
function tenancyService(client) {
  return compile("../service/tenancyService.ts", { "@repo/supabase/browser": { createClient: () => client } });
}

test("maintenance context reads only the caller-scoped active tenancy, never billing or payment history", async () => {
  const { client, calls } = database({ tenancies: { data: active, error: null } });
  const service = tenancyService(client);
  let load;
  const hook = compile("../hooks/use-maintenance-tenancy.ts", {
    react: { useCallback: (fn) => fn },
    "@/hooks/use-user": { useUser: () => ({ profile: { id: "tenant-a", roles: ["tenant"] }, loading: false }) },
    "@/hooks/use-async-resource": { useAsyncResource: (loader) => {
      load = loader;
      return { data: null, loading: true, error: null };
    } },
    "@/service/tenancyService": service,
  });
  const state = hook.useMaintenanceTenancy();
  assert.equal(state.tenantId, "tenant-a");
  assert.deepEqual(plain(await load()), active);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].filters, [["tenant_id", "tenant-a"], ["status", "active"]]);
  assert.match(calls[0].fields, /landlord:users!tenancies_landlord_id_fkey/);
  assert.doesNotMatch(calls[0].fields, /\bpayment\b|\bbill\b/);
});

test("maintenance hides old context while identity/context changes and never queries without tenant membership", async () => {
  for (const profile of [null, { id: "admin-a", roles: ["admin"] }, { id: "landlord-a", roles: ["landlord"] }]) {
    let load;
    const hook = compile("../hooks/use-maintenance-tenancy.ts", {
      react: { useCallback: (fn) => fn },
      "@/hooks/use-user": { useUser: () => ({ profile, loading: false }) },
      "@/hooks/use-async-resource": { useAsyncResource: (loader) => {
        load = loader;
        return { data: active, loading: true, error: null };
      } },
      "@/service/tenancyService": { fetchActiveTenancy: () => assert.fail("Must not query") },
    });
    const result = hook.useMaintenanceTenancy();
    assert.equal(result.tenancy, null);
    assert.equal(result.tenantId, null);
    assert.equal(await load(), null);
  }
});

test("active-tenancy absence and RLS/query failures never become usable property context", async () => {
  const absent = tenancyService(database({ tenancies: { data: null, error: null } }).client);
  assert.equal(await absent.fetchActiveTenancy("tenant-a"), null);
  const denied = tenancyService(database({ tenancies: { data: null, error: { message: "Access denied" } } }).client);
  await assert.rejects(denied.fetchActiveTenancy("tenant-a"), /Access denied/);
});

test("Maintenance page uses the independent context and shares its tenant identity with history while retaining loading/error states", () => {
  for (const state of [
    { tenancy: active, tenantId: "tenant-a", loading: false, error: null },
    { tenancy: null, tenantId: "tenant-a", loading: true, error: null },
    { tenancy: null, tenantId: "tenant-a", loading: false, error: "Rental unavailable" },
  ]) {
    const historyReads = [];
    const jsx = (type, props) => ({ type, props });
    const page = compile("../app/tenant/maintenance/page.tsx", {
      "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
      "@tabler/icons-react": { IconTool: "Tool" },
      "./components/PropertyContextCard": { default: "PropertyContextCard" },
      "./components/MaintenanceForm": { default: "MaintenanceForm" },
      "./components/MaintenanceHistory": { default: "MaintenanceHistory" },
      "./components/MaintenancePageSkeleton": { default: "MaintenancePageSkeleton" },
      "@/app/components/display/ErrorBanner": { default: "ErrorBanner" },
      "@/hooks/use-maintenance-tenancy": { useMaintenanceTenancy: () => state },
      "@/hooks/use-maintenance-request-history": { useMaintenanceRequestHistory: (...args) => { historyReads.push(args); return { requests: [] }; } },
    });
    const nodes = (node) => !node || typeof node !== "object" ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
    const tree = nodes(page.default());
    assert.deepEqual(historyReads, [[state.tenancy ? "apt-a" : null, "tenant-a"]]);
    assert.equal(tree.some((node) => node.type === "MaintenancePageSkeleton"), state.loading);
    assert.equal(tree.some((node) => node.type === "ErrorBanner"), !!state.error);
    assert.equal(tree.some((node) => node.type === "PropertyContextCard"), !!state.tenancy);
    assert.equal(tree.some((node) => node.type === "MaintenanceForm"), !!state.tenancy);
  }
});

test("maintenance history reuses supplied identity, but omitted identity still follows the existing auth path", async () => {
  for (const suppliedId of ["tenant-a", null, undefined]) {
    let load;
    let contexts = 0;
    const reads = [];
    const hook = compile("../hooks/use-maintenance-request-history.ts", {
      react: { useCallback: (fn) => fn, useState: (value) => [value, () => {}] },
      "@/hooks/use-async-resource": { useAsyncResource: (loader) => {
        load = loader;
        return { data: [], loading: true, setData: () => {} };
      } },
      "@/service/favoritesService": { getTenantContext: async () => { contexts++; return { tenantId: "tenant-a" }; } },
      "@/service/maintenanceService": { fetchMaintenanceRequestHistory: async (...args) => { reads.push(args); return []; } },
    });
    hook.useMaintenanceRequestHistory("apt-a", suppliedId);
    await load();
    assert.equal(contexts, suppliedId === undefined ? 1 : 0);
    assert.deepEqual(reads, suppliedId === null ? [] : [["apt-a", "tenant-a"]]);
  }
});

function financialHook({ billError = null, paymentError = null, signedIn = true, tenancy = active } = {}) {
  const payment = { id: "payment-a", status: "paid", period_start: "2026-10-01", amount: 15000 };
  const db = database({ users: { data: { id: "tenant-a" }, error: null }, payment: { data: [payment], error: paymentError } });
  let authReads = 0;
  let billReads = 0;
  let contextReads = 0;
  db.client.auth = { getUser: async () => { authReads++; return { data: { user: signedIn ? { id: "auth-a" } : null } }; } };
  db.client.rpc = async (name, args) => {
    assert.equal(name, "get_tenancy_bill");
    assert.equal(args.p_tenancy_id, "lease-a");
    billReads++;
    return { data: { rentPaid: billReads > 1, monthlyRent: 15000 }, error: billError };
  };
  const hook = compile("../hooks/use-tenancy.ts", {
    "@repo/supabase/browser": { createClient: () => db.client },
    react: { useEffect: () => {}, useCallback: (fn) => fn },
    "@/service/tenancyService": { fetchActiveTenancy: async (id) => { assert.equal(id, "tenant-a"); contextReads++; return tenancy; } },
    "@/hooks/use-async-resource": { useAsyncResource: () => ({ data: null, loading: true, error: null }) },
  });
  return {
    fetchTenancyContext: hook.fetchTenancyContext,
    fetchTenancyFinance: hook.fetchTenancyFinance,
    calls: db.calls,
    counts: () => ({ authReads, billReads, contextReads }),
    payment,
  };
}

test("My Rental still validates auth and reads a fresh authoritative bill and bounded ordered payments on every load", async () => {
  const h = financialHook();
  const firstContext = await h.fetchTenancyContext();
  const first = await h.fetchTenancyFinance(firstContext.id);
  const secondContext = await h.fetchTenancyContext();
  const second = await h.fetchTenancyFinance(secondContext.id);
  assert.equal(first.bill.rentPaid, false);
  assert.equal(second.bill.rentPaid, true);
  assert.deepEqual(plain(second.payments), [h.payment]);
  assert.deepEqual(h.counts(), { authReads: 2, billReads: 2, contextReads: 2 });
  for (const query of h.calls.filter((call) => call.table === "payment")) {
    assert.equal(query.limit, 200);
    assert.deepEqual(query.filters, [["tenancy_id", "lease-a"]]);
    assert.deepEqual(plain(query.orders), [["period_start", { ascending: false }], ["date", { ascending: false }]]);
    assert.match(query.fields, /advance_period_start/);
  }
});

test("My Rental preserves bill failure, partial payment failure, signed-out and no-lease behavior", async () => {
  await assert.rejects(
    financialHook({ billError: { message: "Bill unavailable" } }).fetchTenancyFinance("lease-a"),
    /Bill unavailable/,
  );
  const partialContext = await financialHook({ paymentError: { message: "History unavailable" } }).fetchTenancyFinance("lease-a");
  assert.equal(partialContext.paymentError, "History unavailable");
  assert.equal(partialContext.bill.rentPaid, false);
  for (const options of [{ signedIn: false }, { tenancy: null }]) {
    const h = financialHook(options);
    const context = await h.fetchTenancyContext();
    const finance = await h.fetchTenancyFinance(context?.id ?? null);
    assert.equal(context, null);
    assert.equal(finance.bill, null);
    assert.equal(h.counts().billReads, 0);
    assert.ok(!h.calls.some((call) => call.table === "payment"));
  }
});

function photoService(rows, signingResult) {
  const db = database({ maintenance_request: { data: rows, error: null } });
  const signed = [];
  db.client.storage = { from: (bucket) => ({ createSignedUrls: async (paths, ttl) => {
    signed.push({ bucket, paths: Array.from(paths), ttl });
    return signingResult;
  } }) };
  const service = compile("../service/maintenanceService.ts", { "@repo/supabase/browser": { createClient: () => db.client } });
  return { ...db, service, signed };
}
const request = (id, paths) => ({ id, image_urls: paths, status: "pending", apartment_id: "apt-a", tenant_id: "tenant-a" });

test("maintenance history signs all photo paths once, deduplicates paths, and maps valid results back in request order", async () => {
  const h = photoService([request("r2", ["tenant-a/shared", "tenant-a/bad"]), request("r1", ["tenant-a/shared", "tenant-a/other"])], {
    data: [
      { path: "tenant-a/shared", signedUrl: "https://storage/shared-new" },
      { path: "tenant-a/other", signedUrl: "https://storage/other-new" },
      { path: "tenant-a/bad", signedUrl: "https://storage/do-not-use", error: "Denied" },
    ], error: null,
  });
  const rows = await h.service.fetchMaintenanceRequestHistory("apt-a", "tenant-a");
  assert.deepEqual(h.signed, [{ bucket: "maintenance-images", paths: ["tenant-a/shared", "tenant-a/bad", "tenant-a/other"], ttl: 3600 }]);
  assert.deepEqual(plain(rows.map((row) => [row.id, row.image_urls])), [
    ["r2", ["https://storage/shared-new"]], ["r1", ["https://storage/shared-new", "https://storage/other-new"]],
  ]);
  assert.deepEqual(h.calls[0].filters, [["apartment_id", "apt-a"], ["tenant_id", "tenant-a"]]);
  assert.equal(h.calls[0].limit, 100);
});

test("maintenance photos are freshly signed on repeat reads and signing failure never publishes old or invalid URLs", async () => {
  const h = photoService([request("r1", ["tenant-a/photo"])], { data: [{ path: "tenant-a/photo", signedUrl: "https://storage/new" }], error: null });
  await h.service.fetchMaintenanceRequestHistory("apt-a", "tenant-a");
  await h.service.fetchMaintenanceRequestHistory("apt-a", "tenant-a");
  assert.equal(h.signed.length, 2);
  const failed = photoService([request("r1", ["tenant-a/photo"])], { data: null, error: { message: "Denied" } });
  const rows = await failed.service.fetchMaintenanceRequestHistory("apt-a", "tenant-a");
  assert.deepEqual(plain(rows[0].image_urls), []);
  assert.deepEqual(plain(rows[0].image_paths), ["tenant-a/photo"]);
});

test("maintenance history skips signing for empty histories and requests without photos; latest-request reads still resolve photos", async () => {
  for (const rows of [[], [request("r1", null)]]) {
    const h = photoService(rows, { data: [], error: null });
    await h.service.fetchMaintenanceRequestHistory("apt-a", "tenant-a");
    assert.equal(h.signed.length, 0);
  }
  const h = photoService(request("r1", ["tenant-a/photo"]), { data: [{ path: "tenant-a/photo", signedUrl: "https://storage/new" }], error: null });
  const row = await h.service.fetchLatestMaintenanceRequest("apt-a", "tenant-a");
  assert.deepEqual(plain(row.image_urls), ["https://storage/new"]);
});
