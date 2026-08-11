# Architecture Audit Report — apps/mobile

Generated: 2026-07-26
Scope: apps/mobile only

---

# Critical Issues

## C1. No Request Deduplication or Caching Layer

Severity: 🔴 Critical  
Location: Every hook and screen  

**Problem:** The project uses `useState` + `useEffect` / `useFocusEffect` for every data fetch. There is zero use of React Query, TanStack Query, SWR, or any request-deduplication / caching layer. Every navigation triggers fresh Supabase queries with no stale-while-revalidate, no cache-and-refresh, and no request coalescing.

**Why it matters:** Multiple concurrent navigations or focus events fire simultaneous duplicate requests. For example, `useProfile()` is called by a dozen hooks — each fires its own Supabase query. On the landlord dashboard, 4 + N count queries fire every mount. Users on slow connections experience waterfall loading.

**Recommendation:** Adopt React Query (TanStack Query) as a data-fetching standard. Use a single `queryClient` at the root. Move all `useEffect`+`useState` fetch patterns to `useQuery`, and all mutations to `useMutation`. Enable `staleTime` of 30–60s for most resources, and use `invalidateQueries` after mutations.

**Expected impact:** High

---

## C2. Excessive Signed URL Regeneration in Chat (No Caching)

Severity: 🔴 Critical  
Location: `service/chatService.ts:473-501` (`mapMessages`)  

**Problem:** Every call to `fetchMessages()` (which runs every time the chat screen opens) calls `getChatAttachmentSignedUrls()` for ALL attachment paths and ALL thumbnail paths. There is no caching layer — every open regenerates signed URLs for every attachment in the conversation history. If a conversation has 200 photo messages, that's 200+ signed URL generations per open.

**Why it matters:** Each `createSignedUrls` call to Supabase Storage counts toward egress quota and incurs API cost. For users with large conversation histories, this generates significant unnecessary egress on every chat open.

**Recommendation:** Add a module-level `Map<string, { signedUrl: string; expiresAt: number }>` cache (like `useDocumentUrls` already has at `hooks/applications/useDocumentUrls.ts:9`). Check the cache before calling `getChatAttachmentSignedUrls`. Apply a TTL of 55 minutes (matching the existing 1-hour signed URL expiry). Refactor `mapMessages` to accept an optional cache to reuse.

**Expected impact:** High

---

## C3. Chat Fetches All Messages Without Pagination

Severity: 🔴 Critical  
Location: `service/chatService.ts:114-135` (`fetchMessages`)  

**Problem:** `fetchMessages` selects ALL messages for the conversation pair with no limit or pagination. Over time, conversations with hundreds or thousands of messages will cause ever-growing payloads, memory pressure, and request latency.

**Why it matters:** An unbounded query against a growing `chat` table is a scalability bomb. Initial load time grows linearly with conversation size. Users with long conversations experience progressively worse UX.

**Recommendation:** Implement cursor-based pagination. Load only the first N messages (e.g., 30) on mount. Add a "Load earlier messages" footer or `onEndReached` handler on the FlatList (which is already inverted, so "onEndReached" = scroll to top). Use `created_at` as the cursor.

**Expected impact:** High

---

## C4. Duplicate Auth Profile Resolution Across 10+ Hooks

Severity: 🔴 Critical  
Location: Multiple files  

