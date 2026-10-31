import { Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'

import { Button, CloseButton } from 'heroui-native'

import { IconBulb, IconChevronLeft, IconFaceId, IconIdBadge } from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StepProgress from '@/components/display/StepProgress'

import type { TranslationKey } from '@repo/i18n'

import { useColors } from '@/hooks/useTheme'
import { useVerificationStore } from '@/stores/useVerificationStore'
import { getCaptureSequence } from '@/constants/verification/captureSequences'
import { getCaptureProgress } from '@/utils/verification/gating'
import { useTranslation } from '@/hooks/i18n'

type GuidelineIcon = typeof IconBulb;

interface SelfieGuideline {
  icon: GuidelineIcon
  textKey: TranslationKey
}

const SELFIE_GUIDELINES: SelfieGuideline[] = [
  { icon: IconBulb, textKey: 'authMobile.verify.selfiePrep.lighting' },
  { icon: IconIdBadge, textKey: 'authMobile.verify.selfiePrep.holdId' },
  { icon: IconFaceId, textKey: 'authMobile.verify.selfiePrep.face' },
];

export default function SelfiePrep() {
  const router = useRouter();
  const { colors } = useColors();
  const { t } = useTranslation();

  const selectedId = useVerificationStore((state) => state.selectedId);
  const captures = useVerificationStore((state) => state.captures);
  const idStepsComplete = getCaptureProgress(getCaptureSequence(selectedId), captures).isComplete;

  useEffect(() => {
    if (selectedId === null) {
      router.replace('/(auth)/verify-account/select-id');
    } else if (!idStepsComplete) {
      router.replace('/(auth)/verify-account/upload-id');
    }
  }, [idStepsComplete, router, selectedId]);

  return (
    <ScreenWrapper
      className='p-5'
      footer={
        <Button onPress={() => router.push('/(auth)/verify-account/upload-selfie')} className='mx-5'>
          <Button.Label>{t("authMobile.verify.selfiePrep.ready")}</Button.Label>
        </Button>
      }
    >
      <CloseButton
        variant="ghost"
        className="-ml-2 mb-2"
        onPress={router.back}
      >
        <IconChevronLeft size={26} color={colors.textPrimary} />
      </CloseButton>

      <StepProgress
        currentStep={3}
        totalSteps={5}
        stepName={t("authMobile.verify.selfiePrep.step")}
      />

      <View className='flex-1 items-center justify-center gap-6 px-2'>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={t("authMobile.verify.selfiePrep.illustration")}
          className='size-48 items-center justify-center rounded-full border-4 border-success bg-success-light'
        >
          <IconFaceId size={96} color={colors.success} strokeWidth={1.5} />
        </View>

        <View className='items-center gap-3'>
          <Text className='text-center text-2xl font-nunitoMedium text-accent'>
            {t("authMobile.verify.selfiePrep.title")}
          </Text>
          <Text className='text-center text-base font-inter text-gray-500'>
            {t("authMobile.verify.selfiePrep.body")}
          </Text>
        </View>

        <View className='w-full gap-3'>
          {SELFIE_GUIDELINES.map(({ icon: GuidelineIcon, textKey }) => (
            <View key={textKey} className='flex-row items-center gap-3 rounded-3xl bg-primary p-2'>
              <View className='rounded-full bg-white/20 p-2'>
                <GuidelineIcon size={22} color={colors.white} />
              </View>
              <Text className='flex-1 text-sm font-nunitoSemiBold text-white'>
                {t(textKey)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScreenWrapper>
  )
}
