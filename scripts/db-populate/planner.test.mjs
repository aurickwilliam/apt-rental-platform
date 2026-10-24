import assert from "node:assert/strict";
import { test } from "node:test";
import { aptReference, billingPeriods, buildPlan, manilaToday, previewToken, REFERENCE_PATTERN, rekeyPlanReferences, stableId, validateOptions, validatePlan } from "./planner.mjs";
import { operationSql, parseArgs, selectPlan, sqlLiteral, validateConnection } from "../db-populate.mjs";

export function fixture() {
  const users = Array.from({ length: 8 }, (_, i) => ({ id: stableId("fixture", `user:${i}`), roles: i < 6 ? ["tenant"] : ["landlord"], is_suspended: false, account_status: "verified" }));
  users[0].roles.push("landlord", "admin");
  const apartments = Array.from({ length: 20 }, (_, i) => ({ id: stableId("fixture", `apt:${i}`), landlord_id: [users[0].id, users[6].id, users[7].id][i % 3], status: "available", monthly_rent: 12000, security_deposit: 12000, advance_rent: 0, rent_due_day: [5, 30, 31][i % 3] }));
  const passport_documents = users.slice(0, 6).flatMap((u) => [
    { id: stableId("fixture", `id:${u.id}`), user_id: u.id, doc_type: "National ID", id_type: "National ID", storage_path: `${u.id}/id.jpg`, is_primary: true, is_verified: true, review_status: "verified", expires_at: null, created_at: "2026-01-01" },
    { id: stableId("fixture", `bill:${u.id}`), user_id: u.id, doc_type: "Proof of Residency", storage_path: `${u.id}/bill.jpg`, is_primary: false, is_verified: false, review_status: "unverified", expires_at: null, created_at: "2026-01-01" },
  ]);
  return { tables: { users, apartments, passport_documents, tenancies: [], payment: [], rental_application: [], visit_request: [], maintenance_request: [], favorites: [], reviews: [], chat: [], conversation_preferences: [], user_blocks: [], notifications: [] }, storage: passport_documents.map((d) => ({ bucket_id: "application-documents", name: d.storage_path })) };
}

const options = { years: 3, seed: "apt-demo-v1", asOf: "2026-10-17" };

test("population is deterministic, input-order independent and never edits its inputs", () => {
  const inventory = fixture();
  const before = structuredClone(inventory);
  const a = buildPlan(inventory, options);
  const b = buildPlan(inventory, options);
  assert.deepEqual(a, b);
  assert.deepEqual(inventory, before);
  for (const rows of Object.values(inventory.tables)) rows.reverse();
  assert.deepEqual(buildPlan(inventory, options), a);
  assert.ok(a.summary.counts.payment > 100);
  assert.ok(a.summary.counts.tenancies > 10);
  assert.equal(a.summary.currentRentersAdded, 4);
  assert.ok(a.rows.every((r) => !["users", "apartments", "passport_documents"].includes(r.table)));
});

test("many seeds preserve tenancy, financial and relational invariants", () => {
  for (let i = 0; i < 20; i++) {
    const inventory = fixture();
    const plan = buildPlan(inventory, { ...options, seed: `test-${i}` });
    assert.equal(validatePlan(plan, inventory), true);
    const payments = plan.rows.filter((r) => r.table === "payment").map((r) => r.data);
    assert.equal(new Set(payments.map((p) => `${p.tenancy_id}:${p.period_start}`)).size, payments.length);
    assert.ok(payments.every((p) => p.date <= options.asOf && !p.paymongo_session_id && REFERENCE_PATTERN.test(p.reference_id)));
    assert.equal(new Set(payments.map((p) => p.reference_id)).size, payments.length);
    assert.ok(plan.rows.filter((r) => r.table === "tenancies").every((r) => r.data.tenant_id !== r.data.landlord_id));
  }
});

