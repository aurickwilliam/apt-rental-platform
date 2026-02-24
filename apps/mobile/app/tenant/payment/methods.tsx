import { View, Text } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import PaymentMethodButton from '@/components/buttons/PaymentMethodButton'
import RadioButton from '@/components/buttons/RadioButton'

import { PAYMENT_METHOD_LOGOS } from '@/constants/images'

import { formatCurrency } from '@repo/utils'
import PillButton from '@/components/buttons/PillButton'
import { SafeAreaView } from 'react-native-safe-area-context'
import Divider from '@/components/display/Divider'
import TextField from '@/components/inputs/TextField'
import DateTimeField from '@/components/inputs/DateTimeField'

export default function Methods() {
  const router = useRouter();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'GCash' | 'Maya' | 'Debit/Credit-Card' | 'Cash' | null>(null);

  // Dummy data for total payment amount. This should be fetched from the backend based on the rent payment details.
  const totalPayment = 1200.00;

  // Handle Checkout button press
  const handleCheckout = () => {
    
  }

  return (
    <View className='flex-1'>
      <ScreenWrapper
        scrollable
        header={
          <StandardHeader title='Payment Methods' />
        }
        bottomPadding={100}
        className='p-5'
      >
        {/* Title */}
        <View className='flex'>
          <Text className='text-secondary text-lg font-poppinsMedium'>
            Choose Payment Method``
          </Text>

          <Text className='text-grey-500 text-base font-inter'>
            Select how you’d like to pay this month’s rent.
          </Text>
        </View>

        {/* Save Payment Methods */}
        <View className='flex mt-5'>
          <Text className='text-text text-lg font-interMedium'>
            Saved Payment Methods
          </Text>

          <View className='flex-row flex-wrap mt-3 gap-3 items-center'>
            <PaymentMethodButton imageSource={PAYMENT_METHOD_LOGOS.gcash} />
            <PaymentMethodButton imageSource={PAYMENT_METHOD_LOGOS.maya} />
            <PaymentMethodButton imageSource={PAYMENT_METHOD_LOGOS.visa} />
            <PaymentMethodButton imageSource={PAYMENT_METHOD_LOGOS.mastercard} />
          </View>
        </View>

        {/* Divider */}
        <View className="flex-row justify-center items-center mt-7 mb-7">
          <View className="flex-1 h-[1px] bg-grey-300 rounded-full mt-1" />

          <Text className="mx-3 text-grey-400 font-inter">
            or 
          </Text>

          <View className="flex-1 h-[1px] bg-grey-300 rounded-full mt-1" />
        </View>

        {/* Add New Payment Method */}
        <View className='flex gap-3'>
          <Text className='text-text text-base font-interMedium'>
            Add New Payment Method 
          </Text>

          <RadioButton 
            label={'GCash'} 
            onPress={() => setSelectedPaymentMethod('GCash')} 
            selected={selectedPaymentMethod === 'GCash'}            
          />

          <RadioButton 
            label={'Maya'} 
            onPress={() => setSelectedPaymentMethod('Maya')} 
            selected={selectedPaymentMethod === 'Maya'}            
          />

          <RadioButton 
            label={'Debit/Credit Card'} 
            onPress={() => setSelectedPaymentMethod('Debit/Credit-Card')} 
            selected={selectedPaymentMethod === 'Debit/Credit-Card'}            
          />

          <RadioButton 
            label={'Cash'} 
            onPress={() => setSelectedPaymentMethod('Cash')} 
            selected={selectedPaymentMethod === 'Cash'}            
          />
        </View>

        {/* If Debit/CreditCard */}
        {
          selectedPaymentMethod === 'Debit/Credit-Card' && (
            <>
              <Divider />

              <View className='flex gap-3'>
                {/* Card Number */}
                <TextField 
                  label='Card Number:'
                  placeholder='**** **** **** ****'
                  required
                />

                {/* Expiry Date */}
                <DateTimeField 
                  label='Expiry Date:'
                  placeholder='XX/XX'
                  required
                />

                {/* Card Name */}
                <TextField 
                  label='Cardholder Name:'
                  placeholder='Enter cardholder name'
                  required
                />

                {/* Card Verification Value */}
                <View>
                  <TextField 
                    label='CVV:'
                    placeholder='***'
                    isPassword
                    required
                  />

                  <Text className='text-grey-500 text-sm font-inter mt-1'>
                    3-digit code at the back of your card.
                  </Text>
                </View>
              </View>
            </>
          )
        }
      </ScreenWrapper>

      {/* Checkout Button */}
      <View className='absolute bottom-0 left-0 right-0 z-10 w-full p-5 border-t border-grey-300 bg-white'>
        <SafeAreaView edges={['bottom']} className='flex-row items-center justify-between'> 
          <View className='flex'>
            <Text className='text-grey-500 font-interMedium'>
              Total
            </Text>

            <Text className='text-primary text-3xl font-poppinsMedium'>
              ₱ {formatCurrency(totalPayment)}
            </Text>
          </View>

          <PillButton
            label='Checkout'
            width='w-48'
            onPress={handleCheckout}
          />
        </SafeAreaView>
      </View>
    </View>
  )
}