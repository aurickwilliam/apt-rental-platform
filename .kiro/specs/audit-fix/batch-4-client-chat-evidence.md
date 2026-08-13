# Batch 4 Client Chat Evidence

## Implemented safe client-only scope

- Replaced the mobile chat's unbounded initial retrieval with `fetchMessagePage`, which requests at most 30 rows ordered by `created_at DESC, id DESC`.
- Added a typed `(createdAt, id)` cursor and strict older-than composite predicate for later pages. The compatibility `fetchMessages` adapter now returns only the first bounded page.
- Updated `useChat` and the inverted `FlatList` to append older pages at the history edge, guard concurrent pagination, and deduplicate initial, older-page, optimistic, and broadcast message IDs without changing text, attachment, signing, or optimistic reconciliation contracts.
- Stabilized `useChatChannel` by making the subscription identity exactly `(currentUserId, otherUserId, apartmentId)` and retaining changing event callbacks through refs. Callback-only rerenders do not reconnect channels; identity changes and unmounts still remove both channels.

## Explicitly deferred

- `get_conversations` RPC/schema/metadata work, role chat-list metadata scans, generated DB types, indexes/migrations/query plans, direct Giphy URLs, apartment-images C5, storage policies/data changes, and Batch 5 optimizations remain deferred. Batch 0 evidence does not verify the required deployment/product/security gates.

## Local validation

- `pnpm --filter mobile exec jest --runInBand` — passed: 25 suites, 148 tests.
- `pnpm --filter mobile lint` — passed with 0 errors and 8 pre-existing warnings outside this batch's files.
- `pnpm --filter mobile exec tsc --noEmit` — changed-file diagnostics are clean; repository-wide legacy and chat-list type errors are recorded separately below.
- `git diff --check` — passed.
- `graphify update .` — passed; refreshed `graphify-out` artifacts.

## TypeScript baseline distinction

The repository-wide check continues to report pre-existing errors in both role chat-list screens (`last_message_type: string` versus `MessageType | null`) and legacy input components that reference removed color members. The Batch 4 changed files have no TypeScript diagnostics after the final implementation.
