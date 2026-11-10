import { View, Text, Image } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'

import { IMAGES} from '../../../constants/images'

import { Button } from 'heroui-native';

import { useTranslation } from '@/hooks/i18n';

export default function Updated() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <ScreenWrapper 
      className='p-5'
    >
      <View className='flex-1 items-center justify-center gap-10'>
        <Image 
          source={IMAGES.lockReset}
          style={{ width: 175, height: 175 }}
          resizeMode='contain'
        />

        <View>
          <Text className='text-accent text-2xl font-nunitoBold text-center'>
            {t("auth.changePassword.successTitle")}
          </Text>

          <Text className='text-foreground text-base font-inter mt-2 text-center'>
            {t("authMobile.recovery.updatedBody")}
          </Text>
        </View>
      </View>

      {/* Back to Sign In */}
      <Button onPress={() => {
        router.dismissTo('/sign-in');
      }}>
        <Button.Label>
          {t("auth.backToSignIn")}
        </Button.Label>
      </Button>
    </ScreenWrapper>
  )
}