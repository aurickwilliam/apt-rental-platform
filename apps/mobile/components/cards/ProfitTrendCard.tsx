import { View, Text } from 'react-native'
import { useState } from 'react'
import { LineChart } from 'react-native-gifted-charts'

import DropdownButton from '../buttons/DropdownButton'
import { COLORS } from '@repo/constants'

const DUMMY_DATA = {
  Monthly: [
    { value: 8000,  label: 'Jan' },
    { value: 12000, label: 'Feb' },
    { value: 9500,  label: 'Mar' },
    { value: 14000, label: 'Apr' },
    { value: 11000, label: 'May' },
    { value: 15500, label: 'Jun' },
    { value: 13000, label: 'Jul' },
    { value: 17000, label: 'Aug' },
    { value: 14500, label: 'Sep' },
    { value: 18000, label: 'Oct' },
    { value: 16000, label: 'Nov' },
    { value: 20000, label: 'Dec' },
  ],
  Quarterly: [
    { value: 29500,  label: 'Q1' },
    { value: 40500,  label: 'Q2' },
    { value: 44500,  label: 'Q3' },
    { value: 54000,  label: 'Q4' },
  ],
  Yearly: [
    { value: 120000, label: '2022' },
    { value: 148000, label: '2023' },
    { value: 168500, label: '2024' },
  ],
}

const filterOptions = ['Monthly', 'Quarterly', 'Yearly']

export default function ProfitTrendCard() {
  const [selectedFilter, setSelectedFilter] = useState<keyof typeof DUMMY_DATA>('Monthly')

  const chartData = DUMMY_DATA[selectedFilter]
  const maxValue = Math.max(...chartData.map((d) => d.value))

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

        <DropdownButton
          value={selectedFilter}
          bottomSheetLabel='Select Timeframe'
          options={filterOptions}
          onSelect={(value) => setSelectedFilter(value as keyof typeof DUMMY_DATA)}
        />
      </View>

      {/* CHART */}
      <View className='mt-4 overflow-hidden'>
        <LineChart
          data={chartData}
          height={180}
          width={280}
          curved
          color={COLORS.primary}
          thickness={2.5}
          dataPointsColor={COLORS.primary}
          dataPointsRadius={4}
          startFillColor={COLORS.primary}
          endFillColor={'#ffffff'}
          startOpacity={0.2}
          endOpacity={0.01}
          areaChart
          maxValue={maxValue + 2000}
          noOfSections={4}
          yAxisColor='transparent'
          xAxisColor='#e5e7eb'
          rulesColor='#f3f4f6'
          rulesType='solid'
          yAxisTextStyle={{ color: '#9ca3af', fontSize: 10, fontFamily: 'Inter' }}
          xAxisLabelTextStyle={{ color: '#9ca3af', fontSize: 10, fontFamily: 'Inter' }}
          hideDataPoints={false}
          showVerticalLines={false}
          formatYLabel={(val) => `₱${Number(val) / 1000}k`}
          pointerConfig={{
            pointerStripHeight: 140,
            pointerStripColor: COLORS.primary,
            pointerStripWidth: 1,
            pointerColor: COLORS.primary,
            radius: 5,
            pointerLabelWidth: 90,
            pointerLabelHeight: 38,
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: any) => (
              <View
                style={{
                  backgroundColor: COLORS.primary,
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ color: 'white', fontSize: 11, fontWeight: '600' }}>
                  ₱{items[0].value.toLocaleString()}
                </Text>
              </View>
            ),
          }}
        />
      </View>
    </View>
  )
}