import { View, Text, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Button } from 'heroui-native'

import { useColors } from '@/hooks/useTheme'
import { usePaymentByReference } from '@/hooks/payments'
import {
  formatReferenceId,
  methodLabel,
  paymentStatusLabel,
  periodMonthLabel,
} from '@/service/payments/paymentService'

import ReceiptCard from './components/ReceiptCard'

export default function Success() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useColors();
  const { referenceId } = useLocalSearchParams<{ referenceId: string }>();

  const paymentQuery = usePaymentByReference(referenceId ?? null, { pollWhilePending: true });
  const payment = paymentQuery.data;

  const isLoading =
    paymentQuery.isLoading ||
    (payment !== null &&
      payment.status === 'pending' &&
      payment.method !== 'cash')

  const handleGoHome = () => {
    router.replace('/(tabs)/(tenant)/rentals')
  }

  if (paymentQuery.error) {
    return (
      <View
        className='flex-1 bg-primary px-5'
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className='flex-1 items-center justify-center gap-4'>
          <Text className='text-white text-lg font-interSemiBold text-center'>
            We could not load your payment details.
          </Text>
          <Button
            onPress={() => { void paymentQuery.refetch() }}
            className='bg-white'
          >
            <Button.Label className='text-primary'>Try Again</Button.Label>
          </Button>
        </View>
      </View>
    )
  }

  if (isLoading || !payment) {
    return (
      <View
        className='flex-1 bg-primary px-5'
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className='flex-1 items-center justify-center gap-4'>
          <ActivityIndicator size='large' color='#FFFFFF' />
          <Text className='text-white text-base font-inter text-center'>
            {payment ? 'Confirming your payment…' : 'Loading your receipt…'}
          </Text>
        </View>
      </View>
    )
  }

  const paymentDate = new Date(`${payment.date.slice(0, 10)}T00:00:00`)
  const created = new Date(payment.created_at)
  const periodLabel = payment.period_start
    ? `${periodMonthLabel(payment.period_start, payment.date)} ${payment.period_start.slice(0, 4)}`
    : undefined

  return (
    <View
      className='flex-1 bg-primary px-5'
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom
      }}
    >
      <View className='flex-1 justify-center'>
        <ReceiptCard
          apartmentName={payment.apartment_name ?? '—'}
          landlordName={payment.landlord_name ?? '—'}
          date={new Intl.DateTimeFormat('en-PH', { dateStyle: 'full' }).format(paymentDate)}
          time={new Intl.DateTimeFormat('en-PH', { timeStyle: 'short' }).format(created)}
          method={methodLabel(payment.method)}
          amount={payment.amount ?? 0}
          referenceNumber={formatReferenceId(payment.reference_id)}
          status={paymentStatusLabel(payment.status)}
          periodLabel={periodLabel}
          backgroundColor={colors.primary}
        />
      </View>

      <View className='pb-4'>
        <Button
          onPress={handleGoHome}
          className='bg-white'
        >
          <Button.Label className='text-primary'>
            Go to Home
          </Button.Label>
        </Button>
      </View>
    </View>
  )
}
