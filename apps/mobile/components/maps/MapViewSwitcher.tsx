import { View, Text } from 'react-native';

import { isGoogleMapsEnabled } from '@/utils/mapConfig';

import GoogleMapView, { type GoogleMapPin } from './GoogleMapView';
import MapLibreFallbackView from './MapLibreFallbackView';

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
  // When true, show fallback banner if Google disabled due to missing key (dev helper)
  showFallbackBanner?: boolean;
  mapRef?: React.RefObject<any>;
}

export default function MapViewSwitcher(props: MapViewSwitcherProps) {
  const useGoogle = isGoogleMapsEnabled();

  if (useGoogle) {
    return <GoogleMapView {...props} mapRef={props.mapRef as any} />;
  }

  return (
    <View style={[{ flex: 1 }, props.style]}>
      <MapLibreFallbackView
        latitude={props.latitude}
        longitude={props.longitude}
        interactive={props.interactive}
        onPress={props.onPress}
        draggableMarker={props.draggableMarker}
        markerCoords={props.markerCoords}
        onMarkerDragEnd={props.onMarkerDragEnd}
        style={{ flex: 1 }}
      />
      {props.showFallbackBanner && (
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
            OSM fallback — set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to use Google
          </Text>
        </View>
      )}
    </View>
  );
}
