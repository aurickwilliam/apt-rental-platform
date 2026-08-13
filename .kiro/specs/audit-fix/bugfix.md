# Bugfix Requirements Document

## Introduction

The mobile app (`apps/mobile`) suffers from systematic performance degradation caused by the absence of a request caching/deduplication layer combined with redundant data-fetching patterns. An architecture audit identified 27 issues (6 critical, 13 medium, 8 minor) that compound into excessive Supabase round-trips, wasted egress, and poor UX on every screen navigation. This bugfix addresses all verified performance defects through a batched remediation plan.

**Scope:** `apps/mobile` only.

**Root Cause:** No request deduplication or caching mechanism exists. Every hook independently fetches data via `useState`+`useEffect`/`useFocusEffect`, causing redundant network requests, duplicate auth resolution, unnecessary signed URL regeneration, and unbounded queries on every screen focus.

**Note on Convention Deviation:** Per AGENTS.md State Management Rules, "React Query is not used anywhere in the repo — do not introduce without strong justification." This audit constitutes that strong justification — React Query (TanStack Query) is the prerequisite for resolving C1, C4, C6, and enables idiomatic fixes for all remaining issues. AGENTS.md must be updated upon implementation.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN any screen gains focus (tab switch, navigation back) THEN the system fires full Supabase refetch queries for all data on that screen with no stale-while-revalidate behavior, causing 5-10+ redundant round-trips per tab switch (C1, C6)

1.2 WHEN any hook needs the current user's internal ID THEN the system independently calls `supabase.auth.getUser()` + `supabase.from('users').select('id').eq('user_id', user.id)` in 18+ separate locations, firing 2 Supabase requests per hook per render (C4)

1.3 WHEN the chat screen opens THEN the system calls `getChatAttachmentSignedUrls()` for ALL attachment paths and ALL thumbnail paths in the entire conversation history without any caching, regenerating signed URLs for every attachment on every open (C2)

1.4 WHEN the chat screen opens THEN the system fetches ALL messages for the conversation pair with no limit or pagination, causing unbounded payload growth as conversations get longer (C3)

1.5 WHEN apartment images are displayed THEN the system inconsistently treats the `apartment-images` storage bucket — `usePublishApartment` stores public URLs via `getPublicUrl()`, while `useLandlordVisitRequests` generates signed URLs for the same paths, causing either broken images (403) or wasted signed URL generation (C5)

1.6 WHEN the landlord dashboard mounts THEN the system calls Supabase directly inline with nested `await` inside `Promise.all`, serializing apartment ID queries that should run once and be shared across count queries (M6)

1.7 WHEN `useLandlordMaintenanceRequests` mounts AND gains focus THEN the system fires `fetchRequests()` twice — once from `useEffect` on mount and once from `useFocusEffect` on focus, doubling all requests (M7)

1.8 WHEN the `useTenancy` realtime subscription receives any `tenancies` table change THEN the system triggers a full refetch for every active user regardless of whether the change pertains to their tenancy (M1)

1.9 WHEN the chat list screen mounts THEN the system fetches the entire `chat` table for the current user (all messages, not just metadata) to determine `last_sender_is_me` and `last_message_type` per conversation, despite `getConversations` RPC already returning conversation metadata (M2)

1.10 WHEN tenant maintenance requests are viewed THEN the system regenerates signed URLs for all request images without any cache, unlike `useLandlordMaintenanceRequests` which has a module-level cache (M3)

1.11 WHEN tenant applications are viewed THEN the system regenerates signed URLs for all document attachments without any cache (M4)

1.12 WHEN the favorites screen renders THEN the system uses a FlatList with `scrollEnabled={false}` nested inside a scrollable wrapper, disabling virtualization and rendering ALL items at once (M5)

1.13 WHEN a user sends a GIF via the Giphy picker THEN the system downloads the GIF locally, re-uploads it to Supabase Storage, and recipients re-download it via signed URL — tripling bandwidth for content that already has a permanent public URL (M8)

1.14 WHEN `useFavorites` performs a toggle mutation THEN the system imports `useToast` and `useColors` and shows toast notifications directly from the data hook, coupling data logic to UI framework (M9)

1.15 WHEN a chat is kept open for more than 1 hour THEN the system shows broken media because signed URLs expire with no refresh mechanism (M10)

1.16 WHEN the explore page applies any filter or search change THEN the system fires an expensive `{ count: 'exact' }` full table scan COUNT query in addition to the data query (M11)

1.17 WHEN `useChatChannel` dependencies change THEN the system tears down and re-creates both broadcast and presence channels, causing unnecessary Realtime reconnections (M12)

### Expected Behavior (Correct)

2.1 WHEN any screen gains focus THEN the system SHALL serve cached data immediately (stale-while-revalidate) and only refetch if data is older than 30 seconds, eliminating redundant round-trips on tab switches (fixes C1, C6)

