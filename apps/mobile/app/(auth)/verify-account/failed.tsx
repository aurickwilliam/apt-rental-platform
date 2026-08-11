import { View, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'

import { Button } from 'heroui-native'

import { IconShieldX } from '@tabler/icons-react-native'

import { useColors } from '@/hooks/useTheme'

export default function Failed() {
  const router = useRouter();
  const { colors } = useColors();

  const { reason } = useLocalSearchParams<{ reason?: string }>();

  return (
    <ScreenWrapper
      className='p-5'
    >
      <View className='flex-1 items-center justify-center gap-5'>
        <View className='rounded-full bg-danger/10 items-center justify-center size-40'>
          <IconShieldX size={96} color={colors.danger} />
        </View>

        <View className='flex gap-2'>
          <Text className='text-3xl text-danger font-interSemiBold text-center'>
            Verification Failed
          </Text>

          <Text className='text-foreground text-base font-inter text-center mx-10'>
            We couldn&apos;t verify your identity with the documents provided.
            {reason ? ` Reason: ${reason}` : ' Please try again with a clearer photo or a different ID.'}
          </Text>
        </View>
      </View>

      <View className='flex gap-3'>
        <Button
          variant="primary"
          onPress={() => router.replace('/(auth)/verify-account')}
        >
          <Button.Label>Re-Apply for Verification</Button.Label>
        </Button>

        <Button
          variant="outline"
          onPress={() => router.replace('/(tabs)/(tenant)/profile')}
        >
          <Button.Label>Back to Profile</Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  )
}