test("billing matches shared clamped calendar-month rules and skips pre-move-in dues", () => {
  assert.deepEqual(billingPeriods("2024-01-31", "2024-03-31", 31).map((p) => p.dueDate), ["2024-01-31", "2024-02-29", "2024-03-31"]);
  assert.deepEqual(billingPeriods("2025-11-08", "2026-01-05", 5).map((p) => p.dueDate), ["2025-12-05", "2026-01-05"]);
  assert.equal(billingPeriods("2026-02-20", "2026-02-24", 5).length, 0);
});

test("existing rentals, applications, favorites, archived conversations and blocks are preserved", () => {
  const inventory = fixture();
  const u = inventory.tables.users[1];
  const a = inventory.tables.apartments[0];
  inventory.tables.tenancies.push({ id: stableId("fixture", "existing"), tenant_id: u.id, landlord_id: a.landlord_id, apartment_id: a.id, lease_start: "2023-01-01", lease_end: null, status: "active" });
  a.status = "occupied";
  inventory.tables.chat.push({ id: stableId("fixture", "chat"), sender_id: u.id, receiver_id: a.landlord_id, apartment_id: a.id });
  inventory.tables.user_blocks.push({ blocker_id: inventory.tables.users[2].id, blocked_id: inventory.tables.users[6].id });
  const plan = buildPlan(inventory, options);
  assert.ok(!plan.rows.some((r) => r.table === "tenancies" && (r.data.tenant_id === u.id || r.data.apartment_id === a.id)));
  assert.ok(!plan.rows.some((r) => r.table === "chat" && r.data.apartment_id === a.id && [r.data.sender_id, r.data.receiver_id].includes(u.id)));
  assert.ok(!plan.rows.some((r) => r.table === "chat" && [r.data.sender_id, r.data.receiver_id].includes(inventory.tables.users[2].id) && [r.data.sender_id, r.data.receiver_id].includes(inventory.tables.users[6].id)));
});

test("missing, expired, rejected, missing-file and other-owner documents never become fake attachments", () => {
  for (const alter of [
    (d) => { d.expires_at = "2000-01-01"; },
    (d) => { d.review_status = "rejected"; },
    (d) => { d.storage_path = "missing/file.jpg"; },
  ]) {
    const inventory = fixture();
    inventory.tables.passport_documents.forEach(alter);
    const plan = buildPlan(inventory, options);
    assert.equal(plan.summary.counts.rental_application, 0);
    // Historical operator-imported rentals need no fake application/document.
    assert.ok(plan.summary.counts.tenancies > 0);
    assert.ok(plan.summary.skipped.applications_without_usable_passport > 0);
  }
});

test("unverified tenants browse but never receive rental or application records", () => {
  const inventory = fixture();
  const u = inventory.tables.users[1];
  u.account_status = "unverified";
  const plan = buildPlan(inventory, options);
  assert.ok(plan.rows.some((r) => r.table === "favorites" && r.data.tenant_id === u.id));
  assert.ok(!plan.rows.some((r) => ["tenancies", "rental_application", "payment", "maintenance_request", "reviews"].includes(r.table) && r.data.tenant_id === u.id));
});

test("existing overlapping stays and occupancy mismatches are skipped, never repaired", () => {
  const inventory = fixture();
  const tenant = inventory.tables.users[1];
  for (const i of [0, 1]) inventory.tables.tenancies.push({ id: stableId("fixture", `conflict:${i}`), tenant_id: tenant.id, apartment_id: inventory.tables.apartments[i].id, lease_start: "2024-01-01", lease_end: "2024-12-31", status: "ended" });
  const orphan = inventory.tables.apartments[2];
  orphan.status = "occupied";
  const plan = buildPlan(inventory, options);
  assert.ok(plan.summary.skipped.existing_rental_conflicts > 0);
  assert.ok(plan.summary.skipped.existing_occupancy_mismatch > 0);
  assert.ok(!plan.rows.some((r) => r.data.apartment_id === orphan.id));
  assert.ok(!plan.rows.some((r) => r.table === "tenancies" && r.data.tenant_id === tenant.id));
  assert.equal(orphan.status, "occupied");
});

