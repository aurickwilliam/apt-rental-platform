import { Keyboard, Pressable, Text, View } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";

import { Button, CloseButton, LinkButton, Spinner, useToast, type InputOTPRef } from "heroui-native";
import { IconChevronLeft, IconShieldCheck } from "@tabler/icons-react-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import ErrorDialog from "@/components/display/ErrorDialog";
import CodeInput from "@/components/inputs/CodeInput";

import { useColors } from "@/hooks/useTheme";
import { useCountdown } from "@/hooks/auth";
import { useTranslation } from "@/hooks/i18n";
import {
  getEmailChangeAccount,
  resendEmailChangeCodes,
  verifyEmailChangeCode,
} from "@/service/auth/emailChangeService";
import { invalidateCurrentUser } from "@/utils/queryClient";
import {
  EMAIL_CHANGE_CODE_LENGTH,
  EMAIL_CHANGE_RESEND_COOLDOWN_SECONDS,
  EmailChangeError,
  emailChangeErrorMessage,
  getEmailChangeErrorField,
  type EmailChangeInbox,
} from "@repo/utils";


const GENERIC_ERROR = "Something went wrong. Please try again.";
const REQUEST_PATH = "/settings/change-email";
const VERIFY_NEW_PATH = "/settings/change-email/verify-new";

const COPY: Record<EmailChangeInbox, { step: string; title: string; body: string }> = {
  current: {
    step: "Step 1 of 2",
    title: "Check your current email",
    body: "Enter it below to confirm this change is really you.",
  },
  new: {
    step: "Step 2 of 2",
    title: "Check your new email",
    body: "Enter it below to confirm you can receive email there.",
  },
};

interface EmailChangeCodeScreenProps {
  inbox: EmailChangeInbox;
}

