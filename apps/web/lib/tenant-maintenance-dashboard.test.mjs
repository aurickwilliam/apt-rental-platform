import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { compile as compileHook, deferred, hookRuntime, settle } from "./test-support/hook-runtime.mjs";

function compile(file, modules) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: (name) => {
    assert.ok(name in modules, `Unexpected dependency: ${name}`);
    return modules[name];
  } });
  return exports;
}
const plain = (value) => JSON.parse(JSON.stringify(value));

function database(rows, failure) {
  const calls = [];
  const client = { from(table) {
    assert.equal(table, "maintenance_request");
    const call = { filters: [], orders: [] };
    calls.push(call);
    const checks = [];
    const query = {
      select: (fields, options) => { call.fields = fields; call.options = options; return query; },
      eq: (field, value) => { call.filters.push([field, value]); checks.push((row) => row[field] === value); return query; },
      in: (field, values) => { call.filters.push([field, Array.from(values)]); checks.push((row) => values.includes(row[field])); return query; },
      gt: (field, value) => { call.filters.push([field, ">", value]); checks.push((row) => row[field] > value); return query; },
      order: (field, options) => { call.orders.push([field, options]); return query; },
      limit: (limit) => { call.limit = limit; return query; },
      then: (yes, no) => {
        const filtered = rows.filter((row) => checks.every((check) => check(row)));
        const error = failure?.(call) ?? null;
        return Promise.resolve({ data: call.options?.head ? null : filtered.slice(0, call.limit), count: error ? null : filtered.length, error }).then(yes, no);
      },
    };
    return query;
  } };
  const maintenance = compile("../service/maintenanceService.ts", { "@repo/supabase/browser": { createClient: () => client } });
  const service = compile("../service/tenantMaintenanceService.ts", {
    "@repo/supabase/browser": { createClient: () => client },
    "./maintenanceService": maintenance,
    "../lib/maintenance-featured-request": compile("../lib/maintenance-featured-request.ts", {}),
  });
  return { service, calls };
}

const row = (id, patch = {}) => ({ id, apartment_id: "apartment-a", tenant_id: "tenant-a", tenancy_id: "lease-a", status: "resolved", fee_status: "pending", fee_amount: 10.25, image_urls: [], ...patch });

test("overview counts all active requests and only positive unpaid fees from the current tenancy, regardless of month", async () => {
  const h = database([
    row("01", { status: "pending", fee_amount: 0 }), row("02", { status: "in_progress", fee_amount: null }),
    row("03", { fee_amount: 12.15, created_at: "2025-01-01" }), row("04", { fee_amount: 100.10 }),
    row("05", { fee_status: "paid" }), row("06", { fee_status: "waived" }),
    row("07", { tenancy_id: "older-lease", fee_amount: 1000 }),
    row("08", { tenant_id: "tenant-b", fee_amount: 1000 }), row("09", { apartment_id: "apartment-b", fee_amount: 1000 }),
  ]);
  assert.deepEqual(plain(await h.service.fetchMaintenanceOverview("apartment-a", "tenant-a", "lease-a")), { activeCount: 2, unpaidFees: 112.25 });
  const count = h.calls.find((call) => call.options?.head);
  assert.equal(count.options.count, "exact");
  const fees = h.calls.find((call) => !call.options?.head);
  assert.ok(fees.filters.some(([key, value]) => key === "tenancy_id" && value === "lease-a"));
  assert.ok(fees.filters.some(([key, value]) => key === "fee_status" && value === "pending"));
  assert.ok(!fees.filters.some(([key]) => key.includes("created") || key.includes("resolved")));
});

test("unpaid-fee totals keyset-page beyond one bounded response and preserve cents", async () => {
  const h = database(Array.from({ length: 425 }, (_, index) => row(String(index).padStart(4, "0"), { fee_amount: 0.10 })));
  assert.deepEqual(plain(await h.service.fetchMaintenanceOverview("apartment-a", "tenant-a", "lease-a")), { activeCount: 0, unpaidFees: 42.5 });
  const fees = h.calls.filter((call) => !call.options?.head);
  assert.equal(fees.length, 3);
  assert.ok(fees.every((call) => call.limit === 200));
  assert.ok(fees[1].filters.some(([key, op, id]) => key === "id" && op === ">" && id === "0199"));
});

test("empty overview is a real zero; read failures reject rather than publishing a partial or false-zero total", async () => {
  assert.deepEqual(plain(await database([]).service.fetchMaintenanceOverview("a", "t", "l")), { activeCount: 0, unpaidFees: 0 });
  for (const countFailure of [true, false]) {
    const h = database([row("01")], (call) => !!call.options?.head === countFailure ? new Error("Access denied") : null);
    await assert.rejects(h.service.fetchMaintenanceOverview("apartment-a", "tenant-a", "lease-a"), /Access denied/);
  }
});

