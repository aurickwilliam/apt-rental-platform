import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildPlan, DEFAULT_SEED, manilaToday, MAX_PLAN_ROWS, previewToken, stableId, validateOptions } from "./db-populate/planner.mjs";
import { buildFinancePlan } from "./db-populate/finance-planner.mjs";

const HELP = `Safe APT demo population (Node 22.17+, psql 17+)

  pnpm db:populate --dry-run
  pnpm db:populate --apply --expect-preview <token> --confirm-project <ref>
  pnpm db:populate --reset --run <id> --dry-run
  pnpm db:populate --reset --run <id> --apply --expect-preview <token> --confirm-project <ref>
  pnpm db:populate --cleanup --run <id> --dry-run
  pnpm db:populate --cleanup --run <id> --apply --expect-preview <token> --confirm-project <ref>
  pnpm db:populate --verify --run <id>
  pnpm db:populate --finance --run <id> --dry-run
  pnpm db:populate --finance --run <id> --apply --expect-preview <token> --confirm-project <ref>
  pnpm db:populate --finance --reset|--cleanup|--verify --run <id> [--dry-run]

Options: --years 1..3 (default 3), --seed <name>, --as-of YYYY-MM-DD
         --local (explicit loopback PostgreSQL; confirm-project must be local)

Connect using PGHOST, PGPORT, PGUSER, PGDATABASE and .pgpass/PGPASSFILE.
Remote connections require PGSSLMODE=verify-full and an appropriate root CA.
No passwords/connection URLs are accepted as command arguments. Never use the
Supabase CLI link as a target. Install the reviewed population migration first.
Reset/cleanup preview by default; only --apply writes. No --force option.
`;

export function parseArgs(args) {
  const options = {};
  const booleans = new Set(["apply", "dry-run", "reset", "cleanup", "verify", "local", "help", "finance"]);
  const values = new Set(["years", "seed", "as-of", "expect-preview", "confirm-project", "run"]);
  for (let i = 0; i < args.length; i++) {
    const key = args[i].replace(/^--/, "");
    if (!args[i].startsWith("--") || (!booleans.has(key) && !values.has(key)) || Object.hasOwn(options, key)) throw new Error("Unknown or repeated argument. Use --help.");
    if (booleans.has(key)) options[key] = true;
    else {
      if (!args[i + 1] || args[i + 1].startsWith("--")) throw new Error(`Missing --${key} value.`);
      options[key] = args[++i];
    }
  }
  if ([options.reset, options.cleanup, options.verify].filter(Boolean).length > 1 || (options.apply && options["dry-run"]) || (options.verify && options.apply)) throw new Error("Conflicting operation flags.");
  if ((options.reset || options.cleanup || options.verify || options.finance) && !/^[0-9a-f-]{36}$/.test(options.run ?? "")) throw new Error("Finance, reset, cleanup and verify require --run <recorded-id>.");
  return options;
}

export function validateConnection(env, options, appUrls) {
  // PG service files may hide a different host or user. Explicit environment
  // scope is intentional; passwords may still come from .pgpass/PGPASSFILE.
  if (env.PGSERVICE || env.PGSERVICEFILE || env.PGHOSTADDR || env.PGOPTIONS) throw new Error("Use explicit PGHOST/PGUSER/PGDATABASE, without PGSERVICE, PGHOSTADDR or PGOPTIONS.");
  if (!env.PGHOST || !env.PGUSER || !env.PGDATABASE) throw new Error("Set PGHOST, PGUSER and PGDATABASE for an operator connection. See docs/demo-population.md.");
  const local = ["localhost", "127.0.0.1", "::1"].includes(env.PGHOST);
  if (options.local) {
    if (!local || env.PGUSER !== "postgres") throw new Error("--local requires an explicit loopback host and postgres user.");
    return "local";
  }
  if (local) throw new Error("Loopback databases require --local.");
  if (appUrls.length !== 2 || appUrls[0] !== appUrls[1]) throw new Error("Web and mobile public Supabase URLs are missing or disagree.");
  const url = new URL(appUrls[0]);
  const match = /^([a-z]{20})\.supabase\.co$/.exec(url.hostname);
  if (!match || url.protocol !== "https:") throw new Error("Unsupported public Supabase URL.");
  const ref = match[1];
  const direct = env.PGHOST === `db.${ref}.supabase.co` && env.PGUSER === "postgres";
  const sessionPooler = /^[a-z0-9-]+(?:\.[a-z0-9-]+)?\.pooler\.supabase\.com$/.test(env.PGHOST) && env.PGUSER === `postgres.${ref}` && String(env.PGPORT ?? "5432") === "5432";
  if (!direct && !sessionPooler) throw new Error("Postgres connection does not match the apps' Supabase project (session pooler only, not transaction mode).");
  if (env.PGDATABASE !== "postgres" || String(env.PGPORT ?? "5432") !== "5432") throw new Error("Remote population requires the project's postgres database on session port 5432.");
  if (env.PGSSLMODE !== "verify-full") throw new Error("Remote operator connections require PGSSLMODE=verify-full.");
  return ref;
}

