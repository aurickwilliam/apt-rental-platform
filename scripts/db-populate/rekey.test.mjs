import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { aptReference, rekeyPlanReferences } from "./planner.mjs";

// Runs the REAL re-key migration, and the real rental `validate`/`check_unchanged`
// bodies it extends, in embedded PostgreSQL. Only the operator/locking/inventory
// helpers are stubbed; they are covered by the opt-in suite in database.test.mjs.
const original = await readFile(new URL("../../supabase/migrations/20261017075357_safe_demo_population.sql", import.meta.url), "utf8");
const migration = await readFile(new URL("../../supabase/migrations/20261024090000_demo_population_rekey_references.sql", import.meta.url), "utf8");
const extract = (name) => {
  const start = original.indexOf(`create function demo_population.${name}(`);
  assert.notEqual(start, -1, `${name} is defined in the original migration`);
  return original.slice(start, original.indexOf("\n$$;\n", start) + 5);
};

const schema = `
create role anon; create role authenticated; create role service_role;
create schema demo_population;
create table demo_population.runs (id uuid primary key, singleton boolean not null default true unique, plan jsonb not null,
  baseline_ids jsonb not null default '{}', status text not null, created_at timestamptz default now(), updated_at timestamptz default now());
create table demo_population.changes (run_id uuid not null, table_name text not null, row_id uuid not null,
  before_row jsonb, after_row jsonb not null, primary key (run_id, table_name, row_id));
create table apartments (id uuid primary key, landlord_id uuid, monthly_rent numeric, rent_due_day int, status text);
create table tenancies (id uuid primary key, apartment_id uuid, tenant_id uuid, landlord_id uuid, lease_start date, lease_end date,
  monthly_rent numeric, rent_due_day int, status text);
create table payment (id uuid primary key, tenant_id uuid, apartment_id uuid, landlord_id uuid, tenancy_id uuid, amount numeric,
  due_date date, period_start date, status text, method text, reference_id text, updated_at timestamptz,
  paymongo_session_id text, paymongo_payment_id text, paymongo_intent_id text);
create table notifications (id uuid primary key, data jsonb);

create function demo_population.require_operator() returns void language sql as $$ select $$;
create function demo_population.lock_database() returns void language sql as $$ select $$;
create function demo_population.inventory() returns jsonb language sql as $$
  select jsonb_build_object('tables', t, 'stateHash', md5(t::text)) from (select jsonb_build_object(
    'payment', (select coalesce(jsonb_agg(to_jsonb(p) order by p.id), '[]') from public.payment p),
    'notifications', (select coalesce(jsonb_agg(to_jsonb(n) order by n.id), '[]') from public.notifications n)) t) q
$$;
${extract("check_unchanged")}
${extract("validate")}
`;

const run = randomUUID();
const apartment = randomUUID();
const landlord = randomUUID();
const tenant = randomUUID();
const tenancy = randomUUID();
const ids = [randomUUID(), randomUUID(), randomUUID()];
const legacy = ids.map((_, i) => `DEMO-${randomUUID()}`);
const refs = legacy.map((reference) => aptReference(reference.slice(5)));

const paymentRow = (id, reference_id, i) => ({
  id, tenant_id: tenant, apartment_id: apartment, landlord_id: landlord, tenancy_id: tenancy, amount: 5000,
  due_date: `2026-0${i + 1}-05`, period_start: `2026-0${i + 1}-01`, status: "paid", method: "gcash", reference_id, updated_at: `2026-0${i + 1}-06T00:00:00+00:00`,
});
const savedPlan = () => ({
  version: 1, seed: "s", years: 1, asOf: "2026-10-17", summary: { counts: { payment: ids.length } },
  rows: [
    ...ids.map((id, i) => ({ table: "payment", eventTime: `2026-0${i + 1}-06T00:00:00+08:00`, data: paymentRow(id, legacy[i], i) })),
    { table: "favorites", eventTime: "2026-01-01T00:00:00+08:00", data: { id: randomUUID(), tenant_id: tenant, apartment_id: apartment } },
  ],
});

