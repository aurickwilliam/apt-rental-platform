import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const read = (name) => readFile(new URL(`../../supabase/migrations/${name}`, import.meta.url), "utf8");
const landlordGate = await read("20261028160000_verified_landlord_gate.sql");
const tenantGate = await read("20261028180000_verified_tenant_actions.sql");
const exemptions = await read("20261028190000_active_tenancy_exemptions.sql");

const TABLES = [
  "apartments", "apartment_images", "rental_application", "visit_request", "tenancies",
  "maintenance_request", "payment", "landlord_expenses", "landlord_budgets",
  "landlord_finance_reviews", "chat", "reviews",
];

const schema = `
create role anon; create role authenticated; create role service_role;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid;
$$;
create function auth.jwt() returns jsonb language sql stable as $$
  select jsonb_build_object('role', coalesce(nullif(current_setting('test.role', true), ''), 'service_role'));
$$;
create table users (id uuid primary key, user_id uuid, roles text[], account_status text);
create table apartments (id uuid primary key default gen_random_uuid(), landlord_id uuid, name text);
create table apartment_images (id uuid primary key default gen_random_uuid(), apartment_id uuid);
create table rental_application (id uuid primary key default gen_random_uuid(), apartment_id uuid, tenant_id uuid, status text default 'pending');
create table visit_request (id uuid primary key default gen_random_uuid(), apartment_id uuid, tenant_id uuid, landlord_id uuid, status text default 'pending');
create table tenancies (id uuid primary key default gen_random_uuid(), apartment_id uuid, tenant_id uuid, landlord_id uuid, status text default 'active');
create table maintenance_request (id uuid primary key default gen_random_uuid(), apartment_id uuid, tenant_id uuid, landlord_id uuid, tenancy_id uuid, status text default 'open');
create table payment (id uuid primary key default gen_random_uuid(), apartment_id uuid, tenant_id uuid, landlord_id uuid, tenancy_id uuid, status text default 'pending');
create table landlord_expenses (id uuid primary key default gen_random_uuid(), landlord_id uuid, amount numeric);
create table landlord_budgets (id uuid primary key default gen_random_uuid(), landlord_id uuid, amount numeric);
create table landlord_finance_reviews (id uuid primary key default gen_random_uuid(), landlord_id uuid);
create table chat (id uuid primary key default gen_random_uuid(), sender_id uuid, receiver_id uuid, apartment_id uuid, message text);
create table reviews (id uuid primary key default gen_random_uuid(), tenant_id uuid);
${TABLES.map((t) => `alter table ${t} enable row level security;
create policy open_${t} on ${t} for all to authenticated using (true) with check (true);`).join("\n")}
grant usage on schema public, auth to authenticated;
grant all on all tables in schema public to authenticated;
`;

const LANDLORD = /Verify your account to use landlord features/;
const TENANT = /Verify your account to use this feature/;

async function as(db, person, work) {
  await db.exec(`select set_config('test.uid','${person?.authId ?? ""}',false);
    select set_config('test.role','${person ? "authenticated" : "service_role"}',false);`);
  if (person) await db.exec("set role authenticated");
  try { return await work(); } finally { await db.exec("reset role"); }
}

