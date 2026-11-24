import { Keyboard, View, Text } from 'react-native'
import { useEffect, useRef, useState } from 'react';
import { Redirect, useNavigation, useRouter } from 'expo-router';

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import NewPasswordFields from '@/components/inputs/NewPasswordFields';
import ErrorDialog from '@/components/display/ErrorDialog';

import { Button, Spinner } from 'heroui-native';

import { usePasswordValidation } from '@repo/hooks';
import { useColors } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/i18n';
import { usePasswordRecoveryStore } from '@/stores/usePasswordRecoveryStore';
import { clearQueryClient } from '@/utils/queryClient';
import {
  endPasswordRecovery,
  hasActiveRecoverySession,
  updateRecoveredPassword,
} from '@/service/auth/passwordRecoveryService';
import { PasswordError, passwordErrorMessage } from "@repo/utils";


type SessionCheck = 'checking' | 'valid' | 'invalid';

// Shown under the password field; other failures open the error dialog.
const INLINE_PASSWORD_ERRORS = new Set(['same_password', 'weak_password']);

export default function ResetPassword() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useColors();
  const { language, t } = useTranslation();
  const resetRecovery = usePasswordRecoveryStore((state) => state.reset);

  const [submitted, setSubmitted] = useState<boolean>(false);
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
      return t("auth.changePassword.required");
    }

    if (submitted && field === 'password' && !isPasswordValid) {
      return t("auth.changePassword.requirements");
    }

    if (submitted && field === 'confirmPassword' && password !== confirmPassword) {
      return t("auth.changePassword.mismatch");
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
    // Close the keyboard before this screen may navigate away, so no focused
    // field is unmounted while the keyboard is still attached to it.
    Keyboard.dismiss();
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
      if (!(err instanceof PasswordError)) {
        // Log the type only: an unexpected message could echo the password.
        console.error('Password reset failed:', err instanceof Error ? err.name : typeof err);
        setError(t("authMobile.errorGeneric"));
      } else if (INLINE_PASSWORD_ERRORS.has(err.reason)) {
        setServerPasswordError(passwordErrorMessage(language, err.reason));
      } else if (err.reason === 'session_expired') {
        // Restart only after the message is read (see handleErrorClose).
        setRestartAfterError(true);
        setError(passwordErrorMessage(language, err.reason));
      } else {
        setError(passwordErrorMessage(language, err.reason));
      }
    } finally {
      setSaving(false);
    }
  }
  return (
    <ScreenWrapper className="p-5">
      <View className="flex gap-1">
        <Text className="text-3xl text-foreground font-nunitoBold">
          {t("auth.recovery.resetTitle")}
        </Text>

        <Text className="text-base text-foreground font-inter">
          {t("auth.recovery.resetBody")}
        </Text>
      </View>

      <View className="mt-5">
        <NewPasswordFields
          password={password}
          confirmPassword={confirmPassword}
          onPasswordChange={handlePasswordChange}
          onConfirmPasswordChange={setConfirmPassword}
          requirements={passwordRequirements}
          passwordError={getError('password')}
          confirmPasswordError={getError('confirmPassword')}
          isDisabled={saving}
        />
      </View>

      <View className="flex-1" />

      {/* Submit Button */}
      <Button
        onPress={handleSubmit}
        className="mt-5"
        isDisabled={!isPasswordValid || saving || sessionCheck !== 'valid'}
      >
        <Button.Label>
          {saving ? t("common.saving") : t("common.submit")}
        </Button.Label>
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