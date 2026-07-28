import { View } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import DetailField from '@/components/display/DetailField'
import PaymentSummaryCard from './components/PaymentSummaryCard'
import PaymentMethodSelector, { type PaymentMethod } from './components/PaymentMethodSelector'
import PaymentFooter from './components/PaymentFooter'

export default function PaymentCheckout() {
  const router = useRouter()

  const [activePaymentMethod, setActivePaymentMethod] = useState<PaymentMethod | null>(null)

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

  const handlePay = () => {
    if (activePaymentMethod === 'GCash') {
      router.push('/tenant/payment/e-wallet-redirect?method=gcash')
    } else if (activePaymentMethod === 'Maya') {
      router.push('/tenant/payment/e-wallet-redirect?method=maya')
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

      <PaymentMethodSelector onPaymentMethodChange={setActivePaymentMethod} />
    </ScreenWrapper>
  )
}
