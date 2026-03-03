import { View, Text, TouchableOpacity, Image } from 'react-native'

interface PastApartmentCardProps {
  apartmentName: string
  barangay: string
  city: string
  leaseStartMonth: string
  leaseStartYear: string
  leaseEndMonth: string
  leaseEndYear: string
  thumbnailUrl: string
  onPress: () => void
}

export default function PastApartmentCard({
  apartmentName,
  barangay,
  city,
  leaseStartMonth,
  leaseStartYear,
  leaseEndMonth,
  leaseEndYear,
  thumbnailUrl,
  onPress
}: PastApartmentCardProps) {

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

      <View className='p-3 flex-1 justify-between'>
        <View className='flex-1'> 
          <Text className='text-text text-lg font-interMedium'>
            {apartmentName}
          </Text>

          <Text className='text-grey-500 text-base font-inter'>
            {barangay}, {city}
          </Text>
        </View>

        <Text className='text-sm text-grey-500 font-inter'>
          {leaseStartMonth} {leaseStartYear} - {leaseEndMonth} {leaseEndYear}
        </Text>
      </View>
    </TouchableOpacity>
  )
}