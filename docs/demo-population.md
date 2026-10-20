# Safe demo population

`pnpm db:populate` fills existing demo accounts and listings with connected rental journeys and landlord expense/budget examples. It never creates users or apartments, changes ownership/roles/verification, uploads files, or contacts PayMongo. This is an **operator tool for demo data**, not an application endpoint or a production anonymization tool.

All accounts in the approved target are demo accounts. Activity may span three simulated years even though the accounts/listings/documents were created more recently. Their original timestamps are unchanged. No real lease, payment-provider transaction, or document authenticity is implied. Synthetic payments use `DEMO-` references and empty provider IDs.

## What each operation does

| Operation | Result |
| --- | --- |
| Preview (default / `--dry-run`) | Read-only counts, skipped-scenario reasons, run ID and a preview token. |
| `--apply` | Add the reviewed dataset. Repeating an applied run is a zero-write no-op. |
| `--reset --apply` | Atomically remove and replay the same generated rows, IDs, dates and totals. |
| `--cleanup --apply` | Remove tracked generated rows and restore the original apartment fields changed by the run. |
| `--verify --run <id>` | Read-only integrity and tracked-record checks. |

Reset and cleanup **preview by default**; only `--apply` writes. Every write requires `--confirm-project` and a matching `--expect-preview` token from that operation's preview. There is no force/overwrite option.

“Return to today's version” means restoring the baseline captured before population, not truncating the database or erasing unrelated later work. The registry is not a full database backup. Obtain and verify a separate Supabase backup before the first hosted apply.

## One-time setup

1. Review `supabase/migrations/20261017075357_safe_demo_population.sql`. Deploy it to the **apps' actual demo project** only after deployment approval. Do not blindly run `supabase db push`: this repository's CLI link may target a different project, and other pending migrations may exist.
   Finance also requires `supabase/migrations/20261019041228_demo_population_finance_extension.sql`. This migration installs private tracking/functions only; it does not populate any account.
2. Keep `demo_population` out of Supabase's exposed schemas. Its registry, saved plan, before/after records and all helper functions are private, RLS-enabled where applicable, and unavailable to `anon`, `authenticated` and `service_role`. Only a direct `postgres` operator session without an Auth JWT can run the tool.
3. Install Node 22.17+ and PostgreSQL client tools (`psql` 17+).
4. Configure standard PostgreSQL environment variables. Use `.pgpass` or `PGPASSFILE` for the password; never put credentials in arguments or client `.env` files.

```bash
export PGHOST=db.<apps-project-ref>.supabase.co
export PGPORT=5432
export PGUSER=postgres
export PGDATABASE=postgres
export PGSSLMODE=verify-full
export PGSSLROOTCERT=/protected/path/to/supabase-root-ca.crt
export PGPASSFILE=/protected/path/to/pgpass
```

The session pooler on port 5432 is also supported with its dashboard-provided host and `postgres.<apps-project-ref>` username. Transaction pooling is not supported. `PGSERVICE`, `PGHOSTADDR` and `PGOPTIONS` are rejected because they can obscure/override the checked connection scope. Never paste credentials into chat or commit them.

Both apps' public Supabase URLs must agree with the remote host/user. The CLI reads `NEXT_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL` from the environment, otherwise from `apps/web/.env.local` / `apps/mobile/.env`. It never uses the Supabase CLI project link. For explicit loopback testing, add `--local` and confirm `local` instead of a project ref.

## Populate

Choose a fixed date in Manila (not in the future), and keep it the same between preview and apply:

```bash
pnpm db:populate --dry-run --years 3 --seed apt-demo-v1 --as-of YYYY-MM-DD

pnpm db:populate --apply --years 3 --seed apt-demo-v1 --as-of YYYY-MM-DD \
  --expect-preview <preview-token> --confirm-project <apps-project-ref>
```

Review the counts and skipped reasons first. Copy the returned run ID. Once recorded, the seed, years and date are frozen and can be omitted from later commands. Different options cannot silently add another dataset. After cleanup, `--apply` replays that same saved dataset; it does not invent a new baseline date.

The generator balances previous rentals across existing owners, preserves current rentals/reservations, and aims for four active renters total while leaving verified browsers. Exact totals are capacity-dependent. Landlords with no listings cannot receive property transactions without changing ownership or adding listings, which this tool does not do.

