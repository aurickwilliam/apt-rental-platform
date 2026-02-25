import { View, Text, Image } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import PillButton from '@/components/buttons/PillButton'

import { SAMPLE_IMAGES } from '@/constants/images'

export default function UploadSelfie() {
  const router = useRouter();

  return (
    <ScreenWrapper
      className='p-5'
    >
      
      <View className='flex-1 items-center justify-center'>
        <Text className='text-3xl font-poppinsMedium text-center text-primary'>
          Take a Selfie
        </Text>

        <View className='rounded-full overflow-hidden size-64 mt-10 bg-gray-200 items-center justify-center border-8 border-greenHulk-200'>
          <Image 
            source={SAMPLE_IMAGES.sampleProfilePicture}
            style={{ width: '100%', height: '100%'}}
            resizeMode='cover'
          />
        </View>

        <Text className='text-text text-vase font-inter text-center mt-5 mx-20'>
          Ensure good lighting and remove any face coverings for a clear photo.
        </Text>
      </View>

      <PillButton 
        label='Verify Selfie'
        onPress={() => router.push('/verify-account/success')}
      />
    </ScreenWrapper>
  )
}