Affected files (non-exhaustive):
- `hooks/auth/useProfile.ts`
- `hooks/chat/useChat.ts` — `getCurrentUserProfile()`
- `service/chatService.ts:97-110` — `getCurrentUserProfile()`
- `service/favoritesService.ts:22-40` — `getCurrentTenantId()`
- `hooks/apartments/useLandlordUnits.ts:58-65`
- `hooks/apartments/useLandlordActionBadges.ts:30-37`
- `hooks/tenancy/useTenancy.ts:66-76`
- `hooks/visitRequests/useLandlordVisitRequests.ts` — via `useProfile()`
- `hooks/maintenance-requests/useLandlordMaintenanceRequests.ts` — via `useProfile()`
- `app/(tabs)/(landlord)/dashboard.tsx:66-68`
- `app/(tabs)/(tenant)/chat.tsx:51-57`
- `app/(tabs)/(landlord)/chat.tsx:47-53`
- `hooks/applications/useLandlordApplications.ts` — via `useProfile()`
- `hooks/applications/useTenantApplications.ts` — via `useProfile()`
- `hooks/ratings/useReviewEligibility.ts` — via `useProfile()`
- `hooks/ratings/useApartmentReviews.ts` — via `useReviewEligibility` → `useProfile()`
- `hooks/maintenance-requests/useSubmitMaintenanceRequest.ts` — via `useProfile()`
- `hooks/applications/useSubmitApplication.ts` — via `useProfile()`

**Problem:** The pattern "get auth user → query public.users by user_id" is independently implemented in 18+ locations. Each call fires 2 Supabase requests (auth.getUser + users.select). There is no single source of truth for the current user's profile id, and many hooks call `useProfile()` independently, each triggering its own fetch.

**Why it matters:** Screen renders cascade into dozens of redundant auth/profile queries. This wastes bandwidth, increases db read consumption, and adds latency to every screen load.

**Recommendation:** Use a single React Query `useQuery(['currentUser'])` call that returns the full user profile. Export a `useCurrentUserId` helper that reads from the cached query. Remove all inline auth resolution patterns. Pass `userId` as a parameter to services instead of resolving it internally.

**Expected impact:** High

---

## C5. Apartment Images — Inconsistent Public/Private Bucket Treatment

Severity: 🔴 Critical  
Location: Multiple files  

Affected:
- `hooks/apartments/useApartmentDetails.ts:41-101` — selects `apartment_images.url` and passes it directly as an image URI
- `hooks/apartments/usePublishApartment.ts:22` — uses `getPublicUrl()` to generate public URLs
- `hooks/visitRequests/useLandlordVisitRequests.ts:59-61` — uses `createSignedUrls()` for the same `apartment-images` bucket
- `service/favoritesService.ts:79-105` — fetches `apartment_images.url` as a raw field (treats as public)

**Problem:** `usePublishApartment` stores public URLs (via `getPublicUrl`) and writes them to `apartment_images.url`. `useLandlordVisitRequests` treats `apartment_images.url` as a storage path and generates signed URLs from it. If the bucket is public, signed URLs are wasted egress. If the bucket is private, `useApartmentDetails` and `favoritesService` serve broken images (raw URLs that will 403). This inconsistency means images are either broken for some users or incurring unnecessary signed URL generation.

**Why it matters:** Either images are broken (UX failure) or signed URLs are unnecessarily generated (wasted egress, cost). This needs to be reconciled.

**Recommendation:** Decide on one strategy:
- **If bucket is public**: Remove all `createSignedUrls` calls for `apartment-images`. Use `getPublicUrl()` consistently in services.
- **If bucket is private**: Change `usePublishApartment` to store only storage paths (not public URLs) and always resolve through signed URLs or `getPublicUrl()` at read time. Update `useApartmentDetails` to resolve signed URLs for each image.

**Expected impact:** High

---

## C6. `useFocusEffect` Causes Unnecessary Refetches on Every Tab Navigation

Severity: 🔴 Critical  
Location: Multiple screens and hooks  

