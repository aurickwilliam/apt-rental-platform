import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Linking, Platform } from 'react-native';
import {
  MapView,
  Camera,
  ShapeSource,
  CircleLayer,
  setAccessToken,
} from '@maplibre/maplibre-react-native';
import { IconMap } from '@tabler/icons-react-native';

import PillButton from 'components/buttons/PillButton';
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
        <Text className='font-poppinsSemiBold text-xl text-text'>
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

        <TouchableOpacity
          activeOpacity={0.7}
          className='absolute bottom-4 right-4 bg-white px-4 py-2 rounded-full'
          onPress={(event) => {
            event.stopPropagation();
            setIsDirectionsModalVisible(true);
          }}
        >
          <Text className='font-interMedium text-base text-primary'>
            Get Directions
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>

      <Modal
        visible={isDirectionsModalVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setIsDirectionsModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          className='flex-1 bg-black/40 justify-center px-6'
          onPress={() => setIsDirectionsModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            className='bg-white rounded-2xl p-5'
            onPress={(event) => event.stopPropagation()}
          >
            <Text className='text-text font-poppinsSemiBold text-lg'>
              Choose Route Type
            </Text>
            <Text className='text-grey-500 font-inter mt-1'>
              Select how you want to get there.
            </Text>

            <View className='mt-4 gap-3'>
              <PillButton
                label='Drive/4-Wheels'
                size='sm'
                onPress={() => handleSelectDirectionMode('driving')}
              />
              <PillButton
                label='Motorcycle'
                size='sm'
                type='outline'
                onPress={() => handleSelectDirectionMode('motorcycle')}
              />
              <PillButton
                label='Transit'
                size='sm'
                type='outline'
                onPress={() => handleSelectDirectionMode('transit')}
              />
              <PillButton
                label='Walk/Bike'
                size='sm'
                type='outline'
                onPress={() => handleSelectDirectionMode('walking')}
              />
            </View>

            <View className='mt-4'>
              <PillButton
                label='Cancel'
                size='sm'
                type='danger'
                onPress={() => setIsDirectionsModalVisible(false)}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
