import { View, Text } from 'react-native'

import DateTimeField from '@/components/inputs/DateTimeField'
import NumberField from '@/components/inputs/NumberField'
import TextField from '@/components/inputs/TextField'
import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import { useState } from 'react'
import PillButton from '@/components/buttons/PillButton'

type CardInformation = {
  cardNumber: string;
  expiryDate: Date;
  cardholderName: string;
  cvv: string;
  isCardNumberValid?: boolean; // Optional field to track card number validity
}

export default function CardForm() {

  const [cardInformation, setCardInformation] = useState<CardInformation>({
    cardNumber: '',
    expiryDate: new Date(),
    cardholderName: '',
    cvv: '',
    isCardNumberValid: false,
  })

  // TODO: create a use hook for this logic since it will be used in multiple places (add/edit card)
  // Handle credit card number validation and formatting
  const handleCardNumberChange = (value: string) => {
    // Keep only digits and limit to 19 digits (typical max PAN length)
    const digitsOnly = value.replace(/\D/g, '').slice(0, 19);

    // Format as groups of 4 digits separated by spaces (e.g., "1234 5678 9012 3456")
    const formatted = digitsOnly.replace(/(.{4})/g, '$1 ').trim();

    // Luhn algorithm check for card number validity
    const luhnCheck = (cardNumber: string): boolean => {
      let sum = 0;
      let shouldDouble = false;

      for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber.charAt(i), 10);
        if (Number.isNaN(digit)) {
          return false;
        }

        if (shouldDouble) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }

        sum += digit;
        shouldDouble = !shouldDouble;
      }

      return sum % 10 === 0;
    };

    // Perform Luhn validation when there are at least 13 digits
    const isValidLength = digitsOnly.length >= 13 && digitsOnly.length <= 19;
    const isLuhnValid = isValidLength ? luhnCheck(digitsOnly) : false;

    setCardInformation({
      ...cardInformation,
      cardNumber: formatted,
      isCardNumberValid: isLuhnValid,
    });
  }

  return (
    <ScreenWrapper
      className='p-5'
      header={
        <StandardHeader title='Add Card' />
      }
    >
      <View className='flex'>
        <Text className='text-text text-lg font-poppinsMedium'>
          Debit/Credit Card Form
        </Text>

        {/* Form */}
        <View className='mt-5 gap-3'>
          {/* Card Number */}
          <TextField 
            label='Card Number:'
            placeholder='**** **** **** ****'
            required
            value={cardInformation.cardNumber}
            maxLength={23}
            onChangeText={(value) => handleCardNumberChange(value)}
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
        </View>
      </View>

      <View className='flex-1' />

      <View className='flex gap-3 items-center'>
        <Text className='text-grey-500 text-sm font-inter'>
          Your card information is securely processed by PayMongo.
        </Text>

        <PillButton 
          label='Add Payment Method'
          isFullWidth
        />
      </View>
    </ScreenWrapper>
  )
}