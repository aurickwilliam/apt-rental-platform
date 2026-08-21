import { View, Text } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'

import {
  Button,
  Checkbox,
  ControlField,
  Description,
  FieldError,
  Input,
  Label,
  Separator,
  TextField,
} from 'heroui-native'

import {
  formatExpiryDate,
  validateCardInfo,
  validateCardNumber,
  type CardFormErrors,
} from '@repo/utils'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'

import { type CardInformation } from '../components/CardPaymentForm'

const INITIAL_CARD: CardInformation = {
  cardNumber: '',
  expiryDate: '',
  cardholderName: '',
  cvv: '',
  isPaymentSaved: false,
  isCardNumberValid: false,
}

export default function CardForm() {
  const router = useRouter();

  const [cardInformation, setCardInformation] = useState<CardInformation>(INITIAL_CARD)
  const [cardErrors, setCardErrors] = useState<CardFormErrors>({})

  const handleCardInformationChange = (patch: Partial<CardInformation>) => {
    setCardInformation((prev) => ({ ...prev, ...patch }))
    setCardErrors({})
  }

  const handleCardNumberChange = (text: string) => {
    const { formatted, isValid } = validateCardNumber(text)
    handleCardInformationChange({ cardNumber: formatted, isCardNumberValid: isValid })
  }

  const handleExpiryDateChange = (text: string) => {
    handleCardInformationChange({ expiryDate: formatExpiryDate(text) })
  }

  const handleAddCard = () => {
    const errors = validateCardInfo(cardInformation)
    if (Object.keys(errors).length > 0) {
      setCardErrors(errors)
      return
    }

    router.back()
  }

  return (
    <ScreenWrapper
      scrollable
      header={
        <StandardHeader title='Add Card' />
      }
      footer={
        <View className='p-5 gap-3 items-center'>
          <Text className='text-gray-500 text-sm font-inter'>
            Your card information is securely processed by PayMongo.
          </Text>

          <Button
            variant='primary'
            size='md'
            onPress={handleAddCard}
            className='w-full'
          >
            <Button.Label>
              Add Payment Method
            </Button.Label>
          </Button>
        </View>
      }
    >
      <View className='p-5'>
        <Text className='text-foreground text-lg font-nunitoSemiBold'>
          Debit/Credit Card Form
        </Text>

        <Separator className='my-5' />

        <Text className='text-foreground text-base font-nunitoSemiBold mb-3'>
          Card Details:
        </Text>

        <View className='flex gap-3'>
          <TextField
            isRequired
            isInvalid={!!cardErrors?.cardNumber || (cardInformation.cardNumber.length >= 13 && !cardInformation.isCardNumberValid)}
          >
            <Label>Card Number:</Label>
            <Input
              placeholder='**** **** **** ****'
              value={cardInformation.cardNumber}
              maxLength={23}
              keyboardType='number-pad'
              variant='primary'
              onChangeText={handleCardNumberChange}
            />
            {cardErrors?.cardNumber
              ? <FieldError>{cardErrors.cardNumber}</FieldError>
              : cardInformation.cardNumber.length > 0 && !cardInformation.isCardNumberValid && (
                <FieldError>Please enter a valid card number.</FieldError>
              )}
          </TextField>

          <TextField isRequired isInvalid={!!cardErrors?.expiryDate}>
            <Label>Expiry Date:</Label>
            <Input
              placeholder='MM/YY'
              value={cardInformation.expiryDate}
              maxLength={5}
              keyboardType='number-pad'
              variant='primary'
              onChangeText={handleExpiryDateChange}
            />
            {cardErrors?.expiryDate && (
              <FieldError>{cardErrors.expiryDate}</FieldError>
            )}
          </TextField>

          <TextField isRequired isInvalid={!!cardErrors?.cardholderName}>
            <Label>Cardholder Name:</Label>
            <Input
              placeholder='Enter cardholder name'
              value={cardInformation.cardholderName}
              variant='primary'
              onChangeText={(val) => handleCardInformationChange({ cardholderName: val })}
            />
            {cardErrors?.cardholderName && (
              <FieldError>{cardErrors.cardholderName}</FieldError>
            )}
          </TextField>

          <TextField isRequired isInvalid={!!cardErrors?.cvv}>
            <Label>CVV:</Label>
            <Input
              placeholder='***'
              value={cardInformation.cvv}
              maxLength={3}
              keyboardType='number-pad'
              variant='primary'
              onChangeText={(val) => handleCardInformationChange({ cvv: val.replace(/\D/g, '').slice(0, 3) })}
            />
            {cardErrors?.cvv && (
              <FieldError>{cardErrors.cvv}</FieldError>
            )}
            <Description>
              3-digit code at the back of your card.
            </Description>
          </TextField>

          {/* Checkbox for saving the card payment method */}
          <ControlField
            isSelected={cardInformation.isPaymentSaved}
            onSelectedChange={() => handleCardInformationChange({ isPaymentSaved: !cardInformation.isPaymentSaved })}
            className='mt-5'
          >
            <ControlField.Indicator>
              <Checkbox className="size-5 border border-border shadow-none" />
            </ControlField.Indicator>
            <Label>
              <Label.Text className="text-sm text-foreground font-inter">
                Save this card for future use?
              </Label.Text>
            </Label>
          </ControlField>
        </View>
      </View>
    </ScreenWrapper>
  )
}
