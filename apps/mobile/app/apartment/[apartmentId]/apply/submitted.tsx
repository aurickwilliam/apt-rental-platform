import { View, Text, Image, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'

import { IMAGES } from '../../../../constants/images'
import PillButton from 'components/buttons/PillButton';

export default function Submitted() {
  const router = useRouter();

  // Dummy data for now, will be replaced with real data from backend
  const apartmentName = 'The Grand Apartments';

  return (
    <ScreenWrapper
      className='p-5'
    >
      <View className='flex-1 items-center justify-center'>
        {/* Image */}
        <View className='size-40 mb-5'>
          <Image 
            source={IMAGES.houseCheck}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </View>

        <Text className='text-primary font-poppinsSemiBold text-3xl mb-5'>
          Application Sent!
        </Text>

        <Text className='text-text font-interMedium text-base mt-2 text-center mx-10'>
          Your application for {apartmentName} has been submitted. Rental Owner will review your application and get back to you soon.
        </Text>
      </View>

      <View className='flex gap-5'>
        <PillButton 
          label='View Application Status'
          isFullWidth
          onPress={() => {}}
        />

        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => router.navigate(`/(tabs)/(tenant)/home`)}
          className='flex items-center justify-center'
        >
          <Text className='text-secondary text-lg font-interMedium'>
            Go Home
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  )
}