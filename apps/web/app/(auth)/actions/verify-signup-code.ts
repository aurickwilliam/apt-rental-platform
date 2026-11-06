"use server";

import { createClient } from "@repo/supabase/server";
import {
  checkAuthThrottle,
  clearAuthThrottle,
  isInvalidOtpError,
  recordAuthFailure,
} from "@repo/utils";

import { getAuthThrottleClient } from "@/lib/auth-throttle-server";

// Verifies the 6-digit email code of a sign-up (new account, or an account whose
// sign-up was left before the code). Runs on the server, like password-recovery
// code verification, so the guess limit cannot be skipped from the browser: the
// failure window is read and written here, with the service role, and a refreshed
// page does not reset it. A verified code starts a session in the Auth cookies.
//
// Only a wrong or expired code counts as a failure, never a network or Auth
// throttle error. Unknown emails get the same answers, so nothing is revealed.

export type VerifySignupCodeResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "rate_limited" | "invalid_code" | "failed" };

export async function verifySignupCode(
  email: string,
  code: string,
): Promise<VerifySignupCodeResult> {
  if (typeof email !== "string" || typeof code !== "string") return { ok: false, reason: "failed" };
  const normalizedEmail = email.trim().toLowerCase();
  const token = code.trim();
  if (!normalizedEmail) return { ok: false, reason: "failed" };

  const throttle = getAuthThrottleClient();
  if ((await checkAuthThrottle(throttle, "signup_otp", normalizedEmail)) > 0) {
    return { ok: false, reason: "rate_limited" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token,
      type: "signup",
    });

    if (error || !data.user) {
      if (isInvalidOtpError(error)) {
        const blockedFor = await recordAuthFailure(throttle, "signup_otp", normalizedEmail);
        return { ok: false, reason: blockedFor > 0 ? "rate_limited" : "invalid_code" };
      }
      return { ok: false, reason: "failed" };
    }

    await clearAuthThrottle(throttle, "signup_otp", normalizedEmail);
    return { ok: true, userId: data.user.id };
  } catch {
    // Log the type only: a message could echo the email or the code.
    console.error("Sign-up code verification failed unexpectedly.");
    return { ok: false, reason: "failed" };
  }
}
