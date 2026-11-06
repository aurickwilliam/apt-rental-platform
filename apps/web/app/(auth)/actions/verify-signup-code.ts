"use server";

import { createClient } from "@repo/supabase/server";
import { attemptCodeVerification } from "@/lib/auth-attempts";
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
  // retryAfterSeconds: how long the guess lock lasts (the UI counts it down).
  | { ok: false; reason: "rate_limited"; retryAfterSeconds: number }
  | { ok: false; reason: "invalid_code" | "failed" };

export async function verifySignupCode(
  email: string,
  code: string,
): Promise<VerifySignupCodeResult> {
  if (typeof email !== "string" || typeof code !== "string") return { ok: false, reason: "failed" };

  try {
    const supabase = await createClient();
    // The guess limit is counted on the server (`lib/auth-attempts.ts`), shared
    // with the mobile route, so neither a refresh nor a direct call skips it.
    const attempt = await attemptCodeVerification({
      auth: supabase.auth,
      throttle: getAuthThrottleClient(),
      purpose: "signup_otp",
      otpType: "signup",
      email,
      code,
    });

    if (attempt.ok) {
      const userId = (attempt.user as { id?: string } | null)?.id;
      return userId ? { ok: true, userId } : { ok: false, reason: "failed" };
    }
    if (attempt.kind === "locked") {
      return { ok: false, reason: "rate_limited", retryAfterSeconds: attempt.retryAfterSeconds };
    }
    return { ok: false, reason: attempt.kind === "invalid_code" ? "invalid_code" : "failed" };
  } catch {
    // Log the type only: a message could echo the email or the code.
    console.error("Sign-up code verification failed unexpectedly.");
    return { ok: false, reason: "failed" };
  }
}
