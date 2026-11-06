# First-Time Tutorial (Mobile + Web) — Revised Plan

Status: plan only, nothing implemented. Replaces the pasted draft. Targets below were checked against the repo on 2026-11-06; re-verify before building.

## 1. Corrections to the original draft

| Draft assumption | Reality | Resolution |
|---|---|---|
| An existing Tutorial section in Account/Profile | None exists. Mobile has Settings → "Help & Support"; web has Settings → `HelpTab`. | Add a dedicated "Tutorial" row to Settings on each platform (new work). |
| Tenant "Home" tab | Mobile tenant tabs: Rentals, Search, Chat, Profile. Web tenant nav: Browse, My Rental, Maintenance, Messages (+ Favorites etc.). | Steps map to real targets (section 4). |
| Landlord "My Properties" tab on mobile | Mobile landlord tabs: Dashboard, Units, Chat, Profile. Web: "My Properties". | Per-platform labels. |
| Apartment Details step | Needs navigating into a listing. | Folded into the Explore step; the tour never navigates. |
| Spotlight any tab | iOS uses `NativeTabs` (native views, not measurable). | iOS tab steps use a caption sheet; Android/web spotlight. |
| Only landlord verification matters | Unverified tenants also cannot apply, request visits or message. | Gate both roles (section 5). |
| Persist "using existing structure" | `public.users` is server-managed; no tutorial flag exists. | New small table (section 2). |

## 2. Persistence (the only schema change)

Migration `public.tutorial_progress`, modelled on `notification_preferences`:

- `user_id uuid references public.users(id) on delete cascade`, `portal text check (portal in ('tenant','landlord'))`, `completed_at timestamptz`, `skipped_at timestamptz`, `updated_at`; primary key `(user_id, portal)`.
- RLS: owner only (`user_id = (select id from public.users where user_id = auth.uid())`), select/insert/update; no delete. Restrictive active-account policy like sibling tables.
- No row means "not seen". Completed or skipped both stop the auto-prompt; replay is always manual and never writes a new "unseen" state.
- Backfill in the same migration (confirmed): insert completed rows, for each portal the user holds, for existing users whose profile is complete, so current users are not prompted on release. Accounts created later (including a portal added later through `grant_user_role`) have no row and get the tour.
- Apply the migration before releasing web or mobile; never fall back to local storage as the source of truth. A failed read fails closed (no auto-prompt).
- Admins and suspended accounts never see it. Dual-role users are tracked per portal.

## 3. Shared code (`@repo/utils`, `tutorial.ts`, pure, tested in the mobile Jest suite via `roots`)

- `TutorialPortal`, `TutorialStep` (`id`, `title`, `body`, `targetKey`, `requires`), step lists per portal.
- `getTutorialSteps(portal, { platform, accountStatus, hasActiveTenancy })`: filters steps to what the viewer can use today; returns `[]` when nothing is usable.
- `shouldAutoStartTutorial({ portal, progressRow, profileComplete, suspended, isAdminOnly })`.
- Copy lives here so both platforms say the same thing (short; no sensitive data).
- Service functions read/upsert the table through each platform's Supabase client (web `service/`, mobile `service/tutorial/`); components never import the client.
- No new dependency. Overlay and spotlight are built in-house.

## 4. Steps (all targets are stable keys, never positions)

Targets are `data-tour="<key>"` on web and a ref registry keyed by the same string on mobile. A missing target drops that step silently (or shows it as a centered card); the tour never crashes or blocks navigation.

### Tenant

| # | Step | Mobile target | Web target | Notes |
|---|---|---|---|---|
| 1 | Rentals / My Rental | Rentals tab | "My Rental" nav | Lease, payments, maintenance. Explain without requiring a tenancy. |
| 2 | Explore | Search tab (+ filters/map entry if visible) | "Browse" nav | Filters, map search, apartment pages (photos, amenities, terms, landlord). |
| 3 | Applications & visits | Quick action / applications entry on Rentals | "Applications" entry | Verified tenants only. |
| 4 | Messages | Chat tab | "Messages" nav | Verified tenants only. |
| 5 | Maintenance | Entry on Rentals | "Maintenance" nav | Tenants with an active tenancy only; otherwise skipped. |

### Landlord (verified)

| # | Step | Mobile target | Web target |
|---|---|---|---|
| 1 | Dashboard | Dashboard tab | "Dashboard" nav |
| 2 | Properties and listings | Units tab (add-listing action) | "My Properties" nav (create action) |
| 3 | Applications | Applications entry | "Applications" nav |
| 4 | Messages | Chat tab | "Messages" nav |
| 5 | Rental management | Payments / maintenance entries | "Payments" and "Maintenance" nav |

