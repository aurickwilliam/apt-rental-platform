import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'

import { Button, CloseButton } from 'heroui-native'

import {
  IconMessage,
  IconMail,
  IconChevronLeft
} from '@tabler/icons-react-native'

import { COLORS } from '@repo/constants'

export default function Index() {
  const router = useRouter();

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
          <IconChevronLeft size={26} color={COLORS.text} />
        </CloseButton>
      </View>
      
      <View className='flex gap-3'>
        <Text className='text-secondary text-3xl font-nunitoSemiBold'>
          Forgot Password
        </Text>

        <Text className='text-text text-base font-inter'>
          Don’t worry, it happens! We’ll help you reset your password in a few steps.
        </Text>

        <Text className='text-text text-base font-inter'>
          For your security, please select a verified recovery method.
        </Text>

        <View className='flex gap-3 mt-5'>
          {/* Send via SMS */}
          <Button
            variant='outline'
            onPress={() => handleForgotPassword('sms')}
          >
            <IconMessage size={20} color={COLORS.text} />
            <Button.Label className='font-interMedium'>
              Send via SMS
            </Button.Label>
          </Button>

          {/* Send via Email */}
          <Button
            variant='outline'
            onPress={() => handleForgotPassword('email')}
          >
            <IconMail size={20} color={COLORS.text} />
            <Button.Label className='font-interMedium'>
              Send via Email
            </Button.Label>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  )
}