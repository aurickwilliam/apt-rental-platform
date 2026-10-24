import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compile, deferred, hookRuntime, settle } from "./test-support/hook-runtime.mjs";
import * as presentationSeed from "../service/presentation-seed.ts";

const source = file => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const jsx = (type, props, key) => ({ type, props, key });
const jsxRuntime = { jsx, jsxs: jsx, Fragment: "Fragment" };

test("settled server seeds skip initial effects and repeated mounts; background reads retain content", async () => {
  const runtime = hookRuntime();
  const { useAsyncResource } = compile("hooks/use-async-resource.ts", { react: runtime.react });
  let reads = 0;
  const next = deferred();
  const load = () => { reads++; return next.promise; };
  const options = { initial: { data: ["server"] } };
  const render = () => runtime.render(() => useAsyncResource(load, [], "failed", options));
  assert.equal(render().loading, false);
  runtime.flush();
  runtime.unmount();
  assert.equal(reads, 0);
  // New mount, same request seed: there still must be no initial browser read.
  const second = hookRuntime();
  const secondHook = compile("hooks/use-async-resource.ts", { react: second.react }).useAsyncResource;
  const renderSecond = () => second.render(() => secondHook(load, [], "failed", options));
  assert.equal(renderSecond().loading, false);
  second.flush();
  const pending = renderSecond().revalidate();
  await settle();
  assert.equal(renderSecond().loading, false);
  assert.deepEqual(renderSecond().data, ["server"]);
  assert.equal(renderSecond().revalidating, true);
  next.resolve(["fresh"]);
  assert.equal(await pending, true);
  assert.deepEqual(renderSecond().data, ["fresh"]);
});

test("scope changes and unmounts reject late reads, old refresh callbacks and old optimistic setters", async () => {
  const runtime = hookRuntime();
  const { useAsyncResource } = compile("hooks/use-async-resource.ts", { react: runtime.react });
  const a = deferred(), b = deferred();
  let aReads = 0;
  const loadA = () => { aReads++; return a.promise; };
  const loadB = () => b.promise;
  const render = load => runtime.render(() => useAsyncResource(load, [], "failed"));
  const old = render(loadA);
  runtime.flush();
  assert.equal(render(loadB).loading, true);
  runtime.flush();
  b.resolve(["account-b"]);
  await settle();
  a.resolve(["account-a"]);
  await settle();
  old.setData(["late mutation"]);
  assert.equal(await old.revalidate(), false);
  assert.equal(await old.refresh(), false);
  assert.deepEqual(render(loadB).data, ["account-b"]);
  assert.equal(aReads, 1);
  const current = render(loadB);
  runtime.unmount();
  assert.equal(await current.revalidate(), false);
});

test("sensitive refresh failures clear authority; ordinary presentation errors retain data with retry information", async () => {
  for (const clearOnRevalidateError of [false, true]) {
    const runtime = hookRuntime();
    const { useAsyncResource } = compile("hooks/use-async-resource.ts", { react: runtime.react });
    const load = async () => { throw new Error("access unavailable"); };
    const render = () => runtime.render(() => useAsyncResource(load, null, "failed", { initial: { data: "known" }, clearOnRevalidateError }));
    render(); runtime.flush();
    assert.equal(await render().revalidate(), false);
    const state = render();
    assert.equal(state.loading, false);
    assert.equal(state.data, clearOnRevalidateError ? null : "known");
    assert.equal(clearOnRevalidateError ? state.error : state.revalidationError, "access unavailable");
  }
});

test("local auth transitions retire identity immediately, including A → B → A and sign-out", () => {
  const runtime = hookRuntime();
  let onAuth;
  const { useAuthIdentity } = compile("hooks/use-auth-identity.ts", {
    react: runtime.react,
    "@repo/supabase/browser": { createClient: () => ({ auth: { onAuthStateChange(callback) { onAuth = callback; return { data: { subscription: { unsubscribe() {} } } }; } } }) },
  });
  const render = () => runtime.render(() => useAuthIdentity("a"));
  assert.equal(render().authUserId, "a"); runtime.flush();
  onAuth("INITIAL_SESSION", { user: { id: "a" } });
  assert.equal(render().generation, 0);
  onAuth("SIGNED_IN", { user: { id: "b" } });
  onAuth("SIGNED_IN", { user: { id: "a" } });
  assert.equal(render().generation, 2);
  onAuth("SIGNED_OUT", null);
  assert.equal(render().authUserId, null);
});