## 5. Access rules

- Steps come from `getTutorialSteps`, which uses the existing helpers (`canUseLandlordFeatures`, `isLandlordAccessBlocked`) and the tenant verification rule, never UI guesses.
- Unverified or pending landlord: the verify wall is the whole experience, so no tour is started. If a landlord has an active tenancy, only Payments and Maintenance may appear (matches `isLandlordRouteOpenWhileUnverified`).
- Unverified tenant: Rentals/Explore steps only; Applications and Messages are omitted.
- Verification later completing does not re-trigger the tutorial; replay shows the newly available steps.

## 6. Trigger and flow

- Auto-start once per portal, after onboarding is done (`needsProfileOnboarding` false), the portal layout has rendered, and the progress read has settled.
  - Mobile: in the tenant/landlord tabs layouts, foreground tab only; queued behind the review-unlock prompt and the app-update dialogs so overlays never stack.
  - Web: in the portal layouts via a client component mounted after first paint (avoids HeroUI `inert` overlay race); not on modal/route-guard screens.
- Welcome card (APT welcome, one-line value, **Start Tutorial** / **Skip**).
- Steps: title, short description, "Step n of N", **Back / Next / Skip Tutorial**, **Finish** on the last. Completion card, then writes `completed_at`; Skip writes `skipped_at`.
- Esc (web) and Android Back act as Skip. Interrupted tours (app killed, navigation away) write nothing and resume with the welcome card next session.
- Replay: a dedicated "Tutorial" row in Settings (mobile Settings screen; web Settings modal, which closes before the tour starts). Runs the same steps for the active portal, writes nothing unless finished, and is available even after completion.

## 7. Mobile implementation notes

- `components/tutorial/` (one component per file): `TutorialProvider`, `TutorialTarget` (registers ref, measures with `measureInWindow`), `TutorialOverlay`, `TutorialCard`. State in a Zustand store with `reset()`; server state through React Query keyed by Auth ID + portal.
- Scroll target into view before measuring; re-measure on layout, rotation and keyboard events. Force the Android `CustomTabBar` visible during the tour (`TabBarVisibilityContext`).
- iOS `NativeTabs`: no spotlight on tabs; show the step as a bottom card that names the tab with its icon.
- Use HeroUI Native + Uniwind tokens, Nunito headings / Inter body, Reanimated for subtle transitions; respect reduced motion.
- JS-only change, so it can ship as an OTA update after the migration is applied.

## 8. Web implementation notes

- `app/components/tutorial/`: `TutorialTour` (client), spotlight via `getBoundingClientRect` on `[data-tour]` with resize/scroll observers, popover placed with the existing HeroUI `Popover`/positioning; fallback centered card when the target is hidden.
- Mobile-width sidebar is collapsed: open it for nav steps or use a centered card below `md`.
- Does not touch `data-fab-clearance` controls; tour layer sits above the notification bell without changing its saved placement.
- Never nest inside Settings modal; replay closes Settings first (same pattern as Change Password).
- Tailwind + HeroUI tokens from DESIGN.md; focus is trapped in the card, visible focus rings, labelled controls.

## 9. Documentation and housekeeping

- Update AGENTS.md (new convention + table), DESIGN.md (tour UI), ARCHITECTURE.md (flow), design-tokens.json only if tokens change.
- Run `graphify update .` after code changes. No commits unless asked.

## 10. Verification checklist

Automated:
- Jest: step filtering by portal/verification/tenancy, `shouldAutoStartTutorial`, backfill-shaped rows, missing-target handling.
- Web `node:test` for the same pure helpers; `pnpm --filter web lint typecheck test`; `pnpm --filter mobile lint test`.
- SQL test (pgTAP, scoped fixtures): owner-only RLS, per-portal uniqueness, no cross-user reads/writes.

Manual (both platforms):
- New tenant and new landlord see their own tour only; dual-role tracked separately.
- Next/Back/Skip/Finish; completion survives sign-out/sign-in and syncs across web and mobile.
- Completed or skipped users are not prompted; replay works from Settings.
- Unverified landlord/tenant never see steps for blocked features.
- Small screens, rotation, iOS caption fallback, Android spotlight, narrow web widths.
- No change to existing navigation or flows when the tour is dismissed.

## 11. Decisions (confirmed)

1. Backfill: existing users with a complete profile are marked completed by the migration, so only new accounts get the auto-prompt.
2. Replay entry: a dedicated "Tutorial" row in Settings on both platforms (mobile Settings screen, web Settings modal), which starts the tutorial for the active portal. It is not placed inside Help & Support.
