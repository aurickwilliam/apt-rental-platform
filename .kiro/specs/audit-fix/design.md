# Audit Fix Bugfix Design

## Overview

This design governs the mobile performance audit remediation using the bug-condition method. It deliberately separates completed safe client work from deployment-, security-, and measurement-dependent work so an unverified recommendation cannot become an implementation task merely because it appears in the audit.

**Current implementation status**

- **Completed — Batches 1–4 safe client slices:** the completed slices establish shared current-user/resource reads, the dashboard stats hook/service, bounded cursor-based chat pagination, message deduplication, and stable chat-channel identities. Batch 4's safe pagination/channel slice is complete; it did not remove chat-list metadata scans or alter the RPC/database contract.
- **Completed — RPC hardening and chat-list metadata-scan removal (2026-08-13):** `get_conversations_v2()` was deployed (zero arguments, identity from `auth.uid()` via `public.users.id`, authenticated/service_role only, empty `search_path`); execution of the legacy `get_conversations(uuid)` was restricted to authenticated/service_role; the client now calls v2 first and performs no chat/tenancies metadata scan on that path. The legacy scan remains only as a `PGRST202`-gated fallback for clients running before the migration, and the old function is scheduled for removal per the evidence gate below.
- **Live verification passed (2026-08-13):** hardened ACLs were re-checked on the hosted project and a direct `anon` EXECUTE grant (which survives `revoke from public`) had to be revoked explicitly on both functions; `has_function_privilege` now reads anon=false, authenticated/service_role=true, and the migrations were updated to revoke anon so they are re-runnable. Live A/B parity of v2 versus the legacy RPC matched row sets, ordering, and unread counts; the legacy RPC's `conversation_type` differs for tenant-role callers ('tenant' vs v2's 'inquiry') but was always overridden client-side and is not part of the observable contract.
- **Deferred / blocked:** database query-plan/index work and any remaining data/schema/policy/generated-type change outside the completed work. Direct-URL GIF attachments and binary profile-image upload are implemented client-side but remain deployment/evidence gated (see status table).
- **Evidence-gathering only — Batch 5:** no remaining recommendation is eligible for product implementation until its specific baseline, correctness property, compatibility evidence, and required deployment approval are recorded. In particular, the audit's M6 is the already-completed dashboard inline repeated ID/count flow—not binary image upload.

The documented local characterization evidence is not a staging performance baseline. It establishes source-level/request-cardinality counterexamples and confirms selected client behavior, but it does not establish device transfer, memory, network latency, bucket policy, RLS, query-plan, or release-build results. No application code, dependencies, schema, policies, generated types, stored data, or deployment configuration is changed by this documentation revision.

## Glossary

- **Bug_Condition (C):** An input, lifecycle event, or deployment contract that produces an unnecessary read/signing operation, an unbounded chat page, an over-broad realtime refresh, or an optimization that changes observable behavior without its required evidence.
- **Property (P):** The measurable behavior required when the relevant bug condition holds.
- **Preservation:** Existing authorized domain behavior that must remain unchanged, including RLS boundaries, explicit refresh, mutation visibility, private-media access, chat delivery, component contracts, and user-facing errors.
- **F:** The original behavior before the applicable remediation slice.
- **F′:** The completed or future fixed behavior for that slice.
- **Completed safe client slice:** A client-only change that has passed its local validation and does not require a schema, policy, data, dependency, or deployment-contract change.
- **Deferred:** Work intentionally not implemented because a prerequisite is not approved, not compatible, or not yet evidenced.
- **Blocked:** Work that must not proceed until a security, deployment, schema, RLS, product, or old-client-compatibility gate passes.
- **Evidence-gathering:** Instrumentation, characterization, benchmark, read-only inspection, or contract testing that can decide whether a potential optimization is eligible; it does not change product behavior.
- **Query key:** A stable identifier for a server-data resource and all security/data parameters. It never contains tokens, signed URLs, or display-only state.
- **Cursor:** The `(created_at, id)` boundary used to request the next older message page without a gap or duplicate when timestamps tie.
- **Current user:** The `public.users` row resolved from `auth.uid()`/the authenticated subject through `public.users.user_id`; its internal `public.users.id` remains the ID used by RLS and foreign-key relationships.

