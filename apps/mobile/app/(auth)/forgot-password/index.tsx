import { Keyboard, View, Text } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import ScreenWrapper from "components/layout/ScreenWrapper";
import ErrorDialog from "@/components/display/ErrorDialog";

import {
  Alert,
  Button,
  CloseButton,
  FieldError,
  Input,
  Label,
  Spinner,
  TextField,
} from "heroui-native";

import { IconChevronLeft } from "@tabler/icons-react-native";

import { isValidEmail, PasswordError, passwordErrorMessage } from "@repo/utils";

import { useColors } from "hooks/useTheme";
import { useTranslation } from "hooks/i18n";
import { usePasswordRecoveryStore } from "@/stores/usePasswordRecoveryStore";
import {
  requestPasswordRecovery,
} from "@/service/auth/passwordRecoveryService";

export default function ForgotPassword() {
  const router = useRouter();
  const { colors } = useColors();
  const { language, t } = useTranslation();

  const savedEmail = usePasswordRecoveryStore((state) => state.email);
  const setRecoveryEmail = usePasswordRecoveryStore((state) => state.setEmail);
  const resetRecovery = usePasswordRecoveryStore((state) => state.reset);

  const [email, setEmail] = useState(savedEmail);
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError("");
  };

  const handleBack = () => {
    resetRecovery();
    router.back();
  };

  const handleSendCode = async () => {
    if (loading) return;
    // Close the keyboard before this screen may navigate away, so no focused
    // field is unmounted while the keyboard is still attached to it.
    Keyboard.dismiss();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError(t("auth.recovery.emailRequired"));
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setEmailError(t("auth.recovery.emailInvalid"));
      return;
    }

    setLoading(true);
    try {
      await requestPasswordRecovery(trimmedEmail);
      setRecoveryEmail(trimmedEmail);
      router.push("/forgot-password/otp-verification");
    } catch (err) {
      if (err instanceof PasswordError && err.reason === "invalid_email") {
        setEmailError(passwordErrorMessage(language, err.reason));
      } else {
        setError(
          err instanceof PasswordError
            ? passwordErrorMessage(language, err.reason)
            : t("authMobile.errorGeneric"),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper className="p-5" scrollable>
      <View>
        <CloseButton
          variant="ghost"
          className="-ml-2"
          onPress={handleBack}
          accessibilityLabel={t("authMobile.goBack")}
        >
          <IconChevronLeft size={26} color={colors.textPrimary} />
        </CloseButton>
      </View>

      <View className="flex gap-3 mt-5">
        <Text className="text-accent text-3xl font-nunitoBold">
          {t("auth.recovery.requestTitle")}
        </Text>

        <Text className="text-foreground text-base font-inter">
          {t("auth.recovery.requestBody")}
        </Text>
      </View>

      <View className="mt-8 flex gap-4">
        <TextField isRequired isInvalid={!!emailError}>
          <Label>{t("authMobile.emailLabel")}</Label>
          <Input
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChangeText={handleEmailChange}
            onSubmitEditing={handleSendCode}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            editable={!loading}
          />
          {!!emailError && <FieldError>{emailError}</FieldError>}
        </TextField>

        <Alert>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t("auth.recovery.googleNoticeTitle")}</Alert.Title>
            <Alert.Description>
              {t("authMobile.recovery.googleNoticeBody")}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      </View>

      <View className="flex-1" />

      <Button onPress={handleSendCode} isDisabled={loading} className="mt-8">
        <Button.Label className="font-nunitoSemiBold">
          {loading
            ? t("auth.recovery.sendingCode")
            : t("auth.recovery.sendCode")}
        </Button.Label>
        {loading && <Spinner size="sm" color={colors.white} className="ml-2" />}
      </Button>

      <ErrorDialog
        isOpen={!!error}
        onClose={() => setError("")}
        message={error}
      />
    </ScreenWrapper>
  );
}
