import { View, Text } from "react-native";

import { IconCircleCheckFilled, IconCircleDashed } from "@tabler/icons-react-native";

import type { usePasswordValidation } from "@repo/hooks";

import PasswordField from "@/components/inputs/PasswordField";
import { useColors } from "@/hooks/useTheme";

type PasswordRequirements = ReturnType<typeof usePasswordValidation>["passwordRequirements"];

interface NewPasswordFieldsProps {
  password: string;
  confirmPassword: string;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  requirements: PasswordRequirements;
  passwordError?: string;
  confirmPasswordError?: string;
  isDisabled?: boolean;
  passwordLabel?: string;
}

const REQUIREMENT_LABELS: { key: keyof PasswordRequirements; label: string }[] = [
  { key: "minLength", label: "At least 8 characters" },
  { key: "hasLowercase", label: "At least one lowercase letter (a–z)" },
  { key: "hasUppercase", label: "At least one uppercase letter (A–Z)" },
  { key: "hasNumber", label: "At least one number (0–9)" },
  { key: "hasSpecialChar", label: "At least one special character (e.g. ! @ # $ % ^ & *)" },
];

// New password + confirmation with the live strength checklist. Rules come
// from usePasswordValidation (@repo/hooks); callers own the state.
export default function NewPasswordFields({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  requirements,
  passwordError,
  confirmPasswordError,
  isDisabled = false,
  passwordLabel = "Password:",
}: NewPasswordFieldsProps) {
  const { colors } = useColors();

  return (
    <View className="flex gap-3">
      <PasswordField
        label={passwordLabel}
        placeholder="Create a password"
        value={password}
        onChangeText={onPasswordChange}
        error={passwordError}
        isDisabled={isDisabled}
        textContentType="newPassword"
      />

      <PasswordField
        label="Confirm Password:"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChangeText={onConfirmPasswordChange}
        error={confirmPasswordError}
        isDisabled={isDisabled}
        textContentType="newPassword"
      />

      <View className="flex-col gap-1 mt-5">
        <Text className="text-foreground font-interSemiBold mb-2">
          Your password must contain:
        </Text>

        {REQUIREMENT_LABELS.map(({ key, label }) => {
          const isMet = requirements[key];
          return (
            <View
              key={key}
              className="flex-row items-center gap-2"
              accessible
              accessibilityLabel={`${label}: ${isMet ? "met" : "not met"}`}
            >
              {isMet ? (
                <IconCircleCheckFilled size={22} color={colors.success} />
              ) : (
                <IconCircleDashed size={22} color={colors.textSecondary} />
              )}
              <Text className="text-foreground font-inter">{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
