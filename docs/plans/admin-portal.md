# APT Admin Web Portal — Implementation Plan

## 0. Decisions (locked)

- **Security prerequisite:** repair `public.users` before enabling any admin route. A user must never be able to set their own `role` or `account_status`; admin provisioning is a controlled database/server operation only.
- Apartment verification: **Option B** — new `apartment_verifications` table mirroring `user_verifications`. No new columns on `apartments` except trigger-synced `is_verified`.
- Apartment verification lifecycle: landlords explicitly submit a pending review from their property management flow. Rejected apartments may be resubmitted; approved apartments cannot be resubmitted unless a later, explicitly defined property-change rule first invalidates their verification.
- Users list: **no Active/Disabled filter** (no such column in `public.users`). Filters are search + role + verification only.
- Verification is a single sidebar destination with Users and Apartments tabs; do not introduce unsupported nested sidebar navigation.

## 1. Repo audit (verified 2026-09-22)

- No `/admin` route exists. Guard exists only in `packages/supabase/src/middleware.ts:5-9` (`admin → /admin`). Dead links to `/admin/dashboard` in `apps/web/app/components/layout/AppNavbar.tsx:36` and `apps/web/app/(main)/page.tsx:42`.
- `public.users` (`packages/supabase/src/types.ts:910-934`): `role: string`, `account_status: string` (`unverified|pending|verified|rejected`), internal `id` PK + `user_id → auth.uid()`. All FKs/RLS use internal `id`.
- `public.user_verifications` + private `user-verification` bucket fully implemented (`supabase/migrations/20260917000000_create_user_verifications.sql`). Includes RLS, `sync_verification_review()` trigger, `notify_*` triggers, one-pending-per-user index. Admin UI missing by design — reuse table as-is.
- `public.apartments` (`packages/supabase/src/types.ts:77-112`): `is_verified: boolean`, `status: string`, `landlord_id → users.id`, `deleted_at` soft-delete. No verification workflow tables/columns.
- No `audit_logs` table, no `VerifiedBadge` component.
- Security audit required before implementation: the current owner-update model for `public.users` must be narrowed so user-editable profile fields cannot include `role` or `account_status`. Verify the deployed grants and RLS policies rather than relying only on generated types.
- Reusable patterns: `apps/web/app/landlord/layout.tsx:21-57` (AppSidebar + AppTopBar shell), `apps/web/app/components/layout/AppSidebar.tsx:1-158`, server pages via `@repo/supabase/server` + `"use client"` children, shadcn `Table`, HeroUI `Chip variant="soft"` / `Modal`, `DESIGN.md` tokens + `design-tokens.json`.

## 2. Target structure (`apps/web/app/admin/`)

```text
admin/layout.tsx                    # admin guard + AppSidebar + AppTopBar
admin/dashboard/page.tsx            # counts + recent lists
admin/users/page.tsx                # search + role + verification filter, sort, pagination
admin/users/[id]/page.tsx           # profile + verification history + owned apartments + activity
admin/apartments/page.tsx           # search + verification + listing-status + landlord filter
admin/apartments/[id]/page.tsx      # full listing + landlord card + verification history
admin/verification/page.tsx         # two queues: users + apartments with counts
admin/verification/users/[id]/page.tsx       # ID front/back/selfie viewer + approve/reject
admin/verification/apartments/[id]/page.tsx  # property review + verify/reject
admin/activity/page.tsx             # audit log list
```

Sidebar nav: Dashboard, Users, Apartments, Verification, Activity. `/admin/verification` owns the Users/Apartments tabs and pending counts. Footer: only reuse Profile/Settings links if equivalent admin routes exist; otherwise retain Logout via the existing `signOut` server action.

Route protection and invisibility:
- Do not add an admin sign-up option, normal-user navbar link, mobile route, or public link. Admin accounts are provisioned outside client profile editing.
- Keep the existing tenant/landlord sign-in tabs; do not expose an Admin tab. Update the credential sign-in action and OAuth callback to recognize a stored, provisioned `admin` role and redirect it to `/admin/dashboard` regardless of the client-selected tenant/landlord tab. Preserve the tenant/landlord role-mismatch rejection and never accept a client-submitted role as authorization.
- Middleware remains the first route guard. Anonymous users redirect to `/sign-in`; tenant, landlord, and unknown-role users redirect to their own portal (or receive `notFound()` where revealing the resource would be inappropriate).
- Every admin layout/page performs a server-side `auth.getUser()` → `users.role = 'admin'` check before querying data. This is required because middleware is bypassed for Next Server Actions.
- Every `admin/**/actions/*.ts` action repeats the same check before performing its mutation; RLS remains the final authority.

