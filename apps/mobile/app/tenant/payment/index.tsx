import { View } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import DetailField from '@/components/display/DetailField'
import ErrorDialog from '@/components/display/ErrorDialog'
import PaymentSummaryCard from './components/PaymentSummaryCard'
import PaymentMethodSelector, { type PaymentMethod } from './components/PaymentMethodSelector'
import PaymentFooter from './components/PaymentFooter'
import { type CardInformation } from './components/CardPaymentForm'
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
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)

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

  const handleCardInformationChange = (patch: Partial<CardInformation>) => {
    setCardInformation((prev) => ({ ...prev, ...patch }))
    clearCardError()
  }

  const handlePay = () => {
    if (!activePaymentMethod) {
      setErrorDialogOpen(true)
      return
    }
    if (activePaymentMethod === 'GCash') {
      router.push('/tenant/payment/e-wallet-redirect?method=gcash')
    } else if (activePaymentMethod === 'Maya') {
      router.push('/tenant/payment/e-wallet-redirect?method=maya')
    } else if (activePaymentMethod === 'Debit/Credit-Card') {
      const errors = validateCardInfo(cardInformation)
      if (Object.keys(errors).length > 0) {
        setCardErrors(errors)
        return
      }
      router.push('/tenant/payment/success')
    } else {
      router.push('/tenant/payment/success')
    }
  }

  return (
    <ScreenWrapper
      scrollable
      header={<StandardHeader title='Rent Payment' />}
      footer={<PaymentFooter totalPayment={totalPayment} onPayPress={handlePay} />}
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
      />
      <ErrorDialog
        isOpen={errorDialogOpen}
        onClose={() => setErrorDialogOpen(false)}
        message='Please select a payment method before proceeding.'
        title='No Payment Method'
      />
    </ScreenWrapper>
  )
}