test("suspended/admin-only users and hidden/deleted listings are excluded", () => {
  const inventory = fixture();
  inventory.tables.users[1].roles = ["admin"];
  inventory.tables.users[2].is_suspended = true;
  inventory.tables.apartments[0].deleted_at = "2026-10-01";
  inventory.tables.apartments[1].is_hidden_by_admin = true;
  const plan = buildPlan(inventory, options);
  const excludedUsers = inventory.tables.users.slice(1, 3).map((u) => u.id);
  const excludedApartments = inventory.tables.apartments.slice(0, 2).map((a) => a.id);
  assert.ok(plan.rows.every((r) => !excludedApartments.includes(r.data.apartment_id) && ![r.data.tenant_id, r.data.sender_id, r.data.receiver_id].some((id) => excludedUsers.includes(id))));
});

test("dates, seed, argument conflicts and malformed commands fail early", () => {
  for (const change of [{ years: 4 }, { years: 0 }, { years: 1.5 }, { seed: "x';drop" }, { asOf: "2026-02-30" }, { asOf: "2999-01-01" }]) assert.throws(() => validateOptions({ ...options, ...change }));
  for (const args of [["--force"], ["--apply", "--dry-run"], ["--cleanup"], ["--verify", "--apply", "--run", stableId("x", "x")], ["--seed"], ["--seed", "a", "--seed", "b"]]) assert.throws(() => parseArgs(args));
  assert.equal(manilaToday(new Date("2026-10-16T18:00:00Z")), "2026-10-17");
  assert.equal(parseArgs(["--reset", "--apply", "--run", stableId("x", "x")]).reset, true);
});

test("connection checks never trust the CLI link, hidden service host or insecure remote TLS", () => {
  const ref = "ezxirkpgfpripjydcqnt";
  const urls = [`https://${ref}.supabase.co`, `https://${ref}.supabase.co`];
  const env = { PGHOST: `db.${ref}.supabase.co`, PGUSER: "postgres", PGDATABASE: "postgres", PGSSLMODE: "verify-full" };
  assert.equal(validateConnection(env, {}, urls), ref);
  assert.equal(validateConnection({ ...env, PGHOST: "aws-0-ap-southeast-1.pooler.supabase.com", PGUSER: `postgres.${ref}`, PGPORT: "5432" }, {}, urls), ref);
  assert.throws(() => validateConnection({ ...env, PGHOST: "aws-0-ap-southeast-1.pooler.supabase.com", PGUSER: `postgres.${ref}`, PGPORT: "6543" }, {}, urls));
  for (const change of [{ PGHOST: "db.anotherproject.supabase.co" }, { PGSSLMODE: "require" }, { PGSERVICE: "hidden" }, { PGHOSTADDR: "1.2.3.4" }, { PGOPTIONS: "-c role=postgres" }]) assert.throws(() => validateConnection({ ...env, ...change }, {}, urls));
  assert.throws(() => validateConnection(env, {}, [urls[0], "https://other.supabase.co"]));
  assert.equal(validateConnection({ PGHOST: "127.0.0.1", PGUSER: "postgres", PGDATABASE: "apt_test" }, { local: true }, []), "local");
});

test("preview receipts bind mode, options, data and state; SQL quotes input and is read-only by default", () => {
  const plan = buildPlan(fixture(), options);
  const token = previewToken("state", "apply", plan);
  assert.notEqual(previewToken("changed", "apply", plan), token);
  assert.notEqual(previewToken("state", "cleanup", plan), token);
  assert.notEqual(previewToken("state", "apply", { ...plan, seed: "other" }), token);
  assert.equal(sqlLiteral("x'y"), "'x''y'");
  assert.match(operationSql("apply", plan, "state", stableId("x", "run"), true), /^begin read only;/);
  assert.match(operationSql("apply", plan, "state", stableId("x", "run"), false), /^begin;/);
  assert.match(operationSql("verify", plan, "state", stableId("x", "run"), false), /^begin read only;/);
});

