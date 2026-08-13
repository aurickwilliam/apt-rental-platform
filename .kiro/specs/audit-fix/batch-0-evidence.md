# Batch 0 Local Evidence and Decision Gates

**Scope:** local repository inspection and deterministic Jest/fast-check service-boundary characterization only. No deployed Supabase project, device, storage policy, schema, data, or package manifest was modified or queried.

## Environment record

- Repository: `apt-rental-platform`
- App/build: source checkout only; `apps/mobile` declares Expo `~55.0.26`, React Native `0.83.6`, and React `19.2.0`.
- Tooling: Jest `29.7.0` via `jest-expo`, `@testing-library/react-native` `13.3.3`, and `fast-check` `4.9.0` are declared locally.
- Network/device profile: not available in this local, non-deployed run.
- Seeded fixtures: two concurrent current-user consumers; a 200-row chat conversation with three repeated attachment paths and two repeated thumbnails; an unrelated tenancy event.
- Navigation script: unavailable without an authenticated development/staging build. The local test suite invokes the matching hooks/services directly at the Supabase boundary instead.

## Local baseline observations

| Concern | Reproducible local fixture | Observed current behavior | Evidence |
| --- | --- | --- | --- |
| Equivalent identity reads | Two to four concurrent `getCurrentUserProfile()` consumers | Each consumer performs its own `auth.getUser()` then `users.select(...).single()` sequence; no shared in-flight/fresh cache exists. | `apps/mobile/service/chatService.ts` (`getCurrentUserProfile`), `hooks/auth/useProfile.ts`, expected-failure Property 1 test. |
| Chat first-page bound | 200 messages | `fetchMessages()` selects, orders, and awaits every matching row. It has no `limit`, cursor, or page result. | `apps/mobile/service/chatService.ts` (`fetchMessages`), expected-failure 200-row and Property 2 tests. |
| Duplicate signing | Repeated `attachments/{0..3}.jpg` paths | `getChatAttachmentSignedUrls()` forwards the input array to Storage unchanged; `mapMessages()` derives raw repeated attachment/thumbnail arrays. No chat signed-URL cache exists. | `apps/mobile/service/chatService.ts` (`getChatAttachmentSignedUrls`, `mapMessages`), expected-failure Property 3 test. |
| Realtime relevance | Active tenancy plus unrelated `tenancies` payload | The `tenancies` handler invokes `fetchTenancy()` without inspecting the payload. Payment changes are filtered after the tenancy ID is known. | `apps/mobile/hooks/tenancy/useTenancy.ts`, expected-failure Property 4 test. |
| Maintenance lifecycle overlap | Source inspection | `useLandlordMaintenanceRequests` invokes `fetchRequests` from both `useEffect` and `useFocusEffect`; no safe deterministic hook harness was added in this preparatory batch. | `apps/mobile/hooks/maintenance-requests/useLandlordMaintenanceRequests.ts`. |
| Apartment-image representation | Local writer/reader comparison | `usePublishApartment` stores `getPublicUrl()` results, while `useLandlordVisitRequests` passes `apartment_images.url` to `createSignedUrls`. | `apps/mobile/hooks/apartments/usePublishApartment.ts`, `hooks/visitRequests/useLandlordVisitRequests.ts`. |

Expected-failure bug-condition tests use Jest's `test.failing` so the suite remains runnable while documenting the counterexamples that later batches must convert into ordinary passing assertions. Preservation tests remain ordinary passing tests and characterize forced profile refresh, private-media path retention/order, and authorized signed URL shape.

## Measurable-baseline status

Cold/warm request count, duplicate-in-flight count, signing count, rows/bytes, latency p50/p95, first-page render time, list windowing, and realtime refetch metrics **cannot be captured reliably from the local checkout**: there is no authenticated development/staging target, seeded deployment fixture, device/build profile, or pre-existing instrumentation. The characterization tests supply local request/cardinality proxies only; they are not staging performance metrics.

Safe next check: use a disposable development build against a specifically seeded non-production Supabase project, attach request spies at the service boundary, and record the exact device, build hash, network shaping, account, fixture sizes, and navigation script before changing any product flow.

