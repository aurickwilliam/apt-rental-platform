import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const migration = await readFile(
  new URL("../../supabase/migrations/20261107120000_block_applications_with_active_tenancy.sql", import.meta.url),
  "utf8",
);

async function setup(t) {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema app_private;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('role',current_setting('test.role',true)) $$;
    create table users(id uuid primary key, user_id uuid);
    create table tenancies(id uuid primary key, tenant_id uuid references users, status text);
    create table rental_application(id uuid primary key default gen_random_uuid(), tenant_id uuid references users, apartment_id uuid, status text default 'pending');
    grant usage on schema public, auth, app_private to authenticated;
    grant select, insert, update on all tables in schema public to authenticated, service_role;
    grant usage on schema public, auth, app_private to service_role;
  `);
  await db.exec(migration);
  return db;
}

async function tenant(db, tenancyStatus) {
  const id = randomUUID();
  const authId = randomUUID();
  await db.query("insert into users(id,user_id) values ($1,$2)", [id, authId]);
  if (tenancyStatus) await db.query("insert into tenancies(id,tenant_id,status) values ($1,$2,$3)", [randomUUID(), id, tenancyStatus]);
  return { id, authId };
}

async function applyAs(db, who, role = "authenticated") {
  await db.exec(`set test.uid='${who.authId ?? ""}'; set test.role='${role}'; set role ${role === "service_role" ? "service_role" : "authenticated"}`);
  try {
    await db.query("insert into rental_application(tenant_id, apartment_id) values ($1,$2)", [who.id, randomUUID()]);
    return null;
  } catch (error) {
    return error;
  } finally {
    await db.exec("reset role");
  }
}

test("a tenant with an active rental cannot submit an application", async (t) => {
  const db = await setup(t);
  const error = await applyAs(db, await tenant(db, "active"));
  assert.ok(error, "insert must be refused");
  assert.match(error.message, /already have an active rental/);
  assert.equal(error.code, "23514");
});

test("a tenant with no rental or only an ended one can apply", async (t) => {
  const db = await setup(t);
  assert.equal(await applyAs(db, await tenant(db, null)), null);
  assert.equal(await applyAs(db, await tenant(db, "ended")), null);
});

test("another tenant's active rental never blocks this tenant", async (t) => {
  const db = await setup(t);
  await tenant(db, "active");
  assert.equal(await applyAs(db, await tenant(db, null)), null);
});

test("trusted service-role inserts are not blocked", async (t) => {
  const db = await setup(t);
  const who = await tenant(db, "active");
  assert.equal(await applyAs(db, { id: who.id, authId: "" }, "service_role"), null);
});

test("existing applications stay readable and updatable", async (t) => {
  const db = await setup(t);
  const who = await tenant(db, null);
  const applicationId = randomUUID();
  await db.query("insert into rental_application(id,tenant_id,apartment_id) values ($1,$2,$3)", [applicationId, who.id, randomUUID()]);
  await db.query("insert into tenancies(id,tenant_id,status) values ($1,$2,'active')", [randomUUID(), who.id]);
  await db.exec(`set test.uid='${who.authId}'; set test.role='authenticated'; set role authenticated`);
  await db.query("update rental_application set status='cancelled' where id=$1", [applicationId]);
  await db.exec("reset role");
  const { rows } = await db.query("select status from rental_application where id=$1", [applicationId]);
  assert.equal(rows[0].status, "cancelled");
});
