import { View, Text, Image, TouchableOpacity } from 'react-native'

import { IMAGES } from "../constants/images";
import { COLORS } from "../constants/colors";

import {
  IconBed,
  IconBath,
  IconMaximize,
  IconStarFilled,
  IconHeart,
  IconHeartFilled,
} from "@tabler/icons-react-native";

interface ApartmentCardProps {
  thumbnail?: string;
  name?: string;
  location?: string;
  ratings?: string;
  isFavorite?: boolean;
  monthlyRent?: number;
  noBedroom?: number;
  noBathroom?: number;
  areaSqm?: number;
  isGrid?: boolean;
}

export default function ApartmentCard({
  thumbnail,
  name = "Apartment Name",
  location,
  ratings = '0/5',
  isFavorite = false,
  monthlyRent = 0,
  noBedroom = 0,
  noBathroom = 0,
  areaSqm = 0,
  isGrid = true
}: ApartmentCardProps) {

  return (
    <View className='w-1/2 p-2'>
      <TouchableOpacity 
        className='h-80 bg-white rounded-2xl shadow-sm relative'
        activeOpacity={0.7}
      >
        {/* Thumbnail Image */}
        <View className='w-full h-[50%] overflow-hidden rounded-t-2xl'>
          <Image 
            source={IMAGES.defaultThumbnail}
            style={{height: '100%', width: '100%'}}
          />
        </View>

        {/* Description Container */}
        <View className='flex-1 p-2 items-start justify-between'>
          {/* Apartment Name and Address */}
          <View>
            <Text className='text-text text-base font-interMedium'>
              Apartment Name
            </Text>

            <Text className='text-grey-500 text-[12px] font-inter'>
              Barangay, City
            </Text>
          </View>

          {/* Utilities */}
          <View className='flex-row flex-wrap gap-y-1'>
            {/* Bedroom */}
            <View className='flex-row w-1/2 gap-1 items-center justify-start'>
              <IconBed 
                size={18}
                color={COLORS.grey}
              />

              <Text className='text-grey-500 text-[12px]'>
                1 Bedroom
              </Text>
            </View>

            {/* Bathroom */}
            <View className='flex-row w-1/2 gap-1 items-center justify-start'>
              <IconBath 
                size={18}
                color={COLORS.grey}
              />

              <Text className='text-grey-500 text-[12px]'>
                1 Bathroom
              </Text>
            </View>

            {/* Square Meters */}
            <View className='flex-row w-1/2 gap-1 items-center justify-start'>
              <IconMaximize 
                size={18}
                color={COLORS.grey}
              />

              <Text className='text-grey-500 text-[12px]'>
                1 Sqm
              </Text>
            </View>
          </View>

          <Text className='text-primary text-2xl font-interSemiBold'>
            ₱ 1000.00
          </Text>
        </View>

        {/* Floating Elements */}

        {/* Ratings */}
        <View 
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.90)' }}
          className='absolute top-2 left-2 bg-white p-2 rounded-full
            flex-row items-center justify-center gap-1'>
          <IconStarFilled 
            size={16}
            color={COLORS.yellowish}
          />

          <Text className='mr-1 text-text text-[12px] font-inter'>
            4.5
          </Text>
        </View>

        {/* Favorite Icon */}
        <View 
          className='absolute top-2 right-2 rounded-full p-2 flex items-center justify-center'
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', elevation: 3 }} // White bg
        >
          {isFavorite ? (
            <IconHeartFilled size={18} color="#FF385C" /> // Vibrant Rose/Red
          ) : (
            <IconHeart size={18} color={COLORS.grey} /> // Dark Grey/Black for contrast
          )}
        </View>
      </TouchableOpacity>
    </View>
  )
}