## Bug Details

### Bug Condition

Let `X` be mobile data operations and future candidate optimizations. The completed client slices addressed the verified safe-client portions of:

`C_client = { x ∈ X | duplicateEquivalentRead(x) ∨ unboundedMessageRead(x) ∨ unnecessarySigning(x) ∨ unrelatedRealtimeRefresh(x) }`.

The remaining Batch 5 condition is intentionally narrower:

`C_batch5 = { x ∈ X | proposedOptimization(x) ∧ (missingCharacterization(x) ∨ missingMeasurement(x) ∨ missingApprovedContract(x) ∨ wouldChangePreservedBehavior(x)) }`.

A candidate in `C_batch5` is **not eligible for implementation**. It may receive only evidence-gathering work. A user-initiated forced refresh, an exact invalidation after an authorized mutation, a valid cache miss, or a completed/approved optimization is not a bug condition.

**Formal Specification:**

```
FUNCTION isBugCondition(input)
  INPUT: input of type DataOperationOrOptimizationCandidate
  OUTPUT: boolean

  equivalentRead := input.isRead
                    AND sameQueryKeyIsInFlightOrFresh(input.queryKey, 30 seconds)
                    AND NOT input.isManualRefresh
                    AND NOT input.wasExplicitlyInvalidated

  unboundedMessages := input.resource = 'chat-messages'
                       AND input.hasNoPageLimit

  unnecessarySigning := input.resource IS privateStorageResource
                        AND input.storagePathHasUnexpiredSignedUrl

  unrelatedRealtimeRefresh := input.source = 'realtime'
                              AND NOT eventTargetsCurrentResource(input.event, input.resource)

  unapprovedOptimization := input.isProposedOptimization
                            AND (NOT input.hasCharacterization
                                 OR NOT input.hasMeasuredBenefit
                                 OR NOT input.hasApprovedContract
                                 OR NOT input.hasCompatibilityEvidence)

  RETURN equivalentRead
         OR unboundedMessages
         OR unnecessarySigning
         OR unrelatedRealtimeRefresh
         OR unapprovedOptimization
END FUNCTION
```

### Examples

- **Completed safe client behavior:** a 200-message conversation now requests at most 30 newest rows for the initial page, uses a strict older-than `(created_at, id)` cursor for history, and deduplicates paged, optimistic, and broadcast IDs. The remaining conversation-list metadata scan is separate deferred work.
- **Completed RPC metadata work (2026-08-13):** `get_conversations_v2()` is zero-argument and derives identity from `auth.uid()` through `public.users.id`; it returns authoritative `last_sender_id` and `last_message_type` and is restricted to authenticated/service_role. The client stopped its chat/tenancies metadata scan on the v2 path; the legacy scan survives only as the documented `PGRST202` fallback for pre-migration clients, and the old `get_conversations(uuid)` remains authenticated-only pending the removal gate.
- **Evidence-gated profile upload candidate:** `useImageUpload` asks Expo ImagePicker for Base64, decodes it, then uploads it. This source observation is not audit M6 and has no baseline transfer/memory measurement, defined property, or Expo 55 device-compatibility result. Replacing it with a different upload transport now would be an unapproved optimization.
- **Blocked lazy-review candidate:** `useApartmentReviews` fetches all matching rows because it calculates total reviews, overall rating, rating distribution, and client-side sorted review records. A simple client `limit` would change results; it remains blocked until an approved aggregate/summary contract and query-plan evidence exist.
- **Non-bug behavior:** a user explicitly pulls to refresh after a mutation. The request must still run and render the newly authorized server state even if cached data is fresh.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

