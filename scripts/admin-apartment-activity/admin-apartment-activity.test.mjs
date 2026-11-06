import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const migrations = new URL("../../supabase/migrations/", import.meta.url);
const migration = await readFile(new URL("20261107160000_admin_apartment_activity.sql", migrations), "utf8");
// The real admin check, so the test fails if the page's gate ever weakens.
const followups = await readFile(new URL("20261104214450_report_review_followups.sql", migrations), "utf8");
const requireAdmin = followups.match(/create or replace function app_private\.require_admin\(\)[\s\S]*?\n\$\$;/)[0];

const ADMIN = randomUUID();
const ADMIN_AUTH = randomUUID();
const OWNER = randomUUID();
const OWNER_AUTH = randomUUID();
const TENANT = randomUUID();
const APARTMENT = randomUUID();
const OTHER_APARTMENT = randomUUID();
const TENANCY = randomUUID();

async function setup(t) {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema app_private; create schema private;
    grant usage on schema public, auth to anon, authenticated;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
    create function private.has_admin_second_step() returns boolean language sql stable as $$ select coalesce(current_setting('test.aal', true), '') = 'aal2' $$;
    create table public.users(id uuid primary key, user_id uuid, roles text[], is_suspended boolean not null default false, first_name text, last_name text, email text, mobile_number text);
    create table public.tenancies(id uuid primary key, apartment_id uuid, tenant_id uuid, status text, lease_start date, lease_end date, monthly_rent numeric, security_deposit numeric, created_at timestamptz default now());
    create table public.payment(id uuid primary key default gen_random_uuid(), tenancy_id uuid, status text, date date, due_date date, amount numeric, reference_id text);
    create table public.rental_application(id uuid primary key default gen_random_uuid(), apartment_id uuid, status text, created_at timestamptz, monthly_income numeric, gov_id_url text);
    create table public.visit_request(id uuid primary key default gen_random_uuid(), apartment_id uuid, status text, visit_date date, confirmed_visit_date date, created_at timestamptz, message text);
    create table public.maintenance_request(id uuid primary key default gen_random_uuid(), apartment_id uuid, title text, urgency text, status text, created_at timestamptz, message text);
  `);
  await db.exec(requireAdmin);
  await db.exec(migration);
  await db.query("insert into public.users(id,user_id,roles) values ($1,$2,'{admin}'),($3,$4,'{landlord}')", [ADMIN, ADMIN_AUTH, OWNER, OWNER_AUTH]);
  await db.query("insert into public.users(id,user_id,roles,first_name,last_name,email,mobile_number) values ($1,$2,'{tenant}','Ana','Cruz','ana@example.test','09170000000')", [TENANT, randomUUID()]);
  await db.query("insert into public.tenancies(id,apartment_id,tenant_id,status,lease_start,lease_end,monthly_rent,security_deposit) values ($1,$2,$3,'active','2026-01-01','2026-12-31',12000,24000)", [TENANCY, APARTMENT, TENANT]);
  await db.query("insert into public.payment(tenancy_id,status,date,due_date,amount,reference_id) values ($1,'paid','2026-02-05','2026-02-05',12000,'APT-OLD'),($1,'pending','2026-03-05','2026-03-05',12000,'APT-NEW')", [TENANCY]);
  for (const [apartment, status, day] of [[APARTMENT, "pending", 1], [APARTMENT, "pending", 2], [APARTMENT, "approved", 3], [APARTMENT, "rejected", 4], [APARTMENT, "cancelled", 5], [OTHER_APARTMENT, "pending", 6]]) {
    await db.query("insert into public.rental_application(apartment_id,status,created_at,monthly_income,gov_id_url) values ($1,$2,$3,50000,'secret/id.jpg')", [apartment, status, `2026-01-0${day}`]);
  }
  for (const [status, day] of [["pending", 1], ["approved", 2], ["rescheduled", 3], ["cancelled", 4], ["rejected", 5]]) {
    await db.query("insert into public.visit_request(apartment_id,status,visit_date,created_at,message) values ($1,$2,'2026-02-01',$3,'private note')", [APARTMENT, status, `2026-01-0${day}`]);
  }
  for (const [status, urgency, day] of [["pending", "high", 1], ["in_progress", "high", 2], ["resolved", "high", 3], ["pending", "low", 4], ["cancelled", "low", 5], ["resolved", "low", 6]]) {
    await db.query("insert into public.maintenance_request(apartment_id,title,urgency,status,created_at,message) values ($1,$2,$3,$4,$5,'private detail')", [APARTMENT, `Repair ${day}`, urgency, status, `2026-01-0${day}`]);
  }
  return db;
}

async function call(db, { uid = "", aal = "", role = "authenticated", apartment = APARTMENT } = {}) {
  await db.exec(`set test.uid='${uid}'; set test.aal='${aal}'; set role ${role};`);
  try {
    const { rows } = await db.query("select public.get_admin_apartment_activity($1) as result", [apartment]);
    return rows[0].result;
  } finally {
    await db.exec("reset role");
  }
}

const asAdmin = (db, apartment) => call(db, { uid: ADMIN_AUTH, aal: "aal2", apartment });

test("an admin gets the page's data for that apartment", async (t) => {
  const db = await setup(t);
  const activity = await asAdmin(db);
  assert.equal(activity.tenancy.id, TENANCY);
  assert.equal(activity.tenancy.tenant_name, "Ana Cruz");
  assert.equal(Number(activity.tenancy.monthly_rent), 12000);
  assert.equal(activity.payment.status, "pending", "the latest payment");
  assert.deepEqual(activity.applications.counts, { total: 5, pending: 2, approved: 1, rejected: 1 });
  assert.deepEqual(activity.visits.counts, { total: 5, pending: 1, approved: 1, rescheduled: 1, cancelled: 1, rejected: 1 });
  assert.deepEqual(activity.maintenance.counts, { pending: 2, in_progress: 1, resolved: 2, high: 2 });
});

test("previews stay short and newest first", async (t) => {
  const db = await setup(t);
  const activity = await asAdmin(db);
  assert.deepEqual(activity.applications.items.map((row) => row.status), ["cancelled", "rejected", "approved"]);
  assert.equal(activity.visits.items.length, 3);
  assert.deepEqual(activity.maintenance.items.map((row) => row.title), ["Repair 6", "Repair 5", "Repair 4", "Repair 3", "Repair 2"]);
});

test("only the fields the page shows leave the database", async (t) => {
  const db = await setup(t);
  const activity = await asAdmin(db);
  assert.deepEqual(Object.keys(activity.tenancy).sort(), ["id", "lease_end", "lease_start", "monthly_rent", "status", "tenant_name"]);
  assert.deepEqual(Object.keys(activity.payment).sort(), ["date", "due_date", "status"]);
  assert.deepEqual(Object.keys(activity.applications.items[0]).sort(), ["created_at", "id", "status"]);
  assert.deepEqual(Object.keys(activity.visits.items[0]).sort(), ["confirmed_visit_date", "id", "status", "visit_date"]);
  assert.deepEqual(Object.keys(activity.maintenance.items[0]).sort(), ["created_at", "id", "status", "title", "urgency"]);
  const text = JSON.stringify(activity);
  for (const secret of ["secret/id.jpg", "50000", "ana@example.test", "09170000000", "private", "APT-NEW", "24000"]) {
    assert.ok(!text.includes(secret), `leaked ${secret}`);
  }
});

test("another apartment's records never appear, and an empty one is safe", async (t) => {
  const db = await setup(t);
  const other = await asAdmin(db, OTHER_APARTMENT);
  assert.equal(other.tenancy, null);
  assert.equal(other.payment, null);
  assert.equal(other.applications.counts.total, 1);
  assert.deepEqual(other.visits.items, []);
  assert.deepEqual(other.maintenance.items, []);
});

test("a tenancy with no payments yet reports no payment", async (t) => {
  const db = await setup(t);
  await db.exec("delete from public.payment");
  const activity = await asAdmin(db);
  assert.equal(activity.tenancy.id, TENANCY);
  assert.equal(activity.payment, null);
});

test("everyone except a current admin who passed the second step is refused", async (t) => {
  const db = await setup(t);
  await assert.rejects(call(db, { uid: ADMIN_AUTH, aal: "aal1" }), /Admin access required/);
  await assert.rejects(call(db, { uid: OWNER_AUTH, aal: "aal2" }), /Admin access required/);
  await assert.rejects(call(db, { uid: "" }), /Admin access required/);
  await assert.rejects(call(db, { role: "anon" }), /permission denied/);
  await db.query("update public.users set is_suspended=true where id=$1", [ADMIN]);
  await assert.rejects(asAdmin(db), /Admin access required/);
});

test("admins gain no direct access to the tables", async (t) => {
  const db = await setup(t);
  await db.exec(`set test.uid='${ADMIN_AUTH}'; set test.aal='aal2'; set role authenticated;`);
  try {
    await assert.rejects(db.query("select monthly_income from public.rental_application"), /permission denied/);
  } finally {
    await db.exec("reset role");
  }
});

test("the function cannot change data", async (t) => {
  const db = await setup(t);
  const { rows } = await db.query("select provolatile from pg_proc where proname='get_admin_apartment_activity'");
  assert.equal(rows[0].provolatile, "s", "must stay STABLE, which forbids writes");
});
