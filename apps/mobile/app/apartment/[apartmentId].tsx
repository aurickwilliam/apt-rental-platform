import {
  View,
  Text,
  ScrollView,
  Image,
  Animated,
  Dimensions
} from 'react-native'
import { useRef } from 'react';
import { useLocalSearchParams } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient';

import ScreenWrapper from 'components/layout/ScreenWrapper'

import { COLORS } from 'constants/colors';
import { IMAGES } from 'constants/images';

import {
  IconMapPin,
  IconHome2,
  IconStarFilled,
  IconBed,
  IconBath,
  IconMaximize,
  IconChevronLeft,
  IconHeart,
} from "@tabler/icons-react-native";
import IconButton from 'components/buttons/IconButton';

export default function ApartmentScreen() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  const { width } = Dimensions.get('window');

  // Refs for ScrollView
  const imageScrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  // Dummy Data for apartment images
  const apartmentImages = [
    {id: 1, image: IMAGES.defaultThumbnail},
    {id: 2, image: IMAGES.defaultThumbnail},
    {id: 3, image: IMAGES.defaultThumbnail},
  ]

  // Dummy Data for Apartment Details
  const apartmentDetails = {
    name: 'Sample Apartment',
    type: 'Condominium',
    ratings: '4.5',
    location: 'Sample Location',
    monthlyRent: 1200,
    noBedroom: 2,
    noBathroom: 1,
    areaSqm: 85,
  }

  return (
    <ScreenWrapper
      scrollable
      backgroundColor={COLORS.white}
    >
      <View className='h-[36rem] bg-white relative'>
        {/* Image Carousel */}
        <ScrollView
          ref={imageScrollViewRef}
          horizontal
          pagingEnabled
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
        >
          {/* Render Individual Images */}
          {
            apartmentImages.map((item) => (
              <View
                className='w-screen h-[36rem]'
                key={item.id}
              >
                <Image
                  source={item.image}
                  style={{height: '100%', width:  '100%'}}
                />
              </View>
            ))
          }
        </ScrollView>

        {/* Text Details on top of the Carousel*/}
        {/* Linear Gradient Overlay*/}
        <LinearGradient
          colors={['transparent', '#000000']}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'flex-end',
            padding: 16,
          }}
          pointerEvents='none'
        >

          {/* Apartment Details*/}
          <View>
            <Text className='text-white font-poppinsSemiBold text-2xl'>
              {apartmentDetails.name}
            </Text>

            <View className='flex-row items-center mt-2 gap-2'>
              <IconMapPin
                size={24}
                color={COLORS.lightLightLightGrey}
              />
              <Text className='text-grey-100 font-interMedium text-base'>
                {apartmentDetails.location}
              </Text>
            </View>

            <View className='flex-row items-center justify-between mt-8 gap-6'>
              <View className='flex-row items-center gap-2'>
                <IconHome2
                  size={24}
                  color={COLORS.lightLightLightGrey}
                />
                <Text className='text-grey-100 font-interMedium text-base'>
                  {apartmentDetails.type}
                </Text>
              </View>

              <View className='flex-row items-center gap-2'>
                <IconStarFilled
                  size={20}
                  color={COLORS.yellowish}
                />
                <Text className='text-grey-100 font-interMedium text-base'>
                  {apartmentDetails.ratings}  (70)
                </Text>
              </View>
            </View>

            <View className='flex-row items-center justify-between my-5 gap-6'>
              <View className='flex-row items-center gap-2'>
                <IconBed
                  size={24}
                  color={COLORS.lightLightLightGrey}
                />
                <Text className='text-grey-100 font-interMedium text-base'>
                  {apartmentDetails.noBedroom} Bedrooms
                </Text>
              </View>

              <View className='flex-row items-center gap-2'>
                <IconBath
                  size={24}
                  color={COLORS.lightLightLightGrey}
                />
                <Text className='text-grey-100 font-interMedium text-base'>
                  {apartmentDetails.noBathroom} Bathrooms
                </Text>
              </View>

              <View className='flex-row items-center gap-2'>
                <IconMaximize
                  size={24}
                  color={COLORS.lightLightLightGrey}
                />
                <Text className='text-grey-100 font-interMedium text-base'>
                  {apartmentDetails.areaSqm} Sqm
                </Text>
              </View>
            </View>
          </View>

          {/* Pagination Dots */}
          <View className='flex-row justify-center items-center'>
            {apartmentImages.map((_, index) => {
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

          {/* Floating Elements*/}
          {/* Back Button*/}
          <View className='absolute top-3 left-3'>
            <IconButton
              iconName={IconChevronLeft}
            />
          </View>

          {/* Favorite Button */}
          <View className='absolute top-3 right-3'>
            <IconButton
              iconName={IconHeart}
            />
          </View>
        </LinearGradient>
      </View>

    </ScreenWrapper>
  )
}
