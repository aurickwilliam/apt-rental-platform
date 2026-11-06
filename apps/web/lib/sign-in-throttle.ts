import type { AuthThrottlePurpose } from "@repo/utils";

// Which failure windows guard a web sign-in. Kept pure so the keys can be
// tested without the server action (`app/(auth)/actions/sign-in.ts`).
//
// - signin_email_ip: one email from one IP, strict. A stranger on another IP
//   cannot spend it, so they cannot lock the account's owner out.
// - signin_email_hour: one email from anywhere, a higher ceiling that caps
//   guessing spread over many IPs. It does not depend on the IP at all, so a
//   spoofed IP header cannot get around it.
// - signin_ip: one IP across all emails (password spraying).
export interface SignInThrottleKey {
  purpose: AuthThrottlePurpose;
  subject: string;
}

export interface SignInThrottleKeys {
  /** Checked before the attempt; every one gets a failure on a wrong password. */
  guard: SignInThrottleKey[];
  /** Cleared after a correct password. The IP window is never cleared. */
  clearOnSuccess: SignInThrottleKey[];
}

const MAX_EMAIL_LENGTH = 254;

export function signInThrottleKeys(email: string, clientIp: string): SignInThrottleKeys {
  const normalizedEmail = email.trim().toLowerCase().slice(0, MAX_EMAIL_LENGTH);
  const emailIp: SignInThrottleKey = {
    purpose: "signin_email_ip",
    subject: `${normalizedEmail}|${clientIp}`,
  };
  const emailHour: SignInThrottleKey = { purpose: "signin_email_hour", subject: normalizedEmail };
  const guard = [emailIp, emailHour];
  if (clientIp) guard.push({ purpose: "signin_ip", subject: clientIp });

  // The IP window stays: clearing it on any success would let an attacker with
  // one valid account of their own reset it between rounds of guessing.
  return { guard, clearOnSuccess: [emailIp, emailHour] };
}
