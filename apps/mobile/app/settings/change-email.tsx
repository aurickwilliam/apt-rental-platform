import { Keyboard, View, Text } from "react-native";
import { useEffect, useRef, useState } from "react";
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
  resendEmailChangeCode,
  verifyEmailChangeCode,
} from "@/service/auth/emailChangeService";
import {
  EMAIL_CHANGE_RESEND_COOLDOWN_SECONDS,
  EmailChangeError,
  getEmailChangeErrorField,
  isValidEmail,
} from "@repo/utils";

const GENERIC_ERROR = "Something went wrong. Please try again.";

type Step = "request" | "verify" | "success";

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

  const [currentCode, setCurrentCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [currentCodeError, setCurrentCodeError] = useState<string | null>(null);
  const [newCodeError, setNewCodeError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState<"current" | "new" | null>(null);
  const [signOutWarning, setSignOutWarning] = useState(false);

  const currentOtpRef = useRef<InputOTPRef>(null);
  const newOtpRef = useRef<InputOTPRef>(null);
  const { countdown, reset: resetCountdown } = useCountdown({
    duration: EMAIL_CHANGE_RESEND_COOLDOWN_SECONDS,
  });

  // Secrets live only here and are cleared when the screen unmounts.
  useEffect(() => {
    return () => {
      setCurrentPassword("");
      setCurrentCode("");
      setNewCode("");
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
      setCurrentCode("");
      setNewCode("");
      currentOtpRef.current?.clear();
      newOtpRef.current?.clear();
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

  const handleVerify = async () => {
    if (verifying) return;
    Keyboard.dismiss();
    if (currentCode.trim().length < 6 || newCode.trim().length < 6) {
      if (currentCode.trim().length < 6) setCurrentCodeError("Enter the 6-digit code.");
      if (newCode.trim().length < 6) setNewCodeError("Enter the 6-digit code.");
      return;
    }

    setVerifying(true);
    setCurrentCodeError(null);
    setNewCodeError(null);
    setError(null);
    try {
      // Verify the current inbox first so a typo in the new address surfaces
      // as a pending mismatch rather than a completed change elsewhere.
      const first = await verifyEmailChangeCode(currentEmail, currentCode, newEmail);
      if (!first.completed) {
        const second = await verifyEmailChangeCode(first.email === currentEmail ? newEmail : currentEmail, newCode, newEmail);
        if (!second.completed) {
          setError("Both codes were accepted but the change is not complete yet. Check both inboxes for a newer code.");
          return;
        }
        setSignOutWarning(second.signOutFailed);
      } else {
        setSignOutWarning(first.signOutFailed);
      }
      setCurrentCode("");
      setNewCode("");
      currentOtpRef.current?.clear();
      newOtpRef.current?.clear();
      toast.show({
        variant: "success",
        label: "Email updated",
        description: signOutWarning ? "Other devices may still be signed in." : "Other devices were signed out.",
      });
      setStep("success");
    } catch (err) {
      if (!(err instanceof EmailChangeError)) {
        console.error("Email change failed:", err instanceof Error ? err.name : typeof err);
        setError(GENERIC_ERROR);
      } else {
        const field = getEmailChangeErrorField(err.reason);
        if (field === "code") {
          // Attribute code failures to the most likely field: keep it simple
          // and show under both when the failing inbox is ambiguous.
          setCurrentCodeError(err.message);
          setNewCodeError(err.message);
        } else {
          setError(err.message);
        }
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async (inbox: "current" | "new") => {
    if (resending || countdown > 0) return;
    setResending(inbox);
    try {
      await resendEmailChangeCode(inbox === "current" ? currentEmail : newEmail);
      resetCountdown();
      toast.show({
        variant: "success",
        label: "Code sent",
        description: inbox === "current" ? "Check your current inbox." : "Check your new inbox.",
      });
    } catch (err) {
      setError(err instanceof EmailChangeError ? err.message : GENERIC_ERROR);
    } finally {
      setResending(null);
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
          : "Enter the 6-digit code from each inbox. The change completes only after both are confirmed."}
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
          <View className="gap-2">
            <Text className="text-foreground text-sm font-nunitoSemiBold">Current inbox code</Text>
            <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} value={currentCode} onChange={setCurrentCode} ref={currentOtpRef}>
              <InputOTP.Group>
                <InputOTP.Slot index={0} />
                <InputOTP.Slot index={1} />
                <InputOTP.Slot index={2} />
                <InputOTP.Slot index={3} />
                <InputOTP.Slot index={4} />
                <InputOTP.Slot index={5} />
              </InputOTP.Group>
            </InputOTP>
            {!!currentCodeError && <Text className="text-danger text-sm font-inter">{currentCodeError}</Text>}
            <Button variant="tertiary" size="sm" isDisabled={!!resending || countdown > 0} onPress={() => handleResend("current")}>
              <Button.Label>{resending === "current" ? "Sending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend current-inbox code"}</Button.Label>
            </Button>
          </View>

          <View className="gap-2">
            <Text className="text-foreground text-sm font-nunitoSemiBold">New inbox code</Text>
            <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} value={newCode} onChange={setNewCode} ref={newOtpRef}>
              <InputOTP.Group>
                <InputOTP.Slot index={0} />
                <InputOTP.Slot index={1} />
                <InputOTP.Slot index={2} />
                <InputOTP.Slot index={3} />
                <InputOTP.Slot index={4} />
                <InputOTP.Slot index={5} />
              </InputOTP.Group>
            </InputOTP>
            {!!newCodeError && <Text className="text-danger text-sm font-inter">{newCodeError}</Text>}
            <Button variant="tertiary" size="sm" isDisabled={!!resending || countdown > 0} onPress={() => handleResend("new")}>
              <Button.Label>{resending === "new" ? "Sending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend new-inbox code"}</Button.Label>
            </Button>
          </View>
        </View>
      )}

      <ErrorDialog isOpen={!!error} onClose={() => setError(null)} message={error} />
    </ScreenWrapper>
  );
}