async function freshDb() {
  const db = new PGlite();
  await db.exec(schema);
  await db.exec(migration);
  const plan = savedPlan();
  await db.exec(`
    insert into apartments values ('${apartment}','${landlord}',5000,5,'occupied');
    insert into tenancies values ('${tenancy}','${apartment}','${tenant}','${landlord}','2026-01-01','2026-12-31',5000,5,'active');
    insert into demo_population.runs(id, plan, status) values ('${run}', '${JSON.stringify(plan)}'::jsonb, 'applied');`);
  for (const row of plan.rows.filter((r) => r.table === "payment")) {
    await db.query("insert into payment select * from jsonb_populate_record(null::payment, $1::jsonb)", [JSON.stringify(row.data)]);
    // Record the row exactly as the database stores it, like the real importer does.
    await db.query("insert into demo_population.changes select $1::uuid, 'payment', p.id, null, to_jsonb(p) from payment p where p.id = $2", [run, row.data.id]);
  }
  const rows = (await db.query("select to_jsonb(p) j from payment p order by period_start")).rows.map((r) => r.j);
  return { db, plan, rows };
}

const stateHash = async (db) => (await db.query("select demo_population.inventory()->>'stateHash' h")).rows[0].h;
const snapshot = async (db) => JSON.stringify([
  (await db.query("select * from payment order by id")).rows,
  (await db.query("select * from demo_population.changes order by row_id")).rows,
  (await db.query("select plan, status from demo_population.runs")).rows,
]);
const rekey = async (db, plan, { preview = false, hash } = {}) =>
  (await db.query("select demo_population.execute_rekey('rekey', $1::jsonb, $2, $3::uuid, $4) r", [JSON.stringify(plan), hash ?? await stateHash(db), run, preview])).rows[0].r;
const refused = async (promise, code) => {
  await assert.rejects(promise, (error) => { assert.equal(error.code, code, error.message); return true; });
};

test("the validator accepts both reference shapes and still refuses anything else", async () => {
  const { db } = await freshDb();
  await db.query("select demo_population.validate($1::uuid)", [run]);
  await db.query("update payment set reference_id = 'APT-AB12CD34' where id = $1", [ids[0]]);
  await db.query("update demo_population.changes set after_row = jsonb_set(after_row,'{reference_id}','\"APT-AB12CD34\"') where row_id = $1", [ids[0]]);
  await db.query("select demo_population.validate($1::uuid)", [run]);
  for (const bad of ["pay_abc12345", "APT-short", "apt-ab12cd34", "APT-AB12CD3!"]) {
    await db.query("update payment set reference_id = $1 where id = $2", [bad, ids[0]]);
    await db.query("update demo_population.changes set after_row = jsonb_set(after_row,'{reference_id}',to_jsonb($1::text)) where row_id = $2", [bad, ids[0]]);
    await assert.rejects(db.query("select demo_population.validate($1::uuid)", [run]), /Generated payments are inconsistent/, bad);
  }
});

test("preview reports the count and writes nothing; apply rewrites payments, records and plan together", async () => {
  const { db, plan, rows } = await freshDb();
  const target = rekeyPlanReferences(plan).plan;
  const before = await snapshot(db);
  const preview = await rekey(db, target, { preview: true });
  assert.equal(preview.rekeyed, 3);
  assert.equal(preview.preview, true);
  assert.equal(await snapshot(db), before);

  const result = await rekey(db, target);
  assert.equal(result.rekeyed, 3);
  const payments = (await db.query("select id, reference_id from payment order by period_start")).rows;
  assert.deepEqual(payments.map((p) => p.reference_id), refs);
  const changes = (await db.query("select after_row->>'reference_id' r from demo_population.changes order by after_row->>'period_start'")).rows;
  assert.deepEqual(changes.map((c) => c.r), refs);
  assert.deepEqual((await db.query("select plan from demo_population.runs")).rows[0].plan, target);
  // Every other column of every payment is untouched, and the run still validates.
  const after = (await db.query("select to_jsonb(p) j from payment p order by period_start")).rows.map((r) => r.j);
  after.forEach((row, i) => assert.deepEqual({ ...row, reference_id: legacy[i] }, rows[i]));
  await db.query("select demo_population.validate($1::uuid)", [run]);
});

