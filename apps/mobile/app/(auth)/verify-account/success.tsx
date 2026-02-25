import { View, Text, Image } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import PillButton from '@/components/buttons/PillButton'

import { IMAGES } from 'constants/images'

export default function Success() {
  const router = useRouter();

  return (
    <ScreenWrapper
      className='p-5'
    >
      <View className='flex-1 items-center justify-center gap-5'>
        <Image 
          source={IMAGES.userCheck}
          className='size-60'
          resizeMode='contain'
        />

        <View className='flex gap-2'>
          <Text className='text-3xl text-greenHulk-200 font-poppinsMedium text-center'>
            Verification Submitted
          </Text>

          <Text className='text-text text-base font-inter text-center mx-10'>
            Our team will review your ID shortly. You’ll be notified once your account is verified.
          </Text>
        </View>
      </View>

      <PillButton 
        label='Go to Profile'
        onPress={() => router.push('/(tabs)/(tenant)/profile')}
      />
    </ScreenWrapper>
  )
}