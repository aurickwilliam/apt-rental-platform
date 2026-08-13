# Implementation Plan

## Execution Guardrails

- This plan changes task status and future work only. It authorizes no production-code, dependency, schema, policy, bucket-visibility, stored-URL/data, RPC, grant, generated-type, index, Giphy, or deployment-configuration change.
- Batches 1–4 are the completed, safe client-only regression baseline documented in the design and implementation evidence. Their local validation must not be represented as device, transfer, memory, staging latency, query-plan, bucket-policy, RLS, RPC-security, or release-build evidence.
- Every future candidate must first record its required characterization, measurement, contract, compatibility, and approval result. Only a recorded pass plus a **separate approved implementation task** may authorize a minimal, reversible code or deployment change.
- Preserve RLS and the `auth.uid()` → `public.users.user_id` → internal `public.users.id` model. Do not persist signed URLs, put them in query keys, expose private storage, blindly rewrite legacy assets/URLs, or broaden access to satisfy an optimization.
- Retain the existing client regression suite and release one separately approved change at a time to a test channel. Defer any candidate that lacks its required evidence or measurable benefit.

## Completed Baseline

- [x] 1. Characterize the original bug conditions and preservation behavior
  - **Property 1: Bug Condition** - Shared Fresh Reads
  - Completed locally using controlled service-boundary fixtures for concurrent identity consumers, 200-message conversations, repeated attachment paths, and unrelated tenancy events. Counterexamples established duplicate reads, unbounded initial chat reads, repeated signing inputs, and unrelated tenancy refreshes without claiming deployment metrics.
  - **Property 2: Preservation** - Authorized Mutation, Refresh, and Rendering Behavior
  - Completed local preservation characterization retained forced profile refresh, internal user-ID resolution, private-media storage-path ordering, and authorized time-limited signed URL behavior. Remaining offline, device, deployed RLS, and authenticated navigation cases are explicitly not claimed as locally verified.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7, 1.8, 1.10, 1.11, 1.15, 1.17, 2.1, 2.2, 2.3, 2.4, 2.7, 2.8, 2.10, 2.11, 2.15, 2.17, 3.1, 3.2, 3.4, 3.6, 3.8, 3.9, 3.12_

- [x] 2. Batch 0 — record local baseline evidence and decision-gate outcomes
  - Recorded source-level/request-cardinality findings and the limits of the local environment. No authenticated device/staging navigation script, latency/byte measurement, bucket-policy inspection, query plan, or remote contract result was fabricated.
  - Recorded blocked or deployment-dependent gates for React Query compatibility, apartment-image bucket/value strategy, `get_conversations`, indexes/query plans, and Giphy/external attachment durability.
  - _Bug_Condition: A deployment-dependent assumption is actionable only after evidence confirms it._
  - _Expected_Behavior: Unverified work remains deferred instead of becoming speculative implementation._
  - _Preservation: Batch 0 introduces no product, schema, policy, data, dependency, or deployment behavior change._
  - _Requirements: 1.5, 1.6, 1.9, 1.13, 1.16, 2.5, 2.6, 2.9, 2.13, 2.16, 3.4, 3.8, 3.9_

