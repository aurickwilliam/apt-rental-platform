import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const read = (name) => readFile(new URL(`../../supabase/migrations/${name}`, import.meta.url), "utf8");
const landlordGate = await read("20261028160000_verified_landlord_gate.sql");
const tenantReviews = await read("20261030234743_tenant_reviews.sql");
const tenantReviewsFollowup = await read("20261031053102_tenant_reviews_followup.sql");

// Minimal stand-ins for the tables and helpers the migration builds on.
const schema = `
create role anon; create role authenticated; create role service_role;
create schema auth; create schema private;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid;
$$;
create function auth.jwt() returns jsonb language sql stable as $$
  select jsonb_build_object('role', coalesce(nullif(current_setting('test.role', true), ''), 'service_role'));
$$;
create function private.is_admin() returns boolean language sql stable as $$
  select coalesce(nullif(current_setting('test.admin', true), ''), 'false')::boolean;
$$;
create table users (id uuid primary key, user_id uuid, roles text[], account_status text, is_suspended boolean not null default false, first_name text, last_name text, avatar_url text);
create table apartments (id uuid primary key default gen_random_uuid(), landlord_id uuid, name text);
create table apartment_images (id uuid primary key default gen_random_uuid(), apartment_id uuid);
create table rental_application (id uuid primary key default gen_random_uuid(), apartment_id uuid, tenant_id uuid, status text default 'pending');
create table visit_request (id uuid primary key default gen_random_uuid(), apartment_id uuid, tenant_id uuid, landlord_id uuid, status text default 'pending');
create table tenancies (id uuid primary key default gen_random_uuid(), apartment_id uuid, tenant_id uuid, landlord_id uuid, status text default 'active', lease_start date, lease_end date);
create table maintenance_request (id uuid primary key default gen_random_uuid(), apartment_id uuid, tenant_id uuid, landlord_id uuid, tenancy_id uuid, status text default 'open');
create table payment (id uuid primary key default gen_random_uuid(), apartment_id uuid, tenant_id uuid, landlord_id uuid, tenancy_id uuid, status text default 'pending');
create table landlord_expenses (id uuid primary key default gen_random_uuid(), landlord_id uuid, amount numeric);
create table landlord_budgets (id uuid primary key default gen_random_uuid(), landlord_id uuid, amount numeric);
create table landlord_finance_reviews (id uuid primary key default gen_random_uuid(), landlord_id uuid);
create schema app_private;
create function app_private.is_active_user() returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select not u.is_suspended from public.users u where u.user_id = (select auth.uid())), false);
$$;
create function app_private.current_active_user_id() returns uuid language sql stable security definer set search_path = '' as $$
  select u.id from public.users u where u.user_id = (select auth.uid()) and not u.is_suspended;
$$;
do $$ declare t text; begin
  foreach t in array array['apartments','apartment_images','rental_application','visit_request','tenancies','maintenance_request','payment','landlord_expenses','landlord_budgets','landlord_finance_reviews'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy open_%1$s on %1$I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;
create table chat (id uuid primary key default gen_random_uuid(), sender_id uuid, receiver_id uuid, apartment_id uuid, message text);
grant usage on schema public, auth, private, app_private to authenticated;
grant all on all tables in schema public to authenticated;
grant execute on all functions in schema app_private to authenticated;
`;

const REFUSED = /./;

async function as(db, person, work, { admin = false } = {}) {
  await db.exec(`select set_config('test.uid','${person?.authId ?? ""}',false);
    select set_config('test.role','${person ? "authenticated" : "service_role"}',false);
    select set_config('test.admin','${admin}',false);`);
  if (person) await db.exec("set role authenticated");
  try { return await work(); } finally { await db.exec("reset role"); }
}

