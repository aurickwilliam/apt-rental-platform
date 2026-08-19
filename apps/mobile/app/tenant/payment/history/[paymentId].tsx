import { View, Text, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Button } from 'heroui-native'
import { IconChevronLeft } from '@tabler/icons-react-native'

import { useColors } from '@/hooks/useTheme'
import { usePayment } from '@/hooks/payments'
import {
  formatReferenceId,
  methodLabel,
  paymentStatusLabel,
  periodMonthLabel,
} from '@/service/payments/paymentService'

import ReceiptCard from '../components/ReceiptCard'

export default function PaymentReceipt() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useColors();
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();

  const paymentQuery = usePayment(paymentId ?? null);
  const payment = paymentQuery.data;

  const paymentDate = payment
    ? new Date(`${payment.date.slice(0, 10)}T00:00:00`)
    : null;

  return (
    <View
      className='flex-1 bg-primary px-5'
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom
      }}
    >
      <View className='pt-2'>
        <Button
          onPress={() => router.back()}
          variant='ghost'
          isIconOnly
          className='bg-white/20 self-start'
        >
          <IconChevronLeft size={24} color='#FFFFFF' />
        </Button>
      </View>

      {paymentQuery.isLoading || !payment ? (
        <View className='flex-1 items-center justify-center gap-4'>
          {paymentQuery.error ? (
            <>
              <Text className='text-white text-base font-inter text-center'>
                We could not load this receipt.
              </Text>
              <Button
                onPress={() => { void paymentQuery.refetch() }}
                className='bg-white'
              >
                <Button.Label className='text-primary'>Try Again</Button.Label>
              </Button>
            </>
          ) : (
            <ActivityIndicator size='large' color='#FFFFFF' />
          )}
        </View>
      ) : (
        <View className='flex-1 justify-center'>
          <ReceiptCard
            apartmentName={payment.apartment_name ?? '—'}
            landlordName={payment.landlord_name ?? '—'}
            date={new Intl.DateTimeFormat('en-PH', { dateStyle: 'full' }).format(paymentDate)}
            time={new Intl.DateTimeFormat('en-PH', { timeStyle: 'short' }).format(new Date(payment.created_at))}
            method={methodLabel(payment.method)}
            amount={payment.amount ?? 0}
            referenceNumber={formatReferenceId(payment.reference_id)}
            status={paymentStatusLabel(payment.status)}
            periodLabel={
              payment.period_start
                ? `${periodMonthLabel(payment.period_start, payment.date)} ${payment.period_start.slice(0, 4)}`
                : undefined
            }
            backgroundColor={colors.primary}
          />
        </View>
      )}
    </View>
  )
}
