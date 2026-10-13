import { View, Text, Pressable } from 'react-native'
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { Redirect, useNavigation, useRouter } from 'expo-router';

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import AppInput from '@/components/inputs/AppInput';
import ErrorDialog from '@/components/display/ErrorDialog';

import { Button, FieldError, Label, Spinner, TextField } from 'heroui-native';

import { usePasswordValidation } from '@repo/hooks';
import { useColors } from '@/hooks/useTheme';
import { usePasswordRecoveryStore } from '@/stores/usePasswordRecoveryStore';
import { clearQueryClient } from '@/utils/queryClient';
import {
  endPasswordRecovery,
  hasActiveRecoverySession,
  PasswordRecoveryError,
  updateRecoveredPassword,
} from '@/service/auth/passwordRecoveryService';

import { IconEye, IconEyeOff } from '@tabler/icons-react-native';

type SessionCheck = 'checking' | 'valid' | 'invalid';

// Shown under the password field; other failures open the error dialog.
const INLINE_PASSWORD_ERRORS = new Set(['same_password', 'weak_password']);
const GENERIC_ERROR = 'Something went wrong. Please try again.';

export default function ResetPassword() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useColors();
  const resetRecovery = usePasswordRecoveryStore((state) => state.reset);

  const [submitted, setSubmitted] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sessionCheck, setSessionCheck] = useState<SessionCheck>('checking');
  const [saving, setSaving] = useState(false);
  const [serverPasswordError, setServerPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restartAfterError, setRestartAfterError] = useState(false);

  // Set when the screen is left on purpose (success or expired session), so
  // the leave handler doesn't treat it as an abandoned reset.
  const leavingRef = useRef(false);

  const requiredFields = [
    'password',
    'confirmPassword',
  ]

  // Password validation hook
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    passwordRequirements,
    isPasswordValid,
  } = usePasswordValidation();

  // Only reachable with the session a verified recovery code created.
  useEffect(() => {
    let active = true;
    hasActiveRecoverySession()
      .then((valid) => {
        if (!active) return;
        // No recovery to abandon: the redirect below is not a leave.
        if (!valid) leavingRef.current = true;
        setSessionCheck(valid ? 'valid' : 'invalid');
      })
      .catch((err: unknown) => {
        console.error('Password recovery session check failed:', err);
        if (active) setSessionCheck('invalid');
      });
    return () => {
      active = false;
    };
  }, []);

  // Leaving without finishing (back button, swipe, hardware back) abandons
  // the reset: sign this device out so the recovery session isn't kept.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (leavingRef.current) return;
      leavingRef.current = true;
      resetRecovery();
      void endPasswordRecovery();
    });
    return unsubscribe;
  }, [navigation, resetRecovery]);

  if (sessionCheck === 'invalid') {
    return <Redirect href="/forgot-password" />;
  }

  // Return error message if field is required and not filled out after form submission
  const getError = (field: string) => {
    if (submitted && requiredFields.includes(field) && (!password?.trim() || !confirmPassword?.trim())) {
      return 'This field is required';
    }

    if (submitted && field === 'password' && !isPasswordValid) {
      return 'Password does not meet the requirements or password does not match';
    }

    if (submitted && field === 'confirmPassword' && password !== confirmPassword) {
      return 'Passwords do not match';
    }

    if (field === 'password' && serverPasswordError) {
      return serverPasswordError;
    }

    return undefined;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (serverPasswordError) setServerPasswordError(null);
  };

  const finishRecovery = async () => {
    leavingRef.current = true;
    setPassword('');
    setConfirmPassword('');
    resetRecovery();
    // A reset may follow a compromise, so end the account's other sessions too.
    await endPasswordRecovery('global');
    clearQueryClient();
    router.dismissAll();
    router.replace('/forgot-password/updated');
  };

  const restartRecovery = async () => {
    leavingRef.current = true;
    await endPasswordRecovery();
    router.replace('/forgot-password');
  };

  const handleErrorClose = () => {
    setError(null);
    if (restartAfterError) void restartRecovery();
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (saving || sessionCheck !== 'valid') return;
    setSubmitted(true);

    if (!isPasswordValid) {
      return;
    }

    setSaving(true);
    setServerPasswordError(null);
    try {
      await updateRecoveredPassword(password);
      await finishRecovery();
    } catch (err) {
      if (!(err instanceof PasswordRecoveryError)) {
        console.error('Password reset failed:', err);
        setError(GENERIC_ERROR);
      } else if (INLINE_PASSWORD_ERRORS.has(err.reason)) {
        setServerPasswordError(err.message);
      } else if (err.reason === 'session_expired') {
        // Restart only after the message is read (see handleErrorClose).
        setRestartAfterError(true);
        setError(err.message);
      } else {
        setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }
  return (
    <ScreenWrapper className="p-5">
      <View className="flex gap-1">
        <Text className="text-3xl text-foreground font-nunitoBold">
          Reset Password
        </Text>

        <Text className="text-base text-foreground font-inter">
          Almost done! Let’s set a fresh new password.
        </Text>
      </View>

      <View className="flex gap-3 mt-5">
        {/* Password Field */}
        <TextField isRequired isInvalid={!!getError("password")}>
          <Label>Password:</Label>
          <View className="w-full flex-row items-center">
            <AppInput
              placeholder="Create a password"
              secureTextEntry={!showPassword}
              className="flex-1 pr-10"
              value={password}
              onChangeText={handlePasswordChange}
            />

            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-3"
            >
              {showPassword ? (
                <IconEyeOff size={18} color={colors.textSecondary} />
              ) : (
                <IconEye size={18} color={colors.textSecondary} />
              )}
            </Pressable>
          </View>

          {!!getError("password") && (
            <FieldError>{getError("password")}</FieldError>
          )}
        </TextField>

        {/* Confirm Password Field */}
        <TextField isRequired isInvalid={!!getError("confirmPassword")}>
          <Label>Confirm Password:</Label>
          <View className="w-full flex-row items-center">
            <AppInput
              placeholder="Confirm your password"
              secureTextEntry={!showConfirmPassword}
              className="flex-1 pr-10"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
              }}
            />

            <Pressable
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3"
            >
              {showConfirmPassword ? (
                <IconEyeOff size={18} color={colors.textSecondary} />
              ) : (
                <IconEye size={18} color={colors.textSecondary} />
              )}
            </Pressable>
          </View>

          {!!getError("confirmPassword") && (
            <FieldError>{getError("confirmPassword")}</FieldError>
          )}
        </TextField>

        {/* Password Checker */}
        <View className="flex-col gap-1 mt-5">
          <Text className="text-foreground font-nunitoSemiBold mb-2">
            Your password must contain:
          </Text>

          {/* Minimum Length of 8 Char */}
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={
                passwordRequirements.minLength ? "checkmark-circle" : "remove"
              }
              size={24}
              color={
                passwordRequirements.minLength
                  ? colors.success
                  : colors.textSecondary
              }
            />
            <Text className="text-foreground font-inter">
              At least 8 characters
            </Text>
          </View>

          {/* At least one lowercase letter (a–z) */}
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={
                passwordRequirements.hasLowercase
                  ? "checkmark-circle"
                  : "remove"
              }
              size={24}
              color={
                passwordRequirements.hasLowercase
                  ? colors.success
                  : colors.textSecondary
              }
            />
            <Text className="text-foreground font-inter">
              At least one lowercase letter (a–z)
            </Text>
          </View>

          {/* At least one uppercase letter (A–Z) */}
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={
                passwordRequirements.hasUppercase
                  ? "checkmark-circle"
                  : "remove"
              }
              size={24}
              color={
                passwordRequirements.hasUppercase
                  ? colors.success
                  : colors.textSecondary
              }
            />
            <Text className="text-foreground font-inter">
              At least one uppercase letter (A–Z)
            </Text>
          </View>

          {/* At least one number (0–9) */}
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={
                passwordRequirements.hasNumber ? "checkmark-circle" : "remove"
              }
              size={24}
              color={
                passwordRequirements.hasNumber
                  ? colors.success
                  : colors.textSecondary
              }
            />
            <Text className="text-foreground font-inter">
              At least one number (0–9)
            </Text>
          </View>

          {/* At least one special character (e.g. ! @ # $ % ^ & *) */}
          <View className="flex-row items-center gap-2">
            <Ionicons
              name={
                passwordRequirements.hasSpecialChar
                  ? "checkmark-circle"
                  : "remove"
              }
              size={24}
              color={
                passwordRequirements.hasSpecialChar
                  ? colors.success
                  : colors.textSecondary
              }
            />
            <Text className="text-foreground font-inter">
              at least one special character (e.g. ! @ # $ % ^ & *)
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-1" />

      {/* Submit Button */}
      <Button
        onPress={handleSubmit}
        className="mt-5"
        isDisabled={!isPasswordValid || saving || sessionCheck !== 'valid'}
      >
        <Button.Label>{saving ? 'Saving...' : 'Submit'}</Button.Label>
        {saving && <Spinner size="sm" color={colors.white} className="ml-2" />}
      </Button>

      <ErrorDialog
        isOpen={!!error}
        onClose={handleErrorClose}
        message={error}
      />
    </ScreenWrapper>
  );
}