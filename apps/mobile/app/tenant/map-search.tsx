import { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView from 'react-native-maps';

import MapViewSwitcher from '@/components/maps/MapViewSwitcher';
import { MAP_DEFAULT_COORDS } from '@/utils/mapConfig';
import {
  bboxContains,
  bboxFromRegion,
  bboxFromRegionWithMargin,
  filterPinsToVisible,
  type BBox,
} from '@/service/apartments/mapSearchService';
import { useApartmentMapSearch } from '@/hooks/apartments/useApartmentMapSearch';
import { useFavorites } from '@/hooks/favorites';
import { useUserLocation } from '@/hooks/location/useUserLocation';
import ApartmentCard from '@/components/cards/ApartmentCard';
import { IconNavigation, IconSearch, IconMapPin, IconChevronLeft, IconX, IconCompass } from '@tabler/icons-react-native';
import { useColors } from '@/hooks/useTheme';

const INITIAL_REGION: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } = {
  latitude: MAP_DEFAULT_COORDS.latitude,
  longitude: MAP_DEFAULT_COORDS.longitude,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

/** Extra query area per side so small pans reuse cached results instead of refetching. */
const BBOX_MARGIN = 0.25;
/** Ignore map taps shortly after a marker tap (Android fires both). */
const MARKER_TAP_GRACE_MS = 300;

export default function TenantMapSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useColors();
  const mapRef = useRef<MapView>(null);

  const [bbox, setBbox] = useState<BBox | null>(() => bboxFromRegionWithMargin(INITIAL_REGION, BBOX_MARGIN));
  const [region, setRegion] = useState(INITIAL_REGION);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queriedBboxRef = useRef<BBox>(bboxFromRegionWithMargin(INITIAL_REGION, BBOX_MARGIN));
  const lastMarkerTapRef = useRef(0);

  const { apartments, loading, isFetching, error } = useApartmentMapSearch(bbox, { limit: 100 });
  const { isFavorite, toggleFavorite } = useFavorites();
  const { coords: userCoords } = useUserLocation(true);

  const allPins = useMemo(
    () =>
      apartments.map((a) => ({
        id: a.id,
        latitude: a.latitude,
        longitude: a.longitude,
        price: a.monthly_rent,
        selected: a.id === selectedId,
      })),
    [apartments, selectedId],
  );

  // Viewport culling — only the visible pills mount (selected always kept).
  const visibleBbox = useMemo(() => bboxFromRegion(region), [region]);
  const pins = useMemo(() => filterPinsToVisible(allPins, visibleBbox), [allPins, visibleBbox]);

  const selected = useMemo(
    () => apartments.find((a) => a.id === selectedId) ?? null,
    [apartments, selectedId],
  );

  const handleRegionChangeComplete = useCallback((r: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }) => {
    setRegion(r);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const visible = bboxFromRegion(r);
      // Small pans/zoom-ins stay inside the buffered bbox — skip the refetch.
      if (queriedBboxRef.current && bboxContains(queriedBboxRef.current, visible)) return;
      const expanded = bboxFromRegionWithMargin(r, BBOX_MARGIN);
      queriedBboxRef.current = expanded;
      setBbox(expanded);
    }, 400);
  }, []);

  const handleMarkerPress = useCallback((id: string | null, index: number) => {
    lastMarkerTapRef.current = Date.now();
    const visiblePin = pins[index];
    const target = id ?? visiblePin?.id ?? null;
    setSelectedId(target);
  }, [pins]);

  const handleMapPress = useCallback(() => {
    if (Date.now() - lastMarkerTapRef.current < MARKER_TAP_GRACE_MS) return;
    setSelectedId(null);
  }, []);

  const handleRecenter = () => {
    const gRef = mapRef.current as unknown as { animateToRegion?: (r: typeof INITIAL_REGION, d: number) => void };
    if (userCoords) {
      const toUser: typeof INITIAL_REGION = {
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
      };
      gRef?.animateToRegion?.(toUser, 400);
      setRegion(toUser);
      const expanded = bboxFromRegionWithMargin(toUser, BBOX_MARGIN);
      queriedBboxRef.current = expanded;
      setBbox(expanded);
      setSelectedId(null);
      return;
    }
    // No location yet (or denied) — fall back to CAMANAVA default
    gRef?.animateToRegion?.(INITIAL_REGION, 400);
    setRegion(INITIAL_REGION);
    const expanded = bboxFromRegionWithMargin(INITIAL_REGION, BBOX_MARGIN);
    queriedBboxRef.current = expanded;
    setBbox(expanded);
    setSelectedId(null);
  };

  const handleBackToCoverage = () => {
    const gRef = mapRef.current as unknown as { animateToRegion?: (r: typeof INITIAL_REGION, d: number) => void };
    gRef?.animateToRegion?.(INITIAL_REGION, 400);
    setRegion(INITIAL_REGION);
    const expanded = bboxFromRegionWithMargin(INITIAL_REGION, BBOX_MARGIN);
    queriedBboxRef.current = expanded;
    setBbox(expanded);
    setSelectedId(null);
  };

  const handleCompassPress = () => {
    const gRef = mapRef.current as unknown as { animateCamera?: (cam: { heading: number }, opts: { duration: number }) => void };
    gRef?.animateCamera?.({ heading: 0 }, { duration: 350 });
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
    <View className="flex-1 bg-background">
      {/* Full-screen map */}
      <View className="flex-1 relative">
        <MapViewSwitcher
          latitude={region.latitude}
          longitude={region.longitude}
          pins={pins}
          interactive
          style={{ flex: 1 }}
          mapRef={mapRef as React.RefObject<any>}
          onRegionChangeComplete={handleRegionChangeComplete}
          onMarkerPress={handleMarkerPress}
          onMapPress={handleMapPress}
          syncCameraOnCoordsChange={false}
          showsUserLocation
          showFallbackBanner
        />

        {/* Floating back */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.back()}
          accessibilityLabel="Back"
          accessibilityRole="button"
          className="absolute left-4 bg-surface p-3 rounded-full shadow-lg border border-border"
          style={{ top: insets.top + 12, elevation: 4 }}
        >
          <IconChevronLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Top stats pill */}
        <View
          className="absolute right-4 flex-row items-center"
          style={{ top: insets.top + 12 }}
          pointerEvents="box-none"
        >
          <View className="bg-surface px-3 py-2.5 rounded-full shadow border border-border flex-row items-center gap-2">
            <IconSearch size={16} color={colors.textPrimary} />
            <Text className="text-sm font-nunitoSemiBold text-foreground">
              {loading ? 'Searching…' : `${apartments.length} in this area`}
            </Text>
            {isFetching && <ActivityIndicator size="small" color={colors.primary} />}
          </View>
        </View>

        {/* Error banner */}
        {error && (
          <View className="absolute left-4 right-4 bg-dangerLight border border-danger/20 px-3 py-2 rounded-xl" style={{ top: insets.top + 64 }}>
            <Text className="text-sm text-danger font-inter">{error}</Text>
          </View>
        )}

        {/* First-load spinner */}
        {loading && apartments.length === 0 && !error && (
          <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
            <View className="bg-surface px-5 py-4 rounded-2xl shadow border border-border items-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-sm text-muted font-inter mt-2">Loading map results…</Text>
            </View>
          </View>
        )}

        {/* Empty state overlay — top-anchored so the map center (blue dot) stays visible */}
        {!loading && apartments.length === 0 && !error && (
          <View className="absolute left-6 right-6 items-center" style={{ top: insets.top + 64 }}>
            <View className="bg-surface px-5 py-5 rounded-2xl shadow border border-border items-center w-full">
              <View className="bg-surface-secondary p-4 rounded-full mb-3">
                <IconMapPin size={28} color={colors.gray400} />
              </View>
              <Text className="text-base font-nunitoSemiBold text-foreground text-center">No results here</Text>
              <Text className="text-sm text-muted font-inter text-center mt-1">
                Try panning or zooming out to the CAMANAVA area.
              </Text>
              <TouchableOpacity onPress={handleBackToCoverage} className="mt-4 px-4 py-2 bg-primary rounded-full">
                <Text className="text-white font-nunitoSemiBold text-sm">Back to CAMANAVA</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Floating recenter + compass — lifts above the popup card when visible */}
        <View className="absolute right-5 items-center gap-3" style={{ bottom: selected ? 248 : insets.bottom + 24 }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCompassPress}
            accessibilityLabel="Reset to north"
            accessibilityRole="button"
            className="bg-surface p-3 rounded-full shadow-lg border border-border"
            style={{ elevation: 4 }}
          >
            <IconCompass size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleRecenter}
            accessibilityLabel="Recenter map"
            accessibilityRole="button"
            className="bg-surface p-3 rounded-full shadow-lg border border-border"
            style={{ elevation: 4 }}
          >
            <IconNavigation size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Popup card */}
        {selected && (
          <View className="absolute left-4 right-4" style={{ bottom: insets.bottom + 16 }}>
            <View className="flex-row justify-end mb-2">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setSelectedId(null)}
                accessibilityLabel="Dismiss details"
                accessibilityRole="button"
                className="bg-surface p-2 rounded-full shadow border border-border"
                style={{ elevation: 4 }}
              >
                <IconX size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ApartmentCard
              id={selected.id}
              name={selected.name}
              location={`${selected.barangay}, ${selected.city}`}
              monthlyRent={selected.monthly_rent}
              noBedroom={selected.no_bedrooms}
              noBathroom={selected.no_bathrooms}
              areaSqm={selected.area_sqm}
              ratings={selected.average_rating?.toFixed(1) ?? '0.0'}
              isVerified={selected.is_verified}
              thumbnail={selected.coverThumbUrl ? { uri: selected.coverThumbUrl } : selected.coverUrl ? { uri: selected.coverUrl } : undefined}
              isGrid={false}
              isFavorite={isFavorite(selected.id)}
              onPress={() => handlePressApartment(selected.id)}
              onPressFavorite={() => void handleToggleFavorite(selected.id)}
            />
          </View>
        )}
      </View>
    </View>
  );
}
