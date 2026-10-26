"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import {
  Alert,
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Link as HeroLink,
  TextField,
} from "@heroui/react";
import { IconArrowLeft } from "@tabler/icons-react";

import { RECOVERY_RESET_PATH } from "@repo/supabase/password-recovery";
import {
  isValidEmail,
  passwordErrorMessage,
  type PasswordErrorReason,
  RECOVERY_CODE_LENGTH,
  RECOVERY_RESEND_COOLDOWN_SECONDS,
} from "@repo/utils";

import ErrorBanner from "@/app/components/display/ErrorBanner";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import CodeInput from "@/app/components/inputs/CodeInput";
import { useCountdown } from "@/hooks/use-countdown";
import {
  requestPasswordRecovery,
  verifyPasswordRecoveryCode,
} from "../../actions/password-recovery";
import RecoveryHeader from "./RecoveryHeader";

type Step = "email" | "code" | "google_only";

// Errors shown under the code input; anything else shows the error banner.
const INLINE_CODE_ERRORS = new Set<PasswordErrorReason>(["invalid_or_expired_code", "rate_limited"]);

function BackToSignIn() {
  const { t } = useTranslation();
  return (
    // Anchor outside the button so every click navigates (see AuthWrapper).
    <Link href="/sign-in" aria-label={t("auth.backToSignInAria")}>
      <Button isIconOnly variant="ghost" className="-ml-2 cursor-pointer">
        <IconArrowLeft size={20} />
      </Button>
    </Link>
  );
}

