import {View, Text, Image, TouchableOpacity, useWindowDimensions} from 'react-native'

import { DEFAULT_IMAGES } from "constants/images";
import { COLORS } from "@repo/constants";

import {
  IconBed,
  IconBath,
  IconMaximize,
  IconStarFilled,
  IconHeart,
  IconHeartFilled,
} from "@tabler/icons-react-native";

export default function ApartmentCard({
  id,
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
  const { width } =  useWindowDimensions();

  const HORIZONTAL_PADDING = 16;
  const GRID_GAP = 16;
  const cardWidth = isGrid
    ? (width - HORIZONTAL_PADDING * 2 - GRID_GAP) / 2
    : width - HORIZONTAL_PADDING * 2;

  return (
    <View style={{width: cardWidth}} className='px-2'>
      <TouchableOpacity
        className='bg-white rounded-2xl relative'
        activeOpacity={0.7}
        onPress={onPress}
      >
        {/* Thumbnail Image */}
        <View className='aspect-square overflow-hidden rounded-2xl'>
          <Image
            source={thumbnail ? thumbnail : DEFAULT_IMAGES.defaultThumbnail}
            style={{height: '100%', width: '100%'}}
          />
        </View>

        {/* Description Container */}
        <View className={`${isGrid ? 'p-2 gap-2' : 'p-3 gap-3'}`}>
          {/* Apartment Name and Address */}
          <View>
            <Text className={`text-text font-interMedium ${isGrid ? 'text-base' : 'text-xl'}`}>
              {name}
            </Text>

            <Text className={`text-grey-500 font-inter ${isGrid ? 'text-[12px]' : 'text-base'}`}>
              {location}
            </Text>
          </View>

          {/* Utilities */}
          {
            !isGrid && (
              <View className='flex-row flex-wrap'>
                {/* Bedroom */}
                <View className='flex-row w-2/6 gap-1 items-center justify-start'>
                  <IconBed
                    size={18}
                    color={COLORS.grey}
                  />

                  <Text className='text-grey-500 text-[12px]'>
                    {noBedroom} Bedroom
                  </Text>
                </View>

                {/* Bathroom */}
                <View className='flex-row w-2/6 gap-1 items-center justify-start'>
                  <IconBath
                    size={18}
                    color={COLORS.grey}
                  />

                  <Text className='text-grey-500 text-[12px]'>
                    {noBathroom} Bathroom
                  </Text>
                </View>

                {/* Square Meters */}
                <View className='flex-row w-2/6 gap-1 items-center justify-start'>
                  <IconMaximize
                    size={18}
                    color={COLORS.grey}
                  />

                  <Text className='text-grey-500 text-[12px]'>
                    {areaSqm} Sqm
                  </Text>
                </View>
              </View>
            )
          }

          <View className='flex-row items-center justify-between'>
            <Text className={`text-primary font-interSemiBold ${isGrid ? 'text-xl' : 'text-2xl'}`}>
              ₱ {monthlyRent}
            </Text>

            {/* Ratings */}
            <View
              className='flex-row items-center justify-center gap-1'>
              <IconStarFilled
                size={isGrid ? 16 : 18}
                color={COLORS.secondary}
              />

              <Text className={`mr-1 text-text font-inter ${isGrid ? 'text-[12px]' : 'text-base'}`}>
                {ratings}
              </Text>
            </View>
          </View>
        </View>

        {/* Floating Element */}

        {/* Favorite Icon */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPressFavorite}
          className='absolute top-2 right-2 rounded-full p-2 flex items-center justify-center'
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.75)', elevation: 3 }}
        >
          {isFavorite ? (
            <IconHeartFilled
              size={isGrid ? 18 : 24}
              color={COLORS.lightRedHead}
            />
          ) : (
            <IconHeart
              size={isGrid ? 18 : 24}
              color={COLORS.grey}
            />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  )
}
