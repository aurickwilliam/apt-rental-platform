import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const migration = await readFile(new URL("../../supabase/migrations/20261031120000_mobile_registration_policy_acceptance.sql", import.meta.url), "utf8");
const webMigration = await readFile(new URL("../../supabase/migrations/20261029120000_web_registration_policy_acceptance.sql", import.meta.url), "utf8");
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
const details = {
  first_name: "Test", last_name: "User", middle_name: null, suffix: "Jr.", gender: "Male", mobile_number: "09171234567",
  birth_date: "2000-01-01", street_address: "123 Test", barangay: "Test", city: "Navotas", province: "Metro Manila", postal_code: 1485,
};

async function as(db, person, work, role = "authenticated") {
  await db.query("select set_config('test.uid', $1, false), set_config('test.email', $2, false)", [person?.authId ?? "", person?.email ?? ""]);
  await db.exec(`set role ${role}`);
  try { return await work(); } finally { await db.exec("reset role"); }
}

function complete(db, person, options = {}) {
  return db.query("select complete_mobile_registration($1::jsonb,$2,$3,$4,$5,$6,$7,$8::uuid) as id", [
    JSON.stringify(options.details ?? details), options.role ?? "tenant",
    "terms" in options ? options.terms : true, "privacy" in options ? options.privacy : true,
    "termsVersion" in options ? options.termsVersion : "1.1",
    "privacyVersion" in options ? options.privacyVersion : "1.0",
    "source" in options ? options.source : "mobile_registration", options.expectedAuthId ?? person.authId,
  ]);
}

