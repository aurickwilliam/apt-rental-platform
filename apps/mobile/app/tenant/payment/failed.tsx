import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import PillButton from '@/components/buttons/PillButton'
import StandardHeader from '@/components/layout/StandardHeader'

import { COLORS } from '@repo/constants'

import { IconExclamationCircle } from '@tabler/icons-react-native'

export default function Failed() {
  const router = useRouter();

  const handleGoBackHome = () => {
    router.back();
  }

  // TODO: Add a text for the reason of payment failure if available (e.g. insufficient funds, network error, etc.)

  return (
    <ScreenWrapper
      className='p-5'
      header={
        <StandardHeader title='Payment Failed' />
      }
    >
      <View className='flex-1 items-center justify-center gap-3'>
        <IconExclamationCircle 
          size={150} 
          color={COLORS.redHead} 
          strokeWidth={2}
        />

        <Text className='text-redHead-200 text-center text-2xl font-poppinsSemiBold mt-5'>
          Payment Failed!
        </Text>
      </View>

      <PillButton 
        label='Go back'
        isFullWidth
        type='danger'
        onPress={handleGoBackHome}
      />
    </ScreenWrapper>
  )
}