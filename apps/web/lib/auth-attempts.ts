import {
  checkAuthThrottle,
  clearAuthThrottle,
  isInvalidOtpError,
  recordAuthFailure,
  type AuthThrottleClient,
} from "@repo/utils";
import { signInThrottleKeys } from "@/lib/sign-in-throttle";

// The one place that counts password and code attempts on the server. The web
// server actions (sign-in, sign-up code) and the mobile routes
// (app/api/auth/mobile/*) all call it, so web and mobile share the same database
// windows: a phone cannot reset a lock by reinstalling the app, and a lock set on
// one platform shows on the other. The counters are written with the service role
// (`lib/auth-throttle-server.ts`); a client never decides.
//
// It is dependency-injected (`auth`, `throttle`) so it can be tested with fakes.
// Only a wrong password (`invalid_credentials`) or a wrong/expired code counts as
// a failure, never a network, CAPTCHA or Auth throttle error.

export interface AuthSessionLike {
  access_token: string;
  refresh_token: string;
}

export interface AttemptError {
  code?: string;
  message: string;
  status?: number;
}

interface AuthResponse {
  data: { user: unknown; session: AuthSessionLike | null };
  error: AttemptError | null;
}

// Structural subset of Supabase's `auth` client, so a cookie-bound server client
// (web) and a stateless one (mobile routes) both fit.
export interface AttemptAuth {
  signInWithPassword(credentials: {
    email: string;
    password: string;
    options?: { captchaToken?: string };
  }): PromiseLike<AuthResponse>;
  verifyOtp(params: { email: string; token: string; type: "signup" | "recovery" }): PromiseLike<AuthResponse>;
}

export type LockPurpose = "signin" | "signup_otp" | "recovery_otp";

export interface Locked {
  ok: false;
  kind: "locked";
  retryAfterSeconds: number;
}

export type SignInAttempt =
  | { ok: true; session: AuthSessionLike | null; user: unknown }
  | Locked
  | { ok: false; kind: "error"; error: AttemptError };

export type CodeAttempt =
  | { ok: true; session: AuthSessionLike | null; user: unknown }
  | Locked
  | { ok: false; kind: "invalid_code" }
  | { ok: false; kind: "error"; error: AttemptError };

/**
 * Subject-free line for every lockout, so a spike can be alerted on without
 * logging who. Every server path that reports a lock uses it, including the web
 * password-reset action, which has its own code path.
 */
export function logAuthLockout(purpose: LockPurpose): void {
  console.warn("Auth lockout:", purpose);
}

function locked(purpose: LockPurpose, retryAfterSeconds: number): Locked {
  logAuthLockout(purpose);
  return { ok: false, kind: "locked", retryAfterSeconds };
}

function toAttemptError(error: AttemptError | null | undefined, fallback: string): AttemptError {
  return { code: error?.code, message: error?.message || fallback, status: error?.status };
}

export function isInvalidCredentialsError(error: AttemptError): boolean {
  return error.code === "invalid_credentials" || error.message === "Invalid login credentials";
}

export interface SignInInput {
  auth: AttemptAuth;
  throttle: AuthThrottleClient;
  email: string;
  password: string;
  captchaToken?: string;
  clientIp: string;
}

export async function attemptSignIn({
  auth,
  throttle,
  email,
  password,
  captchaToken,
  clientIp,
}: SignInInput): Promise<SignInAttempt> {
  const { guard, clearOnSuccess } = signInThrottleKeys(email, clientIp);

  const waits = await Promise.all(guard.map((key) => checkAuthThrottle(throttle, key.purpose, key.subject)));
  const blockedFor = Math.max(0, ...waits);
  if (blockedFor > 0) return locked("signin", blockedFor);

  const { data, error } = await auth.signInWithPassword({
    email,
    password,
    options: captchaToken ? { captchaToken } : undefined,
  });

  if (error) {
    const failure = toAttemptError(error, "Sign in failed");
    if (isInvalidCredentialsError(failure)) {
      const blocked = await Promise.all(
        guard.map((key) => recordAuthFailure(throttle, key.purpose, key.subject)),
      );
      // This failure may have used the last attempt: lock right away.
      const nowBlockedFor = Math.max(0, ...blocked);
      if (nowBlockedFor > 0) return locked("signin", nowBlockedFor);
    }
    return { ok: false, kind: "error", error: failure };
  }

  // A good sign-in resets this email's windows. The IP window is left to expire:
  // clearing it would let an attacker with one valid account of their own reset
  // it between rounds of password spraying.
  await Promise.all(clearOnSuccess.map((key) => clearAuthThrottle(throttle, key.purpose, key.subject)));
  return { ok: true, session: data.session, user: data.user };
}

export interface CodeInput {
  auth: AttemptAuth;
  throttle: AuthThrottleClient;
  purpose: "signup_otp" | "recovery_otp";
  otpType: "signup" | "recovery";
  email: string;
  code: string;
}

export async function attemptCodeVerification({
  auth,
  throttle,
  purpose,
  otpType,
  email,
  code,
}: CodeInput): Promise<CodeAttempt> {
  const normalizedEmail = email.trim().toLowerCase();
  const token = code.trim();
  if (!normalizedEmail || !token) {
    return { ok: false, kind: "error", error: { message: "Enter the code we sent you." } };
  }

  const blockedFor = await checkAuthThrottle(throttle, purpose, normalizedEmail);
  if (blockedFor > 0) return locked(purpose, blockedFor);

  const { data, error } = await auth.verifyOtp({ email: normalizedEmail, token, type: otpType });

  if (error || !data.user) {
    if (isInvalidOtpError(error)) {
      const nowBlockedFor = await recordAuthFailure(throttle, purpose, normalizedEmail);
      return nowBlockedFor > 0 ? locked(purpose, nowBlockedFor) : { ok: false, kind: "invalid_code" };
    }
    return { ok: false, kind: "error", error: toAttemptError(error, "Verification failed") };
  }

  await clearAuthThrottle(throttle, purpose, normalizedEmail);
  return { ok: true, session: data.session, user: data.user };
}
