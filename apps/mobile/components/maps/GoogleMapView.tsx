import { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { MAP_DEFAULT_COORDS, MAP_DEFAULTS } from '@/utils/mapConfig';
import { useColors } from '@/hooks/useTheme';
import { formatPricePill } from '@/service/apartments/mapSearchService';

export interface GoogleMapPin {
  id?: string;
  latitude: number;
  longitude: number;
  /** Monthly rent — when present the marker renders as a price pill. */
  price?: number;
  selected?: boolean;
}

interface GoogleMapViewProps {
  latitude?: number | null;
  longitude?: number | null;
  pins?: GoogleMapPin[];
  interactive?: boolean;
  onPress?: (coords: { latitude: number; longitude: number }) => void;
  onMarkerDragEnd?: (coords: { latitude: number; longitude: number }) => void;
  draggableMarker?: boolean;
  markerCoords?: GoogleMapPin | null;
  style?: object;
  mapRef?: React.RefObject<MapView | null>;
  showsUserLocation?: boolean;
  onRegionChangeComplete?: (region: Region) => void;
  /** Fired when a pin is tapped. Falls back to index when pin has no id. */
  onMarkerPress?: (id: string | null, index: number) => void;
  /** Fired when the map (not a pin) is tapped — e.g. to dismiss a popup card. */
  onMapPress?: () => void;
  syncCameraOnCoordsChange?: boolean;
  // For preview non-interactive mode we disable gestures via props
}

function PricePill({ label, colors }: { label: string; colors: { primary: string } }) {
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: colors.primary,
        borderWidth: 1.5,
        borderColor: colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: '#FFFFFF',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function GoogleMapView({
  latitude,
  longitude,
  pins,
  interactive = true,
  onPress,
  onMarkerDragEnd,
  draggableMarker = false,
  markerCoords,
  style,
  mapRef: externalRef,
  showsUserLocation = false,
  onRegionChangeComplete,
  onMarkerPress,
  onMapPress,
  syncCameraOnCoordsChange = true,
}: GoogleMapViewProps) {
  const { colors } = useColors();
  const internalRef = useRef<MapView>(null);
  const mapRef = (externalRef as React.RefObject<MapView | null>) ?? internalRef;

  const hasCoords = latitude != null && longitude != null;
  const center = {
    latitude: hasCoords ? (latitude as number) : MAP_DEFAULT_COORDS.latitude,
    longitude: hasCoords ? (longitude as number) : MAP_DEFAULT_COORDS.longitude,
  };

  // Sync camera when coords change (e.g., after Place selection).
  // Disabled on map-search — that screen's live region prop would fight pinch-zoom.
  useEffect(() => {
    if (!syncCameraOnCoordsChange) return;
    if (!hasCoords) return;
    // Small delay so map is mounted
    const t = setTimeout(() => {
      mapRef.current?.animateToRegion(
        {
          latitude: center.latitude,
          longitude: center.longitude,
          latitudeDelta: MAP_DEFAULTS.latitudeDelta,
          longitudeDelta: MAP_DEFAULTS.longitudeDelta,
        },
        400,
      );
    }, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, syncCameraOnCoordsChange]);

  const initialRegion: Region = {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: MAP_DEFAULTS.latitudeDelta,
    longitudeDelta: MAP_DEFAULTS.longitudeDelta,
  };

  // Single pin mode (map-pin)
  const singlePin = markerCoords ?? (hasCoords ? center : null);
  // Multi-pin mode (map-search clusters) — fallback to center pin if none
  const multiPins = pins ?? [];

  return (
    <View style={[{ flex: 1, overflow: 'hidden' }, style]}>
      <MapView
        ref={mapRef as React.RefObject<MapView>}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        onPress={(e) => {
          if (!interactive) return;
          if (onPress) {
            const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
            onPress({ latitude: lat, longitude: lng });
          }
          onMapPress?.();
        }}
        onRegionChangeComplete={onRegionChangeComplete}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={interactive}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        loadingEnabled
      >
        {/* Draggable single marker (pin creation) */}
        {draggableMarker && singlePin && (
          <Marker
            coordinate={singlePin}
            draggable={interactive}
            onDragEnd={(e) => {
              const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
              onMarkerDragEnd?.({ latitude: lat, longitude: lng });
              onPress?.({ latitude: lat, longitude: lng });
            }}
            pinColor={colors.primary}
          />
        )}

        {/* Static pin(s) for preview / search */}
        {!draggableMarker && multiPins.length > 0 && multiPins.map((p, i) => {
          const selected = p.selected ?? false;
          const key = p.id ?? `${p.latitude}-${p.longitude}-${i}`;
          if (p.price == null) {
            return (
              <Marker
                key={key}
                coordinate={p}
                pinColor={colors.primary}
                onPress={() => onMarkerPress?.(p.id ?? null, i)}
              />
            );
          }
          if (selected) {
            return (
              <Marker
                key={`${key}-selected`}
                coordinate={p}
                pinColor={colors.danger}
                onPress={() => onMarkerPress?.(p.id ?? null, i)}
                tracksViewChanges={false}
                zIndex={999}
              />
            );
          }
          return (
            <Marker
              key={key}
              coordinate={p}
              onPress={() => onMarkerPress?.(p.id ?? null, i)}
              tracksViewChanges={false}
            >
              <PricePill label={formatPricePill(p.price)} colors={colors} />
            </Marker>
          );
        })}
        {!draggableMarker && multiPins.length === 0 && hasCoords && (
          <Marker coordinate={center} pinColor={colors.primary} />
        )}

        {/* When no coords and not draggable, show no pin (fallback will handle empty state) */}
      </MapView>

      {/* Google attribution is rendered by native SDK; for custom overlay we show hint when no key (fallback handled by switcher) */}
      {!interactive && hasCoords && (
        <View pointerEvents="none" style={{ position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
          <Text style={{ fontSize: 9, color: '#444' }}>© Google</Text>
        </View>
      )}
    </View>
  );
}