test("mobile acceptance is atomic, caller-bound and backward compatible", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(base);
  await db.exec(rolesMigration.slice(rolesMigration.indexOf("create or replace function public.set_onboarding_role"), rolesMigration.indexOf("-- Storage policies")));
  await db.exec("grant execute on function set_onboarding_role(text) to authenticated; create trigger guard_authorization before insert or update on users for each row execute function guard_user_authorization_fields();");
  await db.exec(valuesGuard);
  await db.exec("create trigger guard_values before insert or update on users for each row execute function guard_user_profile_values();");
  await db.exec(suspensionFunction);
  await db.exec(webMigration);
  await db.exec(migration);

  async function person(options = {}) {
    const authId = randomUUID(), email = `${authId}@example.test`;
    await db.query("insert into auth.users values ($1, $2)", [authId, { provider: options.google ? "google" : "email" }]);
    if (options.profile) {
      await db.query("insert into users(user_id,email,roles,mobile_number,account_status,is_suspended) values ($1,$2,$3,$4,$5,$6)", [
        authId, email, ["tenant"], options.completed ? details.mobile_number : null,
        options.status ?? "unverified", options.suspended ?? false,
      ]);
      if (options.roles) await db.query("update users set roles=$1 where user_id=$2", [options.roles, authId]);
    }
    return { authId, email };
  }

  await t.test("email signup records both versions with internal ownership and database timestamps; retries do not rewrite", async () => {
    for (const role of ["tenant", "landlord"]) {
      const user = await person();
      await as(db, user, async () => {
        const id = (await complete(db, user, { role })).rows[0].id;
        const profile = (await db.query("select * from users")).rows[0];
        assert.equal(profile.id, id); assert.equal(profile.user_id, user.authId); assert.equal(profile.email, user.email);
        assert.deepEqual(profile.roles, [role]); assert.equal(profile.suffix, "Jr.");
        const before = (await db.query("select * from policy_acceptances order by policy_id")).rows;
        assert.equal(before.length, 2);
        assert.ok(before.every(row => row.user_id === id && row.accepted_at && row.source === "mobile_registration"));
        await complete(db, user, { role, details: { ...details, first_name: "Never overwrite" } });
        assert.deepEqual((await db.query("select * from policy_acceptances order by policy_id")).rows, before);
        assert.equal((await db.query("select first_name from users")).rows[0].first_name, "Test");
      });
    }
  });

  await t.test("rejects missing/false/null acceptance, stale revisions, invalid roles/sources and forged identity", async () => {
    const user = await person();
    await as(db, user, async () => {
      for (const options of [
        { terms: false }, { privacy: null }, { termsVersion: "old" }, { privacyVersion: null }, { role: "admin" },
        { source: "web_registration" }, { source: null }, { expectedAuthId: randomUUID() },
        { details: { ...details, user_id: randomUUID() } }, { details: { ...details, roles: ["admin"] } },
        { details: { ...details, account_status: "verified" } }, { details: { ...details, mobile_number: "bad" } },
      ]) {
        await assert.rejects(complete(db, user, options));
        assert.equal((await db.query("select count(*)::int as n from users")).rows[0].n, 0);
        assert.equal((await db.query("select count(*)::int as n from policy_acceptances")).rows[0].n, 0);
      }
    });
  });

  await t.test("Google placeholders switch roles through the existing guard and preserve suffix", async () => {
    const user = await person({ profile: true, google: true });
    await as(db, user, async () => {
      await complete(db, user, { role: "landlord", source: "mobile_profile_completion" });
      const profile = (await db.query("select * from users")).rows[0];
      assert.deepEqual(profile.roles, ["landlord"]); assert.equal(profile.suffix, "Jr.");
      assert.ok((await db.query("select source from policy_acceptances")).rows.every(row => row.source === "mobile_profile_completion"));
    });
    const emailUser = await person({ profile: true });
    await as(db, emailUser, async () => {
      await assert.rejects(complete(db, emailUser, { role: "landlord" }));
      assert.equal((await db.query("select mobile_number from users")).rows[0].mobile_number, null);
    });
  });

  await t.test("acceptance failure rolls back profile insertion and Google role changes", async () => {
    await db.exec(`create function reject_acceptance() returns trigger language plpgsql as $$ begin raise exception 'simulated acceptance failure'; end $$;
      create trigger reject_acceptance before insert on policy_acceptances for each row execute function reject_acceptance();`);
    try {
      for (const existing of [false, true]) {
        const user = await person({ profile: existing, google: true });
        await as(db, user, async () => {
          await assert.rejects(complete(db, user, { role: "landlord" }), /simulated acceptance failure/);
          const rows = (await db.query("select * from users")).rows;
          assert.equal(rows.length, existing ? 1 : 0);
          if (existing) { assert.equal(rows[0].mobile_number, null); assert.deepEqual(rows[0].roles, ["tenant"]); }
        });
      }
    } finally { await db.exec("drop trigger reject_acceptance on policy_acceptances; drop function reject_acceptance();"); }
  });

  await t.test("preserves held consumer roles for mixed accounts but refuses admin-only and unavailable role changes", async () => {
    for (const roles of [["tenant", "landlord"], ["tenant", "admin"]]) {
      const user = await person({ profile: true, roles });
      await as(db, user, async () => {
        await complete(db, user);
        assert.deepEqual((await db.query("select roles from users")).rows[0].roles, roles);
      });
    }
    for (const roles of [["admin"], ["tenant", "admin"]]) {
      const user = await person({ profile: true, roles });
      await as(db, user, async () => { await assert.rejects(complete(db, user, { role: "landlord" })); });
    }
  });

  await t.test("completed legacy and suspended accounts cannot be enrolled or overwritten", async () => {
    for (const options of [{ completed: true }, { suspended: true }, { status: "verified" }]) {
      const user = await person({ profile: true, ...options });
      await as(db, user, async () => { await assert.rejects(complete(db, user)); });
    }
  });

  await t.test("owner-only acceptance reads; direct writes, anonymous calls and foreign attestations are denied", async () => {
    const user = await person();
    await as(db, user, async () => {
      assert.equal((await db.query("select count(*)::int as n from policy_acceptances")).rows[0].n, 0);
      await assert.rejects(db.exec("delete from policy_acceptances"), /permission denied/);
      await assert.rejects(db.exec("update policy_acceptances set accepted_at = now()"), /permission denied/);
      await assert.rejects(db.query("insert into policy_acceptances(user_id,policy_id,policy_version,source) values($1,'terms','1.1','mobile_registration')", [randomUUID()]), /permission denied/);
      await assert.rejects(db.exec("select record_mobile_policy_acceptance(true,true,'1.1','1.0','mobile_registration')"), /Complete your profile/);
    });
    await as(db, null, async () => { await assert.rejects(complete(db, user), /permission denied/); }, "anon");
  });

  await t.test("web registration behavior and older mobile profile-only writes stay working", async () => {
    const web = await person();
    await as(db, web, async () => {
      await db.query("select complete_web_registration($1::jsonb,'tenant',true,true,'1.1','1.0','web_registration')", [JSON.stringify(details)]);
      assert.ok((await db.query("select source from policy_acceptances")).rows.every(row => row.source === "web_registration"));
      await assert.rejects(complete(db, web), /Profile setup is no longer/);
    });
    const legacy = await person();
    await as(db, legacy, async () => {
      await db.query("insert into users(user_id,email,roles,mobile_number) values($1,$2,'{tenant}',$3)", [legacy.authId, legacy.email, details.mobile_number]);
      assert.equal((await db.query("select count(*)::int as n from policy_acceptances")).rows[0].n, 0);
    });
  });
});