async function setup() {
  const db = new PGlite();
  await db.exec(schema);
  await db.exec(landlordGate);
  await db.exec(tenantReviews);
  await db.exec(tenantReviewsFollowup);
  const people = {};
  const add = async (key, roles, status = "verified") => {
    const person = { id: randomUUID(), authId: randomUUID() };
    await db.query(
      "insert into users(id, user_id, roles, account_status, first_name, last_name) values ($1,$2,$3,$4,$5,$6)",
      [person.id, person.authId, roles, status, key, "Test"],
    );
    people[key] = person;
  };
  await add("landlord", ["landlord"]);
  await add("otherLandlord", ["landlord"]);
  await add("relatedLandlord", ["landlord"]);
  await add("strangerLandlord", ["landlord"]);
  await add("unverifiedLandlord", ["landlord"], "unverified");
  await add("tenant", ["tenant"]);
  await add("otherTenant", ["tenant"]);
  await add("admin", ["admin"]);

  const apartment = (await db.query("insert into apartments(landlord_id, name) values ($1,'Unit') returning id", [people.landlord.id])).rows[0].id;
  const tenancy = async (landlord, tenant, status, leaseEnd) =>
    (await db.query(
      "insert into tenancies(apartment_id, landlord_id, tenant_id, status, lease_start, lease_end) values ($1,$2,$3,$4,'2026-01-01',$5) returning id",
      [apartment, landlord.id, tenant.id, status, leaseEnd],
    )).rows[0].id;
  const tenancies = {
    ended: await tenancy(people.landlord, people.tenant, "ended", "2026-06-01"),
    expired: await tenancy(people.landlord, people.otherTenant, "active", "2026-06-01"),
    endedOther: await tenancy(people.landlord, people.otherTenant, "ended", "2026-06-01"),
    cancelled: await tenancy(people.landlord, people.otherTenant, "cancelled", "2026-06-01"),
    running: await tenancy(people.landlord, people.otherTenant, "active", "2099-01-01"),
    open: await tenancy(people.landlord, people.otherTenant, "active", null),
    other: await tenancy(people.otherLandlord, people.tenant, "ended", "2026-06-01"),
    unverified: await tenancy(people.unverifiedLandlord, people.tenant, "ended", "2026-06-01"),
  };
  return { db, people, tenancies, apartment };
}