2.2 WHEN any hook needs the current user's internal ID THEN the system SHALL resolve it from a single cached query (`useCurrentUser`) that deduplicates auth.getUser + users.select into one request per session, shared across all consumers (fixes C4)

2.3 WHEN the chat screen opens THEN the system SHALL check a module-level signed URL cache (keyed by storage path, TTL ~55 minutes) before calling `getChatAttachmentSignedUrls`, only regenerating URLs that are expired or missing from cache (fixes C2)

2.4 WHEN the chat screen opens THEN the system SHALL fetch only the most recent N messages (e.g., 30) and provide cursor-based pagination to load earlier messages on scroll (fixes C3)

2.5 WHEN apartment images are displayed THEN the system SHALL use a single consistent strategy — store storage paths in the database and resolve signed URLs at read time for all consumers, OR use public URLs consistently if the bucket is public (fixes C5)

2.6 WHEN the landlord dashboard mounts THEN the system SHALL fetch apartment IDs once and reuse them across all count queries via a dedicated `useDashboardStats` hook, running count queries in true parallel (fixes M6)

2.7 WHEN `useLandlordMaintenanceRequests` mounts THEN the system SHALL fire only one initial fetch (not both `useEffect` and `useFocusEffect`), deduplicating the mount+focus overlap (fixes M7)

2.8 WHEN the `useTenancy` realtime subscription receives a `tenancies` table change THEN the system SHALL filter by the current user's tenancy ID before triggering any refetch, and for payment changes SHALL update only the payment state rather than full-refetching (fixes M1)

2.9 WHEN the chat list screen needs conversation metadata THEN the system SHALL derive `last_sender_is_me` and `last_message_type` from the `getConversations` RPC result (or an enhanced version of it) without querying the full `chat` table separately (fixes M2)

2.10 WHEN tenant maintenance requests are viewed THEN the system SHALL use a module-level signed URL cache (same pattern as `useLandlordMaintenanceRequests`) to avoid regenerating URLs on every view (fixes M3)

2.11 WHEN tenant applications are viewed THEN the system SHALL use a module-level signed URL cache for document URLs (same pattern as `useDocumentUrls`) (fixes M4)

2.12 WHEN the favorites screen renders THEN the system SHALL use FlatList as the primary scrollable container with virtualization enabled, removing `scrollEnabled={false}` (fixes M5)

2.13 WHEN a user sends a GIF via the Giphy picker THEN the system SHALL store the original Giphy URL directly in the message record without re-uploading to Supabase Storage (fixes M8)

2.14 WHEN `useFavorites` performs a toggle mutation THEN the system SHALL return success/failure status only; the calling component SHALL handle toast/UI feedback (fixes M9)

2.15 WHEN a chat has been open for more than 45 minutes THEN the system SHALL refresh signed URLs for visible messages, or SHALL implement an on-error retry that fetches a fresh signed URL when an image fails to load (fixes M10)

2.16 WHEN the explore page applies filters THEN the system SHALL use `{ count: 'estimated' }` or remove the count query entirely, avoiding expensive exact COUNT scans (fixes M11)

2.17 WHEN `useChatChannel` re-renders THEN the system SHALL only recreate channels when `otherUserId` or `apartmentId` actually change, stabilizing effect dependencies (fixes M12)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user navigates to a screen after data has been mutated (e.g., after adding a favorite, submitting a payment, sending a message) THEN the system SHALL CONTINUE TO show the updated data on the next screen visit

3.2 WHEN a user performs a pull-to-refresh gesture THEN the system SHALL CONTINUE TO force a fresh data fetch regardless of cache freshness

3.3 WHEN a realtime event arrives for the current user's data (e.g., new chat message, payment status change) THEN the system SHALL CONTINUE TO update the UI in real-time

3.4 WHEN a user views apartment images THEN the system SHALL CONTINUE TO display them correctly with proper access permissions

3.5 WHEN a user navigates between tabs THEN the system SHALL CONTINUE TO display the correct data for each tab with appropriate loading states

3.6 WHEN a user sends chat messages (text, images, videos) THEN the system SHALL CONTINUE TO deliver them correctly with attachment display

3.7 WHEN the user is offline or on a slow connection THEN the system SHALL CONTINUE TO show appropriate loading and error states

3.8 WHEN RLS policies enforce data access THEN the system SHALL CONTINUE TO respect all existing security boundaries — no client-side data exposure changes

3.9 WHEN signed URLs are generated for private storage assets THEN the system SHALL CONTINUE TO provide valid, time-limited access to authorized users

3.10 WHEN the `useTenancy` hook is active THEN the system SHALL CONTINUE TO maintain realtime payment/tenancy status updates for the current user

3.11 WHEN Zustand stores are used for client state (theme, form flows) THEN the system SHALL CONTINUE TO function without interference from the new caching layer

3.12 WHEN existing components render apartment cards, chat bubbles, or maintenance request cards THEN the system SHALL CONTINUE TO receive the same prop shapes and data structures
