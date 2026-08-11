import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useState } from 'react'

import { CloseButton, Button, Checkbox, ControlField, Label } from 'heroui-native'

import { IconChevronLeft } from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StepProgress from '@/components/display/StepProgress'
import UploadImageField from '@/components/inputs/UploadImageField';

import { useColors } from '@/hooks/useTheme'
import { useVerificationStore } from '@/stores/useVerificationStore'

export default function UploadId() {
  const router = useRouter();
  const { colors } = useColors();

  const selectedId = useVerificationStore((state) => state.selectedId);
  const frontImages = useVerificationStore((state) => state.frontImages);
  const backImages = useVerificationStore((state) => state.backImages);
  const setFrontImages = useVerificationStore((state) => state.setFrontImages);
  const setBackImages = useVerificationStore((state) => state.setBackImages);

  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const canContinue = frontImages.length > 0 && backImages.length > 0 && isConfirmed;

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

      {/* Upload Fields */}
      <View className='flex gap-5 mt-5'>
        {/* Front */}
        <UploadImageField
          label='Front of ID:'
          required
          images={frontImages}
          onAdd={(images) => {
            // Only allow one image for the front, so replace any existing image
            setFrontImages(Array.isArray(images) ? [images[0]] : [images]);
          }}
          onRemove={(url) => setFrontImages(frontImages.filter(img => img.uri !== url))}
        />

        {/* Back */}
        <UploadImageField
          label='Back of ID:'
          required
          images={backImages}
          onAdd={(images) => {
            // Only allow one image for the back, so replace any existing image
            setBackImages(Array.isArray(images) ? [images[0]] : [images]);
          }}
          onRemove={(url) => setBackImages(backImages.filter(img => img.uri !== url))}
        />
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
