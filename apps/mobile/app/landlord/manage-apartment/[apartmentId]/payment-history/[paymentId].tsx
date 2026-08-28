import { useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Button } from 'heroui-native'
import { IconChevronLeft } from '@tabler/icons-react-native'
import { useQueryClient } from '@tanstack/react-query'

import { useColors } from '@/hooks/useTheme'
import { usePayment, getPaymentQueryKey } from '@/hooks/payments'
import { useLandlordPaymentConfirmation } from '@/hooks/landlord'
import {
  formatReferenceId,
  methodLabel,
  paymentStatusLabel,
  periodMonthLabel,
} from '@/service/payments/paymentService'
import ConfirmDialog from 'components/display/ConfirmDialog'

import ReceiptCard from '@/app/tenant/payment/components/ReceiptCard'

export default function LandlordPaymentReceipt() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors } = useColors()
  const queryClient = useQueryClient()
  const { apartmentId, paymentId } = useLocalSearchParams<{
    apartmentId: string
    paymentId: string
  }>()

  const [confirmOpen, setConfirmOpen] = useState(false)

  const paymentQuery = usePayment(paymentId ?? null)
  const payment = paymentQuery.data

  const confirmMutation = useLandlordPaymentConfirmation(apartmentId)

  const isCashPending = payment?.status === 'pending' && payment?.method === 'cash'

  const handleConfirm = () => {
    if (!paymentId) return
    confirmMutation.mutate(paymentId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getPaymentQueryKey(paymentId) })
        setConfirmOpen(false)
      },
    })
  }

  const paymentDate = payment ? new Date(`${payment.date.slice(0, 10)}T00:00:00`) : null
  const createdDate = payment?.created_at ? new Date(payment.created_at) : null

  const dateLabel = paymentDate
    ? Number.isNaN(paymentDate.getTime())
      ? '—'
      : new Intl.DateTimeFormat('en-PH', { dateStyle: 'full' }).format(paymentDate)
    : '—'
  const timeLabel = createdDate
    ? Number.isNaN(createdDate.getTime())
      ? '—'
      : new Intl.DateTimeFormat('en-PH', { timeStyle: 'short' }).format(createdDate)
    : '—'
  const periodLabel = payment?.period_start
    ? `${periodMonthLabel(payment.due_date ?? payment.period_start)}, ${payment.period_start.slice(0, 4)}`
    : undefined

  return (
    <View
      className="flex-1 bg-primary px-5"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <View className="pt-2">
        <Button onPress={() => router.back()} variant="ghost" isIconOnly className="bg-white/20 self-start">
          <IconChevronLeft size={24} color="#FFFFFF" />
        </Button>
      </View>

      {paymentQuery.isLoading || !payment ? (
        <View className="flex-1 items-center justify-center gap-4">
          {paymentQuery.error ? (
            <>
              <Text className="text-white text-base font-inter text-center">We could not load this receipt.</Text>
              <Button
                onPress={() => {
                  void paymentQuery.refetch()
                }}
                className="bg-white"
              >
                <Button.Label className="text-primary">Try Again</Button.Label>
              </Button>
            </>
          ) : !payment && !paymentQuery.isLoading ? (
            <>
              <Text className="text-white text-base font-inter text-center">We could not find this payment.</Text>
              <Button onPress={() => router.back()} className="bg-white">
                <Button.Label className="text-primary">Go Back</Button.Label>
              </Button>
            </>
          ) : (
            <ActivityIndicator size="large" color="#FFFFFF" />
          )}
        </View>
      ) : (
        <View className="flex-1 justify-center gap-6">
          <ReceiptCard
            apartmentName={payment.apartment_name ?? '—'}
            tenantName={payment.tenant_name ?? undefined}
            landlordName={undefined}
            date={dateLabel}
            time={timeLabel}
            method={methodLabel(payment.method)}
            amount={payment.amount ?? 0}
            referenceNumber={formatReferenceId(payment.reference_id)}
            status={paymentStatusLabel(payment.status)}
            periodLabel={periodLabel}
            backgroundColor={colors.primary}
          />

          {isCashPending ? (
            <Button
              onPress={() => setConfirmOpen(true)}
              isDisabled={confirmMutation.isPending}
              className="bg-white"
            >
              <Button.Label className="text-primary">
                {confirmMutation.isPending ? 'Confirming…' : 'Mark as Paid'}
              </Button.Label>
            </Button>
          ) : payment.status === 'pending' ? (
            <Text className="text-white/70 text-sm font-inter text-center">
              Awaiting payment confirmation.
            </Text>
          ) : null}
        </View>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Mark as Paid"
        description={
          payment
            ? `Confirm the ${methodLabel(payment.method)} payment for ${periodLabel ?? paymentDate?.toLocaleDateString()}? This notifies the tenant that their payment was received.`
            : ''
        }
        confirmLabel="Confirm"
        confirmVariant="primary"
        onConfirm={handleConfirm}
        isConfirmDisabled={confirmMutation.isPending}
        errorMessage={confirmMutation.isError ? (confirmMutation.error as Error)?.message ?? 'Could not update payment.' : null}
      />
    </View>
  )
}
