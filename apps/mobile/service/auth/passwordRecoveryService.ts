import { supabase } from "@repo/supabase";
import { isValidEmail } from "@repo/utils";

// Password recovery by 6-digit email code: resetPasswordForEmail sends the
// code (hosted `recovery` template), verifyOtp({ type: "recovery" }) turns it
// into a full, persisted session, and updateUser sets the new password.
//
// Google-only accounts are an app-flow rule, not a security boundary: the
// request step treats every email the same (no account enumeration), and the
// identity check runs only after the code is verified. A direct Supabase Auth
// call could still give a Google-only account a password; that is accepted,
// because whoever can read the inbox already controls the account.

// Mirrors hosted Auth (mailer_otp_length / smtp_max_frequency) and
// supabase/config.toml [auth.email].
export const RECOVERY_CODE_LENGTH = 6;
export const RECOVERY_RESEND_COOLDOWN_SECONDS = 60;

export type PasswordRecoveryErrorReason =
  | "invalid_email"
  | "invalid_or_expired_code"
  | "rate_limited"
  | "same_password"
  | "weak_password"
  | "session_expired"
  | "network"
  | "unknown";

const RECOVERY_ERROR_MESSAGES: Record<PasswordRecoveryErrorReason, string> = {
  invalid_email: "Enter a valid email address.",
  invalid_or_expired_code:
    "That code is incorrect or has expired. Check the code or request a new one.",
  rate_limited: "Too many attempts. Please wait a minute before trying again.",
  same_password: "Your new password must be different from your current password.",
  weak_password: "This password is too weak. Please choose a stronger password.",
  session_expired: "Your reset session has expired. Please request a new code.",
  network: "Can't connect right now. Check your internet connection and try again.",
  unknown: "Something went wrong. Please try again.",
};

export class PasswordRecoveryError extends Error {
  readonly reason: PasswordRecoveryErrorReason;

  constructor(reason: PasswordRecoveryErrorReason) {
    super(RECOVERY_ERROR_MESSAGES[reason]);
    this.name = "PasswordRecoveryError";
    this.reason = reason;
  }
}

// Structural subset of Supabase Auth errors (AuthError carries name/code/status).
interface AuthErrorLike {
  name?: string;
  code?: string;
  status?: number;
}

const INVALID_CODE_ERRORS = new Set(["otp_expired"]);
const RATE_LIMIT_ERRORS = new Set(["over_email_send_rate_limit", "over_request_rate_limit"]);
const SESSION_ERRORS = new Set(["session_not_found", "session_expired", "reauthentication_needed"]);
const INVALID_EMAIL_ERRORS = new Set(["email_address_invalid", "validation_failed"]);
const RATE_LIMIT_STATUS = 429;

export function toRecoveryErrorReason(error: unknown): PasswordRecoveryErrorReason {
  if (!error || typeof error !== "object") return "unknown";
  const { name, code, status } = error as AuthErrorLike;

  if (code && INVALID_CODE_ERRORS.has(code)) return "invalid_or_expired_code";
  if ((code && RATE_LIMIT_ERRORS.has(code)) || status === RATE_LIMIT_STATUS) return "rate_limited";
  if (code === "same_password") return "same_password";
  if (code === "weak_password" || name === "AuthWeakPasswordError") return "weak_password";
  if ((code && SESSION_ERRORS.has(code)) || name === "AuthSessionMissingError") return "session_expired";
  if (code && INVALID_EMAIL_ERRORS.has(code)) return "invalid_email";
  if (name === "AuthRetryableFetchError") return "network";
  return "unknown";
}

// Never log the message: Auth error messages can echo the email address.
function toRecoveryError(error: unknown, step: string): PasswordRecoveryError {
  const reason = toRecoveryErrorReason(error);
  if (reason === "unknown") {
    const { name, code, status } = (error ?? {}) as AuthErrorLike;
    console.error(`Password recovery ${step} failed:`, { name, code, status });
  }
  return new PasswordRecoveryError(reason);
}

function normalizeEmail(email: string): string {
  const trimmed = email.trim();
  if (!isValidEmail(trimmed)) throw new PasswordRecoveryError("invalid_email");
  return trimmed;
}

// Sends (or resends) a recovery code. supabase.auth.resend() does not support
// recovery codes, so resend calls this again. Resolves the same way whether or
// not the account exists, so callers can't reveal account existence.
export async function requestPasswordRecovery(email: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
  if (!error || error.code === "user_not_found") return;
  throw toRecoveryError(error, "request");
}

interface RecoveryUser {
  identities?: { provider: string }[] | null;
  app_metadata?: { providers?: unknown } | null;
}

// An `email` identity always means the account has a password (confirmed on
// the hosted project); Google-only accounts have only a `google` identity.
export function hasEmailPasswordIdentity(user: RecoveryUser): boolean {
  if (user.identities?.some((identity) => identity.provider === "email")) return true;
  const providers = user.app_metadata?.providers;
  return Array.isArray(providers) && providers.includes("email");
}

export type RecoveryCodeResult = "ready" | "google_only";

// Exchanges the emailed code for a recovery session. Google-only accounts are
// signed straight back out, so the caller never holds their session.
export async function verifyPasswordRecoveryCode(
  email: string,
  code: string,
): Promise<RecoveryCodeResult> {
  const normalizedEmail = normalizeEmail(email);
  const token = code.trim();
  if (!new RegExp(`^\\d{${RECOVERY_CODE_LENGTH}}$`).test(token)) {
    throw new PasswordRecoveryError("invalid_or_expired_code");
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: normalizedEmail,
    token,
    type: "recovery",
  });
  if (error) throw toRecoveryError(error, "verification");
  if (!data.user || !data.session) throw toRecoveryError(null, "verification");

  if (!hasEmailPasswordIdentity(data.user)) {
    await endPasswordRecovery();
    return "google_only";
  }
  return "ready";
}

// Requires the session created by verifyPasswordRecoveryCode.
export async function updateRecoveredPassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw toRecoveryError(error, "password update");
}

// Ends the recovery session. "local" (abandoning the flow) signs out only this
// device; "global" (after a successful reset) also signs the account out on
// every other device. supabase-js removes the local session even when the
// network call fails, so a failure here never leaves this device signed in.
export async function endPasswordRecovery(scope: "local" | "global" = "local"): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope });
  if (error && toRecoveryErrorReason(error) !== "network") {
    const { name, code, status } = error as AuthErrorLike;
    console.error("Password recovery sign-out failed:", { name, code, status });
  }
}
