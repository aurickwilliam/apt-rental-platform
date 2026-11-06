// App-level brute-force throttle for sign-in and one-time codes, shared by web
// and mobile. State lives in the database, so it survives restarts, several
// server instances and app reinstalls.
//
// Reading is open: `check` goes through `public.auth_throttle`, which anyone may
// call. Writing is server-only: `fail` and `clear` go through
// `public.auth_throttle_server`, executable by the service role alone
// (20261106130000_lock_down_auth_throttle.sql). Pass a service-role client to
// `recordAuthFailure` / `clearAuthThrottle` (web server actions do); any other
// client is refused and fails open, so mobile can only read the counters.
// Supabase Auth's own limits and CAPTCHA stay the backstop for callers that talk
// to Auth directly.

export type AuthThrottlePurpose =
  | "signin_email_ip"
  | "signin_email_hour"
  | "signin_ip"
  | "signup_otp"
  | "recovery_otp"
  | "email_change_otp";

type ThrottleFunction = "auth_throttle" | "auth_throttle_server";

export const AUTH_THROTTLE_MESSAGE =
  "Too many attempts. Please wait a few minutes before trying again.";

// Shown when the Turnstile check has no token yet. Cloudflare sometimes asks for
// a tap ("Verify you are human"), so the wording covers both waiting and tapping.
export const CAPTCHA_PENDING_MESSAGE =
  "Please complete the security check above (tap \"Verify you are human\" if it shows), then try again.";
export const CAPTCHA_FAILED_MESSAGE = "The security check failed. Please try again.";

/** Supabase answers a missing, expired or reused CAPTCHA token with this code. */
export function isCaptchaError(error: unknown): boolean {
  return !!error && typeof error === "object" && (error as { code?: string }).code === "captcha_failed";
}

// Structural subset of a Supabase client, so this package needs no dependency.
export interface AuthThrottleClient {
  rpc(
    fn: ThrottleFunction,
    args: { p_action: "check" | "fail" | "clear"; p_purpose: AuthThrottlePurpose; p_subject: string },
  ): PromiseLike<{ data: unknown; error: unknown }>;
}

async function call(
  client: AuthThrottleClient,
  fn: ThrottleFunction,
  action: "check" | "fail" | "clear",
  purpose: AuthThrottlePurpose,
  subject: string,
): Promise<number> {
  try {
    const { data, error } = await client.rpc(fn, {
      p_action: action,
      p_purpose: purpose,
      p_subject: subject,
    });
    if (error) {
      // Fails open: a missing migration, a missing service key or a network
      // blip must not lock every user out. Supabase Auth's own limits still
      // apply. Log the action and purpose only, never the subject, so an outage
      // can be alerted on.
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
  return call(client, "auth_throttle", "check", purpose, subject);
}

/**
 * Records one wrong password/code. Returns seconds blocked after this failure.
 * Server-only: needs a service-role client.
 */
export function recordAuthFailure(client: AuthThrottleClient, purpose: AuthThrottlePurpose, subject: string) {
  return call(client, "auth_throttle_server", "fail", purpose, subject);
}

/** Resets the window after a success. Server-only: needs a service-role client. */
export async function clearAuthThrottle(
  client: AuthThrottleClient,
  purpose: AuthThrottlePurpose,
  subject: string,
): Promise<void> {
  await call(client, "auth_throttle_server", "clear", purpose, subject);
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
