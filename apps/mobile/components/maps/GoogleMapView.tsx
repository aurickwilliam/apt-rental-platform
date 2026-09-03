import { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { MAP_DEFAULT_COORDS, MAP_DEFAULTS } from '@/utils/mapConfig';
import { useColors } from '@/hooks/useTheme';

export interface GoogleMapPin {
  latitude: number;
  longitude: number;
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
  // For preview non-interactive mode we disable gestures via props
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
}: GoogleMapViewProps) {
  const { colors } = useColors();
  const internalRef = useRef<MapView>(null);
  const mapRef = (externalRef as React.RefObject<MapView | null>) ?? internalRef;

  const hasCoords = latitude != null && longitude != null;
  const center = {
    latitude: hasCoords ? (latitude as number) : MAP_DEFAULT_COORDS.latitude,
    longitude: hasCoords ? (longitude as number) : MAP_DEFAULT_COORDS.longitude,
  };

  // Sync camera when coords change (e.g., after Place selection)
  useEffect(() => {
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
  }, [latitude, longitude]);

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
          if (!interactive || !onPress) return;
          const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
          onPress({ latitude: lat, longitude: lng });
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
        {!draggableMarker && multiPins.length > 0 && multiPins.map((p, i) => (
          <Marker key={`${p.latitude}-${p.longitude}-${i}`} coordinate={p} pinColor={colors.primary} />
        ))}
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
