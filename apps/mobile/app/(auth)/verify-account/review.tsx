import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Image } from 'expo-image'

import { CloseButton, Button, Card } from 'heroui-native'

import { IconChevronLeft, IconCheck } from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StepProgress from '@/components/display/StepProgress'
import ErrorDialog from '@/components/display/ErrorDialog'

import { useColors } from '@/hooks/useTheme'
import { buildVerificationInput, useSubmitVerification } from '@/hooks/verification'
import { useVerificationStore } from '@/stores/useVerificationStore'
import { getCaptureSequence, SELFIE_STEP } from './constants/captureSequences'
import { getCaptureProgress } from './utils/gating'

export default function Review() {
  const router = useRouter();
  const { colors } = useColors();

  const selectedId = useVerificationStore((state) => state.selectedId);
  const captures = useVerificationStore((state) => state.captures);

  const sequence = getCaptureSequence(selectedId);
  const idStepsComplete = getCaptureProgress(sequence, captures).isComplete;
  const selfie = captures[SELFIE_STEP.id] ?? null;

  const { mutateAsync, isPending } = useSubmitVerification();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Guard against landing here with an incomplete session — e.g. a deep
  // link straight to this screen. Redirect to the correct step rather than
  // rendering a review over captures that were never taken.
  useEffect(() => {
    if (selectedId === null) {
      router.replace('/(auth)/verify-account/select-id');
    } else if (!idStepsComplete) {
      router.replace('/(auth)/verify-account/upload-id');
    } else if (selfie === null) {
      router.replace('/(auth)/verify-account/upload-selfie');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, idStepsComplete, selfie]);

  const handleEditIdStep = (stepId: string) => {
    router.push(`/(auth)/verify-account/live-capture?idType=${encodeURIComponent(selectedId ?? '')}&stepId=${encodeURIComponent(stepId)}`);
  };

  const handleRetakeSelfie = () => {
    router.push(`/(auth)/verify-account/live-capture?stepId=${SELFIE_STEP.id}`);
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    let input;
    try {
      input = buildVerificationInput(selectedId, captures);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Please complete all required photos.');
      return;
    }

    try {
      await mutateAsync(input);
      router.push('/(auth)/verify-account/success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to submit verification.');
      console.error('Verification submit failed', err);
    }
  };

  return (
    <ScreenWrapper
      className='p-5'
      scrollable
      footer={
        <Button
          isDisabled={isPending}
          onPress={handleSubmit}
          className='mx-5'
        >
          <Button.Label>
            {isPending ? 'Submitting…' : 'Submit for Verification'}
          </Button.Label>
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
        currentStep={4}
        totalSteps={5}
        stepName="Review & Submit"
      />

      <View className='flex gap-1'>
        <Text className='text-2xl text-accent font-nunitoMedium'>
          {selectedId}
        </Text>
        <Text className='text-sm text-gray-500 font-inter'>
          Review your documents before submitting.
        </Text>
      </View>

      <View className='flex gap-5 mt-5'>
        {sequence.map((step) => {
          const result = captures[step.id] ?? null;
          if (result === null) return null;

          return (
            <View key={step.id} className='gap-2'>
              <View className='flex-row items-center gap-2'>
                <Text className='text-base font-nunitoSemiBold text-foreground'>
                  ID {step.label}:
                </Text>
                <IconCheck size={18} color={colors.primary} />
              </View>

              <Card className='shadow-none border border-border bg-surface p-4'>
                <View className='flex-row items-center gap-3'>
                  <Image
                    source={{ uri: result.uri }}
                    className='size-14 rounded-lg'
                    contentFit="cover"
                    cachePolicy="disk"
                    accessibilityLabel={`ID ${step.label} photo`}
                  />
                  <Text className='flex-1 text-sm font-nunitoSemiBold text-foreground'>
                    Captured photo
                  </Text>
                  <Button variant="tertiary" size="sm" onPress={() => handleEditIdStep(step.id)}>
                    <Button.Label>Retake</Button.Label>
                  </Button>
                </View>
              </Card>
            </View>
          );
        })}

        {selfie !== null && (
          <View className='gap-2'>
            <View className='flex-row items-center gap-2'>
              <Text className='text-base font-nunitoSemiBold text-foreground'>
                Selfie:
              </Text>
              <IconCheck size={18} color={colors.primary} />
            </View>

            <Card className='shadow-none border border-border bg-surface p-4'>
              <View className='flex-row items-center gap-3'>
                <Image
                  source={{ uri: selfie.uri }}
                  className='size-14 rounded-full'
                  contentFit="cover"
                  cachePolicy="disk"
                  accessibilityLabel="Selfie holding your ID"
                />
                <Text className='flex-1 text-sm font-nunitoSemiBold text-foreground'>
                  Holding your ID
                </Text>
                <Button variant="tertiary" size="sm" onPress={handleRetakeSelfie}>
                  <Button.Label>Retake</Button.Label>
                </Button>
              </View>
            </Card>
          </View>
        )}
      </View>

      <View className='mt-5 rounded-2xl border border-border bg-surface p-4'>
        <Text className='text-sm font-inter text-gray-500 text-center'>
          Your ID photos and selfie will be sent to APT administrators for manual verification. You’ll be notified once the review is complete.
        </Text>
      </View>

      <ErrorDialog
        isOpen={errorMessage !== null}
        onClose={() => setErrorMessage(null)}
        message={errorMessage ?? ''}
        title="Submission Failed"
      />
    </ScreenWrapper>
  )
}
