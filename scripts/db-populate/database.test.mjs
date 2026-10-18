import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { buildPlan, stableId } from "./planner.mjs";
import { operationSql, sqlLiteral, validateConnection } from "../db-populate.mjs";

// Intentionally opt-in: this suite creates and modifies ONLY local test data.
const enabled = process.env.APT_POPULATION_DB_TEST === "1";
const runSql = (sql, fails = false) => {
  const r = spawnSync("psql", ["-XqAt", "--no-password", "--set", "ON_ERROR_STOP=1"], { input: sql, encoding: "utf8", timeout: 120_000, maxBuffer: 32 * 1024 * 1024 });
  if (fails) { assert.notEqual(r.status, 0, "operation should have failed"); return r.stderr; }
  assert.equal(r.status, 0, r.stderr);
  const last = r.stdout.trim().split("\n").filter(Boolean).at(-1);
  return last ? JSON.parse(last) : null;
};
const inventory = () => runSql("begin read only; select demo_population.inventory(); commit;");
const freshCall = (mode, plan, run, preview = false) => `select demo_population.execute('${mode}',${sqlLiteral(JSON.stringify(plan))}::jsonb,(demo_population.inventory()->>'stateHash'),'${run}',${preview});`;

test("real PostgreSQL contract: preview, apply, safety failures, reset and baseline cleanup", { skip: !enabled, timeout: 180_000 }, async (t) => {
  validateConnection(process.env, { local: true }, []);
  assert.match(process.env.PGDATABASE, /^apt_population_test_/);
  const initial = inventory();
  assert.notEqual(initial.run?.status, "applied", "use a freshly bootstrapped or cleaned local fixture database");
  const plan = initial.run?.plan ?? buildPlan(initial, { years: 3, seed: "apt-demo-v1", asOf: "2026-10-17" });
  const run = initial.run?.id ?? stableId(plan.seed, "run");

  await t.test("preview uses a real read-only transaction and changes nothing", () => {
    const before = inventory();
    const result = runSql(operationSql("apply", plan, before.stateHash, run, true));
    assert.equal(result.preview, true);
    assert.equal(inventory().stateHash, before.stateHash);
    assert.equal(runSql("select count(*) from test_support.outbound;"), 0);
  });

  await t.test("a late error rolls back all inserted records and registry writes", () => {
    const before = inventory();
    const invalid = structuredClone(plan);
    invalid.rows.push({ table: "users", data: { id: stableId("test", "bad") } });
    if (before.run) {
      // Kept for repeated local runs: exercise the same late error directly.
      const sql = `begin; select set_config('app.suppress_push_delivery','true',true); select demo_population.insert_plan('${run}',${sqlLiteral(JSON.stringify(invalid))}); commit;`;
      assert.match(runSql(sql, true), /Unexpected population table/);
    } else assert.match(runSql(operationSql("apply", invalid, before.stateHash, run, false), true), /Unexpected population table/);
    assert.equal(inventory().stateHash, before.stateHash);
    assert.equal(runSql("select count(*) from test_support.outbound;"), 0);
  });

  await t.test("apply keeps identities, ownership, existing data and outbound services untouched", () => {
    const before = inventory();
    const result = runSql(operationSql("apply", plan, before.stateHash, run, false));
    assert.equal(result.status, "applied");
    const after = inventory();
    assert.deepEqual(after.tables.users, initial.tables.users);
    assert.deepEqual(after.storage, initial.storage);
    const immutable = (a) => Object.fromEntries(Object.entries(a).filter(([key]) => !["status", "no_favorites", "no_ratings", "average_rating", "updated_at"].includes(key)));
    assert.deepEqual(after.tables.apartments.map(immutable), initial.tables.apartments.map(immutable));
    assert.equal(after.tables.apartments.length, initial.tables.apartments.length);
    for (const [table, original] of Object.entries(initial.tables)) {
      if (table === "apartments") continue;
      for (const row of original) assert.ok(after.tables[table].some((r) => JSON.stringify(r) === JSON.stringify(row)), `${table}: original row must be preserved`);
    }
    assert.equal(runSql("select count(*) from test_support.outbound;"), 0);
    assert.ok(after.tables.notifications.some((n) => n.created_at.startsWith("2023") && n.is_read));
  });

  await t.test("identical apply is a zero-write no-op and verify is read-only", () => {
    const before = inventory();
    runSql(operationSql("apply", plan, before.stateHash, run, false));
    assert.equal(inventory().stateHash, before.stateHash);
    runSql(operationSql("verify", plan, before.stateHash, run, true));
    assert.equal(inventory().stateHash, before.stateHash);
  });

  await t.test("the actual CLI requires confirmation and a fresh preview receipt", () => {
    const before = inventory();
    const cli = (...args) => spawnSync(process.execPath, ["--experimental-strip-types", "--import", fileURLToPath(new URL("./register.mjs", import.meta.url)), fileURLToPath(new URL("../db-populate.mjs", import.meta.url)), "--local", ...args], { encoding: "utf8", timeout: 30_000 });
    const preview = cli("--dry-run");
    assert.equal(preview.status, 0, preview.stderr);
    const token = JSON.parse(preview.stdout).previewToken;
    for (const args of [["--apply"], ["--apply", "--confirm-project", "local"], ["--apply", "--confirm-project", "local", "--expect-preview", "stale"]]) assert.notEqual(cli(...args).status, 0);
    const applied = cli("--apply", "--confirm-project", "local", "--expect-preview", token);
    assert.equal(applied.status, 0, applied.stderr);
    assert.equal(JSON.parse(applied.stdout).status, "applied");
    assert.equal(inventory().stateHash, before.stateHash);
  });

  await t.test("stale preview, second dataset and a new trigger are rejected", () => {
    const before = inventory();
    assert.match(runSql(operationSql("apply", plan, "old-state", run, false), true), /Database changed since preview/);
    assert.match(runSql(operationSql("apply", { ...plan, seed: "other" }, before.stateHash, run, false), true), /Dataset options or plan changed/);
    const changed = "begin; create function public.test_population_trigger() returns trigger language plpgsql as $$begin return new; end$$; create trigger test_population_trigger before insert on public.chat for each row execute function public.test_population_trigger(); select demo_population.audit(); commit;";
    assert.match(runSql(changed, true), /Unreviewed, changed or disabled triggers/);
    assert.equal(inventory().stateHash, before.stateHash);
  });

  await t.test("ordinary API roles cannot access operator functions or registry", () => {
    for (const role of ["anon", "authenticated", "service_role"]) {
      assert.match(runSql(`begin; set local role ${role}; select demo_population.inventory(); commit;`, true), /permission denied/);
      assert.match(runSql(`begin; set local role ${role}; select * from demo_population.runs; commit;`, true), /permission denied/);
    }
  });

  await t.test("reading/editing generated records blocks reset and cleanup without losing the edit", () => {
    const before = inventory();
    const notification = before.tables.notifications.find((n) => n.is_read);
    for (const mode of ["reset", "cleanup"]) {
      const sql = `begin; update public.notifications set is_read=false where id='${notification.id}'; ${freshCall(mode, plan, run)} commit;`;
      assert.match(runSql(sql, true), /Tracked demo data was changed or removed/);
    }
    assert.equal(inventory().stateHash, before.stateHash);
  });

  await t.test("new replies, conversation preferences and stored lease paths block cleanup", () => {
    const before = inventory();
    const chat = before.tables.chat[0];
    const tenancy = before.tables.tenancies[0];
    const setups = [
      `select set_config('app.suppress_push_delivery','true',true); insert into public.chat(sender_id,receiver_id,apartment_id,message,message_type,reply_to) values('${chat.sender_id}','${chat.receiver_id}','${chat.apartment_id}','New user reply','text','${chat.id}');`,
      `insert into public.conversation_preferences(user_id,other_user_id,apartment_id) values('${chat.sender_id}','${chat.receiver_id}','${chat.apartment_id}');`,
      `insert into storage.objects(bucket_id,name) values('signed-leases','${tenancy.id}/new-contract.pdf');`,
    ];
    for (const setup of setups) {
      const error = runSql(`begin; ${setup} ${freshCall("cleanup", plan, run)} commit;`, true);
      assert.match(error, /depends on generated|depend on generated|must be preserved/);
    }
    assert.equal(inventory().stateHash, before.stateHash);
  });

  await t.test("new maintenance without a tenancy FK cannot be stranded by cleanup", () => {
    const before = inventory();
    const generatedIds = new Set(plan.rows.filter((r) => r.table === "tenancies").map((r) => r.data.id));
    const tenancy = before.tables.tenancies.find((r) => r.status === "active" && generatedIds.has(r.id));
    const setup = `select set_config('app.suppress_push_delivery','true',true); insert into public.maintenance_request(tenant_id,apartment_id,landlord_id,title,category,message,urgency) values('${tenancy.tenant_id}','${tenancy.apartment_id}','${tenancy.landlord_id}','New tenant work','general_wear_and_tear','Keep this newer work','low');`;
    assert.match(runSql(`begin; ${setup} ${freshCall("cleanup", plan, run)} commit;`, true), /depends on a generated rental/);
    assert.equal(inventory().stateHash, before.stateHash);
  });

  await t.test("document suppression never suppresses normal untracked application deletions", () => {
    const before = inventory();
    const data = { ...plan.rows.find((r) => r.table === "rental_application").data, id: stableId("test", "untracked-application"), status: "rejected" };
    const keys = Object.keys(data).sort().map((k) => `"${k}"`).join(",");
    const result = runSql(`begin; select set_config('app.suppress_push_delivery','true',true); select set_config('app.demo_population_cleanup','true',true); select set_config('app.demo_population_run','${run}',true); insert into public.rental_application(${keys}) select ${keys} from jsonb_populate_record(null::public.rental_application,${sqlLiteral(JSON.stringify(data))}); delete from public.rental_application where id='${data.id}'; select count(*) from test_support.outbound; rollback;`);
    assert.equal(result, 1, "normal deletion must still request its normal document cleanup");
    assert.equal(inventory().stateHash, before.stateHash);
    assert.equal(runSql("select count(*) from test_support.outbound;"), 0);
  });

  await t.test("future cross-schema FK tables fail closed instead of being cascaded away", () => {
    const before = inventory();
    assert.match(runSql("begin; create table test_support.future_dependency(tenancy_id uuid references public.tenancies(id) on delete cascade); select demo_population.audit(); commit;", true), /cross-schema dependencies/);
    assert.equal(inventory().stateHash, before.stateHash);
  });

  await t.test("reset is atomic if account eligibility changes after the original population", () => {
    const before = inventory();
    const tenant = before.tables.tenancies[0].tenant_id;
    const error = runSql(`begin; update public.users set is_suspended=true where id='${tenant}'; ${freshCall("reset", plan, run)} commit;`, true);
    assert.match(error, /eligibility changed/);
    assert.equal(inventory().stateHash, before.stateHash);
  });

  await t.test("reset refuses missing underlying Passport files without losing populated data", () => {
    const before = inventory();
    const application = plan.rows.find((r) => r.table === "rental_application").data;
    const error = runSql(`begin; delete from storage.objects where bucket_id='application-documents' and name=${sqlLiteral(application.proof_of_billing_url)}; ${freshCall("reset", plan, run)} commit;`, true);
    assert.match(error, /document file is no longer present/);
    assert.equal(inventory().stateHash, before.stateHash);
  });

  await t.test("simultaneous population operations cannot race", async () => {
    const child = spawn("psql", ["-XqAt", "--no-password", "--set", "ON_ERROR_STOP=1"], { stdio: ["pipe", "pipe", "pipe"] });
    const ready = new Promise((resolve, reject) => {
      child.stdout.on("data", (chunk) => { if (chunk.toString().includes("locked")) resolve(); });
      child.once("error", reject);
      child.once("exit", () => reject(new Error("Lock holder exited too early")));
    });
    child.stdin.write("begin; select pg_advisory_xact_lock(17102026,1); select 'locked';\n");
    try {
      await ready;
      const before = inventory();
      assert.match(runSql(operationSql("apply", plan, before.stateHash, run, false), true), /Another population operation is running/);
    } finally {
      const closed = once(child, "exit");
      child.stdin.end("rollback;\n\\q\n");
      await closed;
    }
  });

  await t.test("ordinary application write locks stop population before any writes", async () => {
    const before = inventory();
    const child = spawn("psql", ["-XqAt", "--no-password", "--set", "ON_ERROR_STOP=1"], { stdio: ["pipe", "pipe", "pipe"] });
    const ready = new Promise((resolve, reject) => {
      child.stdout.on("data", (chunk) => { if (chunk.toString().includes("locked")) resolve(); });
      child.once("error", reject);
      child.once("exit", () => reject(new Error("Application lock holder exited too early")));
    });
    child.stdin.write("begin; lock table public.chat in row exclusive mode; select 'locked';\n");
    try {
      await ready;
      assert.match(runSql(operationSql("apply", plan, before.stateHash, run, false), true), /lock timeout/);
      assert.equal(inventory().stateHash, before.stateHash);
    } finally {
      const closed = once(child, "exit");
      child.stdin.end("rollback;\n\\q\n");
      await closed;
    }
  });

  await t.test("reset exactly reproduces populated rows, IDs, dates and totals", () => {
    const before = inventory();
    runSql(operationSql("reset", plan, before.stateHash, run, false));
    assert.deepEqual(inventory().tables, before.tables);
    assert.equal(runSql("select count(*) from test_support.outbound;"), 0);
  });

  await t.test("cleanup restores the exact baseline and never calls document deletion", () => {
    const before = inventory();
    const result = runSql(operationSql("cleanup", plan, before.stateHash, run, false));
    assert.equal(result.status, "cleaned");
    const after = inventory();
    assert.deepEqual(after.tables, initial.tables);
    assert.deepEqual(after.storage, initial.storage);
    assert.equal(runSql("select count(*) from test_support.outbound;"), 0);
  });

  await t.test("reapply/cleanup after unrelated newer activity preserves the newer row", () => {
    const before = inventory();
    const id = stableId("test", "unrelated-notification");
    const user = before.tables.users[0].id;
    runSql(`begin; insert into public.notifications(id,user_id,type,title,message,data) values('${id}','${user}','system','Unrelated newer demo notice','Keep this notice','{}'); commit; select to_json(true);`);
    const changed = inventory();
    runSql(operationSql("apply", plan, changed.stateHash, run, false));
    const reapplied = inventory();
    runSql(operationSql("cleanup", plan, reapplied.stateHash, run, false));
    assert.deepEqual(inventory().tables, changed.tables);
    // Test-only teardown of the untracked fixture row, never product cleanup.
    runSql(`delete from public.notifications where id='${id}'; select to_json(true);`);
    assert.deepEqual(inventory().tables, initial.tables);
  });
});
