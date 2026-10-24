import assert from "node:assert/strict";
import test from "node:test";
import { compile, deferred, settle } from "./test-support/hook-runtime.mjs";

const approved = {
  id: "verification", user_id: "owner", status: "approved", id_type: "philsys",
  id_front_path: "owner/verification/id-front.jpg", id_back_path: "owner/verification/id-back.jpg",
};
const linked = {
  id: "passport-id", user_id: "owner", verification_id: approved.id,
  storage_path: approved.id_front_path, storage_path_back: approved.id_back_path,
  is_primary: true, is_verified: true, review_status: "verified",
  created_at: "2026-10-24T00:00:00Z",
};

// In-memory PostgREST-shaped mock only: no network, Storage, or hosted writes.
function walletHarness(options = {}) {
  const config = { verifications: [approved], wallet: [], walletErrors: {}, ...options };
  const calls = [], events = [], inserts = [], updates = [];
  let walletReads = 0, checks = 0;
  const matches = (row, filters) => filters.every(([key, value]) => row[key] === value);
  const client = { from(table) {
    const call = { table, filters: [], orders: [], limit: null, operation: "read" };
    calls.push(call);
    let payload;
    const q = {
      select: () => q,
      eq: (key, value) => { call.filters.push([key, value]); return q; },
      order: (key, options) => { call.orders.push([key, { ...options }]); return q; },
      limit: value => { call.limit = value; return q; },
      async maybeSingle() {
        if (table === "user_verifications") {
          events.push("verification:start");
          if (config.verificationGate) await config.verificationGate.promise;
          events.push("verification:resolved");
          return { data: config.verifications.find(row => matches(row, call.filters)) ?? null, error: config.verificationError ?? null };
        }
        assert.equal(table, "passport_documents");
        const index = ++checks;
        events.push(`check:${index}:start`);
        const data = config.wallet.find(row => matches(row, call.filters)) ?? null;
        if (config.checkGate) await config.checkGate.promise;
        events.push(`check:${index}:resolved`);
        return { data, error: config.checkError ?? null };
      },
      then(yes, no) {
        assert.equal(table, "passport_documents");
        const index = ++walletReads;
        events.push(`wallet:${index}`);
        const data = config.wallet.filter(row => matches(row, call.filters))
          .map(row => ({ ...row })).sort((a, b) => b.created_at.localeCompare(a.created_at));
        if (config.afterWalletRead) config.afterWalletRead(config, index);
        return Promise.resolve({ data, error: config.walletErrors[index] ?? null }).then(yes, no);
      },
      insert(value) {
        call.operation = "insert";
        inserts.push(value);
        events.push(`insert:${inserts.length}:start`);
        const row = { ...value, id: `inserted-${inserts.length}`, created_at: "2026-10-24T01:00:00Z" };
        return { select: () => ({ async single() {
          if (config.writeGate) await config.writeGate.promise;
          if (config.insertError) return { data: null, error: config.insertError };
          config.wallet.push(row);
          events.push(`insert:${row.id}:settled`);
          return { data: row, error: null };
        } }) };
      },
      update(value) {
        call.operation = "update";
        payload = value;
        updates.push(value);
        events.push("update:start");
        return q;
      },
      async single() {
        assert.equal(call.operation, "update");
        if (config.writeGate) await config.writeGate.promise;
        if (config.updateError) return { data: null, error: config.updateError };
        const row = config.wallet.find(row => matches(row, call.filters));
        assert.ok(row, "update targets an existing row");
        Object.assign(row, payload);
        events.push("update:settled");
        return { data: row, error: null };
      },
    };
    return q;
  } };
  const service = compile("service/passportService.ts", {
    "@repo/supabase/browser": { createClient: () => client },
    "@repo/constants": {}, "@repo/passport": {}, "@/lib/passport-upload": {},
  });
  return { config, calls, events, inserts, updates, load: userId => service.fetchPassportDocumentsWithVerification(userId),
    get walletReads() { return walletReads; }, get checks() { return checks; } };
}

