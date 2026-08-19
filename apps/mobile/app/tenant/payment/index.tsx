import { View, ActivityIndicator, Text } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import * as Linking from 'expo-linking'
import { Button } from 'heroui-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import DetailField from '@/components/display/DetailField'
import ErrorDialog from '@/components/display/ErrorDialog'
import PaymentSummaryCard from './components/PaymentSummaryCard'
import PaymentMethodSelector, { type PaymentMethod } from './components/PaymentMethodSelector'
import PaymentFooter from './components/PaymentFooter'
import { type CardInformation } from './components/CardPaymentForm'
import { validateCashPayment, type CashPaymentErrors } from './components/CashPaymentForm'

import {
  createCardPayment,
  createCheckoutSession,
  PaymongoError,
} from '@/service/payments/paymongoService'
import {
  createCashPayment,
  paidAmountForPeriod,
  periodMonthLabel,
} from '@/service/payments/paymentService'
import { usePayments } from '@/hooks/payments'
import { useCurrentUser } from '@/hooks/auth'
import { useTenancy } from '@/hooks/tenancy/useTenancy'

import { validateCardInfo, type CardFormErrors } from '@repo/utils'

const INITIAL_CARD: CardInformation = {
  cardNumber: '',
  expiryDate: '',
  cardholderName: '',
  cvv: '',
  isPaymentSaved: false,
  isCardNumberValid: false,
}

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// The period being paid for: the tenancy's current payment period when it
// covers this month, otherwise the current calendar month (due on the 5th).
function resolvePaymentPeriod(currentPeriodStart: string | null, currentPeriodEnd: string | null, currentDueDate: string | null): {
  periodStart: string
  periodEnd: string
  dueDate: string
} {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  if (currentPeriodStart?.startsWith(currentMonth)) {
    return {
      periodStart: currentPeriodStart,
      periodEnd: currentPeriodEnd ?? currentPeriodStart,
      dueDate: currentDueDate ?? `${currentMonth}-05`,
    }
  }

  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return {
    periodStart: `${currentMonth}-01`,
    periodEnd: `${currentMonth}-${String(lastDay).padStart(2, '0')}`,
    dueDate: `${currentMonth}-05`,
  }
}

const formatLeaseDate = (iso: string | null): string => {
  if (!iso) return '—'
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).format(date)
}

