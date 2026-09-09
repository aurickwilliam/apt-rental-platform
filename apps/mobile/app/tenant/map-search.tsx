import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView from 'react-native-maps';

import MapViewSwitcher from '@/components/maps/MapViewSwitcher';
import { MAP_DEFAULT_COORDS, MAP_DEFAULTS } from '@/utils/mapConfig';
import {
  bboxContains,
  bboxFromRegion,
  bboxFromRegionWithMargin,
  filterPinsToVisible,
  offsetRegionForSheet,
  type BBox,
} from '@/service/apartments/mapSearchService';
import { useApartmentMapSearch } from '@/hooks/apartments/useApartmentMapSearch';
import { useUserLocation } from '@/hooks/location/useUserLocation';
import MapPreviewSheet from './components/MapPreviewSheet';
import { IconNavigation, IconSearch, IconMapPin, IconChevronLeft, IconCompass } from '@tabler/icons-react-native';
import { Button } from 'heroui-native';
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
  const pathname = usePathname();
  const isFocused = pathname === '/tenant/map-search' || pathname?.endsWith('/map-search');
  const insets = useSafeAreaInsets();
  const { colors } = useColors();
  const mapRef = useRef<MapView>(null);

  const [bbox, setBbox] = useState<BBox | null>(null);
  const [region, setRegion] = useState(INITIAL_REGION);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queriedBboxRef = useRef<BBox | null>(null);
  const lastMarkerTapRef = useRef(0);
  const hasCenteredRef = useRef(false);
  const userInteractedRef = useRef(false);
  const suppressFetchRef = useRef(false);

  const { apartments, loading, isFetching, error } = useApartmentMapSearch(bbox, { limit: 100 });
  const { coords: userCoords, status: locationStatus } = useUserLocation(true);

  const isLocating = locationStatus === 'loading' && bbox == null;

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

  // Sheet is focus-gated: while blurred (detail on top) the portal would float above the Next screen,
  // so we hide it during blur. isSheetVisible preserves intent, selectedId preserves the pill.
  const sheetApartment = isFocused && isSheetVisible ? selected : null;

  const dismissSheetAndPin = useCallback(() => {
    setIsSheetVisible(false);
    setSelectedId(null);
  }, []);

  const handlePanDrag = useCallback(() => {
    userInteractedRef.current = true;
  }, []);

  // Center once on user location when the fix arrives; respect a pan that happened before the fix.
  // Uses default camera zoom (MAP_DEFAULTS 0.015) so the blue dot lands centered at street level,
  // not the over-zoomed INITIAL_REGION (0.08). Detection is gesture-based (onPanDrag), not region compare.
  useEffect(() => {
    if (hasCenteredRef.current) return;
    if (locationStatus !== 'granted' || !userCoords) return;
    if (userInteractedRef.current) {
      hasCenteredRef.current = true;
      if (bbox == null) {
        const expanded = bboxFromRegionWithMargin(region, BBOX_MARGIN);
        queriedBboxRef.current = expanded;
        setBbox(expanded);
      }
      return;
    }
    const toUser = {
      latitude: userCoords.latitude,
      longitude: userCoords.longitude,
      latitudeDelta: MAP_DEFAULTS.latitudeDelta,
      longitudeDelta: MAP_DEFAULTS.longitudeDelta,
    };
    hasCenteredRef.current = true;
    const gRef = mapRef.current as unknown as { animateToRegion?: (r: typeof toUser, d: number) => void };
    gRef?.animateToRegion?.(toUser, 400);
    setRegion(toUser);
    const expanded = bboxFromRegionWithMargin(toUser, BBOX_MARGIN);
    queriedBboxRef.current = expanded;
    setBbox(expanded);
  }, [locationStatus, userCoords, region, bbox]);

  // Fallback to CAMANAVA when permission is denied (and we never got a bbox).
  useEffect(() => {
    if (hasCenteredRef.current) return;
    if (bbox != null) return;
    if (locationStatus !== 'denied') return;
    hasCenteredRef.current = true;
    const expanded = bboxFromRegionWithMargin(INITIAL_REGION, BBOX_MARGIN);
    queriedBboxRef.current = expanded;
    setBbox(expanded);
  }, [locationStatus, bbox]);

  const handleRegionChangeComplete = useCallback((r: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }) => {
    setRegion(r);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Pill/marker taps animate the map to show the sheet — never treat that as a pan search.
      if (suppressFetchRef.current) {
        suppressFetchRef.current = false;
        return;
      }
      const visible = bboxFromRegion(r);
      // Small pans/zoom-ins stay inside the buffered bbox — skip the refetch.
      if (queriedBboxRef.current && bboxContains(queriedBboxRef.current, visible)) return;
      // While still locating, suppress the map's initial mount callback (no gesture yet) — don't fetch CAMANAVA prematurely.
      if (bbox == null && locationStatus === 'loading' && !userInteractedRef.current) return;
      const expanded = bboxFromRegionWithMargin(r, BBOX_MARGIN);
      queriedBboxRef.current = expanded;
      setBbox(expanded);
    }, 400);
  }, [bbox, locationStatus]);

  const handleMarkerPress = useCallback((id: string | null, index: number) => {
    lastMarkerTapRef.current = Date.now();
    const visiblePin = pins[index];
    const target = id ?? visiblePin?.id ?? null;
    if (!target) return;
    setSelectedId(target);
    setIsSheetVisible(true);
    const apt = apartments.find((a) => a.id === target);
    if (!apt) return;
    suppressFetchRef.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const gRef = mapRef.current as unknown as { animateToRegion?: (r: typeof region, d: number) => void };
    const offset = offsetRegionForSheet(region, { latitude: apt.latitude, longitude: apt.longitude }, 0.1);
    gRef?.animateToRegion?.(offset, 280);
    setRegion(offset);
  }, [pins, apartments, region]);

  const handleMapPress = useCallback(() => {
    if (Date.now() - lastMarkerTapRef.current < MARKER_TAP_GRACE_MS) return;
    dismissSheetAndPin();
  }, [dismissSheetAndPin]);

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
      hasCenteredRef.current = true;
      dismissSheetAndPin();
      return;
    }
    // No location yet (or denied) — fall back to CAMANAVA default
    gRef?.animateToRegion?.(INITIAL_REGION, 400);
    setRegion(INITIAL_REGION);
    const expanded = bboxFromRegionWithMargin(INITIAL_REGION, BBOX_MARGIN);
    queriedBboxRef.current = expanded;
    setBbox(expanded);
    hasCenteredRef.current = true;
    dismissSheetAndPin();
  };

  const handleCompassPress = () => {
    const gRef = mapRef.current as unknown as { animateCamera?: (cam: { heading: number }, opts: { duration: number }) => void };
    gRef?.animateCamera?.({ heading: 0 }, { duration: 350 });
  };

  const handlePressApartment = (id: string) => {
    router.push(`/apartment/${id}` as any);
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
          onPanDrag={handlePanDrag}
          syncCameraOnCoordsChange={false}
          hideEmptyPin
          showsUserLocation
          showFallbackBanner
        />

        {/* Floating back */}
        <View className="absolute left-4" style={{ top: insets.top + 12, elevation: 4 }}>
          <Button
            onPress={() => router.back()}
            variant="tertiary"
            isIconOnly
            accessibilityLabel="Back"
            className="shadow-lg border border-border"
          >
            <IconChevronLeft size={22} color={colors.textPrimary} />
          </Button>
        </View>

        {/* Top stats pill */}
        <View
          className="absolute right-4 flex-row items-center"
          style={{ top: insets.top + 12 }}
          pointerEvents="box-none"
        >
          <View className="bg-surface px-3 py-2.5 rounded-full shadow border border-border flex-row items-center gap-2">
            <IconSearch size={16} color={colors.textPrimary} />
            <Text className="text-sm font-nunitoSemiBold text-foreground">
              {isLocating ? 'Locating you…' : loading ? 'Searching…' : `${apartments.length} in this area`}
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

        {/* Empty state overlay — top-anchored so the map center (blue dot) stays visible */}
        {!isLocating && !loading && apartments.length === 0 && !error && (
          <View className="absolute left-6 right-6 items-center" style={{ top: insets.top + 64 }}>
            <View className="bg-surface px-5 py-5 rounded-2xl shadow border border-border items-center w-full">
              <View className="bg-surface-secondary p-4 rounded-full mb-3">
                <IconMapPin size={28} color={colors.gray400} />
              </View>
              <Text className="text-base font-nunitoSemiBold text-foreground text-center">No results here</Text>
              <Text className="text-sm text-muted font-inter text-center mt-1">
                Try panning or zooming to search nearby.
              </Text>
              <TouchableOpacity onPress={handleRecenter} className="mt-4 px-4 py-2 bg-primary rounded-full">
                <Text className="text-white font-nunitoSemiBold text-sm">Center on me</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Floating recenter + compass — lifts above the popup card when visible */}
        <View className="absolute right-5 items-center gap-3" style={{ bottom: sheetApartment ? 248 : insets.bottom + 24 }}>
          <Button
            onPress={handleCompassPress}
            variant="tertiary"
            isIconOnly
            accessibilityLabel="Reset to north"
            className="shadow-lg border border-border"
          >
            <IconCompass size={22} color={colors.primary} />
          </Button>
          <Button
            onPress={handleRecenter}
            variant="tertiary"
            isIconOnly
            accessibilityLabel="Recenter map"
            className="shadow-lg border border-border"
          >
            <IconNavigation size={22} color={colors.primary} />
          </Button>
        </View>

        <MapPreviewSheet
          apartment={sheetApartment}
          onClose={dismissSheetAndPin}
          onPress={() => sheetApartment && handlePressApartment(sheetApartment.id)}
        />
      </View>
    </View>
  );
}
