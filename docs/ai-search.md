# Ava: AI chatbot search (Gemini)

Ava (APT Virtual Assistant) is the tenant chatbot search on mobile (`app/search/ai-search.tsx`, opened from the sparkles button in the Explore header) and on the web (a right-hand drawer, `app/components/ava/`, opened from the sparkles button in the tenant Browse search row). Tenants describe what they want in plain English, Tagalog or Taglish. Ava replies in a friendly way and shows real listings.

## How it works

1. The chat hook (mobile `hooks/chat/useAIChat.ts`, web `hooks/use-ava-chat.ts`) sends the conversation to the `ai-search` edge function. Reading its answer, the keyword fallback and what Ava says are shared in `@repo/utils` `avaChat.ts` (`readAvaResponse`, `avaFallbackAnswer`, `shouldSearchForAva`, `composeAvaReply`), so both platforms behave the same.
2. The edge function (`supabase/functions/ai-search/index.ts`) checks the caller (signed in, not suspended), counts the message against the daily allowance, and asks Gemini for JSON: a short `reply`, up to four `quickReplies` and search `filters`.
3. The app runs every filter through `sanitizeAiFilters` (`@repo/utils` `aiSearch.ts`) and searches with its own client: mobile `fetchAvaListings` (same guards as the search tab), web `fetchAvaResults` (`app/browse/lib/fetch-ava-results.ts`, the same `applyBrowseFilters` / `applyBrowseSort` as Browse, so "See all results" opens exactly that search via `aiFiltersToBrowseParams`). RLS decides what is shown.

Gemini never writes listings, prices or addresses, so it cannot show a listing that does not exist.

## When Gemini is not used

The edge function answers `{ source: 'fallback' }` or `{ source: 'limit' }` instead of a Gemini answer when:

- `GEMINI_API_KEY` is not set,
- Gemini is rate-limited (429), slow (20 second timeout), failing or returns unreadable JSON, or
- the account used its daily allowance (`limit`).

The app then reads the tenant's messages with `parseSearchKeywords`, a rule-based reader for city names, budgets ("under 15k", "hanggang 12 libo"), rooms ("2BR", "dalawang kwarto"), types, furnishing and common amenities. Search keeps working without the model.

## Setup

```bash
supabase secrets set GEMINI_API_KEY=<key from Google AI Studio>
```

Optional secrets:

- `GEMINI_MODEL`: model id. The default is `DEFAULT_MODEL` in the function. Free-tier models and their limits change often, so check Google AI Studio and pick a Flash or Flash-Lite model that is free on your project.
- `AI_SEARCH_DAILY_LIMIT`: messages per account per Asia/Manila day (default 30).

Then apply the migration and deploy the function:

- Migration `supabase/migrations/20261028200000_ai_search_usage.sql` adds `ai_search_usage` and `consume_ai_search_allowance()`. Only the service role can use them.
- Deploy with `supabase functions deploy ai-search`. `verify_jwt = true` is set in `supabase/config.toml`.

Confirm the target project against the app's `EXPO_PUBLIC_SUPABASE_URL` before applying or deploying.

## Privacy

Free-tier Gemini prompts may be used by Google to improve its products. Only the typed chat text is sent (last 6 messages, 500 characters each). No profile data is sent, the chat shows a reminder not to share personal details, and the function never logs message text.

## Keeping lists in sync

The edge function keeps its own copy of the allowed cities, types, furnishing values and amenity ids for the Gemini prompt and schema, because Deno cannot import the workspace packages. If they drift, nothing unsafe happens: the app drops any value `sanitizeAiFilters` does not know. Update both `supabase/functions/ai-search/index.ts` and `packages/utils/src/aiSearch.ts` when adding a searchable amenity.

## Tests

- `packages/utils/src/aiSearch.test.ts`: sanitizer, keyword reader (English, Tagalog, Taglish), browse-param mapper.
- `packages/utils/src/avaChat.test.ts`: reading answers, the fallback and reply choice.
- `apps/mobile/hooks/chat/useAIChat.test.ts`: chat flow with the service mocked.
- Edge function: `deno check ai-search/index.ts` from `supabase/functions`.

## Not done yet

- On mobile, "See more results" that opens the full search tab with Ava's filters (the web drawer has "See all results").
- Ava on the public (signed-out) Browse page: the function requires a signed-in account.
