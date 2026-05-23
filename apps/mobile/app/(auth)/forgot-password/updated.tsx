import { View, Text, Image } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'

import { IMAGES} from '../../../constants/images'

import { Button } from 'heroui-native';

export default function Updated() {
  const router = useRouter();

  return (
    <ScreenWrapper 
      className='p-5'
    >
      <View className='flex-1 items-center justify-center gap-10'>
        <Image 
          source={IMAGES.lockReset}
          style={{ width: 175, height: 175 }}
          resizeMode='contain'
        />

        <View>
          <Text className='text-primary text-2xl font-nunitoBold text-center'>
            Password Updated
          </Text>

          <Text className='text-text text-base font-inter mt-2 text-center'>
            Great! Your new password is ready to use.
          </Text>
        </View>
      </View>

      {/* Back to Sign In */}
      <Button onPress={() => {
        router.replace('/(auth)/sign-in');
      }}>
        <Button.Label>
          Back to Sign In
        </Button.Label>
      </Button>
    </ScreenWrapper>
  )
}