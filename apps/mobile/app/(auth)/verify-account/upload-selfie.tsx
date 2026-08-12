import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Image } from 'expo-image'

import { CloseButton, Button } from 'heroui-native'

import { IconChevronLeft, IconCamera } from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StepProgress from '@/components/display/StepProgress'

import { useColors } from '@/hooks/useTheme'
import { useVerificationStore } from '@/stores/useVerificationStore'
import { getCaptureSequence, SELFIE_STEP } from './constants/captureSequences'
import { getCaptureProgress } from './utils/gating'

export default function UploadSelfie() {
  const router = useRouter();
  const { colors } = useColors();

  const selectedId = useVerificationStore((state) => state.selectedId);
  const captures = useVerificationStore((state) => state.captures);

  const idStepsComplete = getCaptureProgress(getCaptureSequence(selectedId), captures).isComplete;
  const selfie = captures[SELFIE_STEP.id] ?? null;

  // Guard against landing here with no (or an incomplete) session — e.g. a
  // deep link straight to this screen. Redirect to the correct step rather
  // than rendering a selfie step over a session that never captured an ID.
  useEffect(() => {
    if (selectedId === null) {
      router.replace('/(auth)/verify-account/select-id');
    } else if (!idStepsComplete) {
      router.replace('/(auth)/verify-account/upload-id');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, idStepsComplete]);

  const handleCaptureSelfie = () => {
    router.push(`/(auth)/verify-account/live-capture?stepId=${SELFIE_STEP.id}`);
  };

  return (
    <ScreenWrapper
      className='p-5'
      footer={
        <Button
          isDisabled={selfie === null}
          onPress={() => router.push('/verify-account/success')}
          className='mx-5'
        >
          <Button.Label>Submit Verification</Button.Label>
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

      <StepProgress currentStep={3} totalSteps={4} stepName="Take a Selfie" />

      <View className='flex-1 items-center justify-center'>
        {selfie !== null ? (
          <View className='rounded-full overflow-hidden size-64 mt-10 bg-gray-200 items-center justify-center border-8 border-success'>
            <Image
              source={{ uri: selfie.uri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          </View>
        ) : (
          <View className='rounded-full size-64 mt-10 bg-gray-200 items-center justify-center border-8 border-dashed border-border'>
            <IconCamera size={56} color={colors.primary} />
          </View>
        )}

        <Text className='text-foreground text-muted font-inter text-center mt-5 mx-20'>
          Ensure good lighting and remove any face coverings for a clear photo.
        </Text>

        <Button
          variant="secondary"
          className='mt-6'
          onPress={handleCaptureSelfie}
        >
          <Button.Label>
            {selfie !== null ? 'Retake Selfie' : 'Capture Selfie'}
          </Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  )
}