Affected:
- `hooks/favorites/useFavorites.ts:46-50` — `useFocusEffect` refetches all favorite IDs on every screen focus
- `hooks/tenancy/useTenancy.ts:135-139` — `useFocusEffect` refetches full tenancy on every focus
- `hooks/ratings/useApartmentReviews.ts:133` — `useFocusEffect` refetches all reviews
- `hooks/ratings/useReviewEligibility.ts:51` — `useFocusEffect` checks eligibility again
- `app/(tabs)/(tenant)/chat.tsx:111-115` — refetches all conversations + chat rows
- `app/(tabs)/(landlord)/chat.tsx:128-132` — refetches all conversations + chat rows
- `app/(tabs)/(landlord)/units.tsx:70-75` — refetches all apartments + action badges
- `app/(tabs)/(tenant)/profile.tsx:32-36` — refetches full profile
- `app/(tabs)/(tenant)/rentals.tsx:120-124` — refetches maintenance request

**Problem:** Nearly every screen refetches its entire dataset on every focus event. Switching between tabs triggers 5+ simultaneous full-dataset Supabase queries. The data has no stale-while-revalidate behavior, so even navigating away and back (1 second later) fires a full refetch.

**Why it matters:** Excessive database reads, slow tab switching, poor UX on slow connections, and unnecessary bandwidth consumption. Each tab navigation can cost 10+ Supabase round trips.

**Recommendation:** Replace `useFocusEffect` fetches with React Query's `useQuery`. Configure `staleTime: 30_000` (30s) so data is reused within a session. Only force-refetch on pull-to-refresh or after mutations. Use `refetchOnWindowFocus` only for web (not mobile).

**Expected impact:** High

---

# Medium Issues

## M1. `useTenancy` Realtime Subscription Triggers Full Refetch

Severity: 🟠 Medium  
Location: `hooks/tenancy/useTenancy.ts:142-171`  

**Problem:** The realtime subscription listens to `payment` and `tenancies` table changes. On every change, it calls `fetchTenancy()` — a full query that fetches the entire tenancy, apartment, landlord, and payment data. The `payment` listener filters by `tenancy_id`, but the `tenancies` listener is unfiltered and fires on any tenancy change in the entire database.

**Why it matters:** Any tenancy update across the whole platform triggers a refetch for every active user who has this subscription. This is a scalability concern and wastes bandwidth.

**Recommendation:** Filter the `tenancies` listener to only the current user's tenancy ID. Instead of calling `fetchTenancy()` (a full refetch), update only the specific fields that changed (e.g., for payment changes, just update `currentPayment` state). Only full-refetch when `tenancies` itself changes.

**Expected impact:** Medium

---

## M2. Chat List Screens Fetch Entire Chat Table for Metadata

Severity: 🟠 Medium  
Location: `app/(tabs)/(tenant)/chat.tsx:64-101`, `app/(tabs)/(landlord)/chat.tsx:75-100`  

**Problem:** Both chat list screens fetch the entire `chat` table for the current user (`select('sender_id, receiver_id, apartment_id, message_type, created_at').or(...)`) just to determine `last_sender_is_me` and `last_message_type` per conversation. This is redundant because `getConversations` (a Supabase RPC) already returns conversation metadata. The extra query fetches potentially thousands of rows.

**Why it matters:** On every chat list focus, the app downloads every chat message record for the user (not just the content, but metadata). This is O(n) in total messages, not O(conversations). Users with many messages see slow loads and high bandwidth usage.

**Recommendation:** Add `last_sender_id` and `last_message_type` to the `get_conversations` RPC result. Remove the redundant `chat` table query entirely.

**Expected impact:** Medium

---

## M3. No Signed URL Cache in `useMaintenanceRequests.mapRow`

Severity: 🟠 Medium  
Location: `hooks/maintenance-requests/useMaintenanceRequests.ts:34-50`  

**Problem:** `mapRow()` calls `createSignedUrls` for maintenance request images every time a request is fetched. Unlike `useLandlordMaintenanceRequests` (which has a module-level `signedUrlCache`), there is no caching here.

**Why it matters:** Every time the tenant views maintenance requests, signed URLs are regenerated for all images, even if they were generated moments ago. Wastes egress.

**Recommendation:** Add a module-level signed URL cache (same pattern as `useLandlordMaintenanceRequests.ts:43-74`).