// One page per inbox of Settings → Change Email (verify-current, then
// verify-new), laid out like the password-recovery code screen. The addresses
// are re-read from Auth on each page, never passed in the route. Supabase uses
// up an accepted code, so the current page is confirmed before the new one.
export default function EmailChangeCodeScreen({ inbox }: EmailChangeCodeScreenProps) {
  const router = useRouter();
  const { colors } = useColors();
  const { toast } = useToast();
  const { language } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [currentEmail, setCurrentEmail] = useState("");
  const [pendingNewEmail, setPendingNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [done, setDone] = useState<{ signOutFailed: boolean; profileSyncFailed: boolean } | null>(null);

  const codeRef = useRef<InputOTPRef>(null);
  const { countdown, reset: resetCountdown } = useCountdown({
    duration: EMAIL_CHANGE_RESEND_COOLDOWN_SECONDS,
  });

  // Back to the request form, which is always first in this stack (e.g. to
  // fix a mistyped new address).
  const startOver = useCallback(() => router.dismissTo(REQUEST_PATH), [router]);

  const clearCode = useCallback(() => {
    setCode("");
    codeRef.current?.clear();
  }, []);

  // The code is a secret: cleared on leaving, and a page returned to (after
  // a resend from the next page) starts empty.
  useFocusEffect(
    useCallback(() => {
      return clearCode;
    }, [clearCode]),
  );

  const showError = (err: unknown) => {
    if (!(err instanceof EmailChangeError)) {
      console.error("Email change failed:", err instanceof Error ? err.name : typeof err);
      setError(GENERIC_ERROR);
      return;
    }
    if (err.reason === "no_pending_change") {
      toast.show({ variant: "danger", label: emailChangeErrorMessage(language, err.reason) });
      startOver();
      return;
    }
    if (getEmailChangeErrorField(err.reason) === "code") {
      setCodeError(emailChangeErrorMessage(language, err.reason));
      return;
    }
    setError(emailChangeErrorMessage(language, err.reason));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const account = await getEmailChangeAccount();
        if (cancelled) return;
        if (!account.pendingNewEmail) {
          startOver();
          return;
        }
        setCurrentEmail(account.email);
        setPendingNewEmail(account.pendingNewEmail);

      } catch (err) {
        if (!cancelled) showError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Runs once per page; startOver and showError only navigate or set state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async (value: string = code) => {
    if (verifying || value.length < EMAIL_CHANGE_CODE_LENGTH) return;
    // Close the keyboard before this page may navigate away.
    Keyboard.dismiss();

    setVerifying(true);
    setCodeError(null);
    setResendNotice(null);
    try {
      const result = await verifyEmailChangeCode(inbox, value, pendingNewEmail);
      clearCode();
      if (result.completed) {
        await invalidateCurrentUser();
        setDone({ signOutFailed: result.signOutFailed, profileSyncFailed: result.profileSyncFailed });
        return;
      }
      if (inbox === "current") {
        router.push(VERIFY_NEW_PATH);
        return;
      }
      // The new inbox is confirmed but the current one isn't yet (e.g. a
      // resumed change): go back and confirm it.
      toast.show({
        variant: "success",
        label: "New email confirmed",
        description: "Now enter the code from your current email.",
      });
      router.back();
    } catch (err) {
      clearCode();
      showError(err);
    } finally {
      setVerifying(false);
    }
  };

  // Supabase issues new codes for both inboxes, so the current inbox must be
  // confirmed again: from the new-email page this goes back a page.
  const handleResend = async () => {
    if (resending || countdown > 0) return;

    setResending(true);
    setCodeError(null);
    setResendNotice(null);
    try {
      await resendEmailChangeCodes();
      clearCode();
      if (inbox === "new") {
        toast.show({
          variant: "success",
          label: "New codes sent",
          description: "Enter the code from your current email first.",
        });
        router.back();
        return;
      }
      setResendNotice("New codes are on their way to both inboxes.");
    } catch (err) {
      showError(err);
    } finally {
      // Restart the cooldown either way: after a rate limit the server wants a wait too.
      resetCountdown();
      setResending(false);
    }
  };

  if (done) {
    return (
      <ScreenWrapper className="p-5">
        <View className="flex-1 items-center justify-center gap-10">
          {/* Same shield-check as the web success state. */}
          <View className="rounded-full bg-primary/10 p-7">
            <IconShieldCheck size={96} color={colors.primary} />
          </View>

          <View>
            <Text className="text-accent text-2xl font-nunitoBold text-center">Email Updated</Text>
            <Text className="text-foreground text-base font-inter mt-2 text-center">
              Great! Your new email is ready to use. You’re still signed in here
              {done.signOutFailed ? ", but other devices may still be signed in." : ", and any other devices were signed out."}
            </Text>
            {done.profileSyncFailed ? (
              <Text className="text-muted text-sm font-inter mt-2 text-center">
                Your profile may show your old email for a little while.
              </Text>
            ) : null}
          </View>
        </View>

        <Button onPress={() => router.dismissTo("/settings")}>
          <Button.Label className="font-nunitoSemiBold">Back to Settings</Button.Label>
        </Button>
      </ScreenWrapper>
    );
  }

  const copy = COPY[inbox];
  const inboxEmail = inbox === "current" ? currentEmail : pendingNewEmail;

  return (
    <ScreenWrapper className="p-5" scrollable>
      <View>
        <CloseButton
          variant="ghost"
          className="-ml-2"
          onPress={router.back}
          accessibilityLabel="Go back"
        >
          <IconChevronLeft size={26} color={colors.textPrimary} />
        </CloseButton>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center py-20">
          <Spinner size="lg" color={colors.primary} />
        </View>
      ) : (
        <>
          <View className="flex gap-3 mt-5">
            <Text className="text-muted text-sm font-interSemiBold">{copy.step}</Text>

            <Text className="text-foreground text-2xl font-nunitoBold">{copy.title}</Text>

            <Text className="text-base text-foreground font-inter">
              We’ve sent a 6-digit code to{" "}
              <Text className="font-interSemiBold">{inboxEmail}</Text>. {copy.body}
            </Text>

            {/* Only the new address can be wrong: step 1 is the account's own email. */}
            {inbox === "new" ? (
              <LinkButton onPress={startOver} className="self-start p-0" isDisabled={verifying}>
                <LinkButton.Label className="text-accent font-nunitoSemiBold underline">
                  Wrong email? Change it
                </LinkButton.Label>
              </LinkButton>
            ) : null}
          </View>

          <View className="items-center my-6">
            <CodeInput
              ref={codeRef}
              value={code}
              onChange={(value) => {
                setCode(value);
                if (codeError) setCodeError(null);
              }}
              onComplete={handleVerify}
              length={EMAIL_CHANGE_CODE_LENGTH}
              isInvalid={!!codeError}
              isDisabled={verifying}
            />

            {!!codeError && (
              <Text className="text-danger text-sm font-inter mt-3 text-center">{codeError}</Text>
            )}
            {!!resendNotice && (
              <Text className="text-success-text text-sm font-inter mt-3 text-center">
                {resendNotice}
              </Text>
            )}
          </View>

          <View className="flex-row items-center justify-center">
            <Text className="text-muted text-base">Didn&apos;t get the code? </Text>
            {countdown > 0 ? (
              <Text className="text-accent text-base font-nunitoSemiBold">Resend in {countdown}s</Text>
            ) : (
              <Pressable
                onPress={handleResend}
                disabled={resending}
                className={resending ? "opacity-50" : ""}
                accessibilityRole="button"
                hitSlop={10}
              >
                <Text className="text-accent text-base font-nunitoSemiBold">
                  {resending ? "Sending..." : "Resend"}
                </Text>
              </Pressable>
            )}
          </View>

          <View className="flex-1" />

          <Button
            onPress={() => handleVerify()}
            isDisabled={verifying || code.length < EMAIL_CHANGE_CODE_LENGTH}
            className="mt-8"
          >
            <Button.Label className="font-nunitoSemiBold">
              {verifying ? "Verifying..." : "Verify Code"}
            </Button.Label>
            {verifying && <Spinner size="sm" color={colors.white} className="ml-2" />}
          </Button>
        </>
      )}

      <ErrorDialog isOpen={!!error} onClose={() => setError(null)} message={error} />
    </ScreenWrapper>
  );
}