test("dashboard reads active and closed lists independently with stable ordering, bounded payloads, caller scope and no signing", async () => {
  const h = database([row("01", { status: "pending" }), row("02", { status: "in_progress", updated_at: "2026-11-03T09:00:00Z" }), row("03"), row("04", { status: "cancelled" }), row("05", { tenant_id: "other" })]);
  const result = await h.service.fetchTenantMaintenanceRequests("apartment-a", "tenant-a");
  assert.deepEqual(plain(result.map((request) => request.status)), ["In Progress", "Pending", "Resolved", "Cancelled"]);
  assert.equal(h.calls.length, 3);
  assert.equal(result[0].updated_at, "2026-11-03T09:00:00Z");
  for (const call of h.calls) {
    assert.equal(call.limit, 100);
    assert.ok(call.filters.some(([field, value]) => field === "tenant_id" && value === "tenant-a"));
    assert.ok(call.filters.some(([field, value]) => field === "apartment_id" && value === "apartment-a"));
    const progress = call.filters.some(([key, value]) => key === "status" && Array.isArray(value) && value.includes("in_progress"));
    assert.deepEqual(plain(call.orders), [
      ...(progress ? [["updated_at", { ascending: false, nullsFirst: false }]] : []),
      ["created_at", { ascending: false }], ["id", { ascending: false }],
    ]);
    assert.match(call.fields, /updated_at/);
  }
});

test("dashboard splits active/history without duplication and places the form only in a page-owned modal", () => {
  const source = readFileSync(new URL("../app/tenant/maintenance/MaintenanceClient.tsx", import.meta.url), "utf8");
  assert.match(source, /requests\.filter\(\(request\) => canCancelMaintenanceRequest/);
  assert.match(source, /requests\.filter\(\(request\) => !canCancelMaintenanceRequest/);
  assert.match(source, /lg:grid-cols-3/);
  assert.match(source, /requests=\{activeRequests\}/);
  assert.match(source, /requests=\{pastRequests\}/);
  assert.doesNotMatch(source, /<MaintenanceForm/);
  const modal = readFileSync(new URL("../app/tenant/maintenance/components/MaintenanceRequestModal.tsx", import.meta.url), "utf8");
  assert.match(modal, /isDismissable=\{!saving\} isKeyboardDismissDisabled=\{saving\}/);
  assert.match(modal, /isDisabled=\{saving\}/);
  assert.match(modal, /<PropertyContextCard/);
  assert.match(modal, /<MaintenanceForm/);
  assert.match(modal, /await onSubmitted\(\);\s*onOpenChange\(false\)/);
});

test("overview retires old-tenant reads, clears inaccessible totals, and skips queries without a current tenancy", async () => {
  const runtime = hookRuntime();
  const pending = deferred();
  const reads = [];
  let fail = false;
  const resource = compileHook("hooks/use-async-resource.ts", { react: runtime.react });
  const { useMaintenanceOverview } = compileHook("hooks/use-maintenance-overview.ts", {
    react: runtime.react,
    "@/hooks/use-async-resource": resource,
    "@/service/tenantMaintenanceService": { fetchMaintenanceOverview: async (...args) => {
      reads.push(args);
      if (args[1] === "tenant-a") return pending.promise;
      if (fail) throw new Error("Access denied");
      return { activeCount: 2, unpaidFees: 25 };
    } },
  });
  const render = (tenant = "tenant-a", tenancy = "lease-a") => runtime.render(() => useMaintenanceOverview("apartment-a", tenant, tenancy));
  assert.equal(render().data, null); runtime.flush();
  assert.equal(render("tenant-b", "lease-b").data, null); runtime.flush(); await settle();
  assert.equal(render("tenant-b", "lease-b").data.unpaidFees, 25);
  pending.resolve({ activeCount: 99, unpaidFees: 99999 }); await settle();
  assert.equal(render("tenant-b", "lease-b").data.unpaidFees, 25);
  fail = true;
  await render("tenant-b", "lease-b").revalidate();
  const denied = render("tenant-b", "lease-b");
  assert.equal(denied.data, null);
  assert.match(denied.error, /Access denied/);
  assert.equal(render(null, null).data, null); runtime.flush(); await settle();
  assert.equal(render(null, null).data, null);
  assert.equal(reads.length, 3);
  runtime.unmount();
});
