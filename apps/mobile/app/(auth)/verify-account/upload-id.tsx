import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Image } from 'expo-image'

import { CloseButton, Button, Checkbox, ControlField, Label } from 'heroui-native'

import { IconChevronLeft, IconCamera, IconCheck } from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StepProgress from '@/components/display/StepProgress'

import { useColors } from '@/hooks/useTheme'
import { useVerificationStore } from '@/stores/useVerificationStore'
import { computeCanContinue, getCaptureProgress } from './utils/gating'
import { getCaptureSequence, type CaptureStepConfig } from './constants/captureSequences'
import type { IdCaptureResult } from '@/stores/useVerificationStore'

export default function UploadId() {
  const router = useRouter();
  const { colors } = useColors();

  const selectedId = useVerificationStore((state) => state.selectedId);
  const captures = useVerificationStore((state) => state.captures);

  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const sequence = getCaptureSequence(selectedId);
  const progress = getCaptureProgress(sequence, captures);
  const canContinue = computeCanContinue(sequence, captures, isConfirmed);

  const navigateToCapture = (stepId: string) => {
    router.push(`/(auth)/verify-account/live-capture?idType=${encodeURIComponent(selectedId ?? '')}&stepId=${encodeURIComponent(stepId)}`);
  };

  // Guard against landing here with no Selected_Id_Type — e.g. the camera's
  // close button just called reset() and the user is backing into this
  // screen. Redirect to select-id.tsx rather than rendering an empty
  // progress list (getCaptureSequence(null) resolves to []). Uses replace
  // so this stale screen doesn't remain in the back-stack.
  useEffect(() => {
    if (selectedId === null) {
      router.replace('/(auth)/verify-account/select-id');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Immediate camera entry (Req 1.1): on a fresh session for this
  // Selected_Id_Type (no captures made yet), forward straight to the first
  // Capture_Step's Live_Capture_Screen without requiring a tap. Keyed on
  // "captures is empty" rather than "progress.isComplete" so returning here
  // after completing some (but not all) steps does not re-trigger this.
  useEffect(() => {
    if (Object.keys(captures).length === 0 && sequence.length > 0) {
      navigateToCapture(sequence[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <ScreenWrapper
      className='p-5'
      scrollable
      footer={
        <Button
          isDisabled={!canContinue}
          onPress={() => router.push('/verify-account/upload-selfie')}
          className='mx-5'
        >
          <Button.Label>
            Continue to Selfie
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

      <StepProgress currentStep={2} totalSteps={4} stepName="Upload Your ID" />

      <View className='flex gap-2'>
        <Text className='text-2xl text-accent font-nunitoMedium'>
          {selectedId}
        </Text>
        <Text className='text-base text-gray-500 font-inter'>
          Use your camera to capture each required photo below.
        </Text>
      </View>

      <View className='flex gap-5 mt-5'>
        {progress.steps.map(({ step, result }) => (
          <CaptureStepRow
            key={step.id}
            step={step}
            result={result}
            onPress={() => navigateToCapture(step.id)}
          />
        ))}
      </View>

      <View className='mt-5'>
        <ControlField
          isSelected={isConfirmed}
          onSelectedChange={() => setIsConfirmed(!isConfirmed)}
        >
          <ControlField.Indicator>
            <Checkbox className='size-5 border border-border shadow-none' />
          </ControlField.Indicator>

          <Label>
            <Label.Text className='text-sm text-foreground font-interMedium leading-snug'>
              I confirm that the information provided is true and the ID belongs to me.
            </Label.Text>
          </Label>
        </ControlField>
      </View>

      <View className='mt-20'>

      </View>
    </ScreenWrapper>
  )
}

interface CaptureStepRowProps {
  step: CaptureStepConfig
  result: IdCaptureResult | null
  onPress: () => void
}

function CaptureStepRow({ step, result, onPress }: CaptureStepRowProps) {
  const { colors } = useColors();
  const isComplete = result !== null;

  return (
    <View className='gap-2'>
      <View className='flex-row items-center gap-2'>
        <Text className='text-base font-semibold text-foreground'>
          {step.label}:
        </Text>
        {isComplete && <IconCheck size={18} color={colors.primary} />}
      </View>

      <TouchableOpacity
        onPress={onPress}
        className='flex-row items-center gap-3 border-2 border-dashed rounded-2xl py-4.5 px-4 bg-surface border-border'
      >
        {isComplete ? (
          <Image
            source={{ uri: result.uri }}
            style={{ width: 56, height: 56, borderRadius: 8 }}
            contentFit="cover"
            cachePolicy="disk"
          />
        ) : (
          <IconCamera size={22} color={colors.primary} />
        )}

        <Text className='flex-1 text-sm font-medium text-foreground'>
          {isComplete ? 'Retake photo' : 'Capture with camera'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}
