import { View, Text, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image';

import { Card, PressableFeedback } from 'heroui-native';

import { useColors } from 'hooks/useTheme';

import {
  Image as IconImage,
  BedDouble,
  Bath,
  Maximize,
  Heart,
  Star
} from 'lucide-react-native';

import { formatCurrency } from '@repo/utils';

export default function ApartmentCard({
  thumbnail,
  name = "Apartment Name",
  location = "Barangay, City",
  ratings = '0.0',
  isFavorite = false,
  monthlyRent = 0,
  noBedroom = 0,
  noBathroom = 0,
  areaSqm = 0,
  isGrid = true,
  onPress,
  onPressFavorite,
}: ApartmentCardProps) {
  const { width } = useWindowDimensions();
  const { colors } = useColors();

  const HORIZONTAL_PADDING = 16;
  const GRID_GAP = 8;
  const cardWidth = isGrid
    ? (width - HORIZONTAL_PADDING * 2 - GRID_GAP) / 2
    : width - HORIZONTAL_PADDING * 2;

  return (
    <View style={{ width: cardWidth, alignSelf: isGrid ? "auto" : "center" }}>
      <PressableFeedback
        onPress={onPress}
        className="rounded-2xl overflow-hidden border border-border shadow-none"
      >
        <PressableFeedback.Ripple />

        <Card className="bg-surface rounded-2xl overflow-hidden p-0 gap-0 shadow-none">
          {/* Thumbnail Image */}
          <View className="aspect-square overflow-hidden rounded-2xl">
            {thumbnail ? (
              <Image
                source={thumbnail}
                style={{ height: "100%", width: "100%" }}
                contentFit="cover"
                cachePolicy="disk"
              />
            ) : (
              <View
                style={{
                  height: "100%",
                  width: "100%",
                }}
                className="items-center justify-center bg-gray-200"
              >
                <IconImage size={32} color={colors.gray400} />
              </View>
            )}
          </View>

          {/* Description Container */}
          <Card.Body className={`${isGrid ? "p-2 gap-2" : "p-3 gap-3"}`}>
            {/* Apartment Name and Address */}
            <View>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                className={`text-foreground font-interMedium ${isGrid ? "text-base" : "text-xl"}`}
              >
                {name}
              </Text>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                className={`text-muted font-inter ${isGrid ? "text-[12px]" : "text-base"}`}
              >
                {location}
              </Text>
            </View>

            {/* Utilities — list-only */}
            {!isGrid && (
              <View className="flex-row flex-wrap">
                <View className="flex-row w-2/6 gap-1 items-center justify-start">
                  <BedDouble size={18} color={colors.gray500} />
                  <Text className="text-muted text-[12px]">
                    {noBedroom} Bedroom
                  </Text>
                </View>
                <View className="flex-row w-2/6 gap-1 items-center justify-start">
                  <Bath size={18} color={colors.gray500} />
                  <Text className="text-muted text-[12px]">
                    {noBathroom} Bathroom
                  </Text>
                </View>
                <View className="flex-row w-2/6 gap-1 items-center justify-start">
                  <Maximize size={18} color={colors.gray500} />
                  <Text className="text-muted text-[12px]">{areaSqm} Sqm</Text>
                </View>
              </View>
            )}

            {/* Price + Rating */}
            <View className="flex-row items-center justify-between">
              <Text
                className={`text-accent font-interSemiBold ${isGrid ? "text-lg" : "text-xl"}`}
              >
                ₱ {formatCurrency(monthlyRent)}
              </Text>
              <View className="flex-row items-center justify-center gap-1">
                <Star size={isGrid ? 16 : 18} color={colors.secondary} />
                <Text
                  className={`mr-1 text-foreground font-inter ${isGrid ? "text-[12px]" : "text-base"}`}
                >
                  {ratings}
                </Text>
              </View>
            </View>
          </Card.Body>

          {/* Favorite Button — floats over the image */}
          <PressableFeedback
            onPress={onPressFavorite}
            className="absolute top-2 right-2 rounded-full p-2 flex items-center justify-center"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.75)",
              elevation: 3,
            }}
          >
            <Heart
              size={isGrid ? 18 : 24}
              color={isFavorite ? colors.danger : colors.gray400}
              fill={isFavorite ? colors.danger : "transparent"}
            />
          </PressableFeedback>
        </Card>
      </PressableFeedback>
    </View>
  );
}