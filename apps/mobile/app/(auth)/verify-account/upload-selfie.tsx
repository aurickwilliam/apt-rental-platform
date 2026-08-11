import { View, Text, Image } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StepProgress from '@/components/display/StepProgress'

import { Button } from 'heroui-native'

import { SAMPLE_IMAGES } from '@/constants/images'

export default function UploadSelfie() {
  const router = useRouter();

  return (
    <ScreenWrapper
      className='p-5'
    >
      <StepProgress currentStep={3} totalSteps={4} stepName="Take a Selfie" />

      <View className='flex-1 items-center justify-center'>
        <View className='rounded-full overflow-hidden size-64 mt-10 bg-gray-200 items-center justify-center border-8 border-success'>
          <Image 
            source={SAMPLE_IMAGES.sampleProfilePicture}
            style={{ width: '100%', height: '100%'}}
            resizeMode='cover'
          />
        </View>

        <Text className='text-foreground text-muted font-inter text-center mt-5 mx-20'>
          Ensure good lighting and remove any face coverings for a clear photo.
        </Text>
      </View>

      <Button onPress={() => router.push('/verify-account/success')}>
        <Button.Label>Submit Verification</Button.Label>
      </Button>
    </ScreenWrapper>
  )
}