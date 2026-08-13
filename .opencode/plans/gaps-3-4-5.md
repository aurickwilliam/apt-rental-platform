# Plan: Gaps 3/4/5 — Remaining egress-fix work (client-only)

Branch: `performance/egress-fix` (2 commits ahead of `main`: `8740ca8`, `678f376`)
Status: **approved by user** (all client-only; m1 RPC deferred). Execution blocked by plan mode — toggle off to implement.

## Scope

- **Gap 3** — migrate remaining `useState` + `useFocusEffect` fetch hooks/screens to keyed React Query (C6 residue).
- **Gap 4** — m3 (badge apartment-ID cache), m7 (shared `useConversations`), m8 (application-action invalidation). **m1 deferred** (needs RPC — backend, separately approved task).
- **Gap 5** — M1 payment-state refinement in `useTenancy` (targeted `setQueryData`, not full refetch).

Guardrails: client-only, no schema/policy/RPC/data changes. Preserve existing export shapes. Tests must stay green.

## Conventions (follow existing)

- Query keys: `["domain", id]` with exported `getXQueryKey(id)` helpers; `useCurrentUser()` + `enabled` gating (see `useDashboardStats`, `useFavorites`, `useTenancy`).
- Fetch logic goes in `service/*` files; hooks are thin `useQuery` wrappers; errors surfaced via local `getErrorMessage` helper with fallback text.
- Mutations: optimistic `setQueryData` + rollback + exact-key `invalidateQueries` (see `useFavorites.toggleFavorite`).
- `refreshing` derived as `isFetching && !isLoading` (see `useFavoriteApartments`).
- Keep `useFocusEffect` where it clears badges only (`markViewed` in landlord list screens) — do NOT remove those.

## New service files

### 1. `service/reviewsService.ts`
- `fetchApartmentReviews(apartmentId): Promise<ApartmentReviewRow[]>` (raw rows, joined users/tenancy — moved from `useApartmentReviews`).
- `fetchLandlordReviews(landlordId): Promise<{ reviews: LandlordReview[]; totalCount: number }>` (limit 3 + count; includes image URL mapping).
- `fetchReviewEligibility(apartmentId, tenantId): Promise<string | null>` (reviewable tenancy id).

### 2. `service/profilesService.ts`
- `fetchPublicLandlordProfile(landlordId): Promise<{ profile: LandlordProfileData; listings: LandlordListing[] }>` (users single + apartments with images; mapping incl. thumbnail selection).
- `fetchPublicTenantProfile(tenantId): Promise<{ profile: PublicTenantProfile; pastApartments: PastApartment[] }>` (user + review count + ended tenancies; incl. month/year formatting).

### 3. `service/landlordService.ts`
- `fetchLandlordUnits(landlordId): Promise<{ apartments: Apartment[]; monthlyProfit: number }>` (apartments + `apartment_images` cover selection + profit; from `useLandlordUnits`).
- `fetchLandlordBadges(landlordId): Promise<ActionBadgeCounts>` — includes **m3**: module-level apartment-ID cache (60s TTL) so the `select("id")` lookup is not re-run per fetch; `getLastViewed`/AsyncStorage moves here.
- `fetchLandlordTenancy(apartmentId): Promise<{ tenant; maintenanceRequest; paymentHistory }>` — **parallelize** the 3 queries with `Promise.all` (no inter-dependency).
- `fetchLandlordMaintenanceRequests(landlordId): Promise<LandlordMaintenanceRequest[]>` (query + join mapping + `resolvePrivateMediaUrls`).
- `fetchLandlordApplications(landlordId): Promise<LandlordApplication[]>` (full join + `formatAddress` mapping from `useLandlordApplications`).
- `fetchLandlordVisitRequests(landlordId): Promise<LandlordVisitRequest[]>` (keeps module-level `signedUrlCache` + `resolveApartmentImageUrls` — C5 behavior unchanged).

### 4. `service/maintenanceService.ts`
- `fetchLatestMaintenanceRequest(apartmentId): Promise<MaintenanceRequest | null>` — moves `mapRow` + `MaintenanceRequest`/status types out of the hook; **keep `mapRow` and type re-exports from the hook file** (used by `useMaintenanceRequestHistory`).

### 5. `service/conversationService.ts`
- `fetchConversationsWithMetadata(myId, role: "tenant" | "landlord"): Promise<ConversationWithMeta[]>` — dedupe of the two chat tabs' logic: `getConversations` RPC + chat-table metadata scan (M2 scan **preserved**) + (landlord only) active-tenancy classification into `conversation_type`.

## Hook rewrites (keep exact return shapes)

