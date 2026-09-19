import { View, Text, Image } from 'react-native'
import { useNavigation, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'

import { usePreventRemove } from '@react-navigation/native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StepProgress from '@/components/display/StepProgress'

import { Button } from 'heroui-native'

import { IMAGES } from 'constants/images'

import { useVerificationStore } from '@/stores/useVerificationStore'
import { useProfile } from 'hooks/auth'

export default function Success() {
  const router = useRouter();
  const navigation = useNavigation();

  const [canLeave, setCanLeave] = useState(false);

  const reset = useVerificationStore((state) => state.reset);
  const { profile, loading } = useProfile();

  useEffect(() => {
    reset();
  }, [reset]);

  // Terminal screen — block all back navigation (swipe, hardware, programmatic)
  usePreventRemove(!canLeave, ({ data }) => {
    if (canLeave) {
      navigation.dispatch(data.action);
    }
  });

  const handleGoToProfile = () => {
    setCanLeave(true);
    router.replace(
      profile?.role === 'landlord'
        ? '/(tabs)/(landlord)/profile'
        : '/(tabs)/(tenant)/profile',
    );
  };

  return (
    <ScreenWrapper
      className='p-5'
    >
      <StepProgress currentStep={5} totalSteps={5} stepName="Verification Submitted" />

      <View className='flex-1 items-center justify-center gap-5'>
        <Image 
          source={IMAGES.userCheck}
          className='size-60'
          resizeMode='contain'
        />

        <View className='flex gap-2'>
          <Text className='text-3xl text-success font-nunitoBold text-center'>
            Verification Submitted
          </Text>

          <Text className='text-foreground text-base font-inter text-center mx-10'>
            Our team will review your ID shortly. You’ll be notified once your account is verified.
          </Text>
        </View>
      </View>

      <Button isDisabled={loading} onPress={handleGoToProfile}>
        <Button.Label>Go to Profile</Button.Label>
      </Button>
    </ScreenWrapper>
  )
}
