import { View, Text, Image } from 'react-native'
import { useNavigation, useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StepProgress from '@/components/display/StepProgress'

import { Button } from 'heroui-native'

import { IMAGES } from 'constants/images'

import { useVerificationStore } from '@/stores/useVerificationStore'

export default function Success() {
  const router = useRouter();
  const navigation = useNavigation();

  const canLeave = useRef(false);

  const reset = useVerificationStore((state) => state.reset);

  useEffect(() => {
    reset();
  }, [reset]);

  // Terminal screen — block all back navigation (swipe, hardware, programmatic)
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (canLeave.current) return;
      e.preventDefault();
    });
    return unsubscribe;
  }, [navigation]);

  const handleGoToProfile = () => {
    canLeave.current = true;
    router.replace('/(tabs)/(tenant)/profile');
  };

  return (
    <ScreenWrapper
      className='p-5'
    >
      <StepProgress currentStep={4} totalSteps={4} stepName="Verification Submitted" />

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

      <Button onPress={handleGoToProfile}>
        <Button.Label>Go to Profile</Button.Label>
      </Button>
    </ScreenWrapper>
  )
}
