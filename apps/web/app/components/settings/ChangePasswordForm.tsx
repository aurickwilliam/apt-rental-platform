"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { Button, Form, toast } from "@heroui/react";
import { IconArrowLeft } from "@tabler/icons-react";

import { usePasswordValidation } from "@repo/hooks";
import { getPasswordChangeErrorField, PasswordError } from "@repo/utils";

import { changePassword } from "@/app/(auth)/actions/change-password";
import ErrorBanner from "@/app/components/display/ErrorBanner";
import NewPasswordFields from "@/app/components/inputs/NewPasswordFields";
import PasswordField from "@/app/components/inputs/PasswordField";

const UNEXPECTED_ERROR = "Something went wrong. Please try again.";

interface ChangePasswordFormProps {
  onClose: () => void;
}

// Settings → Security → Change Password, mirroring mobile
// (app/settings/change-password.tsx). Passwords live only in this component's
// state; closing it (back, Cancel or success) discards them.
export default function ChangePasswordForm({ onClose }: ChangePasswordFormProps) {
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    passwordRequirements,
    isPasswordValid,
  } = usePasswordValidation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, startSaving] = useTransition();
  const [serverCurrentPasswordError, setServerCurrentPasswordError] = useState<string | null>(null);
  const [serverNewPasswordError, setServerNewPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Announce the sub-view to keyboard and screen-reader users.
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const currentPasswordError = (() => {
    if (submitted && !currentPassword) return "Please enter your current password.";
    return serverCurrentPasswordError;
  })();

  const newPasswordError = (() => {
    if (submitted && !password.trim()) return "This field is required";
    if (submitted && !isPasswordValid) {
      return "Password does not meet the requirements or password does not match";
    }
    return serverNewPasswordError;
  })();

  const confirmPasswordError = (() => {
    if (submitted && !confirmPassword.trim()) return "This field is required";
    if (submitted && password !== confirmPassword) return "Passwords do not match";
    return null;
  })();

  const handleCurrentPasswordChange = (value: string) => {
    setCurrentPassword(value);
    if (serverCurrentPasswordError) setServerCurrentPasswordError(null);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (serverNewPasswordError) setServerNewPasswordError(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSubmitted(true);
    setError(null);
    if (!currentPassword || !isPasswordValid) return;

    setServerCurrentPasswordError(null);
    setServerNewPasswordError(null);
    startSaving(async () => {
      try {
        const { error: reason } = await changePassword(currentPassword, password);
        if (!reason) {
          toast.success("Password updated", { description: "Other devices were signed out." });
          onClose();
          return;
        }

        const message = new PasswordError(reason).message;
        const field = getPasswordChangeErrorField(reason);
        if (field === "current") setServerCurrentPasswordError(message);
        else if (field === "new") setServerNewPasswordError(message);
        else setError(message);
      } catch (err) {
        // Log the type only: an unexpected message could echo a password.
        console.error("Password change failed:", err instanceof Error ? err.name : typeof err);
        setError(UNEXPECTED_ERROR);
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          isIconOnly
          variant="ghost"
          className="-ml-2 cursor-pointer"
          aria-label="Back to Security"
          isDisabled={saving}
          onPress={onClose}
        >
          <IconArrowLeft size={20} />
        </Button>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-nunito text-lg font-bold text-primary focus:outline-none"
        >
          Change Password
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your current password, then choose a new one. You’ll stay signed
        in here, and any other devices will be signed out.
      </p>

      {error && <ErrorBanner message={error} />}

      <Form
        className="mt-4 flex max-w-md flex-col gap-4"
        validationBehavior="aria"
        onSubmit={handleSubmit}
      >
        <PasswordField
          isRequired
          label="Current Password"
          name="currentPassword"
          placeholder="Enter your current password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={handleCurrentPasswordChange}
          isInvalid={!!currentPasswordError}
          errorMessage={currentPasswordError ?? undefined}
          isDisabled={saving}
        />

        <NewPasswordFields
          password={password}
          confirmPassword={confirmPassword}
          onPasswordChange={handlePasswordChange}
          onConfirmPasswordChange={setConfirmPassword}
          requirements={passwordRequirements}
          passwordError={newPasswordError}
          confirmPasswordError={confirmPasswordError}
          isDisabled={saving}
        />

        {/* Cancel + main action side by side; Cancel stays quiet (tertiary). */}
        <div className="mt-2 flex gap-3">
          <Button
            variant="tertiary"
            className="flex-1 cursor-pointer"
            isDisabled={saving}
            onPress={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 cursor-pointer"
            type="submit"
            isPending={saving}
            isDisabled={saving}
          >
            {saving ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </Form>
    </>
  );
}
