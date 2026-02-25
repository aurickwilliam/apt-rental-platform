import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import OptionButton from '@/components/buttons/OptionButton'

export default function Add() {
  const router = useRouter();

  const paymentMethodTypes = [
    'GCash',
    'Maya',
    'Debit/Credit Card'
  ]

  // Handle Option Press
  const handleOptionPress = (type: string) => {
    if (type === 'Debit/Credit Card') {
      router.push('/tenant/payment/saved-methods/card-form');
      return;
    }

    router.push(`/tenant/payment/saved-methods/e-wallet-redirect?method=${type}`);
  }

  return (
    <ScreenWrapper
      className='p-5'
      header={
        <StandardHeader title='Add Payment Method' />
      }
    >
      <View className='flex'>
        <Text className='text-text text-lg font-interMedium'>
          Select a payment method type to add. You can add credit/debit cards or link your e-wallet accounts for faster rent payments.
        </Text>

        <View className='mt-5 flex gap-3'>
          {
            paymentMethodTypes.map((type) => (
              <OptionButton 
                key={type}
                title={type} 
                onPress={() => handleOptionPress(type)}              
              />
            ))
          }
        </View>
      </View>
    </ScreenWrapper>
  )
}