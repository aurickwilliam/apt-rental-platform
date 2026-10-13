"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Form } from "@heroui/react";
import { ArrowLeft } from "lucide-react";

import { usePasswordValidation } from "@repo/hooks";
import { RECOVERY_START_PATH } from "@repo/supabase/password-recovery";
import { PasswordError, type PasswordErrorReason } from "@repo/utils";

import PasswordField from "@/app/components/inputs/PasswordField";
import {
  cancelPasswordRecovery,
  updateRecoveredPassword,
} from "../../actions/password-recovery";
import ErrorBanner from "./ErrorBanner";
import PasswordRequirementList from "./PasswordRequirementList";
import RecoveryHeader from "./RecoveryHeader";

// Server errors shown under the password field; anything else shows the banner.
const INLINE_PASSWORD_ERRORS = new Set<PasswordErrorReason>(["same_password", "weak_password"]);
const UNEXPECTED_ERROR = "Something went wrong. Please try again.";

// Rendered only for a verified recovery session (checked by the page and the
// middleware). Leaving by any route other than success ends that session.
export default function ResetPasswordClient() {
  const router = useRouter();
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    passwordRequirements,
    isPasswordValid,
  } = usePasswordValidation();

  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [serverPasswordError, setServerPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const busy = saving || leaving;

  // Browser back/forward can restore a cached page without a server request,
  // so the middleware never sees it; end the recovery here instead.
  useEffect(() => {
    const handlePopState = () => {
      cancelPasswordRecovery().catch(() => {
        console.error("Password recovery cancel failed");
      });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const passwordError = (() => {
    if (submitted && !password.trim()) return "This field is required";
    if (submitted && !isPasswordValid) {
      return "Password does not meet the requirements or password does not match";
    }
    return serverPasswordError;
  })();

  const confirmPasswordError = (() => {
    if (submitted && !confirmPassword.trim()) return "This field is required";
    if (submitted && password !== confirmPassword) return "Passwords do not match";
    return null;
  })();

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (serverPasswordError) setServerPasswordError(null);
  };

  const handleCancel = async () => {
    if (busy) return;
    setLeaving(true);
    try {
      await cancelPasswordRecovery();
    } catch {
      // The middleware still signs this browser out on the next page.
      console.error("Password recovery cancel failed");
    }
    router.replace("/sign-in");
  };

  const handleRestart = () => {
    setLeaving(true);
    router.replace(RECOVERY_START_PATH);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || sessionExpired) return;
    setSubmitted(true);
    setError(null);
    if (!isPasswordValid) return;

    setSaving(true);
    setServerPasswordError(null);
    try {
      // On success the action signs every session out and redirects to the
      // success page; only failures come back with a reason.
      const result: Awaited<ReturnType<typeof updateRecoveredPassword>> | undefined =
        await updateRecoveredPassword(password);
      if (!result) return;
      const reason = result.error;
      const message = new PasswordError(reason).message;
      if (INLINE_PASSWORD_ERRORS.has(reason)) {
        setServerPasswordError(message);
      } else if (reason === "session_expired") {
        setSessionExpired(true);
        setError(message);
      } else {
        setError(message);
      }
    } catch (err) {
      // Log the type only: an unexpected message could echo the password.
      console.error("Password reset failed:", err instanceof Error ? err.name : typeof err);
      setError(UNEXPECTED_ERROR);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <RecoveryHeader
        back={
          <Button
            isIconOnly
            variant="ghost"
            className="-ml-2 cursor-pointer"
            aria-label="Cancel password reset"
            isDisabled={busy}
            onPress={handleCancel}
          >
            <ArrowLeft size={20} />
          </Button>
        }
        title="Reset Password"
        description="Almost done! Let’s set a fresh new password."
      />

      {error && (
        <ErrorBanner message={error}>
          {sessionExpired && (
            <Button
              size="sm"
              variant="secondary"
              className="mt-3 cursor-pointer"
              onPress={handleRestart}
              isDisabled={leaving}
            >
              Request a new code
            </Button>
          )}
        </ErrorBanner>
      )}

      <Form
        className={`${error ? "mt-4" : "mt-[clamp(1.5rem,4vh,2rem)]"} flex flex-col gap-[clamp(0.75rem,2vh,1rem)]`}
        validationBehavior="aria"
        onSubmit={handleSubmit}
      >
        <PasswordField
          isRequired
          label="New Password"
          name="password"
          placeholder="Enter your new password"
          autoComplete="new-password"
          value={password}
          onChange={handlePasswordChange}
          isInvalid={!!passwordError}
          errorMessage={passwordError ?? undefined}
          isDisabled={busy || sessionExpired}
        />

        <PasswordField
          isRequired
          label="Confirm Password"
          name="confirmPassword"
          placeholder="Confirm your new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          isInvalid={!!confirmPasswordError}
          errorMessage={confirmPasswordError ?? undefined}
          isDisabled={busy || sessionExpired}
        />

        <PasswordRequirementList
          requirements={passwordRequirements}
          hasInput={password.length > 0 || confirmPassword.length > 0}
        />

        <Button
          className="mt-[clamp(0.75rem,2vh,1.25rem)] w-full cursor-pointer"
          size="lg"
          type="submit"
          isPending={saving}
          isDisabled={busy || sessionExpired}
        >
          {saving ? "Saving..." : "Reset Password"}
        </Button>

        <Button
          variant="ghost"
          size="lg"
          className="w-full cursor-pointer"
          isDisabled={busy}
          onPress={handleCancel}
        >
          Cancel
        </Button>
      </Form>
    </div>
  );
}
