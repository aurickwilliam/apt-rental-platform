import { View, Text } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import { Button, Spinner, useToast } from "heroui-native";

import ScreenWrapper from "components/layout/ScreenWrapper";
import StandardHeader from "components/layout/StandardHeader";
import ErrorDialog from "@/components/display/ErrorDialog";
import PasswordField from "@/components/inputs/PasswordField";
import NewPasswordFields from "@/components/inputs/NewPasswordFields";

import { usePasswordValidation } from "@repo/hooks";
import { useColors } from "@/hooks/useTheme";
import { changePassword } from "@/service/auth/passwordChangeService";
import { PasswordError, type PasswordErrorReason } from "@/service/auth/passwordErrors";

// Server errors shown under a field; anything else opens the error dialog.
const CURRENT_PASSWORD_ERRORS = new Set<PasswordErrorReason>(["wrong_current_password"]);
const NEW_PASSWORD_ERRORS = new Set<PasswordErrorReason>(["same_password", "weak_password"]);
const GENERIC_ERROR = "Something went wrong. Please try again.";

export default function ChangePassword() {
  const router = useRouter();
  const { toast } = useToast();
  const { colors } = useColors();

  const [currentPassword, setCurrentPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    passwordRequirements,
    isPasswordValid,
  } = usePasswordValidation();

  const handleCurrentPasswordChange = (value: string) => {
    setCurrentPassword(value);
    if (currentPasswordError) setCurrentPasswordError(null);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (newPasswordError) setNewPasswordError(null);
  };

  const getCurrentPasswordError = (): string | undefined => {
    if (currentPasswordError) return currentPasswordError;
    if (submitted && !currentPassword) return "Please enter your current password.";
    return undefined;
  };

  const getNewPasswordError = (): string | undefined => {
    if (newPasswordError) return newPasswordError;
    if (submitted && !isPasswordValid) {
      return "Password does not meet the requirements or password does not match";
    }
    return undefined;
  };

  const getConfirmPasswordError = (): string | undefined => {
    if (submitted && confirmPassword && password !== confirmPassword) return "Passwords do not match";
    return undefined;
  };

  const handleSubmit = async () => {
    if (saving) return;
    setSubmitted(true);
    if (!currentPassword || !isPasswordValid) return;

    setSaving(true);
    setCurrentPasswordError(null);
    setNewPasswordError(null);
    try {
      await changePassword(currentPassword, password);
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      toast.show({
        variant: "success",
        label: "Password updated",
        description: "Other devices were signed out.",
      });
      router.back();
    } catch (err) {
      if (!(err instanceof PasswordError)) {
        // Log the type only: an unexpected message could echo a password.
        console.error("Password change failed:", err instanceof Error ? err.name : typeof err);
        setError(GENERIC_ERROR);
      } else if (CURRENT_PASSWORD_ERRORS.has(err.reason)) {
        setCurrentPasswordError(err.message);
      } else if (NEW_PASSWORD_ERRORS.has(err.reason)) {
        setNewPasswordError(err.message);
      } else {
        setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper
      scrollable
      header={<StandardHeader title="Change Password" />}
      footer={
        <View className="p-5">
          <Button
            onPress={handleSubmit}
            isDisabled={!isPasswordValid || saving}
            className="w-full"
          >
            <Button.Label>{saving ? "Updating..." : "Update Password"}</Button.Label>
            {saving && <Spinner size="sm" color={colors.white} className="ml-2" />}
          </Button>
        </View>
      }
      className="p-5"
    >
      <Text className="text-base text-foreground font-inter">
        Enter your current password, then choose a new one. You’ll stay signed
        in here, and any other devices will be signed out.
      </Text>

      <View className="flex gap-3 mt-5">
        <PasswordField
          label="Current Password:"
          placeholder="Enter your current password"
          value={currentPassword}
          onChangeText={handleCurrentPasswordChange}
          error={getCurrentPasswordError()}
          isDisabled={saving}
        />

        <NewPasswordFields
          password={password}
          confirmPassword={confirmPassword}
          onPasswordChange={handlePasswordChange}
          onConfirmPasswordChange={setConfirmPassword}
          requirements={passwordRequirements}
          passwordError={getNewPasswordError()}
          confirmPasswordError={getConfirmPasswordError()}
          isDisabled={saving}
          passwordLabel="New Password:"
        />
      </View>

      <ErrorDialog
        isOpen={!!error}
        onClose={() => setError(null)}
        message={error}
      />
    </ScreenWrapper>
  );
}