**Expected impact:** Medium

---

## M4. No Signed URL Cache in `useTenantApplications`

Severity: 🟠 Medium  
Location: `hooks/applications/useTenantApplications.ts:90-105`  

**Problem:** Every time the tenant views their applications, signed URLs are generated for all application documents. There is no caching.

**Why it matters:** Repeated signed URL generation for documents that rarely change.

**Recommendation:** Use the same module-level cache pattern as `useDocumentUrls.ts`.

**Expected impact:** Medium

---

## M5. Favorites Screen FlatList Disables Virtualization

Severity: 🟠 Medium  
Location: `app/tenant/favorites.tsx:172`  

**Problem:** The FlatList has `scrollEnabled={false}` and is nested inside a scrollable `ScreenWrapper`. This renders ALL items at once, defeating FlatList's virtualization. For users with many favorites, this means all items are mounted simultaneously.

**Why it matters:** Performance degrades with the number of favorite apartments. Memory usage grows linearly. Long lists will cause jank and slow initial renders.

**Recommendation:** Remove `scrollEnabled={false}`. Use `FlatList` as the primary scrollable container instead of nesting it inside a `ScrollView`. Alternatively, set a fixed `maxHeight` on the FlatList and enable its own scrolling.

**Expected impact:** Medium

---

## M6. Dashboard Calls Supabase Directly Inline

Severity: 🟠 Medium  
Location: `app/(tabs)/(landlord)/dashboard.tsx:43-114`  

**Problem:** The dashboard component defines `fetchStats` inline, calling `supabase.from(...)` directly inside the component. This bypasses the service layer pattern used by other features. It also duplicately fetches apartment IDs for the payments and maintenance counts (fire and await nested in `Promise.all`).

**Why it matters:** Violates separation of concerns. Logic is untestable. The nested await pattern `(await supabase.from('apartments')...).data?.map(...)` means the apartment query must complete before payments and maintenance queries even start (despite being wrapped in `Promise.all` — actually, `await` inside the expression forces serial execution).

**Recommendation:** Extract to a `useDashboardStats` hook with React Query. Use a single apartment IDs query, then batch the count queries in parallel.

**Expected impact:** Medium

---

## M7. `useLandlordMaintenanceRequests` Double-Fetches (useEffect + useFocusEffect)

Severity: 🟠 Medium  
Location: `hooks/maintenance-requests/useLandlordMaintenanceRequests.ts:172-180`  

**Problem:** The hook fires `fetchRequests()` on mount via `useEffect` AND on every screen focus via `useFocusEffect`. This causes two identical API calls every time the screen gains focus (once from the running effect, once from focus).

**Why it matters:** Every navigation to the maintenance request screen fires 2× the requests. Double bandwidth and double db reads.

**Recommendation:** Remove the `useEffect` call. Keep only `useFocusEffect`. With React Query, this would naturally be deduplicated.

**Expected impact:** Medium

---

## M8. GIFs Downloaded Twice (Download + Upload + Re-Download)

Severity: 🟠 Medium  
Location: `app/chat/[conversationId].tsx:177-189` + `service/chatService.ts:206-226` + `service/chatService.ts:397-400`  

**Problem:** The Giphy picker downloads the GIF to local storage via `File.downloadFileAsync`, then `sendChatAttachments` uploads it to Supabase Storage, then recipients download it again as a signed URL. This store-and-forward pattern wastes bandwidth and storage for GIFs that already have a permanent URL.

**Why it matters:** GIFs from Giphy have stable public URLs. Re-uploading them to Supabase triples bandwidth usage (download from Giphy → upload to Supabase → download by each recipient) and wastes storage space.

**Recommendation:** For GIFs, store the original Giphy URL directly in `attachmentUrl` rather than re-uploading to Supabase. For text-based messages, attach the GIF URL. No storage upload needed. This eliminates Supabase Storage writes and reads for GIFs entirely.