test("landlords rate a tenant once the lease is over", async (t) => {
  const { db, people, tenancies, apartment } = await setup();
  t.after(() => db.close());
  const { landlord, otherLandlord, relatedLandlord, strangerLandlord, unverifiedLandlord, tenant, otherTenant, admin } = people;
  const rate = (tenancyId, rating, comment) =>
    db.query("select public.submit_tenant_review($1,$2,$3) as id", [tenancyId, rating, comment]);

  await t.test("an ended tenancy can be rated; ids come from the tenancy", async () => {
    await as(db, landlord, () => rate(tenancies.ended, 4, "  Great tenant  "));
    const row = (await db.query("select * from tenant_reviews where tenancy_id = $1", [tenancies.ended])).rows[0];
    assert.equal(row.landlord_id, landlord.id);
    assert.equal(row.tenant_id, tenant.id);
    assert.equal(row.rating, 4);
    assert.equal(row.comment, "Great tenant");
    assert.equal(row.updated_at, null);
  });

  await t.test("rating the same tenancy again edits it", async () => {
    await as(db, landlord, () => rate(tenancies.ended, 2, ""));
    const rows = (await db.query("select * from tenant_reviews where tenancy_id = $1", [tenancies.ended])).rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].rating, 2);
    assert.equal(rows[0].comment, null);
    assert.notEqual(rows[0].updated_at, null);
  });

  await t.test("only an ended tenancy counts; a passed lease end alone does not", async () => {
    await as(db, landlord, async () => {
      await assert.rejects(rate(tenancies.expired, 5, null), /once the lease has ended/);
      await assert.rejects(rate(tenancies.cancelled, 5, null), /once the lease has ended/);
      await rate(tenancies.endedOther, 5, null);
    });
  });

  await t.test("a running lease cannot be rated yet", async () => {
    await as(db, landlord, async () => {
      await assert.rejects(rate(tenancies.running, 5, null), /once the lease has ended/);
      await assert.rejects(rate(tenancies.open, 5, null), /once the lease has ended/);
    });
  });

  await t.test("only the tenancy's own landlord can rate, and the tenant never can", async () => {
    await as(db, otherLandlord, () => assert.rejects(rate(tenancies.ended, 5, null), /Only the landlord of this tenancy/));
    await as(db, tenant, () => assert.rejects(rate(tenancies.ended, 5, null), /Only the landlord of this tenancy/));
  });

  await t.test("an unverified landlord is blocked", async () => {
    await as(db, unverifiedLandlord, () => assert.rejects(rate(tenancies.unverified, 5, null), /Verify your account/));
  });

  await t.test("rating and comment are validated", async () => {
    await as(db, landlord, async () => {
      for (const bad of [0, 6, null]) {
        await assert.rejects(rate(tenancies.ended, bad, null), /Choose a rating from 1 to 5/);
      }
      await assert.rejects(rate(tenancies.ended, 3, "x".repeat(1001)), /under 1,000 characters/);
    });
  });

  await t.test("clients cannot write the table directly", async () => {
    await as(db, landlord, async () => {
      await assert.rejects(
        db.query("insert into tenant_reviews(tenancy_id, landlord_id, tenant_id, rating) values ($1,$2,$3,5)", [tenancies.open, landlord.id, otherTenant.id]),
        REFUSED,
      );
      await assert.rejects(db.query("update tenant_reviews set rating = 5"), REFUSED);
      await assert.rejects(db.query("delete from tenant_reviews"), REFUSED);
    });
  });

  await t.test("who can read a rating", async () => {
    const count = async (person, options) =>
      as(db, person, async () => (await db.query("select count(*)::int as n from tenant_reviews")).rows[0].n, options);

    assert.equal(await count(landlord), 2, "the author reads their own ratings");
    assert.equal(await count(tenant), 1, "the tenant reads ratings about them");
    assert.equal(await count(strangerLandlord), 0, "a landlord with no link to the tenant reads nothing");
    assert.equal(await count(otherLandlord), 1, "a landlord who rented to the tenant reads that tenant's ratings");

    await db.query("insert into rental_application(apartment_id, tenant_id) values ($1,$2)", [apartment, otherTenant.id]);
    assert.equal(await count(landlord), 2);

    // A landlord with an application from this tenant at their own listing can read it.
    const relatedApartment = (await db.query("insert into apartments(landlord_id, name) values ($1,'Other') returning id", [relatedLandlord.id])).rows[0].id;
    await db.query("insert into rental_application(apartment_id, tenant_id) values ($1,$2)", [relatedApartment, otherTenant.id]);
    assert.equal(await count(relatedLandlord), 1, "a landlord the tenant applied to reads that tenant's ratings");
    assert.equal(await count(strangerLandlord), 0, "no relationship, no access");
    assert.equal(await count(unverifiedLandlord), 0, "an unverified landlord reads no landlord-side rows");
    assert.equal(await count(null, { admin: false }), 2, "service role is unrestricted");
  });

  await t.test("get_tenant_reviews adds author and stay context for every allowed reader", async () => {
    const list = (person, tenantId, options) =>
      as(db, person, async () => (await db.query("select * from get_tenant_reviews($1)", [tenantId])).rows, options);

    const forTenant = await list(otherLandlord, tenant.id);
    assert.equal(forTenant.length, 1, "another landlord who rented to the tenant sees the rating");
    assert.equal(forTenant[0].landlord_first_name, "landlord");
    assert.equal(forTenant[0].apartment_name, "Unit", "apartment context comes through although the tenancy is not theirs");
    assert.equal(forTenant[0].is_mine, false);

    const own = await list(landlord, tenant.id);
    assert.equal(own.length, 1);
    assert.equal(own[0].is_mine, true);

    assert.equal((await list(tenant, tenant.id)).length, 1, "the tenant reads ratings about them");
    assert.equal((await list(strangerLandlord, tenant.id)).length, 0, "no relationship, no rows");
    assert.equal((await list(unverifiedLandlord, tenant.id)).length, 0, "an unverified landlord reads nothing");
    assert.equal((await list(otherTenant, tenant.id)).length, 0, "another tenant reads nothing");
    assert.equal((await list(admin, tenant.id, { admin: true })).length, 1, "admins read every rating");
    assert.equal((await list(null, tenant.id)).length, 0, "a call without a session reads nothing");
  });

  await t.test("admins can hide a rating and it leaves the lists and the table for everyone else", async () => {
    const reviewId = (await db.query("select id from tenant_reviews where tenancy_id = $1", [tenancies.ended])).rows[0].id;
    const hide = (person, hideIt, reason, options) =>
      as(db, person, () => db.query("select public.admin_set_tenant_review_hidden($1,$2,$3)", [reviewId, hideIt, reason]), options);

    await assert.rejects(hide(landlord, true, "Not allowed"), /Admin access required/);
    await assert.rejects(hide(admin, true, "", { admin: true }), /reason/);
    await hide(admin, true, "Abusive language", { admin: true });

    const visible = (person, options) =>
      as(db, person, async () => (await db.query("select count(*)::int as n from get_tenant_reviews($1)", [tenant.id])).rows[0].n, options);
    assert.equal(await visible(otherLandlord), 0);
    assert.equal(await visible(tenant), 0);
    assert.equal(await visible(landlord), 0);
    assert.equal(await visible(admin, { admin: true }), 1);

    await as(db, tenant, async () => {
      assert.equal((await db.query("select count(*)::int as n from tenant_reviews")).rows[0].n, 0);
    });
    await as(db, landlord, () => assert.rejects(rate(tenancies.ended, 1, "Edit after hide"), /removed by an administrator/));

    await hide(admin, false, null, { admin: true });
    assert.equal(await visible(otherLandlord), 1);
    await as(db, landlord, () => rate(tenancies.ended, 2, ""));
  });

  await t.test("a suspended account is invisible", async () => {
    await db.query("update users set is_suspended = true where id = $1", [tenant.id]);
    await as(db, tenant, async () => {
      assert.equal((await db.query("select count(*)::int as n from tenant_reviews")).rows[0].n, 0);
    });
    await db.query("update users set is_suspended = false where id = $1", [tenant.id]);
  });
});