| Hook | Key | Notes |
|---|---|---|
| `hooks/ratings/useReviewEligibility.ts` | `["review-eligibility", apartmentId, tenantId]` | data = `reviewableTenancyId`; `canReview = data != null`; `checkingEligibility = isLoading` |
| `hooks/ratings/useApartmentReviews.ts` | `["apartment-reviews", apartmentId]` | sort/aggregates stay in hook `useMemo`; `refreshing` derived; remove focus effect |
| `hooks/ratings/useLandlordReviews.ts` | `["landlord-reviews", landlordId]` | remove focus effect |
| `hooks/profiles/usePublicLandlordProfile.ts` | `["public-landlord-profile", landlordId]` | keeps `useLandlordStats` (raw, m1 deferred) + keyed `useLandlordReviews`; remove focus effect |
| `hooks/profiles/usePublicTenantProfile.ts` | `["public-tenant-profile", tenantId]` | remove focus effect |
| `hooks/maintenance-requests/useMaintenanceRequests.ts` | `["maintenance-request-latest", apartmentId]` | `cancelRequest` optimistic via `setQueryData` + rollback |
| `hooks/apartments/useLandlordUnits.ts` | `["landlord-units", landlordId]` | keep `fetchApartments` name as alias of `refetch` |
| `hooks/apartments/useLandlordActionBadges.ts` | `["landlord-badges", landlordId]` | `markViewed` → optimistic `setQueryData` zero + AsyncStorage; keep `fetchCounts` alias |
| `hooks/tenancy/useLandlordTenancy.ts` | `["landlord-tenancy", apartmentId]` | parallel fetch in service |
| `hooks/maintenance-requests/useLandlordMaintenanceRequests.ts` | `["landlord-maintenance", landlordId]` | `updateStatus` optimistic + rollback + `setQueryData` (or refetch); keep `getNextStatus` export |
| `hooks/applications/useLandlordApplications.ts` | `["landlord-applications", landlordId]` | remove `useEffect` auto-fetch |
| `hooks/applications/useApplicationActions.ts` | — | **m8**: after approve/reject success, `invalidateQueries({ queryKey: ["landlord-applications", landlordId], exact: true })` via `useCurrentUser` |
| `hooks/visitRequests/useLandlordVisitRequests.ts` | `["landlord-visit-requests", landlordId]` | remove `useEffect` auto-fetch |
| `hooks/visitRequests/useVisitRequest.ts` | `["visit-request", applicationId, tenantId]` | remove focus effect usage at call site |
| `hooks/chat/useConversations.ts` (new) | `["conversations", myId]` | + realtime INSERT channel → `setQueryData` merge (same splice logic as today); `markConversationRead(key)` → `setQueryData` unread 0; return `{ conversations, loading, refreshing, refetch, markConversationRead }` |

## Screen changes

- `app/(tabs)/(landlord)/units.tsx` — remove `useFocusEffect` block (lines 70–75).
- `app/(tabs)/(tenant)/rentals.tsx` — remove `useFocusEffect` block (lines 120–124).
- `app/landlord/manage-apartment/[apartmentId]/description/index.tsx` — replace local state + `useFocusEffect` with keyed query `["manage-apartment-description", apartmentId]` (service `fetchManageApartmentDescription` → apartment + active tenancy; invalidate after lease upload).
- `app/tenant/applications/[applicationId].tsx` — remove `useFocusEffect` (lines 53–57); keep `refetch()` calls after accept/decline/cancel (now query refetch).
- `app/(tabs)/(tenant)/chat.tsx` + `app/(tabs)/(landlord)/chat.tsx` — consume `useConversations`; delete duplicated fetch/state/realtime logic; `handleChatPress` → `markConversationRead`.
- Landlord list screens (`tenant-applications`, `maintenance-requests`, `visit-requests` index) — **no change** (focus effect = `markViewed` only).
- `app/landlord/visit-requests/[requestId].tsx` — no change (`onSuccess: () => refetch()` now refetches the keyed query).

## Gap 5 — `useTenancy` payment refinement

In the `payment` postgres_changes handler (useTenancy.ts:81–96): replace `invalidateQueries` with targeted `setQueryData`:
- INSERT/UPDATE: merge row into `currentPayment` only when `payload.new.period_start >= current.currentPayment.period_start` (recency gate); else ignore (behavior-preserving: today's full refetch would return the same latest payment).
- DELETE: keep `invalidateQueries` (shape change).
- `tenancies` listener: keep invalidate (already filtered by `tenant_id`).

## Tests (extend existing suite)

- Extend `hooks/tenancy/useTenancy.test.tsx`: payment INSERT/UPDATE applies `setQueryData` without refetch; older-period event leaves cache untouched; DELETE invalidates.
- New `hooks/chat/useConversations.test.tsx`: keyed fetch + metadata + realtime merge + `markConversationRead`.
- New `hooks/applications/useApplicationActions.test.tsx` (m8): approve/reject success invalidates the landlord-applications key.
- Spot characterization (e.g., `useLandlordUnits`): fresh-key reuse within staleTime; refetch bypasses.
- Follow existing test conventions (`tests/audit-fix/*`, `hooks/tenancy/useTenancy.test.tsx`, `hooks/favorites/useFavorites.test.tsx`).

## Verification & finish

1. `pnpm --filter mobile exec jest --runInBand` — all suites green (25 suites today, 148 tests).
2. `pnpm --filter mobile lint`.
3. `graphify update .`.
4. Single commit (e.g., "REFACTORED: Migrate remaining focus-refetch screens to keyed queries (gaps 3/4/5)").
5. AGENTS.md update only if conventions change (not expected).

## Explicitly NOT in scope

- m1 `useLandlordStats` aggregate (backend RPC — separate approved task).
- C5 apartment-image bucket strategy (deferred).
- M2 `get_conversations` RPC security work (blocked).
- `useTenantApplications` (tenant list) — raw `useEffect` already; not focus-refetched; leave as-is.
