import assert from "node:assert/strict";
import * as crypto from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Only the caller-bound Supabase transport is simulated. The production
// creation/claim/submission actions execute unchanged; no hosted calls.
function harness({ signedIn = true, status = "unverified", pending = false } = {}) {
  const rows = [];
  const submissions = [];
  const state = { caller: signedIn ? "owner" : null, status, pending, files: ["id-front.jpg", "selfie.jpg"] };
  const client = {
    auth: { getUser: async () => ({ data: { user: state.caller ? { id: state.caller } : null } }) },
    storage: { from: bucket => {
      assert.equal(bucket, "user-verification");
      return { list: async prefix => {
        assert.equal(prefix, `${state.caller}/verification-1`);
        return { data: state.files.map(name => ({ name })), error: null };
      } };
    } },
    from(table) {
      const filters = {};
      let inserted;
      const result = () => {
        if (inserted) {
          if (table === "verification_sessions") {
            const row = { ...inserted, verification_id: "verification-1", status: "active" };
            rows.push(row);
            return { data: row, error: null };
          }
          submissions.push(inserted);
          return { error: null };
        }
        if (table === "users") return { data: state.caller ? { id: state.caller, account_status: state.status } : null };
        if (table === "user_verifications") return { data: state.pending ? [{ id: "pending-row" }] : [] };
        assert.equal(table, "verification_sessions");
        return { data: rows.find(row => Object.entries(filters).every(([key, value]) => row[key] === value)) || null };
      };
      const query = {
        select: () => query,
        eq: (key, value) => { filters[key] = value; return query; },
        limit: () => query,
        insert: value => { inserted = value; return query; },
        maybeSingle: async () => result(), single: async () => result(),
        then: (resolve, reject) => Promise.resolve().then(result).then(resolve, reject),
      };
      return query;
    },
    async rpc(name, args) {
      if (name === "expire_own_verification_sessions") {
        assert.equal(args.p_include_active, true);
        rows.filter(row => row.user_id === state.caller && row.status === "active").forEach(row => { row.status = "expired"; });
        return { error: null };
      }
      assert.equal(name, "consume_verification_session");
      const row = rows.find(row => row.token_hash === args.p_token_hash && row.user_id === state.caller && row.status === "active" && Date.parse(row.expires_at) > Date.now());
      if (!row) return { error: { message: "Session invalid" } };
      row.status = "completed";
      return { error: null };
    },
  };
  const exports = {};
  const source = readFileSync(new URL("../app/verify/actions.ts", import.meta.url), "utf8");
  const dependencies = { "node:crypto": crypto, "@repo/supabase/server": { createClient: async () => client }, "@repo/constants": { VALID_IDS: ["Passport", "National ID"], SECONDARY_IDS: ["Company ID"] } };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, Date, Set, require: name => { assert.ok(dependencies[name], name); return dependencies[name]; },
  });
  return { actions: exports, rows, submissions, state };
}

test("session creation requires authentication and refuses approved or pending accounts", async () => {
  for (const options of [{ signedIn: false }, { status: "verified" }, { pending: true }]) {
    const h = harness(options);
    assert.equal((await h.actions.createVerificationSession()).ok, false);
    assert.equal(h.rows.length, 0);
  }
});

test("unverified/rejected callers get a ten-minute hashed session, using the same action as QR", async () => {
  for (const status of ["unverified", "rejected"]) {
    const h = harness({ status });
    const before = Date.now();
    const result = await h.actions.createVerificationSession();
    assert.equal(result.ok, true);
    assert.match(result.token, /^[A-Za-z0-9_-]{43}$/);
    assert.ok(Date.parse(result.expiresAt) >= before + 599000 && Date.parse(result.expiresAt) <= Date.now() + 600000);
    assert.equal(h.rows[0].token_hash, crypto.createHash("sha256").update(result.token).digest("hex"));
    assert.equal(h.rows[0].user_id, "owner");
    assert.equal(Object.values(h.rows[0]).includes(result.token), false);
  }
});

test("claim requires the same authenticated owner and does not consume the session", async () => {
  const h = harness();
  const { token } = await h.actions.createVerificationSession();
  assert.equal((await h.actions.claimVerificationSession(token)).ok, true);
  assert.equal(h.rows[0].status, "active");
  h.state.caller = "another-account";
  assert.equal((await h.actions.claimVerificationSession(token)).ok, false);
  assert.equal((await h.actions.submitVerificationSession(token, { idType: "Passport" })).ok, false);
  h.state.caller = null;
  assert.match((await h.actions.claimVerificationSession(token)).error, /sign in/i);
  assert.match((await h.actions.submitVerificationSession(token, { idType: "Passport" })).error, /sign in/i);
  assert.equal(h.submissions.length, 0);
});

test("expired and malformed sessions cannot be claimed or submitted", async () => {
  const h = harness();
  const { token } = await h.actions.createVerificationSession();
  h.rows[0].expires_at = new Date(Date.now() - 1000).toISOString();
  for (const invalid of [token, "forged-token"]) {
    assert.equal((await h.actions.claimVerificationSession(invalid)).ok, false);
    assert.equal((await h.actions.submitVerificationSession(invalid, { idType: "Passport" })).ok, false);
  }
  assert.equal(h.submissions.length, 0);
});

test("submission consumes once; replay/competing submissions cannot create duplicates", async () => {
  const h = harness();
  const { token } = await h.actions.createVerificationSession();
  const results = await Promise.all([h.actions.submitVerificationSession(token, { idType: "Passport" }), h.actions.submitVerificationSession(token, { idType: "Passport" })]);
  assert.equal(results.filter(result => result.ok).length, 1);
  assert.equal(h.rows[0].status, "completed");
  assert.equal(h.submissions.length, 1);
  assert.equal(h.submissions[0].user_id, "owner");
  assert.equal((await h.actions.claimVerificationSession(token)).ok, false);
  assert.equal((await h.actions.submitVerificationSession(token, { idType: "Passport" })).ok, false);
});

test("invalid ID types, missing captures and newly approved status still block submission", async () => {
  const h = harness();
  const { token } = await h.actions.createVerificationSession();
  assert.equal((await h.actions.submitVerificationSession(token, { idType: "Fake ID" })).ok, false);
  h.state.files = [];
  assert.equal((await h.actions.submitVerificationSession(token, { idType: "Passport" })).ok, false);
  h.state.files = ["id-front.jpg", "selfie.jpg"];
  assert.equal((await h.actions.submitVerificationSession(token, { idType: "National ID" })).ok, false, "two-sided IDs still require the back");
  h.state.status = "verified";
  assert.equal((await h.actions.submitVerificationSession(token, { idType: "Passport" })).ok, false);
  assert.equal(h.rows[0].status, "active");
  assert.equal(h.submissions.length, 0);
});
