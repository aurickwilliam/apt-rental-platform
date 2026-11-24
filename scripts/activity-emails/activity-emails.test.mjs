import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

import { EMAIL_TEMPLATES } from "../../supabase/functions/email-notify/templates.ts";

const migrationsDir = new URL("../../supabase/migrations/", import.meta.url);
const migrationName = "20261107130000_activity_emails.sql";
const migration = await readFile(new URL(migrationName, migrationsDir), "utf8");

// The real queue_email() also posts to the edge function. This stand-in records
// the row, which is the part this migration decides.
async function setup(t, { failQueue = false, audited = false } = {}) {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema app_private;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
    create table public.users(id uuid primary key, user_id uuid, is_suspended boolean not null default false);
    create table public.notification_preferences(
      user_id uuid primary key references public.users,
      notifications_enabled boolean not null default true,
      push_enabled boolean not null default true,
      payment boolean not null default true, message boolean not null default true,
      maintenance boolean not null default true, apartment boolean not null default true,
      system boolean not null default true
    );
    create table public.notifications(
      id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users,
      type text not null, title text not null, message text not null default '', data jsonb not null default '{}'
    );
    create table public.email_outbox(
      id uuid primary key default gen_random_uuid(), user_id uuid not null, template text not null, params jsonb not null,
      constraint email_outbox_template_check check (template in ('warning'))
    );
    create table public.apartments(id uuid primary key, name text);
    create table public.rental_application(id uuid primary key, tenant_id uuid, apartment_id uuid);
    create table public.user_verifications(id uuid primary key default gen_random_uuid(), user_id uuid, status text default 'pending');
    create table public.apartment_verifications(id uuid primary key default gen_random_uuid(), apartment_id uuid, landlord_id uuid, status text default 'pending');
    create table public.passport_documents(id uuid primary key default gen_random_uuid(), user_id uuid, review_status text default 'unverified');
    create function app_private.queue_email(p_user_id uuid, p_template text, p_params jsonb) returns void language plpgsql as $$
    begin
      ${failQueue ? "raise exception 'provider down';" : ""}
      insert into public.email_outbox(user_id, template, params) values (p_user_id, p_template, p_params);
    end $$;
    ${audited ? "create schema demo_population; create table demo_population.audited_functions(name text primary key, hash text);" : ""}
  `);
  await db.exec(migration);
  return db;
}

async function user(db) {
  const id = randomUUID();
  const authId = randomUUID();
  await db.query("insert into public.users(id,user_id) values ($1,$2)", [id, authId]);
  return { id, authId };
}

const notify = (db, userId, type, title, message = "Body", data = {}) =>
  db.query("insert into public.notifications(user_id,type,title,message,data) values ($1,$2,$3,$4,$5)", [userId, type, title, message, data]);

const outbox = async (db, userId) =>
  (await db.query("select template, params from public.email_outbox where user_id=$1 order by params->>'title'", [userId])).rows;

test("each requested event becomes the right email", async (t) => {
  const db = await setup(t);
  const cases = [
    ["payment", "Rent Due Soon", "rent_reminder"],
    ["payment", "Rent Due Today", "rent_reminder"],
    ["payment", "Rent Past Due", "rent_reminder"],
    ["payment", "Tenant Rent Overdue", "rent_reminder"],
    ["payment", "Payment Successful", "payment_update"],
    ["payment", "Cash Payment Received", "payment_update"],
    ["payment", "Payment Received", "payment_update"],
    ["system", "Account verification approved", "verification_update"],
    ["system", "Passport document verified", "verification_update"],
    ["system", "Apartment verification approved", "verification_update"],
    ["apartment", "Application Approved", "application_update"],
    ["apartment", "Application Rejected", "application_update"],
    ["maintenance", "New Maintenance Request", "maintenance_update"],
    ["maintenance", "Maintenance Resolved", "maintenance_update"],
  ];
  for (const [type, title, template] of cases) {
    const who = await user(db);
    await notify(db, who.id, type, title);
    assert.deepEqual(await outbox(db, who.id), [{ template, params: { title, body: "Body" } }], title);
  }
});

test("other notifications and the landlord's upcoming rent reminders are not emailed", async (t) => {
  const db = await setup(t);
  const who = await user(db);
  for (const [type, title] of [
    ["message", "New Message"],
    ["payment", "Tenant Rent Due Soon"],
    ["payment", "Tenant Rent Due Today"],
    ["apartment", "New Visit Request"],
    ["system", "Warning from the APT team"],
    ["system", "New account verification submitted"],
  ]) await notify(db, who.id, type, title);
  assert.deepEqual(await outbox(db, who.id), []);
});

test("a rejection carries the reviewer's reason", async (t) => {
  const db = await setup(t);
  const who = await user(db);
  await notify(db, who.id, "system", "Account verification rejected", "Blurry photo");
  const [row] = await outbox(db, who.id);
  assert.equal(row.params.reason, "Blurry photo");
});

test("a new application emails the landlord and gives the tenant a receipt", async (t) => {
  const db = await setup(t);
  const landlord = await user(db);
  const tenant = await user(db);
  const apartmentId = randomUUID();
  const applicationId = randomUUID();
  await db.query("insert into public.apartments(id,name) values ($1,'Sunrise Flat')", [apartmentId]);
  await db.query("insert into public.rental_application values ($1,$2,$3)", [applicationId, tenant.id, apartmentId]);
  await notify(db, landlord.id, "apartment", "New Application", "Ana applied for Sunrise Flat.", { applicationId });
  assert.equal((await outbox(db, landlord.id))[0].params.title, "New Application");
  const [receipt] = await outbox(db, tenant.id);
  assert.equal(receipt.template, "application_update");
  assert.equal(receipt.params.title, "Application submitted");
  assert.match(receipt.params.body, /Sunrise Flat/);
});

test("the per-type switch stops that type only, and push switches are ignored", async (t) => {
  const db = await setup(t);
  const who = await user(db);
  await db.query("insert into public.notification_preferences(user_id,payment,push_enabled,notifications_enabled) values ($1,false,false,false)", [who.id]);
  await notify(db, who.id, "payment", "Rent Past Due");
  await notify(db, who.id, "maintenance", "Maintenance Resolved");
  assert.deepEqual((await outbox(db, who.id)).map((row) => row.template), ["maintenance_update"]);
});

test("suspended accounts get no activity email", async (t) => {
  const db = await setup(t);
  const who = await user(db);
  await db.query("update public.users set is_suspended=true where id=$1", [who.id]);
  await notify(db, who.id, "payment", "Rent Past Due");
  await db.query("insert into public.user_verifications(user_id) values ($1)", [who.id]);
  assert.deepEqual(await outbox(db, who.id), []);
});

test("an operator run that suppresses delivery queues nothing, for any trigger", async (t) => {
  const db = await setup(t);
  const who = await user(db);
  await db.exec("set app.suppress_push_delivery='true'");
  await notify(db, who.id, "payment", "Rent Past Due");
  await db.query("insert into public.user_verifications(user_id) values ($1)", [who.id]);
  await db.exec("set app.suppress_push_delivery='false'");
  assert.deepEqual(await outbox(db, who.id), []);
});

test("a tenant cancelling their own request gets no email, but a landlord's cancellation does", async (t) => {
  const db = await setup(t);
  const tenant = await user(db);
  const landlord = await user(db);
  await db.exec(`set test.uid='${tenant.authId}'`);
  await notify(db, tenant.id, "maintenance", "Maintenance Cancelled");
  assert.deepEqual(await outbox(db, tenant.id), []);
  await db.exec(`set test.uid='${landlord.authId}'`);
  await notify(db, tenant.id, "maintenance", "Maintenance Cancelled");
  assert.equal((await outbox(db, tenant.id)).length, 1);
  await db.exec("set test.uid=''");
});

test("verification pending is emailed for account, apartment and passport submissions", async (t) => {
  const db = await setup(t);
  const who = await user(db);
  const apartmentId = randomUUID();
  await db.query("insert into public.apartments(id,name) values ($1,'Sunrise Flat')", [apartmentId]);
  await db.query("insert into public.user_verifications(user_id) values ($1)", [who.id]);
  await db.query("insert into public.apartment_verifications(apartment_id,landlord_id) values ($1,$2)", [apartmentId, who.id]);
  const { rows } = await db.query("insert into public.passport_documents(user_id) values ($1) returning id", [who.id]);
  assert.equal((await outbox(db, who.id)).length, 2, "an unverified passport row is not pending yet");
  await db.query("update public.passport_documents set review_status='pending' where id=$1", [rows[0].id]);
  await db.query("update public.passport_documents set review_status='pending' where id=$1", [rows[0].id]);
  const emails = await outbox(db, who.id);
  assert.deepEqual(emails.map((row) => row.params.title), [
    "Account verification pending",
    "Apartment verification pending",
    "Passport document pending",
  ]);
  assert.ok(emails.every((row) => row.template === "verification_update"));
  assert.match(emails[1].params.body, /Sunrise Flat/);
});

test("a failed email never undoes the notification that caused it", async (t) => {
  const db = await setup(t, { failQueue: true });
  const who = await user(db);
  await notify(db, who.id, "payment", "Rent Past Due");
  await db.query("insert into public.user_verifications(user_id) values ($1)", [who.id]);
  const { rows } = await db.query("select count(*)::int as n from public.notifications where user_id=$1", [who.id]);
  assert.equal(rows[0].n, 1);
  const verifications = await db.query("select count(*)::int as n from public.user_verifications where user_id=$1", [who.id]);
  assert.equal(verifications.rows[0].n, 1);
});

test("the new trigger function is registered with the demo-population audit", async (t) => {
  const db = await setup(t, { audited: true });
  const { rows } = await db.query(`
    select a.hash = md5(pg_get_functiondef('app_private.email_on_notification()'::regprocedure)) as matches
    from demo_population.audited_functions a where a.name = 'app_private.email_on_notification'`);
  assert.deepEqual(rows, [{ matches: true }]);
});

test("the outbox constraint and the edge function know the same templates", async () => {
  const listed = migration.match(/check \(template in \(([\s\S]*?)\)\);/)[1];
  const allowed = [...listed.matchAll(/'([a-z_]+)'/g)].map((match) => match[1]).sort();
  assert.deepEqual(allowed, [...EMAIL_TEMPLATES].sort());
});

test("every mapped title is still produced by a notification function", async () => {
  const titles = [...migration.matchAll(/when '([^']+)' then '[a-z_]+_(?:reminder|update)'/g)].map((match) => match[1]);
  assert.ok(titles.length >= 20);
  const others = (await readdir(migrationsDir)).filter((name) => name !== migrationName);
  const allSql = (await Promise.all(others.map((name) => readFile(new URL(name, migrationsDir), "utf8")))).join("\n");
  for (const title of titles) assert.ok(allSql.includes(`'${title}'`), `no migration produces "${title}"`);
});
