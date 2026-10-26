import { Keyboard, View, Text, Pressable } from "react-native";
import { useRef, useState } from "react";
import { Redirect, useRouter } from "expo-router";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import ErrorDialog from "@/components/display/ErrorDialog";
import CodeInput from "@/components/inputs/CodeInput";

import {
  Button,
  CloseButton,
  LinkButton,
  Spinner,
  type InputOTPRef,
} from "heroui-native";

import { IconBrandGoogle, IconChevronLeft } from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";
import { useCountdown } from "@/hooks/auth";
import { useTranslation } from "@/hooks/i18n";
import { usePasswordRecoveryStore } from "@/stores/usePasswordRecoveryStore";
import {
  requestPasswordRecovery,
  verifyPasswordRecoveryCode,
} from "@/service/auth/passwordRecoveryService";
import {
  PasswordError,
  passwordErrorMessage,
  RECOVERY_CODE_LENGTH,
  RECOVERY_RESEND_COOLDOWN_SECONDS,
} from "@repo/utils";

// Errors shown under the code input; anything else opens the error dialog.
const INLINE_CODE_ERRORS = new Set(["invalid_or_expired_code", "rate_limited"]);

export default function RecoveryCodeVerification() {
  const router = useRouter();
  const { colors } = useColors();
  const { language, t } = useTranslation();

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
      setCodeError(passwordErrorMessage(language, err.reason));
      return;
    }
    setError(
      err instanceof PasswordError
        ? passwordErrorMessage(language, err.reason)
        : t("authMobile.errorGeneric"),
    );
  };

  const handleVerify = async (value: string = code) => {
    if (verifying || value.length < RECOVERY_CODE_LENGTH) return;
    // Close the keyboard before this screen may navigate away, so no focused
    // field is unmounted while the keyboard is still attached to it.
    Keyboard.dismiss();

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
      setResendNotice(t("auth.recovery.newCodeSent"));
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
            {t("auth.recovery.googleTitle")}
          </Text>
          <Text className="text-foreground text-base font-inter">
            {email} {t("auth.recovery.googleAfter")}
          </Text>
        </View>

        <Button onPress={handleBackToSignIn}>
          <Button.Label className="font-nunitoSemiBold">
            {t("auth.backToSignIn")}
          </Button.Label>
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
          accessibilityLabel={t("authMobile.goBack")}
        >
          <IconChevronLeft size={26} color={colors.textPrimary} />
        </CloseButton>
      </View>

      <View className="flex gap-3 mt-5">
        <Text className="text-foreground text-2xl font-nunitoBold">
          {t("auth.recovery.codeTitle")}
        </Text>

        <Text className="text-base text-foreground font-inter">
          {t("authMobile.recovery.codeBefore")}{" "}
          <Text className="font-interSemiBold">{email}</Text>
          {t("authMobile.recovery.codeAfter")}
        </Text>

        <LinkButton onPress={router.back} className="self-start p-0">
          <LinkButton.Label className="text-accent font-nunitoSemiBold underline">
            {t("auth.wrongEmail")}
          </LinkButton.Label>
        </LinkButton>
      </View>

      <View className="items-center my-6">
        <CodeInput
          ref={codeRef}
          value={code}
          onChange={(value) => {
            setCode(value);
            if (codeError) setCodeError(null);
          }}
          onComplete={handleVerify}
          length={RECOVERY_CODE_LENGTH}
          isInvalid={!!codeError}
          isDisabled={verifying}
        />

        {!!codeError && (
          <Text className="text-danger text-sm font-inter mt-3 text-center">
            {codeError}
          </Text>
        )}
        {!!resendNotice && (
          <Text className="text-success-text text-sm font-inter mt-3 text-center">
            {resendNotice}
          </Text>
        )}
      </View>

      <View className="flex-row items-center">
        <Text className="text-muted text-base">
          {t("authMobile.otp.didntGetCode")}{" "}
        </Text>
        {countdown > 0 ? (
          <Text className="text-accent text-base font-nunitoSemiBold">
            {t("auth.otp.resendIn", { seconds: String(countdown) })}
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
              {resending ? t("auth.otp.sending") : t("auth.otp.resend")}
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
          {verifying ? t("auth.otp.verifying") : t("auth.otp.verifyCode")}
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