function publicUrls() {
  return [["apps/web/.env.local", "NEXT_PUBLIC_SUPABASE_URL"], ["apps/mobile/.env", "EXPO_PUBLIC_SUPABASE_URL"]].map(([path, key]) => {
    if (process.env[key]) return process.env[key];
    try {
      const text = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
      return text.match(new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=\\s*["']?(https://[a-z]+\\.supabase\\.co)/?["']?\\s*$`, "m"))?.[1];
    } catch { return undefined; }
  });
}

export const sqlLiteral = (value) => `'${String(value).replaceAll("'", "''")}'`;

function query(sql) {
  // Neither SQL/PII nor credentials appear in process arguments or error logs.
  const result = spawnSync("psql", ["-X", "-qAt", "--no-password", "--set", "ON_ERROR_STOP=1", "--set", "VERBOSITY=sqlstate"], {
    input: sql, encoding: "utf8", maxBuffer: 32 * 1024 * 1024,
    timeout: 120_000, env: { ...process.env, PGAPPNAME: "apt-demo-population", PGCONNECT_TIMEOUT: "10", LC_ALL: "C" },
  });
  if (result.error?.code === "ENOENT") throw new Error("psql is not installed. Install PostgreSQL client tools first.");
  if (result.status !== 0 || result.error) {
    const state = result.stderr?.match(/ERROR:\s+([A-Z0-9]{5})\b/)?.[1];
    const reasons = {
      AP001: "A direct postgres operator session without an Auth JWT is required.",
      AP002: "Application triggers changed or are not audited. Review the migration's safety audit before proceeding.",
      AP003: "Another population operation is running.",
      AP004: "The database changed since preview. Generate and review a fresh preview.",
      AP005: "Generated records or patched apartments were edited/removed. Reset/cleanup refused to preserve that work.",
      AP006: "New activity or stored files depend on generated data. Reset/cleanup refused to preserve that work.",
      AP007: "The recorded run or dataset options do not match. Use the original saved run.",
      AP008: "An account or listing is no longer eligible. The entire operation was rolled back.",
      AP009: "Finance data, reviews or dependencies conflict with this operation. Existing work was preserved.",
      "23505": "A generated ID or unique relationship conflicts with existing data. Nothing was overwritten.",
      "55P03": "The database is busy. No lock could be obtained within three seconds.",
      "42883": "A required database function is missing. Install/review the population migration first.",
      "3F000": "The population schema is missing. Install the reviewed migration first.",
    };
    throw new Error(`${reasons[state] ?? "Database operation failed. Check connectivity, migration installation and integrity checks."}${state ? ` (SQLSTATE ${state})` : ""} No automatic retry was made. Use preview/verify to resolve an uncertain outcome; SQL and private records are intentionally not logged.`);
  }
  const lines = result.stdout.trim().split("\n").filter(Boolean);
  try { return JSON.parse(lines.at(-1)); }
  catch { throw new Error("Unexpected database response; inspect connection/migration configuration without printing private records."); }
}

export function operationSql(mode, plan, stateHash, runId, preview, financeOnly = false) {
  return `begin${preview || mode === "verify" ? " read only" : ""};
set local lock_timeout = '3s';
set local statement_timeout = '60s';
set local timezone = 'Asia/Manila';
select demo_population.${financeOnly ? "execute_finance" : "execute"}(${sqlLiteral(mode)},${sqlLiteral(JSON.stringify(plan))}::jsonb,${sqlLiteral(stateHash)},${sqlLiteral(runId)}::uuid,${preview});
commit;`;
}

export function selectPlan(inventory, config, financeOnly = false) {
  if (financeOnly) {
    if (inventory.run?.status !== "applied") throw new Error("A finance extension requires an applied rental run.");
    return inventory.financeRun?.plan ?? buildFinancePlan(inventory, config);
  }
  // Existing rental plans remain byte-for-byte unchanged. New populations save
  // finance as an independent component and apply both in one SQL transaction.
  if (inventory.run) return inventory.run.plan;
  const plan = { ...buildPlan(inventory, config), finance: buildFinancePlan(inventory, config) };
  if (plan.rows.length + plan.finance.rows.length > MAX_PLAN_ROWS) throw new Error("Combined population exceeds the 5,000-row safety limit.");
  return plan;
}

export function main(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  if (options.help) { console.log(HELP); return; }
  const target = validateConnection(process.env, options, publicUrls());
  if (options.apply && options["confirm-project"] !== target) throw new Error("Writing requires --confirm-project matching the verified connection target.");
  const inventory = query("begin read only isolation level repeatable read; set local statement_timeout = '30s'; set local timezone = 'Asia/Manila'; select demo_population.inventory(); commit;");
  const config = {
    seed: options.seed ?? inventory.run?.plan.seed ?? DEFAULT_SEED,
    years: Number(options.years ?? inventory.run?.plan.years ?? 3),
    asOf: options["as-of"] ?? inventory.run?.plan.asOf ?? manilaToday(),
  };
  validateOptions(config);
  if (inventory.run && ["seed", "years", "asOf"].some((key) => config[key] !== inventory.run.plan[key])) throw new Error("A baseline is already recorded. Use its original seed, years and date; do not create another dataset.");
  const mode = options.reset ? "reset" : options.cleanup ? "cleanup" : options.verify ? "verify" : "apply";
  const plan = selectPlan(inventory, config, options.finance);
  const runId = inventory.run?.id ?? stableId(config.seed, "run");
  if (options.run && options.run !== runId) throw new Error("Run ID does not match the recorded baseline.");
  const token = previewToken(inventory.stateHash, options.finance ? `finance:${mode}` : mode, plan);
  if (options.apply && options["expect-preview"] !== token) throw new Error("A matching reviewed preview token is required. Run the same operation with --dry-run and review its fresh token.");
  const result = query(operationSql(mode, plan, inventory.stateHash, runId, !options.apply, options.finance));
  console.log(JSON.stringify({ target, ...result, asOf: plan.asOf, years: plan.years, seed: plan.seed,
    ...(options.apply || mode === "verify" ? {} : { previewToken: token }),
    note: "Simulated history may predate account/listing creation. No identities, listings, provider transactions or files are created. Reset/cleanup refuse changed or dependent records."
  }, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
