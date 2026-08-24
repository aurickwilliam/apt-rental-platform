import { useRouter } from 'expo-router'
import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native'
import { IconWallet } from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import EmptyState from '@/components/display/EmptyState'
import { usePayouts, usePayoutBalances } from '@/hooks/payments'
import { formatPesoDisplay } from '@repo/utils'
import { useColors } from 'hooks/useTheme'
import PayoutHistoryCard from './components/PayoutHistoryCard'

export default function PayoutsIndex() {
  const router = useRouter()
  const { colors } = useColors()
  const { data, isLoading, error, refetch, isRefetching } = usePayouts()
  const balancesQ = usePayoutBalances()

  if (isLoading) {
    return (
      <ScreenWrapper header={<StandardHeader title="Payouts" />}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </ScreenWrapper>
    )
  }

  if (error) {
    return (
      <ScreenWrapper header={<StandardHeader title="Payouts" />}>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-foreground text-center">{String((error as Error).message)}</Text>
        </View>
      </ScreenWrapper>
    )
  }

  if (!data || data.length === 0) {
    return (
      <ScreenWrapper header={<StandardHeader title="Payouts" />}>
        <EmptyState
          icon={<IconWallet size={48} color={colors.primary} />}
          title="No payouts yet"
          description="When rent is paid via GCash/Maya/card/QR Ph, payouts auto-run daily 02:00 Manila to your default GCash."
        />
      </ScreenWrapper>
    )
  }

  return (
    <ScreenWrapper header={<StandardHeader title="Payouts" />}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-5 gap-4"
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/payouts/${item.id}` as never)}>
            <PayoutHistoryCard
              referenceNumber={item.reference_number}
              periodStart={item.period_start}
              periodEnd={item.period_end}
              amount={item.amount}
              netAmount={item.net_amount}
              fee={item.fee}
              status={item.status}
              destinationLabel={item.destination ? `${item.destination.type} • ${item.destination.account_number}` : undefined}
            />
          </Pressable>
        )}
        ListHeaderComponent={
          <View className="mb-4 gap-3">
            {balancesQ.data ? (
              <View className="flex-row gap-3">
                <View className="flex-1 border border-border rounded-2xl p-4">
                  <Text className="text-gray-500 text-xs font-inter">Available</Text>
                  <Text className="text-foreground font-nunitoBold text-lg">{formatPesoDisplay(balancesQ.data.available)}</Text>
                  <Text className="text-gray-500 text-[10px] font-inter">Min {formatPesoDisplay(balancesQ.data.minPayoutAmount)} Fee {formatPesoDisplay(balancesQ.data.transferFee)}</Text>
                </View>
                <View className="flex-1 border border-border rounded-2xl p-4">
                  <Text className="text-gray-500 text-xs font-inter">Upcoming</Text>
                  <Text className="text-foreground font-nunitoBold text-lg">{formatPesoDisplay(balancesQ.data.upcoming)}</Text>
                  <Text className="text-gray-500 text-[10px] font-inter">Clearing 2d/3d</Text>
                </View>
                <View className="flex-1 border border-border rounded-2xl p-4">
                  <Text className="text-gray-500 text-xs font-inter">In Transit</Text>
                  <Text className="text-foreground font-nunitoBold text-lg">{formatPesoDisplay(balancesQ.data.inTransit)}</Text>
                  <Text className="text-gray-500 text-[10px] font-inter">Processing</Text>
                </View>
              </View>
            ) : null}
            <Text className="text-gray-500 text-sm font-inter">
              Irene’s Housing exception: fee 0 / min 20 (indefinite, disable via is_active=false). Others 10 / 100.
            </Text>
          </View>
        }
      />
    </ScreenWrapper>
  )
}
