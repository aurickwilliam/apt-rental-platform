import { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native';

import { IconMap } from '@tabler/icons-react-native';

import { Dialog, Button } from "heroui-native"

import { useColors } from 'hooks/useTheme';
import MapViewSwitcher from '@/components/maps/MapViewSwitcher';

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
  const { colors } = useColors();

  const [isDirectionsModalVisible, setIsDirectionsModalVisible] =
    useState(false);

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
        <IconMap size={26} color={colors.textPrimary} />
        <Text className='font-nunitoSemiBold text-lg text-foreground'>
          View on Map
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        className='h-56 mx-5 mt-3 rounded-2xl overflow-hidden'
        onPress={onOpenMap}
      >
        <View style={{ flex: 1 }} pointerEvents='none'>
          <MapViewSwitcher
            latitude={latitude}
            longitude={longitude}
            interactive={false}
            style={{ flex: 1 }}
          />
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
          <Dialog.Overlay className="bg-backdrop items-center justify-center px-6" />
          
          <Dialog.Content className="w-full rounded-3xl bg-surface-secondary p-5">
            <Dialog.Close 
              variant="ghost" 
              className="absolute top-4 right-4 z-50"
            />

            {/* Header */}
            <View>
              <Text className="font-nunitoSemiBold text-lg text-foreground">
                Choose Route Type
              </Text>
              <Text className="mt-1 font-inter text-muted">
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