- RLS remains the final authorization authority. The client continues to use the internal `public.users.id` through the required `auth.uid()` → `public.users.user_id` indirection; no client or RPC work may bypass that model.
- Pull-to-refresh and explicit retry remain forced network actions. Exact successful mutations and relevant realtime updates remain visible on the next render/visit.
- Existing HeroUI Native/Uniwind presentation, loading/error affordances, apartment-card/chat-bubble/maintenance-card prop shapes, and Zustand ownership remain intact.
- Chat text, image, and video delivery, optimistic reconciliation, unread/typing/presence behavior, and existing message interpretation remain intact. Cursor pagination and stable channels must not create duplicate bubbles.
- Authorized users continue to receive authorized, time-limited private-media URLs where applicable. Storage paths and signed URLs are not logged, persisted in query keys, or converted into public credentials.
- `useImageUpload`, unless and until a separately approved future change exists, retains its crop and quality settings, MIME derivation, `${userId}/${userId}.${ext}` path naming, upsert behavior, public-URL cache busting, `users` update, user-facing error handling, and current-user invalidation. The separate apartment edit flow's `fetch(uri).blob()` behavior is not evidence that the profile flow can be changed safely.
- Reviews retain total-count, aggregate-rating, rating-distribution, sorting, error, and review-card behavior until an approved aggregate/summary contract can reproduce those observables.
- Search retains its deterministic sort order and `id` tie breakers for every sort option. It continues to request the exact count until a measured, approved replacement preserves its product contract.
- `@repo/constants` remains the source of static location values until a product-approved source of truth exists. Existing image skeletons/placeholders remain; no generic placeholder defect is presumed.

**Scope:**

Inputs outside `C` are preserved. This includes valid cache misses, different query parameters, manual refreshes, exact mutation invalidations, relevant realtime events, current static locations, existing image-loading states, private-media reads, and all authorization/failure behavior. Batch 5 may not change any of these merely to reduce a theoretical request count.

## Hypothesized Root Cause

1. **Independent server-state ownership — completed safe client remediation.** Local effects previously allowed concurrent/focused consumers to repeat identity and resource queries. Batches 1–2 delivered the approved client foundation and resource slices, including the dashboard stats hook/service. The audit's dashboard M6 is therefore not a Batch 5 candidate.

2. **Unbounded chat and unstable channel lifecycle — completed safe client remediation.** Batch 4 delivered bounded initial pages, deterministic cursors, deduplication, and channel identities stable across callback-only rerenders. It did not—and must not without the gate below—remove conversation-list metadata scans.

3. **Unsafe conversation-RPC authority/contract — confirmed blocker.** The inspected deployed `get_conversations(uuid)` is `SECURITY DEFINER`, permits `PUBLIC`, `anon`, and `authenticated` execution, and trusts a caller-supplied internal user ID. It also lacks authoritative `last_sender_id` and `last_message_type`. This is a security and contract prerequisite, not a reason to make an immediate client/database change. Any future migration requires explicit deployment/security approval, authenticated-only execution, identity derived from `auth.uid()` through `public.users.id` indirection, contract/RLS tests, generated-type coordination, and compatibility testing for supported old clients before the client scan can be removed.

4. **Binary profile-upload transport implemented — gate evidence open.** `useImageUpload` uploads binary bytes via `expo-file-system` `File.bytes()`; no controlled device benchmark yet establishes transfer/memory benefit or Expo 55 release-build compatibility, so the Property 5 gate remains open.

5. **Review aggregation is coupled to the all-row read — confirmed source constraint.** The current hook derives aggregate review state and client sorting from all review rows. Pagination/lazy loading cannot preserve that behavior with a client-only limit; an aggregate/summary contract, RLS semantics, and query-plan evidence are prerequisites.

6. **Search and index claims require deployed plans.** The client already has deterministic primary-sort plus `id` tie breakers. Whether exact count is expensive, whether estimated/no count is acceptable, and which index would help can only be decided from product requirements and deployment query plans.

