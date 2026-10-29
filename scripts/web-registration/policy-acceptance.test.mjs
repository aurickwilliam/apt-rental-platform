import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { REGISTRATION_POLICIES } from "../../apps/web/lib/registration-policies.ts";

const migration = await readFile(new URL("../../supabase/migrations/20261029120000_web_registration_policy_acceptance.sql", import.meta.url), "utf8");
const rolesMigration = await readFile(new URL("../../supabase/migrations/20260927000003_drop_legacy_role_column.sql", import.meta.url), "utf8");
const valuesGuard = await readFile(new URL("../../supabase/migrations/20261026120000_allow_all_ph_mobile_blocks.sql", import.meta.url), "utf8");
const suspensionFunction = await readFile(new URL("../../supabase/migrations/20261007000300_get_my_suspension_status.sql", import.meta.url), "utf8");
const base = `
create role anon; create role authenticated;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('email', current_setting('test.email', true)) $$;
create table auth.users (id uuid primary key, raw_app_meta_data jsonb);
create table public.users (
  id uuid primary key default gen_random_uuid(), user_id uuid unique not null,
  email text not null, roles text[] not null default '{tenant}', account_status text not null default 'unverified',
  is_suspended boolean not null default false, suspension_reason text,
  first_name text, last_name text, middle_name text, suffix text, gender text, mobile_number text,
  birth_date date, street_address text, barangay text, city text, province text, postal_code integer,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table users enable row level security;
create policy own_select on users for select to authenticated using (user_id = auth.uid() and not is_suspended);
create policy own_insert on users for insert to authenticated with check (user_id = auth.uid() and email = auth.jwt()->>'email');
create policy own_update on users for update to authenticated using (user_id = auth.uid() and not is_suspended) with check (user_id = auth.uid() and not is_suspended);
grant usage on schema public, auth to authenticated, anon;
grant select on users to authenticated;
grant insert (user_id, email, roles, first_name, last_name, middle_name, suffix, gender, mobile_number,
  birth_date, street_address, barangay, city, province, postal_code) on users to authenticated;
grant update (first_name, last_name, middle_name, suffix, gender, mobile_number, birth_date,
  street_address, barangay, city, province, postal_code, updated_at) on users to authenticated;
`;
const details = { first_name: "Test", last_name: "User", middle_name: null, gender: "Male", mobile_number: "09171234567", birth_date: "2000-01-01", street_address: "123 Test", barangay: "Test", city: "Navotas", province: "Metro Manila", postal_code: 1485 };

async function as(db, person, work, role = "authenticated") {
  await db.query("select set_config('test.uid', $1, false), set_config('test.email', $2, false)", [person?.authId ?? "", person?.email ?? ""]);
  await db.exec(`set role ${role}`);
  try { return await work(); } finally { await db.exec("reset role"); }
}

function complete(db, options = {}) {
  return db.query("select complete_web_registration($1::jsonb,$2,$3,$4,$5,$6,$7) as id", [
    JSON.stringify(options.details ?? details), options.role ?? "tenant",
    "terms" in options ? options.terms : true, "privacy" in options ? options.privacy : true,
    options.termsVersion ?? REGISTRATION_POLICIES.terms.version,
    options.privacyVersion ?? REGISTRATION_POLICIES.privacy.version,
    options.source ?? "web_registration",
  ]);
}

