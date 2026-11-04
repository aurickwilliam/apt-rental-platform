# Tenant rental management and maintenance authorization

## Release status: LOCAL ONLY — hold production release

The UI and migration are implemented locally. The new guard is **not applied
to the hosted database**, so the existing production maintenance authorization
gap remains until a separately approved database release.

No production application, visit, maintenance request, tenancy, payment,
notification or schema was changed while implementing/testing this work.
Hosted inspection used read-only catalog queries and aggregate counts only.

## Existing architecture and the discoverability problem

- `/tenant/my-rental` uses a request-owned rental seed, `useTenancy` and
  `fetchActiveTenancyWith`. Billing and payment history load separately and
  remain authoritative; none of their calculations changed.
- With no active tenancy, My Rental displays `ApplicationsList` through
  `RentalApplications`. `/tenant/applications` redirects there. Active tenants
  keep their existing Application History entry.
- Maintenance already existed at `/tenant/maintenance`, in the sidebar,
  a generic Quick actions tile and a lower dashboard summary. There was no
  prominent repair-specific action next to the current apartment, and the
  request form preceded history without a direct history anchor.
- Maintenance uses `maintenance_request`, not a separate repair system.
  Rows carry `tenant_id`, `apartment_id`, `landlord_id` and `tenancy_id`.
  The existing fee trigger binds legacy inserts to a tenancy; fees and payment
  calculations are unchanged.
- Tenant reads/writes use the cookie/browser-bound client and internal profile
  ID. Landlords keep the same maintenance queue, private attachments,
  resolution notes, status updates and server notifications.
- Application details reuse the existing caller-scoped application, personal
  info, document resolver and visit reads. Existing visit statuses/history,
  reschedule handling and `visit_request_one_active_per_application` remain.

## New entry points and eligibility

`MaintenanceEntryCard` sits immediately after the current rental hero, before
financial content: “Need a repair?”, Request maintenance and View requests.
Both go to the existing Maintenance page, with an opaque tenancy ID and
`#new-request` or `#requests`. No draft, user identity or sensitive form value
is added to the URL. The page validates selection against its caller-owned
rentals; an arbitrary ID cannot select someone else's apartment.

Maintenance loads its own nonfinancial rental choices once, using the same
projection as the existing active-rental query. One eligible tenancy is
selected automatically only when no explicit selection was supplied. With
multiple eligible rentals, the tenant chooses; an invalid selection also offers
a choice rather than using the wrong rental. At most 50 choices are accepted;
an overflow errors explicitly rather than silently truncating the choice.

Eligibility is the app's existing active-tenancy definition: status `active`.
It deliberately does not add a lease-date window, so a future-start or a
passed-end row that is still `active` behaves as before. Pending or approved
applications do not grant eligibility. The shared web helper is presentation
only; submission re-reads the chosen caller/apartment/tenancy before any
upload, and the database guard is final authority.

My Rental's pre-existing single-active-tenancy dashboard still refuses an
ambiguous `maybeSingle()` result instead of choosing a lease for billing. Its
error view now links to Maintenance, whose explicit selector handles multiple
rentals. This work does not turn the billing dashboard into a multi-lease UI.

## Request tracking and applications

- Maintenance history is one bounded, tenant-filtered read (latest 100) across
  that account's rentals, including past rentals. RLS still decides access;
  missing/unreadable apartment names have a neutral fallback. No active lease
  is required to view previous requests.
- History retains the actual Pending / In Progress / Resolved / Cancelled
  values, urgency, dates, descriptions, photos, notes and cancellation.
  Pending explains “Submitted · awaiting landlord response”. An empty history
  offers Request maintenance only for a selected eligible rental.
- Application cards group thumbnail, name, location, applied date, status,
  a short status summary and View application. The status chip sits inline with
  the name; wide content uses two columns, capped at 100rem, instead of a single
  stretched row. Smaller layouts stack and show the shorter location. Skeletons
  mirror the cards, and a missing photo renders a placeholder instead of an
  empty image box.
- Filter & sort remains one combined control (desktop popover/mobile drawer),
  with `IconAdjustmentsHorizontal`. Existing status/date ordering is unchanged;
  filter choices are keyboard-operable HeroUI Buttons with `aria-pressed`.
  Statuses and sort live in `applicationStatus`/`applicationSort` URL params
  committed with `window.history.replaceState`, so a reload or Back restores
  them without adding history entries, and unrelated params stay intact.
