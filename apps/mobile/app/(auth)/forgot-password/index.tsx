import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import PillButton from '@/components/buttons/PillButton'

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
      className='p-5'
    >
      <View>
        <TouchableOpacity 
          onPress={() => router.back()}
          className='my-5'
        >
          <IconChevronLeft size={26} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      
      <View className='flex gap-3'>
        <Text className='text-secondary text-4xl font-dmserif'>
          Forgot Password
        </Text>

        <Text className='text-text text-base font-inter'>
          Don’t worry, it happens! We’ll help you reset your password in a few steps.
        </Text>

        <Text className='text-text text-base font-inter'>
          For your security, please select a verified recovery method.
        </Text>

        <View className='flex gap-3 mt-5'>
          <PillButton 
            label='Send via SMS'
            type='outline'
            size='sm'
            leftIconName={IconMessage}
            onPress={() => handleForgotPassword('sms')}
          />

          <PillButton 
            label='Send via Email'
            type='outline'
            size='sm'
            leftIconName={IconMail}
            onPress={() => handleForgotPassword('email')}
          />
        </View>
      </View>
    </ScreenWrapper>
  )
}