- [x] 3. Batches 1–4 — completed safe client remediation baseline
  - These checked tasks describe completed client work and its regression obligations; they are not future implementation authorization and do not assert unrecorded staging/deployment results.

  - [x] 3.1 Batch 1 — shared current-user and selected resource reads
    - Established the safe client foundation for shared current-user/resource reads, fresh-key reuse, explicit refresh/retry distinction, exact invalidation, and auth-sensitive cache clearing while retaining local/Zustand ownership and existing loading/error affordances.
    - Retain regression coverage for one shared authorized identity sequence, fresh reads within 30 seconds, forced refresh/retry, no-cache/background errors, cancellation, and sign-out/account-switch cache clearing.
    - _Bug_Condition: Equivalent non-invalidated read where the complete query key is in flight or fresh._
    - _Expected_Behavior: Consumers share authorized data with at most one equivalent request; forced refresh remains a network action._
    - _Preservation: Internal-ID/RLS resolution, component props, errors, and Zustand boundaries remain unchanged._
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.2, 3.5, 3.7, 3.8, 3.11, 3.12_

  - [x] 3.2 Batch 2 — resource-query slices and dashboard stats baseline
    - Completed the approved client resource/query slices, including the dashboard stats hook/service, a single apartment-ID lookup followed by parallel count reads, targeted mutation/realtime updates, and focused redundant-read removal.
    - **Audit M6 correction:** the dashboard inline repeated ID/count flow was completed in this batch. It is not a Batch 5 candidate. Profile Base64 upload is a separate, evidence-gated candidate and is not audit M6.
    - Retain regression coverage for exact query-key invalidation, post-mutation visibility, forced pull-to-refresh, single dashboard apartment-ID lookup, parallel counts, FlatList windowing where already implemented, and preserved user-facing errors/card props.
    - _Bug_Condition: Fresh/in-flight equivalent resource reads, repeated dashboard ID/count flow, lifecycle overlap, or UI/data-hook coupling._
    - _Expected_Behavior: Fresh keyed data is reused; only affected keys update; dashboard reads remain correctly shaped._
    - _Preservation: Favorite/application/payment visibility, refresh, RLS, loading/errors, and UI feedback remain compatible._
    - _Requirements: 1.1, 1.6, 1.7, 1.12, 1.14, 1.16, 2.1, 2.6, 2.7, 2.12, 2.14, 2.16, 3.1, 3.2, 3.5, 3.7, 3.8, 3.11, 3.12_

  - [x] 3.3 Batch 3 — private-media resolution baseline
    - Retain the completed private-media resolver regression contract: reuse locally unexpired URLs, batch only unique missing/expired paths, return authorized time-limited URLs, preserve storage paths at rest, and clear sensitive in-memory state on sign-out.
    - Apartment-image storage strategy remains explicitly deferred. Do not alter bucket policy, rewrite values/assets, or select public/private URL behavior until authorized/unauthorized deployment inspection and representative-value classification approve a strategy.
    - _Bug_Condition: Re-signing an unexpired private path or resolving persisted apartment images contrary to the confirmed bucket contract._
    - _Expected_Behavior: Only unique cache misses are signed; private assets retain authorized time-limited access._
    - _Preservation: Text/image/video chat delivery, optimistic messages, RLS, legacy asset rendering, and existing component props remain intact._
    - _Requirements: 1.3, 1.5, 1.10, 1.11, 1.15, 2.3, 2.5, 2.10, 2.11, 2.15, 3.4, 3.6, 3.8, 3.9, 3.12_

  - [x] 3.4 Batch 4 — bounded chat pagination and stable channels baseline
    - Completed client-only chat pagination: an initial page of at most 30 rows, deterministic `created_at DESC, id DESC` ordering, strict older-than composite cursor continuation, and deduplication across paged, optimistic, and broadcast messages.
    - Completed stable chat-channel identity `(currentUserId, otherUserId, apartmentId)`; callback-only rerenders do not reconnect, while identity changes and unmounts tear down channels.
    - The compatibility `fetchMessages` adapter remains bounded. This batch did **not** remove conversation-list metadata scans, modify the RPC/schema/indexes, or change Giphy/message storage contracts.
    - _Bug_Condition: Unbounded messages or channel recreation when stable channel identity has not changed._
    - _Expected_Behavior: Initial pages are bounded, later pages are cursor-complete/strictly ordered/duplicate-free, and benign rerenders retain subscriptions._
    - _Preservation: Chat text/image/video delivery, optimistic reconciliation, unread/typing/presence, existing RPC clients, RLS, and legacy GIF/message interpretation remain compatible._
    - _Requirements: 1.4, 1.8, 1.9, 1.13, 1.17, 2.4, 2.6, 2.9, 2.13, 2.17, 3.1, 3.3, 3.6, 3.8, 3.10, 3.12_

## Deferred and Evidence-Only Future Work