test("approved, already-linked Passport uses only verification then wallet and preserves ordering/metadata", async () => {
  const extra = { ...linked, id: "income", verification_id: null, doc_type: "Proof of Income", created_at: "2026-10-24T02:00:00Z" };
  const h = walletHarness({ wallet: [{ ...linked }, extra] });
  const rows = await h.load("owner");
  assert.deepEqual(rows, [extra, linked]);
  assert.deepEqual(h.events, ["verification:start", "verification:resolved", "wallet:1"]);
  assert.deepEqual(h.calls.map(call => call.table), ["user_verifications", "passport_documents"]);
  assert.equal(h.checks, 0); assert.equal(h.inserts.length + h.updates.length, 0);
  assert.deepEqual(h.calls[0].orders, [["reviewed_at", { ascending: false }], ["submitted_at", { ascending: false }]]);
  assert.equal(h.calls[0].limit, 1);
  assert.deepEqual(h.calls[1].orders, [["created_at", { ascending: false }]]);
});

test("verification resolves before the wallet query starts; changes during verification cannot return a stale snapshot", async () => {
  const verificationGate = deferred();
  const old = { ...linked, id: "old-document", verification_id: null };
  const h = walletHarness({ verificationGate, wallet: [old] });
  let published = false;
  const pending = h.load("owner").then(rows => { published = true; return rows; });
  await settle();
  assert.deepEqual(h.calls.map(call => call.table), ["user_verifications"]);
  assert.equal(h.walletReads, 0); assert.equal(published, false);
  // A concurrent change while verification is pending must appear in the first wallet read.
  h.config.wallet = [{ ...linked }];
  verificationGate.resolve();
  assert.deepEqual(await pending, [linked]);
  assert.deepEqual(h.events, ["verification:start", "verification:resolved", "wallet:1"]);
  assert.equal(h.inserts.length, 0);
});

for (const status of [null, "rejected", "pending", "unverified"]) {
  test(`no eligible verification (${status ?? "missing"}) returns the wallet without linking`, async () => {
    const h = walletHarness({ verifications: status ? [{ ...approved, status }] : [], wallet: [{ ...linked }] });
    assert.deepEqual(await h.load("owner"), [linked]);
    assert.ok(h.calls[0].filters.some(([key, value]) => key === "status" && value === "approved"));
    assert.equal(h.walletReads, 1); assert.equal(h.checks, 0);
    assert.equal(h.inserts.length + h.updates.length, 0);
  });
}

for (const stale of [false, true]) {
  test(`${stale ? "stale-link update" : "first-link insert"} settles before a fresh wallet read or publication`, async () => {
    const writeGate = deferred();
    const h = walletHarness({ writeGate, wallet: stale ? [{ ...linked, is_verified: false, is_primary: false, storage_path: "owner/old.jpg" }] : [] });
    let published = false;
    const pending = h.load("owner").then(rows => { published = true; return rows; });
    await settle();
    assert.equal(published, false); assert.equal(h.walletReads, 1);
    assert.equal(h.checks, stale ? 0 : 1);
    assert.equal(h.inserts.length, stale ? 0 : 1); assert.equal(h.updates.length, stale ? 1 : 0);
    if (!stale) {
      assert.deepEqual(JSON.parse(JSON.stringify(h.inserts[0])), {
        user_id: "owner", doc_type: "philsys", storage_path: approved.id_front_path,
        storage_path_back: approved.id_back_path, mime_type: "image/jpeg", id_type: "philsys",
        verification_id: approved.id, is_verified: true, is_primary: true, review_status: "verified",
      });
    } else {
      const { updated_at, ...payload } = h.updates[0];
      assert.ok(Number.isFinite(Date.parse(updated_at)));
      assert.deepEqual(payload, { storage_path: approved.id_front_path, storage_path_back: approved.id_back_path, is_verified: true, is_primary: true });
      assert.deepEqual(h.calls.find(call => call.operation === "update").filters, [["id", linked.id]]);
    }
    writeGate.resolve();
    const rows = await pending;
    assert.equal(h.walletReads, 2); assert.equal(rows.length, 1);
    assert.equal(rows[0].storage_path, approved.id_front_path);
    assert.equal(rows[0].is_verified, true); assert.equal(rows[0].is_primary, true);
    const settled = stale ? "update:settled" : "insert:inserted-1:settled";
    assert.ok(h.events.indexOf(settled) < h.events.indexOf("wallet:2"));
  });
}

