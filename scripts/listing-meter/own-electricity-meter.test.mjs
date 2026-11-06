import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { OWN_ELECTRICITY_METER_ERROR } from "../../packages/constants/src/apartment/electricity-meter.ts";

const migration = await readFile(new URL("../../supabase/migrations/20261106210000_apartment_own_electricity_meter.sql", import.meta.url), "utf8");

test("own electricity meters: backfill, explicit consent, grants and RLS", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated;
    create table public.apartments (
      id int primary key,
      landlord_id text not null,
      name text not null,
      updated_at timestamptz default '2026-01-01Z'
    );
    insert into public.apartments values (1, 'owner', 'Existing', '2026-01-01Z');
    alter table public.apartments enable row level security;
    create policy visible on public.apartments for select using (true);
    create policy owner_insert on public.apartments for insert to authenticated
      with check (landlord_id = current_setting('test.owner', true));
    create policy owner_update on public.apartments for update to authenticated
      using (landlord_id = current_setting('test.owner', true));
    grant usage on schema public to anon, authenticated;
    grant select (id, name, updated_at) on public.apartments to anon, authenticated;
    grant insert (id, name, landlord_id), update (name) on public.apartments to authenticated;
  `);
  await db.exec(migration);

  await t.test("existing rows gain the label without changing timestamps", async () => {
    const result = await db.query("select has_own_electricity_meter, updated_at from apartments where id=1");
    assert.equal(result.rows[0].has_own_electricity_meter, true);
    assert.equal(new Date(result.rows[0].updated_at).toISOString(), "2026-01-01T00:00:00.000Z");
  });

  const asRole = async (role, work) => {
    await db.exec(`set role ${role}`);
    try { return await work(); } finally { await db.exec("reset role"); }
  };
  await db.exec("select set_config('test.owner', 'owner', false)");

  await t.test("anonymous visitors can read the label but cannot write it", async () => {
    await asRole("anon", async () => {
      assert.equal((await db.query("select has_own_electricity_meter from apartments")).rows[0].has_own_electricity_meter, true);
      await assert.rejects(db.exec("update apartments set has_own_electricity_meter=true"), /permission denied/);
    });
  });

  await t.test("omitted, false and null confirmations are refused", async () => {
    await asRole("authenticated", async () => {
      for (const sql of [
        "insert into apartments(id,landlord_id,name) values (2,'owner','Omitted')",
        "insert into apartments(id,landlord_id,name,has_own_electricity_meter) values (2,'owner','False',false)",
        "insert into apartments(id,landlord_id,name,has_own_electricity_meter) values (2,'owner','Null',null)",
      ]) {
        await assert.rejects(db.exec(sql), (error) => error.code === '23514' && error.message === OWN_ELECTRICITY_METER_ERROR);
      }
    });
  });

  await t.test("explicit confirmation succeeds and cannot later be removed", async () => {
    await asRole("authenticated", async () => {
      await db.exec("insert into apartments(id,landlord_id,name,has_own_electricity_meter) values (2,'owner','Confirmed',true)");
      await db.exec("update apartments set name='Renamed' where id=2");
      await db.exec("update apartments set has_own_electricity_meter=true where id=2");
      await assert.rejects(db.exec("update apartments set has_own_electricity_meter=false where id=2"), /dedicated electricity meter/);
      await assert.rejects(db.exec("update apartments set has_own_electricity_meter=null where id=2"), /dedicated electricity meter/);
    });
  });

  await t.test("new column grants do not bypass owner policies or grant other writes", async () => {
    await asRole("authenticated", async () => {
      await assert.rejects(db.exec("insert into apartments(id,landlord_id,name,has_own_electricity_meter) values (3,'someone-else','Wrong owner',true)"), /row-level security/);
      await assert.rejects(db.exec("update apartments set landlord_id='someone-else' where id=2"), /permission denied/);
    });
  });
});
