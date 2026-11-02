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
function harness({ real = true, secretKey = "sk_test_fake", rejectInsert = false, provider, rows = [], accountStatus = "verified" } = {}) {
  const payments = [...rows];
  const events = [];
  let handler;
  class Query {
    constructor(table) { this.table = table; this.filters = []; }
    select() { return this; }
    eq(key, value) { this.filters.push(row => row[key] === value); return this; }
    is(key, value) { return this.eq(key, value); }
    order() { return this; }
    limit() { return this; }
    insert(value) { this.insertValue = value; return this; }
    update(value) { this.updateValue = value; return this; }
    async execute() {
      if (this.table === "users") return { data: { id: "tenant-1", account_status: accountStatus }, error: null };
      if (this.table === "tenancies") return { data: { id: "lease-1", apartment_id: "apt-1", monthly_rent: 15000, apartment: { landlord_id: "owner-1" } }, error: null };
      assert.equal(this.table, "payment");
      if (this.insertValue) {
        events.push("reserve");
        if (rejectInsert || payments.some(p => p.status === "pending")) return { data: null, error: { message: "Bill validation failed or payment already pending." } };
        const row = { id: `payment-${payments.length + 1}`, ...this.insertValue };
        payments.push(row);
        return { data: row, error: null };
      }
      const matched = payments.filter(row => this.filters.every(filter => filter(row)));
      if (this.updateValue) {
        events.push(`update:${this.updateValue.status ?? "metadata"}`);
        matched.forEach(row => Object.assign(row, this.updateValue));
      }
      return { data: matched[0] ?? null, error: null };
    }
    single() { return this.execute(); }
    maybeSingle() { return this.execute(); }
    then(resolve, reject) { return this.execute().then(resolve, reject); }
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
  const duplicate = await h.invoke("createCheckoutSession", { ...h.checkout, referenceId: "pay_second" });
  assert.equal(duplicate.status, 409);
  assert.equal(h.events.filter(event => event === "provider").length, 1);
});

test("a non-test PayMongo key is refused before any payment is saved or the provider is called", async () => {
  // APT is a simulation: only sk_test_ keys may run, so no real money can move.
  for (const secretKey of ["sk_live_fake", "pk_test_fake", "fake-key"]) {
    const h = harness({ secretKey });
    for (const action of ["createCheckoutSession", "createCardPayment"]) {
      const response = await h.invoke(action, { ...h.checkout, card: { number: "4343434343434345", expMonth: 12, expYear: 2030, cvc: "123", name: "Test" } });
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

test("a card verification error after charge attachment cannot release the bill for another charge", async () => {
  const h = harness({ provider: async (url) => {
    if (url.endsWith("/payment_methods")) return Response.json({ data: { id: "pm_card", attributes: { type: "card" } } });
    if (url.endsWith("/payment_intents")) return Response.json({ data: { id: "pi_card", attributes: { status: "awaiting_payment_method" } } });
    if (url.endsWith("/attach")) return Response.json({ data: { id: "pi_card", attributes: { status: "succeeded" } } });
    return Response.json({ errors: [{ code: "rate_limit", detail: "Please retry later" }] }, { status: 429 });
  } });
  const response = await h.invoke("createCardPayment", { ...h.checkout, card: { number: "test-card", expMonth: 12, expYear: 2030, cvc: "test", name: "Test" } });
  assert.equal(response.status, 429);
  assert.equal(h.payments[0].status, "pending");
  assert.equal(h.payments[0].paymongo_intent_id, "pi_card");
  assert.equal(h.events.includes("update:failed"), false);
});

test("removing provider configuration cannot turn a real pending payment into a mock success", async () => {
  const h = harness({ real: false, rows: [{ id: "real", tenant_id: "tenant-1", reference_id: "real-ref", status: "pending", method: "gcash", paymongo_session_id: "cs_real" }] });
  assert.equal((await h.invoke("getCheckoutSessionStatus", { sessionId: "real-ref" })).status, 503);
  assert.equal(h.payments[0].status, "pending");
});