for (const operation of ["insert", "update"]) {
  test(`${operation} failure rejects without publishing a wallet; a retry can complete`, async () => {
    const error = new Error(`${operation} failed`);
    const h = walletHarness({ [`${operation}Error`]: error, wallet: operation === "update" ? [{ ...linked, is_primary: false }] : [] });
    await assert.rejects(h.load("owner"), new RegExp(error.message));
    assert.equal(h.walletReads, 1);
    h.config[`${operation}Error`] = null;
    const rows = await h.load("owner");
    assert.equal(rows.length, 1); assert.equal(rows[0].is_primary, true);
    assert.equal(h.config.wallet.length, 1);
  });
}

test("a failed final wallet read rejects after linking; retry reuses the committed link", async () => {
  const error = new Error("final wallet unavailable");
  const h = walletHarness({ walletErrors: { 2: error } });
  await assert.rejects(h.load("owner"), failure => failure === error);
  assert.equal(h.inserts.length, 1); assert.equal(h.walletReads, 2);
  const rows = await h.load("owner");
  assert.equal(rows.length, 1); assert.equal(h.inserts.length, 1);
  assert.equal(h.walletReads, 3); assert.equal(h.checks, 1);
});

test("verification, initial wallet and targeted recheck failures propagate without linking", async () => {
  for (const stage of ["verification", "wallet", "check"]) {
    const error = new Error(`${stage} unavailable`);
    const h = walletHarness(stage === "wallet" ? { walletErrors: { 1: error } } : { [`${stage}Error`]: error });
    await assert.rejects(h.load("owner"), failure => failure === error);
    assert.equal(h.inserts.length + h.updates.length, 0);
    if (stage === "verification") assert.equal(h.calls.length, 1, "fail closed before starting the wallet query");
  }
});

test("a link found by the missing-link recheck is refreshed without another insert", async () => {
  const h = walletHarness({ afterWalletRead(config, index) {
    if (index === 1) config.wallet.push({ ...linked });
  } });
  assert.deepEqual(await h.load("owner"), [linked]);
  assert.equal(h.checks, 1); assert.equal(h.inserts.length, 0);
  assert.equal(h.walletReads, 2);
});

test("existing duplicate linked rows remain visible and are not repaired or rewritten", async () => {
  const duplicate = { ...linked, id: "duplicate", created_at: "2026-10-24T00:00:01Z" };
  const h = walletHarness({ wallet: [{ ...linked }, duplicate] });
  assert.deepEqual(await h.load("owner"), [duplicate, linked]);
  assert.equal(h.checks, 0); assert.equal(h.inserts.length + h.updates.length, 0);
});

test("account and verification filters isolate all reads and the first-link payload", async () => {
  const other = { ...linked, id: "other", user_id: "other-owner" };
  const h = walletHarness({ verifications: [{ ...approved, user_id: "other-owner" }, approved], wallet: [other] });
  const rows = await h.load("owner");
  assert.equal(rows.length, 1); assert.equal(rows[0].user_id, "owner");
  for (const call of h.calls.filter(call => call.operation === "read")) {
    assert.ok(call.filters.some(([key, value]) => key === "user_id" && value === "owner"));
  }
  const check = h.calls.find(call => call.filters.some(([key]) => key === "verification_id"));
  assert.deepEqual(check.filters, [["user_id", "owner"], ["verification_id", approved.id]]);
  assert.equal(h.inserts[0].user_id, "owner"); assert.equal(h.inserts[0].verification_id, approved.id);
  assert.equal(h.config.wallet.find(row => row.id === "other"), other);
});

test("documents the unresolved database-level first-link race: both rechecks can pass and both callers insert", async () => {
  const checkGate = deferred(), writeGate = deferred();
  const h = walletHarness({ checkGate, writeGate });
  const pending = Promise.all([h.load("owner"), h.load("owner")]);
  await settle();
  assert.equal(h.checks, 2); assert.equal(h.inserts.length, 0);
  checkGate.resolve();
  await settle();
  assert.equal(h.inserts.length, 2, "SELECT-before-INSERT is not a uniqueness guarantee");
  const firstInsert = h.events.indexOf("insert:1:start");
  for (const index of [1, 2]) assert.ok(h.events.indexOf(`check:${index}:resolved`) < firstInsert);
  assert.equal(h.walletReads, 2, "neither request publishes a wallet while its write is pending");
  writeGate.resolve();
  const results = await pending;
  assert.equal(h.config.wallet.length, 2);
  for (const rows of results) assert.equal(rows.length, 2);
  // This records an unresolved defect, not acceptable duplicate semantics.
  // A database uniqueness/transactional fix must deliberately replace this expectation.
});