function rentalHook() {
  const runtime = hookRuntime();
  let identity = { authUserId: "a", generation: 0 };
  let billError = null;
  let paymentError = null;
  let active = { id: "lease-a", apartment: { id: "unit-a" } };
  let authReads = 0, contextReads = 0, billReads = 0;
  const finance = [];
  const client = {
    auth: { getUser: async () => { authReads++; return { data: { user: { id: identity.authUserId } }, error: null }; } },
    rpc: async () => { billReads++; const pending = finance.shift(); if (pending) return pending.promise; return { data: { totalDue: 100 }, error: billError }; },
    from(table) {
      const query = {
        select: () => query, eq: () => query, order: () => query, limit: () => query,
        single: async () => ({ data: { id: "profile", roles: ["tenant"] }, error: null }),
        then: (yes, no) => Promise.resolve({ data: [], error: paymentError }).then(yes, no),
      };
      assert.ok(["users", "payment"].includes(table));
      return query;
    },
  };
  const resource = compile("hooks/use-async-resource.ts", { react: runtime.react });
  const hooks = compile("hooks/use-tenancy.ts", {
    react: runtime.react,
    "@repo/supabase/browser": { createClient: () => client },
    "@/hooks/use-async-resource": resource,
    "@/hooks/use-auth-identity": { useAuthIdentity: () => identity },
    "@/service/tenancyService": { fetchActiveTenancy: async () => { contextReads++; return active; } },
  }, { window: { addEventListener() {}, removeEventListener() {} } });
  const seed = { authUserId: "a", tenancy: active, error: null };
  return {
    render: () => runtime.render(() => hooks.useTenancy(seed)), flush: runtime.flush,
    counts: () => ({ authReads, contextReads, billReads }),
    failBill: () => { billError = { message: "bill unavailable" }; },
    failPayments: () => { paymentError = { message: "history unavailable" }; },
    changeTenancy: () => { active = { id: "lease-b", apartment: { id: "unit-b" } }; },
    changeAccount: () => { identity = { authUserId: "b", generation: 1 }; },
    noTenancy: () => { active = null; },
    pauseFinance: pending => finance.push(pending),
  };
}

test("My Rental uses the server context once, loads finance separately and keeps context during refresh", async () => {
  const h = rentalHook();
  assert.equal(h.render().loading, false);
  assert.equal(h.render().tenancy.id, "lease-a");
  assert.equal(h.render().financeLoading, true);
  h.flush(); await settle();
  assert.deepEqual(h.counts(), { authReads: 0, contextReads: 0, billReads: 1 });
  assert.equal(h.render().tenancy.bill.totalDue, 100);
  const pending = h.render().revalidate();
  assert.equal(h.render().loading, false);
  assert.equal(await pending, true);
  assert.equal(h.render().tenancy.id, "lease-a");
});

test("tenancy/account changes discard old finance, late finance cannot cross identities, and absence is not cached", async () => {
  const h = rentalHook();
  const oldFinance = deferred(); h.pauseFinance(oldFinance);
  h.render(); h.flush(); await settle();
  h.changeAccount(); h.changeTenancy();
  assert.equal(h.render().tenancy, null);
  h.flush(); await settle();
  assert.equal(h.render().tenancy.id, "lease-b");
  assert.equal(h.render().tenancy.bill, null);
  h.flush(); await settle();
  oldFinance.resolve({ data: { totalDue: 9999 }, error: null }); await settle();
  assert.equal(h.render().tenancy.bill.totalDue, 100);
  h.noTenancy(); await h.render().revalidate();
  assert.equal(h.render().tenancy, null);
  assert.equal(h.render().payments.length, 0);
});

