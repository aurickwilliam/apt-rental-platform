import { View, Text, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import PillButton from '@/components/buttons/PillButton';

import { Button, CloseButton, InputOTP, type InputOTPRef } from 'heroui-native';

import { IconChevronLeft } from '@tabler/icons-react-native';

import { COLORS } from '@repo/constants';

export default function OTPVerification() {
  const { method } = useLocalSearchParams();
  const router = useRouter();

  const [value, setValue] = useState('');
  const ref = useRef<InputOTPRef>(null);

  const [countdown, setCountdown] = useState<number>(30);

  const mobileNum = '1234567890';
  const email = 'johndoe@gmail.com';

  const lastFourDigits = String(mobileNum).slice(-4);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = () => {
    setCountdown(30);
    setValue('');
    ref.current?.clear();
  }

  const handleVerify = () => {
    console.log("OTP Verified:", value);
    router.push('/(auth)/forgot-password/reset-password');
  }

  const userInfo = method === 'sms' ? `****-***-${lastFourDigits}` : email;

  return (
    <ScreenWrapper className='px-5'>
      <View>
        <CloseButton 
          onPress={() => router.back()}
          className='my-5'
        >
          <IconChevronLeft size={26} color={COLORS.text} />
        </CloseButton>
      </View>

      <View className='flex gap-3'>
        <Text className='text-text text-2xl font-interSemiBold'>
          OTP was Sent!
        </Text>

        <Text className="text-base text-text font-inter mb-5">
          We&apos;ve sent a 4-digit code to your {method === 'sms' ? 'phone number' : 'email'}.
          Please enter the code sent to your {userInfo}.
        </Text>

        <View className="items-center mb-6">
          <InputOTP
            ref={ref}
            value={value}
            onChange={setValue}
            onComplete={handleVerify}
            maxLength={6}
            inputMode="numeric"
          >
            <InputOTP.Group>
              <InputOTP.Slot index={0} />
              <InputOTP.Slot index={1} />
              <InputOTP.Slot index={2} />
            </InputOTP.Group>
            <InputOTP.Separator />
            <InputOTP.Group>
              <InputOTP.Slot index={3} />
              <InputOTP.Slot index={4} />
              <InputOTP.Slot index={5} />
            </InputOTP.Group>
          </InputOTP>
        </View>

        <View className="flex-row items-center">
          <Text className="text-gray-600 text-base">
            Didn&apos;t get the code?{' '}
          </Text>
          {countdown > 0 ? (
            <Text className="text-blue-500 text-base font-medium">
              Resend in {countdown}s
            </Text>
          ) : (
            <Pressable onPress={handleResend}>
              <Text className="text-blue-500 text-base font-medium">
                Resend
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <View className='flex-1' />

      <Button onPress={handleVerify}>
        <Button.Label>
          Verify OTP
        </Button.Label>
      </Button>
    </ScreenWrapper>
  )
}