**Expected impact:** Medium

---

## M9. `useFavorites` Couples Data Hook to UI (Toast)

Severity: 🟠 Medium  
Location: `hooks/favorites/useFavorites.ts:60-104`  

**Problem:** The `useFavorites` hook imports `useToast` and `useColors` and shows toast notifications directly. This couples a data-fetching/mutation hook to a UI framework, making it unusable outside of React component context and difficult to test.

**Why it matters:** Violates separation of concerns. The hook cannot be used in non-UI contexts (e.g., push notification handlers, background sync). Any UI change (replacing toast library) requires changes to the data hook.

**Recommendation:** Remove UI side effects from data hooks. Return success/failure status from `toggleFavorite` and let the calling component handle toast/UI feedback.

**Expected impact:** Low

---

## M10. Chat — No Signed URL Refresh on Expiry

Severity: 🟠 Medium  
Location: `hooks/chat/useChat.ts:267-323` + `service/chatService.ts:473-501`  

**Problem:** Messages loaded at chat open get signed URLs valid for 1 hour. If the user keeps the chat open for longer than 1 hour (e.g., as a backgrounded app), image/video attachments will show broken media. There is no mechanism to refresh expired signed URLs.

**Why it matters:** Users who leave the chat screen open will see broken images after 1 hour. This is a common pattern for messaging apps.

**Recommendation:** Add a periodic refresh mechanism (e.g., every 45 minutes) that re-fetches signed URLs for visible messages. Or, implement an on-error handler in `VisualMediaBubble` that retries with a fresh signed URL when the image fails to load.

**Expected impact:** Medium

---

## M11. Apartment Explore Page Always Fetches All 10 Items + Count

Severity: 🟠 Medium  
Location: `app/(tabs)/components/search/useSearchLogic.tsx:56-187`  

**Problem:** The search logic always requests `{ count: 'exact' }` from Supabase, which triggers a full table scan COUNT query on every search/filter change. The COUNT query executes even when the result count is displayed. For large datasets, COUNT queries are expensive.

**Why it matters:** Each filter change or city selection fires a potentially expensive COUNT query on the `apartments` table. As the platform grows, COUNT queries become slower and more expensive.

**Recommendation:** Remove `{ count: 'exact' }` from the query. Use `{ count: 'estimated' }` (Postgres estimated count) or remove the count display. If count is needed, cache it per filter set.

**Expected impact:** Medium

---

## M12. Chat Channel Setup Runs on Every Init / Dependency Change

Severity: 🟠 Medium  
Location: `hooks/chat/useChat.ts:297-298`, `hooks/chat/useChatChannel.ts:55-134`  

**Problem:** The `setup` function in `useChatChannel` tears down and re-creates both the broadcast and presence channels every time it's called. The `useEffect` in `useChat` has many dependencies (`apartmentId`, `otherUserId`, `setup`, etc.), which can cause unnecessary re-subscriptions.

**Why it matters:** Channel creation/destruction is not free. Frequent re-subscriptions increase latency and Supabase Realtime connection overhead.

**Recommendation:** Stabilize the `useEffect` dependencies. Only re-create the channel when `otherUserId` or `apartmentId` changes. Consider using a single combined channel instead of two separate channels.

**Expected impact:** Low

---

## M13. No Backend Sorting on Explore Page (Client-Side Filters)

Severity: 🟠 Medium  
Location: `app/(tabs)/components/search/useSearchLogic.tsx:157-184`  

**Problem:** The sort parameters are correctly sent to the backend, but the page also relies on client-side ID ordering to break ties. This works for small datasets but may produce inconsistent results as data grows.

**Why it matters:** The `order('id', { ascending: true })` as a tiebreaker is acceptable but worth noting.

**Recommendation:** Ensure the `id` column is indexed for the sort order used. Otherwise this is acceptable.

**Expected impact:** Low (noted for completeness)

---

# Minor Issues

