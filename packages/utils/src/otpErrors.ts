import { translate, type LanguageCode } from "@repo/i18n";

// "For security purposes, you can only request this after 42 seconds."
export function parseResendWaitSeconds(message: string | null | undefined): number | null {
  const match = message?.match(/after (\d+) seconds?/i);
  return match ? Number(match[1]) : null;
}

// User-facing text for a failed sign-up / resend email request. Supabase's own
// throttle and rate-limit messages read like internal errors, so they are
// replaced; anything else is passed through unchanged.
export function emailCodeRequestErrorMessage(
  language: LanguageCode,
  message: string | null | undefined,
): string {
  const waitSeconds = parseResendWaitSeconds(message);
  if (waitSeconds !== null) {
    return waitSeconds === 1
      ? translate(language, "auth.otp.waitOne")
      : translate(language, "auth.otp.waitOther", { seconds: waitSeconds });
  }
  if (/rate limit/i.test(message ?? "")) {
    return translate(language, "auth.otp.rateLimited");
  }
  return message || translate(language, "errors.generic");
}

// Wrong-code attempts allowed per sent code before asking for a new one. A
// convenience on top of Supabase's server-side limits, identical on web and mobile.
export const MAX_OTP_ATTEMPTS = 5;

export function otpAttemptErrorMessage(
  language: LanguageCode,
  attemptsRemaining: number,
): string {
  if (attemptsRemaining <= 0) return translate(language, "auth.otp.tooManyAttempts");
  return attemptsRemaining === 1
    ? translate(language, "auth.otp.attemptsLeftOne")
    : translate(language, "auth.otp.attemptsLeftOther", { count: attemptsRemaining });
}
