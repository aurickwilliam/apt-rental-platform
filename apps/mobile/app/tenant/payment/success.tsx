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
  // Deep links can deliver the param as string | string[] — normalize first.
  const { referenceId: rawReferenceId } = useLocalSearchParams<{
    referenceId?: string | string[];
  }>();
  const referenceId = Array.isArray(rawReferenceId)
    ? rawReferenceId[0]
    : (rawReferenceId ?? null);

  const paymentQuery = usePaymentByReference(referenceId, { pollWhilePending: true });
  const payment = paymentQuery.data;

  const isLoading =
    paymentQuery.isLoading ||
    (payment?.status === 'pending' && payment.method !== 'cash')

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
          <Text className='text-white text-lg font-nunitoSemiBold text-center'>
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

  if (isLoading) {
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

  // Fetched but no row matched the reference — never spin forever.
  if (!payment) {
    return (
      <View
        className='flex-1 bg-primary px-5'
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className='flex-1 items-center justify-center gap-4'>
          <Text className='text-white text-lg font-nunitoSemiBold text-center'>
            We could not find this payment.
          </Text>
          <Button onPress={handleGoHome} className='bg-white'>
            <Button.Label className='text-primary'>Go to Home</Button.Label>
          </Button>
        </View>
      </View>
    )
  }

  // DB date fields are nullable despite the client type — fall back to now
  // and render '—' for unparseable values instead of crashing the receipt.
  const fallbackIso = new Date().toISOString()
  const paymentDate = new Date(`${(payment.date ?? fallbackIso).slice(0, 10)}T00:00:00`)
  const created = payment.created_at ? new Date(payment.created_at) : new Date()
  const dateLabel = Number.isNaN(paymentDate.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en-PH', { dateStyle: 'full' }).format(paymentDate)
  const timeLabel = Number.isNaN(created.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en-PH', { timeStyle: 'short' }).format(created)
  const periodLabel = payment.period_start
    ? `${periodMonthLabel(payment.due_date ?? payment.period_start)}, ${payment.period_start.slice(0, 4)}`
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
          date={dateLabel}
          time={timeLabel}
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
