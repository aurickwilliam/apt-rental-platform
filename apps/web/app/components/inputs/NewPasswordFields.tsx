import type { usePasswordValidation } from "@repo/hooks";

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
  passwordLabel = "New Password",
}: NewPasswordFieldsProps) {
  return (
    <>
      <PasswordField
        isRequired
        label={passwordLabel}
        name="password"
        placeholder="Enter your new password"
        autoComplete="new-password"
        value={password}
        onChange={onPasswordChange}
        isInvalid={!!passwordError}
        errorMessage={passwordError ?? undefined}
        isDisabled={isDisabled}
      />

      <PasswordField
        isRequired
        label="Confirm Password"
        name="confirmPassword"
        placeholder="Confirm your new password"
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