test("bill and payment-history failures never publish a payable amount from partial finance", async () => {
  for (const failure of ["failBill", "failPayments"]) {
    const h = rentalHook(); h[failure](); h.render(); h.flush(); await settle();
    assert.equal(h.render().loading, false);
    assert.ok(failure === "failBill" ? h.render().financeError : h.render().paymentError);
    if (failure === "failBill") assert.equal(h.render().tenancy.bill, null);
  }
  const client = source("app/tenant/my-rental/MyRentalClient.tsx");
  assert.match(client, /financeError \|\| paymentError \? \(/);
  assert.ok(client.indexOf("Pay now") > client.indexOf("paymentError ? ("));
});

test("server rental loader authorizes first, shares the caller-bound query, and passes context but never finance", async () => {
  for (const role of ["tenant", "landlord", null]) {
    let contextReads = 0;
    const client = { auth: { getUser: async () => ({ data: { user: role ? { id: "auth-a" } : null } }) }, from() {
      const query = { select: () => query, eq: () => query, single: async () => ({ data: { id: "profile-a", roles: [role] }, error: null }) }; return query;
    } };
    const page = compile("app/tenant/my-rental/page.tsx", {
      "react/jsx-runtime": jsxRuntime,
      "next/navigation": { redirect: path => { throw new Error(`redirect:${path}`); } },
      "@repo/supabase/server": { createClient: async () => client },
      "@/lib/server-identity": { requirePortalViewer: async portal => {
        if (role !== portal) throw new Error("redirect:/browse");
        return { supabase: client, user: { id: "auth-a" }, profile: { id: "profile-a", roles: [role] } };
      } },
      "@/lib/presentation-seed-server": compile("lib/presentation-seed-server.ts", { "server-only": {} }),
      "@/service/tenantApplicationsService": { fetchTenantApplications: async () => [] },
      "@/service/tenancy-context": { fetchActiveTenancyWith: async (boundClient, id) => { assert.equal(boundClient, client); assert.equal(id, "profile-a"); contextReads++; return { id: "lease-a" }; } },
      "./MyRentalClient": { default: "MyRentalClient" },
    });
    if (role === "tenant") {
      const tree = await page.default();
      assert.equal(tree.props.initialContext.tenancy.id, "lease-a");
      assert.equal(tree.props.initialContext.authUserId, "auth-a");
      assert.ok(Number.isFinite(Date.parse(tree.props.initialContext.renderedAt)));
      assert.equal(tree.props.initialContext.tenancy.bill, undefined);
      assert.equal(contextReads, 1);
    } else {
      await assert.rejects(page.default(), /redirect:/);
      assert.equal(contextReads, 0);
    }
  }
});

test("decisions remain pending through non-blocking reconciliation and cannot submit twice", async () => {
  for (const decision of ["approve", "reject"]) {
    const runtime = hookRuntime(); const write = deferred(), refresh = deferred();
    let writes = 0, refreshes = 0;
    const hooks = compile("hooks/use-landlord-application-actions.ts", {
      react: runtime.react,
      "@/service/landlordApplicationsService": { approveApplication: () => { writes++; return write.promise; }, rejectApplication: () => { writes++; return write.promise; } },
    });
    const reconcile = () => { refreshes++; return refresh.promise; };
    const render = () => runtime.render(() => hooks.useLandlordApplicationActions(reconcile));
    const initial = render(); runtime.flush();
    const pending = initial[decision]("application", "reason");
    await initial[decision]("application", "reason");
    assert.equal(writes, 1);
    write.resolve(); await settle();
    assert.equal(render().actionLoading, true);
    assert.equal(refreshes, 1);
    refresh.resolve(true); await pending;
    assert.equal(render().actionLoading, false);
    await render()[decision]("application", "reason");
    assert.equal(writes, 1);
  }
});

test("lease confirmation locks duplicate submissions and a failed refresh retries the read, never the write", async () => {
  const runtime = hookRuntime(); const write = deferred(), refresh = deferred();
  let writes = 0, refreshes = 0;
  const { default: SignedLeaseCard } = compile("app/tenant/my-rental/components/SignedLeaseCard.tsx", {
    react: runtime.react, "react/jsx-runtime": jsxRuntime,
    "@heroui/react": { Button: "Button" },
    "@tabler/icons-react": { IconFileText: "FileText", IconShieldCheck: "ShieldCheck" },
    "@/app/components/display/ErrorBanner": { default: "ErrorBanner" },
    "@/app/tenant/payment/utils": { formatLeaseDate: value => value },
    "@/lib/signed-lease": { signedLeaseStatus: (path, ack) => !path ? "missing" : ack ? "acknowledged" : "pending" },
    "@/service/signedLeaseService": { acknowledgeSignedLease: () => { writes++; return write.promise; } },
    "./DashboardCard": { default: "DashboardCard" },
    "@/app/components/display/StatusChip": { default: "StatusChip" },
  });
  const nodes = node => !node || typeof node !== "object" ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
  const props = { tenancyId: "lease-a", path: "lease-a/current.pdf", uploadedAt: "2026-10-01", acknowledgedAt: null, onView() {}, viewing: false,
    onAcknowledged: () => { refreshes++; return refreshes === 1 ? refresh.promise : Promise.resolve(true); } };
  const render = () => nodes(runtime.render(() => SignedLeaseCard(props)));
  const initial = render(); runtime.flush();
  const confirm = initial.find(node => node.type === "Button" && node.props.isPending !== undefined);
  confirm.props.onPress(); confirm.props.onPress();
  assert.equal(writes, 1);
  assert.ok(render().some(node => node.type === "Button" && node.props.isDisabled && node.props.isPending));
  write.resolve(); await settle();
  assert.equal(refreshes, 1);
  refresh.resolve(false); await settle();
  confirm.props.onPress();
  assert.equal(writes, 1, "even an old handler cannot resubmit a successful acknowledgment");
  const retry = render().find(node => node.type === "Button" && node.props.children === "Refresh lease details");
  assert.ok(retry);
  retry.props.onPress(); await settle();
  assert.equal(refreshes, 2);
  assert.equal(writes, 1);
  assert.ok(!render().some(node => node.type === "ErrorBanner"));
});

test("a successful decision with failed reconciliation stays decided; an unmounted decision cannot refresh another account", async () => {
  for (const leave of [false, true]) {
    const runtime = hookRuntime(); const write = deferred(); let refreshes = 0, writes = 0;
    const { useLandlordApplicationActions } = compile("hooks/use-landlord-application-actions.ts", {
      react: runtime.react,
      "@/service/landlordApplicationsService": { approveApplication: () => { writes++; return write.promise; }, rejectApplication() {} },
    });
    const refresh = async () => { refreshes++; return false; };
    const render = () => runtime.render(() => useLandlordApplicationActions(refresh));
    const state = render(); runtime.flush();
    const pending = state.approve("app");
    if (leave) runtime.unmount();
    write.resolve(); await pending;
    assert.equal(refreshes, leave ? 0 : 1);
    if (!leave) {
      assert.equal(render().localStatus, "Approved");
      assert.match(render().errorMessage, /decision was saved/);
      await render().approve("app");
      assert.equal(writes, 1);
    }
  }
});

test("loading composition retains one maintenance heading and common finance geometry; mutations do not block-refresh", () => {
  assert.match(source("app/tenant/maintenance/MaintenanceClient.tsx"), /<MaintenancePageSkeleton showHeader=\{false\} \/>/);
  const skeleton = source("app/tenant/my-rental/components/MyRentalSkeleton.tsx");
  const client = source("app/tenant/my-rental/MyRentalClient.tsx");
  for (const component of ["RentFinanceSkeleton", "PaymentHistorySkeleton"]) {
    assert.match(skeleton, new RegExp(`<${component} />`));
    assert.match(client, new RegExp(`<${component} />`));
  }
  assert.doesNotMatch(client, /variant="applications"/);
  assert.match(client, /identity\.generation === 0 \? initialContext : undefined/);
  assert.match(client, /<RentalContent key=/);
  assert.match(client, /seed\?\.renderedAt \?\? "browser"/);
  assert.match(client, /const renderedAt = initialContext\?\.renderedAt;/);
  assert.match(client, /new Date\(renderedAt\)/);
  assert.match(client, /timeZone: "Asia\/Manila"/);
  assert.match(client, /onAcknowledged=\{async \(\) => \{\s*return revalidate\(\);/);
  assert.match(source("app/landlord/applications/[applicationId]/page.tsx"), /useLandlordApplicationActions\(revalidate\)/);
  assert.match(source("app/landlord/payments/page.tsx"), /\{loading \? \(\s*<PaymentsBodySkeleton/);
});

function detailResource(kind) {
  const runtime = hookRuntime();
  let identity = { authUserId: "account-a", generation: 0 };
  const reads = [];
  const queued = [];
  const fetch = async id => {
    reads.push(id);
    return queued.length ? queued.shift().promise : kind === "payment" ? { id, status: "pending", amount: 100 } : kind === "tenantVisit" ? { current: { id: "visit-a", status: "rescheduled" }, history: [] } : [{ id: "visit-a", status: "pending" }];
  };
  const resource = compile("hooks/use-async-resource.ts", { react: runtime.react });
  const common = { react: runtime.react, "@/service/presentation-seed": presentationSeed, "@/hooks/use-async-resource": resource, "@/hooks/use-auth-identity": { useAuthIdentity: () => identity } };
  const hook = kind === "payment"
    ? compile("hooks/use-landlord-payments.ts", { ...common, "@/service/landlordPaymentService": { fetchLandlordPaymentById: fetch } }).useLandlordPayment
    : kind === "tenantVisit"
      ? compile("hooks/use-visit-request.ts", { ...common, "@/service/favoritesService": { getTenantContext: async () => ({ tenantId: "tenant-a" }) }, "@/service/visitRequestsService": { fetchVisitRequest: fetch } }).useVisitRequest
      : compile("hooks/use-landlord-visit-requests.ts", { ...common, "@/service/landlordVisitRequestsService": { fetchLandlordVisitRequests: fetch } }).useLandlordVisitRequests;
  return {
    render: id => runtime.render(() => hook(id)), flush: runtime.flush, unmount: runtime.unmount,
    queue: pending => queued.push(pending), reads,
    account: authUserId => { identity = { authUserId, generation: identity.generation + 1 }; },
    value: state => kind === "payment" ? state.payment : kind === "tenantVisit" ? state.visitRequest : state.visitRequests[0] ?? null,
  };
}

for (const kind of ["payment", "tenantVisit", "landlordVisit"]) {
  const id = kind === "payment" ? "payment-a" : kind === "tenantVisit" ? "application-a" : "visit-a";
  test(`${kind}: background reconciliation retains loaded content without full-page loading, failures clear private data`, async () => {
    const h = detailResource(kind);
    h.render(id); h.flush(); await settle();
    const initial = h.value(h.render(id));
    assert.ok(initial);
    const next = deferred(); h.queue(next);
    const pending = h.render(id).revalidate(); await settle();
    assert.equal(h.render(id).loading, false);
    assert.equal(h.render(id).revalidating, true);
    assert.equal(h.value(h.render(id)), initial);
    const updated = { ...initial, status: "paid" };
    next.resolve(kind === "payment" ? updated : kind === "tenantVisit" ? { current: updated, history: [] } : [updated]);
    assert.equal(await pending, true);
    assert.equal(h.value(h.render(id)).status, "paid");
    const failure = deferred(); h.queue(failure);
    const failed = h.render(id).revalidate(); await settle();
    failure.reject(new Error("Read denied or unavailable"));
    assert.equal(await failed, false);
    assert.equal(h.render(id).loading, false);
    assert.equal(h.value(h.render(id)), null);
    assert.match(h.render(id).error, /Read denied/);
    assert.equal(await h.render(id).revalidate(), true);
    assert.ok(h.value(h.render(id)));
  });

  test(`${kind}: resource/account handovers immediately hide old data, reject late reads and retire callbacks`, async () => {
    const h = detailResource(kind);
    h.render(id); h.flush(); await settle();
    const old = h.render(id);
    const late = deferred(); h.queue(late);
    const pending = old.revalidate(); await settle();
    const nextId = `${id}-next`;
    assert.equal(h.value(h.render(nextId)), null);
    h.flush(); await settle();
    late.resolve(kind === "payment" ? { id, status: "paid" } : kind === "tenantVisit" ? { current: { id: "old" }, history: [] } : [{ id: "old" }]);
    assert.equal(await pending, false);
    assert.notEqual(h.value(h.render(nextId))?.id, "old");
    const count = h.reads.length;
    assert.equal(await old.revalidate(), false);
    assert.equal(h.reads.length, count);
    h.account("account-b");
    assert.equal(h.value(h.render(nextId)), null);
    h.flush(); await settle();
    assert.equal(h.render(nextId).loading, false);
    h.account(null);
    assert.equal(h.value(h.render(nextId)), null);
    h.flush(); await settle();
    const signedOutReads = h.reads.length;
    await h.render(nextId).revalidate();
    assert.equal(h.reads.length, signedOutReads);
    h.unmount();
    assert.equal(await h.render(nextId).revalidate(), false);
  });
}

test("receipts/visits disappearing during reconciliation become unavailable, never actionable empty states", async () => {
  const empty = detailResource("tenantVisit"), emptyRead = deferred();
  empty.queue(emptyRead); empty.render("application-no-visit"); empty.flush();
  emptyRead.resolve({ current: null, history: [] }); await settle();
  assert.equal(empty.render("application-no-visit").error, null);
  assert.equal(empty.value(empty.render("application-no-visit")), null, "an application with no visit remains a valid initial state");
  for (const kind of ["payment", "tenantVisit", "landlordVisit"]) {
  const h = detailResource(kind);
  const id = kind === "payment" ? "payment-a" : kind === "tenantVisit" ? "application-a" : "visit-a";
  h.render(id); h.flush(); await settle();
  const next = deferred(); h.queue(next);
  const pending = h.render(id).revalidate();
  await settle(); next.resolve(kind === "payment" ? null : kind === "tenantVisit" ? { current: null, history: [] } : []);
  assert.equal(await pending, false);
  const state = h.render(id);
  assert.equal(state.loading, false);
  assert.equal(h.value(state), null);
  assert.match(state.error, /no longer available/);
  // A retry cannot reinterpret disappearance as a valid new empty resource.
  const retryRead = deferred(); h.queue(retryRead);
  const retry = h.render(id).revalidate(); await settle();
  retryRead.resolve(kind === "payment" ? null : kind === "tenantVisit" ? { current: null, history: [] } : []);
  assert.equal(await retry, false);
  }
});

test("successful mutations lock synchronously through reconciliation; failed reads only retry the read", async () => {
  const runtime = hookRuntime();
  const hooks = compile("hooks/use-reconciled-action.ts", { react: runtime.react });
  const write = deferred(), read = deferred();
  let writes = 0, reads = 0;
  const reconcile = () => { reads++; return reads === 1 ? read.promise : Promise.resolve(true); };
  const mutate = () => { writes++; return write.promise; };
  const render = () => runtime.render(() => hooks.useReconciledAction(reconcile));
  const initial = render(); runtime.flush();
  const pending = initial.run(mutate);
  assert.equal(await initial.run(mutate), null);
  assert.equal(render().blocked, true);
  write.resolve(true); await settle();
  assert.equal(render().pending, true);
  assert.equal(writes, 1); assert.equal(reads, 1);
  read.resolve(false);
  assert.equal(await pending, "unresolved");
  assert.equal(render().blocked, true);
  assert.match(render().error, /could not be verified/);
  assert.equal(await initial.run(mutate), null, "an old handler cannot repeat a saved write");
  await render().retry();
  assert.equal(reads, 2); assert.equal(writes, 1);
  assert.equal(render().blocked, false); assert.equal(render().error, null);
});

test("write failures, uncertain exceptions, cancellation navigation and unmount have distinct safe outcomes", async () => {
  for (const mode of ["failure", "throw", "navigation", "unmount"]) {
    const runtime = hookRuntime();
    const { useReconciledAction } = compile("hooks/use-reconciled-action.ts", { react: runtime.react });
    let reads = 0, writes = 0;
    const write = deferred();
    const reconcile = async () => { reads++; return true; };
    const render = () => runtime.render(() => useReconciledAction(reconcile));
    const initial = render(); runtime.flush();
    const pending = initial.run(() => { writes++; return write.promise; }, mode !== "navigation");
    if (mode === "unmount") runtime.unmount();
    if (mode === "throw") write.reject(new Error("unknown outcome"));
    else write.resolve(mode !== "failure");
    assert.equal(await pending, mode === "failure" ? "failed" : mode === "throw" ? "unresolved" : mode === "navigation" ? "confirmed" : null);
    assert.equal(reads, 0, "navigation and retired actions never issue pre-navigation/late reads");
    if (["throw", "navigation", "unmount"].includes(mode)) assert.equal(await initial.run(async () => { writes++; return true; }), null);
    assert.equal(writes, 1);
    if (mode === "failure") assert.equal(render().blocked, false);
  }
  const runtime = hookRuntime();
  const { useReconciledAction } = compile("hooks/use-reconciled-action.ts", { react: runtime.react });
  const retryRead = async () => false;
  const render = () => runtime.render(() => useReconciledAction(retryRead));
  render(); runtime.flush(); await render().retry();
  assert.match(render().error, /could not be verified/);
  assert.doesNotMatch(render().error, /was saved/, "a failed initial read must never claim a write occurred");
});

test("detail action lifetimes are keyed by account generation and exact destination; no speculative receipt status", () => {
  for (const [file, id] of [
    ["app/tenant/applications/[applicationId]/ApplicationDetailClient.tsx", "applicationId"],
    ["app/landlord/visit-requests/[requestId]/page.tsx", "requestId"],
    ["app/landlord/payments/[paymentId]/page.tsx", "paymentId"],
  ]) {
    const page = source(file);
    const expectedKey = file.endsWith("ApplicationDetailClient.tsx")
      ? 'key={`${identity.authUserId}:${identity.generation}:${applicationId}:${seed?.renderedAt ?? "browser"}`}'
      : `key={\`\${identity.authUserId}:\${identity.generation}:\${${id}}\`}`;
    assert.ok(page.includes(expectedKey));
    assert.match(page, /useReconciledAction\(/);
    assert.doesNotMatch(page, /await refresh\(\)|void refetchVisit\(\)|void paymentQuery\.refetch\(\)/);
  }
  const receipt = source("app/landlord/payments/[paymentId]/page.tsx");
  assert.match(receipt, /action\.run\(\(\) => confirmMutation\.confirm\(paymentId\)\)/);
  assert.match(receipt, /action\.run\(\(\) => confirmMutation\.reject\(paymentId\)\)/);
  assert.doesNotMatch(receipt, /applyStatus|status: "paid"|status: "rejected"/);
  assert.doesNotMatch(source("app/tenant/applications/[applicationId]/ApplicationDetailClient.tsx"), /identity\.authUserId === undefined\) return <ApplicationDetailSkeleton/);
  const visit = source("app/landlord/visit-requests/[requestId]/page.tsx");
  for (const dialog of ["approveDialog", "rejectDialog", "rescheduleDialog"]) {
    assert.ok(visit.includes(`if (result === "confirmed" || result === "unresolved") ${dialog}.setOpen(false)`), "a read-only retry must not reopen a completed decision dialog");
  }
});

test("route body handoffs contain loading status and shells, never a second full-body skeleton", () => {
  const routeStatus = source("app/components/display/RouteLoadingStatus.tsx");
  assert.match(routeStatus, /role="status" aria-busy="true"/);
  for (const [file, shell, forbidden] of [
    ["app/tenant/payment/loading.tsx", "PaymentPageShell", "PaymentPageSkeleton"],
    ["app/tenant/passport/loading.tsx", "PassportPageShell", "PassportWalletSkeleton"],
    ["app/landlord/passport/loading.tsx", "PassportPageShell", "PassportWalletSkeleton"],
    ["app/tenant/passport/[documentId]/loading.tsx", "PassportPageShell", "PassportDetailSkeleton"],
    ["app/landlord/passport/[documentId]/loading.tsx", "PassportPageShell", "PassportDetailSkeleton"],
    ["app/landlord/applications/[applicationId]/loading.tsx", "ApplicationDetailShell", "ApplicationDetailSkeleton"],
    ["app/landlord/maintenance-requests/[requestId]/loading.tsx", "MaintenanceDetailShell", "MaintenanceDetailSkeleton"],
  ]) {
    const contents = source(file);
    assert.ok(contents.includes(`<${shell}>`), file);
    assert.ok(contents.includes("<RouteLoadingStatus>"), file);
    assert.ok(!contents.includes(forbidden), file);
    assert.doesNotMatch(contents, /createClient|fetchPassport|SignedUrl|linkApprovedVerification/);
  }
});

test("nested payment destinations override the parent fallback with the same neutral client loading view", () => {
  for (const [route, component, message] of [
    ["app/tenant/payment/history", "PaymentHistorySkeleton", null],
    ["app/tenant/payment/success", "PaymentStatusLoading", "Loading your receipt…"],
    ["app/tenant/payment/verify", "PaymentStatusLoading", "Verifying payment…"],
    ["app/landlord/payments/[paymentId]", "PaymentStatusLoading", "Loading receipt…"],
  ]) {
    const fallback = source(`${route}/loading.tsx`);
    const client = source(`${route}/page.tsx`);
    assert.ok(fallback.includes(`<${component}`));
    assert.ok(client.includes(`<${component}`));
    if (message) { assert.ok(fallback.includes(message)); assert.ok(client.includes(message)); }
    assert.doesNotMatch(fallback, /PaymentPageSkeleton|PaymentsSkeleton|ReceiptView|paid|confirmed|successfully/i);
  }
  const route = "app/landlord/properties/[apartmentId]/payment-history";
  const client = source(`${route}/components/PaymentHistoryClient.tsx`);
  assert.match(source(`${route}/loading.tsx`), /<PropertyPaymentHistoryShell><RouteLoadingStatus>/);
  assert.doesNotMatch(source(`${route}/loading.tsx`), /PropertyDetailSkeleton/);
  assert.ok(client.indexOf("<PropertyPaymentHistoryShell") < client.indexOf("paymentsQuery.loading ?"));
  assert.doesNotMatch(client, /if \(paymentsQuery.loading\)/);
});

function treeNodes(node) {
  if (!node || typeof node !== "object") return [];
  const children = typeof node.type === "function" ? node.type(node.props) : node.props?.children;
  return [node, ...[children].flat(Infinity).flatMap(treeNodes)];
}

test("rendered payment loading screens announce only loading, and route/client receipt layouts match", () => {
  const { default: Loading } = compile("app/tenant/payment/components/PaymentStatusLoading.tsx", {
    "react/jsx-runtime": jsxRuntime, "@heroui/react": { Spinner: "Spinner" },
  });
  for (const [file, message, receipt] of [
    ["app/tenant/payment/success/loading.tsx", "Loading your receipt…", false],
    ["app/tenant/payment/verify/loading.tsx", "Verifying payment…", false],
    ["app/landlord/payments/[paymentId]/loading.tsx", "Loading receipt…", true],
  ]) {
    const Route = compile(file, { "react/jsx-runtime": jsxRuntime, "../components/PaymentStatusLoading": { default: Loading }, "@/app/tenant/payment/components/PaymentStatusLoading": { default: Loading } }).default;
    const route = treeNodes(Route());
    const client = treeNodes(Loading({ message, receipt }));
    assert.deepEqual(route.filter(n => n.type === "div").map(n => n.props.className), client.filter(n => n.type === "div").map(n => n.props.className));
    assert.ok(route.some(n => n.props.role === "status" && n.props["aria-busy"] === "true"));
    assert.equal(route.filter(n => n.type === "p")[0].props.children, message);
    assert.equal(route.filter(n => n.type === "Spinner").length, 1);
  }
});

test("receipt actions retain authoritative pending content until a fresh read, block duplicates and fail closed", async () => {
  for (const decision of ["confirm", "reject"]) for (const readSucceeds of [true, false]) {
    const runtime = hookRuntime();
    const actionHook = compile("hooks/use-reconciled-action.ts", { react: runtime.react });
    const initialPayment = { id: "payment-a", status: "pending", method: "cash", amount: 100 };
    const write = deferred(), read = deferred();
    let writes = 0, reads = 0;
    const query = { payment: initialPayment, loading: false, error: null, revalidate: async () => {
      reads++;
      const ok = await read.promise;
      if (ok) query.payment = { ...initialPayment, status: decision === "confirm" ? "paid" : "rejected" };
      else { query.payment = null; query.error = "Access/read unavailable"; }
      return ok;
    } };
    const mutate = async () => { writes++; return write.promise; };
    const Modal = Object.assign("Modal", { Root: "Modal.Root", Backdrop: "Modal.Backdrop", Container: "Modal.Container", Dialog: "Modal.Dialog", Header: "Modal.Header", Body: "Modal.Body", Footer: "Modal.Footer" });
    const { default: Page } = compile("app/landlord/payments/[paymentId]/page.tsx", {
      react: { ...runtime.react, Suspense: "Suspense" }, "react/jsx-runtime": jsxRuntime,
      "next/navigation": { useParams: () => ({ paymentId: "payment-a" }), useRouter: () => ({ back() {} }) },
      "@heroui/react": { Button: "Button", Modal, useOverlayState: options => options },
      "@tabler/icons-react": { IconArrowLeft: "ArrowLeft" },
      "@/app/tenant/payment/utils": { methodLabel: () => "Cash", periodMonthLabel: () => "October" },
      "@/app/tenant/payment/components/ReceiptView": { default: "ReceiptView" },
      "@/hooks/use-landlord-payments": { useLandlordPayment: () => query, useLandlordPaymentConfirmation: () => ({ confirm: mutate, reject: mutate, pending: false, error: null, clearError() {} }) },
      "@/hooks/use-auth-identity": { useAuthIdentity: () => ({ authUserId: "account-a", generation: 0 }) },
      "@/hooks/use-reconciled-action": actionHook,
      "@/app/components/display/ReconciliationNotice": { default: "ReconciliationNotice" },
      "@/app/tenant/payment/components/PaymentStatusLoading": { default: "PaymentStatusLoading" },
    });
    const render = () => runtime.render(() => treeNodes(Page()));
    const before = render(); runtime.flush();
    const target = before.find(n => n.type === "Button" && n.props.children === (decision === "confirm" ? "Confirm" : "Decline") && n.props.size === "sm");
    target.props.onPress(); target.props.onPress();
    assert.equal(writes, 1);
    write.resolve(true); await settle();
    const during = render();
    assert.equal(during.find(n => n.type === "ReceiptView").props.payment.status, "pending");
    assert.ok(during.find(n => n.type === "ReconciliationNotice").props.pending);
    assert.equal(during.some(n => n.type === "PaymentStatusLoading"), false);
    assert.ok(during.filter(n => n.type === "Button" && ["Confirm", "Decline"].includes(n.props.children)).every(n => n.props.isDisabled));
    const reconcilingButtons = during.filter(n => n.type === "Button" && n.props.children === "Updating receipt…");
    assert.equal(reconcilingButtons.length, 2);
    assert.ok(reconcilingButtons.every(n => n.props.isDisabled));
    read.resolve(readSucceeds); await settle();
    const after = render();
    if (readSucceeds) assert.equal(after.find(n => n.type === "ReceiptView").props.payment.status, decision === "confirm" ? "paid" : "rejected");
    else {
      assert.equal(after.some(n => n.type === "ReceiptView"), false);
      assert.match(after.find(n => n.type === "ReconciliationNotice").props.error, /could not be verified/);
      target.props.onPress(); await settle();
      assert.equal(writes, 1);
    }
    assert.equal(reads, 1);
  }
});

test("visit cancellation dialog awaits the actual result before closing and never emits premature success", async () => {
  const runtime = hookRuntime();
  const cancelled = deferred(); let closes = 0, writes = 0;
  const Modal = Object.assign("Modal", Object.fromEntries(["Backdrop", "Container", "Dialog", "Header", "Heading", "Body", "Footer"].map(k => [k, `Modal.${k}`])));
  const { default: Card } = compile("app/tenant/applications/components/VisitRequestDetailsCard.tsx", {
    "react/jsx-runtime": jsxRuntime,
    "@heroui/react": { Card: "Card", Button: "Button", Separator: "Separator", Modal, useOverlayState: () => ({ isOpen: true, setOpen: () => closes++ }) },
    "@/app/components/display/StatusChip": { default: "StatusChip" },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
  });
  const nodes = treeNodes(Card({ visit: { status: "pending", visit_date: "2026-10-01", time: "09:00", created_at: "2026-10-01" }, onCancel: () => { writes++; return cancelled.promise; }, actionLoading: false }));
  const button = nodes.find(n => n.type === "Button" && n.props.children === "Yes, Cancel");
  const pending = button.props.onPress();
  assert.equal(writes, 1); assert.equal(closes, 0);
  cancelled.resolve(false); await pending;
  assert.equal(closes, 0);
  runtime.unmount();
});

test("property payment history preserves its known shell during loading/error and retires server context on session change", () => {
  const runtime = hookRuntime();
  let identity = { authUserId: "account-a", generation: 1 };
  const query = { payments: [], loading: true, error: null, revalidating: false, refresh: async () => true };
  const navigation = { useRouter: () => ({ push() {} }), useParams: () => ({ apartmentId: "property-a" }) };
  const components = { Button: "Button", Card: "Card", Chip: "Chip" };
  const icons = new Proxy({}, { get: (_, key) => key });
  const { default: Shell } = compile("app/landlord/properties/[apartmentId]/payment-history/components/PropertyPaymentHistoryShell.tsx", {
    "react/jsx-runtime": jsxRuntime, "next/navigation": navigation, "@heroui/react": components, "@tabler/icons-react": icons,
  });
  const { default: Client } = compile("app/landlord/properties/[apartmentId]/payment-history/components/PaymentHistoryClient.tsx", {
    react: runtime.react, "react/jsx-runtime": jsxRuntime, "next/link": { default: "Link" },
    "@heroui/react": components, "@tabler/icons-react": icons,
    "@repo/utils": { formatPesoDisplay: value => value },
    "@/app/tenant/payment/utils": { paymentStatusLabel: value => value },
    "@/hooks/use-landlord-payments": { useLandlordPayments: () => query },
    "@/hooks/use-auth-identity": { useAuthIdentity: () => identity },
    "@/app/components/display/StatusChip": { default: "StatusChip" },
    "@/app/tenant/payment/components/PaymentHistoryFilters": { default: "Filters" },
    "./PropertyPaymentHistoryShell": { default: Shell },
    "@/app/components/display/RouteLoadingStatus": { default: "RouteLoadingStatus" },
  });
  const render = () => runtime.render(() => treeNodes(Client({ apartmentId: "property-a", apartmentName: "Private property name" })));
  render();
  const loading = render();
  const frame = loading.find(n => n.type === "div");
  assert.match(frame.props.className, /\bp-4 md:p-6\b/);
  assert.doesNotMatch(frame.props.className, /max-w-5xl|mx-auto/);
  assert.ok(loading.some(n => n.type === "h1"));
  assert.ok(loading.some(n => n.type === "p" && n.props.children === "Private property name"));
  assert.ok(loading.some(n => n.type === "RouteLoadingStatus"));
  assert.equal(loading.some(n => n.props.children === "No payments found"), false);
  query.loading = false; query.error = "Read unavailable";
  const failed = render();
  assert.ok(failed.some(n => n.type === "h1"));
  assert.equal(failed.some(n => n.props.children === "Private property name"), false);
  assert.ok(failed.some(n => n.props.children === "Try Again"));
  identity = { authUserId: "account-b", generation: 2 };
  const changed = render();
  assert.equal(changed.some(n => n.props.children === "Private property name"), false);
  assert.ok(changed.some(n => n.props.role === "alert" && n.props.children.includes("session changed")));
});

test("portal width integration reaches extracted My Rental and detail shells without restoring body loading owners", () => {
  const rental = source("app/tenant/my-rental/MyRentalClient.tsx");
  const skeleton = source("app/tenant/my-rental/components/MyRentalSkeleton.tsx");
  assert.doesNotMatch(rental, /max-w-7xl/);
  assert.doesNotMatch(skeleton, /max-w-7xl|variant ===/);
  for (const contents of [rental, skeleton]) {
    assert.match(contents, /@container\/rental min-w-0/);
    assert.match(contents, /<RentFinanceSkeleton \/>/);
    assert.match(contents, /<PaymentHistorySkeleton \/>/);
  }
  const { default: Shell } = compile("app/landlord/applications/[applicationId]/components/ApplicationDetailShell.tsx", {
    "react/jsx-runtime": jsxRuntime, "next/link": { default: "Link" },
    "@tabler/icons-react": { IconArrowLeft: "ArrowLeft" },
  });
  const shell = treeNodes(Shell({ children: "body" }));
  assert.match(shell[0].props.className, /\bp-4 md:p-6\b/);
  assert.equal(shell.filter(n => n.type === "h1").length, 1);
  const tenantApplication = source("app/tenant/applications/[applicationId]/ApplicationDetailClient.tsx");
  assert.doesNotMatch(tenantApplication, /max-w-7xl/);
  assert.doesNotMatch(source("app/tenant/payment/components/PaymentPageLayout.tsx"), /max-w-7xl/);
  assert.doesNotMatch(source("app/components/passport/PassportPageLayout.tsx"), /max-w-7xl/);
  assert.doesNotMatch(source("app/tenant/maintenance/loading.tsx"), /max-w-7xl/);
});