## 3. Database changes

### 3.1 `apartment_verifications` (new migration)

```sql
create table public.apartment_verifications (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references public.apartments (id) on delete cascade,
  landlord_id uuid not null references public.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  reviewed_by uuid null references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz null
);
create index apartment_verifications_apartment_idx on public.apartment_verifications (apartment_id);
create index apartment_verifications_landlord_idx on public.apartment_verifications (landlord_id);
create index apartment_verifications_status_idx on public.apartment_verifications (status, submitted_at);
create unique index apartment_verifications_one_pending_per_apt
  on public.apartment_verifications (apartment_id) where status = 'pending';
```

Grants: `grant select, insert to authenticated; grant update (status, rejection_reason) to authenticated;`. Revoke all unneeded privileges from `anon` and `PUBLIC`.

RLS (mirror `user_verifications`):
- Landlords: SELECT own, INSERT own as `pending` with null review cols.
- Admins: SELECT all, UPDATE any row (trigger validates transition).
- No owner UPDATE/DELETE.

Triggers (SECURITY DEFINER, mirror existing):
- `reject_verified_apartment_resubmission()` BEFORE INSERT: block a new submission while the apartment remains verified, preventing a pending row from contradicting `apartments.is_verified`.
- `sync_apartment_verification_review()` BEFORE UPDATE OF status: enforce `pending → approved|rejected`, require `rejection_reason` on reject, null it on approve, stamp `reviewed_by/reviewed_at` from `auth.uid()`, and sync `apartments.is_verified = (NEW.status='approved')`.
- `set_apartment_verification_submitted()` AFTER INSERT: set `updated_at`; keep `is_verified=false` for unverified/rejected apartments until approval.
- `notify_*` via `create_notification()`: submission notifies all admins; review notifies `landlord_id`. Payload carries `apartmentId` (per AGENTS.md trigger-payload rule) for deep links.

All `SECURITY DEFINER` functions use `set search_path = public`, are only trigger-invocable where feasible, and have `EXECUTE` revoked from `PUBLIC`/unneeded roles. The trigger, policy, and column-level grant together must prevent clients from writing reviewer metadata, apartment ownership, or image paths.

No new storage bucket. Review reads existing `apartment_images.url/url_thumb` (public `apartment-images` bucket) + `lease_agreement_url` via existing signed-URL pattern.

### 3.2 `admin_audit_logs` (new migration)

```sql
create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.users (id),
  action text not null check (action in
    ('USER_VERIFICATION_APPROVED','USER_VERIFICATION_REJECTED',
     'PROPERTY_VERIFICATION_APPROVED','PROPERTY_VERIFICATION_REJECTED')),
  target_type text not null check (target_type in ('user_verification','apartment_verification')),
  target_id uuid not null,
  reason text null,
  created_at timestamptz not null default now()
);
create index admin_audit_logs_created_idx on public.admin_audit_logs (created_at desc);
create index admin_audit_logs_target_idx on public.admin_audit_logs (target_type, target_id);
```

Writes via SECURITY DEFINER function called from verification review triggers (never client INSERT). Explicitly grant `SELECT` to `authenticated`, enable RLS, and allow SELECT only where the current profile role is `admin`; do not grant INSERT/UPDATE/DELETE to client roles. No PII/image paths in rows.

### 3.3 `public.users` authorization hardening (prerequisite migration)

- Inspect current table and column grants plus RLS policies in the linked Supabase project before writing the migration.
- Revoke broad client UPDATE access, then grant only the profile columns the existing tenant/landlord flows actually edit. At minimum, clients must not update `role`, `account_status`, `user_id`, `id`, or system timestamps.
- Retain owner-scoped RLS for permitted profile fields. Add a database guard/trigger as defense in depth that rejects client-driven changes to protected authorization and verification columns.
- Define a controlled operational path for creating/promoting an admin that is unavailable to browser and mobile clients. Document it with the migration/operations runbook, not as a UI feature.

### 3.4 After migrations

- Regenerate `packages/supabase/src/types.ts`.
- `graphify update .` per AGENTS.md.

## 4. Server-side mutations

