import { View, Text } from 'react-native'
import { useState } from 'react'

import DropdownButton from '../buttons/DropdownButton'

import { MONTHS } from '@repo/constants'


export default function ProfitByPropertyCard() {
  const [selectedProfitFilter, setSelectedProfitFilter] = useState(MONTHS[0]);

  // TODO: Implement Chart logic based on selected filter and profit data
  // TODO: Fetch profit data from API and update chart accordingly

  return (
    <View className='w-full border border-grey-200 p-4 rounded-2xl bg-white'>
      {/* HEADER */}
      <View className='flex-row items-center justify-between'>
        <View className='flex'>
          <Text className='text-primary font-poppinsSemiBold text-xl'>
            Profit by Property
          </Text>

          <Text className='text-grey-500 font-inter text-base'>
            {selectedProfitFilter}
          </Text>
        </View>

        {/* Filter */}
        <DropdownButton 
          value={selectedProfitFilter}
          bottomSheetLabel={'Select Timeframe'} 
          options={MONTHS} 
          onSelect={(value) => setSelectedProfitFilter(value)}          
        />
      </View>

      {/* CHART */}
      <View className='h-60 bg-amber-200 mt-3 rounded-xl'/>
    </View>
  )
}