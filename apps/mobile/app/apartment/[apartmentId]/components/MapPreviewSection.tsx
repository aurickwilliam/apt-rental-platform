import { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native';

import {
  MapView,
  Camera,
  ShapeSource,
  CircleLayer,
  setAccessToken,
} from '@maplibre/maplibre-react-native';

import { IconMap } from '@tabler/icons-react-native';

import { Dialog, Button } from "heroui-native"

import { COLORS } from '@repo/constants';

setAccessToken(null);

const MAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
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
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const DEFAULT_COORDS = {
  latitude: 14.67,
  longitude: 120.96,
};

type DirectionMode = 'driving' | 'walking' | 'transit' | 'motorcycle';

type MapPreviewSectionProps = {
  apartmentName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  onOpenMap: () => void;
};

export default function MapPreviewSection({
  apartmentName,
  latitude,
  longitude,
  onOpenMap,
}: MapPreviewSectionProps) {
  const [isDirectionsModalVisible, setIsDirectionsModalVisible] =
    useState(false);

  const hasApartmentCoords = latitude != null && longitude != null;

  const openDirections = async (mode: DirectionMode) => {
    if (latitude == null || longitude == null) {
      onOpenMap();
      return;
    }

    const label = encodeURIComponent(apartmentName || 'Apartment');
    const destination = `${latitude},${longitude}`;

    const googleMapsTravelMode =
      mode === 'walking'
        ? 'walking'
        : mode === 'transit'
        ? 'transit'
        : mode === 'motorcycle'
        ? 'two-wheeler'
        : 'driving';

    const googleMapsWebUrl =
      `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=${googleMapsTravelMode}`;

    const iosDirFlag =
      mode === 'walking' ? 'w' : mode === 'transit' ? 'r' : 'd';

    const iosUrl =
      mode === 'motorcycle'
        ? googleMapsWebUrl
        : `http://maps.apple.com/?daddr=${destination}&dirflg=${iosDirFlag}&q=${label}`;

    const androidNavMode = mode === 'walking' ? 'w' : 'd';

    const androidUrl =
      mode === 'transit' || mode === 'motorcycle'
        ? googleMapsWebUrl
        : `google.navigation:q=${destination}&mode=${androidNavMode}`;

    const url = Platform.select({
      ios: iosUrl,
      android: androidUrl,
      default: googleMapsWebUrl,
    });

    if (!url) return;

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return;
    }

    await Linking.openURL(googleMapsWebUrl);
  };

  const handleSelectDirectionMode = (mode: DirectionMode) => {
    setIsDirectionsModalVisible(false);
    openDirections(mode);
  };

  return (
    <>
      <View className='flex-row items-center gap-2 mt-10 px-5'>
        <IconMap size={26} color={COLORS.text} />
        <Text className='font-interSemiBold text-lg text-text'>
          View on Map
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        className='h-56 mx-5 mt-3 rounded-2xl overflow-hidden'
        onPress={onOpenMap}
      >
        <View style={{ flex: 1 }} pointerEvents='none'>
          <MapView
            style={{ flex: 1 }}
            mapStyle={MAP_STYLE}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            <Camera
              centerCoordinate={[
                longitude ?? DEFAULT_COORDS.longitude,
                latitude ?? DEFAULT_COORDS.latitude,
              ]}
              zoomLevel={15}
              animationDuration={0}
              maxZoomLevel={19}
            />

            {hasApartmentCoords && (
              <ShapeSource
                id='pin-source'
                shape={{
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [longitude as number, latitude as number],
                  },
                  properties: {},
                }}
              >
                <CircleLayer
                  id='pin-ring'
                  style={{
                    circleRadius: 10,
                    circleColor: '#ffffff',
                  }}
                />
                <CircleLayer
                  id='pin-dot'
                  style={{
                    circleRadius: 7,
                    circleColor: COLORS.primary,
                  }}
                />
              </ShapeSource>
            )}
          </MapView>
        </View>

        <Button
          onPress={(event) => {
            event.stopPropagation();
            setIsDirectionsModalVisible(true);
          }}
          size="sm"
          variant="secondary"
          className='absolute bottom-4 right-4 shadow-xs'
        >
          <Button.Label>
            Get Directions
          </Button.Label>
        </Button>
      </TouchableOpacity>

      <Dialog
        isOpen={isDirectionsModalVisible}
        onOpenChange={setIsDirectionsModalVisible}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="bg-black/40 items-center justify-center px-6" />
          
          <Dialog.Content className="w-full rounded-2xl bg-white p-5">
            <Dialog.Close 
              variant="ghost" 
              className="absolute top-4 right-4 z-50"
            />

            {/* Header */}
            <View>
              <Text className="font-interSemiBold text-lg text-text">
                Choose Route Type
              </Text>
              <Text className="mt-1 font-inter text-grey-500">
                Select how you want to get there.
              </Text>
            </View>

            {/* Body */}
            <View className="mt-4 gap-3">
              <Button
                size="sm"
                onPress={() => handleSelectDirectionMode("driving")}
              >
                <Button.Label>
                  Drive/4-Wheels
                </Button.Label>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onPress={() => handleSelectDirectionMode("motorcycle")}
              >
                <Button.Label>
                  Motorcycle
                </Button.Label>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onPress={() => handleSelectDirectionMode("transit")}
              >
                <Button.Label>
                  Transit
                </Button.Label>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onPress={() => handleSelectDirectionMode("walking")}
              >
                <Button.Label>
                  Walk/Bike
                </Button.Label>
              </Button>
            </View>

            {/* Footer */}
            <View className="mt-5">
              <Button
                variant="danger-soft"
                size="sm"
                onPress={() => setIsDirectionsModalVisible(false)}
              >
                <Button.Label>
                  Cancel
                </Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}
