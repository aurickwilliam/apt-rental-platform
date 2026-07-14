import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'

import { Button, CloseButton } from 'heroui-native'

import {
  IconMail,
  IconChevronLeft,
  IconMessageCircle,
} from '@tabler/icons-react-native'

import { useColors } from 'hooks/useTheme';

export default function Index() {
  const router = useRouter();
  const { colors } = useColors();

  // Handle Forgot Password Logic
  const handleForgotPassword = (method: 'sms' | 'email') => {
    if (method === 'sms') {
      router.push(`/forgot-password/otp-verification?method=sms`);
    } else {
      router.push(`/forgot-password/otp-verification?method=email`);
    }
  }

  return (
    <ScreenWrapper
      className='px-5'
    >
      <View>
        <CloseButton 
          onPress={() => router.back()}
          className='my-5'
        >
          <IconChevronLeft size={26} color={colors.textPrimary} />
        </CloseButton>
      </View>
      
      <View className='flex gap-3'>
        <Text className='text-secondary text-3xl font-nunitoSemiBold'>
          Forgot Password
        </Text>

        <Text className='text-foreground text-base font-inter'>
          Don’t worry, it happens! We’ll help you reset your password in a few steps.
        </Text>

        <Text className='text-foreground text-base font-inter'>
          For your security, please select a verified recovery method.
        </Text>

        <View className='flex gap-3 mt-5'>
          {/* Send via SMS */}
          <Button
            variant='outline'
            onPress={() => handleForgotPassword('sms')}
          >
            <IconMessageCircle size={20} color={colors.textPrimary} />
            <Button.Label className='font-interMedium'>
              Send via SMS
            </Button.Label>
          </Button>

          {/* Send via Email */}
          <Button
            variant='outline'
            onPress={() => handleForgotPassword('email')}
          >
            <Mail size={20} color={colors.textPrimary} />
            <Button.Label className='font-interMedium text-foreground'>
              Send via Email
            </Button.Label>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  )
}