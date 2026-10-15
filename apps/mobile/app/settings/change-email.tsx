import { Keyboard, View, Text } from "react-native";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useRouter } from "expo-router";

import { Button, FieldError, Input, InputOTP, Label, REGEXP_ONLY_DIGITS, Spinner, TextField, useToast, type InputOTPRef } from "heroui-native";

import ScreenWrapper from "components/layout/ScreenWrapper";
import StandardHeader from "components/layout/StandardHeader";
import ErrorDialog from "@/components/display/ErrorDialog";
import PasswordField from "@/components/inputs/PasswordField";

import { useColors } from "@/hooks/useTheme";
import { useCountdown } from "@/hooks/auth";
import {
  getEmailChangeAccount,
  requestEmailChange,
  resendEmailChangeCodes,
  verifyEmailChangeCode,
} from "@/service/auth/emailChangeService";
import { invalidateCurrentUser } from "@/utils/queryClient";
import {
  EMAIL_CHANGE_CODE_LENGTH,
  EMAIL_CHANGE_RESEND_COOLDOWN_SECONDS,
  EmailChangeError,
  getEmailChangeErrorField,
  isValidEmail,
  type EmailChangeInbox,
} from "@repo/utils";

const GENERIC_ERROR = "Something went wrong. Please try again.";
const NOT_COMPLETE_ERROR =
  "Both codes were accepted but the change isn't complete yet. Resend the codes and try again.";
const INBOXES: EmailChangeInbox[] = ["current", "new"];
const INBOX_LABELS: Record<EmailChangeInbox, string> = {
  current: "Current inbox code",
  new: "New inbox code",
};

type Step = "request" | "verify" | "success";
type InboxState<T> = Record<EmailChangeInbox, T>;

const NO_CODES: InboxState<string> = { current: "", new: "" };
const NOT_CONFIRMED: InboxState<boolean> = { current: false, new: false };
const NO_CODE_ERRORS: InboxState<string | null> = { current: null, new: null };

