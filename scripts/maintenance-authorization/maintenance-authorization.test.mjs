import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const migration = await readFile(new URL("../../supabase/migrations/20261103120000_guard_maintenance_tenancy.sql", import.meta.url), "utf8");
const existing = await readFile(new URL("../../supabase/migrations/20261028190000_active_tenancy_exemptions.sql", import.meta.url), "utf8");
const fees = await readFile(new URL("../../supabase/migrations/20261020130311_maintenance_fee_tenancy.sql", import.meta.url), "utf8");
const feeGuard = fees.match(/create or replace function app_private\.guard_maintenance_fee\(\)[\s\S]*?\$\$;/i)?.[0];
assert.ok(feeGuard, "exercise the existing fee trigger, not a replacement");

test("maintenance authorization is additive, caller-bound and compatible with active-lease exemptions", async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema app_private;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('role',current_setting('test.role',true)) $$;
    create table users(id uuid primary key, user_id uuid, roles text[], account_status text default 'verified', is_suspended boolean default false);
    create table apartments(id uuid primary key, landlord_id uuid references users);
    create table tenancies(id uuid primary key, tenant_id uuid references users, apartment_id uuid references apartments, landlord_id uuid references users,
      status text, lease_start date, lease_end date, created_at timestamptz default now());
    create table maintenance_request(id uuid primary key default gen_random_uuid(),tenant_id uuid references users,apartment_id uuid references apartments,
      landlord_id uuid references users,tenancy_id uuid references tenancies,status text default 'pending',title text default 'Leak',
      created_at timestamptz default now(),fee_amount numeric,fee_status text,resolution_notes text);
    create table payment(id uuid,tenant_id uuid,landlord_id uuid,tenancy_id uuid);
    create function app_private.unverified_tenant_id() returns uuid language sql stable security definer as $$
      select id from public.users where user_id=auth.uid() and 'tenant'=any(roles) and account_status<>'verified' $$;
    create function app_private.unverified_landlord_id() returns uuid language sql stable security definer as $$
      select id from public.users where user_id=auth.uid() and 'landlord'=any(roles) and account_status<>'verified' $$;
    create function app_private.row_landlord_id(row_data jsonb, column_name text) returns uuid language sql as $$ select nullif(row_data->>column_name,'')::uuid $$;
    grant usage on schema public,auth,app_private to authenticated;
    grant select,insert,update on all tables in schema public to authenticated;
    alter table maintenance_request enable row level security;
    create policy tenant_insert_maintenance on maintenance_request for insert to authenticated with check (tenant_id=(select id from users where user_id=auth.uid()));
    create policy tenant_select_own_maintenance on maintenance_request for select to authenticated using (tenant_id=(select id from users where user_id=auth.uid()));
    create policy landlord_select_maintenance on maintenance_request for select to authenticated using (landlord_id=(select id from users where user_id=auth.uid()));
    create policy tenant_update_own_maintenance on maintenance_request for update to authenticated using (tenant_id=(select id from users where user_id=auth.uid())) with check (tenant_id=(select id from users where user_id=auth.uid()));
    create policy landlord_update_maintenance on maintenance_request for update to authenticated using (landlord_id=(select id from users where user_id=auth.uid())) with check (landlord_id=(select id from users where user_id=auth.uid()));
    create policy "Active accounts only" on maintenance_request as restrictive for all to authenticated
      using (exists(select 1 from users where user_id=auth.uid() and not is_suspended))
      with check (exists(select 1 from users where user_id=auth.uid() and not is_suspended));
  `);
  await db.exec(feeGuard);
  await db.exec("create trigger aa_guard_maintenance_fee before insert or update on maintenance_request for each row execute function app_private.guard_maintenance_fee()");
  await db.exec(existing);
  const person = async (roles, status = "verified") => {
    const id = randomUUID(), authId = randomUUID();
    await db.query("insert into users(id,user_id,roles,account_status) values($1,$2,$3,$4)", [id,authId,roles,status]);
    return {id,authId};
  };
  const tenant = await person(["tenant"]), other = await person(["tenant"]), landlord = await person(["landlord"]), otherLandlord = await person(["landlord"]);
  const mixed = await person(["tenant","admin"]), admin = await person(["admin"]), suspended = await person(["tenant"]);
  await db.query("update users set is_suspended=true where id=$1", [suspended.id]);
  const apartment = randomUUID();
  await db.query("insert into apartments values($1,$2)", [apartment,landlord.id]);
  const lease = async (who, status="active", start="today-30", end=null) => {
    const id=randomUUID();
    const date = start === "today-30" ? "((now() at time zone 'Asia/Manila')::date-30)" : start === "future" ? "((now() at time zone 'Asia/Manila')::date+30)" : "((now() at time zone 'Asia/Manila')::date-90)";
    await db.query(`insert into tenancies(id,tenant_id,apartment_id,landlord_id,status,lease_start,lease_end) values($1,$2,$3,$4,$5,${date},${end === "past" ? "((now() at time zone 'Asia/Manila')::date-1)" : "null"})`, [id,who.id,apartment,landlord.id,status]);
    return id;
  };
  const tenancy = await lease(tenant);
  const historical = (await db.query("insert into maintenance_request(tenant_id,apartment_id,landlord_id,tenancy_id,status) values($1,$2,$3,null,'resolved') returning id", [other.id,apartment,landlord.id])).rows[0].id;
  const before = (await db.query("select * from maintenance_request where id=$1", [historical])).rows;
  await db.exec(migration);
  assert.deepEqual((await db.query("select * from maintenance_request where id=$1", [historical])).rows,before,"no historical rows rewritten");
  const as = async (who, work) => {
    await db.query("select set_config('test.uid',$1,false),set_config('test.role','authenticated',false)",[who.authId]);
    await db.exec("set role authenticated");
    try { return await work(); } finally { await db.exec("reset role"); }
  };
  const insert = (who, tenancyId=null, owner=landlord.id) => db.query("insert into maintenance_request(tenant_id,apartment_id,landlord_id,tenancy_id) values($1,$2,$3,$4) returning id,tenancy_id,landlord_id",[who.id,apartment,owner,tenancyId]);

  await t.test("legacy payload resolves exactly its own active tenancy",async()=>{
    const result=await as(tenant,()=>insert(tenant));
    assert.equal(result.rows[0].tenancy_id,tenancy);
  });
  await t.test("explicit tenancy and nullable landlord are validated and bound",async()=>{
    const result=await as(tenant,()=>insert(tenant,tenancy,null));
    assert.equal(result.rows[0].landlord_id,landlord.id);
  });
  await t.test("applicants, forged relationships, admin-only and suspended callers are refused",async()=>{
    await as(other,async()=>{ await assert.rejects(insert(other),/active tenancy/); await assert.rejects(insert(tenant),/own active rental/); await assert.rejects(insert(other,tenancy),/active tenancy/); });
    await as(tenant,()=>assert.rejects(insert(tenant,tenancy,otherLandlord.id),/landlord/));
    await lease(admin); await as(admin,()=>assert.rejects(insert(admin),/own active rental/));
    await lease(suspended); await as(suspended,()=>assert.rejects(insert(suspended),/own active rental|row-level security/));
  });
  await t.test("ended rentals cannot create requests; future-start and expired-but-active rentals stay eligible",async()=>{
    const ended=await person(["tenant"]); const endedLease=await lease(ended,"ended");
    await as(ended,()=>assert.rejects(insert(ended,endedLease),/active tenancy/));
    for(const [start,end] of [["future",null],["old","past"]]) {
      const who=await person(["tenant"]); const id=await lease(who,"active",start,end);
      const explicit=await as(who,()=>insert(who,id));
      assert.equal(explicit.rows[0].tenancy_id,id);
      // Old clients still omit tenancy_id; status-only eligibility resolves it.
      const legacyWho=await person(["tenant"]); const legacyId=await lease(legacyWho,"active",start,end);
      const legacy=await as(legacyWho,()=>insert(legacyWho));
      assert.equal(legacy.rows[0].tenancy_id,legacyId);
    }
  });
  await t.test("unverified active tenants and mixed admin/tenant accounts keep their existing exemption",async()=>{
    const who=await person(["tenant"],"unverified"); await lease(who);
    await as(who,()=>insert(who));
    await lease(mixed); await as(mixed,()=>insert(mixed));
  });
  await t.test("multiple eligible matches require an explicit selection",async()=>{
    const second=await lease(tenant);
    await as(tenant,async()=>{ await assert.rejects(insert(tenant),/Choose the rental/); assert.equal((await insert(tenant,second)).rows[0].tenancy_id,second); });
  });
  await t.test("a dual-role account cannot report its own apartment as a tenant",async()=>{
    const who=await person(["tenant","landlord"]), unit=randomUUID(), stay=randomUUID();
    await db.query("insert into apartments values($1,$2)",[unit,who.id]);
    await db.query("insert into tenancies(id,tenant_id,apartment_id,landlord_id,status,lease_start) values($1,$2,$3,$2,'active','2020-01-01')",[stay,who.id,unit]);
    await as(who,()=>assert.rejects(db.query("insert into maintenance_request(tenant_id,apartment_id,landlord_id,tenancy_id) values($1,$2,$1,$3)",[who.id,unit,stay]),/active tenancy/));
  });
  await t.test("historical reads, tenant cancellation and landlord response remain available; rebinding is refused",async()=>{
    await as(other,async()=>{
      assert.equal((await db.query("select id from maintenance_request where id=$1",[historical])).rows.length,1);
      await db.query("update maintenance_request set status='cancelled' where id=$1",[historical]);
      await assert.rejects(db.query("update maintenance_request set tenancy_id=$1 where id=$2",[tenancy,historical]),/cannot move/);
    });
    await as(tenant,async()=>{ assert.equal((await db.query("select id from maintenance_request where id=$1",[historical])).rows.length,0); });
    await as(landlord,()=>db.query("update maintenance_request set resolution_notes='Repaired' where id=$1",[historical]));
    await as(otherLandlord,async()=>assert.equal((await db.query("select id from maintenance_request where id=$1",[historical])).rows.length,0));
  });
  await t.test("helper is not directly callable and uses an empty search path",async()=>{
    const result=await db.query("select prosecdef,proconfig,has_function_privilege('authenticated','app_private.guard_maintenance_tenancy()','execute') as allowed from pg_proc where oid='app_private.guard_maintenance_tenancy()'::regprocedure");
    assert.equal(result.rows[0].prosecdef,true); assert.equal(result.rows[0].allowed,false);
    assert.ok(result.rows[0].proconfig.some(value=>value.startsWith("search_path=")));
  });
  await t.test("trusted historical operator imports remain compatible",async()=>{
    await db.exec("select set_config('test.uid','',false); select set_config('test.role','service_role',false)");
    await insert(other);
  });
});