- [ ] 4. Gate conversation-list metadata scan removal — security/contract evidence only
  - **Property 4: Deferred RPC Metadata Safety** - Approved Conversation Contract
  - The deployed `get_conversations` prerequisite is confirmed blocked: it is `SECURITY DEFINER`, accepts a caller-supplied internal ID, is executable by `PUBLIC`, `anon`, and `authenticated`, and lacks authoritative `last_sender_id`/`last_message_type` metadata.
  - Before even proposing scan removal, obtain explicit deployment/security approval and record an approved hardening design that derives caller identity from `auth.uid()` through `public.users.id`, limits execution to the approved authenticated role, defines `SECURITY DEFINER` owner/search-path/RLS/error behavior, and passes authorized/unauthorized/RLS/security contract tests.
  - Record additive metadata type/nullability/result-order compatibility and supported old-client adapter validation. Keep the existing scan and fallback adapter until staged old/new-client evidence passes.
  - **DO NOT create or execute a migration, alter grants, regenerate types, add RPC fields, or remove the scan in this task.** A separate approved implementation task is required after every gate passes.
  - _Bug_Condition: Removing the scan while the RPC trusts a caller-supplied ID, retains unsafe public/anonymous execution, lacks authoritative metadata, or lacks old-client evidence._
  - _Expected_Behavior: The candidate remains deferred unless its approved contract preserves authorization and supported-client behavior._
  - _Preservation: Existing RPC consumers, tenant/landlord chat-list previews, RLS, permissions, result shape, and legacy fallback remain compatible._
  - _Requirements: 1.9, 1.13, 2.8, 2.9, 2.13, 3.4, 3.8, 3.12_

- [ ] 5. Batch 5 — ordered evidence-gathering and eligibility gates only
  - **IMPORTANT:** Each subtask records evidence only. A pass is an eligibility decision, not approval to modify code, dependencies, schema, policies, indexes, generated types, stored data, or deployment configuration. Create a separate approved implementation task only after the named gate has a recorded pass.

  - [ ] 5.1 Candidate A — profile Base64 upload controlled Expo 55 benchmark and preservation characterization
    - **Property 5: Evidence-Gated Profile Upload Candidate** - Preserve Existing Upload Contract
    - On supported Expo 55 devices and release builds, characterize current `useImageUpload` with representative asset sizes/types and constrained-network cases. Record source/encoded payload size, transfer time, peak JS/native memory where tooling permits, success/failure rate, and a pre-declared measurable benefit threshold for any isolated candidate comparison.
    - Characterize and preserve crop ratio, `quality: 0.8`, MIME derivation, `${userId}/${userId}.${ext}` naming, upsert, cache-busted public URL, `users` update, current-user invalidation, and user-facing error/retry behavior. Keep the apartment-edit `fetch(uri).blob()` flow separate.
    - Do not label this candidate audit M6 and do not install dependencies, change upload transport, or create a shared upload abstraction. If device/release compatibility, benefit, or preservation evidence fails, record the failure and defer it.
    - _Bug_Condition: A proposed upload transport lacks characterization, measured benefit, approved contract, or compatibility evidence._
    - _Expected_Behavior: No implementation is eligible until a controlled benchmark and complete preservation characterization pass._
    - _Preservation: Existing upload options, paths, URL/database update, invalidation, and failure behavior are unchanged._
    - _Requirements: 2.6, 3.1, 3.5, 3.7, 3.11, 3.12_

  - [ ] 5.2 Candidate B — review aggregate/summary contract and staging-plan evidence
    - **Property 6: Evidence-Gated Review Summary** - Aggregate and Page Equivalence
    - Obtain a product-approved, RLS-safe proposed summary/page contract before considering pagination. Characterize current empty/small/large review fixtures: total count, overall rating, rating distribution, authorized records, sort modes, component records, and loading/error states.
    - After contract approval, collect read-only staging `EXPLAIN (ANALYZE, BUFFERS)` evidence for the exact current/proposed query shapes and fixture sizes. Define null/empty behavior and supported-old-client compatibility.
    - Do not add a client `.limit()`, substitute page-local aggregates, alter sorting, add an RPC/index, or change schema/types. Defer if the approved contract cannot reproduce every observable with measurable benefit.
    - _Bug_Condition: A lazy-review or pagination proposal changes totals, aggregates, distribution, sorting, authorization, or component behavior without an approved contract and plan evidence._
    - _Expected_Behavior: Only a proven aggregate/summary contract can become eligible for a separate implementation task._
    - _Preservation: Total count, rating aggregates/buckets, permitted sorting, authorized rows, loading/errors, and review-card shapes are unchanged._
    - _Requirements: 2.6, 2.16, 3.4, 3.5, 3.8, 3.12_

  - [ ] 5.3 Candidate C — search-count product semantics and query-plan/index evidence
    - **Property 7: Evidence-Gated Search and Locations** - Search Count and Stable Ordering
    - Obtain a product decision on exact versus alternative displayed count semantics. Record representative filters, all sort modes, page depths, result sizes, exact-count demand/cost, and read-only staging `EXPLAIN (ANALYZE, BUFFERS)` for current query shapes.
    - If evidence identifies a measurable bottleneck, propose only a minimal plan-supported query/index candidate that preserves each deterministic primary sort and `id` tie breaker. Record an approved count contract and compatibility requirement before a separate implementation task.
    - Do not change count semantics, search UI/query behavior, or add an index/migration based on source assumptions alone.
    - _Bug_Condition: A search count/index proposal lacks product-approved count semantics, measurable need, plan evidence, or stable-order compatibility._
    - _Expected_Behavior: A candidate is eligible only after approved semantics and plan-supported measurable benefit._
    - _Preservation: Exact count behavior and every current deterministic sort plus `id` tie breaker remain unchanged until a separately approved implementation passes._
    - _Requirements: 1.16, 2.6, 2.16, 3.5, 3.8, 3.12_

  - [ ] 5.4 Candidate D — product-owned dynamic-location contract and placeholder-defect evidence
    - **Property 7: Evidence-Gated Search and Locations** - Locations and Existing Placeholder Behavior
    - For dynamic locations, obtain a product-approved source owner, source of truth, data lifecycle, update/rollout mechanism, offline behavior, and migration/compatibility plan. Preserve `@repo/constants` until that contract passes.
    - For placeholders, first reproduce and record a specific user-visible or measurable defect despite the existing image skeletons/placeholders, including accessibility and rendering impact.
    - Existing skeletons/placeholders are **not a current defect**. Do not add, redesign, or generalize placeholder UI without the required reproducible evidence; do not replace static locations solely because dynamic data is a possible audit idea.
    - _Bug_Condition: A dynamic-location or placeholder proposal lacks a product-owned source/contract or a reproducible defect and compatibility evidence._
    - _Expected_Behavior: No implementation is eligible until its source/defect and preservation evidence are recorded and approved._
    - _Preservation: Current static locations, existing loading presentation, accessibility, and rendering behavior remain intact._
    - _Requirements: 2.6, 2.16, 3.5, 3.8, 3.12_

