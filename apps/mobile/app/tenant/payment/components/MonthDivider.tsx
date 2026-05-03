import { View, Text } from 'react-native'

interface MonthDividerProps {
  month: string;
  year: string;
}

export default function MonthDivider({ month, year}: MonthDividerProps) {
  return (
    <View className='flex-row gap-5 items-center justify-between my-5'>
      <View className='flex-1 h-[2px] bg-gray-300' />
      
      <View className='bg-secondary px-4 py-1 rounded-full'>
        <Text className='text-white text-base font-interMedium'>
          {month} {year}
        </Text>
      </View>

      <View className='flex-1 h-[2px] bg-gray-300' />
    </View>
  )
}