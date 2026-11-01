import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  useWindowDimensions,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import ImageViewing from 'react-native-image-viewing';

import {
  IconBuilding,
  IconStarFilled,
  IconChevronDown,
  IconBed,
  IconBath,
  IconMaximize,
  IconMapPinFilled
} from '@tabler/icons-react-native';

import { useColors } from 'hooks/useTheme';
import type { ApartmentDetails } from 'hooks/apartments';

type ApartmentImage = {
  id: string;
  image: { uri: string };
};

type ApartmentHeroSectionProps = {
  apartment: ApartmentDetails | null;
  images: ApartmentImage[];
  onRatingPress?: () => void;
};

// Shared with the screen's scroll logic and the loading skeleton (672px).
export const APARTMENT_HERO_HEIGHT = 672;

// Dark scrim behind the white hero text and the floating buttons (DESIGN.md: RentalHero).
const BOTTOM_SCRIM_COLORS = ['transparent', 'rgba(0, 0, 0, 0.9)'] as const;
const TOP_SCRIM_COLORS = ['rgba(0, 0, 0, 0.45)', 'transparent'] as const;
const TOP_SCRIM_HEIGHT = 120;

export default function ApartmentHeroSection({
  apartment,
  images,
  onRatingPress,
}: ApartmentHeroSectionProps) {
  const { width } = useWindowDimensions();

  const [scrollX] = useState(() => new Animated.Value(0));

  const { colors } = useColors();

  const [imageIndex, setImageIndex] = useState(0);
  const [isImageViewVisible, setIsImageViewVisible] = useState(false);

  const location = [apartment?.street_address, apartment?.city, apartment?.province]
    .filter(Boolean)
    .join(', ');

  const ratingCount = apartment?.no_ratings ?? 0;
  const averageRating = apartment?.average_rating ?? null;
  const hasRatings = averageRating !== null && ratingCount > 0;
  const ratingLabel =
    averageRating !== null && ratingCount > 0
      ? `${averageRating.toFixed(1)} (${ratingCount} ${ratingCount === 1 ? 'rating' : 'ratings'})`
      : 'No ratings yet';

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleViewFullImage = (index: number) => {
    setImageIndex(index);
    setIsImageViewVisible(true);
  };

  return (
    <View
      className='bg-surface-tertiary relative'
      style={{ height: APARTMENT_HERO_HEIGHT }}
    >
      {images.length === 0 && (
        <View className='absolute inset-x-0 top-0 h-1/2 items-center justify-center gap-2'>
          <IconBuilding size={48} color={colors.gray400} strokeWidth={1.5} />
          <Text className='text-muted font-nunitoSemiBold text-base'>
            No photos yet
          </Text>
        </View>
      )}

      <ScrollView
        horizontal
        pagingEnabled
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
      >
        {images.map((item, index) => (
          <TouchableOpacity
            activeOpacity={0.9}
            className='w-screen h-full'
            key={item.id}
            onPress={() => handleViewFullImage(index)}
          >
            <Image
              source={item.image}
              style={{ height: '100%', width: '100%' }}
              contentFit='cover'
              cachePolicy='disk'
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {images.length > 0 && (
        <LinearGradient
          colors={TOP_SCRIM_COLORS}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: TOP_SCRIM_HEIGHT,
          }}
          pointerEvents='none'
        />
      )}

      {/* The gradient is a native view that must never take touches; the content
          sits in a plain View so only its own controls do, and swipes reach the carousel. */}
      <LinearGradient
        colors={BOTTOM_SCRIM_COLORS}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        pointerEvents='none'
      />

      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'flex-end',
          padding: 20,
        }}
        pointerEvents='box-none'
      >
        <View pointerEvents='box-none'>
          <Text className='text-white font-nunitoBold text-2xl' pointerEvents='none'>
            {apartment?.name || 'Unnamed Apartment'}
          </Text>

          <View className='flex-row items-center mt-2 gap-2' pointerEvents='none'>
            <IconMapPinFilled size={24} color={colors.primary} />
            <Text className={`text-white font-nunitoSemiBold text-base`}>
              {location || 'No location provided'}
            </Text>
          </View>

          <Pressable
            className='flex-row items-center mt-5 gap-2 self-start'
            disabled={!hasRatings || !onRatingPress}
            onPress={onRatingPress}
            accessibilityRole='button'
            accessibilityLabel={hasRatings ? `${ratingLabel}. Jump to ratings` : ratingLabel}
          >
            <IconStarFilled size={20} color={colors.rating}  />
            <Text className={`text-white font-nunitoSemiBold text-base`}>
              {ratingLabel}
            </Text>
            {hasRatings && onRatingPress && (
              <IconChevronDown size={18} color={colors.secondaryForeground} />
            )}
          </Pressable>

          <View className='flex-row items-center justify-between my-5 gap-6' pointerEvents='none'>
            <View className='flex-row items-center gap-2'>
              <IconBed size={24} color={colors.secondaryForeground} />
              <Text className={`text-white font-nunitoSemiBold text-sm`}>
                {apartment?.no_bedrooms}{' '}
                {apartment?.no_bedrooms === 1 ? 'Bed' : 'Beds'}
              </Text>
            </View>

            <View className='flex-row items-center gap-2'>
              <IconBath size={24} color={colors.secondaryForeground} />
              <Text className={`text-white font-nunitoSemiBold text-sm`}>
                {apartment?.no_bathrooms}{' '}
                {apartment?.no_bathrooms === 1 ? 'Bath' : 'Baths'}
              </Text>
            </View>

            <View className='flex-row items-center gap-2'>
              <IconMaximize size={24} color={colors.secondaryForeground} />
              <Text className={`text-white font-nunitoSemiBold text-sm`}>
                {apartment?.area_sqm ? `${apartment?.area_sqm} Sqm` : 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <View className='flex-row justify-center items-center' pointerEvents='none'>
          {images.map((_, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                className='h-2 bg-white rounded mx-1'
                style={[
                  {
                    width: dotWidth,
                    opacity,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      <ImageViewing
        key={imageIndex}
        images={images.map((img) => img.image)}
        imageIndex={imageIndex}
        visible={isImageViewVisible}
        onRequestClose={() => setIsImageViewVisible(false)}
        FooterComponent={({ imageIndex: currentIndex }) => (
          <View className='p-10 items-center'>
            <Text className='text-white font-nunitoSemiBold'>
              {currentIndex + 1} / {images.length}
            </Text>
          </View>
        )}
        presentationStyle='overFullScreen'
        backgroundColor='rgb(0, 0, 0, 0.9)'
      />
    </View>
  );
}
