import { View, Text } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Image } from 'expo-image'

import { CloseButton, Button, Checkbox, ControlField, Label } from 'heroui-native'

import { IconChevronLeft, IconCheck } from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StepProgress from '@/components/display/StepProgress'

import { useColors } from '@/hooks/useTheme'
import { useVerificationStore } from '@/stores/useVerificationStore'
import { computeCanContinue, getCaptureProgress } from './utils/gating'
import { getCaptureSequence, type CaptureStepConfig } from './constants/captureSequences'
import type { IdCaptureResult } from '@/stores/useVerificationStore'

const AUTHENTICITY_DECLARATION = 'I confirm that the submitted ID is authentic, valid, and belongs to me.'

export default function UploadId() {
  const router = useRouter();
  const { colors } = useColors();

  const selectedId = useVerificationStore((state) => state.selectedId);
  const captures = useVerificationStore((state) => state.captures);
  const clearCaptureResults = useVerificationStore((state) => state.clearCaptureResults);

  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const sequence = getCaptureSequence(selectedId);
  const progress = getCaptureProgress(sequence, captures);
  const canContinue = computeCanContinue(sequence, captures, isConfirmed);
  const firstIncompleteStepId = progress.steps.find(({ result }) => result === null)?.step.id ?? null;

  const navigateToCapture = useCallback(
    (stepId: string) => {
      router.push(`/(auth)/verify-account/live-capture?idType=${encodeURIComponent(selectedId ?? '')}&stepId=${encodeURIComponent(stepId)}`);
    },
    [router, selectedId],
  );

  // Guard against landing here with no Selected_Id_Type — e.g. the camera's
  // close button just called reset() and the user is backing into this screen.
  useEffect(() => {
    if (selectedId === null) {
      router.replace('/(auth)/verify-account/select-id');
    }
  }, [router, selectedId]);

  // Advance only while this route is foregrounded. UploadId remains mounted
  // beneath live-capture, so a normal captures-dependent effect could issue a
  // competing navigation while the camera is still presenting its review UI.
  useFocusEffect(
    useCallback(() => {
      if (firstIncompleteStepId === null) return;

      navigateToCapture(firstIncompleteStepId);
    }, [firstIncompleteStepId, navigateToCapture]),
  );

  const handleRetakeIdPhotos = useCallback(() => {
    clearCaptureResults(sequence.map((step) => step.id));
    setIsConfirmed(false);
  }, [clearCaptureResults, sequence]);

  return (
    <ScreenWrapper
      className='p-5'
      scrollable
      footer={
        <View className='mx-5 gap-3'>
          {progress.isComplete && (
            <Button variant="secondary" onPress={handleRetakeIdPhotos}>
              <Button.Label>Retake ID Photos</Button.Label>
            </Button>
          )}

          <Button
            isDisabled={!canContinue}
            onPress={() => router.push('/verify-account/selfie-prep')}
          >
            <Button.Label>Continue to Selfie</Button.Label>
          </Button>
        </View>
      }
    >
      <CloseButton
        variant="ghost"
        className="-ml-2 mb-2"
        onPress={router.back}
      >
        <IconChevronLeft size={26} color={colors.textPrimary} />
      </CloseButton>

      <StepProgress currentStep={2} totalSteps={4} stepName="Upload Your ID" />

      <View className='flex gap-2'>
        <Text className='text-2xl text-accent font-nunitoMedium'>
          {selectedId}
        </Text>
        <Text className='text-base text-gray-500 font-inter'>
          {progress.isComplete
            ? 'Review your captured ID photos before continuing.'
            : 'Opening your camera for the next required ID photo.'}
        </Text>
      </View>

      {progress.isComplete && (
        <>
          <View className='flex gap-5 mt-5'>
            {progress.steps.map(({ step, result }) =>
              result !== null ? (
                <CaptureStepSummary
                  key={step.id}
                  step={step}
                  result={result}
                />
              ) : null,
            )}
          </View>

          <View className='mt-5'>
            <ControlField
              isSelected={isConfirmed}
              onSelectedChange={() => setIsConfirmed((currentValue) => !currentValue)}
            >
              <ControlField.Indicator>
                <Checkbox className='size-5 border border-border shadow-none' />
              </ControlField.Indicator>

              <Label>
                <Label.Text className='text-sm text-foreground font-nunitoSemiBold leading-snug'>
                  {AUTHENTICITY_DECLARATION}
                </Label.Text>
              </Label>
            </ControlField>
          </View>
        </>
      )}
    </ScreenWrapper>
  )
}

interface CaptureStepSummaryProps {
  step: CaptureStepConfig
  result: IdCaptureResult
}

function CaptureStepSummary({ step, result }: CaptureStepSummaryProps) {
  const { colors } = useColors();

  return (
    <View className='gap-2'>
      <View className='flex-row items-center gap-2'>
        <Text className='text-base font-nunitoSemiBold text-foreground'>
          {step.label}:
        </Text>
        <IconCheck size={18} color={colors.primary} />
      </View>

      <View className='flex-row items-center gap-3 rounded-2xl border border-border bg-surface p-4'>
        <Image
          source={{ uri: result.uri }}
          className='size-14 rounded-lg'
          contentFit="cover"
          cachePolicy="disk"
          accessibilityLabel={`${step.label} ID photo`}
        />
        <Text className='flex-1 text-sm font-nunitoSemiBold text-foreground'>
          Captured photo
        </Text>
      </View>
    </View>
  )
}
