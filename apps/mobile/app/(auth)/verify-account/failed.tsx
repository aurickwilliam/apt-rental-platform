import { View, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'

import { Button } from 'heroui-native'

import { IconShieldX } from '@tabler/icons-react-native'

import { useColors } from '@/hooks/useTheme'
import { useTranslation } from '@/hooks/i18n'

export default function Failed() {
  const router = useRouter();
  const { colors } = useColors();
  const { t } = useTranslation();

  const { reason: rawReason } = useLocalSearchParams<{ reason?: string }>();

  // Clamp the reason to keep unbounded/whitespace-only params from breaking
  // the layout; render it only when non-empty.
  const reason = (rawReason ?? '').trim().slice(0, 200);

  return (
    <ScreenWrapper
      className='p-5'
    >
      <View className='flex-1 items-center justify-center gap-5'>
        <View className='rounded-full bg-danger/10 items-center justify-center size-40'>
          <IconShieldX size={96} color={colors.danger} />
        </View>

        <View className='flex gap-2'>
          <Text className='text-3xl text-danger font-nunitoBold text-center'>
            {t("authMobile.verify.failedTitle")}
          </Text>

          <Text className='text-foreground text-base font-inter text-center mx-10'>
            {t("authMobile.verify.failedBody")}
            {reason
              ? ` ${t("authMobile.verify.failedReason", { reason })}`
              : ` ${t("authMobile.verify.failedRetry")}`}
          </Text>
        </View>
      </View>

      <View className='flex gap-3'>
        <Button
          variant="primary"
          onPress={() => router.replace('/(auth)/verify-account')}
        >
          <Button.Label>{t("authMobile.verify.reapply")}</Button.Label>
        </Button>

        <Button
          variant="outline"
          onPress={() => router.replace('/(tabs)/(tenant)/profile')}
        >
          <Button.Label>{t("authMobile.verify.backToProfile")}</Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  )
}
