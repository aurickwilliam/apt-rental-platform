import { View, Text } from 'react-native'
import { useState } from 'react'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import DropdownButton from '@/components/buttons/DropdownButton'
import PaymentHistoryBigCard from '@/components/display/PaymentHistoryBigCard'
import MonthDivider from '@/components/display/MonthDivider'

import { YEARS, PAYMENT_STATUS } from '@repo/constants'

export default function History() {
  const SORT_OPTIONS = ['Newest', 'Oldest'];

  const [selectedFilter, setSelectedFilter] = useState<typeof YEARS[number]>(YEARS[0]);
  const [selectedSort, setSelectedSort] = useState<typeof SORT_OPTIONS[number]>(SORT_OPTIONS[0]);
  const [selectedStatus, setSelectedStatus] = useState<typeof PAYMENT_STATUS[number] | 'All'>('All');

  // Dummy data for payment history
  const paymentHistory = {
    2025: {
      'January': [
        { id: '1', date: '2025-05-15', month: 'May', amount: 50.00, status: 'Paid', apartmentName: 'Apartment A', method: 'GCash' },
        { id: '2', date: '2025-04-10', month: 'April', amount: 30.00, status: 'Paid', apartmentName: 'Apartment A', method: 'Bank Transfer' },
        { id: '3', date: '2025-03-05', month: 'March', amount: 20.00, status: 'Partial', apartmentName: 'Apartment A', method: 'Cash' },
      ],
      'February': [
        { id: '4', date: '2025-02-20', month: 'February', amount: 40.00, status: 'Paid', apartmentName: 'Apartment B', method: 'Cash' },
      ],
    },
    2024: {
      'December': [
        { id: '5', date: '2024-12-25', month: 'December', amount: 60.00, status: 'Paid', apartmentName: 'Apartment C', method: 'GCash' },
      ],
      'November': [
        { id: '6', date: '2024-11-15', month: 'November', amount: 35.00, status: 'Unpaid', apartmentName: 'Apartment D', method: 'Bank Transfer' },
      ],
    },
    2023: {
      'October': [
        { id: '7', date: '2023-10-10', month: 'October', amount: 45.00, status: 'Paid', apartmentName: 'Apartment E', method: 'Cash' },
      ],
    },
    
  }


  return (
    <ScreenWrapper
      header={
        <StandardHeader title='Payment History' />
      }
      scrollable
      bottomPadding={50}
      className='p-5'
    >
      {/* Filter and Sort */}
      <View className='flex-row items-center justify-between'>
        {/* Filter */}
        <View className='flex-row gap-2 items-center'>
          <Text className='text-text text-base font-interMedium'>
            Filter by Year:
          </Text>

          <DropdownButton 
            bottomSheetLabel={'Select Filter'} 
            options={YEARS}
            value={selectedFilter}
            onSelect={(value) => setSelectedFilter(value)}            
          />
        </View>

        {/* Sort */}
        <View className='flex-row gap-2 items-center'>
          <Text className='text-text text-base font-interMedium'>
            Sort by:
          </Text>

          <DropdownButton 
            bottomSheetLabel={'Select Sort'} 
            options={SORT_OPTIONS}
            value={selectedSort}
            onSelect={(value) => setSelectedSort(value)}            
          />
        </View>
      </View>

      <View className='flex-row items-center justify-between mt-3'>
        {/* Filter */}
        <View className='flex-row gap-2 items-center'>
          <Text className='text-text text-base font-interMedium'>
            Filter by Status:
          </Text>

          <DropdownButton 
            bottomSheetLabel={'Select Status'} 
            options={PAYMENT_STATUS}
            value={selectedStatus}
            onSelect={(value) => setSelectedStatus(value)}            
          />
        </View>
      </View>

      {/* Payment History List */}
      {
        Object.entries(paymentHistory)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([year, months]) => (
          <View key={year}>
            {Object.entries(months)
              .sort(([a], [b]) => Number(b) - Number(a)) 
              .map(([month, payments]) => (
                <View key={month}>
                  <MonthDivider month={month} year={year} />
                  {payments.map((payment) => (
                    <View key={payment.id} className='my-3'>
                      <PaymentHistoryBigCard payment={payment} />
                    </View>
                  ))}
                </View>
              ))}
          </View>
        ))
      }
    </ScreenWrapper>
  )
}