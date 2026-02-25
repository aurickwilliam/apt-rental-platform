import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'

import { IconPlus } from '@tabler/icons-react-native'

import { COLORS } from '@repo/constants'
import PaymentMethodCard from '@/components/display/PaymentMethodCard'

export default function Index() {
  const router = useRouter();

  // Dummy data
  const paymentMethods = [
    { id: 1, method: 'GCash', type: 'e-wallet', number: '09171234567', name: 'John Doe' },
    { id: 2, method: 'Maya', type: 'e-wallet', number: '09123456789', name: '@johndoe' },
    { id: 3, method: 'Visa', type: 'card', number: '**** **** **** 1234', name: 'John Doe', expireDate: '12/24' },
  ]

  return (
    <ScreenWrapper
      scrollable
      header={
        <StandardHeader 
          title='Payment Methods' 
          rightComponent={
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/tenant/payment/saved-methods/add')}
            >
              <IconPlus size={24} color={COLORS.white} />
            </TouchableOpacity>
          }
        />
      }
      className='p-5'
      backgroundColor={COLORS.darkerWhite}
    >
      {/* Description */}
      <View>
        <Text className='text-text text-base font-interMedium'>
          Manage your saved payment methods to make your rent payments faster and easier.
        </Text>
      </View>

      {/* Payment Methods */}
      <View className='mt-5 flex gap-3'>
        {
          paymentMethods.map((method) => (
            <PaymentMethodCard key={method.id} method={method} />
          ))
        }
      </View>
    </ScreenWrapper>
  )
}