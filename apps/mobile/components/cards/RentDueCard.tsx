import { View, Text, TouchableOpacity } from 'react-native'

import { IconBuildings } from "@tabler/icons-react-native"

import { COLORS } from '@repo/constants'
import { formatCurrency } from '@repo/utils';

interface RentDueCardProps {
  tenantName: string;
  propertyName: string;
  dueDate: string;
  amount: number;
  onPress: () => void;
}

export default function RentDueCard({
  tenantName,
  propertyName,
  dueDate,
  amount,
  onPress
}: RentDueCardProps){

  const formattedAmount = formatCurrency(amount);

  return (
    <TouchableOpacity 
      className='bg-white rounded-2xl p-4 border border-grey-200'
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View className='flex-row gap-2 items-center'>
        <IconBuildings 
          size={24} 
          color={COLORS.grey} 
        />
        <Text className='text-text font-poppinsMedium'>
          {propertyName}
        </Text>
      </View>

      <Text className='text-grey-500 font-interMedium mt-1'>
        {tenantName}
      </Text>
      <View className='flex-row justify-between items-center mt-2'>
        <Text className='text-text font-inter text-sm'>
          Due: {dueDate}
        </Text>
        <Text className='text-primary text-base font-interSemiBold'>
          ₱ {formattedAmount}
        </Text>
      </View>
    </TouchableOpacity>
  )
}