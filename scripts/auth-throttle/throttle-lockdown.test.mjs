import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

// Applies the original throttle migration and the lock-down on top of it, the
// way the hosted database sees them, and checks who may read and who may write.
const original = await readFile(new URL("../../supabase/migrations/20261105144525_auth_attempt_throttle.sql", import.meta.url), "utf8");
const lockdown = await readFile(new URL("../../supabase/migrations/20261106120000_lock_down_auth_throttle.sql", import.meta.url), "utf8");

async function database(t) {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema app_private;
    grant usage on schema public to anon, authenticated, service_role;
  `);
  await db.exec(original);
  await db.exec(lockdown);
  return db;
}

async function as(db, role, work) {
  await db.exec(`set role ${role}`);
  try {
    return await work();
  } finally {
    await db.exec("reset role");
  }
}

const check = (db, purpose, subject) =>
  db.query("select public.auth_throttle('check', $1, $2) as seconds", [purpose, subject]).then((r) => r.rows[0].seconds);
const server = (db, action, purpose, subject) =>
  db.query("select public.auth_throttle_server($1, $2, $3) as seconds", [action, purpose, subject]).then((r) => r.rows[0].seconds);

test("anonymous callers can only check, never record or clear", async (t) => {
  const db = await database(t);
  await as(db, "anon", async () => {
    assert.equal(await check(db, "signin_email_hour", "victim@example.com"), 0);
    await assert.rejects(
      db.query("select public.auth_throttle('fail', 'signin_email_hour', 'victim@example.com')"),
      /Only the server may change throttle counts/,
    );
    await assert.rejects(
      db.query("select public.auth_throttle('clear', 'signin_email_hour', 'victim@example.com')"),
      /Only the server may change throttle counts/,
    );
    await assert.rejects(
      db.query("select public.auth_throttle_server('clear', 'signin_email_hour', 'victim@example.com')"),
      /permission denied/,
    );
  });
});

test("signed-in users cannot write either", async (t) => {
  const db = await database(t);
  await as(db, "authenticated", async () => {
    await assert.rejects(db.query("select public.auth_throttle('fail', 'signup_otp', 'a@b.co')"), /Only the server/);
    await assert.rejects(db.query("select public.auth_throttle_server('fail', 'signup_otp', 'a@b.co')"), /permission denied/);
  });
});

test("the service role records failures and anyone sees the block; clearing lifts it", async (t) => {
  const db = await database(t);
  await as(db, "service_role", async () => {
    for (let i = 0; i < 4; i += 1) assert.equal(await server(db, "fail", "signin_email_ip", "a@b.co|203.0.113.5"), 0);
    assert.ok((await server(db, "fail", "signin_email_ip", "a@b.co|203.0.113.5")) > 0);
  });
  await as(db, "anon", async () => {
    assert.ok((await check(db, "signin_email_ip", "A@B.co|203.0.113.5")) > 0, "case-insensitive subject");
    assert.equal(await check(db, "signin_email_ip", "a@b.co|198.51.100.9"), 0, "another IP is not blocked");
  });
  await as(db, "service_role", async () => {
    await server(db, "clear", "signin_email_ip", "a@b.co|203.0.113.5");
    assert.equal(await check(db, "signin_email_ip", "a@b.co|203.0.113.5"), 0);
  });
});

test("the hourly ceiling blocks at 20 failures and lasts about an hour", async (t) => {
  const db = await database(t);
  await as(db, "service_role", async () => {
    for (let i = 0; i < 19; i += 1) assert.equal(await server(db, "fail", "signin_email_hour", "a@b.co"), 0);
    const blocked = await server(db, "fail", "signin_email_hour", "a@b.co");
    assert.ok(blocked > 900 && blocked <= 3600, `blocked for ${blocked}s`);
  });
});

test("email-change codes have their own window", async (t) => {
  const db = await database(t);
  await as(db, "service_role", async () => {
    for (let i = 0; i < 4; i += 1) await server(db, "fail", "email_change_otp", "user-id");
    assert.ok((await server(db, "fail", "email_change_otp", "user-id")) > 0);
  });
});

test("cleanup of old rows keeps live hourly windows", async (t) => {
  const db = await database(t);
  await as(db, "service_role", async () => {
    await server(db, "fail", "signin_email_hour", "keep@example.com");
  });
  // Pretend that window started 45 minutes ago, then trigger the cleanup with another failure.
  await db.exec("update app_private.auth_throttle set window_started_at = now() - interval '45 minutes'");
  await as(db, "service_role", async () => {
    await server(db, "fail", "signup_otp", "other@example.com");
  });
  const { rows } = await db.query("select count(*)::int as n from app_private.auth_throttle where key like 'signin_email_hour:%'");
  assert.equal(rows[0].n, 1);
});

test("unknown purposes and empty subjects are refused", async (t) => {
  const db = await database(t);
  await as(db, "service_role", async () => {
    await assert.rejects(db.query("select public.auth_throttle_server('fail', 'nope', 'a@b.co')"), /Unknown throttle purpose/);
    await assert.rejects(db.query("select public.auth_throttle_server('fail', 'signup_otp', '  ')"), /Invalid throttle subject/);
  });
});

test("the counter table itself stays closed to clients", async (t) => {
  const db = await database(t);
  await as(db, "anon", async () => {
    await assert.rejects(db.query("select * from app_private.auth_throttle"), /permission denied/);
  });
});
