import { View, Text, Image } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'

import { Button } from 'heroui-native'

import { IMAGES } from 'constants/images'

import { useTranslation } from '@/hooks/i18n'

export default function Index() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <ScreenWrapper
      className='p-5'
    >
      <View className='flex-1 items-center justify-center'>
        <Image
          source={IMAGES.shield}
          className='size-60'
        />

        <View className='flex mt-5 gap-3'>
          <Text className='text-lg font-nunitoBold text-center text-foreground'>
            {t("authMobile.verify.introTitle")}
          </Text>

          <Text className='text-bas text-foreground font-inter text-center'>
            {t("authMobile.verify.introBody")}
          </Text>
        </View>
      </View>

      <Button onPress={() => router.push('/(auth)/verify-account/select-id')}>
        <Button.Label>{t("authMobile.verify.continue")}</Button.Label>
      </Button>

      <Button
        variant="tertiary"
        className="mt-3"
        onPress={() => router.push('/(auth)/verify-account/scan-session')}
      >
        <Button.Label>{t("authMobile.verify.scanInstead")}</Button.Label>
      </Button>
    </ScreenWrapper>
  )
}
