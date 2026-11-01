// Local embedded PostgreSQL only. Runs the EXISTING session migration and
// consume function, not a reimplementation. No CLI link or remote credentials.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";

const { PGlite } = createRequire(new URL("../../../../package.json", import.meta.url))("@electric-sql/pglite");
test("existing PostgreSQL session ownership, expiry, RLS and atomic single-use contract", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create table public.users (id uuid primary key, user_id uuid unique, roles text[]);
      insert into public.users values
        ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', array['tenant']),
        ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', array['tenant']);
      grant usage on schema auth, public to authenticated;
      grant select on public.users to authenticated;
    `);
    await db.exec(await readFile(new URL("../../../../supabase/migrations/20261001000000_qr_verification_sessions.sql", import.meta.url), "utf8"));
    await db.exec(`insert into public.verification_sessions (user_id, token_hash, expires_at) values
      ('10000000-0000-0000-0000-000000000001', 'owner-token-hash', now() + interval '10 minutes');`);
    const asCaller = async id => {
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
      await db.exec("set role authenticated");
    };
    await asCaller("20000000-0000-0000-0000-000000000002");
    assert.equal((await db.query("select * from public.verification_sessions")).rows.length, 0);
    await assert.rejects(db.query("select public.consume_verification_session('owner-token-hash')"), /invalid|expired|used/i);
    await assert.rejects(db.exec("update public.verification_sessions set status = 'completed'"), /permission denied/i);
    await db.exec("reset role");
    await asCaller("");
    await assert.rejects(db.query("select public.consume_verification_session('owner-token-hash')"), /not authenticated/i);
    await db.exec("reset role");
    await asCaller("20000000-0000-0000-0000-000000000001");
    assert.equal((await db.query("select * from public.verification_sessions")).rows.length, 1);
    await db.query("select public.consume_verification_session('owner-token-hash')");
    await assert.rejects(db.query("select public.consume_verification_session('owner-token-hash')"), /invalid|expired|used/i);
    await db.exec("reset role");
    await db.exec(`insert into public.verification_sessions (user_id, token_hash, expires_at) values
      ('10000000-0000-0000-0000-000000000001', 'expired-token-hash', now() - interval '1 minute');`);
    await asCaller("20000000-0000-0000-0000-000000000001");
    await assert.rejects(db.query("select public.consume_verification_session('expired-token-hash')"), /invalid|expired|used/i);
    await assert.rejects(db.exec(`insert into public.verification_sessions (user_id, token_hash, expires_at) values
      ('10000000-0000-0000-0000-000000000002', 'cross-account-hash', now() + interval '10 minutes')`), /row-level security/i);
    await db.exec("reset role; set role anon");
    await assert.rejects(db.query("select public.consume_verification_session('owner-token-hash')"), /permission denied/i);
  } finally { await db.close(); }
});
