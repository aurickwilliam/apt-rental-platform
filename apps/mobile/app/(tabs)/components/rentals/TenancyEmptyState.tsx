import { View, Text } from 'react-native'

import { IconHomeOff } from '@tabler/icons-react-native';

import { COLORS } from '@repo/constants';

export default function TenancyEmptyState() {
  return (
    <View className='flex-1 items-center justify-center gap-4 py-20'>
      <IconHomeOff size={64} color={COLORS.grey} />
      
      <View className='items-center gap-1'>
        <Text className='text-text text-xl font-poppinsSemiBold text-center'>
          No Active Tenancy
        </Text>
        <Text className='text-grey-500 text-base font-inter text-center px-8'>
          You&apos;re not currently renting any apartment. Browse listings to find your next home.
        </Text>
      </View>
    </View>
  )
}