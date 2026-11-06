import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const migration = await readFile(
  new URL("../../supabase/migrations/20261107150000_admin_role_management.sql", import.meta.url),
  "utf8",
);

// A small stand-in for the real schema. require_admin and the second-step check
// copy their definitions from 20261104214450 and 20261024140000.
async function setup(t) {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema private; create schema app_private;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('test.jwt',true),''),'{}')::jsonb $$;
    create function private.has_admin_second_step() returns boolean language sql stable set search_path = '' as $$
      select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2' $$;
    create table public.users(
      id uuid primary key, user_id uuid, roles text[] not null, account_status text not null default 'verified',
      mobile_number text default '09171234567', is_suspended boolean not null default false, updated_at timestamptz
    );
    create table auth.sessions(id uuid primary key default gen_random_uuid(), user_id uuid);
    create table public.notifications(user_id uuid, title text, data jsonb);
    create table public.admin_audit_logs(
      id uuid primary key default gen_random_uuid(), admin_id uuid, action text, target_type text, target_id uuid, reason text,
      constraint admin_audit_logs_action_check check (action = any (array['USER_SUSPENDED']))
    );
    create function public.create_notification(p_user uuid, p_type text, p_title text, p_body text, p_data jsonb) returns uuid
      language plpgsql security definer set search_path = '' as $$
      begin insert into public.notifications values (p_user, p_title, p_data); return gen_random_uuid(); end $$;
    create function app_private.require_admin() returns uuid language plpgsql stable security definer set search_path = '' as $$
      declare v_admin_id uuid;
      begin
        select id into v_admin_id from public.users
        where user_id = (select auth.uid())
          and ('admin' = any(roles) and private.has_admin_second_step()) and not is_suspended;
        if v_admin_id is null then raise exception 'Admin access required.'; end if;
        return v_admin_id;
      end $$;
    -- The real guard: signed-in sessions may never write roles directly.
    create function public.guard_roles() returns trigger language plpgsql set search_path = '' as $$
      begin
        if current_user = 'authenticated' and new.roles is distinct from old.roles then
          raise exception 'Authorization and access fields are server-managed.';
        end if;
        return new;
      end $$;
    create trigger guard_roles before update on public.users for each row execute function public.guard_roles();
    grant usage on schema public, auth, private to authenticated;
    grant select, update on public.users to authenticated;
    grant select on public.admin_audit_logs to authenticated;
  `);
  await db.exec(migration);
  return db;
}

async function account(db, roles, overrides = {}) {
  const row = {
    id: randomUUID(),
    authId: randomUUID(),
    account_status: "verified",
    mobile_number: "09171234567",
    is_suspended: false,
    ...overrides,
  };
  await db.query(
    "insert into public.users(id,user_id,roles,account_status,mobile_number,is_suspended) values ($1,$2,$3,$4,$5,$6)",
    [row.id, row.authId, roles, row.account_status, row.mobile_number, row.is_suspended],
  );
  return row;
}

const nowSeconds = () => Math.floor(Date.now() / 1000);
const freshToken = (at = nowSeconds()) => ({ aal: "aal2", amr: [{ method: "totp", timestamp: at }] });

/** Calls the RPC as a signed-in client. Returns the database error, or null. */
async function call(db, fn, who, targetId, { jwt = freshToken(), reason = "Needs admin access" } = {}) {
  await db.exec(`set test.uid='${who.authId}'; set test.jwt='${JSON.stringify(jwt)}'; set role authenticated`);
  try {
    await db.query(`select public.${fn}($1,$2)`, [targetId, reason]);
    return null;
  } catch (error) {
    return error;
  } finally {
    await db.exec("reset role");
  }
}
const grant = (db, who, id, options) => call(db, "admin_grant_admin_role", who, id, options);
const revoke = (db, who, id, options) => call(db, "admin_revoke_admin_role", who, id, options);

async function rolesOf(db, id) {
  const { rows } = await db.query("select roles from public.users where id=$1", [id]);
  return rows[0].roles;
}

test("an admin with a fresh code adds an admin, keeping the existing role, with an audit row and a notice", async (t) => {
  const db = await setup(t);
  const admin = await account(db, ["admin", "tenant"]);
  const target = await account(db, ["landlord"]);
  assert.equal(await grant(db, admin, target.id), null);
  assert.deepEqual(await rolesOf(db, target.id), ["landlord", "admin"]);
  const { rows: audit } = await db.query("select admin_id, action, target_type, target_id, reason from public.admin_audit_logs");
  assert.deepEqual(audit, [{
    admin_id: admin.id, action: "ADMIN_ROLE_GRANTED", target_type: "user", target_id: target.id, reason: "Needs admin access",
  }]);
  const { rows: notices } = await db.query("select user_id, title from public.notifications");
  assert.deepEqual(notices, [{ user_id: target.id, title: "Admin access added" }]);
});

test("the second step and a recent code are both required", async (t) => {
  const db = await setup(t);
  const admin = await account(db, ["admin", "tenant"]);
  const target = await account(db, ["tenant"]);
  const tooOld = nowSeconds() - 6 * 60;
  const refused = [
    [{ aal: "aal1", amr: [{ method: "password", timestamp: nowSeconds() }] }, "Admin access required."],
    [{ aal: "aal2" }, "Enter a new authenticator code and try again."],
    [{ aal: "aal2", amr: "totp" }, "Enter a new authenticator code and try again."],
    [{ aal: "aal2", amr: [{ method: "password", timestamp: nowSeconds() }] }, "Enter a new authenticator code and try again."],
    [freshToken(tooOld), "Enter a new authenticator code and try again."],
  ];
  for (const [jwt, message] of refused) {
    assert.equal((await grant(db, admin, target.id, { jwt }))?.message, message);
    assert.equal((await revoke(db, admin, target.id, { jwt }))?.message, message);
  }
  assert.deepEqual(await rolesOf(db, target.id), ["tenant"]);
  assert.equal(await grant(db, admin, target.id, { jwt: freshToken(nowSeconds() - 4 * 60) }), null);
});

test("people who are not active admins are refused", async (t) => {
  const db = await setup(t);
  const tenant = await account(db, ["tenant"]);
  const suspendedAdmin = await account(db, ["admin", "tenant"], { is_suspended: true });
  const target = await account(db, ["tenant"]);
  assert.equal((await grant(db, tenant, tenant.id))?.message, "Admin access required.");
  assert.equal((await grant(db, tenant, target.id))?.message, "Admin access required.");
  assert.equal((await grant(db, suspendedAdmin, target.id))?.message, "Admin access required.");
  assert.deepEqual(await rolesOf(db, tenant.id), ["tenant"]);
});

test("only a verified, complete, active account can become an admin", async (t) => {
  const db = await setup(t);
  const admin = await account(db, ["admin", "tenant"]);
  const incomplete = "Only a verified account with a complete profile can become an admin.";
  for (const [overrides, message] of [
    [{ account_status: "unverified" }, incomplete],
    [{ account_status: "pending" }, incomplete],
    [{ mobile_number: null }, incomplete],
    [{ is_suspended: true }, "A suspended account cannot become an admin."],
  ]) {
    const target = await account(db, ["tenant"], overrides);
    assert.equal((await grant(db, admin, target.id))?.message, message);
    assert.deepEqual(await rolesOf(db, target.id), ["tenant"]);
  }
  const other = await account(db, ["admin", "landlord"]);
  assert.equal((await grant(db, admin, other.id))?.message, "This account is already an admin.");
  assert.equal((await grant(db, admin, randomUUID()))?.message, "Account not found.");
});

test("a reason is required", async (t) => {
  const db = await setup(t);
  const admin = await account(db, ["admin", "tenant"]);
  const target = await account(db, ["tenant"]);
  for (const reason of ["", "  a ", "x".repeat(501)]) {
    assert.match((await grant(db, admin, target.id, { reason }))?.message ?? "", /reason between 3 and 500/);
  }
});

test("removing admin keeps the other roles, ends sessions and is audited", async (t) => {
  const db = await setup(t);
  const admin = await account(db, ["admin", "tenant"]);
  const target = await account(db, ["tenant", "admin", "landlord"]);
  const bystander = await account(db, ["tenant"]);
  await db.query("insert into auth.sessions(user_id) values ($1),($1),($2)", [target.authId, bystander.authId]);
  assert.equal(await revoke(db, admin, target.id), null);
  assert.deepEqual(await rolesOf(db, target.id), ["tenant", "landlord"]);
  const { rows: sessions } = await db.query("select user_id from auth.sessions");
  assert.deepEqual(sessions, [{ user_id: bystander.authId }]);
  const { rows: audit } = await db.query("select action from public.admin_audit_logs");
  assert.deepEqual(audit, [{ action: "ADMIN_ROLE_REVOKED" }]);
  // Access ends at once, even for a token that was issued while still an admin.
  const other = await account(db, ["tenant"]);
  assert.equal((await grant(db, target, other.id))?.message, "Admin access required.");
});

test("nobody changes their own access, so the last admin always remains", async (t) => {
  const db = await setup(t);
  const admin = await account(db, ["admin", "tenant"]);
  assert.equal((await revoke(db, admin, admin.id))?.message, "You cannot change your own admin access.");
  assert.equal((await grant(db, admin, admin.id))?.message, "You cannot change your own admin access.");
  assert.deepEqual(await rolesOf(db, admin.id), ["admin", "tenant"]);
});

test("revoking refuses a non-admin and an admin-only account", async (t) => {
  const db = await setup(t);
  const admin = await account(db, ["admin", "tenant"]);
  const tenant = await account(db, ["tenant"]);
  const adminOnly = await account(db, ["admin"]);
  assert.equal((await revoke(db, admin, tenant.id))?.message, "This account is not an admin.");
  assert.match((await revoke(db, admin, adminOnly.id))?.message ?? "", /database operator/);
  assert.deepEqual(await rolesOf(db, adminOnly.id), ["admin"]);
});

test("the helpers stay private, signed-out callers have no access and direct role writes stay blocked", async (t) => {
  const db = await setup(t);
  const admin = await account(db, ["admin", "tenant"]);
  const { rows } = await db.query(`
    select has_function_privilege('anon', 'public.admin_grant_admin_role(uuid,text)', 'execute') as anon_grant,
           has_function_privilege('anon', 'public.admin_revoke_admin_role(uuid,text)', 'execute') as anon_revoke,
           has_function_privilege('authenticated', 'app_private.has_recent_totp()', 'execute') as helper_totp,
           has_function_privilege('authenticated', 'app_private.begin_admin_role_change(uuid,text)', 'execute') as helper_begin`);
  assert.deepEqual(rows[0], { anon_grant: false, anon_revoke: false, helper_totp: false, helper_begin: false });
  await db.exec("set role authenticated");
  await assert.rejects(
    db.query("update public.users set roles = roles || 'admin'::text where id = $1", [admin.id]),
    /server-managed/,
  );
  await db.exec("reset role");
});
