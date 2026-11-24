import { View, Text, Image } from 'react-native'
import { useNavigation, useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StepProgress from '@/components/display/StepProgress'

import { Button } from 'heroui-native'

import { IMAGES } from 'constants/images'

import { useVerificationStore } from '@/stores/useVerificationStore'
import { useProfile } from 'hooks/auth'
import { usePortalStore } from '@/stores/usePortalStore'
import { choosePortal } from '@/service/auth/portalPreference'
import { useTranslation } from '@/hooks/i18n'

export default function Success() {
  const router = useRouter();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const reset = useVerificationStore((state) => state.reset);
  const { profile, loading } = useProfile();
  const activePortal = usePortalStore((state) => state.portal);

  useEffect(() => {
    reset();
  }, [reset]);

  // Terminal screen — block all back navigation (swipe, hardware,
  // programmatic). Uses expo-router's navigation object: the raw
  // usePreventRemove from @react-navigation/native throws here ("Couldn't
  // find a navigation object"). The ref (not state) flips synchronously in
  // handleGoToProfile so our own exit is never swallowed by a stale guard.
  const canLeaveRef = useRef(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!canLeaveRef.current) {
        e.preventDefault();
      }
    });

    return unsubscribe;
  }, [navigation]);

  const handleGoToProfile = () => {
    const portal = choosePortal(profile?.roles ?? [], activePortal);
    if (!portal) return;
    canLeaveRef.current = true;
    router.replace(
      portal === 'landlord'
        ? '/(tabs)/(landlord)/profile'
        : '/(tabs)/(tenant)/profile',
    );
  };

  return (
    <ScreenWrapper
      className='p-5'
    >
      <StepProgress
        currentStep={5}
        totalSteps={5}
        stepName={t("authMobile.verify.submitted")}
      />

      <View className='flex-1 items-center justify-center gap-5'>
        <Image 
          source={IMAGES.userCheck}
          className='size-60'
          resizeMode='contain'
        />

        <View className='flex gap-2'>
          <Text className='text-3xl text-success-text font-nunitoBold text-center'>
            {t("authMobile.verify.submitted")}
          </Text>

          <Text className='text-foreground text-base font-inter text-center mx-10'>
            {t("authMobile.verify.submittedBody")}
          </Text>
        </View>
      </View>

      <Button isDisabled={loading || !choosePortal(profile?.roles ?? [], activePortal)} onPress={handleGoToProfile}>
        <Button.Label>{t("authMobile.verify.goToProfile")}</Button.Label>
      </Button>
    </ScreenWrapper>
  )
}
