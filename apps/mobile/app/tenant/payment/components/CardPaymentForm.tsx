import { View, Text } from 'react-native'
import { Separator, TextField, Input, Label, FieldError, Description, Checkbox, ControlField } from 'heroui-native'
import DateTimeField from '@/components/inputs/DateField'

export type CardInformation = {
  cardNumber: string
  expiryDate: Date
  cardholderName: string
  cvv: string
  isPaymentSaved: boolean
  isCardNumberValid?: boolean
}

interface CardPaymentFormProps {
  value: CardInformation
  onChange: (patch: Partial<CardInformation>) => void
}

export default function CardPaymentForm({ value, onChange }: CardPaymentFormProps) {
  const handleCardNumberChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '').slice(0, 19)
    const formatted = digitsOnly.replace(/(.{4})/g, '$1 ').trim()

    const luhnCheck = (cardNumber: string): boolean => {
      let sum = 0
      let shouldDouble = false

      for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber.charAt(i), 10)
        if (Number.isNaN(digit)) {
          return false
        }

        if (shouldDouble) {
          digit *= 2
          if (digit > 9) {
            digit -= 9
          }
        }

        sum += digit
        shouldDouble = !shouldDouble
      }

      return sum % 10 === 0
    }

    const isValidLength = digitsOnly.length >= 13 && digitsOnly.length <= 19
    const isLuhnValid = isValidLength ? luhnCheck(digitsOnly) : false

    onChange({
      cardNumber: formatted,
      isCardNumberValid: isLuhnValid,
    })
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
          isInvalid={value.cardNumber.length > 0 && !value.isCardNumberValid}
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
          {value.cardNumber.length > 0 && !value.isCardNumberValid && (
            <FieldError>Please enter a valid card number.</FieldError>
          )}
        </TextField>

        <DateTimeField
          label='Expiry Date:'
          placeholder='XX/XX'
          required
          value={value.expiryDate}
          onChange={(date) => onChange({ expiryDate: date })}
        />

        <TextField isRequired>
          <Label>Cardholder Name:</Label>
          <Input
            placeholder='Enter cardholder name'
            value={value.cardholderName}
            variant='primary'
            onChangeText={(val) => onChange({ cardholderName: val })}
          />
          <FieldError>Cardholder name is required.</FieldError>
        </TextField>

        <TextField isRequired>
          <Label>CVV:</Label>
          <Input
            placeholder='***'
            value={value.cvv}
            maxLength={3}
            keyboardType='number-pad'
            variant='primary'
            onChangeText={(val) => onChange({ cvv: val.replace(/\D/g, '').slice(0, 3) })}
          />
          <Description>
            3-digit code at the back of your card.
          </Description>
        </TextField>

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
