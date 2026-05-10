import { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ImageViewing from 'react-native-image-viewing';

import {
  IconMapPin,
  IconStarFilled,
  IconBed,
  IconBath,
  IconMaximize,
  IconUsers,
  IconBuildingSkyscraper,
  IconHome2,
  IconCalendar,
} from '@tabler/icons-react-native';

import { COLORS } from '@repo/constants';

import type { ApartmentDetails } from '@/hooks/useApartmentDetails';

type ApartmentImage = {
  id: string;
  image: { uri: string };
};

type ApartmentHeroSectionProps = {
  apartment: ApartmentDetails | null;
  images: ApartmentImage[];
};

export default function ApartmentHeroSection({
  apartment,
  images,
}: ApartmentHeroSectionProps) {
  const { width } = Dimensions.get('window');
  const scrollX = useRef(new Animated.Value(0)).current;
  const [imageIndex, setImageIndex] = useState(0);
  const [isImageViewVisible, setIsImageViewVisible] = useState(false);

  const location = `${apartment?.street_address}, ${apartment?.city}, ${apartment?.province}`;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleViewFullImage = (index: number) => {
    setImageIndex(index);
    setIsImageViewVisible(true);
  };

  return (
    <View className='h-[42rem] bg-white relative'>
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
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <LinearGradient
        colors={['transparent', '#000000']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'flex-end',
          padding: 20,
        }}
        pointerEvents='none'
      >
        <View>
          <Text className='text-white font-poppinsSemiBold text-2xl'>
            {apartment?.name || 'Unnamed Apartment'}
          </Text>

          <View className='flex-row items-center mt-2 gap-2'>
            <IconMapPin size={24} color={COLORS.lightLightLightGrey} />
            <Text className='text-grey-100 font-interMedium text-base'>
              {location || 'No location provided'}
            </Text>
          </View>

          <View className='flex-row items-center mt-5 gap-2'>
            <IconStarFilled size={20} color={COLORS.secondary} />
            <Text className='text-grey-100 font-interMedium text-base'>
              No ratings yet
            </Text>
          </View>

          <View className='flex-row items-center justify-between mt-5 gap-6'>
            <View className='flex-row items-center gap-2'>
              <IconBed size={24} color={COLORS.lightLightLightGrey} />
              <Text className='text-grey-100 font-interMedium text-base'>
                {apartment?.no_bedrooms}{' '}
                {apartment?.no_bedrooms === 1 ? 'Bed' : 'Beds'}
              </Text>
            </View>

            <View className='flex-row items-center gap-2'>
              <IconBath size={24} color={COLORS.lightLightLightGrey} />
              <Text className='text-grey-100 font-interMedium text-base'>
                {apartment?.no_bathrooms}{' '}
                {apartment?.no_bathrooms === 1 ? 'Bath' : 'Baths'}
              </Text>
            </View>

            <View className='flex-row items-center gap-2'>
              <IconMaximize size={24} color={COLORS.lightLightLightGrey} />
              <Text className='text-grey-100 font-interMedium text-base'>
                {apartment?.area_sqm ? `${apartment?.area_sqm} Sqm` : 'N/A'}
              </Text>
            </View>
          </View>

          <View className='flex-row mt-4 gap-6'>
            <View className='flex-1 flex-row items-center gap-2'>
              <IconUsers size={24} color={COLORS.lightLightLightGrey} />
              <Text className='text-grey-100 font-interMedium text-base'>
                Max {apartment?.max_occupants}{' '}
                {apartment?.max_occupants === 1 ? 'Occupant' : 'Occupants'}
              </Text>
            </View>

            <View className='flex-1 flex-row items-center gap-2'>
              <IconBuildingSkyscraper
                size={24}
                color={COLORS.lightLightLightGrey}
              />
              <Text className='text-grey-100 font-interMedium text-base'>
                {apartment?.floor_level
                  ? `Floor ${apartment?.floor_level}`
                  : 'N/A'}
              </Text>
            </View>
          </View>

          <View className='flex-row mt-4 mb-5 gap-6'>
            <View className='flex-1 flex-row items-center gap-2'>
              <IconHome2 size={24} color={COLORS.lightLightLightGrey} />
              <Text className='text-grey-100 font-interMedium text-base'>
                {apartment?.type || 'N/A'}
              </Text>
            </View>

            <View className='flex-1 flex-row items-center gap-2'>
              <IconCalendar size={24} color={COLORS.lightLightLightGrey} />
              <Text className='text-grey-100 font-interMedium text-base'>
                {apartment?.lease_duration || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <View className='flex-row justify-center items-center'>
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
                className='h-2 bg-darkerWhite rounded mx-1'
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
      </LinearGradient>

      <ImageViewing
        key={imageIndex}
        images={images.map((img) => img.image)}
        imageIndex={imageIndex}
        visible={isImageViewVisible}
        onRequestClose={() => setIsImageViewVisible(false)}
        FooterComponent={({ imageIndex: currentIndex }) => (
          <View className='p-10 items-center'>
            <Text className='text-white font-interMedium'>
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
