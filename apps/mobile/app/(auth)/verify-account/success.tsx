import { View, Text, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StepProgress from '@/components/display/StepProgress'
import PillButton from '@/components/buttons/PillButton'

import { IMAGES } from 'constants/images'

import { useVerificationStore } from '@/stores/useVerificationStore'

export default function Success() {
  const router = useRouter();

  const reset = useVerificationStore((state) => state.reset);

  useEffect(() => {
    reset();
  }, [reset]);

  return (
    <ScreenWrapper
      className='p-5'
    >
      <StepProgress currentStep={4} totalSteps={4} />

      <View className='flex-1 items-center justify-center gap-5'>
        <Image 
          source={IMAGES.userCheck}
          className='size-60'
          resizeMode='contain'
        />

        <View className='flex gap-2'>
          <Text className='text-3xl text-success font-interSemiBold text-center'>
            Verification Submitted
          </Text>

          <Text className='text-foreground text-base font-inter text-center mx-10'>
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