7. **No established generic placeholder or dynamic-location defect.** Existing image skeleton/placeholders address current loading presentation. Locations intentionally remain static in `@repo/constants`; a dynamic source needs product ownership, data authority, and compatibility design.

## Correctness Properties

Property 1: Completed Safe Client Reads

_For any_ authorized read whose complete query key is already in flight or has non-invalidated fresh data, the completed client flow SHALL return the same authorized resource data to all consumers while issuing at most one equivalent request.

**Validates: Requirements 2.1, 2.2, 2.7, 2.16**

Property 2: Completed Chat Pagination and Channel Stability

_For any_ authorized conversation and page size of 30, the completed client flow SHALL load no more than 30 newest rows initially and, across valid `(created_at, id)` cursors, SHALL return authorized messages exactly once in deterministic descending order; callback-only rerenders SHALL not recreate a channel whose `(currentUserId, otherUserId, apartmentId)` identity is unchanged.

**Validates: Requirements 2.4, 2.6, 2.9, 2.17**

Property 3: Completed Private-Media Resolution

_For any_ private storage path with a locally unexpired signed URL, the completed resolver SHALL reuse it; for a missing or expired path, it SHALL request only the unique missing paths and return only authorized time-limited URLs without changing the stored path.

**Validates: Requirements 2.3, 2.10, 2.11, 2.15**

Property 4: Deferred RPC Metadata Safety

_For any_ future change that removes a conversation-list metadata scan, the replacement SHALL be enabled only after an approved RPC contract derives caller identity from `auth.uid()` through the internal `public.users.id`, restricts execution to the approved authenticated role, supplies authoritative `last_sender_id` and `last_message_type` with defined nullability, passes RLS/security tests, and preserves all supported old-client contract behavior.

**Validates: Requirements 2.8, 2.9, 2.13, 3.4, 3.8, 3.12**

Property 5: Evidence-Gated Profile Upload Candidate

_For any_ proposed change to profile image upload transport, the change SHALL not be implemented unless a controlled Expo 55 device benchmark demonstrates a defined transfer or memory benefit and compatibility evidence proves that crop/quality, MIME/path naming, upsert, cache-busted URL update, database update, errors, and current-user invalidation remain equivalent.

**Validates: Requirements 2.6, 3.1, 3.5, 3.7, 3.11, 3.12**

Property 6: Evidence-Gated Review Summary

_For any_ future review pagination or lazy-loading change, the rendered result SHALL preserve total review count, overall rating, per-rating distribution, permitted sorting, authorized review rows, loading/error behavior, and component shape through an approved aggregate/summary contract; a client-only page limit SHALL not be used as a substitute.

**Validates: Requirements 2.6, 2.16, 3.4, 3.5, 3.8, 3.12**

Property 7: Evidence-Gated Search and Locations

_For any_ search count/index change or dynamic-location proposal, implementation SHALL occur only after its source-of-truth/product contract and deployment query-plan evidence are approved; until then the current deterministic sort/tie breakers, exact count behavior, and `@repo/constants` locations SHALL be preserved.

**Validates: Requirements 2.6, 2.16, 3.5, 3.8, 3.12**

Property 8: Preservation - Mutation, Authorization, and Rendering

_For any_ input where `isBugCondition` returns false, the completed or future flow SHALL produce the same authorized domain data, mutation/refresh visibility, private-media accessibility, loading/error outcome, and established component-facing shapes as F, while preserving RLS and Zustand ownership boundaries.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12**

**Expected-result specification:**

