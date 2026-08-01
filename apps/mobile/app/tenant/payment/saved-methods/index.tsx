import { useState } from 'react'
import { View, Text, TouchableOpacity, Image } from 'react-native'
import { useRouter } from 'expo-router'

import { Button } from 'heroui-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'

import { IconPlus } from '@tabler/icons-react-native'

import { EMPTY_STATE_IMAGES } from 'constants/images'
import { useColors } from '@/hooks/useTheme'
import PaymentMethodCard, { type PaymentMethod } from './components/PaymentMethodCard'

const INITIAL_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 1, method: 'GCash', type: 'e-wallet', number: '09171234567', name: 'John Doe' },
  { id: 2, method: 'Maya', type: 'e-wallet', number: '09123456789', name: '@johndoe' },
  { id: 3, method: 'Visa', type: 'card', number: '**** **** **** 1234', name: 'John Doe', expireDate: '12/24' },
]

export default function Index() {
  const router = useRouter();
  const { colors } = useColors();
  const [paymentMethods, setPaymentMethods] = useState(INITIAL_PAYMENT_METHODS);

  const handleDelete = (id: number) => {
    setPaymentMethods((prev) => prev.filter((method) => method.id !== id));
  }

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
              <IconPlus size={24} color='#FFFFFF' />
            </TouchableOpacity>
          }
        />
      }
      className='p-5'
      backgroundColor={colors.surface}
    >
      {/* Description */}
      <Text className='text-muted text-sm font-inter'>
        Manage your saved payment methods to make your rent payments faster and easier.
      </Text>

      {/* Payment Methods */}
      {paymentMethods.length === 0 ? (
        <View className='items-center gap-4 py-20'>
          <View className='aspect-square size-64'>
            <Image
              source={EMPTY_STATE_IMAGES.emptyPaymentMethods}
              style={{ width: '100%', height: '100%' }}
            />
          </View>

          <Text className='text-xl font-interSemiBold text-foreground'>
            No saved payment methods
          </Text>
          <Text className='text-gray-400 text-base font-inter text-center px-8'>
            Add a payment method to make your rent payments faster and easier.
          </Text>

          <Button
            variant='primary'
            size='sm'
            onPress={() => router.push('/tenant/payment/saved-methods/add')}
            className='w-56 mt-2'
          >
            <IconPlus size={18} color='#FFFFFF' />
            <Button.Label>Add Payment Method</Button.Label>
          </Button>
        </View>
      ) : (
        <View className='mt-5 flex gap-2.5'>
          {
            paymentMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                onDelete={() => handleDelete(method.id)}
              />
            ))
          }
        </View>
      )}
    </ScreenWrapper>
  )
}