Unverified tenants get browsing/inquiry activity only. Applications reuse actual usable, owner-matched Passport documents; missing/expired/rejected/missing-file documents are skipped, never fabricated. Historical operator-imported rentals can exist without an invented application. Deleted/hidden units, suspended users, admin-only profiles, blocked conversations and self-transactions are excluded. Existing conversation threads/preferences are left alone.

Rent follows the shared calendar-month/due-day rules, including leap years and month-end clamping. Earlier months are settled, with current-month pending cash confirmations where the due day is ahead. Maintenance and visits use real supported statuses. Reviews are tied to eligible ended stays. There are no fabricated attachment paths or signed leases.

## Landlord expenses and budget plans

Fresh populations automatically include an independently tracked finance component in the same atomic operation. It covers **every eligible landlord**, not a named account or just owners selected for rental journeys. This includes mixed admin/landlord profiles and unverified landlords; neither admin nor account verification substitutes for landlord membership. Suspended owners, hidden/deleted listings and owners without usable properties are excluded. No tenants or Passport documents are needed for finance.

The finance generator selects up to two usable properties per owner and the six calendar months ending in the frozen `asOf` month. It looks beyond fully protected properties for another safe listing. Each populated property-month has:

- Two paid expense examples and matching spending limits, demonstrating both under-budget and over-budget spending.
- Separate operating costs and periodic capital improvements; neither reserves nor unpaid rent become expenses.
- Insurance and emergency reserve plans with targets and monthly suggestions based on shared application rules. These are allocations only, not transferred or saved money.

Amounts are **illustrative synthetic demo entries**, not market estimates or actual bills. Expense descriptions start with `Demo scenario:`. All expense dates are at or before `asOf`; budgets use month-start dates. Finance uses its own versioned ID namespace without changing existing rental IDs. The combined rental and finance plan must stay within the existing 5,000-source-row limit.

Existing property-months with expenses or review confirmations are skipped intact. A conflicting existing budget also skips that property-month, including a zero-peso budget. Nothing is upserted or overwritten. Finance month confirmations are **not seeded**: operating income remains uncalculated until the landlord explicitly reviews expenses in the app. Preview reports counts, landlords covered, and skip reasons without account names or private rows.

### Extend an existing rental run without resetting it

For an already populated demo, add finance explicitly:

```bash
pnpm db:populate --finance --run <run-id> --dry-run
pnpm db:populate --finance --run <run-id> --apply \
  --expect-preview <finance-preview-token> --confirm-project <apps-project-ref>
pnpm db:populate --finance --verify --run <run-id>
```

The parent rental run must be applied. The extension uses its **original seed, years and asOf date**, not today's date, and never rebuilds or rewrites its rental plan or registry. Thus it can add finance even if rental notifications/messages have since been read or listings edited, provided the current finance scope is eligible. This does **not** accept those rental edits as a new baseline: full-run verification/reset/cleanup retain their original refusal rules. A normal `--apply` on an old rental-only run does not add finance silently.

The separate, private `finance_runs` and `finance_changes` records freeze the first applied finance plan and its exact after-images. Repeating apply is a zero-write no-op. Cleanup/reapply and reset replay the saved rows, IDs, dates and amounts; they do not generate a fresh plan around later edits. A different finance plan/version cannot silently replace it. Empty extensions are saved with skip reasons rather than granting permission to add a different dataset later.

Finance-only reset and cleanup follow the same preview/confirmation process:

```bash
pnpm db:populate --finance --reset --run <run-id> --dry-run
pnpm db:populate --finance --reset --run <run-id> --apply \
  --expect-preview <finance-reset-token> --confirm-project <apps-project-ref>
pnpm db:populate --finance --cleanup --run <run-id> --dry-run
pnpm db:populate --finance --cleanup --run <run-id> --apply \
  --expect-preview <finance-cleanup-token> --confirm-project <apps-project-ref>
```

These operations touch only tracked finance inserts and preserve all other public rows. Edited/missing finance rows, new dependent rows/files, or a later expense review for a generated expense month block cleanup/reset. Deleting an expense normally invalidates its month's review, so the importer refuses rather than remove that confirmation. New manual expenses in a generated month also prevent reset/replay from inserting into that now-manual month. Unrelated newer finance work is preserved.