```
FUNCTION expectedBehavior(result, input)
  INPUT: result from F′ and the originating DataOperationOrOptimizationCandidate
  OUTPUT: boolean

  IF input.resource = 'chat-messages' THEN
    RETURN result.initialRows.length <= 30
           AND result.rowsAreCursorOrdered
           AND result.rowsHaveNoDuplicateIds
  END IF

  IF input.isProposedOptimization THEN
    RETURN input.hasCharacterization
           AND input.hasMeasuredBenefit
           AND input.hasApprovedContract
           AND result.preservesDeclaredObservables
  END IF

  IF input.resource IS privateStorageResource THEN
    RETURN result.usesStoragePathsAtRest
           AND result.urlsAreAuthorizedAndUnexpired
           AND result.signingRequestsContainOnlyCacheMisses
  END IF

  RETURN result.authorizedDataMatchesServer
         AND result.preservesDeclaredObservables
END FUNCTION
```

## Fix Implementation

### Status and Decision Gates

| Area | Status | Confirmed fact | Required next evidence or approval | Implementation boundary |
| --- | --- | --- | --- | --- |
| Batches 1–4 safe client scope | **Completed** | Shared client reads, dashboard stats hook/service, bounded chat pages, deduplication, and stable channel identity are implemented and locally validated. | Continue regression validation only. | Do not reopen completed slices as Batch 5 work. |
| Conversation-list metadata scans / `get_conversations` | **Completed — v2 hardened RPC (2026-08-13)** | Deployed `get_conversations_v2()` derives caller identity from `auth.uid()` via `public.users.id`, takes no parameters, executes with empty `search_path`, and is granted to authenticated/service_role only. The legacy `get_conversations(uuid)` keeps its SECURITY DEFINER trusting body but PUBLIC/anon execution was revoked. The client calls v2 first (zero chat/tenancies scans) and falls back to the legacy scan only on `PGRST202` (migration not yet deployed). | Remove the legacy function only after: no supported client logs the PGRST202 fallback for a full release window, staged evidence of the v2 contract for new and prior app versions, and RLS/contract tests re-run. Until then keep the legacy function (authenticated-only). |
| Chat pagination/channel slice | **Completed** | Batch 4's client pagination/channel work is complete. | Preserve its regression tests. | RPC metadata, scan removal, indexes, and direct Giphy URLs remain separate deferred work. |
| DB query plans/indexes | **Blocked — deployment** | No staging `EXPLAIN (ANALYZE, BUFFERS)` evidence is recorded. | Read-only staging plans for exact chat, review, count, and search shapes plus measured regression criteria. | No index migration or client query change based on source assumptions. |
| Direct Giphy URLs | **Client implemented — deployment-approval gated** | GIF picks stage the external CDN URL verbatim into the new `chat.attachment_url` column (no storage upload, no local download); legacy stored attachments unchanged. | Product/security approval, durability confirmation, old-client compatibility, and applying the `attachment_url` migration. | Do not rewrite or change interpretation of legacy stored attachments. |
| Profile upload transport | **Client implemented — evidence gate open** | `useImageUpload` uploads binary via `expo-file-system` `File.bytes()` (Base64 decode and `base64-arraybuffer` removed); apartment edit's `fetch(uri).blob()` is separate. | Controlled Expo 55 device/release benchmark with a defined benefit threshold (Property 5). | No further transport/dependency change or generalization to the apartment edit flow before the gate passes. |
| Reviews lazy loading | **Blocked — aggregate contract and query plan** | All-row fetch supports total count, overall rating, rating distribution, and client sort. | Approved aggregate/summary API/RPC contract, RLS/nullability/old-client validation, and query-plan evidence. | No simple `limit`/lazy page implementation that changes aggregates or sorting. |
| Search counts/indexes | **Blocked — product and query plan** | Existing sort cases already add deterministic `id` tie breakers; current query asks for exact count. | Product decision for count semantics and read-only deployment plans showing measurable need. | No estimated/no-count behavior, index migration, or sort behavior change until approved. |
| Dynamic locations | **Deferred — source of truth** | `@repo/constants` is the current static source. | Product-approved owner, data source, update/rollout, offline, and compatibility contract. | Preserve current constants. |
| Generic image placeholders | **Not a current candidate** | Existing image skeleton/placeholders are present; no defect or measurement establishes a gap. | A reproducible defect plus user-visible/measurement evidence. | Do not add or redesign placeholders. |

