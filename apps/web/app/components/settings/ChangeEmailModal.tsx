"use client";

import { useState, useTransition } from "react";

import { Button, Form, Input, Modal, TextField, Label, toast, InputOTP, REGEXP_ONLY_DIGITS } from "@heroui/react";
import { IconMail, IconShieldCheck } from "@tabler/icons-react";

import { EMAIL_CHANGE_RESEND_COOLDOWN_SECONDS, EmailChangeError, getEmailChangeErrorField } from "@repo/utils";

import {
  getEmailChangeAccount,
  requestEmailChange,
  resendEmailChangeCode,
  verifyEmailChangeCode,
} from "@/app/(auth)/actions/change-email";
import ErrorBanner from "@/app/components/display/ErrorBanner";
import PasswordField from "@/app/components/inputs/PasswordField";
import { useCountdown } from "@/hooks/use-countdown";

const FORM_ID = "change-email-form";
const CODE_SLOT_CLASS = "size-12 text-lg";

type Step = "request" | "verify" | "success";
const UNEXPECTED_ERROR = "Something went wrong. Please try again.";

interface ChangeEmailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Settings → Security → Change Email, mirroring mobile
// (app/settings/change-email.tsx). Opened from the Security tab, which
// closes the Settings modal first. On success the form is replaced by a
// confirmation. Emails, passwords and codes live only in this component's
// state and are cleared on success or close.
export default function ChangeEmailModal({ isOpen, onOpenChange }: ChangeEmailModalProps) {
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, startSaving] = useTransition();
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [serverNewEmailError, setServerNewEmailError] = useState<string | null>(null);
  const [serverCurrentPasswordError, setServerCurrentPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("request");

  const [currentCode, setCurrentCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [verifying, startVerifying] = useTransition();
  const [resending, startResending] = useTransition();
  const [signOutWarning, setSignOutWarning] = useState(false);
  const { secondsLeft, restart } = useCountdown(EMAIL_CHANGE_RESEND_COOLDOWN_SECONDS);

  // Each opening starts by reading canonical Auth state, so a pending change
  // resumes from the server rather than saved form state.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setStep("request");
      setError(null);
      setLoadingAccount(true);
      void getEmailChangeAccount().then((account) => {
        setLoadingAccount(false);
        if (account.error) {
          setError(new EmailChangeError(account.error).message);
          return;
        }
        if (account.email) setCurrentEmail(account.email);
        if (account.pendingNewEmail) {
          setNewEmail(account.pendingNewEmail);
          setStep("verify");
        }
      });
    }
  }

  const newEmailError = (() => {
    if (submitted && !newEmail.trim()) return "Please enter a new email address.";
    return serverNewEmailError;
  })();

  const currentPasswordError = (() => {
    if (submitted && !currentPassword) return "Please enter your current password.";
    return serverCurrentPasswordError;
  })();

  const reset = () => {
    setNewEmail("");
    setCurrentPassword("");
    setSubmitted(false);
    setServerNewEmailError(null);
    setServerCurrentPasswordError(null);
    setError(null);
    setCurrentCode("");
    setNewCode("");
    setCodeError(null);
    setSignOutWarning(false);
  };

  // Stays open while a request is in flight, so the result is never lost.
  const handleOpenChange = (open: boolean) => {
    if (!open && (saving || verifying)) return;
    if (!open) reset();
    onOpenChange(open);
  };

  const handleRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSubmitted(true);
    setError(null);
    if (!newEmail.trim() || !currentPassword) return;

    setServerNewEmailError(null);
    setServerCurrentPasswordError(null);
    startSaving(async () => {
      const { error: reason, newEmail: confirmed } = await requestEmailChange(newEmail, currentPassword);
      if (!reason) {
        setCurrentPassword("");
        if (confirmed) setNewEmail(confirmed);
        setCurrentCode("");
        setNewCode("");
        restart();
        setStep("verify");
        return;
      }

      const message = new EmailChangeError(reason).message;
      const field = getEmailChangeErrorField(reason);
      if (field === "new") setServerNewEmailError(message);
      else if (field === "current") setServerCurrentPasswordError(message);
      else setError(message);
    });
  };

  const handleVerify = () => {
    if (verifying || currentCode.length < 6 || newCode.length < 6) return;
    setCodeError(null);
    setError(null);
    startVerifying(async () => {
      try {
        const first = await verifyEmailChangeCode(currentEmail, currentCode, newEmail);
        if (first.error) {
          setCodeError(new EmailChangeError(first.error).message);
          return;
        }
        if (first.completed) {
          setSignOutWarning(first.signOutFailed ?? false);
          setCurrentCode("");
          setNewCode("");
          toast.success("Email updated");
          setStep("success");
          return;
        }
        const second = await verifyEmailChangeCode(newEmail, newCode, newEmail);
        if (second.error) {
          setCodeError(new EmailChangeError(second.error).message);
          return;
        }
        if (!second.completed) {
          setError("Both codes were accepted but the change is not complete yet. Check both inboxes for a newer code.");
          return;
        }
        setSignOutWarning(second.signOutFailed ?? false);
        setCurrentCode("");
        setNewCode("");
        toast.success("Email updated");
        setStep("success");
      } catch (err) {
        console.error("Email change failed:", err instanceof Error ? err.name : typeof err);
        setError(UNEXPECTED_ERROR);
      }
    });
  };

  const handleResend = (inbox: "current" | "new") => {
    if (resending || secondsLeft > 0) return;
    startResending(async () => {
      const { error: reason } = await resendEmailChangeCode(inbox === "current" ? currentEmail : newEmail);
      if (reason) {
        setError(new EmailChangeError(reason).message);
        return;
      }
      restart();
      toast.success("Code sent");
    });
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Modal.Backdrop isDismissable={!saving && !verifying}>
        <Modal.Container placement="center" size="lg" scroll="inside">
          <Modal.Dialog className="w-full max-w-xl!">
            <Modal.CloseTrigger
              aria-label="Close change email"
              className="cursor-pointer text-foreground"
            />
            {step === "success" ? (
              <>
                <Modal.Body className="flex flex-col items-center pt-2 text-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <IconShieldCheck size={40} className="text-primary" aria-hidden="true" />
                  </div>
                  <Modal.Heading className="mt-5 font-nunito text-2xl font-bold text-foreground">
                    Email Updated
                  </Modal.Heading>
                  <p className="mt-2 text-base text-muted-foreground">
                    Great! Your new email is ready to use. You’re still signed
                    in here{signOutWarning ? ", but other devices may still be signed in." : ", and any other devices were signed out."}{" "}
                    We’ve also emailed you a confirmation.
                  </p>
                </Modal.Body>
                <Modal.Footer>
                  <Button
                    autoFocus
                    className="w-full cursor-pointer"
                    onPress={() => handleOpenChange(false)}
                  >
                    Done
                  </Button>
                </Modal.Footer>
              </>
            ) : (
              <>
                <Modal.Header>
                  <Modal.Heading className="flex items-center font-nunito text-2xl font-bold text-primary">
                    <IconMail size={24} className="mr-2" aria-hidden="true" />
                    Change Email
                  </Modal.Heading>
                </Modal.Header>

                <Modal.Body>
                  <p className="text-sm text-muted-foreground">
                    {step === "request"
                      ? "Enter a new email and your current password. We’ll send a 6-digit code to both your current and new inboxes. Your current email stays active until both codes are confirmed."
                      : "Enter the 6-digit code from each inbox. The change completes only after both are confirmed."}
                  </p>

                  {error && <ErrorBanner message={error} />}

                  {step === "request" ? (
                    <Form
                      id={FORM_ID}
                      className="mt-4 flex flex-col gap-4"
                      validationBehavior="aria"
                      onSubmit={handleRequest}
                    >
                      <TextField isDisabled>
                        <Label>Current Email</Label>
                        <Input value={loadingAccount ? "Loading..." : currentEmail} readOnly />
                      </TextField>

                      <TextField
                        isRequired
                        isInvalid={!!newEmailError}
                        isDisabled={saving || loadingAccount}
                        value={newEmail}
                        onChange={(value) => {
                          setNewEmail(value);
                          if (serverNewEmailError) setServerNewEmailError(null);
                        }}
                      >
                        <Label>New Email</Label>
                        <Input
                          name="newEmail"
                          placeholder="Enter your new email"
                          autoComplete="email"
                        />
                        {!!newEmailError && <p className="text-sm text-danger">{newEmailError}</p>}
                      </TextField>

                      <PasswordField
                        isRequired
                        label="Current Password"
                        name="currentPassword"
                        placeholder="Enter your current password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(value) => {
                          setCurrentPassword(value);
                          if (serverCurrentPasswordError) setServerCurrentPasswordError(null);
                        }}
                        isInvalid={!!currentPasswordError}
                        errorMessage={currentPasswordError ?? undefined}
                        isDisabled={saving}
                      />
                    </Form>
                  ) : (
                    <div className="mt-4 flex flex-col gap-6">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">Current inbox code</p>
                        <InputOTP
                          aria-label="Current inbox 6-digit code"
                          maxLength={6}
                          value={currentCode}
                          onChange={(value) => {
                            setCurrentCode(value);
                            if (codeError) setCodeError(null);
                          }}
                          isInvalid={!!codeError}
                          isDisabled={verifying}
                          pattern={REGEXP_ONLY_DIGITS}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          className="justify-center"
                        >
                          <InputOTP.Group>
                            <InputOTP.Slot index={0} className={CODE_SLOT_CLASS} />
                            <InputOTP.Slot index={1} className={CODE_SLOT_CLASS} />
                            <InputOTP.Slot index={2} className={CODE_SLOT_CLASS} />
                          </InputOTP.Group>
                          <InputOTP.Separator />
                          <InputOTP.Group>
                            <InputOTP.Slot index={3} className={CODE_SLOT_CLASS} />
                            <InputOTP.Slot index={4} className={CODE_SLOT_CLASS} />
                            <InputOTP.Slot index={5} className={CODE_SLOT_CLASS} />
                          </InputOTP.Group>
                        </InputOTP>
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">New inbox code</p>
                        <InputOTP
                          aria-label="New inbox 6-digit code"
                          maxLength={6}
                          value={newCode}
                          onChange={(value) => {
                            setNewCode(value);
                            if (codeError) setCodeError(null);
                          }}
                          isInvalid={!!codeError}
                          isDisabled={verifying}
                          pattern={REGEXP_ONLY_DIGITS}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          className="justify-center"
                        >
                          <InputOTP.Group>
                            <InputOTP.Slot index={0} className={CODE_SLOT_CLASS} />
                            <InputOTP.Slot index={1} className={CODE_SLOT_CLASS} />
                            <InputOTP.Slot index={2} className={CODE_SLOT_CLASS} />
                          </InputOTP.Group>
                          <InputOTP.Separator />
                          <InputOTP.Group>
                            <InputOTP.Slot index={3} className={CODE_SLOT_CLASS} />
                            <InputOTP.Slot index={4} className={CODE_SLOT_CLASS} />
                            <InputOTP.Slot index={5} className={CODE_SLOT_CLASS} />
                          </InputOTP.Group>
                        </InputOTP>
                      </div>

                      {codeError && (
                        <p role="alert" className="text-center text-sm text-danger">
                          {codeError}
                        </p>
                      )}

                      <div className="flex items-center justify-center gap-4 text-sm">
                        {secondsLeft > 0 ? (
                          <span className="font-medium text-primary">Resend in {secondsLeft}s</span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleResend("current")}
                              disabled={resending}
                              className="cursor-pointer text-primary disabled:opacity-50"
                            >
                              {resending ? "Sending..." : "Resend current-inbox code"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResend("new")}
                              disabled={resending}
                              className="cursor-pointer text-primary disabled:opacity-50"
                            >
                              {resending ? "Sending..." : "Resend new-inbox code"}
                            </button>
                          </>
                        )}
                      </div>

                      <Button
                        className="w-full cursor-pointer"
                        isPending={verifying}
                        isDisabled={verifying || currentCode.length < 6 || newCode.length < 6}
                        onPress={handleVerify}
                      >
                        {verifying ? "Verifying..." : "Verify and Update Email"}
                      </Button>
                    </div>
                  )}
                </Modal.Body>

                {step === "request" && (
                  <Modal.Footer className="flex gap-3">
                    <Button
                      variant="tertiary"
                      className="flex-1 cursor-pointer"
                      isDisabled={saving}
                      onPress={() => handleOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 cursor-pointer"
                      type="submit"
                      form={FORM_ID}
                      isPending={saving}
                      isDisabled={saving}
                    >
                      {saving ? "Sending..." : "Send Verification Codes"}
                    </Button>
                  </Modal.Footer>
                )}
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
