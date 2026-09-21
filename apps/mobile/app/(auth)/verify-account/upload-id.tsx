import { Pressable, View, Text } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Image } from 'expo-image'
import ImageViewing from 'react-native-image-viewing'

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
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);

  const sequence = getCaptureSequence(selectedId);
  const progress = getCaptureProgress(sequence, captures);
  const canContinue = computeCanContinue(sequence, captures, isConfirmed);
  const firstIncompleteStepId = progress.steps.find(({ result }) => result === null)?.step.id ?? null;

  // Completed steps drive both the summary cards and the fullscreen viewer
  // so tapping a card opens the viewer on that exact photo.
  const completedSteps = progress.steps.filter(
    (entry): entry is { step: CaptureStepConfig; result: IdCaptureResult } => entry.result !== null,
  );
  const viewerImages = completedSteps.map(({ result }) => ({ uri: result.uri }));

  const navigateToCapture = (stepId: string) => {
    router.push(`/(auth)/verify-account/live-capture?idType=${encodeURIComponent(selectedId ?? '')}&stepId=${encodeURIComponent(stepId)}`);
  };

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
  useFocusEffect(() => {
    if (firstIncompleteStepId === null) return;

    navigateToCapture(firstIncompleteStepId);
  });

  const handleRetakeIdPhotos = () => {
    clearCaptureResults(sequence.map((step) => step.id));
    setIsConfirmed(false);
    setViewingIndex(null);
  };

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
            onPress={() => router.push('/(auth)/verify-account/selfie-prep')}
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

      <StepProgress currentStep={2} totalSteps={5} stepName="Upload Your ID" />

      <View className='flex gap-1'>
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
            {completedSteps.map(({ step, result }, index) => (
              <CaptureStepSummary
                key={step.id}
                step={step}
                result={result}
                onPress={() => setViewingIndex(index)}
              />
            ))}
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

          <ImageViewing
            images={viewerImages}
            imageIndex={viewingIndex ?? 0}
            visible={viewingIndex !== null}
            onRequestClose={() => setViewingIndex(null)}
            presentationStyle="overFullScreen"
            backgroundColor="rgb(0, 0, 0, 0.8)"
            FooterComponent={({ imageIndex: idx }) => (
              <View className="p-10 items-center">
                <Text className="text-white font-nunitoSemiBold">
                  {idx + 1} / {viewerImages.length}
                </Text>
              </View>
            )}
          />
        </>
      )}
    </ScreenWrapper>
  )
}

interface CaptureStepSummaryProps {
  step: CaptureStepConfig
  result: IdCaptureResult
  onPress: () => void
}

function CaptureStepSummary({ step, result, onPress }: CaptureStepSummaryProps) {
  const { colors } = useColors();
  const [loadFailed, setLoadFailed] = useState(false);

  return (
    <View className='gap-2'>
      <View className='flex-row items-center gap-2'>
        <Text className='text-base font-nunitoSemiBold text-foreground'>
          {step.label}:
        </Text>
        <IconCheck size={18} color={colors.primary} />
      </View>

      {loadFailed ? (
        <View className='w-full h-48 rounded-2xl border border-border items-center justify-center p-4'>
          <Text className='text-sm text-gray-500 font-inter text-center'>
            Photo couldn&apos;t load. Please use Retake ID Photos below.
          </Text>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${step.label} ID photo fullscreen`}
          onPress={onPress}
          className='w-full rounded-2xl border border-border overflow-hidden'
        >
          <Image
            source={{ uri: result.uri }}
            style={{ width: '100%', height: 192 }}
            contentFit="cover"
            accessibilityLabel={`${step.label} ID photo`}
            onError={() => setLoadFailed(true)}
          />
        </Pressable>
      )}
    </View>
  )
}
