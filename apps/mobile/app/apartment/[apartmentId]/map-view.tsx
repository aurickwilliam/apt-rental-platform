import { useRef, useState } from 'react'
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { MapView as LibreMapView, Camera, ShapeSource, CircleLayer, setAccessToken } from '@maplibre/maplibre-react-native'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import IconButton from 'components/buttons/IconButton';
import PillButton from 'components/buttons/PillButton';

import { Dialog, Button } from "heroui-native"

import { COLORS } from '@repo/constants'

import { useApartmentDetails } from '@/hooks/useApartmentDetails';

import {
  IconSTurnUp,
  IconMap2,
  IconCompass,
  IconNavigation,
} from '@tabler/icons-react-native';

// Suppress the missing API key warning since we're using free OSM tiles
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
}

const DEFAULT_COORDS = {
  latitude: 14.6700,
  longitude: 120.9600,
}

type DirectionMode = 'driving' | 'walking' | 'transit' | 'motorcycle';

export default function ApartmentMapViewScreen() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();
  const { apartment } = useApartmentDetails(apartmentId);

  const [isDirectionsModalVisible, setIsDirectionsModalVisible] = useState<boolean>(false);
  const cameraRef = useRef<any>(null);

  const latitude = apartment?.latitude ?? DEFAULT_COORDS.latitude;
  const longitude = apartment?.longitude ?? DEFAULT_COORDS.longitude;
  const hasApartmentCoords = apartment?.latitude != null && apartment?.longitude != null;

  const apartmentName = apartment?.name || 'Apartment';
  const apartmentAddress = apartment
    ? `${apartment.street_address}, Brgy. ${apartment.barangay}, ${apartment.city}`
    : 'No address provided';

  const openDirections = async (mode: DirectionMode) => {
    const aptLat = apartment?.latitude;
    const aptLng = apartment?.longitude;

    if (aptLat == null || aptLng == null) return;

    const label = encodeURIComponent(apartmentName);
    const destination = `${aptLat},${aptLng}`;

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

  // Handle Get Directions Press
  const handleGetDirections = () => {
    setIsDirectionsModalVisible(true);
  }

  const handleSelectDirectionMode = (mode: DirectionMode) => {
    setIsDirectionsModalVisible(false);
    openDirections(mode);
  }

  // Handle Open in Maps Press
  const handleOpenInMaps = async () => {
    const aptLat = apartment?.latitude;
    const aptLng = apartment?.longitude;

    if (aptLat == null || aptLng == null) return;

    const query = `${aptLat},${aptLng}`;
    const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    const iosUrl = `http://maps.apple.com/?q=${query}`;
    const androidUrl = `geo:${query}?q=${query}`;

    const url = Platform.select({
      ios: iosUrl,
      android: androidUrl,
      default: googleMapsSearchUrl,
    });

    if (!url) return;

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return;
    }

    await Linking.openURL(googleMapsSearchUrl);
  }

  // Handle Navigation Button Press/Go Back to Pin Location
  const handleNavigationPress = () => {
    cameraRef.current?.setCamera?.({
      centerCoordinate: [longitude, latitude],
      zoomLevel: 15,
      animationDuration: 500,
    });
  }

  // Handle Compass Button Press/Refocus to North
  const handleCompassPress = () => {
    cameraRef.current?.setCamera?.({
      heading: 0,
      animationDuration: 350,
    });
  }

  return (
    <ScreenWrapper
      header={
        <StandardHeader title="Apartment Map View"/>
      }
    >
      {/* Apartment Name and Address */}
      <View className='flex-row items-center justify-between bg-white px-5 py-3 gap-1'>
        <View className='flex-1 gap-1'>
          <Text className='text-lg font-interSemiBold text-primary'>
            {apartmentName}
          </Text>
          <Text className='text-sm text-grey-500'>
            {apartmentAddress}
          </Text>
        </View>

        <View className='flex-row items-center gap-3'>
          <TouchableOpacity
            activeOpacity={0.7}
            className='bg-darkerWhite p-2 rounded-xl'
            onPress={handleOpenInMaps}
          >
            <IconMap2
              size={24}
              color={COLORS.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            className='bg-darkerWhite p-2 rounded-xl'
            onPress={handleGetDirections}
          >
            <IconSTurnUp
              size={24}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>

      </View>

      <View className='flex-1 relative'>
        <LibreMapView
          style={{ flex: 1 }}
          mapStyle={MAP_STYLE}
        >
          <Camera
            ref={cameraRef}
            centerCoordinate={[longitude, latitude]}
            zoomLevel={15}
            animationDuration={0}
            maxZoomLevel={19}
          />

          {hasApartmentCoords && (
            <ShapeSource
              id='apartment-pin-source'
              shape={{
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [longitude, latitude],
                },
                properties: {},
              }}
            >
              <CircleLayer
                id='apartment-pin-ring'
                style={{
                  circleRadius: 10,
                  circleColor: '#ffffff',
                }}
              />
              <CircleLayer
                id='apartment-pin-dot'
                style={{
                  circleRadius: 7,
                  circleColor: COLORS.primary,
                }}
              />
            </ShapeSource>
          )}
        </LibreMapView>

        {/* Floating Action Buttons */}
        <View className='flex items-center gap-5 absolute bottom-5 right-5'>
          <IconButton
            iconName={IconNavigation}
            onPress={handleNavigationPress}
          />

          <IconButton
            iconName={IconCompass}
            onPress={handleCompassPress}
          />
        </View>
      </View>

      <Dialog
        isOpen={isDirectionsModalVisible}
        onOpenChange={setIsDirectionsModalVisible}
      >
        <Dialog.Portal>
          {/* Overlay handles the background dimming and centers the content */}
          <Dialog.Overlay className="bg-black/40 items-center justify-center px-6" />

          <Dialog.Content className="w-full bg-white rounded-2xl p-5">
            {/* Top-Right Close Button */}
            <Dialog.Close variant="ghost" className="absolute top-4 right-4 z-50" />

            {/* Header */}
            <View>
              <Text className="text-text font-interSemiBold text-lg">
                Choose Route Type
              </Text>
              <Text className="text-grey-500 font-inter mt-1">
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
            <View className="mt-4">
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
    </ScreenWrapper>
  )
}
