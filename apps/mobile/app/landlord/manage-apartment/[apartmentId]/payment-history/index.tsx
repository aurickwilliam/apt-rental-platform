import { useMemo, useState } from 'react'
import { View, Text, SectionList, ActivityIndicator } from 'react-native'
import { Button } from 'heroui-native'
import { IconFilter2, IconWallet } from '@tabler/icons-react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import { useColors } from 'hooks/useTheme'
import { useLandlordPayments } from 'hooks/landlord'
import { periodMonthLabel, paymentStatusLabel } from '@/service/payments/paymentService'
import type { PaymentHistoryFilters } from '@/app/tenant/payment/history/components/PaymentHistoryFilterSheet'
import PaymentHistoryFilterSheet from '@/app/tenant/payment/history/components/PaymentHistoryFilterSheet'

import PaymentHistoryCard from '../components/PaymentHistoryCard'

const EMPTY_FILTERS: PaymentHistoryFilters = {
  years: [],
  statuses: [],
  sort: 'Newest',
}

type FlatPayment = {
  id: string
  year: string
  month: string
  amount: number
  status: 'paid' | 'pending' | 'unpaid'
  paidDate: string
  method: string | null
  reference: string | null
  date: string
}

const toFlatPayment = (payment: {
  id: string
  date: string
  amount: number | null
  status: string
  method: string | null
  reference_id: string | null
  period_start: string | null
  due_date: string | null
}): FlatPayment => {
  const sourceDate = payment.period_start ?? payment.date
  const date = new Date(`${payment.date.slice(0, 10)}T00:00:00`)
  const paidDate = Number.isNaN(date.getTime())
    ? payment.date
    : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
  return {
    id: payment.id,
    year: sourceDate.slice(0, 4),
    month: periodMonthLabel(payment.due_date ?? payment.period_start ?? payment.date),
    amount: payment.amount ?? 0,
    status: payment.status as FlatPayment['status'],
    paidDate,
    method: payment.method,
    reference: payment.reference_id ?? null,
    date: payment.date,
  }
}

export default function PaymentHistoryScreen() {
  const { colors } = useColors()
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>()
  const router = useRouter()

  const [filters, setFilters] = useState<PaymentHistoryFilters>(EMPTY_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)

  const paymentsQuery = useLandlordPayments(apartmentId)

  const allPayments = useMemo(
    () => (paymentsQuery.data ?? []).map(toFlatPayment),
    [paymentsQuery.data]
  )

  const availableYears = useMemo(
    () => [...new Set(allPayments.map((payment) => payment.year))].sort((a, b) => Number(b) - Number(a)),
    [allPayments]
  )

  const activeCount = filters.years.length + filters.statuses.length
  const currentYear = String(new Date().getFullYear())

  const filteredPayments = useMemo(() => {
    let result = allPayments

    if (filters.years.length > 0) {
      result = result.filter((payment) => filters.years.includes(payment.year))
    }

    if (filters.statuses.length > 0) {
      result = result.filter((payment) =>
        filters.statuses.includes(paymentStatusLabel(payment.status))
      )
    }

    const direction = filters.sort === 'Newest' ? -1 : 1
    return [...result].sort(
      (a, b) => direction * (new Date(a.date).getTime() - new Date(b.date).getTime())
    )
  }, [allPayments, filters])

  const sections = useMemo(() => {
    const yearMap = new Map<string, FlatPayment[]>()
    for (const payment of filteredPayments) {
      if (!yearMap.has(payment.year)) yearMap.set(payment.year, [])
      yearMap.get(payment.year)!.push(payment)
    }
    const sortDirection = filters.sort === 'Newest' ? -1 : 1
    return [...yearMap.entries()]
      .sort(([a], [b]) => sortDirection * (Number(a) - Number(b)))
      .map(([year, data]) => ({ title: year, data }))
  }, [filteredPayments, filters.sort])

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
          <Text className='text-foreground text-lg font-nunitoSemiBold text-center'>
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
    <ScreenWrapper
      header={
        <StandardHeader
          title='Payment History'
          rightComponent={
            <View className='relative'>
              <Button
                onPress={() => setFilterOpen(true)}
                variant='ghost'
                isIconOnly
              >
                <IconFilter2 size={22} color='#FFFFFF' />
              </Button>

              {activeCount > 0 && (
                <View className='absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full bg-white items-center justify-center'>
                  <Text className='text-accent text-[10px] font-nunitoSemiBold leading-none -mb-0.5'>
                    {activeCount}
                  </Text>
                </View>
              )}
            </View>
          }
        />
      }
    >
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
        renderSectionHeader={({ section }) => (
          <View className='bg-background pt-6 pb-3 mb-1'>
            {section.title === currentYear ? (
              <View style={{ backgroundColor: colors.primaryLight }} className='px-4 py-2 rounded-xl'>
                <Text style={{ color: colors.primary }} className='font-nunitoSemiBold text-base'>
                  This Year
                </Text>
              </View>
            ) : (
              <Text style={{ color: colors.primary, opacity: 0.6 }} className='font-nunitoSemiBold text-base'>
                {section.title}
              </Text>
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <PaymentHistoryCard
            month={item.month}
            amount={item.amount}
            paidDate={item.paidDate}
            status={item.status}
            method={item.method}
            referenceId={item.reference}
            onPress={() =>
              router.push({
                pathname: '/landlord/manage-apartment/[apartmentId]/payment-history/[paymentId]',
                params: { apartmentId: apartmentId!, paymentId: item.id },
              })
            }
          />
        )}
        ItemSeparatorComponent={() => <View className='h-2' />}
        ListEmptyComponent={
          <View className='items-center gap-4 py-20'>
            <IconWallet size={64} color={colors.primary} />
            <Text className='text-xl font-nunitoBold text-foreground'>
              No payments found
            </Text>
            <Text className='text-gray-400 text-base font-inter text-center px-8'>
              Payments for this unit will appear here.
            </Text>
          </View>
        }
      />

      <PaymentHistoryFilterSheet
        isOpen={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onChange={setFilters}
        availableYears={availableYears}
        currentYear={currentYear}
      />
    </ScreenWrapper>
  )
}