export default function ChangeEmail() {
  const router = useRouter();
  const { toast } = useToast();
  const { colors } = useColors();

  const [step, setStep] = useState<Step>("request");
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [currentEmail, setCurrentEmail] = useState("");
  const [pendingNewEmail, setPendingNewEmail] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newEmailError, setNewEmailError] = useState<string | null>(null);
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Supabase uses up an accepted code, so a confirmed inbox is never sent again.
  const [codes, setCodes] = useState<InboxState<string>>(NO_CODES);
  const [confirmed, setConfirmed] = useState<InboxState<boolean>>(NOT_CONFIRMED);
  const [codeErrors, setCodeErrors] = useState<InboxState<string | null>>(NO_CODE_ERRORS);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [signOutWarning, setSignOutWarning] = useState(false);
  const [profileSyncWarning, setProfileSyncWarning] = useState(false);

  const currentOtpRef = useRef<InputOTPRef>(null);
  const newOtpRef = useRef<InputOTPRef>(null);
  const otpRefs: InboxState<RefObject<InputOTPRef | null>> = {
    current: currentOtpRef,
    new: newOtpRef,
  };
  const { countdown, reset: resetCountdown } = useCountdown({
    duration: EMAIL_CHANGE_RESEND_COOLDOWN_SECONDS,
  });

  // Secrets live only here and are cleared when the screen unmounts.
  useEffect(() => {
    return () => {
      setCurrentPassword("");
      setCodes(NO_CODES);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const account = await getEmailChangeAccount();
        if (cancelled) return;
        setCurrentEmail(account.email);
        setPendingNewEmail(account.pendingNewEmail);
        if (account.pendingNewEmail) {
          setNewEmail(account.pendingNewEmail);
          setStep("verify");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof EmailChangeError ? err.message : GENERIC_ERROR);
        }
      } finally {
        if (!cancelled) setLoadingAccount(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const clearCodes = () => {
    setCodes(NO_CODES);
    setConfirmed(NOT_CONFIRMED);
    setCodeErrors(NO_CODE_ERRORS);
    currentOtpRef.current?.clear();
    newOtpRef.current?.clear();
  };

  // Back to the request step, e.g. to fix a mistyped new address. Requesting
  // again replaces the pending change.
  const startOver = () => {
    clearCodes();
    setNewEmail("");
    setSubmitted(false);
    setStep("request");
  };

  const showFlowError = (err: unknown) => {
    if (!(err instanceof EmailChangeError)) {
      console.error("Email change failed:", err instanceof Error ? err.name : typeof err);
      setError(GENERIC_ERROR);
      return;
    }
    if (err.reason === "no_pending_change") {
      setPendingNewEmail(null);
      startOver();
    }
    setError(err.message);
  };

  const getNewEmailError = (): string | undefined => {
    if (newEmailError) return newEmailError;
    if (submitted && !newEmail.trim()) return "Please enter a new email address.";
    if (submitted && !isValidEmail(newEmail.trim())) return "Enter a valid email address.";
    return undefined;
  };

  const getCurrentPasswordError = (): string | undefined => {
    if (currentPasswordError) return currentPasswordError;
    if (submitted && !currentPassword) return "Please enter your current password.";
    return undefined;
  };

  const handleRequest = async () => {
    if (saving) return;
    Keyboard.dismiss();
    setSubmitted(true);
    setError(null);
    if (!newEmail.trim() || !isValidEmail(newEmail.trim()) || !currentPassword) return;

    setSaving(true);
    setNewEmailError(null);
    setCurrentPasswordError(null);
    try {
      const result = await requestEmailChange(newEmail, currentPassword);
      setCurrentEmail(result.currentEmail);
      setNewEmail(result.newEmail);
      setPendingNewEmail(result.newEmail);
      setCurrentPassword("");
      clearCodes();
      resetCountdown();
      setStep("verify");
    } catch (err) {
      if (!(err instanceof EmailChangeError)) {
        console.error("Email change failed:", err instanceof Error ? err.name : typeof err);
        setError(GENERIC_ERROR);
      } else {
        const field = getEmailChangeErrorField(err.reason);
        if (field === "new") setNewEmailError(err.message);
        else if (field === "current") setCurrentPasswordError(err.message);
        else setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const unconfirmedInboxes = INBOXES.filter((inbox) => !confirmed[inbox]);

  const handleVerify = async () => {
    if (verifying) return;
    Keyboard.dismiss();
    const incomplete = unconfirmedInboxes.filter(
      (inbox) => codes[inbox].trim().length < EMAIL_CHANGE_CODE_LENGTH,
    );
    if (incomplete.length > 0) {
      setCodeErrors({
        ...NO_CODE_ERRORS,
        ...Object.fromEntries(incomplete.map((inbox) => [inbox, "Enter the 6-digit code."])),
      });
      return;
    }

    setVerifying(true);
    setCodeErrors(NO_CODE_ERRORS);
    setError(null);
    for (const inbox of unconfirmedInboxes) {
      try {
        const result = await verifyEmailChangeCode(inbox, codes[inbox], newEmail);
        if (result.completed) {
          setSignOutWarning(result.signOutFailed);
          setProfileSyncWarning(result.profileSyncFailed);
          setCodes(NO_CODES);
          await invalidateCurrentUser();
          toast.show({
            variant: "success",
            label: "Email updated",
            description: result.signOutFailed
              ? "Other devices may still be signed in."
              : "Other devices were signed out.",
          });
          setStep("success");
          setVerifying(false);
          return;
        }
        setConfirmed((previous) => ({ ...previous, [inbox]: true }));
        setCodes((previous) => ({ ...previous, [inbox]: "" }));
      } catch (err) {
        if (err instanceof EmailChangeError && getEmailChangeErrorField(err.reason) === "code") {
          setCodeErrors({ ...NO_CODE_ERRORS, [inbox]: err.message });
          otpRefs[inbox].current?.clear();
          setCodes((previous) => ({ ...previous, [inbox]: "" }));
        } else {
          showFlowError(err);
        }
        setVerifying(false);
        return;
      }
    }
    setError(NOT_COMPLETE_ERROR);
    setVerifying(false);
  };

  // Supabase issues new codes for both inboxes, so earlier codes and
  // confirmations no longer count.
  const handleResend = async () => {
    if (resending || countdown > 0) return;
    setResending(true);
    try {
      await resendEmailChangeCodes();
      clearCodes();
      resetCountdown();
      toast.show({
        variant: "success",
        label: "Codes sent",
        description: "Check both your current and new inboxes.",
      });
    } catch (err) {
      showFlowError(err);
    } finally {
      setResending(false);
    }
  };

  if (loadingAccount) {
    return (
      <ScreenWrapper header={<StandardHeader title="Change Email" />} className="p-5">
        <View className="flex-1 items-center justify-center py-20">
          <Spinner size="lg" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (step === "success") {
    return (
      <ScreenWrapper header={<StandardHeader title="Change Email" />} className="p-5">
        <View className="flex-1 items-center justify-center gap-3 py-20">
          <Text className="text-foreground text-xl font-nunitoBold text-center">Email Updated</Text>
          <Text className="text-muted text-base font-inter text-center">
            Your new email is ready to use. You’re still signed in here
            {signOutWarning ? ", but other devices may still be signed in." : ", and any other devices were signed out."}
          </Text>
          {profileSyncWarning ? (
            <Text className="text-muted text-sm font-inter text-center">
              Your profile may show your old email for a little while.
            </Text>
          ) : null}
          <Button className="mt-4 w-full" onPress={() => router.back()}>
            <Button.Label>Done</Button.Label>
          </Button>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      scrollable
      header={<StandardHeader title="Change Email" />}
      footer={
        <View className="p-5">
          <Button
            onPress={step === "request" ? handleRequest : handleVerify}
            isDisabled={saving || verifying}
            className="w-full"
          >
            <Button.Label>
              {step === "request" ? (saving ? "Sending codes..." : "Send Verification Codes") : verifying ? "Verifying..." : "Verify and Update Email"}
            </Button.Label>
            {(saving || verifying) && <Spinner size="sm" color={colors.white} className="ml-2" />}
          </Button>
        </View>
      }
      className="p-5"
    >
      <Text className="text-base text-foreground font-inter">
        {step === "request"
          ? "Enter a new email and your current password. We’ll send a 6-digit code to both your current and new inboxes. Your current email stays active until both codes are confirmed."
          : `Enter the 6-digit code sent to each inbox. Your email changes to ${newEmail} only after both are confirmed.`}
      </Text>

      {step === "request" ? (
        <View className="flex gap-4 mt-5">
          <TextField isDisabled>
            <Label>Current Email:</Label>
            <Input value={currentEmail} editable={false} autoCapitalize="none" />
          </TextField>

          <TextField isRequired isInvalid={!!getNewEmailError()} isDisabled={saving}>
            <Label>New Email:</Label>
            <Input
              placeholder="Enter your new email"
              value={newEmail}
              onChangeText={(value) => {
                setNewEmail(value);
                if (newEmailError) setNewEmailError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              editable={!saving}
            />
            {!!getNewEmailError() && <FieldError>{getNewEmailError()}</FieldError>}
          </TextField>

          <PasswordField
            label="Current Password:"
            placeholder="Enter your current password"
            value={currentPassword}
            onChangeText={(value) => {
              setCurrentPassword(value);
              if (currentPasswordError) setCurrentPasswordError(null);
            }}
            error={getCurrentPasswordError()}
            isDisabled={saving}
          />
          {pendingNewEmail ? (
            <Text className="text-muted text-sm font-inter">
              A change to {pendingNewEmail} is already pending. Sending new codes replaces it.
            </Text>
          ) : null}
        </View>
      ) : (
        <View className="flex gap-4 mt-5">
          {INBOXES.map((inbox) => (
            <View key={inbox} className="gap-2">
              <Text className="text-foreground text-sm font-nunitoSemiBold">{INBOX_LABELS[inbox]}</Text>
              {confirmed[inbox] ? (
                <Text className="text-success text-sm font-inter">Confirmed</Text>
              ) : (
                <InputOTP
                  maxLength={EMAIL_CHANGE_CODE_LENGTH}
                  pattern={REGEXP_ONLY_DIGITS}
                  value={codes[inbox]}
                  onChange={(value) => {
                    setCodes((previous) => ({ ...previous, [inbox]: value }));
                    if (codeErrors[inbox]) setCodeErrors((previous) => ({ ...previous, [inbox]: null }));
                  }}
                  isDisabled={verifying}
                  ref={otpRefs[inbox]}
                >
                  <InputOTP.Group>
                    <InputOTP.Slot index={0} />
                    <InputOTP.Slot index={1} />
                    <InputOTP.Slot index={2} />
                    <InputOTP.Slot index={3} />
                    <InputOTP.Slot index={4} />
                    <InputOTP.Slot index={5} />
                  </InputOTP.Group>
                </InputOTP>
              )}
              {!!codeErrors[inbox] && <Text className="text-danger text-sm font-inter">{codeErrors[inbox]}</Text>}
            </View>
          ))}

          <Button variant="tertiary" size="sm" isDisabled={resending || verifying || countdown > 0} onPress={handleResend}>
            <Button.Label>{resending ? "Sending..." : countdown > 0 ? `Resend codes in ${countdown}s` : "Resend codes"}</Button.Label>
          </Button>
          <Button variant="tertiary" size="sm" isDisabled={verifying} onPress={startOver}>
            <Button.Label>Use a different email</Button.Label>
          </Button>
        </View>
      )}

      <ErrorDialog isOpen={!!error} onClose={() => setError(null)} message={error} />
    </ScreenWrapper>
  );
}
