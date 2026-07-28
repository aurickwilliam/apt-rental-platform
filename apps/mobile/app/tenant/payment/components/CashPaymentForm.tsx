import { View, Text } from 'react-native'
import { useState } from 'react'
import { Separator, TextField, Input, Label } from 'heroui-native'
import DateTimeField from '@/components/inputs/DateField'
import { handlePesoChange } from '@repo/utils'

interface CashPaymentFormProps {
  amountPaid: string
  onAmountPaidChange: (value: string) => void
}

export default function CashPaymentForm({ amountPaid, onAmountPaidChange }: CashPaymentFormProps) {
  const [paymentDate, setPaymentDate] = useState(new Date())
  const displayAmount = amountPaid ? handlePesoChange(amountPaid).formatted : ''

  return (
    <View className='mt-5'>
      <Separator className='mb-5' />

      <Text className='text-foreground text-base font-interSemiBold mb-1'>
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
          onChange={setPaymentDate}
        />

        <TextField isRequired>
          <Label>Amount Paid:</Label>
          <Input
            placeholder='₱ 0.00'
            value={displayAmount}
            keyboardType='decimal-pad'
            variant='primary'
            onChangeText={(value) => {
              const { raw } = handlePesoChange(value)
              onAmountPaidChange(raw)
            }}
          />
        </TextField>
      </View>
    </View>
  )
}
