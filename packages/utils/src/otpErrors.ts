// "For security purposes, you can only request this after 42 seconds."
export function parseResendWaitSeconds(message: string | null | undefined): number | null {
  const match = message?.match(/after (\d+) seconds?/i);
  return match ? Number(match[1]) : null;
}

// User-facing text for a failed sign-up / resend email request. Supabase's own
// throttle and rate-limit messages read like internal errors, so they are
// replaced; anything else is passed through unchanged.
export function getEmailCodeRequestError(message: string | null | undefined): string {
  const waitSeconds = parseResendWaitSeconds(message);
  if (waitSeconds !== null) {
    return `Please wait ${waitSeconds} second${waitSeconds === 1 ? "" : "s"} before requesting another code.`;
  }
  if (/rate limit/i.test(message ?? "")) {
    return "Too many verification emails were requested. Please try again in a few minutes.";
  }
  return message || "Something went wrong. Please try again.";
}
