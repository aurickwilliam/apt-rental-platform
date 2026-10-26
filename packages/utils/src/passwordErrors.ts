// Supabase Auth errors from the password flows (forgot-password recovery and
// change-password), mapped to reason codes. The user-facing prose lives in
// `@repo/i18n`; callers render it with `passwordErrorMessage(language, reason)`.

import { translate, type LanguageCode, type TranslationKey } from "@repo/i18n";

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

const PASSWORD_ERROR_KEYS: Record<PasswordErrorReason, TranslationKey> = {
  invalid_email: "validation.email.invalid",
  invalid_or_expired_code: "auth.error.invalidOrExpiredCode",
  wrong_current_password: "auth.error.wrongCurrentPassword",
  rate_limited: "auth.error.rateLimited",
  same_password: "auth.error.samePassword",
  weak_password: "auth.error.weakPassword",
  // Only the recovery session expires mid-flow, so the wording is recovery's.
  session_expired: "auth.error.sessionExpired",
  reauthentication_required: "auth.error.reauthenticationRequired",
  network: "auth.error.network",
  unknown: "errors.generic",
};

export function passwordErrorKey(reason: PasswordErrorReason): TranslationKey {
  return PASSWORD_ERROR_KEYS[reason];
}

/** User-facing copy for a password-flow failure, in the active language. */
export function passwordErrorMessage(
  language: LanguageCode,
  reason: PasswordErrorReason,
): string {
  return translate(language, PASSWORD_ERROR_KEYS[reason]);
}

export class PasswordError extends Error {
  readonly reason: PasswordErrorReason;

  constructor(reason: PasswordErrorReason) {
    // Developer-facing only: UI copy comes from `passwordErrorMessage`, so the
    // message never carries English prose that could leak into a Filipino UI.
    super(reason);
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
