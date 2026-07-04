import { View, Text, TouchableOpacity } from 'react-native'

import { Building } from 'lucide-react-native';

import { formatPesoDisplay } from '@repo/utils';

import { useColors } from '@/hooks/useTheme';

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
  const { colors } = useColors();
  const formattedAmount = formatPesoDisplay(amount);

  return (
    <TouchableOpacity
      className='bg-surface rounded-3xl p-4 border border-border'
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View className='flex-row gap-1 items-center'>
        <Building
          size={22}
          color={colors.gray500}
        />
        <Text className='text-foreground font-interSemiBold'>
          {propertyName}
        </Text>
      </View>

      <Text className='text-muted font-interMedium mt-1'>
        {tenantName}
      </Text>
      <View className='flex-row justify-between items-center mt-2'>
        <Text className='text-foreground font-inter text-sm'>
          Due: {dueDate}
        </Text>
        <Text className='text-accent text-base font-interSemiBold'>
          ₱ {formattedAmount}
        </Text>
      </View>
    </TouchableOpacity>
  )
}
