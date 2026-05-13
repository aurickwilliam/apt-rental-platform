import { TouchableOpacity, View, Text, ActivityIndicator, FlatList } from 'react-native';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';

import {
  IconLayoutGrid,
  IconLayoutList
} from "@tabler/icons-react-native";

import ScreenWrapper from "components/layout/ScreenWrapper";
import StandardHeader from 'components/layout/StandardHeader';
import ApartmentCard from 'components/cards/ApartmentCard';

import { COLORS } from "@repo/constants";
import { useFavorites } from '@/hooks/useFavorites';
import { fetchApartmentsByIds, type FavoriteApartment } from '@/service/favoritesService';

export default function TenantFavorites() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [apartments, setApartments] = useState<ApartmentCardProps[]>([]);
  const [loadingApartments, setLoadingApartments] = useState(false);
  const [apartmentsError, setApartmentsError] = useState<string | null>(null);
  const { favoriteApartmentIds, loading: loadingFavorites, error: favoritesError, toggleFavorite } = useFavorites();

  useEffect(() => {
    setViewMode('grid');
  }, []);

  const favoriteApartmentIdList = useMemo(
    () => Array.from(favoriteApartmentIds),
    [favoriteApartmentIds]
  );

  const mapApartmentToCardProps = useCallback(
    (apartment: FavoriteApartment): ApartmentCardProps => {
      const images = apartment.apartment_images ?? [];
      const thumbnailUrl =
        images.find((img) => img.is_cover)?.url ??
        images.sort(
          (a, b) =>
            new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
        )[0]?.url ??
        undefined;

      return {
        id: apartment.id,
        thumbnail: thumbnailUrl ? { uri: thumbnailUrl } : undefined,
        name: apartment.name,
        location: `${apartment.barangay}, ${apartment.city}`,
        ratings: apartment.average_rating?.toFixed(1) ?? '0.0',
        isFavorite: true,
        monthlyRent: apartment.monthly_rent ?? 0,
        noBedroom: apartment.no_bedrooms ?? 0,
        noBathroom: apartment.no_bathrooms ?? 0,
        areaSqm: apartment.area_sqm ?? 0,
        isGrid: viewMode === 'grid',
      };
    },
    [viewMode]
  );

  useEffect(() => {
    const loadFavoriteApartments = async () => {
      if (favoriteApartmentIdList.length === 0) {
        setApartments([]);
        setApartmentsError(null);
        return;
      }

      try {
        setLoadingApartments(true);
        setApartmentsError(null);

        const apartmentRows = await fetchApartmentsByIds(favoriteApartmentIdList);
        const apartmentById = new Map(apartmentRows.map((row) => [row.id, row]));
        const orderedApartments = favoriteApartmentIdList
          .map((id) => apartmentById.get(id))
          .filter(Boolean) as FavoriteApartment[];

        setApartments(orderedApartments.map(mapApartmentToCardProps));
      } catch (err: any) {
        console.error('Error fetching favorite apartments:', err);
        setApartmentsError(err?.message ?? 'Failed to load favorites.');
      } finally {
        setLoadingApartments(false);
      }
    };

    loadFavoriteApartments();
  }, [favoriteApartmentIdList, mapApartmentToCardProps]);

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  const handleFavoriteToggle = useCallback(
    async (id: string) => {
      try {
        await toggleFavorite(id);
      } catch (err) {
        console.error('Error toggling favorite:', err);
      }
    },
    [toggleFavorite]
  );

  // Icon to toggle view mode
  const ToggleFavoritesView = (
    <TouchableOpacity
      activeOpacity={0.7}
      className='p-1 -mr-1'
      onPress={toggleViewMode}
    >
      {
        viewMode === 'grid'
          ? (
            <IconLayoutList 
              size={24}
              color={COLORS.white}
            />
          ) : (
            <IconLayoutGrid
              size={24}
              color={COLORS.white}
            />
          )
      }
    </TouchableOpacity>
  );

  const isLoading = loadingFavorites || loadingApartments;
  const combinedError = favoritesError ?? apartmentsError;

  return (
    <ScreenWrapper 
      scrollable
      className='pt-5'
      header={
        <StandardHeader 
          title='Favorites Apartment'
          rightComponent={ToggleFavoritesView}
        />
      }
      backgroundColor={COLORS.darkerWhite}
      noBottomPadding
    >
      {isLoading ? (
        <View className='flex-1 items-center justify-center py-10'>
          <ActivityIndicator size='large' color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          key={viewMode === 'grid' ? 'grid' : 'list'}
          data={apartments}
          renderItem={({ item: apartment }) => (
            <ApartmentCard
              {...apartment}
              isGrid={viewMode === 'grid'}
              onPress={() => router.push(`/apartment/${apartment.id}`)}
              onPressFavorite={() => {
                void handleFavoriteToggle(apartment.id);
              }}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          numColumns={viewMode === 'grid' ? 2 : 1}
          columnWrapperStyle={viewMode === 'grid' ? { paddingHorizontal: 16, gap: 8 } : undefined}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 16, gap: 16 }}
          ListEmptyComponent={
            <View className='flex-1 items-center justify-center py-10'>
              <Text className='text-lg text-grey-500 font-poppinsMedium'>
                {combinedError ?? 'No favorite apartments yet'}
              </Text>
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
}
