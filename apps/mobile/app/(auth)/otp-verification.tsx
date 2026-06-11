import { View, Text, Pressable } from 'react-native'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ErrorDialog from '@/components/display/ErrorDialog'

import { COLORS } from '@repo/constants'

import { IconChevronLeft } from '@tabler/icons-react-native'

import { supabase } from '@repo/supabase'
import { useRegistrationStore } from '@/stores/useRegistrationStore'

import { getProfileSubmitError } from '@repo/utils'

import {
  CloseButton,
  InputOTP,
  REGEXP_ONLY_DIGITS,
  type InputOTPRef,
  Button,
} from 'heroui-native'

export default function OTPVerification() {
  const router = useRouter()
  const { email } = useLocalSearchParams()

  const { data, reset } = useRegistrationStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)

  const [otp, setOtp] = useState('')
  const [countdown, setCountdown] = useState(30)
  const otpRef = useRef<InputOTPRef>(null)

  const emailValue = Array.isArray(email) ? email[0] : email

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResend = async () => {
    setCountdown(30)
    setOtp('')
    otpRef.current?.clear()

    await supabase.auth.resend({
      type: 'signup',
      email: emailValue || data.email!,
    })
  }

  const handleVerify = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
        email: emailValue || data.email!,
        token: otp,
        type: 'signup',
      })

      if (verifyError || !authData.user) throw verifyError ?? new Error('Verification failed')

      const age = new Date().getFullYear() - new Date(data.birthDate!).getFullYear()

      const { error: insertError } = await supabase.from('users').insert({
        user_id: authData.user.id,
        email: emailValue || data.email!,
        role: data.userSide ?? 'tenant',
        first_name: data.firstName,
        last_name: data.lastName,
        middle_name: data.middleName ?? null,
        age,
        gender: data.gender,
        mobile_number: data.mobileNumber,
        birth_date: data.birthDate,
        street_address: data.currentAddress,
        barangay: data.barangay,
        city: data.city,
        province: data.province,
        postal_code: parseInt(data.postalCode!, 10),
      })

      if (insertError) throw insertError

      const userSide = data.userSide
      reset()

      router.dismissAll()
      if (userSide === 'tenant') {
        router.replace('/personalization/step-one')
      } else {
        router.replace('/(tabs)/(landlord)/dashboard')
      }

    } catch (err: any) {
      setError(getProfileSubmitError(err))
      setErrorDialogOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const maskEmail = (email: string) => {
    const [username, domain] = email.split('@')
    if (username.length <= 2) return `${username[0]}***@${domain}`
    return `${username[0]}****${username[username.length - 1]}@${domain}`
  }

  return (
    <ScreenWrapper className='p-5'>
      <View className='flex-1 justify-between'>
        <View>
          {/* Back button */}
          <CloseButton
            variant="ghost"
            className="-ml-2"
            onPress={router.back}
          >
            <IconChevronLeft size={26} color={COLORS.text} />
          </CloseButton>

          {/* Title */}
          <Text className="text-2xl text-text font-interMedium my-5">
            OTP was Sent!
          </Text>

          {/* Description */}
          <Text className="text-base text-text font-inter mb-5">
            We&apos;ve sent a 6-digit verification code to your email address. Please enter the code sent to {maskEmail(emailValue)}.
          </Text>

          {/* OTP Input */}
          <View className="items-center mb-6">
            <InputOTP
              ref={otpRef}
              maxLength={6}
              value={otp}
              onChange={setOtp}
              isInvalid={!!error}
              isDisabled={loading}
              pattern={REGEXP_ONLY_DIGITS}
              inputMode="numeric"
              textInputProps={{
                textContentType: 'oneTimeCode',
                autoComplete: 'one-time-code',
              }}
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

        {/* Verify Button */}
        <Button
          onPress={handleVerify}
          isDisabled={loading || otp.length < 6}
        >
          <Button.Label>
            {loading ? 'Creating Account...' : 'Verify & Create Account'}
          </Button.Label>
        </Button>
      </View>

      {/* Error Dialog */}
      <ErrorDialog 
        isOpen={errorDialogOpen}
        onClose={() => setErrorDialogOpen(false)}
        message={error}
      />

    </ScreenWrapper>
  )
}