- [ ] 6. Retain fix-checking, preservation, and staged-release safeguards for completed or later approved work
  - **Property 1: Expected Behavior** - Shared Fresh Reads
  - Re-run the existing completed-safe-client suite rather than replacing it: fresh/in-flight equivalent reads coalesce; first chat pages are at most 30 with cursor-complete duplicate-free history; unexpired private paths are not re-signed and unique misses are batched; unrelated tenancy events do not trigger target-resource fetches; callback-only chat rerenders retain channels.
  - **Property 2: Preservation** - Authorized Mutation, Refresh, and Rendering Behavior
  - Re-run the same preservation suite: pull-to-refresh/retry bypasses freshness; exact mutation/realtime updates become visible; optimistic chat reconciliation remains correct; authorized private media remains accessible and unauthorized media remains denied; slow/offline/background-error affordances, Zustand boundaries, and component prop contracts remain intact.
  - For a future approved server/client change, compare `domainObservable(F)` and `domainObservable(F′)` for authorized records/order, aggregates/count semantics where applicable, private access, loading/errors, and component shape—not intentionally reduced request topology alone.
  - Before any separately approved additive backend release, validate both new and prior supported mobile versions; preserve required adapters/read-only pagination fallbacks; release one change to a test channel; and roll back only the latest approved change if regression criteria fail.
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14, 2.15, 2.16, 2.17, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12_

- [ ] 7. Checkpoint — evidence completeness and release eligibility
  - Confirm Batches 1–4 regression tests remain runnable and that their local evidence is not overstated as staging/deployment proof.
  - Confirm every future candidate has a recorded evidence category (local characterization, device benchmark, staging measurement, or deployed contract/security evidence), a pass/fail/defer decision, and—before any change—a separately approved implementation task.
  - Confirm no unapproved backend, storage, apartment-image, RPC, grant, index, Giphy, dependency, generated-type, schema, policy, data, or deployment change has entered the release. Ask the user when a product, security, or deployment approval is required.
