import { View, Text, TouchableOpacity, Image } from 'react-native'

import { DEFAULT_IMAGES } from '@/constants/images'

export default function PropertyCard() {
  return (
    <TouchableOpacity
      className='bg-white rounded-2xl border border-grey-200 flex-row'
      activeOpacity={0.7}
    >
      {/* Image */}
      <View className='overflow-hidden size-32 rounded-2xl'>
        <Image 
          source={DEFAULT_IMAGES.defaultThumbnail}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </View>

      <View className='p-3 flex-1'>
        <View className='flex-1'> 
          <Text className='text-text text-lg font-interMedium'>
            Apartment Name
          </Text>

          <Text className='text-grey-500 text-base font-inter'>
            Address, City
          </Text>
        </View>

        <View className='flex-row items-center justify-between'>
          <Text className='text-sm text-grey-500 font-inter'>
            Status: <Text className='text-greenHulk-200'>Available</Text>
          </Text>

          <Text className='text-sm text-text font-inter'>
            Listed: 11/20/2024
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}