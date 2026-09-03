import { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import MapView from 'react-native-maps';

import ScreenWrapper from 'components/layout/ScreenWrapper';
import StandardHeader from 'components/layout/StandardHeader';
import MapViewSwitcher from '@/components/maps/MapViewSwitcher';
import { MAP_DEFAULT_COORDS } from '@/utils/mapConfig';
import { bboxFromRegion, type BBox } from '@/service/apartments/mapSearchService';
import { useApartmentMapSearch } from '@/hooks/apartments/useApartmentMapSearch';
import { useFavorites } from '@/hooks/favorites';
import ApartmentCard from '@/components/cards/ApartmentCard';
import { IconNavigation, IconSearch, IconMapPin } from '@tabler/icons-react-native';
import { useColors } from '@/hooks/useTheme';

const INITIAL_REGION: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } = {
  latitude: MAP_DEFAULT_COORDS.latitude,
  longitude: MAP_DEFAULT_COORDS.longitude,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function TenantMapSearchScreen() {
  const router = useRouter();
  const { colors } = useColors();
  const mapRef = useRef<MapView>(null);

  const [bbox, setBbox] = useState<BBox | null>(bboxFromRegion(INITIAL_REGION));
  const [region, setRegion] = useState(INITIAL_REGION);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { apartments, loading, isFetching, error, refetch } = useApartmentMapSearch(bbox, { limit: 100 });
  const { isFavorite, toggleFavorite } = useFavorites();

  const pins = useMemo(
    () => apartments.map((a) => ({ latitude: a.latitude, longitude: a.longitude })),
    [apartments],
  );

  const handleRegionChangeComplete = useCallback((r: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }) => {
    setRegion(r);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setBbox(bboxFromRegion(r));
    }, 400);
  }, []);

  const handleRecenter = () => {
    // Switcher wraps GoogleMapView; animate via direct mapRef if Google, otherwise just reset bbox
    const gRef = mapRef.current as unknown as { animateToRegion?: (r: typeof INITIAL_REGION, d: number) => void };
    gRef?.animateToRegion?.(INITIAL_REGION, 400);
    setRegion(INITIAL_REGION);
    setBbox(bboxFromRegion(INITIAL_REGION));
  };

  const handlePressApartment = (id: string) => {
    router.push(`/apartment/${id}` as any);
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleFavorite(id);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ScreenWrapper header={<StandardHeader title="Map Search" />} noBottomPadding>
      {/* Map */}
      <View className="flex-1 relative">
        <MapViewSwitcher
          latitude={region.latitude}
          longitude={region.longitude}
          pins={pins}
          interactive
          style={{ flex: 1 }}
          mapRef={mapRef as React.RefObject<any>}
          onRegionChangeComplete={handleRegionChangeComplete}
        />
        {/* Floating recenter */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleRecenter}
          className="absolute bottom-5 right-5 bg-surface p-3 rounded-full shadow-lg border border-border"
          style={{ elevation: 4 }}
        >
          <IconNavigation size={22} color={colors.primary} />
        </TouchableOpacity>

        {/* Top stats pill */}
        <View className="absolute top-3 left-4 right-4 flex-row items-center justify-between">
          <View className="bg-surface px-3 py-2 rounded-full shadow border border-border flex-row items-center gap-2">
            <IconSearch size={16} color={colors.textPrimary} />
            <Text className="text-sm font-nunitoSemiBold text-foreground">
              {loading ? 'Searching…' : `${apartments.length} in this area`}
            </Text>
            {isFetching && <ActivityIndicator size="small" color={colors.primary} />}
          </View>
        </View>

        {/* Error banner */}
        {error && (
          <View className="absolute top-16 left-4 right-4 bg-dangerLight border border-danger/20 px-3 py-2 rounded-xl">
            <Text className="text-sm text-danger font-inter">{error}</Text>
          </View>
        )}
      </View>

      {/* Bottom list */}
      <View className="h-[42%] bg-background border-t border-border">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <Text className="text-base font-nunitoSemiBold text-foreground">
            {apartments.length === 0 ? 'No apartments in this area' : `${apartments.length} apartments`}
          </Text>
          <Text className="text-xs text-muted font-inter">Pan map to search</Text>
        </View>

        {loading && apartments.length === 0 ? (
          <View className="flex-1 items-center justify-center py-8">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-sm text-muted font-inter mt-3">Loading map results…</Text>
          </View>
        ) : apartments.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6 py-8">
            <View className="bg-surface-secondary p-4 rounded-full mb-3">
              <IconMapPin size={28} color={colors.gray400} />
            </View>
            <Text className="text-base font-nunitoSemiBold text-foreground text-center">No results here</Text>
            <Text className="text-sm text-muted font-inter text-center mt-1">
              Try panning or zooming out to the CAMANAVA area. Tap recenter to go back.
            </Text>
            <TouchableOpacity onPress={handleRecenter} className="mt-4 px-4 py-2 bg-primary rounded-full">
              <Text className="text-white font-nunitoSemiBold text-sm">Recenter map</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={apartments}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ gap: 8, paddingHorizontal: 12 }}
            contentContainerStyle={{ paddingVertical: 12, gap: 12 }}
            refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
            renderItem={({ item }) => (
              <ApartmentCard
                id={item.id}
                name={item.name}
                location={`${item.barangay}, ${item.city}`}
                monthlyRent={item.monthly_rent}
                noBedroom={item.no_bedrooms}
                noBathroom={item.no_bathrooms}
                areaSqm={item.area_sqm}
                ratings={item.average_rating?.toFixed(1) ?? '0.0'}
                isVerified={item.is_verified}
                thumbnail={item.coverThumbUrl ? { uri: item.coverThumbUrl } : item.coverUrl ? { uri: item.coverUrl } : undefined}
                isGrid
                isFavorite={isFavorite(item.id)}
                onPress={() => handlePressApartment(item.id)}
                onPressFavorite={() => void handleToggleFavorite(item.id)}
              />
            )}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
