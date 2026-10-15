"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button, Form, Input, Modal, TextField, Label, toast, Link as HeroLink, Spinner } from "@heroui/react";
import { IconMail, IconShieldCheck } from "@tabler/icons-react";

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
import CodeInput from "@/app/components/inputs/CodeInput";
import PasswordField from "@/app/components/inputs/PasswordField";
import { useCountdown } from "@/hooks/use-countdown";

const FORM_ID = "change-email-form";

type Step = "request" | EmailChangeInbox | "success";

// One code step per inbox, laid out like the password-recovery code step.
const CODE_STEPS: Record<EmailChangeInbox, { label: string; title: string; body: string }> = {
  current: {
    label: "Step 1 of 2",
    title: "Check your current email",
    body: "Enter it below to confirm this change is really you.",
  },
  new: {
    label: "Step 2 of 2",
    title: "Check your new email",
    body: "Enter it below to confirm you can receive email there.",
  },
};

const UNEXPECTED_ERROR = "Something went wrong. Please try again.";

interface ChangeEmailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Settings → Security → Change Email, mirroring mobile
// (app/settings/change-email.tsx). Opened from the Security tab, which
// closes the Settings modal first. On success the form is replaced by a
// confirmation. The current inbox is confirmed first, then the new one, each
// on its own step: Supabase uses up an accepted code, so a confirmed inbox is
// never sent again. Emails, passwords and codes live only in this component's
// state and are cleared on close.
export default function ChangeEmailModal({ isOpen, onOpenChange }: ChangeEmailModalProps) {
  const router = useRouter();
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

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeNotice, setCodeNotice] = useState<string | null>(null);
  const [verifying, startVerifying] = useTransition();
  const [resending, startResending] = useTransition();
  const [signOutWarning, setSignOutWarning] = useState(false);
  const [profileSyncWarning, setProfileSyncWarning] = useState(false);
  const { secondsLeft, restart } = useCountdown(EMAIL_CHANGE_RESEND_COOLDOWN_SECONDS);

  // Each opening starts at the request form and reads the current address from
  // Auth (below). Sending codes replaces any change already waiting there.
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
    void (async () => {
      const account = await getEmailChangeAccount();
      if (cancelled) return;
      if (account.error) {
        setLoadingAccount(false);
        setError(new EmailChangeError(account.error).message);
        return;
      }
      setCurrentEmail(account.email ?? "");
      setLoadingAccount(false);
    })();
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

  const clearCode = () => {
    setCode("");
    setCodeError(null);
    setCodeNotice(null);
  };

  const reset = () => {
    setCurrentEmail("");
    setNewEmail("");
    setCurrentPassword("");
    setSubmitted(false);
    setServerNewEmailError(null);
    setServerCurrentPasswordError(null);
    setError(null);
    clearCode();
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
    clearCode();
    setNewEmail("");
    setSubmitted(false);
    setStep("request");
  };

  const showFlowError = (reason: EmailChangeErrorReason) => {
    if (reason === "no_pending_change") startOver();
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
        if (result.newEmail) setNewEmail(result.newEmail);
        clearCode();
        restart();
        setStep("current");
        return;
      }

      const message = new EmailChangeError(result.error).message;
      const field = getEmailChangeErrorField(result.error);
      if (field === "new") setServerNewEmailError(message);
      else if (field === "current") setServerCurrentPasswordError(message);
      else setError(message);
    });
  };

  const handleVerify = (inbox: EmailChangeInbox, value: string = code) => {
    if (verifying || value.length < EMAIL_CHANGE_CODE_LENGTH) return;
    setCodeError(null);
    setCodeNotice(null);
    setError(null);
    startVerifying(async () => {
      try {
        const result = await verifyEmailChangeCode(inbox, value, newEmail);
        setCode("");
        if (result.error) {
          if (getEmailChangeErrorField(result.error) === "code") {
            setCodeError(new EmailChangeError(result.error).message);
          } else {
            showFlowError(result.error);
          }
          return;
        }
        if (result.completed) {
          setSignOutWarning(result.signOutFailed ?? false);
          setProfileSyncWarning(result.profileSyncFailed ?? false);
          toast.success("Email updated");
          setStep("success");
          // Server-rendered pages (navbar, profile) show the new address.
          router.refresh();
          return;
        }
        if (inbox === "current") {
          setStep("new");
          return;
        }
        // The new inbox is confirmed but the current one isn't yet (e.g. a
        // resumed change): confirm it now.
        setStep("current");
        setCodeNotice("Your new email is confirmed. Now enter the code from your current email.");
      } catch (err) {
        setCode("");
        console.error("Email change failed:", err instanceof Error ? err.name : typeof err);
        setError(UNEXPECTED_ERROR);
      }
    });
  };

  // Supabase issues new codes for both inboxes, so the current inbox is
  // confirmed again first.
  const handleResend = () => {
    if (resending || secondsLeft > 0) return;
    setError(null);
    setCodeError(null);
    setCodeNotice(null);
    startResending(async () => {
      const { error: reason } = await resendEmailChangeCodes();
      // Restart the cooldown either way: after a rate limit the server wants a wait too.
      restart();
      if (reason) {
        if (getEmailChangeErrorField(reason) === "code") setCodeError(new EmailChangeError(reason).message);
        else showFlowError(reason);
        return;
      }
      setCode("");
      setStep("current");
      setCodeNotice(
        step === "new"
          ? "New codes sent to both inboxes. Enter the code from your current email first."
          : "New codes are on their way to both inboxes.",
      );
    });
  };

  const codeStep = step === "current" || step === "new" ? CODE_STEPS[step] : null;
  const inboxEmail = step === "current" ? currentEmail : newEmail;

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
                  {codeStep ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-semibold text-muted-foreground">{codeStep.label}</p>
                      <Modal.Heading className="font-nunito text-2xl font-bold text-foreground">
                        {codeStep.title}
                      </Modal.Heading>
                    </div>
                  ) : (
                    <Modal.Heading className="flex items-center font-nunito text-2xl font-bold text-primary">
                      <IconMail size={24} className="mr-2" aria-hidden="true" />
                      Change Email
                    </Modal.Heading>
                  )}
                </Modal.Header>

                <Modal.Body>
                  {loadingAccount ? (
                    // The step is unknown until Auth is read (a waiting change
                    // opens at its code step), so show neither form yet.
                    <div className="flex justify-center py-12">
                      <Spinner size="lg" />
                    </div>
                  ) : codeStep ? (
                    <>
                      <p className="text-base text-foreground">
                        We sent a 6-digit code to <span className="font-semibold">{inboxEmail}</span>.{" "}
                        {codeStep.body}
                      </p>

                      {/* Only the new address can be wrong: step 1 is the account's own
                          email. HeroUI Link without href: an action styled as a link. */}
                      {step === "new" && (
                        <HeroLink
                          onPress={startOver}
                          isDisabled={verifying}
                          className="mt-2 cursor-pointer text-primary"
                        >
                          Wrong email? Change it
                        </HeroLink>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Enter a new email and your current password. We’ll send a 6-digit code to both your current and new inboxes. Your current email stays active until both codes are confirmed.
                    </p>
                  )}

                  {error && <ErrorBanner message={error} />}

                  {loadingAccount ? null : step === "request" ? (
                    <Form
                      id={FORM_ID}
                      className="mt-4 flex flex-col gap-4"
                      validationBehavior="aria"
                      onSubmit={handleRequest}
                    >
                      <TextField isDisabled>
                        <Label>Current Email</Label>
                        <Input value={currentEmail} readOnly />
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
                    <div className="mt-6 flex flex-col items-center gap-4">
                      <CodeInput
                        // Remount per step so focus lands on the fresh input.
                        key={step}
                        aria-label={`${codeStep?.title ?? "Email"} 6-digit code`}
                        value={code}
                        onChange={(value) => {
                          setCode(value);
                          if (codeError) setCodeError(null);
                        }}
                        onComplete={(value) => {
                          if (step === "current" || step === "new") handleVerify(step, value);
                        }}
                        length={EMAIL_CHANGE_CODE_LENGTH}
                        isInvalid={!!codeError}
                        isDisabled={verifying}
                        autoFocus
                      />

                      {codeError && (
                        <p role="alert" className="text-center text-sm text-danger">
                          {codeError}
                        </p>
                      )}

                      {codeNotice && (
                        <p role="status" className="text-center text-sm text-foreground">
                          {codeNotice}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <span>Didn&apos;t receive a code?</span>
                        {secondsLeft > 0 ? (
                          <span className="font-medium text-primary">Resend in {secondsLeft}s</span>
                        ) : (
                          <HeroLink
                            onPress={handleResend}
                            isDisabled={resending || verifying}
                            className="cursor-pointer text-primary"
                          >
                            {resending ? "Sending..." : "Resend"}
                          </HeroLink>
                        )}
                      </div>

                      <Button
                        size="lg"
                        className="mt-2 w-full cursor-pointer"
                        isPending={verifying}
                        isDisabled={verifying || code.length < EMAIL_CHANGE_CODE_LENGTH}
                        onPress={() => {
                          if (step === "current" || step === "new") handleVerify(step);
                        }}
                      >
                        {verifying ? "Verifying..." : "Verify Code"}
                      </Button>
                    </div>
                  )}
                </Modal.Body>

                {step === "request" && !loadingAccount && (
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
