import { View, Text, Pressable, TouchableOpacity } from 'react-native'
import { useEffect, useRef, useState } from 'react'
import { TextInput } from 'react-native-gesture-handler'
import { useRouter, useLocalSearchParams } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import PillButton from 'components/buttons/PillButton'

import { COLORS } from '@repo/constants'

import { IconChevronLeft } from '@tabler/icons-react-native'

import { supabase } from '@repo/supabase';

import { useRegistrationStore } from '@/store/useRegistrationStore'

export default function OTPVerification() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const { data, reset } = useRegistrationStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [countdown, setCountdown] = useState<number>(30);
  const inputRefs = useRef<TextInput[]>([]);

  const emailValue = Array.isArray(email) ? email[0] : email;

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle the OTP Input Change
  const handleChange = (index: number, text: string) => {
    // Handle paste — if user pastes a full OTP string
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').slice(0, 6).split('');
      const newOTP = Array(6).fill('');
      digits.forEach((d, i) => { newOTP[i] = d; });
      setOtp(newOTP);
      // Focus on the last filled box or the last box
      const focusIndex = Math.min(digits.length, 5);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    // Check if the input is a number
    if (text && !/^\d+$/.test(text)) return;

    const newOTP = [...otp];
    newOTP[index] = text;
    setOtp(newOTP);

    // Focus on the next input field if it exists — fixed: was index < 3
    if (index < 5 && text.length === 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  // Handle the OTP if backspace is pressed
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  // Handle resend of OTP
  const handleResend = () => {
    setCountdown(30);
    setOtp(Array(6).fill('')); // fixed: was ['', '', '', ''] (only 4)
    inputRefs.current[0]?.focus();

    // TODO: Implement resend OTP to Email functionality
  }

  const handleVerify = async () => {
    setLoading(true);
    setError(null);

    try {
      const age = new Date().getFullYear() - new Date(data.birthDate!).getFullYear();
      const userSide = data.userSide;

      const { error } = await supabase.auth.signUp({
        email: emailValue || data.email!,
        password: data.password!,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            middle_name: data.middleName,
            gender: data.gender,
            mobile_number: data.mobileNumber,
            birth_date: data.birthDate,
            age,
            street_address: data.currentAddress,
            barangay: data.barangay,
            city: data.city,
            province: data.province,
            postal_code: data.postalCode,
            role: data.userSide,
          }
        }
      });

      if (error) throw error;

      reset();

      if (userSide === 'tenant') {
        router.replace('/personalization/step-one');
      } else {
        router.replace('/(tabs)/(landlord)/dashboard');
      }

    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  // Hide or mask the email address for privacy
  const maskEmail = (email: string) => {
    const [username, domain] = email.split("@");

    if (username.length <= 2) {
      return `${username[0]}***@${domain}`;
    }

    const maskedUsername = username[0] + "****" + username[username.length - 1];
    return `${maskedUsername}@${domain}`;
  };

  const isOtpComplete = otp.every(d => d !== '');

  return (
    <ScreenWrapper className='p-5'>
      <View className='flex-1 justify-between'>
        <View>
          {/* Back button */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="mb-3"
            onPress={router.back}
          >
            <IconChevronLeft size={30} color={COLORS.text} />
          </TouchableOpacity>

          {/* Title */}
          <Text className="text-3xl text-text font-poppinsSemiBold my-5">
            OTP was Sent!
          </Text>

          {/* Description */}
          <Text className="text-lg text-text font-poppinsRegular mb-5">
            We've sent a 6-digit verification code to your email address. Please enter the code sent to {maskEmail(emailValue)}.
          </Text>

          {/* OTP Input Fields*/}
          <View className="flex-row items-center justify-between mb-6">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  if (ref) inputRefs.current[index] = ref as TextInput;
                }}
                className="size-16 border-2 border-gray-300 rounded-2xl text-center text-4xl text-text font-interMedium"
                value={digit}
                onChangeText={(text) => handleChange(index, text)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={6}
                textContentType="oneTimeCode"   // iOS autofill
                autoComplete="one-time-code"    // Android autofill
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

        {error && (
          <Text className="text-red-500 text-sm">{error}</Text>
        )}

        {/* Create Account Button */}
        <PillButton
          label={loading ? 'Creating Account...' : 'Verify & Create Account'}
          onPress={handleVerify}
          isFullWidth
          isDisabled={loading || !isOtpComplete}
        />
      </View>
    </ScreenWrapper>
  )
}
