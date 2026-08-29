# Netflix-Style Search Refactor — A2 Parallel Sections (6 defs × 8, Always Lazy, RPC Batch)

> **Tenant Search Tab** (`apps/mobile/app/(tabs)/(tenant)/search.tsx` + `components/search/ApartmentsList.tsx` / `useSearchLogic.tsx` (PAGE_SIZE 10, `buildQuery`, `FlatList` vertical grid/list) → **Netflix default search**: 6 horizontal sections, each 8 cards, lazy-loaded, batched RPC `get_search_sections`.

Status: ✅ Approved A2 with constraints: 6 defs, 8 per section, always lazy, implement RPC now, egress-optimized.
Related: `DESIGN.md §11` cards `bg-surface rounded-2xl border-border`, `§5` `p-5`, `§12` lists `FlatList` virtualization.

---

## 1. Goals & Non-Goals

**Goals:**
* Default search (no query/filters) shows Netflix-style discovery: 6 horizontally scrollable rows (`FlatList horizontal`) each titled by similar-apartment cohort, `8` cards per row (fixed `w-56` like web or `w-40` mobile) with `gap-3`, `Snap` optional.
* Sections of *similar apartments* defined server-side (verified, budget, type, rating, location, size) — curated, not just slice of single query.
* Always lazy: only fetch sections when scrolled into viewport (`onViewableItemsChanged` on vertical sections list). Initial viewport fetches ≤2 sections.
* Single RPC `get_search_sections(p_city text, p_search text, p_filters jsonb default '{}', p_limit int default 8)` returns `jsonb { sections: [{id, title, apartments: ApartmentRow[]}] }` in **1 HTTP round-trip** (vs A2 naive `4×` HTTP). React Query cache (`staleTime 30s`, `gcTime 5m`) + `400ms` debounce + `AbortController`.
* Keep `SearchHeader` (city dropdown), `SearchFiltersBar` (search + filter chip + resultCount), `FilterBottomSheet`, `isFavorite`/`toggleFavorite`, pull-to-refresh (per-section or global — see §4).

**Non-Goals (MVP):**
* No per-section infinite horizontal pagination beyond 8 preview; “See All” pushes to `app/search/section/[sectionId].tsx` vertical grid with its own `loadMore` (future).
* No personalization (user history) yet — sections are deterministic by attributes.
* Upload dashed inputs, `DropdownField`/`DateField` not touched.

---

## 2. Section Definitions (6 defs — Approved)

All sections respect `deleted_at is null`, `status='available'`-like, and inherit `selectedCity` (CAMANAVA vs specific city) + `debouncedSearch` (ilike on name/barangay/city) at server. If `p_search` present, sections collapse to filtered cohorts; if all sections empty, fallback to global `newest`.

| # | `id` | `title` (en) | Server Filter (`where`) | Order | Notes |
|---|------|--------------|--------------------------|-------|-------|
| 1 | `verified` | `Verified in {city}` | `is_verified = true` | `average_rating desc, id asc` | Trust signal, `DESIGN.md §2` |
| 2 | `budget_low` | `Under ₱10k` | `monthly_rent <= 10000` | `monthly_rent asc` | Entry, `AGENTS.md` price formatting |
| 3 | `studio` | `Studio Units` | `type = 'Studio'` (or `no_bedrooms = 0`) | `created_at desc` | Maps `APARTMENT_TYPES` |
| 4 | `top_rated` | `Top Rated` | `average_rating >= 4.5` | `average_rating desc` | `no_ratings >0` |
| 5 | `near_you` | `Near {city}` | `city = p_city` (if CAMANAVA → no city filter, use `barangay` proximity later) | `created_at desc` | Location relevance |
| 6 | `spacious` | `Spacious (≥60sqm)` | `area_sqm >= 60` | `area_sqm desc` | Alternative to family 3+ bed — change to `family` (`no_bedrooms >=3`) if preferred; both use `CAMANAVA` stock |

Each returns up to `p_limit = 8` rows with `apartment_images` (thumb `url_thumb`/`url` is_cover logic already in `transformData`), shaped as `ApartmentCardProps`.

---

## 3. Data Design — RPC Batch (1 Round-Trip, Egress Optimized)

### 3.1 Current `buildQuery` baseline (`useSearchLogic.tsx:57-188`)

* `select id,name,barangay,city,average_rating,monthly_rent,no_bedrooms,no_bathrooms,area_sqm,is_verified,apartment_images(url,url_thumb,is_cover,created_at)`, `{count:"estimated"}`, `is("deleted_at",null)`, `range(from,to)`, `order(created_at/id)` + dynamic `eq`/`gte`/`in`/`contains` for filters. Already bounded (10), estimated count, only needed cols — keep.

### 3.2 RPC `public.get_search_sections`

```sql
create or replace function public.get_search_sections(
  p_city text default 'CAMANAVA',
  p_search text default null,
  p_filters jsonb default '{}'::jsonb, -- optional: verifiedOnly, budget etc. for future filtered sections
  p_limit int default 8
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_search text := nullif(trim(p_search), '');
  result jsonb;
begin
  -- RLS: respect public read (apartments is public.select). SECURITY DEFINER bypasses RLS; ensure we only expose non-deleted.
  -- Build sections as CTEs returning jsonb_agg of shaped rows (id, name, barangay, city, average_rating, monthly_rent, no_bedrooms, no_bathrooms, area_sqm, is_verified, thumbnail)
  -- Each section CTE: select ... from apartments left join apartment_images ... where deleted_at is null [and city filter] [and section filter] [and search ilike] order by ... limit p_limit
  -- Then select jsonb_build_object('sections', jsonb_build_array( ... ))
  -- Use `estimated` not needed; no count per section (preview only).
  -- Example verified:
  --   select jsonb_agg(to_jsonb(t)) from (select a.id, a.name, ... , (select url_thumb from apartment_images where apartment_id=a.id and is_cover order by created_at limit 1) as thumbnail from apartments a where a.deleted_at is null and a.is_verified and (p_city='CAMANAVA' or a.city=p_city) and (v_search is null or a.name ilike '%'||v_search||'%') order by average_rating desc, id limit p_limit) t
  return result;
end;
$$;
grant execute on function public.get_search_sections(text,text,jsonb,int) to authenticated, anon;
-- RLS: function is SECURITY DEFINER but only selects public apartments where deleted_at is null; no user PII leaked. Add comment.
```

*Why RPC vs `useQueries` N×?* Egress: 1 HTTP (vs 6×). Latency: parallel CTEs server-side in one plan, still 6 index scans but 1 round-trip, 1 connection, 1 `count` avoided. Cache key remains single `['searchSections', p_city, p_search, hash(p_filters)]` → React Query `staleTime 30s` deduplicates. Alternative fallback: if RPC not desired, document `useQueries` fan-out with same mitigations — keep RPC as primary per approval.

*Indexes to verify via `supabase_get_advisors`:* `apartments(city, is_verified, monthly_rent, type, average_rating, area_sqm, created_at)` composite or separate btree on each filtered col + `apartment_images(apartment_id, is_cover)`.

*Payload:* 6×8×~600B row ≈ 28KB json per default search vs 6×8 separate = same data but 1 header. With `SECTION_LIMIT 8` and no `count`, egress ~3× smaller than `useSearchLogic` 10-row + count.

### 3.3 React Query Hook `useSearchSections.ts`

```ts
// apps/mobile/app/(tabs)/components/search/useSearchSections.ts
export const SECTION_DEFS = [...] // 6 defs above, used for title/id only (server does filtering)
export function useSearchSections({ selectedCity, debouncedSearch, filters }) {
  // Lazy: track viewable section ids
  const [enabledSections, setEnabled] = useState<Set<string>>(new Set([SECTION_DEFS[0].id, SECTION_DEFS[1].id]));
  const onViewableChanged = useCallback(({viewableItems}) => {
    setEnabled(prev => new Set([...prev, ...viewableItems.map(v=>v.item.id)]));
  }, []);
  const query = useQuery({
    queryKey: ['searchSections', selectedCity, debouncedSearch, hash(filters)],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase.rpc('get_search_sections', {
        p_city: selectedCity,
        p_search: debouncedSearch || null,
        p_filters: filters ?? {},
        p_limit: 8,
      }).abortSignal(signal);
      if (error) throw error;
      return data.sections as Section[]; // {id, title, apartments: ApartmentCardProps[]}[]
    },
    staleTime: 30_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    enabled: enabledSections.size > 0,
  });
  // Per-section lazy: if always-lazy, gate queryFn to only include enabled sections server-side?
  // Alternative: single RPC returns all 6 but client only renders enabled; server still does 6 scans.
  // True lazy fan-out would need per-section RPCs; trade: single RPC simpler, still 6 scans but 1 HTTP. Keep single RPC + client filter to visible.
  return { sections: query.data ?? [], isLoading: query.isLoading, onViewableChanged, refetch: query.refetch };
}
```

*Always lazy* interpreted as **initial 2 sections enabled, rest on scroll** — but single RPC returns all 6 at once (still does 6 scans). To truly save DB, need per-section lazy fan-out (`useQueries` per section) — document as `Phase 2` if DB load exceeds. For MVP, **always lazy = client rendering lazy** (only mount `FlatList horizontal` when viewable) but RPC still batched; acceptable for 1-row apartments (4 rows) but not at scale. Note trade in doc.

*Abort:* `supabase.rpc(...).abortSignal(signal)` cancels prior debounced request.

---

## 4. UI Design

### 4.1 `search.tsx` Refactor

* Keep `ScreenWrapper` (`noBottomPadding`) + `SearchHeader` (`cities`, `selectedCity`, `isGridView` toggle → **remove** for Netflix? `isGridView` controlled grid/list today — Netflix has no toggle; keep for “See All” pages only or hide in search default. Proposal: keep toggle hidden when `sections` mode.
* Keep `SearchFiltersBar` (search + filter chip + `resultCount`).
* Replace `ApartmentsList` vertical `FlatList` with `SearchSectionsList.tsx`:
  ```tsx
  <FlatList
    data={sections} // 6
    keyExtractor={s=>s.id}
    renderItem={({item}) => <SearchSection section={item} onPressApartment={...} isFavorite={...} />}
    onViewableItemsChanged={onViewableChanged}
    viewabilityConfig={{ itemVisiblePercentThreshold: 30 }}
    contentContainerStyle={{ paddingBottom: FLOATING_TAB_BAR_HEIGHT + ..., gap: 24 }}
    ListEmptyComponent={<Text>No apartments found</Text>}
    refreshControl={<RefreshControl transparent + Spinner lg header like ApartmentsList.tsx:92-108>}
  />
  ```
  Nesting: vertical `FlatList` of sections, each section has **horizontal** `FlatList`. Set `nestedScrollEnabled` and `removeClippedSubviews` to avoid jank. Use `initialNumToRender={2}` vertical.

### 4.2 `SearchSection.tsx`

```tsx
function SearchSection({ section, onPressApartment, isFavorite, onToggleFavorite }) {
  const { colors } = useColors();
  if (!section.apartments.length) return null; // hide empty rows
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between px-5">
        <Text className="text-foreground text-lg font-nunitoSemiBold">{section.title}</Text>
        <Pressable onPress={() => router.push(`/search/section/${section.id}`)}>
          <Text className="text-primary text-sm font-nunitoSemiBold">See All</Text>
        </Pressable>
      </View>
      <FlatList
        horizontal
        data={section.apartments}
        keyExtractor={a=>a.id}
        renderItem={({item}) => (
          <View style={{ width: 160, marginLeft: 16 }}> {/* w-40 fixed, gap 8 */}
            <ApartmentCard {...item} isGrid={false} // forces w-56? override: wrap in fixed width View, ApartmentCard internally computes cardWidth by window — need prop `isHorizontal` to fix width
          </View>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16, gap: 12 }}
        snapToInterval={172} // 160+12
        decelerationRate="fast"
        initialNumToRender={4}
        windowSize={5}
        getItemLayout={(_,i)=>({length:172, offset:172*i, index:i})}
      />
    </View>
  );
}
```

* **Card fix:** `ApartmentCard.tsx:57` computes `cardWidth` by `window` — for horizontal need `isHorizontal` prop to return fixed `160` (or `200` for `w-56` web parity) instead of `width - padding`. Add prop or wrap with fixed `View` and make `ApartmentCard` accept `styleWidth` override.

### 4.3 `See All` Route

* `app/search/section/[sectionId].tsx` — vertical `FlatList` grid (`numColumns 2`, `columnWrapperStyle gap-8`) reusing `buildQuery` with section filter, `PAGE_SIZE 10` paginated, header `StandardHeader` title.

---

## 5. Styling & Tokens

* Section title: `font-nunitoSemiBold text-lg text-foreground` (`DESIGN.md §4`), `px-5` (`§5`).
* Horizontal gap `12` (3×4) vs vertical `gap-3` (`ApartmentCard` internal).
* Cards: `bg-surface rounded-2xl border border-border shadow-none` (`§11`), thumb `aspect-square`, price `text-accent`.
* Dark mode via `global.css` variables (`--surface`, `--border`).

---

## 6. Implementation Steps (Ordered)

1. **Migration:** `supabase_apply_migration` `get_search_sections` RPC (6 CTEs, limit 8, jsonb_agg). `grant execute`. Test via `supabase_execute_sql` `select get_search_sections('CAMANAVA', null, '{}', 8)`.
2. **Hook:** `useSearchSections.ts` with `useQuery` + `SECTION_DEFS` (6 defs) + `onViewableChanged` lazy set + `staleTime 30s`.
3. **Components:** `SearchSection.tsx` (horizontal), `SearchSectionsList.tsx` (vertical), `ApartmentCard` prop `isHorizontal`/`width` fix.
4. **Refactor `search.tsx`:** swap `ApartmentsList` for `SearchSectionsList`, keep `SearchHeader`/`SearchFiltersBar`/`FilterBottomSheet`, wire `debouncedSearch`/`selectedCity`/`filters` into `useSearchSections`, preserve `refreshing` (now `refetchSections`), `loadMore` per section future.
5. **Route `See All`:** `app/search/section/[sectionId].tsx` + `sectionFilterMap` reuse.
6. **Polish:** Skeleton per section (`SearchSectionSkeleton.tsx` 3 cards `Skeleton`), empty state, pull-to-refresh header like `ApartmentsList.tsx:92`, dark mode check.
7. **Advisors & Tests:** `supabase_get_advisors` security/performance, `pnpm --filter mobile lint`, `pnpm --filter mobile test` (mock `supabase.rpc` in `useSearchSections.test.tsx`).

---

## 7. Performance & Egress (Why A2 Now Still OK)

* **1 HTTP vs 6:** RPC batch cuts `6×` headers/TLS. `SECTION_LIMIT 8` × 6 = 48 rows × ~600B ≈ 29KB JSON vs single list 10 rows ≈ 6KB — ~5× egress but still < Starlink budget; `staleTime 30s` + `400ms` debounce + `AbortSignal` prevents typing burst `×N`.
* **Always lazy:** Initial mount renders 2 sections (first viewport), `onViewableChanged` enables remaining 4 on scroll — `FlatList` `removeClippedSubviews` unmounts offscreen horizontals.
* **No count:** Section queries skip `count:"estimated"` (preview only), saving planner cost.
* **Indexes:** Ensure `apartments(city, is_verified)`, `(monthly_rent)`, `(type)`, `(average_rating)`, `(area_sqm)` btree; `apartment_images(apartment_id)` via `supabase_get_advisors`.

---

## 8. Risks & Alternatives

* **Nested scroll jank (vertical + horizontal):** Mitigate with `nestedScrollEnabled`, fixed `getItemLayout`, `windowSize 5`, avoid `ScrollView` wrapping `FlatList`.
* **RPC `SECURITY DEFINER`:** Must `is("deleted_at",null)` filter inside function; no user PII. Document `REVOKE` from `anon` if needed.
* **Small dataset (1 apartment):** Sections will be empty/hide — show single “All Results” fallback.
* **Fallback if RPC fails:** Hook degrades to A1 client grouping (`useSearchLogic` 10 rows sliced) — keep `ApartmentsList` as fallback component.

---

## 9. Deliverables

* `.md` this file + `supabase` migration + `useSearchSections.ts` + `SearchSection*.tsx` + `search.tsx` refactor + `section/[sectionId].tsx` route + tests.