## m1. `useLandlordStats` Fetches `average_rating` for All Apartments When Only Count Needed

Severity: 🟢 Minor  
Location: `hooks/landlord/useLandlordStats.ts:22-27`  

**Problem:** Fetches `average_rating` for ALL apartments of a landlord, then computes the average client-side. For landlords with many properties, this downloads all rating data.

**Why it matters:** Minor — use a Supabase aggregate query instead.

**Recommendation:** Use `supabase.rpc()` with an aggregate query that returns `avg(average_rating)` and `count(*)` directly.

**Expected impact:** Low

---

## m2. `ApartmentCard` and `PropertyCard` Use `expo-image` Without Blurhash/Thumbhash

Severity: 🟢 Minor  
Location: `components/cards/ApartmentCard.tsx:72-78`, `app/(tabs)/components/units/PropertyCard.tsx:65-75`  

**Problem:** No low-res placeholder while images load. Users see empty grey boxes until full images download.

**Recommendation:** Use `expo-image`'s `placeholder` prop with a blurhash or a low-res thumbnail. This improves perceived performance on slow networks.

**Expected impact:** Low

---

## m3. `useLandlordActionBadges` Fetches Apartment IDs Every Time

Severity: 🟢 Minor  
Location: `hooks/apartments/useLandlordActionBadges.ts:40-47`  

**Problem:** Fetches all apartment IDs of the landlord on every badge refresh (which happens on every units tab focus). These IDs don't change frequently.

**Recommendation:** Cache the apartment IDs in memory with a TTL of 60s, or store them alongside the units data.

**Expected impact:** Low

---

## m4. Hardcoded City/Location Options

Severity: 🟢 Minor  
Location: `app/(tabs)/components/search/useSearchLogic.tsx:16`, `app/(tabs)/(landlord)/units.tsx:36-40`  

**Problem:** Cities and location filter options are hardcoded in the mobile client. Adding a new city requires an app update.

**Recommendation:** Fetch city/location options from the database or a configuration table.

**Expected impact:** Low

---

## m5. `useApartmentDetails` Fetches Reviews on Apartment Detail Screen Even If Not Needed

Severity: 🟢 Minor  
Location: `hooks/apartments/useApartmentDetails.ts:138-150`  

**Problem:** The apartment detail hook always fetches the latest 3 reviews in parallel with the apartment data. If the reviews section is below the fold (rarely viewed), this is wasted bandwidth.

**Recommendation:** Consider lazy-loading reviews, or include them in the main query via a join rather than a separate query.

**Expected impact:** Low

---

## m6. `useImageUpload` Uses `base64` Encoding for Image Upload

Severity: 🟢 Minor  
Location: `hooks/apartments/useImageUpload.ts:49`  

**Problem:** The image upload uses `base64: true` in the image picker and `decode("base64-arraybuffer")` for upload. Base64 encoding adds ~33% overhead to the transfer size compared to binary/blob uploads.

**Why it matters:** Increased bandwidth for uploads. For large images, this adds noticeable time and data usage.

**Recommendation:** Use `expo-file-system`'s `File` class (as done in chat service and maintenance request uploads) to upload binary data directly without base64 conversion.

**Expected impact:** Low

---

## m7. Both Chat Tabs Duplicate `fetchConversations` Logic

Severity: 🟢 Minor  
Location: `app/(tabs)/(tenant)/chat.tsx:47-109` and `app/(tabs)/(landlord)/chat.tsx:41-126`  

**Problem:** The conversation fetching + metadata resolution logic is nearly identical between tenant and landlord chat screens, duplicated across two files.

**Recommendation:** Extract shared chat list logic into a `useConversations` hook.

**Expected impact:** Low

---

## m8. `useApplicationActions` Does Not Update List Refetch After Action

Severity: 🟢 Minor  
Location: `hooks/applications/useApplicationActions.ts`  