### Completed Safe Client Baseline

The completed safe client implementation remains the regression baseline:

- Current-user and selected resource reads share a keyed client data path; explicit refresh/retry and exact mutation invalidation remain intentionally distinct from fresh-cache reads.
- Dashboard logic uses the dedicated stats hook/service delivered in Batch 2. The prior inline repeated apartment-ID/count flow (audit M6) is not eligible for Batch 5.
- Chat requests the first 30 rows and continues history using deterministic `(created_at, id)` cursors. The inverted list continues to deduplicate pagination, realtime, and optimistic IDs.
- Chat channels preserve subscription identity as exactly `(currentUserId, otherUserId, apartmentId)`; changing callbacks alone does not reconnect them.
- The safe client work does not claim to have proved staging latency, device memory, database plans, bucket policy, RLS, RPC safety, or release compatibility beyond the evidence recorded for each slice.

### Deferred Conversation RPC and Metadata Plan

**Implementation status (2026-08-13):** this prerequisite specification was satisfied by the `get_conversations_v2()` migration and the client adapter. Recorded facts against each condition:

1. ✅ Invocation restricted to `authenticated` + `service_role`; `execute` revoked from `public` on both functions.
2. ✅ v2 takes zero parameters; identity resolved from `auth.uid()` → `public.users.id` inside the function; missing user raises an exception.
3. ✅ `SECURITY DEFINER` with `set search_path = ''`; every table/function reference schema-qualified (`public.*`, `auth.uid()`); no dynamic SQL; grants verified via `has_function_privilege` checks.
4. ✅ `last_sender_id` (uuid) and `last_message_type` (text) are additive result columns; `conversation_key` is opaque to clients and defined self-consistently; ordering and unread semantics documented in the migration.
5. ✅ Contract tests (`service/conversationService.test.ts`) cover v2 mapping, the PGRST202-only fallback, and no-silent-swallow behavior; generated types updated in the same change.
6. ⏳ Rollout retains the legacy function (authenticated-only) and the legacy scan adapter as fallback until the removal gate below passes.

**Removal gate for the legacy `get_conversations(uuid)`:** drop it only after (a) no supported app version logs the PGRST202 fallback across a full release window, (b) staging evidence confirms the v2 contract for both the new and prior supported app versions, (c) RLS/contract/privilege checks re-run clean, and (d) the removal is its own two-step migration (revocation first, drop after a soak period).

### Batch 5: Evidence-Gathering and Eligibility Only

Batch 5 is not a generic optimization bucket. It contains only the following evidence-gathering slices, each of which must have a recorded pass decision before a separately approved implementation task can be created.

#### Candidate A — Profile Image Upload Transport

**Scope:** Characterize `useImageUpload` on supported Expo 55 devices/release builds. Measure source asset size/type, payload size, upload transfer time, peak JS/native memory where tooling permits, success/failure rate, and behavior under constrained network conditions. Compare only controlled implementations in an isolated experiment; do not merge dependencies or production changes from that experiment without approval.

**Eligibility criteria:** a pre-declared, statistically meaningful benefit threshold; Expo 55 release-build compatibility; no new native/dependency risk; and preservation tests for avatar/background crop ratio, `quality: 0.8`, chosen MIME type, `${userId}/${userId}.${ext}` naming, `upsert`, cache-busted public URL, `users` row update, `invalidateCurrentUser`, and current user-facing failures.

**Excluded:** the apartment edit flow's `fetch(uri).blob()` implementation is a separate behavior and must not be generalized into this candidate without its own characterization.

#### Candidate B — Reviews Summary/Pagination Contract

**Scope:** First obtain a product-approved and RLS-safe aggregate/summary design that can return total count, overall rating, rating buckets, review-page data, and declared sort semantics. Then capture read-only staging plans and fixture measurements for current versus proposed shapes.