test("generated payment references use the apps' APT- format and are deterministic", () => {
  const reference = aptReference(stableId("seed", "payment"));
  assert.match(reference, /^APT-[A-Z0-9]{8}$/);
  assert.equal(aptReference(stableId("seed", "payment")), reference);
  assert.notEqual(aptReference(stableId("seed", "other")), reference);
  const references = Array.from({ length: 5000 }, (_, i) => aptReference(stableId("seed", `payment:${i}`)));
  assert.equal(new Set(references).size, references.length);
  const a = buildPlan(fixture(), options).rows.filter((r) => r.table === "payment").map((r) => r.data.reference_id);
  const b = buildPlan(fixture(), options).rows.filter((r) => r.table === "payment").map((r) => r.data.reference_id);
  assert.deepEqual(a, b);
});

// A plan as the old generator saved it: DEMO-<stable id> on every payment.
function legacyPlan() {
  const plan = buildPlan(fixture(), options);
  const legacy = structuredClone(plan);
  const expected = new Map();
  for (const [i, row] of legacy.rows.entries()) {
    if (row.table !== "payment") continue;
    const id = stableId("legacy", `payment:${i}`);
    row.data.reference_id = `DEMO-${id}`;
    expected.set(row.data.id, aptReference(id));
  }
  return { legacy, expected };
}

test("re-keying changes only payment references, deterministically, without touching the input", () => {
  const { legacy, expected } = legacyPlan();
  const before = JSON.stringify(legacy);
  const { plan: rekeyed, changed } = rekeyPlanReferences(legacy);
  assert.equal(JSON.stringify(legacy), before, "the saved plan is not mutated");
  assert.equal(changed, expected.size);
  for (const [i, row] of rekeyed.rows.entries()) {
    if (row.table === "payment") assert.equal(row.data.reference_id, expected.get(row.data.id));
    else assert.deepEqual(row, legacy.rows[i]);
  }
  assert.deepEqual({ ...rekeyed, rows: undefined }, { ...legacy, rows: undefined });
  // Idempotent: a plan that is already re-keyed is returned unchanged.
  const again = rekeyPlanReferences(rekeyed);
  assert.equal(again.changed, 0);
  assert.deepEqual(again.plan, rekeyed);
});

test("re-keying refuses unexpected or colliding references", () => {
  const { legacy } = legacyPlan();
  const unknown = structuredClone(legacy);
  unknown.rows.find((r) => r.table === "payment").data.reference_id = "pay_abc";
  assert.throws(() => rekeyPlanReferences(unknown), /Unexpected payment reference/);
  const duplicated = structuredClone(legacy);
  const payments = duplicated.rows.filter((r) => r.table === "payment");
  payments[1].data.reference_id = payments[0].data.reference_id;
  assert.throws(() => rekeyPlanReferences(duplicated), /collide|Duplicate/);
});

test("the re-key command is its own operation: preview by default, never combined", () => {
  const run = stableId("x", "run");
  assert.equal(parseArgs(["--rekey-references", "--run", run])["rekey-references"], true);
  for (const args of [["--rekey-references"], ["--rekey-references", "--reset", "--run", run], ["--rekey-references", "--finance", "--run", run], ["--rekey-references", "--verify", "--run", run], ["--rekey-references", "--apply", "--dry-run", "--run", run]]) {
    assert.throws(() => parseArgs(args), undefined, args.join(" "));
  }
  const plan = { version: 1, rows: [] };
  assert.match(operationSql("rekey", plan, "state", run, true), /^begin read only;[\s\S]*select demo_population\.execute_rekey\('rekey',/);
  assert.match(operationSql("rekey", plan, "state", run, false), /^begin;[\s\S]*select demo_population\.execute_rekey\('rekey',/);
  assert.notEqual(previewToken("state", "rekey", plan), previewToken("state", "reset", plan));
});

test("selectPlan for a re-key needs an applied run and returns the saved plan with new references", () => {
  const { legacy, expected } = legacyPlan();
  assert.throws(() => selectPlan({ tables: {}, run: null }, options, false, true), /applied rental run/);
  assert.throws(() => selectPlan({ tables: {}, run: { status: "cleaned", plan: legacy } }, options, false, true), /applied rental run/);
  const plan = selectPlan({ tables: {}, run: { status: "applied", plan: legacy } }, options, false, true);
  for (const row of plan.rows.filter((r) => r.table === "payment")) assert.equal(row.data.reference_id, expected.get(row.data.id));
});
