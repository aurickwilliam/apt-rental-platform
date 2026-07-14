import { View, Text } from 'react-native'

import { IconHomePlus } from '@tabler/icons-react-native';

import { useColors } from 'hooks/useTheme';

export default function TenancyEmptyState() {
  const { colors } = useColors();

  return (
    <View className='flex-1 bg-background items-center justify-center gap-4 py-20'>
      <IconHomePlus size={64} color={colors.primary} />
      
      <View className='items-center gap-1'>
        <Text className='text-foreground text-xl font-interSemiBold text-center'>
          No Active Tenancy
        </Text>
        <Text className='text-gray-400 text-base font-inter text-center px-8'>
          You&apos;re not currently renting any apartment. Browse listings to find your next home.
        </Text>
      </View>
    </View>
  )
}