import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const compiled = ts.transpileModule(readFileSync(new URL("../../../supabase/functions/paymongo/index.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

// Exercise the actual Edge Function handler with a fake provider/database.
// SQL validation itself is exercised by db:billing:test, not reimplemented here.
function harness({ real = true, secretKey = "sk_test_fake", rejectInsert = false, provider, rows = [], accountStatus = "verified", acceptedMethods = null, insertError = null } = {}) {
  const payments = [...rows];
  const events = [];
  let handler;
  class Query {
    constructor(table) { this.table = table; this.filters = []; }
    select() { return this; }
    eq(key, value) { this.filters.push(row => row[key] === value); return this; }
    neq(key, value) { this.filters.push(row => row[key] !== value); return this; }
    is(key, value) { return this.eq(key, value); }
    order() { return this; }
    limit() { return this; }
    insert(value) { this.insertValue = value; return this; }
    update(value) { this.updateValue = value; return this; }
    async execute(single = false) {
      if (this.table === "users") return { data: { id: "tenant-1", account_status: accountStatus }, error: null };
      if (this.table === "landlord_payment_settings") return { data: acceptedMethods ? { accepted_methods: acceptedMethods } : null, error: null };
      if (this.table === "tenancies") return { data: { id: "lease-1", apartment_id: "apt-1", monthly_rent: 15000, apartment: { landlord_id: "owner-1" } }, error: null };
      assert.equal(this.table, "payment");
      if (this.insertValue) {
        events.push("reserve");
        if (insertError) return { data: null, error: insertError };
        // Mirrors payment_one_pending_online_idx: one pending online payment per tenancy and period.
        const duplicate = payments.some(p => p.status === "pending" && p.method !== "cash" && this.insertValue.method !== "cash"
          && p.tenancy_id === this.insertValue.tenancy_id && (p.period_start ?? null) === (this.insertValue.period_start ?? null));
        if (rejectInsert || duplicate) return { data: null, error: { message: "Bill validation failed or payment already pending." } };
        const row = { id: `payment-${payments.length + 1}`, ...this.insertValue };
        payments.push(row);
        return { data: row, error: null };
      }
      const matched = payments.filter(row => this.filters.every(filter => filter(row)));
      if (this.updateValue) {
        events.push(`update:${this.updateValue.status ?? "metadata"}`);
        matched.forEach(row => Object.assign(row, this.updateValue));
      }
      return { data: single ? matched[0] ?? null : matched, error: null };
    }
    single() { return this.execute(true); }
    maybeSingle() { return this.execute(true); }
    then(resolve, reject) { return this.execute(false).then(resolve, reject); }
  }
  const db = {
    auth: { getUser: async () => ({ data: { user: { id: "auth-1" } }, error: null }) },
    from: table => new Query(table),
  };
  vm.runInNewContext(compiled, {
    exports: {},
    require: name => { assert.equal(name, "jsr:@supabase/supabase-js@2"); return { createClient: () => db }; },
    Deno: { env: { get: name => name === "PAYMONGO_SECRET_KEY" && real ? secretKey : undefined }, serve: fn => { handler = fn; } },
    Response, Request, URL, console: { error() {}, warn() {} },
    btoa: value => Buffer.from(value).toString("base64"),
    fetch: async (url, options) => {
      events.push("provider");
      assert.ok(payments.some(row => row.status === "pending"), "provider must never be called before reservation");
      return provider ? provider(url, options) : Response.json({ data: { id: "cs_provider", attributes: { status: "active", checkout_url: "https://checkout.paymongo.com/test" } } });
    },
  });
  async function invoke(action, payload = {}) {
    const response = await handler(new Request("https://example.invalid/paymongo", {
      method: "POST", headers: { Authorization: "Bearer fake-jwt", "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    }));
    return { status: response.status, body: await response.json() };
  }
  const checkout = { referenceId: "pay_test", amount: 45000, description: "Move-in payment", redirectBaseUrl: "https://example.invalid/verify", tenancyId: "lease-1", periodStart: "2026-10-01" };
  return { invoke, checkout, payments, events };
}

test("online checkout reserves the complete move-in amount before contacting PayMongo", async () => {
  const h = harness();
  const response = await h.invoke("createCheckoutSession", h.checkout);
  assert.equal(response.status, 200);
  assert.deepEqual(h.events, ["reserve", "provider", "update:metadata"]);
  assert.equal(h.payments[0].amount, 45000);
  assert.equal(h.payments[0].status, "pending");
  assert.equal(h.payments[0].paymongo_session_id, "cs_provider");
  // The first checkout is still open at PayMongo, so a second attempt is refused and reserves nothing.
  const duplicate = await h.invoke("createCheckoutSession", { ...h.checkout, referenceId: "pay_second" });
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.errors[0].code, "payment_in_progress");
  assert.equal(h.events.filter(event => event === "reserve").length, 1);
  assert.equal(h.payments.length, 1);
});

test("a non-test PayMongo key is refused before any payment is saved or the provider is called", async () => {
  // APT is a simulation: only sk_test_ keys may run, so no real money can move.
  for (const secretKey of ["sk_live_fake", "pk_test_fake", "fake-key"]) {
    const h = harness({ secretKey });
    for (const method of ["gcash", "card"]) {
      const response = await h.invoke("createCheckoutSession", { ...h.checkout, method });
      assert.equal(response.status, 500);
      assert.equal(response.body.errors[0].code, "configuration_error");
    }
    assert.equal(h.payments.length, 0);
    assert.equal(h.events.length, 0);
  }
});

test("paying an active tenancy never depends on the account's verification status", async () => {
  // Verification gates new tenancies, not a running one: the active-tenancy lookup
  // is the check, and the database trigger lets that tenancy's own payments through.
  for (const accountStatus of ["unverified", "pending", "rejected"]) {
    const h = harness({ accountStatus });
    const response = await h.invoke("createCheckoutSession", h.checkout);
    assert.equal(response.status, 200);
    assert.equal(h.payments.length, 1);
  }
});

test("a rejected database bill cannot initiate a provider charge", async () => {
  const h = harness({ rejectInsert: true });
  const response = await h.invoke("createCheckoutSession", { ...h.checkout, amount: 15000 });
  assert.equal(response.status, 409);
  assert.equal(h.events.includes("provider"), false);
});

test("definite provider rejection releases the bill, but transport failures keep it reserved", async () => {
  const rejected = harness({ provider: async () => Response.json({ errors: [{ code: "invalid_request", detail: "Declined" }] }, { status: 422 }) });
  assert.equal((await rejected.invoke("createCheckoutSession", rejected.checkout)).status, 422);
  assert.equal(rejected.payments[0].status, "failed");
  const uncertain = harness({ provider: async () => { throw new Error("Network interrupted"); } });
  assert.equal((await uncertain.invoke("createCheckoutSession", uncertain.checkout)).status, 500);
  assert.equal(uncertain.payments[0].status, "pending");
  assert.equal((await uncertain.invoke("createCheckoutSession", uncertain.checkout)).status, 409);
  assert.equal(uncertain.events.filter(event => event === "provider").length, 1);
});

test("mock checkout persists its bill and confirms it only through an owned status lookup", async () => {
  const h = harness({ real: false });
  const created = await h.invoke("createCheckoutSession", h.checkout);
  assert.match(created.body.data.attributes.checkout_url, /example.invalid\/verify\?sessionId=pay_test/);
  assert.equal(h.payments[0].status, "pending");
  const checked = await h.invoke("getCheckoutSessionStatus", { sessionId: "pay_test" });
  assert.equal(checked.body.data.attributes.status, "paid");
  assert.equal(h.payments[0].status, "paid");
  assert.equal(h.events.includes("provider"), false);
});

test("status lookup cannot confirm cash or expose another tenant's payment", async () => {
  const h = harness({ real: false, rows: [
    { id: "cash", tenant_id: "tenant-1", reference_id: "cash-ref", status: "pending", method: "cash" },
    { id: "other", tenant_id: "tenant-2", reference_id: "other-ref", status: "pending", method: "gcash" },
  ] });
  const cash = await h.invoke("getCheckoutSessionStatus", { sessionId: "cash-ref" });
  assert.equal(cash.body.data.attributes.status, "pending");
  assert.equal(h.payments[0].status, "pending");
  assert.equal((await h.invoke("getCheckoutSessionStatus", { sessionId: "other-ref" })).status, 404);
});

test("an owned pending session can be resumed; confirmed provider status settles it once", async () => {
  let paid = false;
  const h = harness({ rows: [{ id: "pending", tenant_id: "tenant-1", reference_id: "pending-ref", status: "pending", method: "gcash", paymongo_session_id: "cs_pending" }],
    provider: async () => Response.json({ data: { id: "cs_pending", attributes: {
      status: "active", checkout_url: "https://checkout.paymongo.com/resume",
      payment_intent: { attributes: { status: paid ? "succeeded" : "awaiting_payment_method" } },
    } } }),
  });
  const pending = await h.invoke("getCheckoutSessionStatus", { sessionId: "pending-ref" });
  assert.equal(pending.body.data.attributes.checkout_url, "https://checkout.paymongo.com/resume");
  assert.equal(h.payments[0].status, "pending");
  paid = true;
  const confirmed = await h.invoke("getCheckoutSessionStatus", { sessionId: "pending-ref" });
  assert.equal(confirmed.body.data.attributes.status, "paid");
  assert.equal(h.payments[0].status, "paid");
  const providerCalls = h.events.filter(event => event === "provider").length;
  await h.invoke("getCheckoutSessionStatus", { sessionId: "pending-ref" });
  assert.equal(h.events.filter(event => event === "provider").length, providerCalls);
});

test("backing out of checkout closes the session and releases the bill, but never fails a payment that was paid", async () => {
  const calls = [];
  const sessions = { cs_back: "expired", cs_paid: "succeeded" };
  const provider = async (url, options) => {
    calls.push(`${options?.method ?? "GET"} ${url.split("/v1/")[1]}`);
    const id = url.match(/checkout_sessions\/([^/]+)/)[1];
    return Response.json({ data: { id, attributes: sessions[id] === "expired"
      ? { status: "expired", payments: [] }
      : { status: "active", payment_intent: { attributes: { status: "succeeded" } }, payments: [] } } });
  };
  const h = harness({ provider, rows: [
    { id: "back", tenant_id: "tenant-1", reference_id: "back-ref", status: "pending", method: "maya", paymongo_session_id: "cs_back" },
    { id: "paid", tenant_id: "tenant-1", reference_id: "paid-ref", status: "pending", method: "gcash", paymongo_session_id: "cs_paid" },
    { id: "cash", tenant_id: "tenant-1", reference_id: "cash-ref", status: "pending", method: "cash" },
    { id: "other", tenant_id: "tenant-2", reference_id: "other-ref", status: "pending", method: "gcash", paymongo_session_id: "cs_other" },
  ] });
  const backed = await h.invoke("cancelCheckoutSession", { sessionId: "back-ref" });
  assert.equal(backed.body.data.attributes.status, "expired");
  assert.equal(h.payments[0].status, "failed");
  assert.ok(calls.includes("POST checkout_sessions/cs_back/expire"));
  const paid = await h.invoke("cancelCheckoutSession", { sessionId: "paid-ref" });
  assert.equal(paid.body.data.attributes.status, "paid");
  assert.equal(h.payments[1].status, "paid");
  assert.equal((await h.invoke("cancelCheckoutSession", { sessionId: "cash-ref" })).body.data.attributes.status, "pending");
  assert.equal(h.payments[2].status, "pending");
  assert.equal((await h.invoke("cancelCheckoutSession", { sessionId: "other-ref" })).status, 404);
  assert.equal(h.payments[3].status, "pending");
});

test("card is paid on PayMongo's hosted page: the session offers only the card type and no card data is sent", async () => {
  let providerBody;
  const h = harness({ provider: async (_url, options) => {
    providerBody = JSON.parse(options.body);
    return Response.json({ data: { id: "cs_card", attributes: { status: "active", checkout_url: "https://checkout.paymongo.com/test" } } });
  } });
  const response = await h.invoke("createCheckoutSession", { ...h.checkout, method: "card" });
  assert.equal(response.status, 200);
  assert.equal(h.payments[0].method, "card");
  assert.equal(h.payments[0].status, "pending");
  assert.deepEqual(providerBody.data.attributes.payment_method_types, ["card"]);
  assert.equal(JSON.stringify(providerBody).includes("card_number"), false);
  assert.equal(h.payments[0].paymongo_session_id, "cs_card");
});

test("the old in-app card action is gone: a stale client's card numbers are refused before anything is saved", async () => {
  const h = harness();
  const response = await h.invoke("createCardPayment", { ...h.checkout, card: { number: "4343434343434345", expMonth: 12, expYear: 2030, cvc: "123", name: "Test" } });
  assert.equal(response.status, 400);
  assert.match(response.body.errors[0].detail, /Unknown action/);
  assert.equal(h.payments.length, 0);
  assert.equal(h.events.length, 0);
});

test("a mock card checkout is confirmed only through the owned status lookup, like every hosted method", async () => {
  const h = harness({ real: false });
  const created = await h.invoke("createCheckoutSession", { ...h.checkout, method: "card" });
  assert.equal(created.status, 200);
  assert.equal(h.payments[0].method, "card");
  assert.equal(h.payments[0].status, "pending");
  const status = await h.invoke("getCheckoutSessionStatus", { sessionId: "pay_test" });
  assert.equal(status.body.data.attributes.status, "paid");
});

test("removing provider configuration cannot turn a real pending payment into a mock success", async () => {
  const h = harness({ real: false, rows: [{ id: "real", tenant_id: "tenant-1", reference_id: "real-ref", status: "pending", method: "gcash", paymongo_session_id: "cs_real" }] });
  assert.equal((await h.invoke("getCheckoutSessionStatus", { sessionId: "real-ref" })).status, 503);
  assert.equal(h.payments[0].status, "pending");
});

test("bank transfer is checked against the bank's limit before anything is reserved", async () => {
  const h = harness();
  const missing = await h.invoke("createCheckoutSession", { ...h.checkout, method: "bank_transfer" });
  assert.equal(missing.status, 400);
  const tooMuch = await h.invoke("createCheckoutSession", { ...h.checkout, method: "bank_transfer", bankCode: "bpi", amount: 80000 });
  assert.equal(tooMuch.status, 400);
  assert.match(tooMuch.body.errors[0].detail, /BPI allows up to ₱50,000/);
  assert.equal(h.payments.length, 0);
  assert.equal(h.events.length, 0);
});

test("bank transfer starts a checkout for the online banking method and charges no fee", async () => {
  let providerBody;
  const h = harness({ provider: async (_url, options) => {
    providerBody = JSON.parse(options.body);
    return Response.json({ data: { id: "cs_bank", attributes: { status: "active", checkout_url: "https://checkout.paymongo.com/test" } } });
  } });
  const response = await h.invoke("createCheckoutSession", { ...h.checkout, method: "bank_transfer", bankCode: "ubp", amount: 80000 });
  assert.equal(response.status, 200);
  assert.equal(h.payments[0].method, "bank_transfer");
  assert.equal(h.payments[0].amount, 80000);
  assert.deepEqual(providerBody.data.attributes.payment_method_types, ["dob_ubp"]);
  assert.equal(providerBody.data.attributes.line_items[0].amount, 8000000);
  assert.equal(providerBody.data.attributes.line_items.length, 1);
});

test("the bank the tenant picked decides which bank PayMongo's checkout offers", async () => {
  const typesFor = async (bankCode) => {
    let types;
    const h = harness({ provider: async (_url, options) => {
      types = JSON.parse(options.body).data.attributes.payment_method_types;
      return Response.json({ data: { id: "cs_bank", attributes: { status: "active", checkout_url: "https://checkout.paymongo.com/test" } } });
    } });
    const response = await h.invoke("createCheckoutSession", { ...h.checkout, method: "bank_transfer", bankCode, amount: 40000 });
    assert.equal(response.status, 200);
    return types;
  };
  assert.deepEqual(await typesFor("bpi"), ["dob"]);
  assert.deepEqual(await typesFor("ubp"), ["dob_ubp"]);
});

test("a method the landlord turned off is refused before any payment is saved", async () => {
  const h = harness({ acceptedMethods: ["cash", "maya"] });
  const refused = await h.invoke("createCheckoutSession", { ...h.checkout, method: "gcash" });
  assert.equal(refused.status, 409);
  assert.equal(refused.body.errors[0].code, "method_not_accepted");
  assert.match(refused.body.errors[0].detail, /does not accept GCash/);
  assert.equal(h.payments.length, 0);
  assert.equal(h.events.length, 0);
  const allowed = await h.invoke("createCheckoutSession", { ...h.checkout, method: "maya" });
  assert.equal(allowed.status, 200);
});

test("a landlord who never limited methods allows every method", async () => {
  const h = harness();
  const response = await h.invoke("createCheckoutSession", { ...h.checkout, method: "qrph" });
  assert.equal(response.status, 200);
});

// --- Closing an unfinished online attempt when a new one starts ---------------------------

const OLD = { id: "old", tenant_id: "tenant-1", tenancy_id: "lease-1", reference_id: "old-ref", status: "pending", method: "card", period_start: "2026-10-01", paymongo_session_id: "cs_old" };

function sessionProvider({ sessionStatus, paid = false, log }) {
  return async (url, options = {}) => {
    log?.push(`${options.method ?? "GET"} ${url.replace("https://api.paymongo.com", "")}`);
    if (url.endsWith("/expire")) return Response.json({ data: { id: "cs_old", attributes: { status: "expired" } } });
    if (url.includes("/checkout_sessions/cs_old")) {
      return Response.json({ data: { id: "cs_old", attributes: { status: sessionStatus, payments: paid ? [{ id: "pay_old", attributes: { status: "paid", type: "card" } }] : [] } } });
    }
    return Response.json({ data: { id: "cs_new", attributes: { status: "active", checkout_url: "https://checkout.paymongo.com/test" } } });
  };
}

test("starting a new payment closes the tenant's unfinished online attempt first, then creates the new one", async () => {
  const log = [];
  const h = harness({ rows: [{ ...OLD }], provider: sessionProvider({ sessionStatus: "expired", log }) });
  const response = await h.invoke("createCheckoutSession", { ...h.checkout, method: "card" });
  assert.equal(response.status, 200);
  assert.equal(h.payments.find(row => row.id === "old").status, "failed");
  const fresh = h.payments.find(row => row.reference_id === "pay_test");
  assert.equal(fresh.status, "pending");
  assert.equal(fresh.paymongo_session_id, "cs_new");
  // Order: the old hosted session is expired and settled before the new row is reserved.
  assert.ok(log[0].endsWith("/checkout_sessions/cs_old/expire"));
  assert.ok(h.events.indexOf("update:failed") < h.events.indexOf("reserve"));
});

test("an old attempt that turns out to be paid is kept and the new payment is refused, so nobody pays twice", async () => {
  const h = harness({ rows: [{ ...OLD }], provider: sessionProvider({ sessionStatus: "active", paid: true }) });
  const response = await h.invoke("createCheckoutSession", { ...h.checkout, method: "card" });
  assert.equal(response.status, 409);
  assert.equal(response.body.errors[0].code, "already_paid");
  assert.equal(h.payments.length, 1);
  assert.equal(h.payments[0].status, "paid");
  assert.equal(h.events.includes("reserve"), false);
});

test("an attempt PayMongo still reports open is never released on a guess, and nothing new is reserved", async () => {
  const h = harness({ rows: [{ ...OLD }], provider: sessionProvider({ sessionStatus: "active" }) });
  const response = await h.invoke("createCheckoutSession", { ...h.checkout, method: "card" });
  assert.equal(response.status, 409);
  assert.equal(response.body.errors[0].code, "payment_in_progress");
  assert.equal(h.payments.length, 1);
  assert.equal(h.payments[0].status, "pending");
  assert.equal(h.events.includes("reserve"), false);
});

test("a pending attempt with no provider session has an unknown outcome and blocks a new payment", async () => {
  const h = harness({ rows: [{ ...OLD, paymongo_session_id: null }] });
  const response = await h.invoke("createCheckoutSession", { ...h.checkout, method: "card" });
  assert.equal(response.status, 409);
  assert.equal(response.body.errors[0].code, "payment_in_progress");
  assert.equal(h.payments[0].status, "pending");
  assert.equal(h.events.includes("provider"), false);
});

test("attempts for another period, another tenant or cash are left alone", async () => {
  const h = harness({ rows: [
    { ...OLD, id: "other-period", period_start: "2026-09-01" },
    { ...OLD, id: "other-tenant", tenant_id: "tenant-2", tenancy_id: "lease-2" },
    { ...OLD, id: "cash", method: "cash", paymongo_session_id: null },
  ], provider: sessionProvider({ sessionStatus: "expired" }) });
  const response = await h.invoke("createCheckoutSession", { ...h.checkout, method: "gcash" });
  assert.equal(response.status, 200);
  for (const id of ["other-period", "other-tenant", "cash"]) assert.equal(h.payments.find(row => row.id === id).status, "pending");
});

test("in mock mode an unfinished mock attempt is simply closed", async () => {
  const h = harness({ real: false, rows: [{ ...OLD, paymongo_session_id: "cs_mock_old-ref" }] });
  const response = await h.invoke("createCheckoutSession", { ...h.checkout, method: "card" });
  assert.equal(response.status, 200);
  assert.equal(h.payments.find(row => row.id === "old").status, "failed");
  assert.equal(h.payments.find(row => row.reference_id === "pay_test").status, "pending");
});

test("a concurrent second attempt that hits the database's one-pending-online rule gets a clear message", async () => {
  const h = harness({ insertError: { code: "23505", message: 'duplicate key value violates unique constraint "payment_one_pending_online_idx"' } });
  const response = await h.invoke("createCheckoutSession", { ...h.checkout, method: "gcash" });
  assert.equal(response.status, 409);
  assert.equal(response.body.errors[0].code, "payment_in_progress");
  assert.equal(h.events.includes("provider"), false);
});