// Email and code steps of password recovery. The email lives only in this
// component's state: never in the URL, storage or a shared context.
export default function ForgotPasswordClient() {
  const router = useRouter();
  const { language, t } = useTranslation();
  const messageFor = (reason: PasswordErrorReason) => passwordErrorMessage(language, reason);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const { secondsLeft, restart: restartCooldown } = useCountdown(RECOVERY_RESEND_COOLDOWN_SECONDS);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) setEmailError(null);
  };

  const handleSendCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError(t("auth.recovery.emailRequired"));
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setEmailError(t("auth.recovery.emailInvalid"));
      return;
    }

    setSending(true);
    try {
      const { error: reason } = await requestPasswordRecovery(trimmedEmail);
      if (reason === "invalid_email") {
        setEmailError(messageFor(reason));
        return;
      }
      if (reason) {
        setError(messageFor(reason));
        return;
      }
      setEmail(trimmedEmail);
      setCode("");
      setCodeError(null);
      setResendNotice(null);
      // A code was just sent, so resend starts on the server's cooldown.
      restartCooldown();
      setStep("code");
    } catch {
      setError(t("common.error"));
    } finally {
      setSending(false);
    }
  };

  const showCodeError = (reason: PasswordErrorReason) => {
    if (INLINE_CODE_ERRORS.has(reason)) {
      setCodeError(messageFor(reason));
      return;
    }
    setError(messageFor(reason));
  };

  const handleVerify = async (value: string = code) => {
    if (verifying || value.length < RECOVERY_CODE_LENGTH) return;
    setVerifying(true);
    setError(null);
    setCodeError(null);
    setResendNotice(null);

    let navigating = false;
    try {
      const result = await verifyPasswordRecoveryCode(email, value);
      if (result.error) {
        setCode("");
        showCodeError(result.error);
        return;
      }
      if (result.status === "google_only") {
        setStep("google_only");
        return;
      }
      // Keep the button busy until the reset page replaces this one.
      navigating = true;
      router.replace(RECOVERY_RESET_PATH);
    } catch {
      setCode("");
      setError(t("common.error"));
    } finally {
      if (!navigating) setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resending || secondsLeft > 0) return;
    setResending(true);
    setError(null);
    setCodeError(null);
    setResendNotice(null);
    try {
      const { error: reason } = await requestPasswordRecovery(email);
      if (reason) {
        showCodeError(reason);
        return;
      }
      setCode("");
      setResendNotice(t("auth.recovery.newCodeSent"));
    } catch {
      setError(t("common.error"));
    } finally {
      // Restart the cooldown either way: after a rate limit the server wants a wait too.
      restartCooldown();
      setResending(false);
    }
  };

  const handleChangeEmail = () => {
    setStep("email");
    setCode("");
    setCodeError(null);
    setResendNotice(null);
    setError(null);
  };

  if (step === "google_only") {
    return (
      <div className="flex flex-1 flex-col">
        <RecoveryHeader
          back={<BackToSignIn />}
          title={t("auth.recovery.googleTitle")}
          description={
            <>
              <span className="font-semibold">{email}</span>{" "}
              {t("auth.recovery.googleAfter")}
            </>
          }
        />

        <div className="mt-[clamp(1.5rem,4vh,2rem)] flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Image src="/third-party/google-logo.svg" alt="" aria-hidden="true" width={40} height={40} />
          </div>
        </div>

        <Link href="/sign-in" className="mt-[clamp(1.5rem,4vh,2rem)]">
          <Button size="lg" className="w-full cursor-pointer">
            {t("auth.backToSignIn")}
          </Button>
        </Link>
      </div>
    );
  }

  if (step === "code") {
    return (
      <div className="flex flex-1 flex-col">
        <RecoveryHeader
          back={<BackToSignIn />}
          title={t("auth.recovery.codeTitle")}
          description={
            <>
              {t("auth.recovery.codeBefore")}{" "}
              <span className="font-semibold">{email}</span>
              {t("auth.recovery.codeAfter")}
            </>
          }
        />

        {/* HeroUI Link without href: an action styled as a link (mobile's LinkButton). */}
        <HeroLink
          onPress={handleChangeEmail}
          isDisabled={verifying}
          className="mt-2 text-primary cursor-pointer"
        >
          {t("auth.wrongEmail")}
        </HeroLink>

        {error && <ErrorBanner message={error} />}

        <div className="mt-[clamp(1.5rem,4vh,2rem)] flex flex-col items-center gap-4">
          <CodeInput
            value={code}
            onChange={(value) => {
              setCode(value);
              if (codeError) setCodeError(null);
            }}
            onComplete={(value: string) => void handleVerify(value)}
            length={RECOVERY_CODE_LENGTH}
            isInvalid={!!codeError}
            isDisabled={verifying}
            autoFocus
          />

          {codeError && (
            <p role="alert" className="text-center text-sm text-danger">
              {codeError}
            </p>
          )}

          {resendNotice && (
            <p role="status" className="text-center text-sm text-foreground">
              {resendNotice}
            </p>
          )}

          <div className="flex items-center gap-2 text-sm text-foreground">
            <span>{t("auth.otp.didntReceive")}</span>
            {secondsLeft > 0 ? (
              <span className="font-medium text-primary">
                {t("auth.otp.resendIn", { seconds: secondsLeft })}
              </span>
            ) : (
              <HeroLink
                onPress={handleResend}
                isDisabled={resending}
                className="text-primary cursor-pointer"
              >
                {resending ? t("auth.otp.sending") : t("auth.otp.resendCode")}
              </HeroLink>
            )}
          </div>
        </div>

        <Button
          size="lg"
          className="mt-[clamp(1.5rem,4vh,2rem)] w-full cursor-pointer"
          isPending={verifying}
          isDisabled={verifying || code.length < RECOVERY_CODE_LENGTH}
          onPress={() => void handleVerify()}
        >
          {verifying ? t("auth.otp.verifying") : t("auth.otp.verifyCode")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <RecoveryHeader
        back={<BackToSignIn />}
        title={t("auth.recovery.requestTitle")}
        description={t("auth.recovery.requestBody")}
      />

      {error && <ErrorBanner message={error} />}

      <Form
        className={`${error ? "mt-4" : "mt-[clamp(1.5rem,4vh,2rem)]"} flex flex-col gap-[clamp(0.75rem,2vh,1rem)]`}
        validationBehavior="aria"
        onSubmit={handleSendCode}
      >
        <TextField
          name="email"
          type="email"
          isRequired
          value={email}
          onChange={handleEmailChange}
          isInvalid={!!emailError}
          isDisabled={sending}
          autoComplete="email"
        >
          <Label>{t("auth.email")}</Label>
          <Input
            placeholder={t("auth.emailPlaceholder")}
            className="bg-card! text-foreground!"
          />
          <FieldError>{emailError}</FieldError>
        </TextField>

        <Button
          className="mt-[clamp(0.75rem,2vh,1.25rem)] w-full cursor-pointer"
          size="lg"
          type="submit"
          isPending={sending}
          isDisabled={sending}
        >
          {sending ? t("auth.recovery.sendingCode") : t("auth.recovery.sendCode")}
        </Button>
      </Form>

      {/* Pinned to the bottom of the panel, just above the footer. */}
      <div className="mt-auto pt-[clamp(1.5rem,4vh,2rem)]">
        <Alert status="accent" className="border border-primary/20 bg-accent!">
          {/* `!`: @heroui/styles pins the indicator to the top (unlayered CSS). */}
          <Alert.Indicator className="self-center!">
            <Image
              src="/third-party/google-logo.svg"
              alt=""
              aria-hidden="true"
              width={28}
              height={28}
              className="shrink-0"
            />
          </Alert.Indicator>
          <Alert.Content className="gap-1">
            <Alert.Title className="text-foreground!">
              {t("auth.recovery.googleNoticeTitle")}
            </Alert.Title>
            <Alert.Description className="text-sm text-foreground/80!">
              {t("auth.recovery.googleNoticeBody")}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      </div>
    </div>
  );
}
