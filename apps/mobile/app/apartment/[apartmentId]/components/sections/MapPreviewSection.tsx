import { useState } from 'react';
import { View, TouchableOpacity, Linking, Platform } from 'react-native';

import { IconMap, IconNavigation } from '@tabler/icons-react-native';

import { Button } from "heroui-native"

import { useColors } from 'hooks/useTheme';
import SectionHeader from '@/components/display/SectionHeader';
import SectionCard from '../SectionCard';
import AppDialog from '@/components/display/AppDialog';
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
    <SectionCard flush>
        <SectionHeader
          icon={<IconMap size={26} color={colors.textPrimary} />}
          title="View on Map"
          className="p-5 pb-3 mt-0"
        />

        <View className='h-64 mx-2 mb-2 rounded-2xl overflow-hidden'>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ flex: 1 }}
          onPress={onOpenMap}
          accessibilityRole='button'
          accessibilityLabel='Open map'
        >
          <View style={{ flex: 1 }} pointerEvents='none'>
            <MapViewSwitcher
              latitude={latitude}
              longitude={longitude}
              interactive={false}
              style={{ flex: 1 }}
            />
          </View>
        </TouchableOpacity>

        <Button
          onPress={() => setIsDirectionsModalVisible(true)}
          size="sm"
          className='absolute bottom-4 right-4 shadow-md'
        >
          <IconNavigation size={16} color={colors.secondaryForeground} />
          <Button.Label>
            Get Directions
          </Button.Label>
        </Button>
        </View>
      <AppDialog
        isOpen={isDirectionsModalVisible}
        onOpenChange={setIsDirectionsModalVisible}
        title="Choose Route Type"
        description="Select how you want to get there."
        footer={
          <Button
            variant="danger-soft"
            size="sm"
            onPress={() => setIsDirectionsModalVisible(false)}
          >
            <Button.Label>Cancel</Button.Label>
          </Button>
        }
      >
        <View className="gap-3">
          <Button size="sm" onPress={() => handleSelectDirectionMode("driving")}>
            <Button.Label>Drive/4-Wheels</Button.Label>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onPress={() => handleSelectDirectionMode("motorcycle")}
          >
            <Button.Label>Motorcycle</Button.Label>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onPress={() => handleSelectDirectionMode("transit")}
          >
            <Button.Label>Transit</Button.Label>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onPress={() => handleSelectDirectionMode("walking")}
          >
            <Button.Label>Walk/Bike</Button.Label>
          </Button>
        </View>
      </AppDialog>
    </SectionCard>
  );
}
