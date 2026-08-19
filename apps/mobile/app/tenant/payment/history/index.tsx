import { useMemo, useState } from 'react'
import { View, Text, SectionList, ActivityIndicator } from 'react-native'
import { Button } from 'heroui-native'
import { IconFilter2, IconReceipt } from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import { useColors } from '@/hooks/useTheme'
import { usePayments } from '@/hooks/payments'
import { useTenancy } from '@/hooks/tenancy/useTenancy'
import {
  methodLabel,
  paymentStatusLabel,
  periodMonthLabel,
  type PaymentRecord,
} from '@/service/payments/paymentService'

import PaymentHistoryCard, { type PaymentHistoryItem } from './components/PaymentHistoryCard'
import PaymentHistoryFilterSheet, {
  type PaymentHistoryFilters,
} from './components/PaymentHistoryFilterSheet'

const EMPTY_FILTERS: PaymentHistoryFilters = {
  years: [],
  statuses: [],
  sort: 'Newest',
}

type FlatPayment = PaymentHistoryItem & { year: string };

const toHistoryItem = (payment: PaymentRecord): FlatPayment => {
  const sourceDate = payment.period_start ?? payment.date
  const year = sourceDate.slice(0, 4)
  return {
    id: payment.id,
    date: payment.date,
    month: periodMonthLabel(payment.period_start, payment.date),
    amount: payment.amount ?? 0,
    status: paymentStatusLabel(payment.status),
    apartmentName: payment.apartment_name ?? '—',
    landlordName: payment.landlord_name ?? '—',
    method: methodLabel(payment.method),
    year,
  }
}

export default function History() {
  const { colors } = useColors()

  const [filters, setFilters] = useState<PaymentHistoryFilters>(EMPTY_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)

  const { tenancy, loading: tenancyLoading, error: tenancyError, refetch } = useTenancy()
  const paymentsQuery = usePayments(tenancy?.id ?? null)

  const allPayments = useMemo<FlatPayment[]>(
    () => (paymentsQuery.data ?? []).map(toHistoryItem),
    [paymentsQuery.data]
  )

  const availableYears = useMemo(
    () => [...new Set(allPayments.map((payment) => payment.year))].sort((a, b) => Number(b) - Number(a)),
    [allPayments]
  )

  const activeCount = filters.years.length + filters.statuses.length
  const currentYear = String(new Date().getFullYear())

  const filteredPayments = useMemo(() => {
    let result = allPayments;

    if (filters.years.length > 0) {
      result = result.filter((payment) => filters.years.includes(payment.year));
    }

    if (filters.statuses.length > 0) {
      result = result.filter((payment) => filters.statuses.includes(payment.status));
    }

    const direction = filters.sort === 'Newest' ? -1 : 1;
    return [...result].sort(
      (a, b) => direction * (new Date(a.date).getTime() - new Date(b.date).getTime())
    );
  }, [allPayments, filters]);

  const grouped = useMemo(() => {
    const yearMap = new Map<string, PaymentHistoryItem[]>();

    for (const payment of filteredPayments) {
      if (!yearMap.has(payment.year)) yearMap.set(payment.year, []);
      yearMap.get(payment.year)!.push(payment);
    }

    const sortDirection = filters.sort === 'Newest' ? -1 : 1;
    return [...yearMap.entries()].sort(
      ([a], [b]) => sortDirection * (Number(a) - Number(b))
    );
  }, [filteredPayments, filters.sort]);

  const sections = useMemo(
    () => grouped.map(([year, payments]) => ({ title: year, data: payments })),
    [grouped]
  );

  if (tenancyLoading || paymentsQuery.isLoading) {
    return (
      <ScreenWrapper header={<StandardHeader title='Payment History' />}>
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' />
        </View>
      </ScreenWrapper>
    )
  }

  if (tenancyError || paymentsQuery.error) {
    return (
      <ScreenWrapper header={<StandardHeader title='Payment History' />} className='p-5'>
        <View className='flex-1 items-center justify-center gap-4'>
          <Text className='text-foreground text-lg font-nunitoSemiBold text-center'>
            We could not load your payment history.
          </Text>
          <Button onPress={() => { void refetch(); void paymentsQuery.refetch() }}>
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
        ListHeaderComponent={
          <Text className='text-gray-500 text-sm font-inter pb-3'>
            Total: {filteredPayments.length}
          </Text>
        }
        renderSectionHeader={({ section }) => (
          <View className='bg-background pt-5 pb-3'>
            <Text
              className={
                section.title === currentYear
                  ? 'text-accent font-nunitoSemiBold text-base'
                  : 'text-muted font-nunitoSemiBold text-base'
              }
            >
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <PaymentHistoryCard payment={item} />
        )}
        ItemSeparatorComponent={() => <View className='h-3' />}
        ListEmptyComponent={
          <View className='items-center gap-4 py-20'>
            <IconReceipt size={64} color={colors.primary} />
            <Text className='text-xl font-nunitoBold text-foreground'>
              No payments found
            </Text>
            <Text className='text-gray-400 text-base font-inter text-center px-8'>
              Try adjusting your filters to see more results.
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
      />
    </ScreenWrapper>
  )
}
