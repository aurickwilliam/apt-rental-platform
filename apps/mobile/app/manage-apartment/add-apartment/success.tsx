import { View, Text, Image } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import PillButton from '@/components/buttons/PillButton'

import { IMAGES } from '@/constants/images'

export default function Success() {
  const router = useRouter();

  return (
    <ScreenWrapper
      className='p-5 flex items-center justify-center'
    >
      <Image 
        source={IMAGES.houseCheck}
        style={{ width: 200, height: 200 }}
      />

      <View>
        <Text className='text-2xl font-poppinsSemiBold text-center mt-5 text-primary'>
          You’ve successfully posted your property!
        </Text>

        <Text className='text-lg font-interMedium text-center mt-5 text-text'>
          Great job! Tenants can now view and apply for your listing. Keep it updated to attract more renters.
        </Text>
      </View>

      <View className='w-full mt-10 flex gap-3'>
        <PillButton
          label='View My Property'
          onPress={() => router.push('/manage-apartment/1')}
        />

        <PillButton
          label='Go to Dashboard'
          type='outline'
          onPress={() => router.push('/(tabs)/(landlord)/dashboard')}
        />
      </View>
    </ScreenWrapper>
  )
}