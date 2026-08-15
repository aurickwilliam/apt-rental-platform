import { View } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import * as Linking from 'expo-linking'

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
} from '@/service/paymongoService'

import { validateCardInfo, type CardFormErrors } from '@repo/utils'

const INITIAL_CARD: CardInformation = {
  cardNumber: '',
  expiryDate: '',
  cardholderName: '',
  cvv: '',
  isPaymentSaved: false,
  isCardNumberValid: false,
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

  const apartmentDetails = {
    name: 'Sunny Apartments',
    address: '123 Main St, City, State',
    landlord: 'John Doe',
    leaseStart: '01/01/2024',
    leaseEnd: '12/31/2024',
    month: 'October',
    year: '2024',
    monthlyRent: 1_200.00,
    dueDate: '10/05/2024',
    paidAmount: 0.00,
  }

  const totalPayment = apartmentDetails.monthlyRent - apartmentDetails.paidAmount

  const clearCardError = () => setCardErrors({})
  const clearCashErrors = () => setCashErrors({})

  const handleCardInformationChange = (patch: Partial<CardInformation>) => {
    setCardInformation((prev) => ({ ...prev, ...patch }))
    clearCardError()
  }

  const handlePay = async () => {
    if (!activePaymentMethod) {
      setPaymentError({
        message: 'Please select a payment method before proceeding.',
        title: 'No Payment Method',
      })
      return
    }

    const referenceId = `pay_${Date.now().toString(36)}`
    const paymentDescription = `Rent payment for ${apartmentDetails.month} ${apartmentDetails.year} - ${apartmentDetails.name}`

    if (activePaymentMethod === 'GCash' || activePaymentMethod === 'Maya') {
      setIsProcessing(true)
      try {
        const session = await createCheckoutSession({
          referenceId,
          amount: totalPayment,
          description: paymentDescription,
          // Deep link carries only the session id — the backend decides the outcome.
          redirectBaseUrl: Linking.createURL('/tenant/payment/e-wallet-redirect'),
        })
        router.push(
          `/tenant/payment/e-wallet-redirect?sessionId=${session.id}&checkoutUrl=${encodeURIComponent(session.checkoutUrl)}&method=${activePaymentMethod === 'GCash' ? 'gcash' : 'maya'}`
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
        })

        if (result.status === 'succeeded') {
          // TODO: Record payment in payment_history
          // TODO: Update tenant rent status
          // TODO: Generate receipt
          // TODO: Store PayMongo payment reference
          router.push('/tenant/payment/success')
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
      router.push('/tenant/payment/success')
    }
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
        <DetailField label='Apartment Name' value={apartmentDetails.name} />
        <DetailField label='Address' value={apartmentDetails.address} />
        <DetailField label='Landlord Name' value={apartmentDetails.landlord} />
        <View className='flex-row'>
          <DetailField label='Lease Start' value={apartmentDetails.leaseStart} />
          <DetailField label='Lease End' value={apartmentDetails.leaseEnd} />
        </View>
      </View>

      <PaymentSummaryCard
        month={apartmentDetails.month}
        year={apartmentDetails.year}
        dueDate={apartmentDetails.dueDate}
        monthlyRent={apartmentDetails.monthlyRent}
        paidAmount={apartmentDetails.paidAmount}
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