- Use Server Actions (`admin/**/actions/*.ts`, `"use server"`) with `@repo/supabase/server` client. Each action authenticates with `auth.getUser()`, resolves the internal profile ID, requires `role='admin'`, validates input, and then relies on RLS as the final authority.
- User review: `UPDATE user_verifications SET status, rejection_reason` — existing trigger stamps reviewer + syncs `users.account_status`.
- Apartment review: `UPDATE apartment_verifications SET status, rejection_reason` — new trigger syncs `apartments.is_verified`.
- Landlord submission: add a landlord-only mutation/UI at the appropriate property management screen that inserts one pending `apartment_verifications` row for that landlord-owned apartment. It must expose neither review fields nor an admin-only action.
- Never trust client-sent `reviewed_by/at`. Never expose service-role key. Verification images only via short-lived `createSignedUrl` in the review route.
- Rejection reason catalogs (UI constants, not DB enums): users — unclear ID, inconsistent info, selfie mismatch, unsupported document, incomplete; apartments — incomplete info, needs clarification, duplicate, insufficient images, location unclear, other + free text. Persist combined string in `rejection_reason`.

## 5. UI build order

1. `admin/layout.tsx` + nav constants + `AppTopBar` title map (extend `AppSidebar` ICON_MAP if needed; reuse `LayoutDashboard/Users/Building2/ShieldCheck/History` from lucide).
2. Dashboard: parallel `count: exact` head queries (users by role/account_status, apartments by is_verified/status, pending queues) + 3 recent-lists (users, apartments, activity). Skeleton + error states.
3. Users list + detail. Detail joins: `users`, latest `user_verifications` rows, `apartments` by `landlord_id`, relevant `admin_audit_logs`.
4. User verification review: three signed-URL images (front/back/selfie, lazy-load only on this page), user info, history, Approve/Reject modal.
5. Apartments list + detail: reuse browse display logic; landlord card links to `/admin/users/[id]`.
6. Apartment verification review + verification center (accessible Users/Apartments tabs with counts). Add the landlord submission affordance and its pending/rejected/verified states in the existing property-management UI.
7. Activity page (audit log table, server pagination).
8. Shared `VerifiedBadge` (`apps/web/app/components/VerifiedBadge.tsx`, HeroUI `Chip soft` + shield, `success` token) wired into browse/search/cards/detail/map landlord pages. Render only when `is_verified=true`.
9. Responsive: tables horizontal scroll, sticky first col + actions col, detail stacks info → images → status → actions. Because `AppSidebar` is hidden below `md`, add an accessible compact admin navigation control in the top bar for small screens.

Design: tokens from `design-tokens.json` / `DESIGN.md` only (`primary #376BF5`, `background #F8F9FA`, `text #333333`, `success #22C55E`, `warning #FACC15`, `danger #E50914`); Inter body + Nunito headings; HeroUI/shadcn primitives; no new deps. Include labelled filters, keyboard-operable row actions, visible focus states, status text/icons in addition to color, dialog focus return, and explicit approve/reject confirmation copy.

## 6. Testing / acceptance

- `pnpm --filter web lint`, `pnpm --filter web exec tsc --noEmit`, `pnpm --filter web build`.
- Database/RLS coverage: anon, tenant, landlord, and admin queries/mutations prove that only admins can read/review all verification records, sign private review documents, and read audit logs. Prove that clients cannot update `users.role` or `users.account_status`, cannot insert audit rows, and cannot forge reviewer/ownership/path fields.
- Trigger coverage: only `pending → approved|rejected` succeeds; rejection requires a reason; review stamps the internal admin ID/timestamp; user and apartment status synchronization, audit insertion, and notifications occur atomically; verified apartments cannot create contradictory pending resubmissions.
- Server Action coverage: direct action invocation by tenant/landlord/unknown-role users fails even though middleware is bypassed; stale or changed roles fail closed.
- Route matrix: tenant/landlord/anon → `/admin/*` blocked; admin allowed; no regular navigation exposes the portal; `[id]` tampering returns 404/redirect and never exposes another user's documents.
- User flow: pending appears → approve flips `users.account_status=verified` → reject persists reason → history + audit row + notification.
- Apartment flow: landlord submits → pending queue → verify sets `is_verified=true` (persists on refresh) → badge shows on tenant pages → reject persists reason, listing stays published (no delete) → permitted resubmission follows the defined lifecycle.
- UI coverage: filters and server pagination; empty, loading, and error states; rejection-dialog validation; keyboard/focus behavior; small-screen navigation and horizontally scrollable tables.
- Perf: server-side filter/pagination only, no unbounded selects; signed URLs only on review pages.

## 7. Out of scope

- No Active/Disabled user status, no delete/suspend controls, no new auth system, no tenant/landlord behavior changes beyond the required apartment-verification submission flow, no new icon/UI libraries.