export default function PaymentCheckout() {
  const router = useRouter()

  const [activePaymentMethod, setActivePaymentMethod] = useState<PaymentMethod | null>(null)
  const [cardInformation, setCardInformation] = useState<CardInformation>(INITIAL_CARD)
  const [cardErrors, setCardErrors] = useState<CardFormErrors>({})
  const [cashPaymentDate, setCashPaymentDate] = useState<Date | null>(null)
  const [cashAmountPaid, setCashAmountPaid] = useState('')
  const [cashErrors, setCashErrors] = useState<CashPaymentErrors>({})
  const [paymentError, setPaymentError] = useState<{ message: string; title?: string } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const { data: currentUser } = useCurrentUser()
  const { tenancy, loading: tenancyLoading, error: tenancyError, refetch } = useTenancy()
  const paymentsQuery = usePayments(tenancy?.id ?? null)

  const apartment = tenancy?.apartment ?? null
  const landlord = tenancy?.landlord ?? null
  const monthlyRent = tenancy?.monthly_rent ?? apartment?.monthly_rent ?? 0
  const landlordName = landlord?.first_name || landlord?.last_name
    ? `${landlord?.first_name ?? ''} ${landlord?.last_name ?? ''}`.trim()
    : '—'

  const period = resolvePaymentPeriod(
    tenancy?.currentPayment?.period_start ?? null,
    tenancy?.currentPayment?.period_end ?? null,
    tenancy?.currentPayment?.due_date ?? null
  )
  const monthLabel = periodMonthLabel(period.periodStart, new Date().toISOString())
  const yearLabel = period.periodStart.slice(0, 4)
  const paidAmount = paidAmountForPeriod(paymentsQuery.data ?? [], period.periodStart)
  const totalPayment = Math.max(monthlyRent - paidAmount, 0)

  const clearCardError = () => setCardErrors({})
  const clearCashErrors = () => setCashErrors({})

  const handleCardInformationChange = (patch: Partial<CardInformation>) => {
    setCardInformation((prev) => ({ ...prev, ...patch }))
    clearCardError()
  }

  const handleGoToSuccess = (referenceId: string) => {
    router.push(`/tenant/payment/success?referenceId=${referenceId}`)
  }

  const handlePay = async () => {
    if (!activePaymentMethod) {
      setPaymentError({
        message: 'Please select a payment method before proceeding.',
        title: 'No Payment Method',
      })
      return
    }

    if (!tenancy || !apartment) {
      setPaymentError({
        message: 'No active rental found on this account.',
        title: 'No Active Rental',
      })
      return
    }

    const referenceId = `pay_${Date.now().toString(36)}`
    const paymentDescription = `Rent payment for ${monthLabel} ${yearLabel} - ${apartment.name}`
    const periodFields = {
      tenancyId: tenancy.id,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      dueDate: period.dueDate,
    }

    if (activePaymentMethod === 'GCash' || activePaymentMethod === 'Maya') {
      setIsProcessing(true)
      try {
        const session = await createCheckoutSession({
          referenceId,
          amount: totalPayment,
          description: paymentDescription,
          // Deep link carries only the session id — the backend decides the outcome.
          redirectBaseUrl: Linking.createURL('/tenant/payment/e-wallet-redirect'),
          method: activePaymentMethod === 'GCash' ? 'gcash' : 'maya',
          ...periodFields,
        })
        router.push(
          `/tenant/payment/e-wallet-redirect?sessionId=${session.id}&checkoutUrl=${encodeURIComponent(session.checkoutUrl)}&method=${activePaymentMethod === 'GCash' ? 'gcash' : 'maya'}&referenceId=${referenceId}`
        )
      } catch (error) {
        setPaymentError({
          message: error instanceof PaymongoError
            ? error.reason
            : 'Unable to start your payment. Please try again.',
        })
      } finally {
        setIsProcessing(false)
      }
    } else if (activePaymentMethod === 'Debit/Credit-Card') {
      const errors = validateCardInfo(cardInformation)
      if (Object.keys(errors).length > 0) {
        setCardErrors(errors)
        return
      }

      const [expMonth, expYear] = cardInformation.expiryDate.split('/')

      setIsProcessing(true)
      try {
        const result = await createCardPayment({
          referenceId,
          amount: totalPayment,
          description: paymentDescription,
          card: {
            number: cardInformation.cardNumber.replace(/\s/g, ''),
            expMonth: Number(expMonth),
            expYear: Number(`20${expYear}`),
            cvc: cardInformation.cvv,
            name: cardInformation.cardholderName,
          },
          ...periodFields,
        })

        if (result.status === 'succeeded') {
          handleGoToSuccess(referenceId)
        } else {
          setPaymentError({
            message: result.failureReason ?? 'Your payment could not be completed.',
          })
        }
      } catch (error) {
        setPaymentError({
          message: error instanceof PaymongoError
            ? error.reason
            : 'Payment failed. Please try again.',
        })
      } finally {
        setIsProcessing(false)
      }
    } else if (activePaymentMethod === 'Cash') {
      const errors = validateCashPayment({
        paymentDate: cashPaymentDate,
        amountPaid: cashAmountPaid,
      })
      if (Object.keys(errors).length > 0) {
        setCashErrors(errors)
        return
      }

      setIsProcessing(true)
      try {
        await createCashPayment({
          referenceId,
          amount: Number(cashAmountPaid),
          date: toIsoDate(cashPaymentDate ?? new Date()),
          tenantId: currentUser?.id ?? tenancy.id,
          apartmentId: apartment.id,
          tenancyId: tenancy.id,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          dueDate: period.dueDate,
        })
        handleGoToSuccess(referenceId)
      } catch {
        setPaymentError({
          message: 'Could not record your cash payment. Please try again.',
        })
      } finally {
        setIsProcessing(false)
      }
    }
  }

  if (tenancyLoading) {
    return (
      <ScreenWrapper header={<StandardHeader title='Rent Payment' />}>
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' />
        </View>
      </ScreenWrapper>
    )
  }

  if (tenancyError || !tenancy || !apartment) {
    return (
      <ScreenWrapper header={<StandardHeader title='Rent Payment' />} className='p-5'>
        <View className='flex-1 items-center justify-center gap-4'>
          <Text className='text-foreground text-lg font-nunitoSemiBold text-center'>
            {tenancyError ?? 'No active rental found on this account.'}
          </Text>
          <Button onPress={() => { void refetch() }}>
            <Button.Label>Try Again</Button.Label>
          </Button>
        </View>
      </ScreenWrapper>
    )
  }

  return (
    <ScreenWrapper
      scrollable
      header={<StandardHeader title='Rent Payment' />}
      footer={
        <PaymentFooter
          totalPayment={totalPayment}
          onPayPress={handlePay}
          isProcessing={isProcessing}
        />
      }
      className='p-5'
    >
      <View className='flex gap-3'>
        <DetailField label='Apartment Name' value={apartment.name} />
        <DetailField
          label='Address'
          value={[apartment.street_address, apartment.barangay, apartment.city].filter(Boolean).join(', ')}
        />
        <DetailField label='Landlord Name' value={landlordName} />
        <View className='flex-row'>
          <DetailField label='Lease Start' value={formatLeaseDate(tenancy.lease_start)} />
          <DetailField label='Lease End' value={formatLeaseDate(tenancy.lease_end)} />
        </View>
      </View>

      <PaymentSummaryCard
        month={monthLabel}
        year={yearLabel}
        dueDate={period.dueDate}
        monthlyRent={monthlyRent}
        paidAmount={paidAmount}
        totalPayment={totalPayment}
      />

      <PaymentMethodSelector
        onPaymentMethodChange={setActivePaymentMethod}
        cardInformation={cardInformation}
        onCardInformationChange={handleCardInformationChange}
        cardErrors={cardErrors}
        cashPaymentDate={cashPaymentDate}
        onCashPaymentDateChange={(date) => { setCashPaymentDate(date); clearCashErrors() }}
        cashAmountPaid={cashAmountPaid}
        onCashAmountPaidChange={(value) => { setCashAmountPaid(value); clearCashErrors() }}
        cashErrors={cashErrors}
      />

      <ErrorDialog
        isOpen={paymentError !== null}
        onClose={() => setPaymentError(null)}
        message={paymentError?.message ?? ''}
        title={paymentError?.title ?? 'Payment Failed'}
      />
    </ScreenWrapper>
  )
}
