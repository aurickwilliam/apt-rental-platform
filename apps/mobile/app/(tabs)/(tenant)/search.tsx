import { View, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Text } from 'react-native';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'expo-router';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

import {
  IconMapPinFilled,
  IconChevronDown,
  IconChevronUp,
  IconLayoutGrid,
  IconLayoutList,
} from '@tabler/icons-react-native';

import ScreenWrapper from 'components/layout/ScreenWrapper';
import DropdownButton from 'components/buttons/DropdownButton';
import SearchField from 'components/inputs/SearchField';
import ApartmentCard from 'components/display/ApartmentCard';
import FilterBottomSheet, {
  DEFAULT_FILTERS,
  FilterState,
} from 'components/display/FilterBottomSheet';

import { APARTMENT_TYPES, COLORS, FLOOR_LEVELS, FURNISHED_TYPES, LEASE_DURATIONS } from '@repo/constants';
import { supabase } from '@repo/supabase';

const CITIES = ['CAMANAVA', 'Caloocan', 'Malabon', 'Navotas', 'Valenzuela'];
const PAGE_SIZE = 10;

const MIN_BUDGET = 1000;
const MAX_BUDGET = 50000;
const MIN_SIZE   = 10;
const MAX_SIZE   = 300;

export default function Search() {
  const router = useRouter();

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

  const pageRef = useRef(0);

  const filterSheetRef = useRef<BottomSheetModal>(null) as React.RefObject<BottomSheetModal>;

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
    search: string,
  ) => {
    let query = supabase
      .from('apartments')
      .select(`
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

    // Search filter — matches name or barangay
    if (search.trim()) {
      query = query.or(
        `name.ilike.%${search.trim()}%,barangay.ilike.%${search.trim()}%,city.ilike.%${search.trim()}%`
      );
    }

    // City / location filter
    if (city !== 'CAMANAVA') {
      query = query.eq('city', city);
    }

    if (activeFilters) {
      // Budget
      if (activeFilters.budget[0] > MIN_BUDGET) {
        query = query.gte('monthly_rent', activeFilters.budget[0]);
      }
      if (activeFilters.budget[1] < MAX_BUDGET) {
        query = query.lte('monthly_rent', activeFilters.budget[1]);
      }

      // Unit type
      if (activeFilters.unitTypes.length > 0 &&
          activeFilters.unitTypes.length < APARTMENT_TYPES.length) {
        query = query.in('type', activeFilters.unitTypes);
      }

      // Bedrooms
      if (activeFilters.bedrooms !== 'Any') {
        if (activeFilters.bedrooms === '4+') {
          query = query.gte('no_bedrooms', 4);
        } else {
          query = query.eq('no_bedrooms', Number(activeFilters.bedrooms));
        }
      }

      // Bathrooms
      if (activeFilters.bathrooms !== 'Any') {
        if (activeFilters.bathrooms === '4+') {
          query = query.gte('no_bathrooms', 4);
        } else {
          query = query.eq('no_bathrooms', Number(activeFilters.bathrooms));
        }
      }

      // Size range
      if (activeFilters.sizeRange[0] > MIN_SIZE) {
        query = query.gte('area_sqm', activeFilters.sizeRange[0]);
      }
      if (activeFilters.sizeRange[1] < MAX_SIZE) {
        query = query.lte('area_sqm', activeFilters.sizeRange[1]);
      }

      // Furnishing
      if (activeFilters.furnishing.length > 0 &&
          activeFilters.furnishing.length < FURNISHED_TYPES.length) {
        query = query.in('furnished_type', activeFilters.furnishing);
      }

      // Floor level
      if (activeFilters.floorLevel.length > 0 &&
          activeFilters.floorLevel.length < FLOOR_LEVELS.length) {
        query = query.in('floor_level', activeFilters.floorLevel);
      }

      // Lease duration
      if (activeFilters.leaseDuration.length > 0 &&
          activeFilters.leaseDuration.length < LEASE_DURATIONS.length) {
        query = query.in('lease_duration', activeFilters.leaseDuration);
      }
      
      // Amenities (array contains)
      if (activeFilters.amenities.length > 0) {
        query = query.contains('amenities', activeFilters.amenities);
      }

      // Sort
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
      // Default sort when no filters applied
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
        isFavorite: false,
        monthlyRent: apt.monthly_rent,
        noBedroom: apt.no_bedrooms,
        noBathroom: apt.no_bathrooms,
        areaSqm: apt.area_sqm,
        isGrid: true,
      };
    });

  // Initial load / city change / filter apply — resets to page 0
  const fetchApartments = useCallback(
    async (isRefresh = false, activeFilters: FilterState | null = filters) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        pageRef.current = 0;

        const { data, error: supabaseError, count } = await buildQuery(
          0, PAGE_SIZE - 1, selectedCity, activeFilters, debouncedSearch
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
        from, to, selectedCity, filters, debouncedSearch
      );
      if (supabaseError) throw supabaseError;

      const transformed = transformData(data ?? []);
      if (transformed.length === 0) {
        setHasMore(false);
      } else {
        setApartments((prev) => {
          const existingIds = new Set(prev.map(p => p.id));
          const newItems = transformed.filter(t => !existingIds.has(t.id));
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
    if (filters.unitTypes.length > 0 && filters.unitTypes.length < APARTMENT_TYPES.length) count++;
    if (filters.bedrooms !== 'Any') count++;
    if (filters.bathrooms !== 'Any') count++;
    if (filters.sizeRange[0] > MIN_SIZE || filters.sizeRange[1] < MAX_SIZE) count++;
    if (filters.furnishing.length > 0 && filters.furnishing.length < FURNISHED_TYPES.length) count++;
    if (filters.floorLevel.length > 0 && filters.floorLevel.length < FLOOR_LEVELS.length) count++;
    if (filters.leaseDuration.length > 0 && filters.leaseDuration.length < LEASE_DURATIONS.length) count++;
    if (filters.sortBy !== 'newest') count++;
    if (filters.amenities.length > 0) count++;
    
    return count;
  }, [filters]);

  const toggleFavorite = useCallback((id: string) => {
    setApartments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, isFavorite: !apt.isFavorite } : apt))
    );
  }, []);

  const handleApartmentPress = (id: string) => router.push(`/apartment/${id}`);

  const renderApartmentCard = ({ item }: { item: ApartmentCardProps }) => (
    <ApartmentCard
      {...item}
      isGrid={isGridView}
      onPress={() => handleApartmentPress(item.id)}
      onPressFavorite={() => toggleFavorite(item.id)}
    />
  );

  const renderEmptyState = () => (
    <View className='flex-1 items-center justify-center py-10'>
      <Text className='text-lg text-grey-500 font-poppinsMedium'>
        {error ?? 'No apartments found'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className='py-4 items-center'>
        <ActivityIndicator size='small' color={COLORS.primary} />
      </View>
    );
  };

  return (
    <ScreenWrapper className='py-5' backgroundColor={COLORS.darkerWhite}>
      <View className='flex-row items-center justify-between mb-6 px-5'>
        <View className='flex-row gap-2'>
          <IconMapPinFilled size={30} color={COLORS.primary} />
          <DropdownButton
            bottomSheetLabel='Select Location'
            options={CITIES}
            value={selectedCity}
            onSelect={setSelectedCity}
            textClassName='text-2xl text-text font-poppinsSemiBold leading-[34px]'
            buttonClassName='bg-transparent flex-row items-center justify-center gap-1'
            openIcon={IconChevronUp}
            closeIcon={IconChevronDown}
          />
        </View>

        <TouchableOpacity activeOpacity={0.7} onPress={() => setIsGridView((prev) => !prev)}>
          {isGridView
            ? <IconLayoutGrid size={26} color={COLORS.grey} />
            : <IconLayoutList size={26} color={COLORS.grey} />
          }
        </TouchableOpacity>
      </View>

      <View className='px-5 mb-3'>
        <SearchField
          searchValue={searchQuery}
          onChangeSearch={setSearchQuery}
          showFilterButton
          onFilterPress={openFilterSheet}
        />

        {(activeFilterCount > 0 || resultCount !== undefined) && (
          <View className='flex-row items-center justify-between mt-3'>

            {/* Left: active filters chip */}
            {activeFilterCount > 0 ? (
              <TouchableOpacity
                onPress={handleClearFilters}
                activeOpacity={0.7}
                className='flex-row items-center gap-1 bg-primary/10 rounded-full px-3 py-1'
              >
                <Text className='text-primary text-sm font-poppinsMedium'>
                  {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
                </Text>
                <Text className='text-primary text-sm font-poppinsBold'>✕</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}

            {/* Right: apartment count */}
            {resultCount !== undefined && (
              <Text className='text-sm text-grey-500 font-poppinsRegular'>
                {loading
                  ? 'Searching...'
                  : `${resultCount} ${resultCount === 1 ? 'apartment' : 'apartments'} found`}
              </Text>
            )}

          </View>
        )}
      </View>

      {loading && !refreshing ? (
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          key={isGridView ? 'grid' : 'list'}
          data={apartments}
          renderItem={renderApartmentCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={isGridView ? 2 : 1}
          columnWrapperStyle={isGridView ? { paddingHorizontal: 16, gap: 8 } : undefined}
          contentContainerStyle={{ paddingBottom: 16, gap: 16 }}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchApartments(true)}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}

      {/* ── Filter Bottom Sheet ── */}
      <FilterBottomSheet
        bottomSheetRef={filterSheetRef}
        resultCount={resultCount}
        initialFilters={filters ?? DEFAULT_FILTERS}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
    </ScreenWrapper>
  );
}