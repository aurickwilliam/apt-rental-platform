import { PasswordError } from "./passwordErrors";
import { isValidEmail } from "./validateEmail";

// Password recovery by 6-digit email code, shared by web and mobile.
// Mirrors hosted Auth (mailer_otp_length / smtp_max_frequency) and
// supabase/config.toml [auth.email].
export const RECOVERY_CODE_LENGTH = 6;
export const RECOVERY_RESEND_COOLDOWN_SECONDS = 60;

const RECOVERY_CODE_PATTERN = new RegExp(`^\\d{${RECOVERY_CODE_LENGTH}}$`);

// Trims and validates the recovery email; throws PasswordError("invalid_email").
export function normalizeRecoveryEmail(email: string): string {
  const trimmed = email.trim();
  if (!isValidEmail(trimmed)) throw new PasswordError("invalid_email");
  return trimmed;
}

export function isRecoveryCodeFormat(code: string): boolean {
  return RECOVERY_CODE_PATTERN.test(code);
}
