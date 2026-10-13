import { View, Text, Pressable } from "react-native";
import { useRef, useState } from "react";
import { Redirect, useRouter } from "expo-router";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import ErrorDialog from "@/components/display/ErrorDialog";

import {
  Button,
  CloseButton,
  InputOTP,
  LinkButton,
  Spinner,
  type InputOTPRef,
  REGEXP_ONLY_DIGITS,
} from "heroui-native";

import { IconBrandGoogle, IconChevronLeft } from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";
import { useCountdown } from "@/hooks/auth";
import { usePasswordRecoveryStore } from "@/stores/usePasswordRecoveryStore";
import {
  RECOVERY_CODE_LENGTH,
  RECOVERY_RESEND_COOLDOWN_SECONDS,
  requestPasswordRecovery,
  verifyPasswordRecoveryCode,
} from "@/service/auth/passwordRecoveryService";
import { PasswordError } from "@/service/auth/passwordErrors";

// Errors shown under the code input; anything else opens the error dialog.
const INLINE_CODE_ERRORS = new Set(["invalid_or_expired_code", "rate_limited"]);
const GENERIC_ERROR = "Something went wrong. Please try again.";

export default function RecoveryCodeVerification() {
  const router = useRouter();
  const { colors } = useColors();

  const email = usePasswordRecoveryStore((state) => state.email);
  const resetRecovery = usePasswordRecoveryStore((state) => state.reset);

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [googleOnly, setGoogleOnly] = useState(false);

  const codeRef = useRef<InputOTPRef>(null);

  // A code was just sent, so resend starts on the server's cooldown.
  const { countdown, reset: resetCountdown } = useCountdown({
    duration: RECOVERY_RESEND_COOLDOWN_SECONDS,
  });

  // Reached without an email (e.g. app reload): start the flow again.
  if (!email) return <Redirect href="/forgot-password" />;

  const clearCode = () => {
    setCode("");
    codeRef.current?.clear();
  };

  const showError = (err: unknown) => {
    if (err instanceof PasswordError && INLINE_CODE_ERRORS.has(err.reason)) {
      setCodeError(err.message);
      return;
    }
    setError(err instanceof PasswordError ? err.message : GENERIC_ERROR);
  };

  const handleVerify = async (value: string = code) => {
    if (verifying || value.length < RECOVERY_CODE_LENGTH) return;

    setVerifying(true);
    setCodeError(null);
    setResendNotice(null);
    try {
      const result = await verifyPasswordRecoveryCode(email, value);
      if (result === "google_only") {
        setGoogleOnly(true);
        return;
      }
      router.replace("/forgot-password/reset-password");
    } catch (err) {
      clearCode();
      showError(err);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resending || countdown > 0) return;

    setResending(true);
    setCodeError(null);
    setResendNotice(null);
    try {
      await requestPasswordRecovery(email);
      clearCode();
      setResendNotice("A new code is on its way. Check your inbox.");
    } catch (err) {
      showError(err);
    } finally {
      // Restart the cooldown either way: after a rate limit the server wants a wait too.
      resetCountdown();
      setResending(false);
    }
  };

  const handleBackToSignIn = () => {
    resetRecovery();
    router.dismissTo("/sign-in");
  };

  if (googleOnly) {
    return (
      <ScreenWrapper className="p-5">
        <View className="flex-1 justify-center gap-3">
          <IconBrandGoogle size={48} color={colors.primary} />
          <Text className="text-foreground text-2xl font-nunitoBold">
            This account uses Google
          </Text>
          <Text className="text-foreground text-base font-inter">
            {email} signs in with Google, so it doesn’t have a password to
            reset. Go back and use Continue with Google instead.
          </Text>
        </View>

        <Button onPress={handleBackToSignIn}>
          <Button.Label className="font-nunitoSemiBold">Back to Sign In</Button.Label>
        </Button>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper className="p-5" scrollable>
      <View>
        <CloseButton
          variant="ghost"
          className="-ml-2"
          onPress={router.back}
          accessibilityLabel="Go back"
        >
          <IconChevronLeft size={26} color={colors.textPrimary} />
        </CloseButton>
      </View>

      <View className="flex gap-3 mt-5">
        <Text className="text-foreground text-2xl font-nunitoBold">
          Check your email
        </Text>

        <Text className="text-base text-foreground font-inter">
          If an account exists for{" "}
          <Text className="font-interSemiBold">{email}</Text>, we’ve sent a
          6-digit code to it. Enter the code below to reset your password.
        </Text>

        <LinkButton onPress={router.back} className="self-start p-0">
          <LinkButton.Label className="text-secondary font-nunitoSemiBold underline">
            Wrong email? Change it
          </LinkButton.Label>
        </LinkButton>
      </View>

      <View className="items-center my-6">
        <InputOTP
          ref={codeRef}
          value={code}
          onChange={(value) => {
            setCode(value);
            if (codeError) setCodeError(null);
          }}
          onComplete={handleVerify}
          maxLength={RECOVERY_CODE_LENGTH}
          isInvalid={!!codeError}
          isDisabled={verifying}
          inputMode="numeric"
          pattern={REGEXP_ONLY_DIGITS}
          textInputProps={{
            textContentType: "oneTimeCode",
            autoComplete: "one-time-code",
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

        {!!codeError && (
          <Text className="text-danger text-sm font-inter mt-3 text-center">
            {codeError}
          </Text>
        )}
        {!!resendNotice && (
          <Text className="text-success text-sm font-inter mt-3 text-center">
            {resendNotice}
          </Text>
        )}
      </View>

      <View className="flex-row items-center">
        <Text className="text-muted text-base">Didn&apos;t get the code? </Text>
        {countdown > 0 ? (
          <Text className="text-accent text-base font-nunitoSemiBold">
            Resend in {countdown}s
          </Text>
        ) : (
          <Pressable
            onPress={handleResend}
            disabled={resending}
            className={resending ? "opacity-50" : ""}
            accessibilityRole="button"
            hitSlop={10}
          >
            <Text className="text-accent text-base font-nunitoSemiBold">
              {resending ? "Sending..." : "Resend"}
            </Text>
          </Pressable>
        )}
      </View>

      <View className="flex-1" />

      <Button
        onPress={() => handleVerify()}
        isDisabled={verifying || code.length < RECOVERY_CODE_LENGTH}
        className="mt-8"
      >
        <Button.Label className="font-nunitoSemiBold">
          {verifying ? "Verifying..." : "Verify Code"}
        </Button.Label>
        {verifying && <Spinner size="sm" color={colors.white} className="ml-2" />}
      </Button>

      <ErrorDialog
        isOpen={!!error}
        onClose={() => setError(null)}
        message={error}
      />
    </ScreenWrapper>
  );
}
