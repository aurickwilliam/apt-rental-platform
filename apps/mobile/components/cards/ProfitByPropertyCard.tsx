import { View, Text } from 'react-native'
import { useState } from 'react'
import { BarChart } from 'react-native-gifted-charts'

import DropdownButton from '../buttons/DropdownButton'
import { COLORS, MONTHS } from '@repo/constants'

// Dummy: profit per property per month
const DUMMY_DATA: Record<string, { value: number; label: string; frontColor: string }[]> = {
  January:   [
    { value: 8000,  label: 'Sunset\nApt',     frontColor: COLORS.primary },
    { value: 5000,  label: 'Maple\nRes',       frontColor: '#6366f1' },
    { value: 6500,  label: 'Oakwood\nVilla',   frontColor: '#f59e0b' },
    { value: 4000,  label: 'Pine\nLoft',       frontColor: '#10b981' },
    { value: 7200,  label: 'River\nView',      frontColor: '#ef4444' },
  ],
  February:  [
    { value: 7500,  label: 'Sunset\nApt',     frontColor: COLORS.primary },
    { value: 5500,  label: 'Maple\nRes',       frontColor: '#6366f1' },
    { value: 6000,  label: 'Oakwood\nVilla',   frontColor: '#f59e0b' },
    { value: 4500,  label: 'Pine\nLoft',       frontColor: '#10b981' },
    { value: 8000,  label: 'River\nView',      frontColor: '#ef4444' },
  ],
  March:     [
    { value: 9000,  label: 'Sunset\nApt',     frontColor: COLORS.primary },
    { value: 6000,  label: 'Maple\nRes',       frontColor: '#6366f1' },
    { value: 7000,  label: 'Oakwood\nVilla',   frontColor: '#f59e0b' },
    { value: 5000,  label: 'Pine\nLoft',       frontColor: '#10b981' },
    { value: 7800,  label: 'River\nView',      frontColor: '#ef4444' },
  ],
}

// Fill in remaining months with randomized dummy data
const propertyLabels = ['Sunset\nApt', 'Maple\nRes', 'Oakwood\nVilla', 'Pine\nLoft', 'River\nView']
const propertyColors = [COLORS.primary, '#6366f1', '#f59e0b', '#10b981', '#ef4444']

MONTHS.forEach((month) => {
  if (!DUMMY_DATA[month]) {
    DUMMY_DATA[month] = propertyLabels.map((label, i) => ({
      value: Math.floor(Math.random() * 5000) + 5000,
      label,
      frontColor: propertyColors[i],
    }))
  }
})

export default function ProfitByPropertyCard() {
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0])

  const chartData = DUMMY_DATA[selectedMonth] ?? []
  const maxValue = Math.max(...chartData.map((d) => d.value))

  return (
    <View className='w-full border border-grey-200 p-4 rounded-2xl bg-white'>
      {/* HEADER */}
      <View className='flex-row items-center justify-between'>
        <View className='flex'>
          <Text className='text-primary font-poppinsSemiBold text-xl'>
            Profit by Property
          </Text>
          <Text className='text-grey-500 font-inter text-base'>
            {selectedMonth}
          </Text>
        </View>

        <DropdownButton
          value={selectedMonth}
          bottomSheetLabel='Select Month'
          options={MONTHS}
          onSelect={(value) => setSelectedMonth(value)}
        />
      </View>

      {/* CHART */}
      <View className='mt-4 overflow-hidden'>
        <BarChart
          data={chartData}
          height={180}
          barWidth={42}
          barBorderRadius={6}
          spacing={14}
          maxValue={maxValue + 1500}
          noOfSections={4}
          yAxisColor='transparent'
          xAxisColor='#e5e7eb'
          rulesColor='#f3f4f6'
          rulesType='solid'
          yAxisTextStyle={{ color: '#9ca3af', fontSize: 10, fontFamily: 'Inter' }}
          xAxisLabelTextStyle={{
            color: '#6b7280',
            fontSize: 9,
            fontFamily: 'Inter',
            textAlign: 'center',
          }}
          formatYLabel={(val) => `₱${Number(val) / 1000}k`}
          showValuesAsTopLabel
          topLabelTextStyle={{
            color: '#374151',
            fontSize: 9,
            fontWeight: '600',
            fontFamily: 'Inter',
          }}
          topLabelContainerStyle={{ paddingBottom: 4 }}
          renderTooltip={(item: any) => (
            <View
              style={{
                backgroundColor: item.frontColor,
                borderRadius: 6,
                paddingHorizontal: 6,
                paddingVertical: 3,
                marginBottom: 4,
              }}
            >
              <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
                ₱{item.value.toLocaleString()}
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  )
}