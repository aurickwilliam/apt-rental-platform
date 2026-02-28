import { View, Text, TouchableOpacity, Image } from 'react-native'

import { COLORS } from '@repo/constants'

interface PropertyCardProps {
  apartmentName: string
  address: string
  city: string
  status: 'Available' | 'Occupied' | 'Under Maintenance'
  thumbnailUrl: string
  onPress: () => void
}

export default function PropertyCard({
  apartmentName,
  address,
  city,
  status,
  thumbnailUrl,
  onPress,
}: PropertyCardProps) {

  const STATUS_STYLES = {
    'Occupied': {
      backgroundColor: COLORS.lightGreen,
      color: COLORS.greenHulk,
    },
    'Under Maintenance': {
      backgroundColor: COLORS.lightLightRedHead,
      color: COLORS.redHead,
    },
    'Available': {
      backgroundColor: COLORS.lightYellowish,
      color: COLORS.yellowish,
    },
  }

  return (
    <TouchableOpacity
      className='bg-white rounded-2xl border border-grey-200 flex-row'
      activeOpacity={0.7}
      onPress={onPress}
    >
      {/* Image */}
      <View className='overflow-hidden size-32 rounded-2xl'>
        <Image 
          source={{ uri: thumbnailUrl }}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </View>

      <View className='p-3 flex-1'>
        <View className='flex-1'> 
          <Text className='text-text text-lg font-interMedium'>
            {apartmentName}
          </Text>

          <Text className='text-grey-500 text-base font-inter'>
            {address}, {city}
          </Text>
        </View>

        <View
          className='flex items-center justify-center px-2 py-1 rounded-full self-start'
          style={{ backgroundColor: STATUS_STYLES[status].backgroundColor }}
        >
          <Text
            className='text-sm font-inter'
            style={{ color: STATUS_STYLES[status].color }}
          >
            {status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}