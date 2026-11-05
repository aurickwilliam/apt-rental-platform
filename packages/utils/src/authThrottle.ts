// App-level brute-force throttle for sign-in and one-time codes, shared by web
// and mobile. State lives in the database (`public.auth_throttle`, see
// 20261105144525_auth_attempt_throttle.sql), so it survives restarts, several
// server instances and app reinstalls. Supabase Auth's own limits and CAPTCHA
// stay the server-side backstop: a caller that talks to Auth directly skips
// this, which is why web enforces it inside server actions where it can.

export type AuthThrottlePurpose = "signin_email" | "signin_ip" | "signup_otp" | "recovery_otp";

export const AUTH_THROTTLE_MESSAGE =
  "Too many attempts. Please wait a few minutes before trying again.";

// Structural subset of a Supabase client, so this package needs no dependency.
export interface AuthThrottleClient {
  rpc(
    fn: "auth_throttle",
    args: { p_action: "check" | "fail" | "clear"; p_purpose: AuthThrottlePurpose; p_subject: string },
  ): PromiseLike<{ data: unknown; error: unknown }>;
}

async function call(
  client: AuthThrottleClient,
  action: "check" | "fail" | "clear",
  purpose: AuthThrottlePurpose,
  subject: string,
): Promise<number> {
  try {
    const { data, error } = await client.rpc("auth_throttle", {
      p_action: action,
      p_purpose: purpose,
      p_subject: subject,
    });
    if (error) {
      // Fails open: a missing migration or a network blip must not lock every
      // user out. Supabase Auth's own limits still apply. Never log the subject.
      console.error("Auth throttle unavailable:", action, purpose);
      return 0;
    }
    return typeof data === "number" && data > 0 ? data : 0;
  } catch {
    console.error("Auth throttle unavailable:", action, purpose);
    return 0;
  }
}

/** Seconds left while blocked, 0 when the attempt may go ahead. */
export function checkAuthThrottle(client: AuthThrottleClient, purpose: AuthThrottlePurpose, subject: string) {
  return call(client, "check", purpose, subject);
}

/** Records one wrong password/code. Returns seconds blocked after this failure. */
export function recordAuthFailure(client: AuthThrottleClient, purpose: AuthThrottlePurpose, subject: string) {
  return call(client, "fail", purpose, subject);
}

/** Resets the window after a success. */
export async function clearAuthThrottle(
  client: AuthThrottleClient,
  purpose: AuthThrottlePurpose,
  subject: string,
): Promise<void> {
  await call(client, "clear", purpose, subject);
}

// Supabase Auth answers throttling with a stable code and HTTP 429; matching
// the message text breaks when the wording changes.
const RATE_LIMIT_CODES = new Set([
  "over_request_rate_limit",
  "over_email_send_rate_limit",
  "over_sms_send_rate_limit",
]);

export function isAuthRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { code, status } = error as { code?: string; status?: number };
  return (!!code && RATE_LIMIT_CODES.has(code)) || status === 429;
}

// Wrong or expired one-time code, by Auth error code.
const INVALID_OTP_CODES = new Set(["otp_expired", "otp_disabled", "validation_failed"]);

export function isInvalidOtpError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { code, message } = error as { code?: string; message?: string };
  if (code) return INVALID_OTP_CODES.has(code);
  return /token has expired|invalid token|otp_expired/i.test(message ?? "");
}
