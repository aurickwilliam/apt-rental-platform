import { View, Text } from 'react-native';

import { isGoogleMapsEnabled } from '@/utils/mapConfig';

import GoogleMapView, { type GoogleMapPin } from './GoogleMapView';

interface MapViewSwitcherProps {
  latitude?: number | null;
  longitude?: number | null;
  pins?: GoogleMapPin[];
  interactive?: boolean;
  onPress?: (coords: { latitude: number; longitude: number }) => void;
  onMarkerDragEnd?: (coords: { latitude: number; longitude: number }) => void;
  draggableMarker?: boolean;
  markerCoords?: { latitude: number; longitude: number } | null;
  style?: object;
  showsUserLocation?: boolean;
  onRegionChangeComplete?: (region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }) => void;
  onMarkerPress?: (id: string | null, index: number) => void;
  onMapPress?: () => void;
  onPanDrag?: () => void;
  syncCameraOnCoordsChange?: boolean;
  hideEmptyPin?: boolean;
  // Kept for API compat; Google-only mode shows a missing-key hint instead of the OSM fallback.
  showFallbackBanner?: boolean;
  mapRef?: React.RefObject<any>;
}

/**
 * Google-only map host. The MapLibre/OSM fallback was removed with the
 * map-search revamp — a missing `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` now renders
 * the Google view plus a hint banner instead of a second map SDK.
 */
export default function MapViewSwitcher(props: MapViewSwitcherProps) {
  const googleReady = isGoogleMapsEnabled();
  const { showFallbackBanner: _showFallbackBanner, ...mapProps } = props;

  return (
    <View style={[{ flex: 1 }, props.style]}>
      <GoogleMapView {...mapProps} mapRef={props.mapRef as any} style={{ flex: 1 }} />
      {!googleReady && props.showFallbackBanner && (
        <View
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            backgroundColor: 'rgba(0,0,0,0.6)',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
          }}
          pointerEvents="none"
        >
          <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Inter' }}>
            Google Maps key missing — set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY and rebuild
          </Text>
        </View>
      )}
    </View>
  );
}