## Decision gates

| Gate | Local result | Status | Safe next check |
| --- | --- | --- | --- |
| React Query compatibility | `@tanstack/react-query` is not declared in either root or mobile package manifest. This batch intentionally did not install it or alter a lockfile/manifest. The local Jest setup can run existing Expo tests, but it cannot establish provider, AppState bridge, Fast Refresh, or release-build compatibility for an absent package. | **Blocked / deferred** | In an isolated disposable branch or worktree, install only exact `@tanstack/react-query@5.66.8`, run Jest mocks plus Expo development/Fast Refresh and release-build verification, then discard it unless Batch 1 is explicitly approved. |
| `apartment-images` bucket visibility and policies | Local source and generated types cannot reveal `storage.buckets.public`, object RLS, or authorized/unauthorized reads. Source evidence shows competing public-URL and signing assumptions. | **Blocked / deployment-dependent** | Read-only inspect staging bucket configuration/policies, safely sample representative `apartment_images.url` values, and perform authorized/unauthorized read checks without changing objects or policies. |
| Legacy apartment-image value compatibility | Generated type says `url: string`; it does not classify deployed values or confirm object existence. | **Blocked / deployment-dependent** | Read-only classify representative rows as path, public URL, signed URL, or external URL; cross-check same-bucket object existence and other supported client readers. |
| `get_conversations` RPC contract | Generated types expose only `p_user_id` and current result fields. They do not expose SQL, grants, `security invoker/definer`, RLS interaction, or authoritative sender/type metadata. | **Partially confirmed locally; blocked for contract** | Read-only inspect staging RPC definition, grants, RLS behavior, nullability, and representative output before accepting any RPC change. |
| Index availability and query plans | No migrations/catalog/EXPLAIN evidence is present locally. | **Blocked / deployment-dependent** | Run read-only `EXPLAIN (ANALYZE, BUFFERS)` in staging for chat pages, conversations, dashboard counts, and apartment filters; propose indexes only when plans establish need. |
| Giphy/external attachment contract | Local code reuploads GIFs, but URL durability, product policy, and database acceptance of direct external URLs cannot be proved locally. | **Blocked / product and deployment-dependent** | Obtain product/security approval and inspect schema constraints using staging-safe reads before any behavior change. |

## Preservation characterization

The local suite currently confirms these non-bug behaviors without altering production code:

- An explicit `useProfile().refetch()` performs a new authorized identity lookup and preserves the resolved internal profile ID.
- Private chat records retain message order and original storage paths while receiving authorized signed URL values.
- A valid private chat path produces a time-limited signed URL through the current service boundary.

Other preservation cases (offline/slow-network affordances, navigation among distinct tabs, optimistic send/reconciliation, favorites mutations, and deployed RLS behavior) require an authenticated app/build or staging environment and remain unverified in Batch 0.

## Batch boundary

No Batch 1 or later work was performed: no TanStack dependency/provider, cache/query layer, product hook/service change, media change, chat pagination, realtime behavior change, backend/schema/data migration, remote inspection, or storage-policy change is included.


## Local validation

- `pnpm --filter mobile test -- --runInBand tests/audit-fix/audit-fix.characterization.test.ts` — **passed**: 8/8 tests. The four bug-condition tests are intentionally declared with Jest `test.failing`; each observed the current defect rather than a remediation. Recorded minimum counterexamples: two concurrent identity consumers yield two auth/profile sequences; 200 chat rows return 200 initial messages (the generated minimum is 31); repeated storage paths are forwarded to signing without deduplication; one unrelated `tenancies` event triggers a new tenancy fetch.
- `pnpm --filter mobile lint` — **passed with 8 existing warnings and 0 errors**. The warnings are in pre-existing verification/component test and utility files; the new audit-fix test produced no lint findings.
- `pnpm --filter mobile exec node -e "try { console.log(require.resolve('@tanstack/react-query')); process.exit(1); } catch { console.log('@tanstack/react-query is not locally resolvable'); }"` — confirmed the proposed dependency is not locally resolvable. No dependency, lockfile, or manifest was changed.