**Eligibility criteria:** contract tests prove identical authorized aggregates and page ordering; null/empty review behavior is defined; the first page and later pages preserve current component shape/loading/error behavior; and plans show measurable benefit.

**Excluded:** adding a client `.limit()` to the existing query, replacing the exact aggregate values with page-local values, or silently changing sort semantics.

#### Candidate C — Search Count and Index Evidence

**Scope:** Record representative filters, sort modes, page depths, exact-count demand, result sizes, and read-only staging `EXPLAIN (ANALYZE, BUFFERS)` results. Product must decide whether the displayed result count requires exact semantics.

**Eligibility criteria:** a measurable bottleneck, an approved count contract, a plan-supported minimal index/query proposal if needed, and preservation of every current deterministic sort plus the `id` tie breaker.

**Excluded:** unmeasured estimated/no-count UI behavior, speculative indexing, or an unnecessary client search rewrite.

#### Candidate D — Dynamic Locations and Placeholders

**Scope:** Dynamic locations first require an approved source owner, data lifecycle, update mechanism, offline behavior, and migration/compatibility plan. Placeholders require a reproducible visual/performance defect despite existing skeletons/placeholders.

**Eligibility criteria:** a product-approved source or a measured/reproducible defect, respectively, with compatible accessibility and rendering behavior.

**Excluded:** replacing `@repo/constants` or adding generic placeholder UI solely because it appeared as a possible audit idea.

### Acceptance, Rollback, and Release Safeguards

- Treat every evidence result as **local characterization**, **device benchmark**, **staging measurement**, or **deployed contract/security evidence**; do not promote one category to another.
- Do not begin a backend, schema, policy, RPC, grant, index, data, generated-type, dependency, or production-client change from Batch 5 without its recorded approval gate and a new implementation task.
- Any approved future server change must be additive, RLS-safe, minimally scoped, and compatible with the prior supported mobile release. It must retain a rollback/fallback path and never bypass `public.users.id` indirection.
- Release one completed change at a time to a test channel. Compare like-for-like fixture, device/build, navigation path, and network profile against the evidence gate; roll back only the latest approved batch on regression.
- Preserve storage-path/signed-URL security, do not rewrite legacy URLs/assets blindly, do not persist signed URLs, and do not make a private bucket public to satisfy an optimization.

## Testing Strategy

### Validation Approach

Testing follows the bug-condition method: characterize F before proposing a change, demonstrate that a candidate satisfies its entry criteria, then verify P for the approved F′ and preservation for non-bug inputs. Completed Batches 1–4 retain their existing tests; Batch 5 has no fix-checking test until a candidate's evidence gate passes.

### Exploratory Bug Condition Checking

**Goal:** Produce decision-quality evidence without changing product behavior. Distinguish local request/cardinality tests from deployment/staging performance measurements and from security/RLS contract validation.

**Test Plan:**

1. **RPC security/contract characterization:** in an approved staging/security review, test authorized and unauthorized invocations, role grants, caller-ID substitution attempts, RLS interaction, null metadata behavior, and current/new-client compatibility. Record results; do not change the RPC as part of evidence gathering.
2. **Profile upload characterization:** on supported Expo 55 devices and a release build, collect Base64-versus-candidate transfer, memory, success, crop, MIME/path, upsert, URL, database-update, error, and invalidation observables using representative image fixtures and constrained-network cases.
3. **Reviews characterization:** use representative empty/small/large review sets to record current totals, average, buckets, sort order, component records, and read-only plans. Reject a candidate if an aggregate contract cannot reproduce them.
4. **Search characterization:** record exact-count request cost and query plans across current filters/sorts/page depths, including deterministic tie-order fixtures. Reject index/count work without a measurable bottleneck and approved count semantics.
5. **Locations/placeholders characterization:** identify a product-owned location source or reproduce a user-visible placeholder defect before designing a change.

