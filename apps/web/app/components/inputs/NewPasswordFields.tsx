import type { usePasswordValidation } from "@repo/hooks";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import PasswordField from "./PasswordField";
import PasswordRequirementList from "./PasswordRequirementList";

type PasswordRequirements = ReturnType<typeof usePasswordValidation>["passwordRequirements"];

interface NewPasswordFieldsProps {
  password: string;
  confirmPassword: string;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  requirements: PasswordRequirements;
  passwordError?: string | null;
  confirmPasswordError?: string | null;
  isDisabled?: boolean;
  passwordLabel?: string;
}

// New password + confirmation with the live requirements checklist, mirroring
// mobile (components/inputs/NewPasswordFields). Rules come from
// usePasswordValidation (@repo/hooks); callers own the state. Rendered as a
// fragment so the fields take the parent form's spacing.
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
  const { t } = useTranslation();

  return (
    <>
      <PasswordField
        isRequired
        label={passwordLabel ?? t("auth.newPasswordLabel")}
        name="password"
        placeholder={t("auth.newPasswordPlaceholder")}
        autoComplete="new-password"
        value={password}
        onChange={onPasswordChange}
        isInvalid={!!passwordError}
        errorMessage={passwordError ?? undefined}
        isDisabled={isDisabled}
      />

      <PasswordField
        isRequired
        label={t("auth.confirmPasswordLabel")}
        name="confirmPassword"
        placeholder={t("auth.confirmPasswordPlaceholder")}
        autoComplete="new-password"
        value={confirmPassword}
        onChange={onConfirmPasswordChange}
        isInvalid={!!confirmPasswordError}
        errorMessage={confirmPasswordError ?? undefined}
        isDisabled={isDisabled}
      />

      <PasswordRequirementList
        requirements={requirements}
        hasInput={password.length > 0 || confirmPassword.length > 0}
      />
    </>
  );
}
