# Phase 2 — Admin Operations

## Goal

Extend the Phase 1 verification portal into a safe operational console for account access, listing moderation, and aggregate operational reporting. Keep the existing landlord/tenant flows intact and preserve Phase 1's admin-only server-side authorization model.

## Scope

1. **Account access controls**: suspend and reactivate tenant/landlord accounts.
2. **Listing moderation**: hide and restore listings without deleting property, tenancy, payment, or verification history.
3. **Admin analytics**: date-scoped aggregate metrics for users, listings, verifications, applications, occupancy, payments, and maintenance.

## Explicitly out of scope

- Creating, promoting, or demoting admins through the UI.
- Deleting Auth users, profiles, apartments, audit history, payments, or tenancies.
- Changing a user's tenant/landlord role.
- Editing or deleting audit logs.
- Public web deployment and custom domains (a separate deployment task).
- Bulk moderation/actions in the first release.

## Locked product decisions

- Only users whose profile role is `tenant` or `landlord` can be suspended. Admin accounts cannot be targeted by Phase 2 actions.
- Suspension must block future sign-ins, revoke refreshable sessions, and deny protected data to any previously issued (still-valid) JWT through RLS. It must not change `users.role`, user-verification history, or verification status.
- A hidden listing is not deleted and must be excluded from tenant-facing browse/search/map surfaces. Its landlord can still view and manage it, and existing tenancy/payment records remain accessible.
- Every suspend/reactivate/hide/restore operation requires a reason, an explicit confirmation dialog, and one immutable audit row.
- UI route guards and server actions are convenience/security layers; database RLS and server-side checks remain the final authority.

## Data model and database work

### 1. Extend admin auditing

Create a migration that extends the `admin_audit_logs.action` constraint with:

- `USER_SUSPENDED`
- `USER_REACTIVATED`
- `APARTMENT_HIDDEN`
- `APARTMENT_RESTORED`

Add target types if needed: `user` and `apartment`. Reuse the existing table and its admin-only read policy; continue to deny client INSERT/UPDATE/DELETE.

### 2. Account-access state

Add server-managed fields to `public.users`:

- `is_suspended boolean not null default false`
- `suspended_at timestamptz null`
- `suspended_by uuid null references public.users(id)`
- `suspension_reason text null`

Update the Phase 0 authorization guard and grants so `authenticated` cannot write any of these fields. Add a constrained security-definer database function that:

- resolves the acting internal profile from `auth.uid()`;
- requires `role = 'admin'`;
- refuses to target admins or the acting admin;
- validates a non-empty reason for suspension;
- updates only the target's access fields;
- writes the audit row atomically.

Use a server-only Supabase Edge Function for the Auth Admin API `ban/unban` operation. It must authenticate the caller, re-check `public.users.role = 'admin'` and the DB suspension state, keep the service-role key only in Edge Function secrets, and never accept a target role or arbitrary audit payload from the client. The web Server Action invokes the function; it bans/unbans first, then calls the atomic DB transition, compensating the Auth change on DB failure. On suspension the DB transaction also removes refreshable sessions. Supabase-issued access JWTs cannot be revoked before expiry, so RLS and route guards must reject suspended users during the interim. Log and surface a failed compensation for operator reconciliation.

### 3. Listing-moderation state

Add server-managed moderation fields to `public.apartments` rather than repurposing `deleted_at`:

- `is_hidden_by_admin boolean not null default false`
- `hidden_at timestamptz null`
- `hidden_by uuid null references public.users(id)`
- `hidden_reason text null`

Add a security-definer admin function that requires an admin, refuses invalid transitions, requires a reason for hiding, changes only these fields, and inserts the audit log in the same transaction. Revoke direct execution from client roles where trigger/RPC grants are not deliberately required.

Audit every tenant/public-facing apartment read (browse, search RPCs, map, homepage carousels, related/recommended lists, direct apartment detail) and add `is_hidden_by_admin = false`. Landlord-owned management reads and admin reads retain access. Do not alter `status`, `is_verified`, or `deleted_at` as a moderation side effect.

### 4. Analytics RPC

Create one admin-only `get_admin_analytics(date_from date, date_to date)` RPC returning bounded aggregates only:

- total users and new users by role;
- verified/pending/rejected account and apartment verification counts;
- active, hidden, verified, and new apartments;
- application and tenancy counts, including occupancy where the schema supports it;
- payment count/paid total and maintenance request counts grouped by status.

The function must validate the date range (maximum 366 days), resolve the caller through `auth.uid()` to the internal profile, require admin role, use `SECURITY DEFINER` with `search_path = public`, and expose no user-level PII. Add supporting indexes only after checking `EXPLAIN` against representative production-sized data.

Regenerate `packages/supabase/src/types.ts` after the migration.

## Web implementation

### 1. Shared admin actions

