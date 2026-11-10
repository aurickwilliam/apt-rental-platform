"use client";

import { useEffect, useState, useTransition } from "react";
import { unstable_rethrow, useRouter } from "next/navigation";

import { Button, Form } from "@heroui/react";
import { IconArrowLeft } from "@tabler/icons-react";

import { usePasswordValidation } from "@repo/hooks";
import { RECOVERY_START_PATH } from "@repo/supabase/password-recovery";
import { passwordErrorMessage, type PasswordErrorReason } from "@repo/utils";

import ErrorBanner from "@/app/components/display/ErrorBanner";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import NewPasswordFields from "@/app/components/inputs/NewPasswordFields";
import {
  cancelPasswordRecovery,
  updateRecoveredPassword,
} from "../../actions/password-recovery";
import RecoveryHeader from "./RecoveryHeader";

// Server errors shown under the password field; anything else shows the banner.
const INLINE_PASSWORD_ERRORS = new Set<PasswordErrorReason>(["same_password", "weak_password"]);

// Rendered only for a verified recovery session (checked by the page and the
// middleware). Leaving by any route other than success ends that session.
//
// Both actions finish with a server-side redirect (success page / sign-in), which
// rejects the action's promise with Next's redirect signal. They run inside a
// transition and pass that signal on with unstable_rethrow, so Next's router
// handles the redirect instead of it being shown as an error.
export default function ResetPasswordClient() {
  const router = useRouter();
  const { language, t } = useTranslation();
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    passwordRequirements,
    isPasswordValid,
  } = usePasswordValidation();

  const [submitted, setSubmitted] = useState(false);
  const [saving, startSaving] = useTransition();
  const [leaving, startLeaving] = useTransition();
  const [restarting, setRestarting] = useState(false);
  const [serverPasswordError, setServerPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const busy = saving || leaving || restarting;

  // Browser back/forward can restore a cached page without a server request,
  // so the middleware never sees it. Reloading makes it a real page load,
  // which the middleware turns into a sign-out.
  useEffect(() => {
    const handlePopState = () => window.location.reload();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const passwordError = (() => {
    if (submitted && !password.trim()) return t("auth.changePassword.required");
    if (submitted && !isPasswordValid) {
      return t("auth.changePassword.requirements");
    }
    return serverPasswordError;
  })();

  const confirmPasswordError = (() => {
    if (submitted && !confirmPassword.trim()) {
      return t("auth.changePassword.required");
    }
    if (submitted && password !== confirmPassword) {
      return t("auth.changePassword.mismatch");
    }
    return null;
  })();

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (serverPasswordError) setServerPasswordError(null);
  };

  const handleCancel = () => {
    if (busy) return;
    startLeaving(async () => {
      try {
        await cancelPasswordRecovery();
      } catch (err) {
        unstable_rethrow(err);
        // A full page load lets the middleware sign this browser out instead.
        console.error("Password recovery cancel failed:", err instanceof Error ? err.name : typeof err);
        window.location.assign("/sign-in");
      }
    });
  };

  const handleRestart = () => {
    setRestarting(true);
    router.replace(RECOVERY_START_PATH);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || sessionExpired) return;
    setSubmitted(true);
    setError(null);
    if (!isPasswordValid) return;

    setServerPasswordError(null);
    startSaving(async () => {
      try {
        // Success redirects to the success page; only failures return.
        const { error: reason } = await updateRecoveredPassword(password);
        const message = passwordErrorMessage(language, reason);
        if (INLINE_PASSWORD_ERRORS.has(reason)) {
          setServerPasswordError(message);
        } else if (reason === "session_expired") {
          setSessionExpired(true);
          setError(message);
        } else {
          setError(message);
        }
      } catch (err) {
        unstable_rethrow(err);
        // Log the type only: an unexpected message could echo the password.
        console.error("Password reset failed:", err instanceof Error ? err.name : typeof err);
        setError(t("common.error"));
      }
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      <RecoveryHeader
        back={
          <Button
            isIconOnly
            variant="ghost"
            className="-ml-2 cursor-pointer"
            aria-label={t("auth.recovery.cancelAria")}
            isDisabled={busy}
            onPress={handleCancel}
          >
            <IconArrowLeft size={20} />
          </Button>
        }
        title={t("auth.recovery.resetTitle")}
        description={t("auth.recovery.resetBody")}
      />

      {error && (
        <ErrorBanner message={error}>
          {sessionExpired && (
            <Button
              size="sm"
              variant="secondary"
              className="mt-3 cursor-pointer"
              onPress={handleRestart}
              isDisabled={restarting}
            >
              {t("auth.recovery.requestNewCode")}
            </Button>
          )}
        </ErrorBanner>
      )}

      <Form
        className={`${error ? "mt-4" : "mt-[clamp(1.5rem,4vh,2rem)]"} flex flex-col gap-[clamp(0.75rem,2vh,1rem)]`}
        validationBehavior="aria"
        onSubmit={handleSubmit}
      >
        <NewPasswordFields
          password={password}
          confirmPassword={confirmPassword}
          onPasswordChange={handlePasswordChange}
          onConfirmPasswordChange={setConfirmPassword}
          requirements={passwordRequirements}
          passwordError={passwordError}
          confirmPasswordError={confirmPasswordError}
          isDisabled={busy || sessionExpired}
        />

        {/* Cancel + main action side by side; Cancel stays quiet (tertiary). */}
        <div className="mt-[clamp(0.75rem,2vh,1.25rem)] flex gap-3">
          <Button
            variant="tertiary"
            size="lg"
            className="flex-1 cursor-pointer"
            isDisabled={busy}
            onPress={handleCancel}
          >
            {t("common.cancel")}
          </Button>

          <Button
            className="flex-1 cursor-pointer"
            size="lg"
            type="submit"
            isPending={saving}
            isDisabled={busy || sessionExpired}
          >
            {saving ? t("auth.recovery.saving") : t("auth.recovery.resetTitle")}
          </Button>
        </div>
      </Form>
    </div>
  );
}
