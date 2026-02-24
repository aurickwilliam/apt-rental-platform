import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'

import { COLORS } from '@repo/constants'

import { IconConfetti } from '@tabler/icons-react-native'
import PillButton from '@/components/buttons/PillButton'

export default function Success() {
  const router = useRouter();

  const handleGoBackHome = () => {
    router.replace('/(tabs)/(tenant)/home');
  }

  return (
    <ScreenWrapper
      className='p-5'
    >
      <View className='flex-1 items-center justify-center gap-3'>
        <IconConfetti 
          size={150} 
          color={COLORS.greenHulk} 
          strokeWidth={2}
        />

        <Text className='text-greenHulk-200 text-center text-2xl font-poppinsSemiBold mt-5'>
          Payment Successful!
        </Text>
      </View>

      <PillButton 
        label='Go back home'
        isFullWidth
        onPress={handleGoBackHome}
      />
    </ScreenWrapper>
  )
}