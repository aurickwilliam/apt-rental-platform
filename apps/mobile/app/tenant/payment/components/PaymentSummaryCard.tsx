import { View, Text } from 'react-native'
import { Card, Separator } from 'heroui-native'
import { formatDate, formatPesoDisplay } from '@repo/utils'

interface PaymentSummaryCardProps {
  month: string
  year: string
  dueDate: string
  monthlyRent: number
  paidAmount: number
  totalPayment: number
}

export default function PaymentSummaryCard({
  month,
  year,
  dueDate,
  monthlyRent,
  paidAmount,
  totalPayment,
}: PaymentSummaryCardProps) {
  return (
    <Card className='shadow-none rounded-3xl my-5'>
      <Card.Header>
        <Text className='text-accent text-lg font-nunitoSemiBold'>
          Payment Summary
        </Text>
      </Card.Header>

      <Card.Body className='mb-5'>
        <View className='flex gap-2 mt-3'>
          <View className='flex-row justify-between items-center'>
            <Text className='text-sm text-foreground font-inter'>Month & Year</Text>
            <Text className='text-sm text-foreground font-inter'>
              {month} {year}
            </Text>
          </View>

          <View className='flex-row justify-between items-center'>
            <Text className='text-sm text-foreground font-inter'>Due Date</Text>
            <Text className='text-sm text-foreground font-inter'>
              {formatDate(dueDate, "short")}
            </Text>
          </View>

          <View className='flex-row justify-between items-center'>
            <Text className='text-sm text-foreground font-inter'>Monthly Rent</Text>
            <Text className='text-sm text-foreground font-inter'>
              {formatPesoDisplay(monthlyRent)}
            </Text>
          </View>

          <View className='flex-row justify-between items-center'>
            <Text className='text-sm text-foreground font-inter'>Paid</Text>
            <Text className='text-sm text-foreground font-inter'>
              {formatPesoDisplay(paidAmount)}
            </Text>
          </View>

          <Separator className='my-3' />

          <View className='flex-row justify-between items-center'>
            <Text className='text-sm text-foreground font-inter'>Balance Left</Text>
            <Text className='text-sm text-foreground font-inter'>
              {formatPesoDisplay(totalPayment)}
            </Text>
          </View>
        </View>
      </Card.Body>

      <Card.Footer>
        <View className='flex-row justify-between items-center mt-2'>
          <Text className='text-sm text-accent font-nunitoSemiBold'>Total Payment</Text>
          <Text className='text-sm text-accent font-nunitoSemiBold'>
            {formatPesoDisplay(totalPayment)}
          </Text>
        </View>
      </Card.Footer>
    </Card>
  )
}
