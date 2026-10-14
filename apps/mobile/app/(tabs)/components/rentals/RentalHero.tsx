import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import type { ReactNode } from "react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LinkButton } from "heroui-native";

import { IconBuildingSkyscraper, IconMapPinFilled } from "@tabler/icons-react-native";

// Below the status bar the photo takes about a quarter of the screen, never
// shorter than this.
const HERO_SCREEN_SHARE = 0.25;
const MIN_HERO_HEIGHT = 200;
// Bell distance from the status bar.
const BELL_TOP_GAP = 8;
// Dark at the top for the status bar and bell, clear briefly, then dark under
// the text so it stays readable on bright photos.
const HERO_SCRIM = [
  "rgba(0,0,0,0.45)",
  "rgba(0,0,0,0)",
  "rgba(0,0,0,0.55)",
  "rgba(0,0,0,0.85)",
] as const;
const HERO_SCRIM_STOPS = [0, 0.3, 0.6, 1] as const;
const ON_IMAGE_TEXT = "#FFFFFF";

// Full hero height including the status-bar area it extends under. Shared
// with the Rentals skeleton so the placeholder matches the photo.
export function useRentalHeroHeight(): number {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return insets.top + Math.max(MIN_HERO_HEIGHT, Math.round(height * HERO_SCREEN_SHARE));
}

interface RentalHeroProps {
  name: string;
  address: string;
  imageUrl: string | null;
  onViewDescription: () => void;
  // Rendered over the photo's top-right corner, below the status bar (the
  // notification bell).
  topRight?: ReactNode;
}

// The rented apartment's cover photo, edge to edge under the status bar, with
// its name, address and a link to the full description. Render it first
// inside the page's 20px (p-5) padding: it bleeds out with negative margins.
export default function RentalHero({
  name,
  address,
  imageUrl,
  onViewDescription,
  topRight,
}: RentalHeroProps) {
  const heroHeight = useRentalHeroHeight();
  const insets = useSafeAreaInsets();

  return (
    <View className="-mx-5 overflow-hidden bg-accent" style={{ height: heroHeight }}>
      {imageUrl ? (
        <Image
          source={imageUrl}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="disk"
          accessibilityLabel={`Photo of ${name}`}
        />
      ) : (
        <View style={StyleSheet.absoluteFill} className="items-center justify-center">
          <IconBuildingSkyscraper size={48} color="rgba(255,255,255,0.6)" />
        </View>
      )}

      <LinearGradient
        colors={HERO_SCRIM}
        locations={HERO_SCRIM_STOPS}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {topRight && (
        <View className="absolute right-4" style={{ top: insets.top + BELL_TOP_GAP }}>
          {topRight}
        </View>
      )}

      <View className="absolute left-0 right-0 bottom-0 px-5 pb-5 gap-2">
        <Text className="text-white font-nunitoBold text-2xl" numberOfLines={1}>
          {name}
        </Text>
        <View className="flex-row items-start gap-1.5">
          <IconMapPinFilled size={16} color={ON_IMAGE_TEXT} style={{ marginTop: 2 }} />
          <Text className="flex-1 text-white/90 font-inter text-sm" numberOfLines={2}>
            {address}
          </Text>
        </View>
        <LinkButton onPress={onViewDescription} className="self-start mt-1">
          <LinkButton.Label className="text-white text-sm underline">
            View Description
          </LinkButton.Label>
        </LinkButton>
      </View>
    </View>
  );
}
