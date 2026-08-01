import { View, Text } from 'react-native'
import {
  Separator,
  TextField,
  Input,
  Label,
  FieldError,
  Description,
  Checkbox,
  ControlField
} from 'heroui-native'

import {
  validateCardNumber,
  formatExpiryDate,
  type CardFormErrors
} from '@repo/utils'

export type CardInformation = {
  cardNumber: string
  expiryDate: string
  cardholderName: string
  cvv: string
  isPaymentSaved: boolean
  isCardNumberValid?: boolean
}

interface CardPaymentFormProps {
  value: CardInformation
  onChange: (patch: Partial<CardInformation>) => void
  errors?: CardFormErrors
}

export default function CardPaymentForm({
  value,
  onChange,
  errors
}: CardPaymentFormProps) {
  const handleCardNumberChange = (text: string) => {
    const { formatted, isValid } = validateCardNumber(text)
    onChange({ cardNumber: formatted, isCardNumberValid: isValid });
  }

  const handleExpiryDateChange = (text: string) => {
    onChange({ expiryDate: formatExpiryDate(text) });
  }

  return (
    <View className='mt-5'>
      <Separator className='mb-5' />

      <Text className='text-foreground text-base font-interSemiBold mb-3'>
        Card Details
      </Text>

      <View className='flex gap-3'>
        <TextField
          isRequired
          isInvalid={!!errors?.cardNumber || (value.cardNumber.length >= 13 && !value.isCardNumberValid)}
        >
          <Label>Card Number:</Label>
          <Input
            placeholder='**** **** **** ****'
            value={value.cardNumber}
            maxLength={23}
            keyboardType='number-pad'
            variant='primary'
            onChangeText={handleCardNumberChange}
          />
          {errors?.cardNumber
            ? <FieldError>{errors.cardNumber}</FieldError>
            : value.cardNumber.length > 0 && !value.isCardNumberValid && (
              <FieldError>Please enter a valid card number.</FieldError>
            )}
        </TextField>

        <TextField isRequired isInvalid={!!errors?.expiryDate}>
          <Label>Expiry Date:</Label>
          <Input
            placeholder='MM/YY'
            value={value.expiryDate}
            maxLength={5}
            keyboardType='number-pad'
            variant='primary'
            onChangeText={handleExpiryDateChange}
          />
          {errors?.expiryDate && (
            <FieldError>{errors.expiryDate}</FieldError>
          )}
        </TextField>

        <TextField isRequired isInvalid={!!errors?.cardholderName}>
          <Label>Cardholder Name:</Label>
          <Input
            placeholder='Enter cardholder name'
            value={value.cardholderName}
            variant='primary'
            onChangeText={(val) => onChange({ cardholderName: val })}
          />
          {errors?.cardholderName && (
            <FieldError>{errors.cardholderName}</FieldError>
          )}
        </TextField>

        <TextField isRequired isInvalid={!!errors?.cvv}>
          <Label>CVV:</Label>
          <Input
            placeholder='***'
            value={value.cvv}
            maxLength={3}
            keyboardType='number-pad'
            variant='primary'
            onChangeText={(val) => onChange({ cvv: val.replace(/\D/g, '').slice(0, 3) })}
          />
          {errors?.cvv && (
            <FieldError>{errors.cvv}</FieldError>
          )}
          <Description>
            3-digit code at the back of your card.
          </Description>
        </TextField>

        {/* Checkbox for saving the card payment method */}
        <ControlField
          isSelected={value.isPaymentSaved}
          onSelectedChange={() => onChange({ isPaymentSaved: !value.isPaymentSaved })}
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
  )
}
