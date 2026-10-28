import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const migration = await readFile(
  new URL("../../supabase/migrations/20261028170000_hide_unverified_landlord_listings.sql", import.meta.url),
  "utf8",
);
// The real participant check the new policy reuses.
const phase2 = await readFile(
  new URL("../../supabase/migrations/20261007000100_phase2_multirole_access_functions.sql", import.meta.url),
  "utf8",
);
const start = phase2.indexOf("create or replace function app_private.can_view_hidden_apartment");
const participantCheck = phase2.slice(start, phase2.indexOf("revoke all on function app_private.can_view_hidden_apartment"));

const schema = `
create role anon; create role authenticated; create role service_role;
create schema auth; create schema app_private;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid;
$$;
create table users (id uuid primary key, user_id uuid, roles text[], account_status text, is_suspended boolean default false);
create table apartments (id uuid primary key default gen_random_uuid(), landlord_id uuid, name text, is_hidden_by_admin boolean default false);
create table tenancies (id uuid primary key default gen_random_uuid(), apartment_id uuid, tenant_id uuid);
alter table apartments enable row level security;
create policy open_apartments on apartments for select to anon, authenticated using (true);
grant usage on schema public, auth, app_private to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
${participantCheck}
grant execute on function app_private.can_view_hidden_apartment(uuid, uuid) to authenticated;
`;

async function as(db, role, person, work) {
  await db.exec(`select set_config('test.uid','${person?.authId ?? ""}',false)`);
  await db.exec(`set role ${role}`);
  try { return await work(); } finally { await db.exec("reset role"); }
}

test("listings of unverified landlords are not public", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(schema);
  await db.exec(migration);
  const person = async (roles, status) => {
    const id = randomUUID(), authId = randomUUID();
    await db.query("insert into users(id,user_id,roles,account_status) values ($1,$2,$3,$4)", [id, authId, roles, status]);
    return { id, authId };
  };
  const verified = await person(["landlord"], "verified");
  const unverified = await person(["landlord"], "unverified");
  const pending = await person(["landlord"], "pending");
  const renter = await person(["tenant"], "verified");
  const stranger = await person(["tenant"], "verified");
  const admin = await person(["admin"], "verified");
  const listing = async (landlord, name) =>
    (await db.query("insert into apartments(landlord_id, name) values ($1,$2) returning id", [landlord.id, name])).rows[0].id;
  await listing(verified, "verified listing");
  const hiddenId = await listing(unverified, "unverified listing");
  await listing(pending, "pending listing");
  await db.query("insert into tenancies(apartment_id, tenant_id) values ($1,$2)", [hiddenId, renter.id]);

  const names = async (role, who) =>
    as(db, role, who, async () => (await db.query("select name from apartments order by name")).rows.map((r) => r.name));

  await t.test("anonymous visitors only see verified landlords' listings", async () => {
    assert.deepEqual(await names("anon", null), ["verified listing"]);
  });
  await t.test("signed-in strangers only see verified landlords' listings", async () => {
    assert.deepEqual(await names("authenticated", stranger), ["verified listing"]);
  });
  await t.test("the landlord, a tenant with a tenancy there and admins keep access", async () => {
    assert.deepEqual(await names("authenticated", unverified), ["unverified listing", "verified listing"]);
    assert.deepEqual(await names("authenticated", renter), ["unverified listing", "verified listing"]);
    assert.deepEqual(await names("authenticated", admin), ["pending listing", "unverified listing", "verified listing"]);
  });
  await t.test("verifying the landlord restores the listing", async () => {
    await db.query("update users set account_status='verified' where id=$1", [pending.id]);
    assert.deepEqual(await names("anon", null), ["pending listing", "verified listing"]);
  });
});
