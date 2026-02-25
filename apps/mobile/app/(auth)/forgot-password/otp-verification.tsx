import { View, Text, TextInput, Pressable, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import PillButton from '@/components/buttons/PillButton';

import { IconChevronLeft } from '@tabler/icons-react-native';

import { COLORS } from '@repo/constants';

export default function OTPVerification() {
  const { method } = useLocalSearchParams();
  const router = useRouter();

  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const [countdown, setCountdown] = useState<number>(30);
  const inputRefs = useRef<TextInput[]>([]);

  // Dummy mobile number for demonstration
  // TODO: Replace with actual mobile number from user data when integrating with backend
  const mobileNum = '1234567890';
  const email = 'johndoe@gmail.com';

  // Get the last 4 digit of mobile number
  const lastFourDigits = String(mobileNum).slice(-4);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      // Minus 1 every 1000 milliseconds
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);

      // Cleanup Function
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle the OTP Input Change
  const handleChange = (index: number, text: string) => {
    // Check if the input is a number
    if (text && !/^\d+$/.test(text)) return;

    const newOTP = [...otp];
    newOTP[index] = text;
    setOtp(newOTP);

    // Focus on the next input field if it exists
    if (index < 3 && text.length === 1) {
      inputRefs.current[index + 1].focus();
    }
  }

  // Handle the OTP if backspace is pressed
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  }

  // Handle resend of OTP
  const handleResend = () => {
    // Reset OTP and start countdown
    setCountdown(30);
    setOtp(['', '', '', '']);
    inputRefs.current[0].focus();

    // TODO: Implement resend OTP to Mobile Number functionality
  }

  // Handle OTP Verification
  const handleVerify = () => {
    // TODO: Verify the OTP with backend API
    console.log("OTP Verified");
    router.push('/(auth)/forgot-password/reset-password');
  }

  const userInfo = method === 'sms' ? `****-***-${lastFourDigits}` : email;

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
        <Text className='text-text text-2xl font-poppinsSemiBold'>
          OTP was Sent!
        </Text>

        {/* Description */}
        <Text className="text-lg text-text font-poppinsRegular mb-5">
          We&apos;ve sent a 4-digit code to your {method === 'sms' ? 'phone number' : 'email'}.
          Please enter the code sent to your {userInfo}.
        </Text>

        {/* OTP Input Fields*/}
        <View className="flex-row items-center justify-between mb-6">
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) inputRefs.current[index] = ref as TextInput;
              }}
              className="w-24 h-24 border-2 border-gray-300 rounded-2xl text-center text-4xl text-text font-interMedium"
              value={digit}
              onChangeText={(text) => handleChange(index, text)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Resend Link and Countdown */}
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

      {/* Verify OTP */}
      <PillButton
        label='Verify OTP'
        onPress={handleVerify}
        isFullWidth
      />
    </ScreenWrapper>
  )
}