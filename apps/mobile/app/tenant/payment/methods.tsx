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
import CheckBox from '@/components/buttons/CheckBox'
import NumberField from '@/components/inputs/NumberField'

type PaymentMethod = 'GCash' | 'Maya' | 'Debit/Credit-Card' | 'Cash';

type CardInformation = {
  cardNumber: string;
  expiryDate: Date;
  cardholderName: string;
  cvv: string;
  isPaymentSaved: boolean;
}

export default function Methods() {
  const router = useRouter();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [hasSavedPaymentMethod, setHasSavedPaymentMethod] = useState(false);

  const [cardInformation, setCardInformation] = useState<CardInformation>({
    cardNumber: '',
    expiryDate: new Date(),
    cardholderName: '',
    cvv: '',
    isPaymentSaved: false,
  })

  // Dummy data for total payment amount. This should be fetched from the backend based on the rent payment details.
  const totalPayment = 1200.00;

  // Handle Checkout button press
  const handleCheckout = () => {
    if (selectedPaymentMethod === 'GCash') {
      router.push('/tenant/payment/e-wallet-redirect?method=gcash');
      return;
    }
    else if (selectedPaymentMethod === 'Maya') {
      router.push('/tenant/payment/e-wallet-redirect?method=maya');
      return;
    }

    // TODO: Implement actual payment processing logic here. For now, we will just navigate to the success screen.
    // TODO: If payment fails, navigate to the failed screen instead.
    router.push('/tenant/payment/success');
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
            Choose Payment Method
          </Text>

          <Text className='text-grey-500 text-base font-inter'>
            Select how you’d like to pay this month’s rent.
          </Text>
        </View>

        {/* Save Payment Methods */}
        {
          hasSavedPaymentMethod && (
            <>
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
            </>
          )
        }

        {/* Add New Payment Method */}
        <View className={`flex gap-3 ${hasSavedPaymentMethod ? '' : 'mt-5'}`}>
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
                  value={cardInformation.cardNumber}
                  onChangeText={(value) => setCardInformation({...cardInformation, cardNumber: value})}
                />

                {/* Expiry Date */}
                <DateTimeField 
                  label='Expiry Date:'
                  placeholder='XX/XX'
                  required
                  value={cardInformation.expiryDate}
                  onChange={(value) => setCardInformation({...cardInformation, expiryDate: value})}
                />

                {/* Card Name */}
                <TextField 
                  label='Cardholder Name:'
                  placeholder='Enter cardholder name'
                  required
                  value={cardInformation.cardholderName}
                  onChangeText={(value) => setCardInformation({...cardInformation, cardholderName: value})}
                />

                {/* Card Verification Value */}
                <View>
                  <NumberField 
                    label='CVV:'
                    placeholder='***'
                    maxLength={3}
                    required
                    value={cardInformation.cvv}
                    onChange={(value) => setCardInformation({...cardInformation, cvv: value})}
                  />

                  <Text className='text-grey-500 text-sm font-inter mt-1'>
                    3-digit code at the back of your card.
                  </Text>
                </View>

                <CheckBox 
                  label={'Save this card for future use?'} 
                  selected={cardInformation.isPaymentSaved} 
                  onPress={() => setCardInformation({...cardInformation, isPaymentSaved: !cardInformation.isPaymentSaved})}                  
                />
              </View>
            </>
          )
        }

        {/* If the user select Cash Payment */}
        {
          selectedPaymentMethod === 'Cash' && (
            <>
              <Divider />

              <View>
                <Text className='text-text text-lg font-interMedium'>
                  Cash Payment Instructions:
                </Text>
                <Text className='text-grey-500 font-inter text-sm mt-1'>
                  Please prepare the exact amount of payment in cash and bring it to the property.
                </Text>

                <View className='mt-5 flex gap-3'>
                  <Text className='text-text text-sm font-inter'>
                    After you have made the cash payment, kindly fill out the Cash Payment Confirmation Form to confirm your payment.
                  </Text>

                  {/* Date of Payment */}
                  <DateTimeField 
                    label='Payment Date:'
                    placeholder='Select date of payment'
                  />

                  {/* Amount */}
                  <NumberField 
                    label='Amount Paid:'
                    placeholder='₱ 0.00'
                    allowDecimal
                  />

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
            label='Pay'
            width='w-48'
            onPress={handleCheckout}
          />
        </SafeAreaView>
      </View>
    </View>
  )
}