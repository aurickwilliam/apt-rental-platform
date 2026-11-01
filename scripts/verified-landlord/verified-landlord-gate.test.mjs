import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const migration = await readFile(
  new URL("../../supabase/migrations/20261028160000_verified_landlord_gate.sql", import.meta.url),
  "utf8",
);

// Minimal existing contract, not a full Supabase replay: the real migration
// runs in PostgreSQL against just the tables and auth helpers it touches.
const WRITE_TABLES = [
  "apartments", "apartment_images", "rental_application", "visit_request", "tenancies",
  "maintenance_request", "payment", "landlord_expenses", "landlord_budgets",
  "landlord_finance_reviews", "chat",
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
create table maintenance_request (id uuid primary key default gen_random_uuid(), apartment_id uuid, tenant_id uuid, landlord_id uuid, status text default 'open');
create table payment (id uuid primary key default gen_random_uuid(), apartment_id uuid, tenant_id uuid, landlord_id uuid, status text default 'pending');
create table landlord_expenses (id uuid primary key default gen_random_uuid(), landlord_id uuid, amount numeric);
create table landlord_budgets (id uuid primary key default gen_random_uuid(), landlord_id uuid, amount numeric);
create table landlord_finance_reviews (id uuid primary key default gen_random_uuid(), landlord_id uuid);
create table chat (id uuid primary key default gen_random_uuid(), sender_id uuid, receiver_id uuid, apartment_id uuid, message text);
${WRITE_TABLES.map((t) => `alter table ${t} enable row level security;
create policy open_${t} on ${t} for all to authenticated using (true) with check (true);`).join("\n")}
grant usage on schema public, auth to authenticated;
grant all on all tables in schema public to authenticated;
`;

const REFUSED = /Verify your account to use landlord features/;

async function setup() {
  const db = new PGlite();
  await db.exec(schema);
  await db.exec(migration);
  const people = {};
  const add = async (key, roles, status) => {
    const id = randomUUID();
    const authId = randomUUID();
    await db.query("insert into users(id, user_id, roles, account_status) values ($1,$2,$3,$4)", [id, authId, roles, status]);
    people[key] = { id, authId };
  };
  await add("verified", ["landlord"], "verified");
  await add("unverified", ["landlord"], "unverified");
  await add("pending", ["landlord"], "pending");
  await add("rejected", ["landlord"], "rejected");
  await add("dual", ["landlord", "tenant"], "unverified");
  await add("tenant", ["tenant"], "verified");
  return { db, people };
}

async function as(db, person, work) {
  await db.exec(`select set_config('test.uid','${person?.authId ?? ""}',false);
    select set_config('test.role','${person ? "authenticated" : "service_role"}',false);`);
  if (person) await db.exec("set role authenticated");
  try {
    return await work();
  } finally {
    await db.exec("reset role");
  }
}

test("verified landlord gate", async (t) => {
  const { db, people } = await setup();
  t.after(() => db.close());
  const { verified, unverified, pending, rejected, dual, tenant } = people;

  const blockedApartment = (await db.query("insert into apartments(landlord_id, name) values ($1,'Blocked') returning id", [unverified.id])).rows[0].id;
  const dualApartment = (await db.query("insert into apartments(landlord_id, name) values ($1,'Dual') returning id", [dual.id])).rows[0].id;
  const verifiedApartment = (await db.query("insert into apartments(landlord_id, name) values ($1,'OK') returning id", [verified.id])).rows[0].id;
  const application = (await db.query("insert into rental_application(apartment_id, tenant_id) values ($1,$2) returning id", [blockedApartment, tenant.id])).rows[0].id;
  const payment = (await db.query("insert into payment(apartment_id, tenant_id, landlord_id) values ($1,$2,$3) returning id", [blockedApartment, tenant.id, unverified.id])).rows[0].id;
  await db.query("insert into visit_request(apartment_id, tenant_id, landlord_id) values ($1,$2,$3)", [blockedApartment, tenant.id, unverified.id]);
  await db.query("insert into tenancies(apartment_id, tenant_id, landlord_id) values ($1,$2,$3)", [blockedApartment, tenant.id, unverified.id]);
  await db.query("insert into maintenance_request(apartment_id, tenant_id, landlord_id) values ($1,$2,$3)", [blockedApartment, tenant.id, unverified.id]);

  await t.test("unverified, pending and rejected landlords cannot create listings or photos", async () => {
    for (const person of [unverified, pending, rejected]) {
      await as(db, person, async () => {
        await assert.rejects(db.query("insert into apartments(landlord_id, name) values ($1,'x')", [person.id]), REFUSED);
      });
    }
    await as(db, unverified, async () => {
      await assert.rejects(db.query("insert into apartment_images(apartment_id) values ($1)", [blockedApartment]), REFUSED);
    });
  });

  await t.test("a verified landlord is unaffected", async () => {
    await as(db, verified, async () => {
      await db.query("insert into apartments(landlord_id, name) values ($1,'new')", [verified.id]);
      await db.query("insert into apartment_images(apartment_id) values ($1)", [verifiedApartment]);
      await db.query("insert into landlord_expenses(landlord_id, amount) values ($1, 5)", [verified.id]);
      await db.query("insert into chat(sender_id, receiver_id, apartment_id) values ($1,$2,$3)", [verified.id, tenant.id, verifiedApartment]);
    });
  });

  await t.test("an unverified landlord cannot edit listings or change landlord-side records", async () => {
    await as(db, unverified, async () => {
      await assert.rejects(db.query("update apartments set name='y' where id=$1", [blockedApartment]), REFUSED);
      await assert.rejects(db.query("delete from apartments where id=$1", [blockedApartment]), REFUSED);
      // Rows the landlord can no longer read are invisible to writes: nothing changes.
      for (const [table, set, where] of [
        ["rental_application", "status='approved'", `id='${application}'`],
        ["payment", "status='paid'", `id='${payment}'`],
        ["visit_request", "status='approved'", `landlord_id='${unverified.id}'`],
        ["tenancies", "status='ended'", `landlord_id='${unverified.id}'`],
        ["maintenance_request", "status='done'", `landlord_id='${unverified.id}'`],
      ]) {
        const result = await db.query(`update ${table} set ${set} where ${where}`);
        assert.equal(result.affectedRows, 0, table);
      }
      await assert.rejects(db.query("insert into landlord_budgets(landlord_id, amount) values ($1, 1)", [unverified.id]), REFUSED);
      await assert.rejects(db.query("insert into landlord_finance_reviews(landlord_id) values ($1)", [unverified.id]), REFUSED);
    });
  });

  await t.test("an unverified landlord cannot read the landlord side of those records", async () => {
    await as(db, unverified, async () => {
      for (const table of ["rental_application", "payment", "visit_request", "tenancies", "maintenance_request"]) {
        const { rows } = await db.query(`select count(*)::int as n from ${table}`);
        assert.equal(rows[0].n, 0, table);
      }
    });
    await as(db, tenant, async () => {
      for (const table of ["rental_application", "payment", "visit_request", "tenancies", "maintenance_request"]) {
        const { rows } = await db.query(`select count(*)::int as n from ${table}`);
        assert.ok(rows[0].n >= 1, `${table} stays visible to the tenant`);
      }
    });
  });

  await t.test("tenants keep acting on a blocked landlord's records", async () => {
    await as(db, tenant, async () => {
      await db.query("insert into rental_application(apartment_id, tenant_id) values ($1,$2)", [blockedApartment, tenant.id]);
      await db.query("update payment set status='pending' where id=$1", [payment]);
    });
  });

  await t.test("chat: landlord-only is blocked, dual role only on its own apartments", async () => {
    await as(db, unverified, async () => {
      await assert.rejects(db.query("insert into chat(sender_id, receiver_id, apartment_id) values ($1,$2,null)", [unverified.id, tenant.id]), REFUSED);
    });
    await as(db, dual, async () => {
      await assert.rejects(db.query("insert into chat(sender_id, receiver_id, apartment_id) values ($1,$2,$3)", [dual.id, tenant.id, dualApartment]), REFUSED);
      await db.query("insert into chat(sender_id, receiver_id, apartment_id) values ($1,$2,$3)", [dual.id, verified.id, verifiedApartment]);
      await db.query("insert into chat(sender_id, receiver_id, apartment_id) values ($1,$2,null)", [dual.id, verified.id]);
    });
    await as(db, tenant, async () => {
      await db.query("insert into chat(sender_id, receiver_id, apartment_id) values ($1,$2,$3)", [tenant.id, unverified.id, blockedApartment]);
    });
  });

  await t.test("service role code paths are not blocked", async () => {
    await as(db, null, async () => {
      await db.query("update payment set status='paid' where id=$1", [payment]);
      await db.query("update apartments set name='service' where id=$1", [blockedApartment]);
    });
  });

  await t.test("becoming verified lifts the block", async () => {
    await db.query("update users set account_status='verified' where id=$1", [pending.id]);
    await as(db, pending, async () => {
      await db.query("insert into apartments(landlord_id, name) values ($1,'now ok')", [pending.id]);
    });
  });
});
