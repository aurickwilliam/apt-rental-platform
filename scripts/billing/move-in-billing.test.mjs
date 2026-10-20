import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const migration = await readFile(new URL("../../supabase/migrations/20261020101501_move_in_billing.sql", import.meta.url), "utf8");
const cashGuards = await readFile(new URL("../../supabase/migrations/20261016141949_guard_cash_payment_submissions.sql", import.meta.url), "utf8");
const reminders = await readFile(new URL("../../supabase/migrations/20260826054353_rent_due_reminders.sql", import.meta.url), "utf8");
const reminderFunction = reminders.slice(reminders.indexOf("create or replace function public.notify_rent_due_status()"), reminders.indexOf("revoke execute on function public.notify_rent_due_status()"));

// Minimal existing contract, not a replacement for a full Supabase migration
// replay. Tests execute the real migration/guards in PostgreSQL, without .env,
// Docker, credentials, or hosted writes.
const schema = `
create role anon; create role authenticated; create role service_role;
create schema demo_population;
create table demo_population.runs (id uuid primary key);
create table demo_population.audited_functions (name text primary key, hash text not null);
create schema auth;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid;
$$;
create function auth.jwt() returns jsonb language sql stable as $$
  select jsonb_build_object('role', coalesce(nullif(current_setting('test.role', true), ''), 'service_role'));
$$;
create table users (id uuid primary key, user_id uuid, is_suspended boolean default false, first_name text, last_name text);
create table apartments (id uuid primary key, landlord_id uuid, name text, monthly_rent numeric, security_deposit numeric, advance_rent numeric);
create table tenancies (
  id uuid primary key default gen_random_uuid(), apartment_id uuid, tenant_id uuid, landlord_id uuid,
  lease_start date, lease_end date, monthly_rent numeric, security_deposit numeric, advance_rent numeric,
  rent_due_day smallint default 5, status text default 'active'
);
create table payment (
  id uuid primary key default gen_random_uuid(), created_at timestamptz default now(),
  updated_at timestamptz, date date default current_date, amount numeric, status text default 'pending',
  method text, tenant_id uuid, apartment_id uuid, tenancy_id uuid, landlord_id uuid,
  period_start date, period_end date, due_date date, reference_id text,
  constraint payment_status_check check (status in ('pending', 'paid', 'partial', 'unpaid'))
);
create table maintenance_request (
  id uuid primary key default gen_random_uuid(), apartment_id uuid, tenant_id uuid,
  title text, fee_amount numeric, fee_status text default 'pending'
);
create table rent_reminders (id uuid default gen_random_uuid(), tenancy_id uuid, due_date date, kind text,
  unique(tenancy_id,due_date,kind));
create function public.create_notification(uuid,text,text,text,jsonb) returns void language sql as $$ select $$;
create function public.get_landlord_dashboard(uuid) returns jsonb language sql as $$
  select to_jsonb(sum(p.amount)) from public.payment p where p.status = 'paid';
$$;
create function public.notify_payment_created() returns trigger language plpgsql as $$ begin return new; end $$;
`;

