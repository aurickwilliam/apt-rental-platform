import { View } from 'react-native';
import { MapView as LibreMapView, Camera, ShapeSource, CircleLayer, PointAnnotation, setAccessToken } from '@maplibre/maplibre-react-native';

import { useColors } from '@/hooks/useTheme';
import { MAP_DEFAULT_COORDS } from '@/utils/mapConfig';

setAccessToken(null);

const MAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster' as const,
      source: 'osm',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

interface Props {
  latitude?: number | null;
  longitude?: number | null;
  pins?: { latitude: number; longitude: number }[];
  interactive?: boolean;
  onPress?: (coords: { latitude: number; longitude: number }) => void;
  draggableMarker?: boolean;
  markerCoords?: { latitude: number; longitude: number } | null;
  onMarkerDragEnd?: (coords: { latitude: number; longitude: number }) => void;
  style?: object;
  onRegionChangeComplete?: (region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }) => void;
}

export default function MapLibreFallbackView({
  latitude,
  longitude,
  pins,
  interactive = true,
  onPress,
  draggableMarker = false,
  markerCoords,
  onMarkerDragEnd,
  style,
}: Props) {
  const { colors } = useColors();
  const hasCoords = latitude != null && longitude != null;
  const lat = hasCoords ? (latitude as number) : MAP_DEFAULT_COORDS.latitude;
  const lng = hasCoords ? (longitude as number) : MAP_DEFAULT_COORDS.longitude;
  const marker = markerCoords ?? (hasCoords ? { latitude: lat, longitude: lng } : null);

  return (
    <View style={[{ flex: 1, overflow: 'hidden' }, style]}>
      <LibreMapView
        style={{ flex: 1 }}
        mapStyle={MAP_STYLE}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={interactive}
        onPress={(e: any) => {
          if (!interactive || !onPress) return;
          if (e.geometry?.type !== 'Point') return;
          const [lng2, lat2] = e.geometry.coordinates as [number, number];
          onPress({ latitude: lat2, longitude: lng2 });
        }}
      >
        <Camera
          centerCoordinate={[lng, lat]}
          zoomLevel={15}
          animationDuration={0}
          maxZoomLevel={19}
        />

        {draggableMarker && marker && (
          <PointAnnotation
            id="pin"
            coordinate={[marker.longitude, marker.latitude]}
            draggable={interactive}
            onDragEnd={(e: any) => {
              const [lng2, lat2] = e.geometry.coordinates as [number, number];
              const c = { latitude: lat2, longitude: lng2 };
              onMarkerDragEnd?.(c);
              onPress?.(c);
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                backgroundColor: colors.primary,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: '#ffffff',
              }}
            />
          </PointAnnotation>
        )}

        {!draggableMarker && pins && pins.length > 0 ? (
          <>
            {pins.map((p, i) => (
              <ShapeSource
                key={`pin-${p.latitude}-${p.longitude}-${i}`}
                id={`pin-source-${i}`}
                shape={{
                  type: 'Feature',
                  geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
                  properties: {},
                }}
              >
                <CircleLayer id={`pin-ring-${i}`} style={{ circleRadius: 10, circleColor: '#ffffff' }} />
                <CircleLayer id={`pin-dot-${i}`} style={{ circleRadius: 7, circleColor: colors.primary }} />
              </ShapeSource>
            ))}
          </>
        ) : !draggableMarker && hasCoords ? (
          <ShapeSource
            id="pin-source"
            shape={{
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [lng, lat] },
              properties: {},
            }}
          >
            <CircleLayer id="pin-ring" style={{ circleRadius: 10, circleColor: '#ffffff' }} />
            <CircleLayer id="pin-dot" style={{ circleRadius: 7, circleColor: colors.primary }} />
          </ShapeSource>
        ) : null}
      </LibreMapView>
    </View>
  );
}
