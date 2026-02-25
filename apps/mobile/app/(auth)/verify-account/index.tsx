import { View, Text, Image } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import PillButton from '@/components/buttons/PillButton'

import { IMAGES } from 'constants/images'

export default function Index() {
  const router = useRouter();

  return (
    <ScreenWrapper
      className='p-5'
      header={
        <StandardHeader title='Verify Account' />
      }
    >
      <View className='flex-1 items-center justify-center'>
        <Image 
          source={IMAGES.shield} 
          className='size-60' 
        />

        <View className='flex mt-5 gap-3'>
          <Text className='text-lg font-interMedium text-center'>
            Help us keep our community safe.
          </Text>

          <Text className='text-base font-inter text-center'>
             Upload a valid ID and take a quick selfie to verify your identity and unlock all tenant features.
          </Text>
        </View>
      </View>

      <PillButton 
        label='Continue Verification'
        onPress={() => router.push('/(auth)/verify-account/select-id')}
      />
    </ScreenWrapper>
  )
}