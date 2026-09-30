# Mobile/Web Feature Parity Plan

## Goal

Bring the mobile and web experiences into agreement on core behavior where parity benefits users, without forcing mobile and web into identical layouts or removing platform-specific strengths.

This plan records a code-reviewed parity audit and a proposed implementation order. It does not authorize database/security changes or assume every web-only feature belongs on mobile. Current source code takes precedence over older architecture notes.

## Audit findings

| Area | Current behavior | Proposed direction |
|---|---|---|
| Authentication | Web sign-in selects a valid portal using the user's roles and saved portal preference. Mobile sign-in asks the user to choose Tenant or Landlord and signs out when the account does not hold the selected role. | Decide on one portal-selection policy; retain explicit membership checks on both platforms. Review email and Google OAuth paths together. |
| Roles | Web has a portal switch for multi-role accounts. Mobile routes by its primary role and has no equivalent switch in either profile screen. | Let a multi-role mobile user enter either authorized portal. Reuse the constraints in `docs/plans/mobile-roles-and-supabase-types.md`; roles remain server-authoritative. |
| Browsing | Most core filters exist on both platforms. Web browse state is URL-backed, uses exact counts, and pages by 25; mobile state is local to the screen, uses estimated counts, and pages by 10. Mobile additionally offers map search and discovery sections. | Preserve mobile map/discovery experiences; improve restoration of mobile search/filter state. Only align count/page behavior if product and performance needs justify it. |
| Landlord dashboard | Both platforms fetch live data but show different metrics. Mobile includes occupied units, maintenance requests, revenue by property, and rent dues. Web includes current-month revenue, rent collection, and occupancy. Web currently passes `null` to its occupancy chart. | Agree on shared metric definitions and labels; keep useful platform-specific summaries. Fix and test the web chart data separately. |
| Chat | Mobile supports media attachments and GIFs; web messaging is text-only. | No mobile parity work indicated; mobile is ahead. Decide separately whether web should gain media support. |
| Reviews | Mobile uses the review submission service. Web's rate-apartment page displays hard-coded apartment/stay data and saves through a local review store. | Treat web review submission as a separate backend/parity follow-up; verify persistence and eligibility before declaring this flow complete. |
| Notifications | Mobile has a notification feed and in-app notification behavior. Web has notification preference settings but no user-facing notification inbox route was found. | No mobile parity work indicated; mobile is ahead. Consider web inbox parity separately. |
| Admin | Web includes admin routes; mobile has no admin portal. | Keep out of the mobile scope unless product explicitly requires mobile admin workflows. |

Other tenant and landlord route families—including applications, visits, payments, maintenance, and property management—exist on both platforms. Audit specific workflows within those families rather than treating whole features as missing based on older documentation.

## Scope and decisions

- **In scope:** mobile authentication/portal entry behavior, multi-role portal access, browse-state restoration, dashboard metric semantics, and regression coverage for those behaviors.
- **Review-only:** chat, reviews, notifications, admin, and remaining tenant/landlord flows. Create separate work only for confirmed gaps with an agreed product outcome.
- Keep native navigation, gestures, and layouts platform-specific. Match behavior and semantics, not screen composition.
- Do not add client-side role writes or weaken Supabase/RLS authorization. A selected portal is a navigation preference, never a grant of access.
- Keep server data in React Query on mobile; do not duplicate profile or listing data in Zustand or persistent storage. Persist only the minimum browse/portal preference needed, with identity and validity checks where applicable.
- Reuse shared validation and domain constants. Follow `DESIGN.md` and `design-tokens.json` for any UI changes.

## Implementation order

1. **Baseline and decide authentication behavior.** Trace password sign-in, signup/OTP, Google OAuth, profile completion, app bootstrap, and tab guards on both platforms. Choose whether mobile should preserve its explicit role choice or adopt web's preferred-portal behavior. Document expected outcomes for tenant-only, landlord-only, dual-role, unsupported/admin-only, and incomplete-profile accounts.
2. **Multi-role mobile access.** Implement an accessible portal switch only for memberships present in the current profile. Make bootstrap and tab-group guards honor the selected authorized portal, and fall back safely if the profile no longer grants it. Coordinate with `docs/plans/mobile-roles-and-supabase-types.md` rather than duplicating its schema/type migration work.
3. **Browse-state restoration.** Identify the smallest reliable state to restore (query, city, filters, sort, and optionally view mode). Preserve current filters and server query semantics, avoid persisting listing results or sensitive data, and support clear/reset behavior. Keep the mobile map and default discovery sections intact.
4. **Dashboard parity contract.** Define the common metrics and their formulas/empty states. Keep appropriate mobile-only quick information, investigate the web `OccupancyChart` receiving `null`, and verify calculations against the same underlying payment/property scenarios. Avoid a broad redesign.
5. **Targeted parity regression tests.** Add or update tests for portal routing/authorization, saved browse state and reset behavior, and dashboard calculations/empty states. Cover stale preferences and account changes; do not test by mutating production user roles.
6. **Re-audit and verify.** Compare the implemented behavior against this matrix; run focused mobile tests, mobile lint/typecheck, and web checks for any shared or web-side fixes. Update this plan if the audit reveals a deliberate product decision or an additional confirmed gap.

## Acceptance criteria

- A mobile user can enter only a portal included in their current server-provided roles; dual-role users can intentionally access either authorized portal.
- Sign-in, OAuth completion, app restart, and tab navigation resolve to the same documented portal behavior without losing or bypassing role checks.
- Returning to mobile search restores the agreed browse inputs; clearing them returns to the default state, while map/discovery flows continue to work.
- Dashboard figures have documented, tested definitions; the web occupancy visualization receives valid data or an explicit empty state.
- Focused tests cover single-role and dual-role routing, stale portal preference, browse restore/clear, and dashboard populated/empty cases.
- No UI parity change introduces a direct client-side role update, bypasses RLS, or persists private/server data unnecessarily.

## Verification notes

The audit was source-based; no application code was changed and no test suite was run. Re-check the relevant routes/services before implementation because this plan is a snapshot, not a substitute for current code or live database policy verification.

Implementation record (branch `refactor/align-web`, plan in `.opencode/plan/mobile-web-parity*.md`):
- Phase 1 (auth): verify-only plus minor hardening — Google `suggestedRole`
  is now deterministic via `choosePortal`; portal/tab-guard/notification
  routing confirmed membership-checked with per-account preferences.
- Phase 2 (browse): mobile search restores per-account inputs (city, committed
  query, filters, sort, view) via `service/search/searchPreference.ts`; web
  stays URL-backed by design.
- Phase 3 (dashboard): metric contract agreed (canonical payment statuses
  `pending|paid|partial|unpaid`; occupancy = active-tenancy coverage).
  `supabase/migrations/20260930140000_fix_landlord_dashboard_status.sql` fixes
  the RPC counting legacy `'not paid'` (always 0) and row-based occupancy;
  requires production deployment. Mobile `landlord/analytics.tsx` was dummy
  data and is now wired to `useDashboardData()`. Web `OccupancyChart` keeps
  its explicit empty state (`null` is intentional — no history source).
- Phase 4 (review-only): no mobile work. The reviews gap closed itself on
  `main` (real `reviewsService` + tenancy eligibility); chat/notifications
  web additions and mobile admin remain out of scope.
- Regression: mobile `tsc` clean, jest 394/394, `expo lint` clean; web `tsc`
  clean, dashboard `node:test` 3/3, `next build` passes (web `eslint` failures
  pre-date this work in untouched files).