test("move-in billing database contract", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(schema);
  await db.exec(cashGuards);
  await db.exec(reminderFunction);
  const tenant = randomUUID(), landlord = randomUUID(), authId = randomUUID();
  await db.query("insert into users(id,user_id) values ($1,$2),($3,$3)", [tenant, authId, landlord]);
  const { rows: [{ today, month }] } = await db.query("select (now() at time zone 'Asia/Manila')::date::text as today, date_trunc('month', now() at time zone 'Asia/Manila')::date::text as month");

  async function rental({ rent = 15000, deposit = 15000, advance = 15000, start = month, dueDay = 5 } = {}) {
    const apartment = randomUUID(), tenancy = randomUUID();
    await db.query("insert into apartments(id,landlord_id,name,monthly_rent,security_deposit,advance_rent) values($1,$2,'Unit',$3,$4,$5)", [apartment, landlord, rent, deposit, advance]);
    await db.query("insert into tenancies(id,apartment_id,tenant_id,landlord_id,lease_start,monthly_rent,security_deposit,advance_rent,rent_due_day) values($1,$2,$3,$4,$5,$6,$7,$8,$9)", [tenancy, apartment, tenant, landlord, start, rent, deposit, advance, dueDay]);
    return { tenancy, apartment };
  }
  async function bill(r, date = today) {
    const { rows } = await db.query("select app_private.tenancy_bill($1,$2) as bill", [r.tenancy, date]);
    return rows[0].bill;
  }
  async function pay(r, { amount, method = "cash", period, status = "pending" } = {}) {
    const b = await bill(r);
    const { rows } = await db.query(`insert into payment(tenancy_id,tenant_id,apartment_id,method,amount,period_start,status)
      values($1,$2,$3,$4,$5,$6,$7) returning *`, [r.tenancy, tenant, r.apartment, method, amount ?? b.totalDue, period ?? b.periodStart, status]);
    return rows[0];
  }
  async function confirm(id) {
    await db.query("update payment set status='paid' where id=$1", [id]);
  }
  async function nextMonth(start, count) {
    const { rows } = await db.query("select ($1::date + make_interval(months => $2))::date::text as d", [start, count]);
    return rows[0].d;
  }

  const legacy = await rental();
  await db.exec(`begin; ${migration} commit;`);

  await t.test("historical tenancies are not charged a new deposit or advance", async () => {
    assert.equal(await bill(legacy), null);
    const p = await pay(legacy, { amount: 15000, period: month });
    assert.equal(p.billing_kind, null);
    await confirm(p.id);
    const { rows } = await db.query("select app_private.rent_paid_for_period($1,$2) as paid", [legacy.tenancy, month]);
    assert.equal(Number(rows[0].paid), 15000);
  });

  await t.test("tracked direct-operator demo imports keep legacy billing without bypassing clients", async () => {
    const run = randomUUID();
    await db.query("insert into demo_population.runs(id) values($1)", [run]);
    await db.query("select set_config('app.demo_population_run',$1,false)", [run]);
    const historical = await rental();
    assert.equal(await bill(historical), null);
    await db.query("select set_config('app.demo_population_run','',false)");
    const normal = await rental();
    assert.equal((await bill(normal)).totalDue, 45000);
    const { rows } = await db.query("select count(*)::int as count from demo_population.audited_functions");
    assert.equal(rows[0].count, 6);
  });

  await t.test("first bill is 45k; pending cash covers neither month", async () => {
    const r = await rental();
    const b = await bill(r);
    assert.equal(b.totalDue, 45000);
    assert.equal(b.kind, "move_in");
    const p = await pay(r);
    assert.equal(Number(p.rent_amount), 15000);
    assert.equal(Number(p.deposit_amount), 15000);
    assert.equal(Number(p.advance_amount), 15000);
    assert.equal(Number(p.rental_income_amount), 30000);
    assert.equal((await bill(r)).rentPaid, false);
    assert.equal((await bill(r)).pendingPayment.id, p.id);
    await assert.rejects(pay(r, { method: "gcash" }), /already awaiting/);
    await confirm(p.id);
    assert.equal((await bill(r)).totalDue, 0);
    const second = await bill(r, await nextMonth(month, 1));
    assert.equal(second.coveredByAdvance, true);
    assert.equal(second.totalDue, 0);
    const third = await bill(r, await nextMonth(month, 2));
    assert.equal(third.totalDue, 15000);
    assert.equal(third.coveredByAdvance, false);
    await confirm(p.id); // Duplicate confirmations never create additional credit.
    await assert.rejects(pay(r), /already paid/);
    await assert.rejects(db.query("update payment set amount=1 where id=$1", [p.id]), /cannot be changed/);
    await assert.rejects(db.query("update payment set status='pending' where id=$1", [p.id]), /Only a pending/);
  });

  await t.test("failed wallet and rejected cash can retry without granting credit", async () => {
    const r = await rental();
    const first = await pay(r, { method: "gcash" });
    await db.query("update payment set status='failed' where id=$1", [first.id]);
    assert.equal((await bill(r)).totalDue, 45000);
    const second = await pay(r);
    await db.query("update payment set status='rejected' where id=$1", [second.id]);
    const third = await pay(r);
    await confirm(third.id);
    assert.equal((await bill(r)).rentPaid, true);
  });

  await t.test("wrong amount, period, ownership and prepaid INSERT are rejected", async () => {
    const r = await rental();
    await assert.rejects(pay(r, { amount: 15000 }), /bill has changed/);
    await assert.rejects(pay(r, { period: await nextMonth(month, 1) }), /bill has changed/);
    await assert.rejects(pay(r, { status: "paid", method: "card" }), /await confirmation/);
    await assert.rejects(db.query("insert into payment(tenancy_id,tenant_id,apartment_id,method,amount,period_start) values($1,$2,$3,'cash',45000,$4)", [r.tenancy, landlord, r.apartment, month]), /does not match/);
  });

  await t.test("zero advance and two-month deposits do not pay month 2 rent", async () => {
    const r = await rental({ deposit: 30000, advance: 0 });
    assert.equal((await bill(r)).totalDue, 45000);
    const p = await pay(r);
    await confirm(p.id);
    assert.equal((await bill(r, await nextMonth(month, 1))).totalDue, 15000);
  });

  await t.test("mid-month starts are due at move-in; next calendar month is prepaid", async () => {
    const r = await rental({ start: `${month.slice(0, 7)}-18` });
    const first = await bill(r);
    assert.equal(first.periodStart, month);
    assert.equal(first.dueDate, `${month.slice(0, 7)}-18`);
    const p = await pay(r);
    await confirm(p.id);
    assert.equal((await bill(r, await nextMonth(month, 1))).coveredByAdvance, true);
  });

  await t.test("year rollover and February boundaries preserve exact coverage", async () => {
    const r = await rental({ start: "2028-12-31", dueDay: 31 });
    const p = await pay(r);
    await confirm(p.id);
    assert.equal((await bill(r, "2029-01-31")).totalDue, 0);
    assert.equal((await bill(r, "2029-02-01")).totalDue, 15000);
    assert.equal((await bill(r, "2029-02-01")).periodEnd, "2029-02-28");
    assert.equal((await bill(r, "2029-02-01")).dueDate, "2029-02-28");
    assert.equal((await bill(r, "2032-02-01")).dueDate, "2032-02-29");
  });

  await t.test("overdue move-in bills remain payable, then month 3 uses normal monthly billing", async () => {
    const r = await rental({ start: await nextMonth(month, -2) });
    assert.equal((await bill(r)).kind, "move_in");
    assert.equal((await bill(r)).totalDue, 45000);
    const initial = await pay(r);
    await confirm(initial.id);
    assert.equal((await bill(r)).kind, "monthly");
    assert.equal((await bill(r)).totalDue, 15000);
    const monthly = await pay(r, { method: "card" });
    assert.equal(Number(monthly.deposit_amount), 0);
    assert.equal(Number(monthly.advance_amount), 0);
    await confirm(monthly.id);
    assert.equal((await bill(r)).totalDue, 0);
    await assert.rejects(pay(r), /already paid/);
  });

  await t.test("maintenance has its own allocation and only included fees settle", async () => {
    const r = await rental();
    const fee = randomUUID();
    await db.query("insert into maintenance_request(id,apartment_id,tenant_id,title,fee_amount) values($1,$2,$3,'Repair',500)", [fee, r.apartment, tenant]);
    assert.equal((await bill(r)).totalDue, 45500);
    const p = await pay(r);
    assert.equal(Number(p.maintenance_amount), 500);
    await assert.rejects(db.query("update maintenance_request set fee_amount=1000 where id=$1", [fee]), /awaiting confirmation/);
    await assert.rejects(db.query("delete from maintenance_request where id=$1", [fee]), /awaiting confirmation/);
    await db.query("insert into maintenance_request(apartment_id,tenant_id,title,fee_amount) values($1,$2,'Later repair',250)", [r.apartment, tenant]);
    await confirm(p.id);
    const b = await bill(r);
    assert.equal(b.rentPaid, true);
    assert.equal(b.totalDue, 250);
    const feesOnly = await pay(r);
    assert.equal(feesOnly.billing_kind, "fees");
    assert.equal(Number(feesOnly.rent_amount), 0);
    await confirm(feesOnly.id);
    assert.equal((await bill(r)).totalDue, 0);
    await confirm(p.id); // Cannot settle a later fee via replay.
  });

  await t.test("terms are frozen even if the listing changes", async () => {
    const r = await rental();
    await db.query("update apartments set monthly_rent=25000, security_deposit=50000 where id=$1", [r.apartment]);
    assert.equal((await bill(r)).totalDue, 45000);
    await assert.rejects(db.query("update tenancies set monthly_rent=25000 where id=$1", [r.tenancy]), /cannot be changed/);
    await assert.rejects(db.query("update tenancies set billing_version=null where id=$1", [r.tenancy]), /cannot be changed/);
  });

  await t.test("public bill endpoint checks account ownership and suspension", async () => {
    const r = await rental();
    await db.query("select set_config('test.role','authenticated',false),set_config('test.uid',$1,false)", [authId]);
    assert.equal((await db.query("select get_tenancy_bill($1) as b", [r.tenancy])).rows[0].b.totalDue, 45000);
    await assert.rejects(pay(r, { method: "card" }), /through checkout/);
    await db.query("update users set is_suspended=true where id=$1", [tenant]);
    await assert.rejects(db.query("select get_tenancy_bill($1)", [r.tenancy]), /cannot view/);
    await db.query("update users set is_suspended=false where id=$1", [tenant]);
    await db.query("select set_config('test.uid',$1,false)", [landlord]);
    await assert.rejects(db.query("select get_tenancy_bill($1)", [r.tenancy]), /cannot view/);
    await db.query("select set_config('test.role','service_role',false),set_config('test.uid','',false)");
  });

  await t.test("reminder function uses rent allocations, not total collected", async () => {
    const { rows } = await db.query("select pg_get_functiondef('public.notify_rent_due_status()'::regprocedure) as body");
    assert.match(rows[0].body, /app_private.rent_paid_for_period/);
    assert.doesNotMatch(rows[0].body, /sum\(p.amount\)/);
  });
});
