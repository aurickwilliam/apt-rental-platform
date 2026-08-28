import { View, Text } from 'react-native'
import { Separator } from 'heroui-native'
import DateTimeField from '@/components/inputs/DateField'

export type CashPaymentErrors = {
  paymentDate?: string
}

export function validateCashPayment(data: {
  paymentDate: Date | null
}): CashPaymentErrors {
  const errors: CashPaymentErrors = {}

  if (!data.paymentDate) {
    errors.paymentDate = 'Payment date is required'
  } else {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selected = new Date(data.paymentDate)
    selected.setHours(0, 0, 0, 0)
    if (selected < today) {
      errors.paymentDate = 'Payment date cannot be in the past'
    }
  }

  return errors
}

interface CashPaymentFormProps {
  paymentDate: Date | null
  onPaymentDateChange: (date: Date) => void
  errors?: CashPaymentErrors
}

export default function CashPaymentForm({
  paymentDate,
  onPaymentDateChange,
  errors,
}: CashPaymentFormProps) {
  return (
    <View className='mt-5'>
      <Separator className='mb-5' />

      <Text className='text-foreground text-base font-nunitoSemiBold mb-1'>
        Cash Payment
      </Text>
      <Text className='text-muted font-inter text-sm'>
        Please prepare the exact amount of payment in cash and bring it to the property.
      </Text>

      <View className='mt-4 flex gap-3'>
        <Text className='text-muted text-sm font-inter'>
          After you have made the cash payment, kindly fill out the Cash Payment Confirmation Form to confirm your payment.
        </Text>

        <DateTimeField
          label='Payment Date:'
          placeholder='Select date of payment'
          value={paymentDate}
          onChange={onPaymentDateChange}
          error={errors?.paymentDate}
          required
        />
      </View>
    </View>
  )
}
