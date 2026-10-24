"use client";

import { useCallback, useState } from "react";
import { createClient } from "@repo/supabase/browser";
import { getEmailCodeRequestError, parseResendWaitSeconds } from "@repo/utils";
import { useResendCooldown } from "./use-resend-cooldown";
import { useOtpAttempts } from "./use-otp-attempts";

const CODE_COOLDOWN = 60;

// Where a confirmed account with no profile continues (see middleware).
const FINISH_PROFILE_PATH = "/sign-up?from=profile-missing";

// Confirms the email of an account whose sign-up was left before the code was
// entered (sign-in answers "Email not confirmed"). A verified code starts a
// session, and the missing profile is then finished like any interrupted
// sign-up. No form data is kept anywhere, so nothing is lost by refreshing.
export function useConfirmEmail(email: string) {
  const [isOpen, setIsOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { cooldown, start, stop, format } = useResendCooldown(CODE_COOLDOWN);
  const attempts = useOtpAttempts();

  const sendCode = useCallback(async () => {
    setResendLoading(true);
    setOtpError(null);
    try {
      const { error } = await createClient().auth.resend({
        type: "signup",
        email: email.trim(),
      });
      if (error) {
        // A throttled resend means a code was sent moments ago and still works.
        const waitSeconds = parseResendWaitSeconds(error.message);
        if (waitSeconds !== null) start(waitSeconds);
        else setOtpError(getEmailCodeRequestError(error.message));
        return;
      }
      setOtp("");
      attempts.reset();
      start();
    } catch {
      setOtpError("Failed to send the code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  }, [email, start, attempts]);

  const open = useCallback(() => {
    setIsOpen(true);
    void sendCode();
  }, [sendCode]);

  const verify = useCallback(async () => {
    setLoading(true);
    setOtpError(null);
    try {
      const { data, error } = await createClient().auth.verifyOtp({
        email: email.trim(),
        token: otp,
        type: "signup",
      });
      if (error || !data.user) {
        setOtpError(attempts.recordWrongCode());
        setOtp("");
        return;
      }
      // Full navigation: the new session cookies must reach the server.
      window.location.assign(FINISH_PROFILE_PATH);
    } catch {
      setOtpError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email, otp, attempts]);

  const cancel = useCallback(() => {
    setIsOpen(false);
    setOtp("");
    setOtpError(null);
    stop();
  }, [stop]);

  return {
    isOpen,
    otp,
    setOtp,
    otpError,
    resendCooldown: cooldown,
    formatCooldown: format,
    resendLoading,
    loading,
    otpLocked: attempts.locked,
    open,
    sendCode,
    verify,
    cancel,
  };
}