**Problem:** After approving or rejecting an application, only `localStatus` is set (a local state override). The parent `useLandlordApplications` list is not notified, so if the user navigates back, the application list may still show the old status (or require a full refetch on focus — which `useLandlordApplications` does NOT use).

**Why it matters:** The application list may show stale data after an action.

**Recommendation:** Emit a callback or invalidate the parent query after the mutation.

**Expected impact:** Low

---

# Summary

## Critical Issues (6)
1. **C1** — No request deduplication or caching layer
2. **C2** — Excessive signed URL regeneration in chat (no cache)
3. **C3** — Chat fetches all messages without pagination
4. **C4** — Duplicate auth profile resolution across 18+ locations
5. **C5** — Apartment images — inconsistent public/private bucket treatment
6. **C6** — `useFocusEffect` causes unnecessary refetches on every tab navigation

## Medium Issues (13)
1. **M1** — `useTenancy` realtime subscription triggers full refetch
2. **M2** — Chat list screens fetch entire chat table for metadata
3. **M3** — No signed URL cache in `useMaintenanceRequests.mapRow`
4. **M4** — No signed URL cache in `useTenantApplications`
5. **M5** — Favorites FlatList disables virtualization
6. **M6** — Dashboard calls Supabase directly inline
7. **M7** — `useLandlordMaintenanceRequests` double-fetches (useEffect + useFocusEffect)
8. **M8** — GIFs downloaded twice (download + upload + re-download)
9. **M9** — `useFavorites` couples data hook to UI (toast)
10. **M10** — Chat — no signed URL refresh on expiry
11. **M11** — Explore page always fetches `count: 'exact'`
12. **M12** — Chat channel setup runs on every init / dependency change
13. **M13** — No backend sorting on explore page (client-side filters)

## Minor Issues (8)
1. **m1** — `useLandlordStats` fetches all rating data when only aggregate needed
2. **m2** — No blurhash/thumbhash placeholders on image cards
3. **m3** — `useLandlordActionBadges` re-fetches apartment IDs on every refresh
4. **m4** — Hardcoded city/location filter options
5. **m5** — Apartment detail always fetches reviews even if not viewed
6. **m6** — `useImageUpload` uses base64 (33% overhead)
7. **m7** — Duplicated conversation fetching logic between tenant/landlord chat
8. **m8** — `useApplicationActions` does not notify parent list after mutation

---

# Priority Order (Fix Order)

1. **C1** — React Query / caching layer (prerequisite for many other fixes)
2. **C4** — Deduplicate auth profile resolution (high impact, high frequency)
3. **C6** — Replace `useFocusEffect` with stale-while-revalidate (tab navigation perf)
4. **C2** — Signed URL cache in chat `mapMessages` (egress cost)
5. **C3** — Chat message pagination (scalability)
6. **C5** — Reconcile public/private apartment-images bucket strategy
7. **M2** — Stop fetching full chat table for conversation metadata
8. **M6** — Extract dashboard stats to a hook
9. **M7** — Remove double-fetch in `useLandlordMaintenanceRequests`
10. **M1** — Optimize `useTenancy` realtime subscription
11. **M8** — GIFs: use original URL instead of re-uploading
12. **M3** + **M4** — Add signed URL caches to remaining hooks
13. **M5** — Fix favorites FlatList virtualization
14. **M11** — Remove exact COUNT queries from explore
15. **M10** — Handle signed URL expiry in chat
16. **M9** — Decouple `useFavorites` from UI
17. **M12** — Stabilize chat channel effect dependencies
18. **m6** — Fix base64 image upload overhead
19. **m1** — Optimize landlord stats query
20. **m3** — Cache apartment IDs for action badges
21. **m7** — Extract shared conversation logic
22. **m2** — Add image placeholders
23. **m8** — Fix application action list updates
24. **m4** — Dynamic city options
25. **m5** — Lazy-load apartment reviews
26. **M13** — Ensure backend sorting is correct
