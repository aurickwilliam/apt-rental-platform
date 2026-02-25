import { View, Text, Image } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'

import { IMAGES} from '../../../constants/images'
import PillButton from '@/components/buttons/PillButton'

export default function Updated() {
  const router = useRouter();

  return (
    <ScreenWrapper 
      className='p-5'
    >
      <View className='flex-1 items-center justify-center gap-10'>
        <Image 
          source={IMAGES.lockReset}
          style={{ width: 200, height: 200 }}
          resizeMode='contain'
        />

        <View>
          <Text className='text-text text-3xl font-poppinsSemiBold text-center'>
            Password Updated
          </Text>

          <Text className='text-text text-lg font-inter mt-2 text-center'>
            Great! Your new password is ready to use.
          </Text>
        </View>
      </View>

      <PillButton 
        label={'Back to Sign In'}
        onPress={() => {
          router.replace('/(auth)/sign-in');
        }}
      />
    </ScreenWrapper>
  )
}