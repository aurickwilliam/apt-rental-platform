import { View, Text, Pressable } from 'react-native'
import { useEffect, useRef, useState } from 'react'

import Ionicons from '@expo/vector-icons/build/Ionicons'
import { useRouter, useLocalSearchParams } from 'expo-router'

import ScreenWrapper from '../../components/ScreenWrapper'
import PillButton from '../../components/PillButton'
import { COLORS } from '../../constants/colors'
import { TextInput } from 'react-native-gesture-handler'

export default function OTPVerification() {
  const router = useRouter();
  const { mobileNum } = useLocalSearchParams();

  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const [countdown, setCountdown] = useState<number>(30);
  const inputRefs = useRef<TextInput[]>([]);

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

    // TODO: Implement resend OTP to Email functionality
  }

  const handleVerify = () => {
    console.log("OTP Verified");
    router.replace("/personalization/step-one");
  }

  return (
    <ScreenWrapper hasInput scrollable className='p-5'>
      {/* Back button */}
      <Pressable className="mb-3" onPress={router.back}>
        <Ionicons name="arrow-back" size={30} color={COLORS.text} />
      </Pressable>

      {/* Title */}
      <Text className="text-3xl text-text font-poppinsSemiBold my-5">
        OTP was Sent!
      </Text>

      {/* Description */}
      <Text className="text-lg text-text font-poppinsRegular mb-5">
        We’ve sent a 4-digit code to your phone number.
        Please enter the code sent to your number ending in ****-***-{lastFourDigits}.
      </Text>

      {/* OTP Input Fields*/}
      <View className="flex-row items-center justify-between mb-6">
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              if (ref) inputRefs.current[index] = ref as TextInput;
            }}
            className="w-24 h-24 border-2 border-gray-300 rounded-2xl text-center text-4xl
             text-text font-interMedium"
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


      {/* Spacer */}
      <View className="flex-1" />

      {/* Create Account Button */}
      <PillButton
        label='Create Account'
        onPress={handleVerify}
        isFullWidth
      />
    </ScreenWrapper>
  )
}
