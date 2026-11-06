"use client";

import { useCallback, useState } from "react";
import { createClient } from "@repo/supabase/browser";
import { AUTH_THROTTLE_MESSAGE, CAPTCHA_FAILED_MESSAGE, CAPTCHA_PENDING_MESSAGE, isCaptchaError, getEmailCodeRequestError, getOtpAttemptError, parseResendWaitSeconds } from "@repo/utils";
import { verifySignupCode } from "../actions/verify-signup-code";
import { useResendCooldown } from "./use-resend-cooldown";
import { useOtpAttempts } from "./use-otp-attempts";
import type { CaptchaAttempt } from "@/hooks/use-captcha";

const CODE_COOLDOWN = 60;

// Where a confirmed account with no profile continues (see middleware).
const FINISH_PROFILE_PATH = "/sign-up?from=profile-missing";

// Confirms the email of an account whose sign-up was left before the code was
// entered (sign-in answers "Email not confirmed"). A verified code starts a
// session, and the missing profile is then finished like any interrupted
// sign-up. No form data is kept anywhere, so nothing is lost by refreshing.
export function useConfirmEmail(email: string, takeCaptcha?: () => CaptchaAttempt) {
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
      const captcha = takeCaptcha?.();
      if (captcha?.pending) {
        setOtpError(CAPTCHA_PENDING_MESSAGE);
        return;
      }
      const { error } = await createClient().auth.resend({
        type: "signup",
        email: email.trim(),
        options: captcha?.token ? { captchaToken: captcha.token } : undefined,
      });
      if (isCaptchaError(error)) {
        setOtpError(CAPTCHA_FAILED_MESSAGE);
        return;
      }
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
  }, [email, start, attempts, takeCaptcha]);

  const open = useCallback(() => {
    setIsOpen(true);
    void sendCode();
  }, [sendCode]);

  const verify = useCallback(async () => {
    setLoading(true);
    setOtpError(null);
    try {
      // The guess limit lives on the server, so neither a refresh nor a direct
      // call skips it. A verified code sets the session cookies in the response.
      const verification = await verifySignupCode(email, otp);
      if (!verification.ok) {
        setOtpError(
          verification.reason === "rate_limited"
            ? AUTH_THROTTLE_MESSAGE
            : getOtpAttemptError(attempts.recordWrongCode()),
        );
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