**Expected Counterexamples:**

- The deployed RPC fails the prerequisite security/contract conditions for scan removal until hardening and compatibility gates pass.
- A profile-upload candidate may not provide enough transfer/memory benefit or may fail Expo 55/device compatibility.
- A client-only review limit changes total/aggregate/distribution or sorting observables.
- An estimated/no-count search proposal changes product-visible semantics or does not improve an evidenced query plan.
- Dynamic locations and generic placeholders have no actionable condition without a source/defect.

### Fix Checking

**Goal:** After a candidate separately passes every eligibility gate and is approved for implementation, verify the applicable property without replacing the original characterization suite.

**Pseudocode:**

```
FOR ALL input WHERE isBugCondition(input) DO
  REQUIRE input.hasApprovedImplementationGate
  result := fixedDataFlow(input)
  ASSERT expectedBehavior(result, input)
END FOR
```

For profile upload, assert the complete preservation contract in Property 5. For reviews, assert summary/page equivalence in Property 6. For search, assert exact approved count semantics and stable order in Property 7. For RPC work, require Property 4's security and old-client gates before asserting removal of a metadata scan.

### Preservation Checking

**Goal:** Verify that non-bug inputs retain F's authorized domain output even when the approved implementation changes request topology.

**Pseudocode:**

```
FOR ALL input WHERE NOT isBugCondition(input) DO
  original := characterizeOriginalFunction(input)
  fixed := fixedDataFlow(input)
  ASSERT domainObservable(original) = domainObservable(fixed)
END FOR
```

`domainObservable` compares authorized records, ordering, component-facing shape, crop/quality/file semantics where relevant, loading/error states, mutation visibility, private-media access, and current user-visible count semantics—not intentionally reduced requests alone.

### Unit Tests

- Retain Batches 1–4 tests for query coalescing, bounded chat pages, composite cursors, message deduplication, private-media cache behavior, targeted realtime handling, and stable channel identity.
- Before any RPC migration, test the intended role/identity/metadata contract and old-client adapter behavior in the approved deployment test environment.
- Before any profile-upload implementation, test all preserved picker/options, MIME/path, upsert, cache-busting, database update, invalidation, and failure paths.
- Before review work, test aggregate/summary values, empty states, sort modes, page boundaries, and existing review-card shapes.
- Before search work, test every current sort's primary ordering and `id` tie breaker, count semantics, filters, and error behavior.

### Property-Based Tests

- Generate message timestamps, IDs, cursors, optimistic/realtime arrivals, and callback-only rerenders; retain Properties 2 and 8 for completed chat behavior.
- Generate caller identities, supplied internal IDs, roles, metadata-nullability states, and old/new client consumers; use this only in an approved RPC contract/security harness to validate Property 4.
- Generate image dimensions/formats, target types, upload successes/failures, and network states; assert the preservation observables in Property 5 once a candidate is approved.
- Generate review distributions, ratings, dates, comments, and sort selections; assert Property 6's aggregate/order equivalence before and after any approved summary contract.
- Generate search filters, identical primary-sort values, page positions, and count contracts; assert Property 7's stable order and approved count behavior.

### Integration Tests

- Keep the tenant/landlord cold/warm, chat pagination, optimistic delivery, channel lifecycle, private-media, and relevant/unrelated realtime smoke flows for completed Batches 1–4.
- For a future RPC release, run authorized/unauthorized staging tests, old/new supported app-version tests, chat-list preview/unread flows, and rollback/fallback verification before scan removal.
- For a future profile-upload release, run supported-device/release-build upload flows for avatar and background images under normal and constrained networks.
- For a future review/search release, run fixture-backed tenant/landlord flows that compare aggregates, sorting, count display, accessibility, errors, and post-mutation visibility to the baseline.
- Do not claim staging latency, query-plan, memory, or transfer success until that specific environment measurement has been recorded with device/build, fixture, navigation, and network details.
