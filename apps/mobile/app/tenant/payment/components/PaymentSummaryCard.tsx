import { View, Text } from 'react-native'
import { Card, Separator } from 'heroui-native'
import { formatDate, formatPesoDisplay, type TenancyBill } from '@repo/utils'

interface PaymentSummaryCardProps {
  month: string
  year: string
  dueDate: string
  monthlyRent: number
  bill?: TenancyBill | null
}

export default function PaymentSummaryCard({
  month,
  year,
  dueDate,
  monthlyRent,
  bill,
}: PaymentSummaryCardProps) {
  return (
    <Card className='shadow-none rounded-3xl my-5'>
      <Card.Header>
        <Text className='text-accent text-lg font-nunitoSemiBold'>
          {bill?.kind === 'move_in' ? 'Move-in Payment' : 'Payment Summary'}
        </Text>
      </Card.Header>

      <Card.Body className='mb-5'>
        <View className='flex gap-2 mt-3'>
          <View className='flex-row justify-between items-center'>
            <Text className='text-sm text-foreground font-inter'>Billing Period</Text>
            <Text className='text-sm text-foreground font-inter'>
              {month}, {year}
            </Text>
          </View>

          <View className='flex-row justify-between items-center'>
            <Text className='text-sm text-foreground font-inter'>Due Date</Text>
            <Text className='text-sm text-foreground font-inter'>
              {formatDate(dueDate, "short")}
            </Text>
          </View>

          <View className='flex-row justify-between items-center'>
            <Text className='text-sm text-foreground font-inter'>{bill?.kind === 'move_in' ? 'First month’s rent' : 'Rent due'}</Text>
            <Text className='text-sm text-foreground font-inter'>
              {formatPesoDisplay(bill?.rentDue ?? monthlyRent)}
            </Text>
          </View>

          {bill?.kind === 'move_in' ? <>
            <Text className='text-sm text-muted font-inter'>Move-in month billed in full; no prorating.</Text>
            <View className='flex-row justify-between gap-3'>
              <Text className='text-sm text-foreground font-inter'>Security deposit</Text>
              <Text className='text-sm text-foreground font-nunitoSemiBold'>{formatPesoDisplay(bill.securityDeposit)}</Text>
            </View>
            <View className='flex-row justify-between gap-3'>
              <Text className='text-sm text-foreground font-inter'>Advance rent — month 2</Text>
              <Text className='text-sm text-foreground font-nunitoSemiBold'>{formatPesoDisplay(bill.advanceRent)}</Text>
            </View>
            <Text className='text-sm text-muted font-inter'>The deposit is held separately, not used as rent. {bill.advancePeriodStart ? `Advance covers ${formatDate(bill.advancePeriodStart, 'short')} – ${formatDate(bill.advancePeriodEnd!, 'short')}, once confirmed.` : 'No advance rent is included.'}</Text>
          </> : null}
          {bill?.coveredByAdvance ? <Text className='text-sm text-muted font-inter'>Month 2 rent is covered by your advance payment.</Text> : null}
          {bill?.fees.map((fee) => <View key={fee.id} className='flex-row justify-between gap-3'>
            <Text className='text-sm text-foreground font-inter'>{fee.title}</Text>
            <Text className='text-sm text-foreground font-nunitoSemiBold'>{formatPesoDisplay(fee.amount)}</Text>
          </View>)}

          <Separator className='my-3' />
        </View>
      </Card.Body>

      <Card.Footer>
        <View className='flex-row justify-between items-center mt-2'>
          <Text className='text-sm text-accent font-nunitoSemiBold'>Total Payment</Text>
          <Text className='text-sm text-accent font-nunitoSemiBold'>
            {formatPesoDisplay(bill?.totalDue ?? monthlyRent)}
          </Text>
        </View>
      </Card.Footer>
    </Card>
  )
}
