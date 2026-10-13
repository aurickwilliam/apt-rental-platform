// Supabase Auth errors from the password flows (forgot-password recovery and
// change-password), mapped to safe, user-facing messages.

export type PasswordErrorReason =
  | "invalid_email"
  | "invalid_or_expired_code"
  | "wrong_current_password"
  | "rate_limited"
  | "same_password"
  | "weak_password"
  | "session_expired"
  | "reauthentication_required"
  | "network"
  | "unknown";

const PASSWORD_ERROR_MESSAGES: Record<PasswordErrorReason, string> = {
  invalid_email: "Enter a valid email address.",
  invalid_or_expired_code:
    "That code is incorrect or has expired. Check the code or request a new one.",
  wrong_current_password: "Your current password is incorrect.",
  rate_limited: "Too many attempts. Please wait a minute before trying again.",
  same_password: "Your new password must be different from your current password.",
  weak_password: "This password is too weak. Please choose a stronger password.",
  // Only the recovery session expires mid-flow, so the wording is recovery's.
  session_expired: "Your reset session has expired. Please request a new code.",
  reauthentication_required:
    "For your security, please sign in again before changing your password.",
  network: "Can't connect right now. Check your internet connection and try again.",
  unknown: "Something went wrong. Please try again.",
};

export class PasswordError extends Error {
  readonly reason: PasswordErrorReason;

  constructor(reason: PasswordErrorReason) {
    super(PASSWORD_ERROR_MESSAGES[reason]);
    this.name = "PasswordError";
    this.reason = reason;
  }
}

// Structural subset of Supabase Auth errors (AuthError carries name/code/status).
export interface AuthErrorLike {
  name?: string;
  code?: string;
  status?: number;
}

const INVALID_CODE_ERRORS = new Set(["otp_expired"]);
const RATE_LIMIT_ERRORS = new Set(["over_email_send_rate_limit", "over_request_rate_limit"]);
const SESSION_ERRORS = new Set(["session_not_found", "session_expired"]);
const INVALID_EMAIL_ERRORS = new Set(["email_address_invalid", "validation_failed"]);
const RATE_LIMIT_STATUS = 429;

export function toPasswordErrorReason(error: unknown): PasswordErrorReason {
  if (!error || typeof error !== "object") return "unknown";
  const { name, code, status } = error as AuthErrorLike;

  if (code && INVALID_CODE_ERRORS.has(code)) return "invalid_or_expired_code";
  if (code === "invalid_credentials") return "wrong_current_password";
  if ((code && RATE_LIMIT_ERRORS.has(code)) || status === RATE_LIMIT_STATUS) return "rate_limited";
  if (code === "same_password") return "same_password";
  if (code === "weak_password" || name === "AuthWeakPasswordError") return "weak_password";
  if (code === "reauthentication_needed") return "reauthentication_required";
  if ((code && SESSION_ERRORS.has(code)) || name === "AuthSessionMissingError") return "session_expired";
  if (code && INVALID_EMAIL_ERRORS.has(code)) return "invalid_email";
  if (name === "AuthRetryableFetchError") return "network";
  return "unknown";
}

// Safe-to-log fields only. Never log the message: Auth error messages can echo
// the email address, and callers' errors can carry passwords.
export function describeAuthError(error: unknown): AuthErrorLike {
  const { name, code, status } = (error ?? {}) as AuthErrorLike;
  return { name, code, status };
}

// Maps an Auth error and logs it when it is unexpected. `context` names the
// step for the log line, e.g. "Password recovery request".
export function toPasswordError(error: unknown, context: string): PasswordError {
  const reason = toPasswordErrorReason(error);
  if (reason === "unknown") {
    console.error(`${context} failed:`, describeAuthError(error));
  }
  return new PasswordError(reason);
}
