# APT Passport — Web Mirroring Plan

Status: Implemented (2026-10-09). All phases are coded and open as stacked PRs #156–#160 (`ci` passing on #156–#159, running on #160); signed-in browser checks and merge are pending (see §11). D4 stays out of scope.
Scope: `apps/web` (tenant + landlord portals), shared logic in `packages/`. No new database migration is required.
Goal: Bring the web to parity with the mobile APT Passport work shipped on `feature/user-passport` (PR #155): a tenant Passport wallet, applying **without uploading documents**, readiness checks, and the landlord/tenant application views — so web and mobile behave the same.

Non-goals:
- No web ID capture. Identity verification (live capture + selfie) stays on mobile; the web keeps using the QR flow in `app/verify`.
- No change to the database rules, RLS, storage policies or triggers (already enforced for every client, see §3).
- No web notification feed (decision D4 — separate plan if wanted).
- No redesign of the admin Passport review (it already exists on web).

## 1. What mobile shipped (the reference to mirror)

| # | Mobile feature | Where (mobile) |
|---|---|---|
| M1 | **Passport wallet**: primary verified ID card (front/back), supporting-document grid/list, empty state | `app/document-id/index.tsx`, `components/ValidIdCard.tsx`, `DocumentCard.tsx` |
| M2 | **Add document**: pick a type → upload (JPG/PNG/PDF ≤ 5 MB) + optional expiry date + truth confirmation + legal notice | `select-document.tsx`, `upload.tsx`, `service/passport/passportService.ts` |
| M3 | **Document detail**: preview (image/PDF/file), status chip (Unverified / Under review / Verified / Rejected / Expired), request verification, delete | `app/document-id/[documentId].tsx` |
| M4 | **Primary ID auto-link** from the approved account verification (`linkApprovedVerification`) | `passportService.ts` |
| M5 | **Apply with the Passport — no upload step**: flow is summary → tenant info → preferences → review; documents attached by reference (`selectPassportDocsForApplication`: best match per slot, never expired/rejected) | `app/apartment/[apartmentId]/apply/*`, `hooks/applications/useSubmitApplication.ts` |
| M6 | **Readiness checks** (verified account, not own listing, no pending application, complete Passport) with fix buttons; same checks re-run at submit | `service/applications/applicationReadiness.ts`, `ApplicationIssues.tsx` |
| M7 | **Guidelines sheet** ("Before you apply") opened on the summary + a link to reopen; "Your APT Passport is submitted automatically" notice on summary and review | `ApplicationGuidelinesSheet.tsx`, `PassportNotice.tsx` |
| M8 | **ID back** shared with the landlord (`gov_id_back_url`); ID front/back resolved from the `user-verification` bucket by path shape, 15-minute links | `privateMediaResolver.ts` |
| M9 | **Landlord application page**: card sections, ID front + back with Verified badges, PDFs open, empty optional slots read "Not provided" | `app/landlord/tenant-applications/[applicationId].tsx` |
| M10 | **Notifications**: landlord notified of new applications; admin Passport notifications routed away from tenant screens | migration `20261008040000…`, `utils/notificationDeepLink.ts` |
| M11 | Expired-verified documents show **Expired**, not Verified (detail, list, landlord badge) | `passportService.ts`, `[documentId].tsx` |

## 2. Web state before this work (verified 2026-10-08)

| Area | Web today | Gap vs mobile |
|---|---|---|
| Tenant Passport wallet | **Does not exist.** Only `use-passport-verified-paths.ts` + `fetchPassportVerifiedPaths` (landlord badge) | M1–M4, M11 |
| Apply flow | `app/browse/[apartmentId]/apply/components/ApplyClient.tsx` (855 lines, 6 steps, step 4 = upload). Rendered by **two** routes: `/browse/[apartmentId]/apply` and `/tenant/browse/[apartmentId]/apply` | M5–M7 |
| Submit | `hooks/use-submit-application.ts` uploads files to `application-documents/{tenantId}/{folderId}/…` then inserts via `service/tenantApplicationsService.ts`. DB message now passes through (this PR) | M5 |
| Verification entry | `app/verify` (QR session; phone completes capture), tenant profile shows `account_status` | Needs "Passport locked until verified" + CTA |
| Landlord application page | `app/landlord/applications/[applicationId]/page.tsx` (403 lines, already a card-style dashboard): shows **ID back** when present; resolver routes ID front/back to `user-verification` (this PR). Defines its own local `DetailField`/`DocumentRow`; an empty slot reads "Not submitted" (mobile: "Not provided") | M9: wording parity + browser check of badges; no new layout needed |
| Tenant application detail | `app/tenant/applications/[applicationId]/page.tsx` (358 lines) already imports the shared `DetailField`/`DocumentRow` from `app/tenant/applications/components/`; ID back is included via the service (this PR) | Browser check of the ID back row; no layout change |
| Admin Passport review | Exists: `app/admin/verification` + `documents/[id]` + `reviewPassportDocument` | None (admin `passportReview` notifications have no web feed to land in — D4) |
| Notifications | Preferences tab only (`app/components/settings/tabs/NotificationsTab.tsx`); no feed/bell | M10 (D4) |
| Tests / CI | Web has only `lib/*.test.mjs`; CI runs **mobile** lint + jest only | Web changes are not covered by CI (§8) |

## 3. Backend facts the web can rely on (nothing to build)

The database already enforces, for every client (`supabase/migrations/20261008*`):
- Owners cannot insert pre-verified/primary Passport rows, swap the file of a pending/verified one, or delete primary / under-review rows.
- New applications require a **verified account**, proof of income unless Student/Unemployed, and every document path must be the applicant's own and valid (existing file, non-rejected, non-expired; ID captures only in the ID slot; ID back paired with the ID). Documents/tenant/apartment are frozen after submit.
- Landlords can read exactly the applicant's referenced ID front + back (never the selfie).
- Landlords are notified of new applications.

Consequences for the web: errors arrive as user-facing messages (surface them as-is, already done in `insertTenantApplication`); a web tenant who is not verified is **already blocked** at submit, so the web UI should say so *before* the user fills the form.

Storage limits to respect in the browser: bucket `application-documents` accepts JPEG/PNG/WebP/PDF up to 10 MB (mobile caps at 5 MB client-side; keep 5 MB for parity). HEIC is not accepted.

## 4. Decisions

| # | Decision | Recommendation |
|---|---|---|
| D1 | Route layout | `/tenant/passport` (list), `/tenant/passport/add`, `/tenant/passport/[documentId]`. Shared components in `app/components/passport/`; landlord routes (`/landlord/passport…`) in a later phase because mobile exposes the Passport to both roles. **As built:** adding a document is a two-step modal on the wallet driven by `?add=1` / `?add=<type>`; `/…/passport/add` redirects there |
| D2 | Where shared logic lives | New workspace package **`@repo/passport`** (pure TS, no platform deps, `src/` + barrel `index.ts` per AGENTS) holding: document selection, readiness evaluation, expiry helpers, ID path-shape helper, slot labels, document-type descriptions. Mobile re-imports it (no behaviour change). Alternative: a `passport/` folder in `@repo/utils` (fewer packages, more coupling) |
| D3 | Test runner for shared logic | Run the shared tests in the **mobile jest suite** (CI already runs it; fast-check available) via an added `roots`/mapper entry. Alternative: `node --test` with type-stripping (Node 22.17 needs the flag) |
| D4 | Web notifications | **Out of scope.** There is no feed to host the landlord "new application" or admin `passportReview` items. If wanted: separate plan for a web notification bell/feed; admin items would deep-link to `/admin/verification/documents/{id}` |
| D5 | Landlord Passport on web | Include after the tenant flow (Phase 5) — mobile exposes it to both roles; same components, role-prefixed routes |
| D6 | Upload UX / compression | File input (`accept` JPG/PNG/WebP/PDF, ≤ 5 MB) with the same expiry + confirmation + legal notice. **No new compression dependency**; rely on the 5 MB cap |
| D7 | Previews | ~~Images via `<img>`/`next/image` with a signed URL; PDFs and other files open in a new tab. No embedded PDF viewer~~ **Superseded:** PDFs show a page-1 thumbnail rendered client-side with `pdfjs-dist` (`app/components/display/PdfThumbnail.tsx`, lazy, cached per storage path); the full file still opens in a new tab |

## 5. Implementation phases

Each phase is one PR (or one reviewable commit group) and leaves the web working.

### Phase 0 — Extract shared logic (no behaviour change)
1. Create `packages/passport` (`package.json`, `tsconfig.json`, `src/index.ts`) — named exports only.
   - Keep it platform-free: define a structural Passport-document type for its pure functions rather than importing `Database` or either app's Supabase client. Declare its `@repo/constants` workspace dependency.
2. Move from mobile into it (generic over the Supabase `passport_documents` row type):
   - `selectPassportDocsForApplication`, `passportDocsForSlot` (from `service/passport/passportService.ts`)
   - `evaluateApplicationReadiness`, `APPLICATION_SLOT_LABELS` (from `service/applications/applicationReadiness.ts`)
   - `toExpiryDateString`, `isExpiredDate`, `validateExpiryDate` (from `service/passport/expiry.ts`)
   - `isVerifiedIdPath` (from `service/media/privateMediaResolver.ts`) and the web copy in `service/applicationDocumentsService.ts` → one implementation
   - `getDocumentTypeDescription` (from `app/document-id/utils/documentTypeDescriptions.ts`)
3. Mobile imports from `@repo/passport`; split the existing pure selection/readiness/expiry/path-shape tests from mobile service tests and run them in the mobile Jest suite. If those tests live under `packages/passport`, explicitly add that directory to Jest `roots`; otherwise keep the tests under `apps/mobile` and import the package. Keep every mobile test green.
4. Add `@repo/passport` as a workspace dependency of both apps and update `pnpm-lock.yaml`.
5. Update `AGENTS.md` (shared packages table).

### Phase 1 — Web Passport wallet (tenant)
1. **Service** `apps/web/service/passportService.ts` (browser client from `@repo/supabase/browser`, never the default `@repo/supabase`): `fetchPassportDocuments` (+ link approved verification, idempotent), `uploadPassportDocument` (`application-documents/{userId}/passport/{slug}-{ts}.{ext}`), `deletePassportDocument` (same guards: primary, under review, attached to an active application), `requestPassportDocumentReview`.
   - Enforce the browser upload contract in the service as well as the input: JPEG/PNG/WebP/PDF only, no HEIC, and at most 5 MB. Never trust only the HTML `accept` attribute.
2. **Hook** `hooks/use-passport-documents.ts` (`"use client"`, local state; no global context per AGENTS).
3. **Route guard:** add a tenant Passport layout/guard covering `/tenant/passport`, `/tenant/passport/add`, and `/tenant/passport/[documentId]`. Only `account_status === "verified"` may enter any of these routes; pending accounts return to `/tenant/profile`, and other unverified/rejected accounts go to `/verify`. Do not rely on the landing-page locked UI because direct deep links to add/detail must also be blocked.
4. **Pages** (server page fetches the profile, passes props to a `*Client` child):
   - `app/tenant/passport/page.tsx` → `PassportClient` — primary ID card (front/back flip or side-by-side), supporting docs grid, expired/pending/verified chips, and an empty state. The route guard handles non-verified accounts before this client renders.
   - `app/tenant/passport/add/page.tsx` — type picker → upload form (file, expiry date, confirmation checkbox, legal notice dialog). Identity document types route to `/verify` exactly like mobile.
   - `app/tenant/passport/[documentId]/page.tsx` — preview, dates, status, rejection reason, Request Verification / Request Review Again, Delete (confirm dialog), expired banner.
5. Entry points: tenant sidebar item + a card on the tenant profile page. Add the sidebar entry to `app/tenant/layout.tsx`'s `TENANT_NAV` (which also supplies the mobile menu), not by changing `AppSidebar` itself.
6. Reuse HeroUI v3 (`Chip variant="soft"`, `Modal`) and `DESIGN.md` card spec (`rounded-2xl`, hairline border, no shadow on mobile; web cards `rounded-xl`/`rounded-2xl`).
7. Signed URLs for previews: reuse `resolveApplicationDocumentUrls` (ID front/back from `user-verification`, 15-minute links; others from `application-documents`).

### Phase 2 — Apply flow without uploads
1. Server page(s) (`/browse/[apartmentId]/apply` and `/tenant/browse/[apartmentId]/apply` — keep both, they share `ApplyClient`) use one shared loader for: the signed-in user's internal profile (`id`, `roles`, `account_status`), apartment landlord id, tenant's pending applications for this apartment, and Passport rows. Redirect signed-out users to `/sign-in` and authenticated users without the tenant role to `/browse`. Compute `evaluateApplicationReadiness` from `@repo/passport` and pass `initialReadiness` to the client. **As built:** the loader (`load-apply-page.ts`) passes viewer, apartment and pending state only; readiness is computed on the client (`use-application-readiness`) because loading the Passport links the verified ID, a write that must not run during server rendering. Submit re-reads everything fresh.
2. Split the 855-line `ApplyClient` into step components (`TenantInfoStep`, `PreferencesStep`, `ReviewStep`, `SubmittedStep`) + a small orchestrator; **delete step 4 (upload)**; progress becomes 3 steps (matches mobile `ApplicationHeader`).
3. **Readiness gate** on entry: blocking cards with fix CTAs (`/verify`, `/tenant/passport/add`, "view my applications"); Continue disabled until clear. Same messages as mobile (`ApplicationIssues`).
4. **Guidelines modal** (HeroUI `Modal`) opened on first load, reopened by a "View application guidelines" link; copy identical to `ApplicationGuidelinesSheet`.
5. **Review step**: "APT Passport Documents" section listing the document chosen per slot (Verified tag, "(front & back)" for a linked ID, "Not provided (optional)" for NBI) + the "submitted automatically" notice. Proof of income required only when the employment type needs it (re-evaluate readiness when the employment type changes).
6. Rewrite `hooks/use-submit-application.ts` to attach by reference. At submit, freshly read the tenant profile/account status, apartment landlord ID, active application state, and Passport rows; re-run `evaluateApplicationReadiness` before inserting. Insert `gov_id_url`, `gov_id_back_url` (only when verification-linked), income, billing, and NBI from the fresh selection; no uploads or cleanup logic. Add `gov_id_back_url` to `InsertTenantApplicationPayload`. Surface DB messages as-is.
7. Remove dead code: `uploadApplicationDocument`, `removeApplicationDocuments`, `ApplicationDocKey`, upload UI state/validation in `ApplyClient`.

### Phase 3 — Landlord application page parity (verify, small edits)
1. Update web `fetchPassportVerifiedPaths` to select `expires_at` and use shared `isExpiredDate`; it must return only verified, unexpired front/back paths. Add a focused test for the expired-document case before relying on the badge.
2. Confirm in a browser: ID front + back rows, Verified badges (front and back via `fetchPassportVerifiedPaths`), PDFs open, expired-verified shows no badge.
3. Change the empty-slot wording from "Not submitted" to **"Not provided"** to match mobile.
4. Optional tidy: the page defines local `DetailField`/`DocumentRow`; reuse the shared ones in `app/tenant/applications/components/` (or move both to `app/components/display/`) so the two web pages stop diverging. **Not done:** the landlord rows keep their dense style and Verified badge; both pages now share the data list instead (`lib/application-documents.ts`).
5. Keep the existing dense dashboard layout (already card-based); no restructure.

### Phase 4 — Tenant application detail parity
1. Update `tenantApplicationsService` and/or the tenant detail's document mapping so all Passport slots render, including null optional values. `DocumentRow` must show **"Not provided (optional)"** for absent NBI and **"Not provided"** for other absent rows; it currently omits null rows and calls the empty state "Not uploaded".
2. Confirm in a browser that the ID back is listed (it comes from the shared service) and that empty optional slots use the required wording.
3. Keep the current layout (mobile's tenant page intentionally stays an accordion).

### Phase 5 — Landlord Passport on web (D5)
1. Add `app/landlord/passport/*` reusing the Phase 1 components with the landlord layout and a role-aware back link.
2. Landlord sidebar/profile entry with the same verified-only route guard; update `app/landlord/layout.tsx`'s `LANDLORD_NAV` rather than `AppSidebar`.

### Phase 6 — Docs and guard rails
1. `AGENTS.md`: web Passport routes, shared package, "web apply attaches Passport documents; never uploads".
2. `DESIGN.md`: web Passport cards, guidelines modal, readiness cards.
3. Add web verification steps to the existing required `ci` job: `pnpm --filter web lint` and `pnpm --filter web exec tsc --noEmit` (or add and call an equivalent `web` `typecheck` script). Do not create an unrequired parallel job that leaves the protected `ci` check without web coverage.
4. Update `docs/plans/apt-passport-document-detail-redesign.md` status note to point here for web.

## 6. Files (expected)

New: `packages/passport/**`, `apps/web/service/passportService.ts`, `apps/web/hooks/use-passport-documents.ts`, `apps/web/app/tenant/passport/**`, `apps/web/app/components/passport/**`, ApplyClient step components under `apps/web/app/browse/[apartmentId]/apply/components/`.
Changed: both app `package.json` files, `pnpm-lock.yaml`, mobile Jest config if package tests are discovered outside `apps/mobile`, `ApplyClient.tsx`, both apply `page.tsx` files (`app/browse/[apartmentId]/apply/` and `app/tenant/browse/[apartmentId]/apply/`) plus their shared loader, `hooks/use-submit-application.ts`, `service/applicationDocumentsService.ts`, `service/tenantApplicationsService.ts`, tenant `DocumentRow`, tenant/landlord application pages (wording), `app/tenant/layout.tsx` + `app/landlord/layout.tsx` navigation and tenant profile page, mobile imports (Phase 0), `.github/workflows/ci.yml`, `AGENTS.md`, `DESIGN.md`.
Removed: upload helpers and step 4 UI.

## 7. Risks and edge cases

- **ApplyClient rewrite (855 lines, two routes)** is the riskiest change. Mitigation: split into step components first (pure refactor), then remove the upload step in a second commit; manual test on both routes.
- **Dual-role users**: a user can be tenant + landlord (+ admin). Readiness must still block applying to your own listing (DB also blocks); Passport routes are role-prefixed, so a dual-role user sees the Passport in whichever portal they are in.
- **Unverified web tenants** were previously able to apply on web; they are now blocked by the database. The gate must appear before the form, with a clear path to `/verify`.
- **Signed URL lifetime**: ID links are 15 minutes. Do not cache them in server-rendered HTML; resolve on the client or re-sign on focus.
- **Stale Passport state in the apply flow**: re-read the Passport at submit (as mobile does) so a document that expired between the review step and submit is caught.
- **Stale readiness inputs at submit**: re-read account status, apartment ownership, and active applications with the Passport rows before inserting. Client readiness is feedback only; database guards remain authoritative.
- ~~**No web CI coverage** today~~ **Resolved (PR E):** the required `ci` job runs web lint, typecheck and tests; the 40 pre-existing web lint problems were fixed first.
- **Supabase client rule**: use `@supabase/ssr` helpers (`@repo/supabase/browser|server`), never the mobile-oriented default export.

## 8. Testing

- Shared logic (`@repo/passport`): the mobile unit tests move with the code (selection, readiness, expiry, path-shape) — D3.
- Web: no component test runner exists. Cover the new pure helpers via the shared package and add focused tests for expiry-aware verified paths, all document-slot placeholder wording, and reference-only submission; verify pages manually against the checklist below; add `lib/*.test.mjs` only for pure web helpers.
- Database behaviour is already covered by the rolled-back dry runs and `supabase/tests/passport_and_applications.test.sql`; re-run those assertions if any migration is later added.

## 9. Acceptance criteria

Legend: [x] done and verified · [ ] code complete, signed-in browser check pending.

- [x] `@repo/passport` exists; mobile uses it; full mobile suite still green (80 suites / 558 tests).
- [ ] A verified web tenant can add, preview, request review of, and delete Passport documents; the primary ID is linked automatically; expired documents show Expired. *(Expired status covered by `status.test.ts`; flows need a signed-in run.)*
- [ ] An unverified web tenant cannot reach any Passport route by navigation or direct URL and sees a locked apply gate with a working link to `/verify`. *(Server guard in place; signed-out redirects verified in the browser.)*
- [x] Web apply flow has **no upload step**; documents are attached from the Passport; the guidelines modal and the "submitted automatically" notice are shown.
- [ ] Missing / expired Passport documents block Continue and Submit with a fix link; proof of income is required only for employed tenants. *(Readiness rules covered by `readiness.test.ts`; UI needs a signed-in run.)*
- [ ] A submitted web application looks identical in the database to a mobile one (paths by reference, `gov_id_back_url` only for a verification-linked ID).
- [ ] Landlord (web) opens ID front, ID back, PDFs; empty slots read "Not provided"; verified badges correct. *(Expired-badge rule covered by `verifiedPaths.test.ts`.)*
- [ ] Tenant (web) application detail lists the ID back; all document slots render and empty optional slots read "Not provided (optional)" while other absent rows read "Not provided". *(Wording covered by `application-documents.test.mjs`.)*
- [x] No leftover upload helpers; `pnpm --filter web lint` and `tsc --noEmit` clean.
- [x] `AGENTS.md` / `DESIGN.md` updated.

## 10. Delivery order

| PR | Phases | Branch | Status |
|---|---|---|---|
| A — [#156](https://github.com/aurickwilliam/apt-rental-platform/pull/156) | 0 — shared `@repo/passport` | `feature/passport-shared-package` → `main` | Open, `ci` passing |
| B — [#157](https://github.com/aurickwilliam/apt-rental-platform/pull/157) | 1 — tenant Passport wallet (+ full-width layout, add modal, PDF previews) | `feature/web-passport-wallet` → A | Open, `ci` passing |
| C — [#158](https://github.com/aurickwilliam/apt-rental-platform/pull/158) | 2 + 4 — apply without uploads, tenant detail wording | `feature/web-apply-passport` → B | Open, `ci` passing |
| D — [#159](https://github.com/aurickwilliam/apt-rental-platform/pull/159) | 3 + 5 — landlord page parity, landlord Passport | `feature/landlord-passport-parity` → C | Open, `ci` passing |
| E — [#160](https://github.com/aurickwilliam/apt-rental-platform/pull/160) | 6 — web lint clean, web checks in `ci`, docs | `feature/web-ci-guardrails` → D | Open, `ci` running (first run of the web steps) |

Merge in order A → E; each PR retargets to `main` when the one below it merges. D4 (web notification feed) was not started and needs its own plan if wanted.

## 11. Implementation notes (2026-10-09)

What shipped beyond or differently from the phases above:

- **Layout:** Passport pages use the full portal width (`PassportPageShell`, `w-full max-w-7xl`) with a two-column `lg` layout — sticky aside (verified ID with front/back flip, "Application documents" checklist via `getPassportSlotStates`) and a documents section with a grid/list toggle. Loading skeletons mirror the real cards. The checklist is tenant-only.
- **Shared logic added to `@repo/passport`:** `getPassportDocumentStatus`, `getPassportSlotStates` (now used by `selectPassportDocsForApplication`), `verifiedPassportPaths` (mobile and web badge checks).
- **Web helpers with `node:test` suites:** `lib/passport-upload.ts` (5 MB, JPG/PNG/WebP/PDF, no HEIC), `lib/passport-access.ts` (guard redirects), `lib/application-documents.ts` (slot list + "Not provided" wording).
- **New dependency:** `pdfjs-dist@6.3.289` for PDF thumbnails (D7 superseded).
- **Delete order:** web deletes the Passport row before the storage file, so a refused delete never loses the file (mobile deletes the file first).
- **Web hooks (PR E):** data hooks load through `hooks/use-async-resource.ts`; browser-only values use `useSyncExternalStore`. Found and fixed along the way: stale `next` redirect in Google sign-in, stale responses applied by data hooks, carousel `reInit` listener never removed.
- **Docs fixes:** `AGENTS.md` pnpm version corrected to 10.34.5 and CI facts updated.

Still to do before merge (needs a signed-in account):
1. Verified tenant: add an image and a PDF document, request verification, delete; Back closes the add modal; checklist Add buttons.
2. Pending and unverified tenant/landlord: Passport routes redirect (including direct links).
3. Apply end to end as a verified tenant; blocked states for a missing document, an unverified account, and an employed tenant without proof of income.
4. Compare a web-submitted application row with a mobile one.
5. Landlord application page: ID front/back, PDFs, badges (including an expired verified document), "Not provided" wording.
6. Click through pages using the reworked data hooks (My Rental, payments, maintenance, messages, favorites, landlord applications/visits/maintenance).
