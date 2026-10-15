import { Keyboard, View, Text } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";

import { Button, FieldError, Input, Label, Spinner, TextField } from "heroui-native";

import ScreenWrapper from "components/layout/ScreenWrapper";
import StandardHeader from "components/layout/StandardHeader";
import ErrorDialog from "@/components/display/ErrorDialog";
import PasswordField from "@/components/inputs/PasswordField";

import { useColors } from "@/hooks/useTheme";
import { getEmailChangeAccount, requestEmailChange } from "@/service/auth/emailChangeService";
import { EmailChangeError, getEmailChangeErrorField, isValidEmail } from "@repo/utils";

const GENERIC_ERROR = "Something went wrong. Please try again.";
const VERIFY_CURRENT_PATH = "/settings/change-email/verify-current";

// Settings → Change Email, page 1: new address + current password. Codes are
// then confirmed one inbox per page (verify-current, verify-new). The
// password lives only in this screen's state and is cleared on unmount.
export default function ChangeEmail() {
  const router = useRouter();
  const { colors } = useColors();

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
          setError(err instanceof EmailChangeError ? err.message : GENERIC_ERROR);
        }
      } finally {
        if (!cancelled) setLoadingAccount(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getNewEmailError = (): string | undefined => {
    if (newEmailError) return newEmailError;
    if (submitted && !newEmail.trim()) return "Please enter a new email address.";
    if (submitted && !isValidEmail(newEmail.trim())) return "Enter a valid email address.";
    return undefined;
  };

  const getCurrentPasswordError = (): string | undefined => {
    if (currentPasswordError) return currentPasswordError;
    if (submitted && !currentPassword) return "Please enter your current password.";
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
        setError(GENERIC_ERROR);
      } else {
        const field = getEmailChangeErrorField(err.reason);
        if (field === "new") setNewEmailError(err.message);
        else if (field === "current") setCurrentPasswordError(err.message);
        else setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingAccount) {
    return (
      <ScreenWrapper header={<StandardHeader title="Change Email" />} className="p-5">
        <View className="flex-1 items-center justify-center py-20">
          <Spinner size="lg" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      scrollable
      header={<StandardHeader title="Change Email" />}
      footer={
        <View className="p-5">
          <Button onPress={handleRequest} isDisabled={saving} className="w-full">
            <Button.Label>{saving ? "Sending codes..." : "Send Verification Codes"}</Button.Label>
            {saving && <Spinner size="sm" color={colors.white} className="ml-2" />}
          </Button>
        </View>
      }
      className="p-5"
    >
      <Text className="text-base text-foreground font-inter">
        Enter a new email and your current password. We’ll send a 6-digit code to both your
        current and new inboxes. Your current email stays active until both codes are confirmed.
      </Text>

      <View className="flex gap-4 mt-5">
        <TextField isDisabled>
          <Label>Current Email:</Label>
          <Input value={currentEmail} editable={false} autoCapitalize="none" />
        </TextField>

        <TextField isRequired isInvalid={!!getNewEmailError()} isDisabled={saving}>
          <Label>New Email:</Label>
          <Input
            placeholder="Enter your new email"
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
          label="Current Password:"
          placeholder="Enter your current password"
          value={currentPassword}
          onChangeText={(value) => {
            setCurrentPassword(value);
            if (currentPasswordError) setCurrentPasswordError(null);
          }}
          error={getCurrentPasswordError()}
          isDisabled={saving}
        />
      </View>

      <ErrorDialog isOpen={!!error} onClose={() => setError(null)} message={error} />
    </ScreenWrapper>
  );
}
