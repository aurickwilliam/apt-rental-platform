import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useState } from 'react'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import StepProgress from '@/components/display/StepProgress'
import UploadImageField from '@/components/inputs/UploadImageField';
import CheckBox from '@/components/buttons/CheckBox';
import PillButton from '@/components/buttons/PillButton'

import { useVerificationStore } from '@/stores/useVerificationStore'

export default function UploadId() {
  const router = useRouter();

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
      header={
        <StandardHeader title='Upload Your ID' />
      }
      scrollable
    >
      <StepProgress currentStep={2} totalSteps={4} />

      <View className='flex gap-2'>
        <Text className='text-2xl text-secondary font-interMedium'>
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
        <CheckBox 
          label={'I confirm that the information provided is true and the ID belongs to me.'} 
          selected={isConfirmed} 
          onPress={() => setIsConfirmed(!isConfirmed)}        
        />
      </View>

      <View className='mt-20'>
        <PillButton
          label='Continue to Selfie'
          isDisabled={!canContinue}
          onPress={() => router.push('/verify-account/upload-selfie')}
        />
      </View>
    </ScreenWrapper>
  )
}