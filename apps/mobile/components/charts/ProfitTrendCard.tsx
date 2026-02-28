import { View, Text } from 'react-native'
import { useState } from 'react'

import DropdownButton from '../buttons/DropdownButton'


export default function ProfitTrendCard() {
  // Profit Trend Filter Options
  const filterOptions = [
    'Monthly',
    'Quarterly',
    'Yearly'
  ]

  const [selectedProfitTrendFilter, setSelectedProfitTrendFilter] = useState(filterOptions[0]);

  // TODO: Implement Chart logic based on selected filter and profit data
  // TODO: Fetch profit data from API and update chart accordingly

  return (
    <View className='w-full border border-grey-200 p-4 rounded-2xl bg-white'>
      {/* HEADER */}
      <View className='flex-row items-center justify-between'>
        <View className='flex'>
          <Text className='text-primary font-poppinsSemiBold text-xl'>
            Profit Trend
          </Text>

          <Text className='text-grey-500 font-inter text-base'>
            Track your profit over time
          </Text>
        </View>

        {/* Filter */}
        <DropdownButton 
          value={selectedProfitTrendFilter}
          bottomSheetLabel={'Select Timeframe'} 
          options={filterOptions} 
          onSelect={(value) => setSelectedProfitTrendFilter(value)}          
        />
      </View>

      {/* CHART */}
      <View className='h-60 bg-amber-200 mt-3 rounded-xl'/>
    </View>
  )
}