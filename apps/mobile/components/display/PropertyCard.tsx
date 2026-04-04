import { View, Text, TouchableOpacity, Image } from 'react-native'
import { COLORS } from '@repo/constants'

interface PropertyCardProps {
  apartmentName: string
  barangay: string
  city: string
  status: 'Available' | 'Occupied' | 'Under Maintenance' | 'Unverified'
  thumbnailUrl: string | undefined
  onPress: () => void
}

export default function PropertyCard({
  apartmentName,
  barangay,
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
      backgroundColor: COLORS.lightYellowish,
      color: COLORS.yellowish,               
    },
    'Available': {
      backgroundColor: COLORS.lightBlue,    
      color: COLORS.primary,                
    },
    'Unverified': {
      backgroundColor: COLORS.lightLightLightGrey, 
      color: COLORS.grey,                          
    },
  }

  return (
    <TouchableOpacity
      className='bg-white rounded-2xl border border-grey-200 flex-row overflow-hidden'
      activeOpacity={0.7}
      onPress={onPress}
    >
      {/* Image */}
      <View className='size-32 shrink-0'>
        <Image
          source={{ uri: thumbnailUrl }}
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      {/* Content */}
      <View className='p-3 flex-1 min-w-0'>
        <View className='mb-2'>
          <Text
            className='text-lg font-interMedium text-text'
            numberOfLines={1}
            ellipsizeMode='tail'
          >
            {apartmentName}
          </Text>

          <Text
            className='text-grey-500 text-base font-inter'
            numberOfLines={2}
            ellipsizeMode='tail'
          >
            {barangay}, {city}
          </Text>
        </View>

        <View
          className='px-2 py-1 rounded-full self-start mt-auto border'
          style={{ backgroundColor: STATUS_STYLES[status].backgroundColor, borderColor: STATUS_STYLES[status].color }}

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