import { Keyboard, View, Text } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import { Button, FieldError, Input, Label, Spinner, TextField } from "heroui-native";

import ScreenWrapper from "components/layout/ScreenWrapper";
import StandardHeader from "components/layout/StandardHeader";
import ErrorDialog from "@/components/display/ErrorDialog";
import PasswordField from "@/components/inputs/PasswordField";
import ChangeEmailFormSkeleton from "../components/ChangeEmailFormSkeleton";

import { useColors } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/i18n";
import { getEmailChangeAccount, requestEmailChange } from "@/service/auth/emailChangeService";
import { EmailChangeError, emailChangeErrorMessage, getEmailChangeErrorField, isValidEmail } from "@repo/utils";

const VERIFY_CURRENT_PATH = "/settings/change-email/verify-current";

// Settings → Change Email, page 1: new address + current password. Codes are
// then confirmed one inbox per page (verify-current, verify-new). The
// password lives only in this screen's state and is cleared on unmount.
export default function ChangeEmail() {
  const router = useRouter();
  const { colors } = useColors();
  const { language, t } = useTranslation();

  const [loadingAccount, setLoadingAccount] = useState(true);
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newEmailError, setNewEmailError] = useState<string | null>(null);
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      setCurrentPassword("");
    };
  }, []);

  // The form always comes first. Sending codes replaces any change already
  // waiting in Auth, so every attempt starts fresh.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const account = await getEmailChangeAccount();
        if (cancelled) return;
        setCurrentEmail(account.email);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof EmailChangeError
              ? emailChangeErrorMessage(language, err.reason)
              : t("authMobile.errorGeneric"),
          );
        }
      } finally {
        if (!cancelled) setLoadingAccount(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language, t]);

  const getNewEmailError = (): string | undefined => {
    if (newEmailError) return newEmailError;
    if (submitted && !newEmail.trim()) return t("auth.changeEmail.newEmailRequired");
    if (submitted && !isValidEmail(newEmail.trim()))
      return t("authMobile.changeEmail.invalidEmail");
    return undefined;
  };

  const getCurrentPasswordError = (): string | undefined => {
    if (currentPasswordError) return currentPasswordError;
    if (submitted && !currentPassword)
      return t("auth.changePassword.currentRequired");
    return undefined;
  };

  const handleRequest = async () => {
    if (saving) return;
    // Close the keyboard before this screen navigates away.
    Keyboard.dismiss();
    setSubmitted(true);
    setError(null);
    if (!newEmail.trim() || !isValidEmail(newEmail.trim()) || !currentPassword) return;

    setSaving(true);
    setNewEmailError(null);
    setCurrentPasswordError(null);
    try {
      const result = await requestEmailChange(newEmail, currentPassword);
      setCurrentEmail(result.currentEmail);
      setCurrentPassword("");
      setNewEmail("");
      setSubmitted(false);
      router.push(VERIFY_CURRENT_PATH);
    } catch (err) {
      if (!(err instanceof EmailChangeError)) {
        console.error("Email change failed:", err instanceof Error ? err.name : typeof err);
        setError(t("authMobile.errorGeneric"));
      } else {
        const field = getEmailChangeErrorField(err.reason);
        const message = emailChangeErrorMessage(language, err.reason);
        if (field === "new") setNewEmailError(message);
        else if (field === "current") setCurrentPasswordError(message);
        else setError(message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper
      scrollable
      header={<StandardHeader title={t("auth.changeEmail.title")} />}
      footer={
        <View className="p-5">
          <Button onPress={handleRequest} isDisabled={saving || loadingAccount} className="w-full">
            <Button.Label>
              {saving
                ? t("authMobile.changeEmail.sendingCodes")
                : t("auth.changeEmail.sendCodes")}
            </Button.Label>
            {saving && <Spinner size="sm" color={colors.white} className="ml-2" />}
          </Button>
        </View>
      }
      className="p-5"
    >
      <Text className="text-base text-foreground font-inter">
        {t("auth.changeEmail.description")}
      </Text>

      {loadingAccount ? (
        <ChangeEmailFormSkeleton />
      ) : (
        <View className="flex gap-4 mt-5">
          <TextField isDisabled>
            <Label>{t("authMobile.currentEmailLabel")}</Label>
            <Input value={currentEmail} editable={false} autoCapitalize="none" />
          </TextField>

          <TextField isRequired isInvalid={!!getNewEmailError()} isDisabled={saving}>
            <Label>{t("authMobile.newEmailLabel")}</Label>
            <Input
              placeholder={t("auth.changeEmail.newEmailPlaceholder")}
              value={newEmail}
              onChangeText={(value) => {
                setNewEmail(value);
                if (newEmailError) setNewEmailError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              editable={!saving}
            />
            {!!getNewEmailError() && <FieldError>{getNewEmailError()}</FieldError>}
          </TextField>

          <PasswordField
            label={t("authMobile.currentPasswordLabel")}
            placeholder={t("auth.changePassword.currentPlaceholder")}
            value={currentPassword}
            onChangeText={(value) => {
              setCurrentPassword(value);
              if (currentPasswordError) setCurrentPasswordError(null);
            }}
            error={getCurrentPasswordError()}
            isDisabled={saving}
          />
        </View>
      )}

      <ErrorDialog isOpen={!!error} onClose={() => setError(null)} message={error} />
    </ScreenWrapper>
  );
}