- Application details keep the two-column desktop foundation and all four
  accordions. The status chip and its short summary sit beside the apartment
  name, the image uses uncapped 16:10 proportions, long headings and addresses
  wrap, and the listing action accurately says View apartment details. Its
  destination and visit links use the application's apartment ID, not the URL's
  untrusted `apartmentId` hint.
- Card links carry a validated `from` return target. Back uses real browser
  history only when a fresh per-tab marker shows the list opened this detail
  page; otherwise it pushes the canonical filtered list, or `/tenant/my-rental`
  for a direct visit or an unsafe/missing target. The marker also restores the
  list's scroll position once. No external URL can become the target.
- Existing visit details take precedence over a fresh request action. Retry is
  offered only for pending applications with rejected/cancelled visits.
- Cancel Application is a restrained outlined danger action. The existing
  confirmation remains, now with Keep application / Cancel application labels.
  A write locks duplicate actions and dismissal; navigation/success occurs
  only after a returned database update row confirms cancellation, and then
  returns to the same filtered list. A refused or zero-row update is not
  success. History/documents are not deleted.

## Guard design and production compatibility

Migration: `supabase/migrations/20261103120000_guard_maintenance_tenancy.sql`.

The inspected INSERT policy checked only the caller's tenant ID, not an active
tenancy/apartment relationship. The old fee binding could infer a historical
tenancy or leave it null. This is why client-only visibility was insufficient.

The additive trigger:

1. Binds the caller through `users.user_id = auth.uid()` to the internal ID,
   requires tenant membership and a nonsuspended account (mixed admin/tenant
   accounts remain normal tenants; admin-only accounts receive no exemption).
2. Requires the caller's active tenancy for that apartment and its actual
   landlord; self-owned rentals are refused. Status is the only eligibility
   test, matching the existing active-rental queries rather than introducing a
   new lease-date window.
3. Validates an explicit tenancy ID. Older web/mobile payloads without it work
   only when the apartment has exactly one matching active tenancy.
4. Sets the validated tenancy/landlord before the existing fee and verification
   triggers. The active-tenancy exemption for unverified tenants still works.
5. Locks the tenancy with `FOR SHARE` during insertion to serialize with a
   concurrent tenancy status change.
6. Prevents session-bound updates from rebinding request relationship IDs, but
   does not revalidate old leases for ordinary status/notes/fee updates.

The function is a narrow `SECURITY DEFINER` trigger with an empty search path
and direct EXECUTE revoked. Existing RLS, table grants, fee rules and notification
triggers stay in force. There is no table rewrite, historical backfill, data
deletion, status change, new table, endpoint or queue. Trusted operator/service
imports retain their existing path; consumer identity is never taken from a
request-supplied profile ID alone.

Read-only preflight snapshot during this task: 8 active tenancies, 4 with a
lease start already reached and 4 future-start; under status-only eligibility
all 8 can request maintenance, exactly as the existing active-rental queries
already allowed. No overlapping active tenant/apartment pairs, unbound
historical requests or historical relationship mismatches were found, and
across all active tenancies there are no apartment/landlord mismatches, no
self-owned rentals and no tenants missing the tenant role. INSERT on
`maintenance_request.tenancy_id` is already granted to `authenticated`.
The hosted trigger inventory was also read: `aa_guard_maintenance_fee`,
`guard_reserved_maintenance_fee_update`, `guard_verified_landlord_write`,
`guard_verified_tenant_insert` and `notify_maintenance_request`. The new
`a_guard_maintenance_tenancy` name sorts first, so it binds the relationship
before the fee trigger's legacy inference; the existing verification and fee
triggers still run unchanged. These are observations, not permanent
guarantees: repeat before release.

**Expected compatibility impact:** none for existing active rentals. Ended,
pending or approved applications remain ineligible, and historical requests
are neither rewritten nor deleted. The guard closes only the forged or
mismatched-apartment insert path.

## Is merging to main safe from automatic SQL application?

**Do not assume so. There is an external-integration release hold.**