test("a running tenancy is never stuck on verification", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(schema);
  await db.exec(landlordGate);
  await db.exec(tenantGate);
  await db.exec(exemptions);

  const person = async (roles, status) => {
    const id = randomUUID(), authId = randomUUID();
    await db.query("insert into users(id,user_id,roles,account_status) values ($1,$2,$3,$4)", [id, authId, roles, status]);
    return { id, authId };
  };
  const landlord = await person(["landlord"], "unverified");
  const tenant = await person(["tenant"], "unverified");
  const stranger = await person(["tenant"], "unverified");
  const apartment = (await db.query("insert into apartments(landlord_id) values ($1) returning id", [landlord.id])).rows[0].id;
  const tenancy = async (status) =>
    (await db.query("insert into tenancies(apartment_id, tenant_id, landlord_id, status) values ($1,$2,$3,$4) returning id",
      [apartment, tenant.id, landlord.id, status])).rows[0].id;
  const active = await tenancy("active");
  const ended = await tenancy("ended");
  const payment = async (id) =>
    (await db.query("insert into payment(apartment_id, tenant_id, landlord_id, tenancy_id) values ($1,$2,$3,$4) returning id",
      [apartment, tenant.id, landlord.id, id])).rows[0].id;
  const maintenance = async (id) =>
    (await db.query("insert into maintenance_request(apartment_id, tenant_id, landlord_id, tenancy_id) values ($1,$2,$3,$4) returning id",
      [apartment, tenant.id, landlord.id, id])).rows[0].id;
  const activePayment = await payment(active);
  const endedPayment = await payment(ended);
  const activeMaintenance = await maintenance(active);
  const endedMaintenance = await maintenance(ended);

  await t.test("the tenant can still pay and report maintenance on the active tenancy", async () => {
    await as(db, tenant, async () => {
      await db.query("insert into payment(apartment_id, tenant_id, landlord_id, tenancy_id) values ($1,$2,$3,$4)", [apartment, tenant.id, landlord.id, active]);
      await db.query("insert into maintenance_request(apartment_id, tenant_id, landlord_id, tenancy_id) values ($1,$2,$3,$4)", [apartment, tenant.id, landlord.id, active]);
    });
  });

  await t.test("the tenant still cannot start anything else", async () => {
    await as(db, tenant, async () => {
      await assert.rejects(db.query("insert into visit_request(tenant_id) values ($1)", [tenant.id]), TENANT);
      await assert.rejects(db.query("insert into reviews(tenant_id) values ($1)", [tenant.id]), TENANT);
      await assert.rejects(db.query("insert into chat(sender_id, receiver_id) values ($1,$2)", [tenant.id, landlord.id]), TENANT);
      // An ended tenancy is no longer a reason to step aside.
      await assert.rejects(db.query("insert into payment(tenant_id, tenancy_id) values ($1,$2)", [tenant.id, ended]), TENANT);
      await assert.rejects(db.query("insert into maintenance_request(tenant_id, tenancy_id) values ($1,$2)", [tenant.id, ended]), TENANT);
    });
  });

  await t.test("an unverified tenant cannot borrow someone else's tenancy", async () => {
    await as(db, stranger, async () => {
      await assert.rejects(db.query("insert into payment(tenant_id, tenancy_id) values ($1,$2)", [stranger.id, active]), TENANT);
      await assert.rejects(db.query("insert into maintenance_request(tenant_id, tenancy_id) values ($1,$2)", [stranger.id, active]), TENANT);
    });
  });

  await t.test("the landlord can confirm cash, answer maintenance and see the tenancy", async () => {
    await as(db, landlord, async () => {
      assert.equal((await db.query("update payment set status='paid' where id=$1", [activePayment])).affectedRows, 1);
      assert.equal((await db.query("update maintenance_request set status='done' where id=$1", [activeMaintenance])).affectedRows, 1);
      assert.equal((await db.query("update tenancies set status='active' where id=$1", [active])).affectedRows, 1);
      assert.equal((await db.query("select id from tenancies")).rows.length, 2);
    });
  });

  await t.test("everything not tied to the active tenancy stays closed for the landlord", async () => {
    await as(db, landlord, async () => {
      assert.equal((await db.query("update payment set status='paid' where id=$1", [endedPayment])).affectedRows, 0);
      assert.equal((await db.query("update maintenance_request set status='done' where id=$1", [endedMaintenance])).affectedRows, 0);
      await assert.rejects(db.query("update tenancies set status='active' where id=$1", [ended]), LANDLORD);
      await assert.rejects(db.query("insert into apartments(landlord_id) values ($1)", [landlord.id]), LANDLORD);
      await assert.rejects(db.query("insert into tenancies(apartment_id, tenant_id, landlord_id) values ($1,$2,$3)", [apartment, tenant.id, landlord.id]), LANDLORD);
      await assert.rejects(db.query("insert into landlord_budgets(landlord_id, amount) values ($1,1)", [landlord.id]), LANDLORD);
      await assert.rejects(db.query("insert into chat(sender_id, receiver_id) values ($1,$2)", [landlord.id, tenant.id]), LANDLORD);
      assert.equal((await db.query("select count(*)::int as n from rental_application")).rows[0].n, 0);
    });
  });

  await t.test("the landlord can end the active tenancy, after which it closes again", async () => {
    await as(db, landlord, async () => {
      assert.equal((await db.query("update tenancies set status='ended' where id=$1", [active])).affectedRows, 1);
      assert.equal((await db.query("update payment set status='paid' where id=$1", [activePayment])).affectedRows, 0);
    });
  });
});
