import { View, Text } from "react-native";

import { IconCircleCheckFilled, IconCircleDashed } from "@tabler/icons-react-native";

import type { TranslationKey } from "@repo/i18n";
import type { usePasswordValidation } from "@repo/hooks";

import PasswordField from "@/components/inputs/PasswordField";
import { useColors } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/i18n";

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

const REQUIREMENT_LABELS: { key: keyof PasswordRequirements; labelKey: TranslationKey }[] = [
  { key: "minLength", labelKey: "auth.passwordRule.minLength" },
  { key: "hasLowercase", labelKey: "auth.passwordRule.lowercase" },
  { key: "hasUppercase", labelKey: "auth.passwordRule.uppercase" },
  { key: "hasNumber", labelKey: "auth.passwordRule.number" },
  { key: "hasSpecialChar", labelKey: "auth.passwordRule.special" },
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
  passwordLabel,
}: NewPasswordFieldsProps) {
  const { colors } = useColors();
  const { t } = useTranslation();

  return (
    <View className="flex gap-3">
      <PasswordField
        label={passwordLabel ?? t("authMobile.passwordLabel")}
        placeholder={t("authMobile.createPasswordPlaceholder")}
        value={password}
        onChangeText={onPasswordChange}
        error={passwordError}
        isDisabled={isDisabled}
        textContentType="newPassword"
      />

      <PasswordField
        label={t("authMobile.confirmPasswordLabel")}
        placeholder={t("authMobile.confirmPasswordPlaceholder")}
        value={confirmPassword}
        onChangeText={onConfirmPasswordChange}
        error={confirmPasswordError}
        isDisabled={isDisabled}
        textContentType="newPassword"
      />

      <View className="flex-col gap-1 mt-5">
        <Text className="text-foreground font-interSemiBold mb-2">
          {t("authMobile.passwordMustContain")}
        </Text>

        {REQUIREMENT_LABELS.map(({ key, labelKey }) => {
          const isMet = requirements[key];
          const label = t(labelKey);
          return (
            <View
              key={key}
              className="flex-row items-center gap-2"
              accessible
              accessibilityLabel={`${label}${
                isMet ? t("auth.passwordRule.met") : t("auth.passwordRule.notMet")
              }`}
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
