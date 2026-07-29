import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import PillButton from '@/components/buttons/PillButton'
import StandardHeader from '@/components/layout/StandardHeader'

import { useColors } from '@/hooks/useTheme'

import { IconExclamationCircle } from '@tabler/icons-react-native'

export default function Failed() {
  const router = useRouter();
  const { colors } = useColors();

  const handleGoBackHome = () => {
    // Redirect to a stable screen instead of relying on navigation history,
    // to avoid returning to a potentially invalid payment state.
    router.replace('/tenant/payment');
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
          color={colors.danger}
          strokeWidth={2}
        />

        <Text className='text-danger text-center text-2xl font-interSemiBold mt-5'>
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
