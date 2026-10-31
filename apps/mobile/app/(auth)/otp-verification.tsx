import { View, Text, Pressable } from 'react-native'
import { useRef, useState } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ErrorDialog from '@/components/display/ErrorDialog'

import { IconChevronLeft } from '@tabler/icons-react-native'

import { supabase } from '@repo/supabase'

import { useRegistrationStore } from '@/stores/useRegistrationStore'
import { usePortalStore } from '@/stores/usePortalStore'
import { clearQueryClient } from '@/utils/queryClient'
import { isProfileMissing, profileMissingRoute } from '@/service/auth/profileMissingService'
import { completeMobileRegistration } from '@/service/auth/registrationService'
import { getRegistrationAcceptanceErrors, requireRegistrationAcceptance } from '@/service/auth/registrationAcceptance'

import {
  MAX_OTP_ATTEMPTS,
  getEmailCodeRequestError,
  getOtpAttemptError,
  getProfileSubmitError,
  parseResendWaitSeconds,
} from '@repo/utils'

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

export default function OTPVerification() {
  const router = useRouter()
  const { email, mode } = useLocalSearchParams()
  // Opened from sign-in for an account whose email was never confirmed: there
  // is no sign-up form data, so a verified code continues at "finish profile".
  const isConfirmMode = (Array.isArray(mode) ? mode[0] : mode) === 'confirm'

  const { colors } = useColors();

  const { data, reset } = useRegistrationStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [acceptanceError, setAcceptanceError] = useState<string | null>(null)

  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState(MAX_OTP_ATTEMPTS)
  const [otpLocked, setOtpLocked] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

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
    if (!isConfirmMode) {
      try {
        requireRegistrationAcceptance(data.acceptance)
      } catch (err) {
        setAcceptanceError(err instanceof Error ? err.message : 'Please read and accept both policies.')
        return
      }
    }

    setResendLoading(true)
    setOtpError(null)

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: emailValue || data.email!,
      })

      if (resendError) {
        // Supabase throttles resends ("...only request this after N seconds"):
        // wait out the stated time instead of showing its raw message.
        const waitSeconds = parseResendWaitSeconds(resendError.message)
        if (waitSeconds !== null) {
          resetCountdown(waitSeconds)
          return
        }
        setError(getEmailCodeRequestError(resendError.message))
        setErrorDialogOpen(true)
        return
      }

      setAttemptsRemaining(MAX_OTP_ATTEMPTS)
      setOtpLocked(false)
      clearOtp()
      resetCountdown()
    } finally {
      setResendLoading(false)
    }
  }

  // Check the OTP code and create the user account,
  // then insert the user profile to the database
  const handleVerify = async () => {
    if (loading || otpLocked || otp.length < 6) return
    if (!isConfirmMode) {
      try {
        requireRegistrationAcceptance(data.acceptance)
        if (!data.email || (emailValue && emailValue.trim().toLowerCase() !== data.email.trim().toLowerCase())) {
          setAcceptanceError('Your signup details are no longer available. Return to signup and review the policies again.')
          return
        }
      } catch (err) {
        setAcceptanceError(err instanceof Error ? err.message : 'Please read and accept both policies.')
        return
      }
    }

    setLoading(true)
    setOtpError(null)

    let emailVerified = false

    try {
      const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
        email: emailValue || data.email!,
        token: otp,
        type: 'signup',
      })

      if (verifyError || !authData.user) throw verifyError ?? new Error('Verification failed')
      emailVerified = true

      if (isConfirmMode) {
        clearQueryClient()
        if (await isProfileMissing(authData.user.id)) {
          router.replace(profileMissingRoute(authData.user.email))
        } else {
          router.replace('/')
        }
        return
      }

      const userSide = data.userSide
      if (userSide !== 'tenant' && userSide !== 'landlord') throw new Error('Invalid account type.')

      if (!data.profileDetails || !authData.user.email || authData.user.email.toLowerCase() !== data.email?.trim().toLowerCase()) {
        throw new Error('Your signup details are no longer available. Please sign in to finish setting up your profile.')
      }
      requireRegistrationAcceptance(data.acceptance)
      await completeMobileRegistration({
        details: data.profileDetails,
        role: userSide,
        acceptance: data.acceptance,
        source: 'mobile_registration',
        expectedAuthId: authData.user.id,
      })

      await usePortalStore.getState().switchTo(authData.user.id, [userSide], userSide)
      reset()

      router.dismissAll()
      if (userSide === 'tenant') {
        router.replace('/personalization/step-one')
      } else {
        router.replace('/(tabs)/(landlord)/dashboard')
      }

    } catch (err: any) {
      const acceptanceErrors = getRegistrationAcceptanceErrors(err)
      if (acceptanceErrors) {
        if (emailVerified) {
          clearQueryClient()
          await supabase.auth.signOut()
        }
        reset()
        setAcceptanceError(acceptanceErrors.version ?? 'Please return to signup and read and accept both policies.')
        return
      }
      const msg: string = (err as any)?.message ?? ''
      // Supabase answers a wrong code and an old code with the same
      // "Token has expired or is invalid", so both are treated as an
      // incorrect-or-expired code; the resend link only appears after its
      // countdown, never because of this error.
      const isInvalidOtp =
        msg.includes('Token has expired') ||
        msg.includes('otp_expired') ||
        msg.includes('invalid_otp') ||
        msg.includes('does not match') ||
        msg.includes('Invalid token') ||
        msg.includes('Email link is invalid or has expired')

      if (isInvalidOtp) {
        // Wrong or expired code — surface inline with attempts remaining
        const remaining = attemptsRemaining - 1
        setAttemptsRemaining(remaining)
        clearOtp()

        if (remaining <= 0) setOtpLocked(true)
        setOtpError(getOtpAttemptError(remaining))
      } else {
        // Sign out the user if verification succeeded but inserting profile failed,
        // to prevent inconsistent state where user is authenticated but has no profile
        clearQueryClient()
        await supabase.auth.signOut()

        // Once the code is accepted the account exists; signing in continues
        // at "finish your profile" if the profile write is what failed.
        const message = getProfileSubmitError(err)
        setError(
          emailVerified
            ? `${message} Your email is verified, so you can sign in to finish setting up your profile.`
            : message,
        )
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
          <Text className="text-2xl text-foreground font-nunitoBold my-5">
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
          {acceptanceError && (
            <View className="gap-2 mt-4">
              <Text accessibilityRole="alert" className="text-danger text-sm">{acceptanceError}</Text>
              <Text className="text-sm text-muted">If your email is already verified, sign in to finish your profile and review the policies.</Text>
              <Button variant="secondary" onPress={() => { reset(); router.replace('/sign-in') }}>
                <Button.Label>Back to sign in</Button.Label>
              </Button>
            </View>
          )}

          {/* Resend Link and Countdown */}
          <View className="flex-row items-center">
            <Text className="text-gray-600 text-base">
              Didn&apos;t get the code?{' '}
            </Text>

            {countdown > 0 ? (
              <Text className="text-accent text-base font-nunitoSemiBold">
                Resend in {countdown}s
              </Text>
            ) : (
              <Pressable
                onPress={handleResend}
                disabled={resendLoading}
                className={resendLoading ? 'opacity-50' : ''}
              >
                <Text className="text-accent text-base font-nunitoSemiBold">
                  {resendLoading ? 'Sending...' : 'Resend'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Verify Button */}
        <Button
          onPress={handleVerify}
          isDisabled={loading || otpLocked || otp.length < 6 || !!acceptanceError}
        >
          <Button.Label>
            {loading
              ? (isConfirmMode ? 'Verifying...' : 'Creating Account...')
              : (isConfirmMode ? 'Verify Email' : 'Verify & Create Account')}
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
