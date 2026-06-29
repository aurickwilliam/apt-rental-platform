import { View, Text } from 'react-native'
import { useRouter } from 'expo-router';

import { ClipboardX } from 'lucide-react-native';

import { useColors } from 'hooks/useTheme';

import { Button } from 'heroui-native';

export default function ApplicationsEmptyState() {
  const router = useRouter();
  const { colors } = useColors();

  return (
    <View className='flex-1 bg-background items-center justify-center gap-4 py-20'>
      <ClipboardX size={64} color={colors.primary} />

      <View className='items-center gap-1'>
        <Text className='text-foreground text-xl font-interSemiBold text-center'>
          No Applications Yet
        </Text>
        <Text className='text-gray-400 text-base font-inter text-center px-8'>
          You haven&apos;t applied to any apartment yet. Browse listings and submit an application to get started.
        </Text>
      </View>

      <Button onPress={() => router.push('/(tabs)/(tenant)/search')}>
        <Button.Label>Browse Listings</Button.Label>
      </Button>
    </View>
  )
}
