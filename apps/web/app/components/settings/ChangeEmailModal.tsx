"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button, Form, Input, Modal, TextField, Label, toast, InputOTP, REGEXP_ONLY_DIGITS } from "@heroui/react";
import { IconCircleCheck, IconMail, IconShieldCheck } from "@tabler/icons-react";

import {
  EMAIL_CHANGE_CODE_LENGTH,
  EMAIL_CHANGE_RESEND_COOLDOWN_SECONDS,
  EmailChangeError,
  getEmailChangeErrorField,
  type EmailChangeErrorReason,
  type EmailChangeInbox,
} from "@repo/utils";

import {
  getEmailChangeAccount,
  requestEmailChange,
  resendEmailChangeCodes,
  verifyEmailChangeCode,
} from "@/app/(auth)/actions/change-email";
import ErrorBanner from "@/app/components/display/ErrorBanner";
import PasswordField from "@/app/components/inputs/PasswordField";
import { useCountdown } from "@/hooks/use-countdown";

const FORM_ID = "change-email-form";
const CODE_SLOT_CLASS = "size-12 text-lg";
const INBOXES: EmailChangeInbox[] = ["current", "new"];
const INBOX_LABELS: Record<EmailChangeInbox, string> = {
  current: "Current inbox code",
  new: "New inbox code",
};

type Step = "request" | "verify" | "success";
type InboxState<T> = Record<EmailChangeInbox, T>;

const UNEXPECTED_ERROR = "Something went wrong. Please try again.";
const NOT_COMPLETE_ERROR =
  "Both codes were accepted but the change isn't complete yet. Resend the codes and try again.";
const NO_CODES: InboxState<string> = { current: "", new: "" };
const NOT_CONFIRMED: InboxState<boolean> = { current: false, new: false };
const NO_CODE_ERRORS: InboxState<string | null> = { current: null, new: null };