test("web registration commits profile + policies together without changing mobile's contract", async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(base);
  await db.exec(rolesMigration.slice(rolesMigration.indexOf("create or replace function public.set_onboarding_role"), rolesMigration.indexOf("-- Storage policies")));
  await db.exec("grant execute on function set_onboarding_role(text) to authenticated; create trigger guard_authorization before insert or update on users for each row execute function guard_user_authorization_fields();");
  await db.exec(valuesGuard);
  await db.exec("create trigger guard_values before insert or update on users for each row execute function guard_user_profile_values();");
  await db.exec(suspensionFunction);
  await db.exec(migration);
  const person = async (options = {}) => {
    const authId = randomUUID(), email = `${authId}@example.test`;
    await db.query("insert into auth.users values ($1, $2)", [authId, { provider: options.google ? "google" : "email" }]);
    let id;
    if (options.profile) {
      id = (await db.query("insert into users(user_id,email,roles,mobile_number,account_status,is_suspended) values ($1,$2,$3,$4,$5,$6) returning id", [authId, email, ["tenant"], options.completed ? "09171234567" : null, options.status ?? "unverified", options.suspended ?? false])).rows[0].id;
      if (options.roles) await db.query("update users set roles=$1 where id=$2", [options.roles, id]);
    }
    return { authId, email, id };
  };

  await t.test("migration policy versions match the website's displayed revisions", async () => {
    const rows = (await db.query("select * from web_registration_policies order by policy_id")).rows;
    assert.deepEqual(rows, [{ policy_id: "privacy", version: REGISTRATION_POLICIES.privacy.version }, { policy_id: "terms", version: REGISTRATION_POLICIES.terms.version }]);
  });

  await t.test("email profiles use JWT ownership/email and record both database timestamps", async () => {
    for (const role of ["tenant", "landlord"]) {
      const user = await person();
      await as(db, user, async () => {
        const id = (await complete(db, { role })).rows[0].id;
        const profile = (await db.query("select * from users")).rows[0];
        assert.equal(profile.id, id); assert.equal(profile.user_id, user.authId); assert.equal(profile.email, user.email);
        assert.deepEqual(profile.roles, [role]); assert.equal(profile.account_status, "unverified");
        const records = (await db.query("select * from policy_acceptances order by policy_id")).rows;
        assert.equal(records.length, 2); assert.ok(records.every(record => record.user_id === id && record.source === "web_registration" && record.accepted_at));
        const before = records.map(record => record.accepted_at);
        await complete(db, { role, details: { ...details, first_name: "Must not overwrite" } });
        assert.equal((await db.query("select first_name from users")).rows[0].first_name, "Test");
        assert.deepEqual((await db.query("select accepted_at from policy_acceptances order by policy_id")).rows.map(record => record.accepted_at), before);
      });
    }
  });

  await t.test("Google completion can choose either consumer role and restores its placeholder on failure", async () => {
    const user = await person({ profile: true, google: true });
    await as(db, user, async () => {
      await assert.rejects(complete(db, { role: "landlord", details: { ...details, mobile_number: "bad" } }), /valid Philippine mobile/);
      assert.equal((await db.query("select mobile_number from users")).rows[0].mobile_number, null);
      assert.deepEqual((await db.query("select roles from users")).rows[0].roles, ["tenant"]);
      await complete(db, { role: "landlord", source: "web_profile_completion" });
      assert.deepEqual((await db.query("select roles from users")).rows[0].roles, ["landlord"]);
      assert.equal((await db.query("select count(*)::int as n from policy_acceptances")).rows[0].n, 2);
    });
  });

  await t.test("missing acceptance, outdated versions, admin roles and forged identity columns never create a profile", async () => {
    const user = await person();
    await as(db, user, async () => {
      for (const options of [{ terms: false }, { privacy: null }, { termsVersion: "old" }, { privacyVersion: "old" }, { role: "admin" }, { details: { ...details, user_id: randomUUID() } }, { details: { ...details, account_status: "verified" } }, { source: "mobile" }]) {
        await assert.rejects(complete(db, options));
        assert.equal((await db.query("select count(*)::int as n from users")).rows[0].n, 0);
        assert.equal((await db.query("select count(*)::int as n from policy_acceptances")).rows[0].n, 0);
      }
    });
  });

  await t.test("a late acceptance-storage failure rolls back the entire profile completion", async () => {
    await db.exec("create function refuse_acceptance() returns trigger language plpgsql as $$ begin raise exception 'storage failure'; end $$; create trigger refuse_acceptance before insert on policy_acceptances for each row execute function refuse_acceptance();");
    for (const placeholder of [false, true]) {
      const user = await person({ profile: placeholder, google: placeholder });
      await as(db, user, async () => {
        await assert.rejects(complete(db, { role: "landlord" }), /storage failure/);
        const rows = (await db.query("select mobile_number,roles from users")).rows;
        if (placeholder) {
          assert.equal(rows[0].mobile_number, null); assert.deepEqual(rows[0].roles, ["tenant"]);
        } else assert.equal(rows.length, 0);
        assert.equal((await db.query("select count(*)::int as n from policy_acceptances")).rows[0].n, 0);
      });
    }
    await db.exec("drop trigger refuse_acceptance on policy_acceptances; drop function refuse_acceptance();");
  });

  await t.test("completed, suspended, verified and admin profiles cannot be re-enrolled", async () => {
    for (const options of [{ completed: true }, { suspended: true }, { status: "verified" }, { roles: ["admin", "tenant"] }]) {
      const user = await person({ profile: true, ...options });
      await as(db, user, () => assert.rejects(complete(db)));
      assert.equal((await db.query("select count(*)::int as n from policy_acceptances where user_id=$1", [user.id])).rows[0].n, 0);
    }
  });

  await t.test("history is private, immutable to ordinary clients and inaccessible to anon", async () => {
    const owner = await person();
    await as(db, owner, () => complete(db));
    const stranger = await person({ profile: true });
    await as(db, stranger, async () => {
      assert.equal((await db.query("select count(*)::int as n from policy_acceptances")).rows[0].n, 0);
      for (const sql of ["delete from policy_acceptances", "update policy_acceptances set source='web_registration'", "insert into policy_acceptances select * from policy_acceptances", "update web_registration_policies set version='fake'"]) await assert.rejects(db.exec(sql), /permission denied/);
    });
    await as(db, null, async () => {
      await assert.rejects(complete(db), /permission denied/);
      await assert.rejects(db.exec("select * from policy_acceptances"), /permission denied/);
    }, "anon");
  });

  await t.test("the existing mobile-style insert and Google completion still work without acceptance", async () => {
    const user = await person();
    await as(db, user, async () => {
      await db.query("insert into users(user_id,email,roles,mobile_number) values ($1,$2,'{tenant}','09171234567')", [user.authId, user.email]);
      assert.equal((await db.query("select count(*)::int as n from policy_acceptances")).rows[0].n, 0);
    });
    const google = await person({ profile: true, google: true });
    await as(db, google, async () => {
      await db.query("select set_onboarding_role('landlord')");
      await db.query("update users set mobile_number='09171234567' where user_id=$1", [google.authId]);
      assert.equal((await db.query("select count(*)::int as n from policy_acceptances")).rows[0].n, 0);
    });
  });
});
