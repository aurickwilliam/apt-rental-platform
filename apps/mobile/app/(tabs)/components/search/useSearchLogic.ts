import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

import { APARTMENT_TYPES, FLOOR_LEVELS, FURNISHED_TYPES, LEASE_DURATIONS } from '@repo/constants';
import { supabase } from '@repo/supabase';

import { useFavorites } from '@/hooks/useFavorites';
import { type FilterState } from 'components/display/FilterBottomSheet';

const CITIES = ['CAMANAVA', 'Caloocan', 'Malabon', 'Navotas', 'Valenzuela'];
const PAGE_SIZE = 10;

const MIN_BUDGET = 1000;
const MAX_BUDGET = 50000;
const MIN_SIZE = 10;
const MAX_SIZE = 300;

export default function useSearchLogic() {
  const [apartments, setApartments] = useState<ApartmentCardProps[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>(CITIES[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState | null>(null);
  const [resultCount, setResultCount] = useState<number | undefined>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isGridView, setIsGridView] = useState<boolean>(true);
  const { isFavorite, toggleFavorite } = useFavorites();

  const pageRef = useRef(0);

  const filterSheetRef = useRef<BottomSheetModal>(null!);

  const openFilterSheet = useCallback(() => {
    filterSheetRef.current?.present();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const buildQuery = (
    from: number,
    to: number,
    city: string,
    activeFilters: FilterState | null,
    search: string
  ) => {
    let query = supabase
      .from('apartments')
      .select(
        `
        id,
        name,
        barangay,
        city,
        average_rating,
        monthly_rent,
        no_bedrooms,
        no_bathrooms,
        area_sqm,
        apartment_images (
          url,
          is_cover,
          created_at
        )`,
        { count: 'exact' }
      )
      .is('deleted_at', null)
      .range(from, to);

    if (search.trim()) {
      query = query.or(
        `name.ilike.%${search.trim()}%,barangay.ilike.%${search.trim()}%,city.ilike.%${search.trim()}%`
      );
    }

    if (city !== 'CAMANAVA') {
      query = query.eq('city', city);
    }

    if (activeFilters) {
      if (activeFilters.budget[0] > MIN_BUDGET) {
        query = query.gte('monthly_rent', activeFilters.budget[0]);
      }
      if (activeFilters.budget[1] < MAX_BUDGET) {
        query = query.lte('monthly_rent', activeFilters.budget[1]);
      }

      if (
        activeFilters.unitTypes.length > 0 &&
        activeFilters.unitTypes.length < APARTMENT_TYPES.length
      ) {
        query = query.in('type', activeFilters.unitTypes);
      }

      if (activeFilters.bedrooms !== 'Any') {
        if (activeFilters.bedrooms === '4+') {
          query = query.gte('no_bedrooms', 4);
        } else {
          query = query.eq('no_bedrooms', Number(activeFilters.bedrooms));
        }
      }

      if (activeFilters.bathrooms !== 'Any') {
        if (activeFilters.bathrooms === '4+') {
          query = query.gte('no_bathrooms', 4);
        } else {
          query = query.eq('no_bathrooms', Number(activeFilters.bathrooms));
        }
      }

      if (activeFilters.sizeRange[0] > MIN_SIZE) {
        query = query.gte('area_sqm', activeFilters.sizeRange[0]);
      }
      if (activeFilters.sizeRange[1] < MAX_SIZE) {
        query = query.lte('area_sqm', activeFilters.sizeRange[1]);
      }

      if (
        activeFilters.furnishing.length > 0 &&
        activeFilters.furnishing.length < FURNISHED_TYPES.length
      ) {
        query = query.in('furnished_type', activeFilters.furnishing);
      }

      if (
        activeFilters.floorLevel.length > 0 &&
        activeFilters.floorLevel.length < FLOOR_LEVELS.length
      ) {
        query = query.in('floor_level', activeFilters.floorLevel);
      }

      if (
        activeFilters.leaseDuration.length > 0 &&
        activeFilters.leaseDuration.length < LEASE_DURATIONS.length
      ) {
        query = query.in('lease_duration', activeFilters.leaseDuration);
      }

      if (activeFilters.amenities.length > 0) {
        query = query.contains('amenities', activeFilters.amenities);
      }

      switch (activeFilters.sortBy) {
        case 'price_asc':
          query = query.order('monthly_rent', { ascending: true }).order('id', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('monthly_rent', { ascending: false }).order('id', { ascending: true });
          break;
        case 'most_popular':
          query = query.order('average_rating', { ascending: false }).order('id', { ascending: true });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false }).order('id', { ascending: true });
          break;
      }
    } else {
      query = query.order('created_at', { ascending: false }).order('id', { ascending: true });
    }

    return query;
  };

  const transformData = (data: any[]): ApartmentCardProps[] =>
    data.map((apt) => {
      const images = apt.apartment_images ?? [];
      const thumbnailUrl =
        images.find((img: any) => img.is_cover)?.url ??
        images.sort(
          (a: any, b: any) =>
            new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
        )[0]?.url ??
        undefined;

      return {
        id: apt.id,
        thumbnail: thumbnailUrl ? { uri: thumbnailUrl } : undefined,
        name: apt.name,
        location: `${apt.barangay}, ${apt.city}`,
        ratings: apt.average_rating?.toFixed(1) ?? '0.0',
        monthlyRent: apt.monthly_rent,
        noBedroom: apt.no_bedrooms,
        noBathroom: apt.no_bathrooms,
        areaSqm: apt.area_sqm,
        isGrid: true,
      };
    });

  const fetchApartments = useCallback(
    async (isRefresh = false, activeFilters: FilterState | null = filters) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        pageRef.current = 0;

        const { data, error: supabaseError, count } = await buildQuery(
          0,
          PAGE_SIZE - 1,
          selectedCity,
          activeFilters,
          debouncedSearch
        );
        if (supabaseError) throw supabaseError;

        const transformed = transformData(data ?? []);
        setApartments(transformed);
        setResultCount(count ?? 0);
        setHasMore(transformed.length === PAGE_SIZE);
      } catch (err: any) {
        console.error('Error fetching apartments:', err);
        setError(err?.message ?? 'Something went wrong.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedCity, filters, debouncedSearch]
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const nextPage = pageRef.current + 1;
      const from = nextPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error: supabaseError } = await buildQuery(
        from,
        to,
        selectedCity,
        filters,
        debouncedSearch
      );
      if (supabaseError) throw supabaseError;

      const transformed = transformData(data ?? []);
      if (transformed.length === 0) {
        setHasMore(false);
      } else {
        setApartments((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newItems = transformed.filter((t) => !existingIds.has(t.id));
          return [...prev, ...newItems];
        });
        pageRef.current = nextPage;
        setHasMore(transformed.length === PAGE_SIZE);
      }
    } catch (err: any) {
      console.error('Error loading more:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, selectedCity, filters, debouncedSearch]);

  useEffect(() => {
    fetchApartments();
  }, [fetchApartments, debouncedSearch]);

  const handleApplyFilters = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      fetchApartments(false, newFilters);
    },
    [fetchApartments]
  );

  const handleClearFilters = useCallback(() => {
    setFilters(null);
    fetchApartments(false, null);
  }, [fetchApartments]);

  const activeFilterCount = useMemo(() => {
    if (!filters) return 0;
    let count = 0;

    if (filters.budget[0] > MIN_BUDGET || filters.budget[1] < MAX_BUDGET) count++;
    if (filters.unitTypes.length > 0 && filters.unitTypes.length < APARTMENT_TYPES.length)
      count++;
    if (filters.bedrooms !== 'Any') count++;
    if (filters.bathrooms !== 'Any') count++;
    if (filters.sizeRange[0] > MIN_SIZE || filters.sizeRange[1] < MAX_SIZE) count++;
    if (filters.furnishing.length > 0 && filters.furnishing.length < FURNISHED_TYPES.length)
      count++;
    if (filters.floorLevel.length > 0 && filters.floorLevel.length < FLOOR_LEVELS.length) count++;
    if (filters.leaseDuration.length > 0 && filters.leaseDuration.length < LEASE_DURATIONS.length)
      count++;
    if (filters.sortBy !== 'newest') count++;
    if (filters.amenities.length > 0) count++;

    return count;
  }, [filters]);

  const handleToggleFavorite = useCallback(
    async (id: string) => {
      try {
        await toggleFavorite(id);
      } catch (err) {
        console.error('Error toggling favorite:', err);
      }
    },
    [toggleFavorite]
  );

  return {
    apartments,
    activeFilterCount,
    cities: CITIES,
    debouncedSearch,
    error,
    fetchApartments,
    filters,
    filterSheetRef,
    handleApplyFilters,
    handleClearFilters,
    handleToggleFavorite,
    isFavorite,
    isGridView,
    loading,
    loadingMore,
    loadMore,
    openFilterSheet,
    refreshing,
    resultCount,
    searchQuery,
    selectedCity,
    setIsGridView,
    setSearchQuery,
    setSelectedCity,
  };
}