test("repeating a re-key is a zero-write no-op", async () => {
  const { db, plan } = await freshDb();
  const target = rekeyPlanReferences(plan).plan;
  await rekey(db, target);
  const before = await snapshot(db);
  const again = await rekey(db, target);
  assert.equal(again.rekeyed, 0);
  assert.equal(await snapshot(db), before);
});

test("an edited, removed or untracked-dependent payment refuses the re-key and changes nothing", async () => {
  const cases = [
    ["edited payment", "AP005", (db) => db.query("update payment set amount = 1 where id = $1", [ids[1]])],
    ["removed payment", "AP005", (db) => db.query("delete from payment where id = $1", [ids[1]])],
    ["other record mentions an old reference", "AP006", (db) => db.query("insert into notifications values ($1, $2::jsonb)", [randomUUID(), JSON.stringify({ note: `see ${legacy[0]}` })])],
    ["new reference used by another payment", "23505", (db) => db.query("insert into payment(id, reference_id) values ($1, $2)", [randomUUID(), refs[2]])],
  ];
  for (const [name, code, mutate] of cases) {
    const { db, plan } = await freshDb();
    await mutate(db);
    const before = await snapshot(db);
    await refused(rekey(db, rekeyPlanReferences(plan).plan), code);
    assert.equal(await snapshot(db), before, name);
  }
});

test("a plan that differs beyond payment references, or in the wrong direction, is refused", async () => {
  const { db, plan } = await freshDb();
  const before = await snapshot(db);
  const target = rekeyPlanReferences(plan).plan;

  const amount = structuredClone(target); amount.rows[0].data.amount = 9999;
  await refused(rekey(db, amount), "AP007");
  const other = structuredClone(target); other.rows.at(-1).data.apartment_id = randomUUID();
  await refused(rekey(db, other), "AP007");
  const shorter = structuredClone(target); shorter.rows.pop();
  await refused(rekey(db, shorter), "AP007");
  const seed = { ...structuredClone(target), seed: "different" };
  await refused(rekey(db, seed), "AP007");
  const malformed = structuredClone(target); malformed.rows[0].data.reference_id = "APT-nope";
  await refused(rekey(db, malformed), "AP007");
  const duplicate = structuredClone(target); duplicate.rows[1].data.reference_id = duplicate.rows[0].data.reference_id;
  await refused(rekey(db, duplicate), "AP007");
  const reverse = structuredClone(target); reverse.rows[0].data.reference_id = "pay_123";
  await refused(rekey(db, reverse), "AP007");
  assert.equal(await snapshot(db), before);
});

test("a stale preview, another run, or a cleaned run is refused", async () => {
  const { db, plan } = await freshDb();
  const target = rekeyPlanReferences(plan).plan;
  await refused(rekey(db, target, { hash: "stale" }), "AP004");
  await refused(db.query("select demo_population.execute_rekey('rekey', $1::jsonb, $2, $3::uuid, false)", [JSON.stringify(target), await stateHash(db), randomUUID()]), "AP007");
  await assert.rejects(db.query("select demo_population.execute_rekey('reset', $1::jsonb, $2, $3::uuid, false)", [JSON.stringify(target), await stateHash(db), run]), /Unknown re-key mode/);
  await db.query("update demo_population.runs set status = 'cleaned'");
  await refused(rekey(db, target), "AP007");
});

test("a failure part-way rolls every table back, including the saved plan", async () => {
  const { db, plan } = await freshDb();
  await db.exec(`create function fail_second() returns trigger language plpgsql as $$ begin
    if new.id = '${ids[2]}' then raise exception 'boom'; end if; return new; end $$;
    create trigger fail_second before update on payment for each row execute function fail_second();`);
  const before = await snapshot(db);
  await assert.rejects(rekey(db, rekeyPlanReferences(plan).plan), /boom/);
  assert.equal(await snapshot(db), before);
});
