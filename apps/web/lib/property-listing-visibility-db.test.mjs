import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const migration = await readFile(new URL("../../../supabase/migrations/20261105120000_landlord_listing_maintenance_visibility.sql", import.meta.url), "utf8");
const OWNER = "00000000-0000-0000-0000-000000000001";
const OTHER = "00000000-0000-0000-0000-000000000002";
const UNIT = "00000000-0000-0000-0000-000000000003";

test("maintenance visibility database contract", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  // Minimal host schema: existing owner-only/verified update authorization is
  // represented here; the production migration adds guards, not wider grants.
  await db.exec(`
    create role anon; create role authenticated;
    create table apartments (
      id uuid primary key, landlord_id uuid, status text,
      deleted_at timestamptz, is_hidden_by_admin boolean default false
    );
    create table tenancies (id integer generated always as identity, apartment_id uuid references apartments(id), status text);
    create table rental_application (id integer generated always as identity, apartment_id uuid references apartments(id), status text);
    create table visit_request (id integer generated always as identity, apartment_id uuid references apartments(id), status text);
    alter table apartments enable row level security;
    create policy read_apartments on apartments for select to authenticated using (true);
    create policy owner_update on apartments for update to authenticated
      using (landlord_id = nullif(current_setting('test.user', true), '')::uuid)
      with check (landlord_id = nullif(current_setting('test.user', true), '')::uuid);
    grant usage on schema public to authenticated;
    grant select on apartments to authenticated;
    grant update(status) on apartments to authenticated;
    insert into apartments(id, landlord_id, status) values ('${UNIT}', '${OWNER}', 'available');
  `);
  await db.exec(migration);

  const update = async (person, before, after) => {
    await db.query("select set_config('test.user', $1, false)", [person]);
    await db.exec("set role authenticated");
    try {
      return await db.query("update apartments set status=$1 where id=$2 and status=$3 returning status", [after, UNIT, before]);
    } finally { await db.exec("reset role"); }
  };

  await t.test("owner can hide and show; admin moderation is preserved", async () => {
    await db.exec(`update apartments set is_hidden_by_admin=true where id='${UNIT}'`);
    assert.equal((await update(OWNER, "available", "under_maintenance")).rows[0].status, "under_maintenance");
    assert.equal((await update(OWNER, "under_maintenance", "available")).rows[0].status, "available");
    assert.equal((await db.query("select is_hidden_by_admin from apartments")).rows[0].is_hidden_by_admin, true);
  });
  await t.test("another owner and stale status cannot change the listing", async () => {
    assert.equal((await update(OTHER, "available", "under_maintenance")).rows.length, 0);
    assert.equal((await update(OWNER, "under_maintenance", "available")).rows.length, 0);
  });
  await t.test("occupied properties cannot be hidden", async () => {
    await db.exec(`update apartments set status='occupied' where id='${UNIT}'`);
    await assert.rejects(update(OWNER, "occupied", "under_maintenance"), /Only available properties can be hidden/);
    await db.exec(`update apartments set status='available' where id='${UNIT}'`);
  });
  await t.test("real active tenancies block hiding even when the status drifted", async () => {
    await db.exec(`insert into tenancies(apartment_id,status) values ('${UNIT}','active')`);
    await assert.rejects(update(OWNER, "available", "under_maintenance"), /active tenancy/);
    await db.exec("update tenancies set status='ended'");
    await update(OWNER, "available", "under_maintenance");
  });
  await t.test("hidden listings reject new applications, visits and active tenancies, even from privileged callers", async () => {
    for (const table of ["rental_application", "visit_request", "tenancies"]) {
      await assert.rejects(db.exec(`insert into ${table}(apartment_id,status) values ('${UNIT}','active')`), /temporarily hidden/);
    }
    await assert.rejects(db.exec("update tenancies set status='active'"), /temporarily hidden/);
    await assert.rejects(update(OWNER, "under_maintenance", "occupied"), /Show the listing/);
  });
  await t.test("restoring a listing permits new requests without deleting past records", async () => {
    await update(OWNER, "under_maintenance", "available");
    await db.exec(`insert into rental_application(apartment_id,status) values ('${UNIT}','Applied');
      insert into visit_request(apartment_id,status) values ('${UNIT}','pending');
      insert into tenancies(apartment_id,status) values ('${UNIT}','active');`);
    assert.equal((await db.query("select count(*)::int as n from tenancies")).rows[0].n, 2);
  });
});
