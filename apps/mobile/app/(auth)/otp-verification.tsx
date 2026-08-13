import { View, Text, Pressable } from 'react-native'
import { useRef, useState } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ErrorDialog from '@/components/display/ErrorDialog'

import { IconChevronLeft } from '@tabler/icons-react-native'

import { supabase } from '@repo/supabase'

import { useRegistrationStore } from '@/stores/useRegistrationStore'

import { getProfileSubmitError } from '@repo/utils'

import { useColors } from 'hooks/useTheme'
import { useCountdown } from 'hooks/auth'

import {
  CloseButton,
  InputOTP,
  REGEXP_ONLY_DIGITS,
  type InputOTPRef,
  Button,
} from 'heroui-native'

const OTP_VALIDITY_DURATION = 60 // seconds
const MAX_OTP_ATTEMPTS = 5

export default function OTPVerification() {
  const router = useRouter()
  const { email } = useLocalSearchParams()

  const { colors } = useColors();

  const { data, reset } = useRegistrationStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)

  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState(MAX_OTP_ATTEMPTS)
  const [otpLocked, setOtpLocked] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [otpExpired, setOtpExpired] = useState(false)

  const otpRef = useRef<InputOTPRef>(null)

  const { countdown, reset: resetCountdown } = useCountdown({
    duration: OTP_VALIDITY_DURATION,
  })

  const emailValue = Array.isArray(email) ? email[0] : email

  const clearOtp = () => {
    setOtp('')
    otpRef.current?.clear()
  }

  // Reset the OTP, attempts, and error
  // Then resend the OTP to the user email
  const handleResend = async () => {
    if (resendLoading) return

    setResendLoading(true)
    setOtpError(null)
    setAttemptsRemaining(MAX_OTP_ATTEMPTS)
    setOtpLocked(false)
    setOtpExpired(false)
    clearOtp()
    resetCountdown()

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: emailValue || data.email!,
      })

      if (resendError) {
        setError(resendError.message || 'Something went wrong')
        setErrorDialogOpen(true)
      }
    } finally {
      setResendLoading(false)
    }
  }

  // Check the OTP code and create the user account,
  // then insert the user profile to the database
  const handleVerify = async () => {
    if (loading || otpLocked || otp.length < 6) return

    setLoading(true)
    setOtpError(null)

    try {
      const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
        email: emailValue || data.email!,
        token: otp,
        type: 'signup',
      })

      if (verifyError || !authData.user) throw verifyError ?? new Error('Verification failed')

      const { error: insertError } = await supabase.from('users').insert({
        user_id: authData.user.id,
        email: emailValue || data.email!,
        role: data.userSide ?? 'tenant',
        first_name: data.firstName,
        last_name: data.lastName,
        middle_name: data.middleName ?? null,
        suffix: data.suffixName ?? null,
        gender: data.gender,
        mobile_number: data.mobileNumber,
        birth_date: data.birthDate,
        street_address: data.streetAddress,
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
      const msg: string = (err as any)?.message ?? ''
      const isOtpExpired =
        msg.includes('Token has expired') ||
        msg.includes('otp_expired') ||
        msg.includes('Email link is invalid or has expired')
      const isInvalidOtp =
        msg.includes('invalid_otp') ||
        msg.includes('does not match') ||
        msg.includes('Invalid token')

      if (isOtpExpired) {
        // OTP expired before verify succeeded — no auth user was created, safe to skip signOut
        setOtpExpired(true)
        clearOtp()

        setError('Your verification code has expired. Please request a new one.')
        setErrorDialogOpen(true)
      } else if (isInvalidOtp) {
        // Wrong code — surface inline with attempts remaining
        const remaining = attemptsRemaining - 1
        setAttemptsRemaining(remaining)
        clearOtp()

        if (remaining <= 0) {
          setOtpLocked(true)
          setOtpError('Too many incorrect attempts. Please request a new code.')
        } else {
          setOtpError(`Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} left.`)
        }
      } else {
        // Sign out the user if verification succeeded but inserting profile failed,
        // to prevent inconsistent state where user is authenticated but has no profile
        await supabase.auth.signOut()

        setError(getProfileSubmitError(err))
        setErrorDialogOpen(true)
      }
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
            <IconChevronLeft size={26} color={colors.textPrimary} />
          </CloseButton>

          {/* Title */}
          <Text className="text-2xl text-foreground font-interMedium my-5">
            OTP was Sent!
          </Text>

          {/* Description */}
          <Text className="text-base text-foreground font-inter mb-5">
            We&apos;ve sent a 6-digit verification code to your email address. Please enter the code sent to {maskEmail(emailValue)}.
          </Text>

          {/* OTP Input */}
          <View className="items-center mb-6">
            <InputOTP
              ref={otpRef}
              maxLength={6}
              value={otp}
              onChange={(val) => {
                setOtp(val)
                if (otpError) setOtpError(null)
              }}
              onComplete={handleVerify}
              isInvalid={!!otpError}
              isDisabled={loading || otpLocked}
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

            {otpError && (
              <Text className="text-danger text-sm font-inter mt-3 text-center">
                {otpError}
              </Text>
            )}
          </View>

          {/* Resend Link and Countdown */}
          <View className="flex-row items-center">
            <Text className="text-gray-600 text-base">
              Didn&apos;t get the code?{' '}
            </Text>

            {countdown > 0 && !otpExpired ? (
              <Text className="text-accent text-base font-medium">
                Resend in {countdown}s
              </Text>
            ) : (
              <Pressable
                onPress={handleResend}
                disabled={resendLoading}
                className={resendLoading ? 'opacity-50' : ''}
              >
                <Text className="text-accent text-base font-medium">
                  {resendLoading
                    ? 'Sending...'
                    : otpExpired
                      ? 'Code expired — Resend'
                      : 'Resend'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Verify Button */}
        <Button
          onPress={handleVerify}
          isDisabled={loading || otpLocked || otp.length < 6}
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
