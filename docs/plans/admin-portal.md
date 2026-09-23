# APT Admin Web Portal — Implementation Plan

## 0. Decisions (locked)

- Apartment verification: **Option B** — new `apartment_verifications` table mirroring `user_verifications`. No new columns on `apartments` except trigger-synced `is_verified`.
- Users list: **no Active/Disabled filter** (no such column in `public.users`). Filters are search + role + verification only.

## 1. Repo audit (verified 2026-09-22)

- No `/admin` route exists. Guard exists only in `packages/supabase/src/middleware.ts:5-9` (`admin → /admin`). Dead links to `/admin/dashboard` in `apps/web/app/components/layout/AppNavbar.tsx:36` and `apps/web/app/(main)/page.tsx:42`.
- `public.users` (`packages/supabase/src/types.ts:910-934`): `role: string`, `account_status: string` (`unverified|pending|verified|rejected`), internal `id` PK + `user_id → auth.uid()`. All FKs/RLS use internal `id`.
- `public.user_verifications` + private `user-verification` bucket fully implemented (`supabase/migrations/20260917000000_create_user_verifications.sql`). Includes RLS, `sync_verification_review()` trigger, `notify_*` triggers, one-pending-per-user index. Admin UI missing by design — reuse table as-is.
- `public.apartments` (`packages/supabase/src/types.ts:77-112`): `is_verified: boolean`, `status: string`, `landlord_id → users.id`, `deleted_at` soft-delete. No verification workflow tables/columns.
- No `audit_logs` table, no `VerifiedBadge` component.
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

Sidebar nav: Dashboard, Users, Apartments, Verification (Users, Apartments), Activity. Footer: Profile, Logout (reuse existing dropdown + `signOut` server action).

Route protection: middleware (existing) + server-page check (`auth.getUser()` → `users.role`, non-admin redirect). Defense in depth, per `ARCHITECTURE.md` §4.3.

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

Grants: `grant select, insert to authenticated; grant update (status, rejection_reason) to authenticated;`

RLS (mirror `user_verifications`):
- Landlords: SELECT own, INSERT own as `pending` with null review cols.
- Admins: SELECT all, UPDATE any row (trigger validates transition).
- No owner UPDATE/DELETE.

Triggers (SECURITY DEFINER, mirror existing):
- `sync_apartment_verification_review()` BEFORE UPDATE OF status: enforce `pending → approved|rejected`, require `rejection_reason` on reject, null it on approve, stamp `reviewed_by/reviewed_at` from `auth.uid()`, sync `apartments.is_verified = (NEW.status='approved')`.
- `set_apartment_verification_submitted()` AFTER INSERT: none required on `apartments` (keep `is_verified=false` until approval); optional `updated_at` touch.
- `notify_*` via `create_notification()`: submission notifies all admins; review notifies `landlord_id`. Payload carries `apartmentId` (per AGENTS.md trigger-payload rule) for deep links.

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

Writes via SECURITY DEFINER function called from verification review triggers (never client INSERT). RLS: admin SELECT only. No PII/image paths in rows.

### 3.3 After migrations

- Regenerate `packages/supabase/src/types.ts`.
- `graphify update .` per AGENTS.md.

## 4. Server-side mutations

- Use Server Actions (`admin/**/actions/*.ts`, `"use server"`) with `@repo/supabase/server` client; RLS is the authority.
- User review: `UPDATE user_verifications SET status, rejection_reason` — existing trigger stamps reviewer + syncs `users.account_status`.
- Apartment review: `UPDATE apartment_verifications SET status, rejection_reason` — new trigger syncs `apartments.is_verified`.
- Never trust client-sent `reviewed_by/at`. Never expose service-role key. Verification images only via short-lived `createSignedUrl` in the review route.
- Rejection reason catalogs (UI constants, not DB enums): users — unclear ID, inconsistent info, selfie mismatch, unsupported document, incomplete; apartments — incomplete info, needs clarification, duplicate, insufficient images, location unclear, other + free text. Persist combined string in `rejection_reason`.

## 5. UI build order

1. `admin/layout.tsx` + nav constants + `AppTopBar` title map (extend `AppSidebar` ICON_MAP if needed; reuse `LayoutDashboard/Users/Building2/ShieldCheck/History` from lucide).
2. Dashboard: parallel `count: exact` head queries (users by role/account_status, apartments by is_verified/status, pending queues) + 3 recent-lists (users, apartments, activity). Skeleton + error states.
3. Users list + detail. Detail joins: `users`, latest `user_verifications` rows, `apartments` by `landlord_id`, relevant `admin_audit_logs`.
4. User verification review: three signed-URL images (front/back/selfie, lazy-load only on this page), user info, history, Approve/Reject modal.
5. Apartments list + detail: reuse browse display logic; landlord card links to `/admin/users/[id]`.
6. Apartment verification review + verification center (tabbed queues with counts).
7. Activity page (audit log table, server pagination).
8. Shared `VerifiedBadge` (`apps/web/app/components/VerifiedBadge.tsx`, HeroUI `Chip soft` + shield, `success` token) wired into browse/search/cards/detail/map landlord pages. Render only when `is_verified=true`.
9. Responsive: tables horizontal scroll, sticky first col + actions col, detail stacks info → images → status → actions.

Design: tokens from `design-tokens.json` / `DESIGN.md` only (`primary #376BF5`, `background #F8F9FA`, `text #333333`, `success #22C55E`, `warning #FACC15`, `danger #E50914`); Inter body + Nunito headings; HeroUI/shadcn primitives; no new deps.

## 6. Testing / acceptance

- `pnpm --filter web lint`, `tsc --noEmit`, `pnpm --filter web build`.
- Manual matrix: tenant/landlord/anon → `/admin/*` blocked; admin allowed; `[id]` tampering returns 404/redirect, never another user's docs.
- User flow: pending appears → approve flips `users.account_status=verified` → reject persists reason → history + audit row + notification.
- Apartment flow: landlord request → pending queue → verify sets `is_verified=true` (persists on refresh) → badge shows on tenant pages → reject persists reason, listing stays published (no delete).
- Perf: server-side filter/pagination only, no unbounded selects; signed URLs only on review pages.

## 7. Out of scope

- No Active/Disabled user status, no delete/suspend controls, no new auth system, no tenant/landlord behavior changes, no new icon/UI libraries.
