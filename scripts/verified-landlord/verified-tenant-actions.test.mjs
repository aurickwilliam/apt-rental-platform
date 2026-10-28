import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const migration = await readFile(
  new URL("../../supabase/migrations/20261028180000_verified_tenant_actions.sql", import.meta.url),
  "utf8",
);

const schema = `
create role anon; create role authenticated; create role service_role;
create schema auth; create schema app_private;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid;
$$;
create function auth.jwt() returns jsonb language sql stable as $$
  select jsonb_build_object('role', coalesce(nullif(current_setting('test.role', true), ''), 'service_role'));
$$;
create table users (id uuid primary key, user_id uuid, roles text[], account_status text);
create table visit_request (id uuid primary key default gen_random_uuid(), tenant_id uuid, status text default 'pending');
create table maintenance_request (id uuid primary key default gen_random_uuid(), tenant_id uuid);
create table payment (id uuid primary key default gen_random_uuid(), tenant_id uuid, status text default 'pending');
create table reviews (id uuid primary key default gen_random_uuid(), tenant_id uuid);
create table chat (id uuid primary key default gen_random_uuid(), sender_id uuid, receiver_id uuid);
create table favorites (id uuid primary key default gen_random_uuid(), tenant_id uuid);
grant usage on schema public, auth, app_private to authenticated;
grant all on all tables in schema public to authenticated;
`;

const REFUSED = /Verify your account to use this feature/;

async function as(db, person, work) {
  await db.exec(`select set_config('test.uid','${person?.authId ?? ""}',false);
    select set_config('test.role','${person ? "authenticated" : "service_role"}',false);`);
  if (person) await db.exec("set role authenticated");
  try { return await work(); } finally { await db.exec("reset role"); }
}

test("tenant-side actions require a verified account", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(schema);
  await db.exec(migration);
  const person = async (roles, status) => {
    const id = randomUUID(), authId = randomUUID();
    await db.query("insert into users(id,user_id,roles,account_status) values ($1,$2,$3,$4)", [id, authId, roles, status]);
    return { id, authId };
  };
  const verified = await person(["tenant"], "verified");
  const unverified = await person(["tenant"], "unverified");
  const pending = await person(["tenant"], "pending");
  const rejected = await person(["tenant"], "rejected");
  const dual = await person(["tenant", "landlord"], "unverified");
  const landlordOnly = await person(["landlord"], "unverified");
  const other = await person(["landlord"], "verified");

  const inserts = (who) => [
    ["visit_request", "insert into visit_request(tenant_id) values ($1)", [who.id]],
    ["maintenance_request", "insert into maintenance_request(tenant_id) values ($1)", [who.id]],
    ["payment", "insert into payment(tenant_id) values ($1)", [who.id]],
    ["reviews", "insert into reviews(tenant_id) values ($1)", [who.id]],
    ["chat", "insert into chat(sender_id, receiver_id) values ($1,$2)", [who.id, other.id]],
  ];

  await t.test("unverified, pending, rejected and dual-role tenants are refused", async () => {
    for (const who of [unverified, pending, rejected, dual]) {
      await as(db, who, async () => {
        for (const [table, sql, params] of inserts(who)) {
          await assert.rejects(db.query(sql, params), REFUSED, table);
        }
      });
    }
  });

  await t.test("favorites stay open to an unverified tenant", async () => {
    await as(db, unverified, async () => {
      await db.query("insert into favorites(tenant_id) values ($1)", [unverified.id]);
    });
  });

  await t.test("verified tenants, landlord-only accounts and service role are unaffected", async () => {
    await as(db, verified, async () => {
      for (const [, sql, params] of inserts(verified)) await db.query(sql, params);
    });
    await as(db, landlordOnly, async () => {
      await db.query("insert into chat(sender_id, receiver_id) values ($1,$2)", [landlordOnly.id, other.id]);
    });
    await as(db, null, async () => {
      await db.query("insert into payment(tenant_id) values ($1)", [unverified.id]);
    });
  });

  await t.test("existing rows can still change, so nothing gets stuck", async () => {
    const { rows } = await db.query("insert into visit_request(tenant_id) values ($1) returning id", [unverified.id]);
    await as(db, unverified, async () => {
      await db.query("update visit_request set status='cancelled' where id=$1", [rows[0].id]);
    });
  });

  await t.test("becoming verified lifts the block", async () => {
    await db.query("update users set account_status='verified' where id=$1", [pending.id]);
    await as(db, pending, async () => {
      await db.query("insert into visit_request(tenant_id) values ($1)", [pending.id]);
    });
  });
});
