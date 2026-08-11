import { View, Text, Image } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'

import { Button } from 'heroui-native'

import { IMAGES } from 'constants/images'

export default function Index() {
  const router = useRouter();

  return (
    <ScreenWrapper
      className='p-5'
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
             Upload a valid ID and take a quick selfie to verify your identity and unlock all features.
          </Text>
        </View>
      </View>

      <Button onPress={() => router.push('/(auth)/verify-account/select-id')}>
        <Button.Label>Continue Verification</Button.Label>
      </Button>
    </ScreenWrapper>
  )
}