- Add focused Server Actions under `apps/web/app/admin/actions/` for account access and apartment moderation.
- Match the Phase 1 pattern: `requireAdmin()`, UUID validation, typed result, friendly error, server log for unexpected failures, then `revalidatePath` for exact affected routes.
- Do not use a browser Supabase client for any Phase 2 admin mutation.

### 2. User-detail access panel

Extend `apps/web/app/admin/users/[id]/page.tsx` with an **Account access** panel for tenant/landlord profiles only:

- current access state and prior reason/timestamp;
- Suspend or reactivate action;
- mandatory reason for both suspension and reactivation;
- explicit confirmation copy explaining the access/session effect;
- no action UI for admins or the current admin.

Add related activity to the existing detail history and expose new audit events in `/admin/activity`.

### 3. Apartment-detail moderation panel

Extend `apps/web/app/admin/apartments/[id]/page.tsx` with a **Listing visibility** panel:

- current visible/hidden state and reason;
- Hide listing or restore listing action;
- mandatory reason on hide and explicit confirmation;
- explanatory copy that tenancy/payment/history are retained.

Add a `Visibility` filter to the admin apartment list and show an icon/text chip in table and detail views. Hidden listings must remain visible to admins and their landlord owner, but never tenant/public discovery UI.

### 4. Analytics destination

Add `/admin/analytics` and a sidebar entry after Activity. Build a server-rendered, date-range-filtered dashboard using existing HeroUI/shadcn primitives and canonical design tokens:

- KPI cards with accessible text labels;
- compact grouped tables/charts only where the existing chart dependency is appropriate;
- loading/error/empty states;
- bounded date presets: 7, 30, 90 days plus validated custom dates.

Do not add a new chart or export dependency in Phase 2.

## Implementation inventory and rollout notes

- Public discovery reads: web home, browse and related listings, browse/apply, favorites; mobile paged search, search-sections RPC, map, public landlord listings/reviews, favorites. These explicitly exclude hidden listings. Apartment and image RLS also blocks anonymous/unrelated direct reads, while landlord/admin and existing tenancy access remain available.
- Supabase Auth `ban_duration` blocks new sign-ins; database session removal revokes refreshable sessions. Issued JWTs can remain valid until expiry, so restrictive policies guard authenticated tables/storage; conversation SECURITY DEFINER RPCs have explicit account checks. Web middleware and mobile profile guards reject a suspended profile on their next read.
- `packages/supabase/src/types.ts` reflects the new migration by hand so the branch typechecks before deployment. Regenerate from the deployed schema during the approved rollout.
- The SQL matrix at `supabase/tests/phase2_admin_operations.test.sql` can run with the migration inside a rollback-only transaction against `apt-test` or a local database. Controlled production-account testing remains the acceptance gate.

## Security and review checklist

- Anonymous, tenant, landlord, and admin role matrix for every RPC, Server Action, and route.
- Prove client users cannot update suspension/moderation columns, create audit rows, target admins, or invoke privileged functions directly.
- Prove a suspended user cannot initiate new authenticated access after the Auth ban and cannot access protected application routes with a refreshed session.
- Prove hidden apartments are absent from every tenant/public discovery path but present for their landlord/admin; direct URL access must not disclose hidden listing details to tenants.
- Prove audit rows are produced atomically with each successful state transition and contain no PII/document paths.
- Confirm existing verification, applications, tenancies, payments, maintenance, and landlord property-management flows still work.
- Validate analytics data against read-only production queries and enforce range limits.

## Rollout order

1. Inventory existing apartment-read paths and Auth session behavior; document all query/RPC locations to update.
2. Write and test the migration/RLS/RPC changes locally or in `apt-test`; inspect the generated schema/types.
3. Implement access controls and moderation UI/actions; add targeted web tests where the repository pattern supports them.
4. Implement analytics RPC and page.
5. Run mobile lint/tests plus web typecheck/build and focused admin lint; record unrelated pre-existing full-web-lint failures separately.
6. Run controlled production acceptance with dedicated test tenant/landlord accounts and an admin operator. Do not use customer accounts or delete audit/history records.
7. Open a PR from `feature/admin-page`; merge only after explicit approval and required CI. During the approved rollout, apply the production migration, deploy `admin-user-access` with JWT verification enabled, regenerate Supabase types, then run read-only verification and controlled-account acceptance before enabling routine use.

## Acceptance criteria

- An admin can suspend/reactivate a non-admin with confirmation and audit history; a tenant/landlord cannot access or forge that operation.
- An admin can hide/restore a non-deleted apartment with confirmation and audit history; hidden listings disappear from every tenant/public discovery path while landlord/admin access remains.
- `/admin/analytics` shows correct, bounded, date-filtered aggregates without PII or unbounded client queries.
- Existing Phase 1 verification behavior and all tenancy/payment data remain unchanged.
