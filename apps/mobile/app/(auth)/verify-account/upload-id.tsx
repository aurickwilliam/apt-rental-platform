import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Image } from 'expo-image'

import { CloseButton, Button, Checkbox, ControlField, Label } from 'heroui-native'

import { IconChevronLeft, IconCamera } from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StepProgress from '@/components/display/StepProgress'
import UploadDocumentField from '@/components/inputs/UploadDocumentField'
import DocumentFormatSelector from './components/DocumentFormatSelector'

import { useColors } from '@/hooks/useTheme'
import { useVerificationStore, type IdCaptureResult } from '@/stores/useVerificationStore'
import { applyFormatSwitchClearing, computeCanContinue } from './utils/gating'
import type { UploadedDocument } from '@/components/inputs/UploadDocumentField'

const DIGITAL_ACCEPTED_FILE_MIME_TYPES = ['application/pdf']

/**
 * Narrows an IdCaptureResult (front/back result) to the value type
 * UploadDocumentField accepts. Safe by construction while
 * documentFormat === 'digital': the Format/Result Invariant (enforced by
 * applyFormatSwitchClearing, see utils/gating.ts) guarantees a 'camera'-kind
 * result is cleared before this branch renders, so this narrowing never
 * silently drops a 'camera'-kind result the tenant is relying on.
 */
function toUploadedDocument(result: IdCaptureResult | null): UploadedDocument | null {
  if (result === null || result.kind === 'camera') return null;
  return result;
}

export default function UploadId() {
  const router = useRouter();
  const { colors } = useColors();

  const selectedId = useVerificationStore((state) => state.selectedId);
  const documentFormat = useVerificationStore((state) => state.documentFormat);
  const frontResult = useVerificationStore((state) => state.frontResult);
  const backResult = useVerificationStore((state) => state.backResult);
  const setDocumentFormat = useVerificationStore((state) => state.setDocumentFormat);
  const setFrontResult = useVerificationStore((state) => state.setFrontResult);
  const setBackResult = useVerificationStore((state) => state.setBackResult);

  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const canContinue = computeCanContinue(frontResult, backResult, isConfirmed);

  const handleFormatSelect = (format: 'physical' | 'digital') => {
    setDocumentFormat(format);
    setFrontResult(applyFormatSwitchClearing(frontResult, format));
    setBackResult(applyFormatSwitchClearing(backResult, format));
  };

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
          Accepted formats: JPG, PNG, or PDF (max 5MB each)
        </Text>
      </View>

      {/* Document Format Selector */}
      <View className='mt-5'>
        <DocumentFormatSelector value={documentFormat} onSelect={handleFormatSelect} />
      </View>

      {/* Capture / Upload Fields */}
      {documentFormat === 'physical' && (
        <View className='flex gap-5 mt-5'>
          <CaptureEntryCard
            label='Front of ID:'
            result={frontResult}
            onPress={() => router.push('/(auth)/verify-account/live-capture?field=front')}
          />
          <CaptureEntryCard
            label='Back of ID:'
            result={backResult}
            onPress={() => router.push('/(auth)/verify-account/live-capture?field=back')}
          />
        </View>
      )}

      {documentFormat === 'digital' && (
        <View className='flex gap-5 mt-5'>
          <UploadDocumentField
            label='Front of ID:'
            required
            value={toUploadedDocument(frontResult)}
            onChange={setFrontResult}
            acceptedFileMimeTypes={DIGITAL_ACCEPTED_FILE_MIME_TYPES}
          />

          <UploadDocumentField
            label='Back of ID:'
            required
            value={toUploadedDocument(backResult)}
            onChange={setBackResult}
            acceptedFileMimeTypes={DIGITAL_ACCEPTED_FILE_MIME_TYPES}
          />
        </View>
      )}

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

interface CaptureEntryCardProps {
  label: string
  result: IdCaptureResult | null
  onPress: () => void
}

function CaptureEntryCard({ label, result, onPress }: CaptureEntryCardProps) {
  const { colors } = useColors();
  const thumbnailUri = result?.kind === 'camera' ? result.asset.uri : null;

  return (
    <View className='gap-2'>
      <Text className='text-base font-semibold text-foreground'>
        {label}
      </Text>

      <TouchableOpacity
        onPress={onPress}
        className='flex-row items-center gap-3 border-2 border-dashed rounded-2xl py-4.5 px-4 bg-surface border-border'
      >
        {thumbnailUri ? (
          <Image
            source={{ uri: thumbnailUri }}
            style={{ width: 56, height: 56, borderRadius: 8 }}
            contentFit="cover"
            cachePolicy="disk"
          />
        ) : (
          <IconCamera size={22} color={colors.primary} />
        )}

        <Text className='flex-1 text-sm font-medium text-foreground'>
          {thumbnailUri ? 'Retake photo' : 'Capture with camera'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}
