"use client";

import { useState, useTransition } from "react";

import { Button, Form, Modal, toast } from "@heroui/react";
import { IconKey, IconShieldCheck } from "@tabler/icons-react";

import { usePasswordValidation } from "@repo/hooks";
import { getPasswordChangeErrorField, passwordErrorMessage } from "@repo/utils";

import { changePassword } from "@/app/(auth)/actions/change-password";
import ErrorBanner from "@/app/components/display/ErrorBanner";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import NewPasswordFields from "@/app/components/inputs/NewPasswordFields";
import PasswordField from "@/app/components/inputs/PasswordField";

const FORM_ID = "change-password-form";

type Step = "form" | "success";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Settings → Security → Change Password, mirroring mobile
// (app/settings/change-password.tsx). Opened from the Security tab, which
// closes the Settings modal first. On success the form is replaced by a
// confirmation (like forgot-password's "Password Updated" page). Passwords
// live only in this component's state and are cleared on success or close.
export default function ChangePasswordModal({ isOpen, onOpenChange }: ChangePasswordModalProps) {
  const { language, t } = useTranslation();
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
  const [step, setStep] = useState<Step>("form");

  // Each opening starts at the form. Reset here rather than on close so the
  // confirmation doesn't flash back to the form during the exit animation.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setStep("form");
  }

  const currentPasswordError = (() => {
    if (submitted && !currentPassword) return t("auth.changePassword.currentRequired");
    return serverCurrentPasswordError;
  })();

  const newPasswordError = (() => {
    if (submitted && !password.trim()) return t("auth.changePassword.required");
    if (submitted && !isPasswordValid) {
      return t("auth.changePassword.requirements");
    }
    return serverNewPasswordError;
  })();

  const confirmPasswordError = (() => {
    if (submitted && !confirmPassword.trim()) return t("auth.changePassword.required");
    if (submitted && password !== confirmPassword) {
      return t("auth.changePassword.mismatch");
    }
    return null;
  })();

  const reset = () => {
    setCurrentPassword("");
    setPassword("");
    setConfirmPassword("");
    setSubmitted(false);
    setServerCurrentPasswordError(null);
    setServerNewPasswordError(null);
    setError(null);
  };

  // Stays open while a change is in flight, so the result is never lost.
  const handleOpenChange = (open: boolean) => {
    if (!open && saving) return;
    if (!open) reset();
    onOpenChange(open);
  };

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
          toast.success(t("auth.changePassword.toastTitle"), {
            description: t("auth.changePassword.toastBody"),
            indicator: <IconShieldCheck size={20} aria-hidden="true" />,
          });
          reset();
          setStep("success");
          return;
        }

        const message = passwordErrorMessage(language, reason);
        const field = getPasswordChangeErrorField(reason);
        if (field === "current") setServerCurrentPasswordError(message);
        else if (field === "new") setServerNewPasswordError(message);
        else setError(message);
      } catch (err) {
        // Log the type only: an unexpected message could echo a password.
        console.error("Password change failed:", err instanceof Error ? err.name : typeof err);
        setError(t("common.error"));
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Modal.Backdrop isDismissable={!saving}>
        <Modal.Container placement="center" size="lg" scroll="inside">
          {/* Wider than HeroUI's lg (32rem); a plain max-w-* loses the cascade (see SettingsModal). */}
          <Modal.Dialog className="w-full max-w-xl!">
            <Modal.CloseTrigger
              aria-label={t("auth.changePassword.close")}
              className="cursor-pointer text-foreground"
            />
            {step === "success" ? (
              <>
                <Modal.Body className="flex flex-col items-center pt-2 text-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <IconShieldCheck size={40} className="text-primary" aria-hidden="true" />
                  </div>
                  <Modal.Heading className="mt-5 font-nunito text-2xl font-bold text-foreground">
                    {t("auth.changePassword.successTitle")}
                  </Modal.Heading>
                  <p className="mt-2 text-base text-muted-foreground">
                    {t("auth.changePassword.successBody")}
                  </p>
                </Modal.Body>
                <Modal.Footer>
                  {/* The focused submit button is gone; land focus here instead. */}
                  <Button
                    autoFocus
                    className="w-full cursor-pointer"
                    onPress={() => handleOpenChange(false)}
                  >
                    {t("common.done")}
                  </Button>
                </Modal.Footer>
              </>
            ) : (
              <>
                <Modal.Header>
                  <Modal.Heading className="flex items-center font-nunito text-2xl font-bold text-primary">
                    <IconKey size={24} className="mr-2" aria-hidden="true" />
                    {t("auth.changePassword.title")}
                  </Modal.Heading>
                </Modal.Header>

                <Modal.Body>
                  <p className="text-sm text-muted-foreground">
                    {t("auth.changePassword.description")}
                  </p>

                  {error && <ErrorBanner message={error} />}

                  <Form
                    id={FORM_ID}
                    className="mt-4 flex flex-col gap-4"
                    validationBehavior="aria"
                    onSubmit={handleSubmit}
                  >
                    <PasswordField
                      isRequired
                      label={t("auth.changePassword.currentLabel")}
                      name="currentPassword"
                      placeholder={t("auth.changePassword.currentPlaceholder")}
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
                  </Form>
                </Modal.Body>

                {/* Cancel + main action side by side; Cancel stays quiet (tertiary). */}
                <Modal.Footer className="flex gap-3">
                  <Button
                    variant="tertiary"
                    className="flex-1 cursor-pointer"
                    isDisabled={saving}
                    onPress={() => handleOpenChange(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    className="flex-1 cursor-pointer"
                    type="submit"
                    form={FORM_ID}
                    isPending={saving}
                    isDisabled={saving}
                  >
                    {saving
                      ? t("auth.changePassword.updating")
                      : t("auth.changePassword.action")}
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