Inspection covered local workflows, current GitHub `main` workflows, root/web
package scripts and `supabase/config.toml`:

- `ci.yml` installs dependencies and runs local tests/lint/type checks. CodeQL
  analyzes code; the OpenCode workflow responds to explicit comment commands.
  No workflow calls `supabase db push`, a hosted migration API, or a production
  SQL client. The new maintenance CI step runs PGlite in memory only and uses
  no database credentials.
- Web build is `next build`, with no database prebuild/postinstall migration
  hook. No checked-in `vercel.json` was found. `supabase/config.toml` configures
  a local stack; its project name is not proof of the hosted CLI target.
- Hosted Supabase branch metadata reports a default `main` linked to Git
  branch `main`, status **`MIGRATIONS_FAILED`**. This is evidence of branch
  linkage, not proof that automatic production deployment is disabled or
  enabled. The enabled integration/production migration settings and the
  failure's cause are not exposed by the current tools.
- Vercel's current tool connection identified one project, `apt-rental-platform`,
  under team scope `apt-testing`, but reading its settings returned HTTP 403
  (not authorized for that scope). Dashboard build commands, production-branch
  settings, Git integration and external deploy hooks remain unverified. Do not
  infer them from CLI defaults or the absence of a repository file.

Because the SQL file lives in `supabase/migrations/`, an enabled Supabase GitHub
integration can discover it on PR/merge independently of GitHub Actions and
Vercel. **Before merging this file, confirm/disable automatic production SQL
application in the Supabase dashboard, inspect branch migration logs and
reconcile the migration ledger.** Investigate the reported failure separately;
do not retry/rebase/reset branches or blindly run `db push` as part of this UI
release. A bulk push can apply other pending migrations, not just this guard.

## Safe release order (requires separate authorization)

The database and application do **not** require an atomic deployment. The guard
accepts existing unambiguous legacy payloads; the application uses an existing
column, not a new RPC. Recommended order:

1. **Hold merge/deployment.** Verify the intended project against the active
   production public Supabase URL (`ezxirkpgfpripjydcqnt` when inspected).
   Audit Supabase GitHub production-branch migration settings, the failed
   branch status, Vercel build hooks/commands and pending migration ledger.
   Pause automatic SQL application if a manual reviewed rollout is intended.
2. Review this migration, its status-only eligibility and the active trigger
   ordering. Do not silently rewrite dates/statuses or old requests to make the
   check pass.
3. Rehearse against an authorized isolated staging schema with production's
   actual RLS, grants and trigger ordering. Test old mobile/web payloads,
   future-start and passed-end active rentals, unverified active tenants, mixed
   roles, ended histories, unrelated tenants, explicit/ambiguous selection,
   landlord response/fees and concurrent tenancy status changes. Re-run
   read-only counts for drift.
4. After explicit database approval, apply **only the reviewed guard** through
   the agreed controlled migration mechanism. Check migration ledger, function
   search path/privileges and trigger order. Confirm unauthorized requests are
   refused and existing valid active-rental requests still work, using approved
   isolated/test accounts—not real tenant mutations without permission.
5. After separate application-release approval, merge/deploy the web changes
   through the normal PR/CI/Vercel flow. A preview must not point write tests
   at production; use an isolated backend or network-disabled fixtures.
6. Smoke-test repair links/selection, history, filters, visits and confirmation
   at mobile/desktop sizes. Observe error rates and unexpected authorization
   refusals. Do not interpret a successful web deployment as proof that the
   migration was applied.

Web rollback remains compatible with the guard's legacy payload path. Prefer
keeping the security guard in place and rolling forward any issue; dropping
it reopens the known gap and requires a separate security decision. Nothing
in this document authorizes a production write, merge or deployment.

## Local verification

```powershell
# Repository root: embedded, isolated PostgreSQL; no hosted connection.
pnpm db:maintenance:test
pnpm db:landlord-gate:test

# apps/web
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Browser fixture commands/limits: `apps/web/tests/tenant-rental/README.md`.
The SQL harness loads existing fee/verification triggers and policy-shaped
fixtures, not a full production clone. Browser rendering uses real components
with synthetic transports and blocked external requests; it does not certify
live production authorization or execute real applications/requests.
