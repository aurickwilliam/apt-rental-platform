import { useMemo, useState } from 'react'
import { View, Text, SectionList, ActivityIndicator } from 'react-native'
import { Button } from 'heroui-native'
import { IconWallet } from '@tabler/icons-react-native'
import { useLocalSearchParams } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import ConfirmDialog from 'components/display/ConfirmDialog'
import { useColors } from 'hooks/useTheme'
import {
  useLandlordPayments,
  useLandlordPaymentConfirmation,
} from 'hooks/landlord'
import { methodLabel, periodMonthLabel } from '@/service/payments/paymentService'
import { formatPesoDisplay } from '@repo/utils'

import PaymentHistoryCard from './components/PaymentHistoryCard'

type FlatPayment = {
  id: string
  year: string
  month: string
  amount: number
  status: 'paid' | 'partial' | 'pending' | 'unpaid'
  method: string | null
  reference: string | null
  paidDate: string
  isFlipable: boolean
}

const toFlatPayment = (payment: {
  id: string
  date: string
  amount: number | null
  status: string
  method: string | null
  reference_id: string | null
  period_start: string | null
}): FlatPayment => {
  const sourceDate = payment.period_start ?? payment.date
  const date = new Date(`${payment.date.slice(0, 10)}T00:00:00`)
  const paidDate = Number.isNaN(date.getTime())
    ? payment.date
    : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
  return {
    id: payment.id,
    year: sourceDate.slice(0, 4),
    month: periodMonthLabel(payment.period_start, payment.date),
    amount: payment.amount ?? 0,
    status: payment.status as FlatPayment['status'],
    method: payment.method,
    reference: payment.reference_id,
    paidDate,
    isFlipable: payment.status === 'pending' && payment.method === 'cash',
  }
}

export default function PaymentHistoryScreen() {
  const { colors } = useColors()
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>()

  const paymentsQuery = useLandlordPayments(apartmentId)
  const confirmMutation = useLandlordPaymentConfirmation(apartmentId)
  const [pendingFlip, setPendingFlip] = useState<FlatPayment | null>(null)

  const payments = useMemo(
    () => (paymentsQuery.data ?? []).map(toFlatPayment),
    [paymentsQuery.data]
  )

  const sections = useMemo(() => {
    const yearMap = new Map<string, FlatPayment[]>()
    for (const payment of payments) {
      if (!yearMap.has(payment.year)) yearMap.set(payment.year, [])
      yearMap.get(payment.year)!.push(payment)
    }
    return [...yearMap.entries()]
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, data]) => ({ title: year, data }))
  }, [payments])

  const currentYear = String(new Date().getFullYear())

  const handleConfirmFlip = () => {
    if (!pendingFlip) return
    confirmMutation.mutate(pendingFlip.id, {
      onSettled: () => setPendingFlip(null),
    })
  }

  if (paymentsQuery.isLoading) {
    return (
      <ScreenWrapper header={<StandardHeader title='Payment History' />}>
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' />
        </View>
      </ScreenWrapper>
    )
  }

  if (paymentsQuery.error) {
    return (
      <ScreenWrapper header={<StandardHeader title='Payment History' />} className='p-5'>
        <View className='flex-1 items-center justify-center gap-4'>
          <Text className='text-foreground text-lg font-interSemiBold text-center'>
            We could not load the payment history.
          </Text>
          <Button onPress={() => { void paymentsQuery.refetch() }}>
            <Button.Label>Try Again</Button.Label>
          </Button>
        </View>
      </ScreenWrapper>
    )
  }

  return (
    <ScreenWrapper header={<StandardHeader title='Payment History' />}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 30,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <Text className='text-gray-500 text-sm font-inter pb-3'>
            Total: {payments.length}
          </Text>
        }
        renderSectionHeader={({ section }) => (
          <View className='bg-background pt-5 pb-3'>
            <Text
              className={
                section.title === currentYear
                  ? 'text-accent font-interSemiBold text-base'
                  : 'text-muted font-interSemiBold text-base'
              }
            >
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <PaymentHistoryCard
            month={item.month}
            year={item.year}
            amount={item.amount}
            paidDate={item.paidDate}
            status={item.status}
            method={item.method}
            reference={item.reference}
            onFlipPress={item.isFlipable ? () => setPendingFlip(item) : undefined}
            flipDisabled={confirmMutation.isPending}
          />
        )}
        ItemSeparatorComponent={() => <View className='h-3' />}
        ListEmptyComponent={
          <View className='items-center gap-4 py-20'>
            <IconWallet size={64} color={colors.primary} />
            <Text className='text-xl font-interSemiBold text-foreground'>
              No payments found
            </Text>
            <Text className='text-gray-400 text-base font-inter text-center px-8'>
              Payments for this unit will appear here.
            </Text>
          </View>
        }
      />

      <ConfirmDialog
        isOpen={pendingFlip !== null}
        onOpenChange={(open) => { if (!open) setPendingFlip(null) }}
        title='Mark as Paid'
        description={
          pendingFlip
            ? `Confirm the ${formatPesoDisplay(pendingFlip.amount)} ${methodLabel(pendingFlip.method)} payment for ${pendingFlip.month} ${pendingFlip.year}? This notifies the tenant that their payment was received.`
            : ''
        }
        confirmLabel='Confirm'
        confirmVariant='primary'
        onConfirm={handleConfirmFlip}
        isConfirmDisabled={confirmMutation.isPending}
        errorMessage={confirmMutation.isError ? confirmMutation.error?.message ?? 'Could not update payment.' : null}
      />
    </ScreenWrapper>
  )
}