interface ChangeEmailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Settings → Security → Change Email, mirroring mobile
// (app/settings/change-email.tsx). Opened from the Security tab, which
// closes the Settings modal first. On success the form is replaced by a
// confirmation. Emails, passwords and codes live only in this component's
// state and are cleared on close.
export default function ChangeEmailModal({ isOpen, onOpenChange }: ChangeEmailModalProps) {
  const router = useRouter();
  const [currentEmail, setCurrentEmail] = useState("");
  const [pendingNewEmail, setPendingNewEmail] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, startSaving] = useTransition();
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [serverNewEmailError, setServerNewEmailError] = useState<string | null>(null);
  const [serverCurrentPasswordError, setServerCurrentPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("request");

  // Supabase uses up an accepted code, so a confirmed inbox is never sent again.
  const [codes, setCodes] = useState<InboxState<string>>(NO_CODES);
  const [confirmed, setConfirmed] = useState<InboxState<boolean>>(NOT_CONFIRMED);
  const [codeErrors, setCodeErrors] = useState<InboxState<string | null>>(NO_CODE_ERRORS);
  const [verifying, startVerifying] = useTransition();
  const [resending, startResending] = useTransition();
  const [signOutWarning, setSignOutWarning] = useState(false);
  const [profileSyncWarning, setProfileSyncWarning] = useState(false);
  const { secondsLeft, restart } = useCountdown(EMAIL_CHANGE_RESEND_COOLDOWN_SECONDS);

  // Each opening starts from the request step and reads canonical Auth state
  // (below), so a pending change resumes from the server, not saved state.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setStep("request");
      setError(null);
      setLoadingAccount(true);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    void getEmailChangeAccount().then((account) => {
      if (cancelled) return;
      setLoadingAccount(false);
      if (account.error) {
        setError(new EmailChangeError(account.error).message);
        return;
      }
      setCurrentEmail(account.email ?? "");
      setPendingNewEmail(account.pendingNewEmail ?? null);
      if (account.pendingNewEmail) {
        setNewEmail(account.pendingNewEmail);
        setStep("verify");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const newEmailError = (() => {
    if (submitted && !newEmail.trim()) return "Please enter a new email address.";
    return serverNewEmailError;
  })();

  const currentPasswordError = (() => {
    if (submitted && !currentPassword) return "Please enter your current password.";
    return serverCurrentPasswordError;
  })();

  const clearCodes = () => {
    setCodes(NO_CODES);
    setConfirmed(NOT_CONFIRMED);
    setCodeErrors(NO_CODE_ERRORS);
  };

  const reset = () => {
    setCurrentEmail("");
    setPendingNewEmail(null);
    setNewEmail("");
    setCurrentPassword("");
    setSubmitted(false);
    setServerNewEmailError(null);
    setServerCurrentPasswordError(null);
    setError(null);
    clearCodes();
    setSignOutWarning(false);
    setProfileSyncWarning(false);
  };

  // Stays open while a request is in flight, so the result is never lost.
  const handleOpenChange = (open: boolean) => {
    if (!open && (saving || verifying)) return;
    if (!open) reset();
    onOpenChange(open);
  };

  // Back to the request step, e.g. to fix a mistyped new address. Requesting
  // again replaces the pending change.
  const startOver = () => {
    clearCodes();
    setNewEmail("");
    setSubmitted(false);
    setStep("request");
  };

  const showFlowError = (reason: EmailChangeErrorReason) => {
    if (reason === "no_pending_change") {
      setPendingNewEmail(null);
      startOver();
    }
    setError(new EmailChangeError(reason).message);
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
      const result = await requestEmailChange(newEmail, currentPassword);
      if (!result.error) {
        setCurrentPassword("");
        if (result.currentEmail) setCurrentEmail(result.currentEmail);
        if (result.newEmail) {
          setNewEmail(result.newEmail);
          setPendingNewEmail(result.newEmail);
        }
        clearCodes();
        restart();
        setStep("verify");
        return;
      }

      const message = new EmailChangeError(result.error).message;
      const field = getEmailChangeErrorField(result.error);
      if (field === "new") setServerNewEmailError(message);
      else if (field === "current") setServerCurrentPasswordError(message);
      else setError(message);
    });
  };

  const unconfirmedInboxes = INBOXES.filter((inbox) => !confirmed[inbox]);
  const canVerify =
    !verifying && unconfirmedInboxes.every((inbox) => codes[inbox].length === EMAIL_CHANGE_CODE_LENGTH);

  const handleVerify = () => {
    if (!canVerify) return;
    setCodeErrors(NO_CODE_ERRORS);
    setError(null);
    startVerifying(async () => {
      try {
        for (const inbox of unconfirmedInboxes) {
          const result = await verifyEmailChangeCode(inbox, codes[inbox], newEmail);
          if (result.error) {
            if (getEmailChangeErrorField(result.error) === "code") {
              const message = new EmailChangeError(result.error).message;
              setCodeErrors({ ...NO_CODE_ERRORS, [inbox]: message });
            } else {
              showFlowError(result.error);
            }
            return;
          }
          if (result.completed) {
            setSignOutWarning(result.signOutFailed ?? false);
            setProfileSyncWarning(result.profileSyncFailed ?? false);
            setCodes(NO_CODES);
            toast.success("Email updated");
            setStep("success");
            // Server-rendered pages (navbar, profile) show the new address.
            router.refresh();
            return;
          }
          setConfirmed((previous) => ({ ...previous, [inbox]: true }));
          setCodes((previous) => ({ ...previous, [inbox]: "" }));
        }
        setError(NOT_COMPLETE_ERROR);
      } catch (err) {
        console.error("Email change failed:", err instanceof Error ? err.name : typeof err);
        setError(UNEXPECTED_ERROR);
      }
    });
  };

  // Supabase issues new codes for both inboxes, so earlier codes and
  // confirmations no longer count.
  const handleResend = () => {
    if (resending || secondsLeft > 0) return;
    setError(null);
    startResending(async () => {
      const { error: reason } = await resendEmailChangeCodes();
      if (reason) {
        showFlowError(reason);
        return;
      }
      clearCodes();
      restart();
      toast.success("New codes sent to both inboxes");
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
                  {profileSyncWarning && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Your profile may show your old email for a little while.
                    </p>
                  )}
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
                      : `Enter the 6-digit code sent to each inbox. Your email changes to ${newEmail} only after both are confirmed.`}
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

                      {pendingNewEmail && (
                        <p className="text-sm text-muted-foreground">
                          A change to {pendingNewEmail} is still waiting. Sending new codes replaces it.
                        </p>
                      )}
                    </Form>
                  ) : (
                    <div className="mt-4 flex flex-col gap-6">
                      {INBOXES.map((inbox) => (
                        <div key={inbox} className="flex flex-col items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{INBOX_LABELS[inbox]}</p>
                          {confirmed[inbox] ? (
                            <p className="flex items-center gap-1 text-sm font-medium text-success">
                              <IconCircleCheck size={18} aria-hidden="true" />
                              Confirmed
                            </p>
                          ) : (
                            <InputOTP
                              aria-label={`${INBOX_LABELS[inbox]}, 6 digits`}
                              maxLength={EMAIL_CHANGE_CODE_LENGTH}
                              value={codes[inbox]}
                              onChange={(value) => {
                                setCodes((previous) => ({ ...previous, [inbox]: value }));
                                if (codeErrors[inbox]) {
                                  setCodeErrors((previous) => ({ ...previous, [inbox]: null }));
                                }
                              }}
                              isInvalid={!!codeErrors[inbox]}
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
                          )}
                          {codeErrors[inbox] && (
                            <p role="alert" className="text-center text-sm text-danger">
                              {codeErrors[inbox]}
                            </p>
                          )}
                        </div>
                      ))}

                      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer text-primary"
                          isDisabled={resending || verifying || secondsLeft > 0}
                          onPress={handleResend}
                        >
                          {secondsLeft > 0
                            ? `Resend codes in ${secondsLeft}s`
                            : resending
                              ? "Sending..."
                              : "Resend codes"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer text-primary"
                          isDisabled={verifying}
                          onPress={startOver}
                        >
                          Use a different email
                        </Button>
                      </div>

                      <Button
                        className="w-full cursor-pointer"
                        isPending={verifying}
                        isDisabled={!canVerify}
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
                      isDisabled={saving || loadingAccount}
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
