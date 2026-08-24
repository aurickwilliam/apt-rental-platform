import { useLocalSearchParams } from 'expo-router'
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import { usePayout, usePayoutPayments } from '@/hooks/payments'
import { formatPesoDisplay, formatDate } from '@repo/utils'
import { payoutStatusLabel } from '@/service/payments/payoutService'

export default function PayoutDetail() {
  const { payoutId } = useLocalSearchParams<{ payoutId: string }>()
  const payoutQ = usePayout(payoutId ?? null)
  const paymentsQ = usePayoutPayments(payoutId ?? null)

  const payout = payoutQ.data

  if (payoutQ.isLoading) {
    return (
      <ScreenWrapper header={<StandardHeader title="Payout" />}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </ScreenWrapper>
    )
  }

  if (!payout) {
    return (
      <ScreenWrapper header={<StandardHeader title="Payout" />}>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-foreground">Payout not found.</Text>
        </View>
      </ScreenWrapper>
    )
  }

  return (
    <ScreenWrapper header={<StandardHeader title={payout.reference_number ?? 'Payout'} />}>
      <ScrollView contentContainerClassName="p-5 gap-5">
        <View className="gap-2">
          <Text className="text-accent font-nunitoSemiBold text-lg">Summary</Text>
          <View className="gap-1">
            <Text className="text-foreground font-inter">Status: {payoutStatusLabel(payout.status)}</Text>
            <Text className="text-foreground font-inter">Gross: {formatPesoDisplay(payout.amount ?? 0)}</Text>
            <Text className="text-foreground font-inter">Fee: {formatPesoDisplay(payout.fee ?? 0)}</Text>
            <Text className="text-foreground font-nunitoBold">Net: {formatPesoDisplay(payout.net_amount ?? 0)}</Text>
            <Text className="text-gray-500 font-inter text-sm">Ref: {payout.reference_number ?? '—'}</Text>
            <Text className="text-gray-500 font-inter text-sm">
              Period: {payout.period_start ?? '—'} – {payout.period_end ?? '—'}
            </Text>
            <Text className="text-gray-500 font-inter text-sm">
              Destination: {payout.destination ? `${payout.destination.type} ${payout.destination.account_number} (${payout.destination.account_name})` : '—'}
            </Text>
            {payout.paymongo_batch_id ? <Text className="text-gray-500 text-xs">Batch: {payout.paymongo_batch_id}</Text> : null}
            {payout.paymongo_transfer_id ? <Text className="text-gray-500 text-xs">Transfer: {payout.paymongo_transfer_id}</Text> : null}
            {payout.failure_reason ? <Text className="text-danger text-sm">{payout.failure_reason}</Text> : null}
            {payout.completed_at ? <Text className="text-gray-500 text-xs">Completed: {formatDate(payout.completed_at, 'short')}</Text> : null}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-accent font-nunitoSemiBold text-lg">Payments in this payout</Text>
          {paymentsQ.isLoading ? (
            <ActivityIndicator />
          ) : !paymentsQ.data || paymentsQ.data.length === 0 ? (
            <Text className="text-gray-500 font-inter text-sm">No payment rows linked (migrated payout or rolled-back claim).</Text>
          ) : (
            paymentsQ.data.map((row: any) => (
              <View key={row.id} className="border border-border rounded-2xl p-4 gap-1">
                <Text className="text-foreground font-nunitoSemiBold">{row.apartment?.name ?? '—'} — {formatPesoDisplay(row.amount ?? 0)}</Text>
                <Text className="text-gray-500 text-xs">
                  {row.period_start ?? '—'} • {row.method ?? '—'} • {row.status}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  )
}