Full-run reset/cleanup coordinate both components in one transaction, handling finance first; any failure rolls back both. Finance-only preview tokens cannot authorize rental operations. Nothing loosens the operator-only connection, locks, trigger audit or private-schema permissions. Do not manually alter registries or use a blanket reset to get around refusals.

## Verify, reset or clean up

```bash
pnpm db:populate --verify --run <run-id>

pnpm db:populate --reset --run <run-id> --dry-run
pnpm db:populate --reset --run <run-id> --apply \
  --expect-preview <reset-preview-token> --confirm-project <apps-project-ref>

pnpm db:populate --cleanup --run <run-id> --dry-run
pnpm db:populate --cleanup --run <run-id> --apply \
  --expect-preview <cleanup-preview-token> --confirm-project <apps-project-ref>
```

**Opening notifications/messages can change generated records.** Reset/cleanup refuse any changed/missing tracked row, including read state, lease attachments, or apartment edits. They also refuse newer replies, preferences, payments/reminders, files and other dependent activity. This is intentional: preserve newer work rather than guess how to discard it. Do not manually delete registry entries or use a database-wide reset to bypass the refusal. Resolve dependencies individually with an operator, or use a separately approved backup restoration in an isolated copy.

Unrelated newer activity is preserved. Cleanup restores only tracked apartment occupancy/counter/rating/timestamp fields, and never profile, pricing, identity, ownership or storage data. The saved plan and audit records remain private after cleanup.

## Safety and operational limits

- Preview/verify use real read-only transactions, not trial inserts followed by rollback.
- Writes recheck the database/schema fingerprint after obtaining an advisory lock and short write-blocking table locks. A changed database invalidates the preview. Use a quiet demo maintenance window; app writes may briefly wait. Lock timeout: 3 seconds; statement timeout: 60 seconds.
- One transaction commits the dataset and its registry, or rolls everything back. Do not blindly retry an interrupted connection: preview/verify first to resolve an uncertain commit.
- Existing integrity/security triggers remain enabled. Their reviewed function hashes are checked; unknown, disabled or changed triggers stop the command. Changes to app trigger bodies require reviewing the audit list, not bypassing it.
- Final approved applications are imported without an UPDATE-to-approved transition. This avoids automatically creating extra tenancies or cancelling existing applications/visits.
- Existing operator-only push suppression remains transaction-scoped. Trigger-created feed notifications receive deterministic IDs and historical dates/read states. Cleanup's document-delete suppression applies only to tracked demo applications in the active operator cleanup run. Reused Passport files are never removed.
- Source snapshots are capped at 20,000 public rows and 20,000 storage objects; plans at 5,000 generated source rows. Larger datasets need a separately reviewed approach, not an increased flag.
- Errors show safe reason codes, not SQL, passwords, private document paths, messages or profile data. The saved plan/baseline contain private data and belong only in the private database schema, never logs or source control.
- Realtime subscribers may observe committed demo activity. No push requests are made by the operation. Later normal user actions and scheduled reminders are **not globally disabled**; they can create dependencies that correctly block cleanup.

## Tests

```bash
pnpm db:populate:test
```

CI runs the deterministic generator/CLI tests. The PostgreSQL suite is opt-in and requires a disposable loopback database named `apt_population_test_*`.

To reproduce the actual schema/trigger contract without copying real account data:

1. On a reviewed operator connection to the intended source, use the read-only `scripts/db-populate/export-schema.sql` to save schema-only JSON outside the repository:
   `psql -XqAt --set ON_ERROR_STOP=1 -f scripts/db-populate/export-schema.sql > /protected/schema.json`.
2. Switch all PG variables to a fresh **local** empty `apt_population_test_*` database with user `postgres`. Unset remote-only variables such as `PGSSLMODE` as appropriate for the local test server.
3. Bootstrap synthetic fixtures and the migration:
   `node --experimental-strip-types --import ./scripts/db-populate/register.mjs scripts/db-populate/bootstrap-test.mjs /protected/schema.json`.
4. Run `APT_POPULATION_DB_TEST=1 pnpm db:populate:test`.

The fixture uses the actual exported table constraints and trigger bodies. Network calls are captured locally and asserted absent; no HTTP requests occur. It supplies Auth/storage metadata boundaries and a geometry declaration only: PostGIS location editing, real Storage downloads, hosted Realtime and rendered mobile/web screens are outside this SQL contract test. The command never edits locations. Do not commit the schema export or any data/credential dump.
