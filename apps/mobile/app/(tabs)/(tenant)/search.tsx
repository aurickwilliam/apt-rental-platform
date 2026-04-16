import { View, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Text } from 'react-native';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'expo-router';

import {
  IconMapPinFilled,
  IconChevronDown,
  IconChevronUp,
  IconLayoutGrid,
} from '@tabler/icons-react-native';

import ScreenWrapper from 'components/layout/ScreenWrapper';
import DropdownButton from 'components/buttons/DropdownButton';
import SearchField from 'components/inputs/SearchField';
import ApartmentCard from 'components/display/ApartmentCard';

import { COLORS } from '@repo/constants';
import { supabase } from '@repo/supabase';

const CITIES = ['CAMANAVA', 'Caloocan', 'Malabon', 'Navotas', 'Valenzuela'];
const PAGE_SIZE = 10;

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
  const pageRef = useRef(0);

  const buildQuery = (from: number, to: number, city: string) => {
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
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (city !== 'CAMANAVA') {
      query = query.eq('city', city);
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

  // Initial load or refresh — resets list to page 0
  const fetchApartments = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);
        pageRef.current = 0;

        const { data, error: supabaseError } = await buildQuery(0, PAGE_SIZE - 1, selectedCity);
        if (supabaseError) throw supabaseError;

        const transformed = transformData(data ?? []);
        setApartments(transformed);
        setHasMore(transformed.length === PAGE_SIZE);
      } catch (err: any) {
        console.error('Error fetching apartments:', err);
        setError(err?.message ?? 'Something went wrong.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedCity]
  );

  // Called when the user scrolls near the bottom
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = pageRef.current + 1;
      const from = nextPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error: supabaseError } = await buildQuery(from, to, selectedCity);
      if (supabaseError) throw supabaseError;

      const transformed = transformData(data ?? []);

      if (transformed.length === 0) {
        setHasMore(false);
      } else {
        setApartments((prev) => [...prev, ...transformed]);
        pageRef.current = nextPage;
        setHasMore(transformed.length === PAGE_SIZE);
      }
    } catch (err: any) {
      console.error('Error loading more apartments:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, selectedCity]);

  useEffect(() => {
    fetchApartments();
  }, [fetchApartments]);

  const filteredApartments = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return apartments;
    return apartments.filter(
      (apt) =>
        apt.name?.toLowerCase().includes(q) ||
        apt.location?.toLowerCase().includes(q)
    );
  }, [apartments, searchQuery]);

  const toggleFavorite = useCallback((id: string) => {
    setApartments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, isFavorite: !apt.isFavorite } : apt))
    );
  }, []);

  const handleApartmentPress = (id: string) => router.push(`/apartment/${id}`);

  const renderApartmentCard = ({ item }: { item: ApartmentCardProps }) => (
    <ApartmentCard
      {...item}
      isGrid
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

        <TouchableOpacity activeOpacity={0.7}>
          <IconLayoutGrid size={26} color={COLORS.grey} />
        </TouchableOpacity>
      </View>

      <View className='px-5 mb-5'>
        <SearchField
          searchValue={searchQuery}
          onChangeSearch={setSearchQuery}
          showFilterButton
        />
      </View>

      {loading && !refreshing ? (
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredApartments}
          renderItem={renderApartmentCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 16, gap: 8}}
          contentContainerStyle={{ paddingBottom: 16, gap: 16 }}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          onEndReached={searchQuery ? undefined : loadMore}
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
    </ScreenWrapper>
  );
}