import { useRef, useState } from 'react'
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MapView from 'react-native-maps';

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'

import { Dialog, Button } from "heroui-native"

import { useColors } from '@/hooks/useTheme';
import { useApartmentDetails } from '@/hooks/apartments';
import { isGoogleMapsEnabled, MAP_DEFAULT_COORDS } from '@/utils/mapConfig';
import GoogleMapView from '@/components/maps/GoogleMapView';
import MapLibreFallbackView from '@/components/maps/MapLibreFallbackView';

import { IconRoute, IconMap, IconCompass, IconNavigation } from '@tabler/icons-react-native';

const DEFAULT_COORDS = MAP_DEFAULT_COORDS;

type DirectionMode = 'driving' | 'walking' | 'transit' | 'motorcycle';

export default function ApartmentMapViewScreen() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();
  const { apartment } = useApartmentDetails(apartmentId, { includeReviews: false });
  const { colors } = useColors();
  const insets = useSafeAreaInsets();

  const [isDirectionsModalVisible, setIsDirectionsModalVisible] = useState<boolean>(false);
  const cameraRef = useRef<any>(null);
  const googleMapRef = useRef<MapView>(null);

  const latitude = apartment?.latitude ?? DEFAULT_COORDS.latitude;
  const longitude = apartment?.longitude ?? DEFAULT_COORDS.longitude;
  const hasApartmentCoords = apartment?.latitude != null && apartment?.longitude != null;
  const useGoogle = isGoogleMapsEnabled();

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
        : `https://maps.apple.com/?daddr=${destination}&dirflg=${iosDirFlag}&q=${label}`;

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

  // Handle IconNavigation Button Press/Go Back to Pin Location
  const handleNavigationPress = () => {
    if (useGoogle) {
      googleMapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        500,
      );
      return;
    }
    cameraRef.current?.setCamera?.({
      centerCoordinate: [longitude, latitude],
      zoomLevel: 15,
      animationDuration: 500,
    });
  }

  // Handle IconCompass Button Press/Refocus to North
  const handleCompassPress = () => {
    if (useGoogle) {
      googleMapRef.current?.animateCamera({ heading: 0 }, { duration: 350 });
      return;
    }
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
      <View className='flex-row items-center justify-between bg-background px-5 py-3 gap-1'>
        <View className='flex-1 shrink gap-1'>
          <Text
            className='text-lg font-nunitoSemiBold text-accent'
            numberOfLines={1}
          >
            {apartmentName}
          </Text>
          <Text
            className='text-sm text-muted'
            numberOfLines={2}
            ellipsizeMode='tail'
          >
            {apartmentAddress}
          </Text>
        </View>

        <View className='flex-row items-center gap-3 shrink-0'>
          <TouchableOpacity
            activeOpacity={0.7}
            className='bg-surface-secondary p-2 rounded-xl'
            onPress={handleOpenInMaps}
          >
            <IconMap size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            className='bg-surface-secondary p-2 rounded-xl'
            onPress={handleGetDirections}
          >
            <IconRoute size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <View className='flex-1 relative'>
        {useGoogle ? (
          <GoogleMapView
            latitude={latitude}
            longitude={longitude}
            interactive
            style={{ flex: 1 }}
            mapRef={googleMapRef as React.RefObject<MapView | null>}
            pins={hasApartmentCoords ? [{ latitude, longitude }] : []}
          />
        ) : (
          <MapLibreFallbackView
            latitude={latitude}
            longitude={longitude}
            interactive
            style={{ flex: 1 }}
          />
        )}
        {/* Hidden MapLibre camera ref for fallback compass/nav when useGoogle=false */}
        {!useGoogle && (
          <View style={{ height: 0, width: 0, overflow: 'hidden' }}>
            {/* keep ref alive via dummy — fallback view handles its own camera */}
          </View>
        )}

        {/* Floating Action Buttons — consistent with app/tenant/map-search.tsx */}
        <View className="absolute right-5 items-center gap-3" style={{ bottom: insets.bottom + 24 }}>
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
            onPress={handleNavigationPress}
            variant="tertiary"
            isIconOnly
            accessibilityLabel="Recenter map"
            className="shadow-lg border border-border"
          >
            <IconNavigation size={22} color={colors.primary} />
          </Button>
        </View>
      </View>

      <Dialog
        isOpen={isDirectionsModalVisible}
        onOpenChange={setIsDirectionsModalVisible}
      >
        <Dialog.Portal>
          {/* Overlay handles the background dimming and centers the content */}
          <Dialog.Overlay className="bg-backdrop items-center justify-center px-6" />

          <Dialog.Content className="w-full bg-surface-secondary rounded-2xl p-5">
            {/* Top-Right Close Button */}
            <Dialog.Close variant="ghost" className="absolute top-4 right-4 z-50" />

            {/* Header */}
            <View>
              <Text className="text-foreground font-nunitoSemiBold text-lg">
                Choose Route Type
              </Text>
              <Text className="text-muted font-inter mt-1">
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
