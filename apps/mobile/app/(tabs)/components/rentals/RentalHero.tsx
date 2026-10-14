import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import type { ReactNode } from "react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

import { Button } from "heroui-native";

import { IconBuildingSkyscraper, IconFileText, IconMapPin } from "@tabler/icons-react-native";

import { COLORS } from "@repo/constants";

// The hero takes about a quarter of the screen, never shorter than this.
const HERO_SCREEN_SHARE = 0.25;
const MIN_HERO_HEIGHT = 200;
// Dark at the top for the bell, clear briefly, then dark under the text so it
// stays readable on bright photos.
const HERO_SCRIM = [
  "rgba(0,0,0,0.35)",
  "rgba(0,0,0,0)",
  "rgba(0,0,0,0.55)",
  "rgba(0,0,0,0.85)",
] as const;
const HERO_SCRIM_STOPS = [0, 0.25, 0.55, 1] as const;
const ON_IMAGE_TEXT = "#FFFFFF";

// Shared with the Rentals skeleton so the placeholder matches the photo.
export function useRentalHeroHeight(): number {
  const { height } = useWindowDimensions();
  return Math.max(MIN_HERO_HEIGHT, Math.round(height * HERO_SCREEN_SHARE));
}

interface RentalHeroProps {
  name: string;
  address: string;
  imageUrl: string | null;
  onViewDescription: () => void;
  // Rendered over the photo's top-right corner (the notification bell).
  topRight?: ReactNode;
}

// The rented apartment's cover photo with its name, address and a link to
// the full description.
export default function RentalHero({
  name,
  address,
  imageUrl,
  onViewDescription,
  topRight,
}: RentalHeroProps) {
  const heroHeight = useRentalHeroHeight();

  return (
    <View className="rounded-3xl overflow-hidden bg-accent" style={{ height: heroHeight }}>
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

      {topRight && <View className="absolute top-3 right-3">{topRight}</View>}

      <View className="absolute left-0 right-0 bottom-0 p-4 gap-3">
        <View className="gap-1">
          <Text className="text-white font-nunitoBold text-2xl" numberOfLines={1}>
            {name}
          </Text>
          <View className="flex-row items-start gap-1.5">
            <IconMapPin size={16} color={ON_IMAGE_TEXT} style={{ marginTop: 2 }} />
            <Text className="flex-1 text-white/90 font-inter text-sm" numberOfLines={2}>
              {address}
            </Text>
          </View>
        </View>

        <Button size="sm" className="self-start bg-white" onPress={onViewDescription}>
          <IconFileText size={16} color={COLORS.light.primary} />
          <Button.Label style={{ color: COLORS.light.primary }}>View Description</Button.Label>
        </Button>
      </View>
    </View>
  );
}
