import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "@repo/supabase";
import {
  describeAuthError,
  isRecoveryCodeFormat,
  normalizeRecoveryEmail,
  PasswordError,
  toPasswordError,
  toPasswordErrorReason,
} from "@repo/utils";

import { verifyCodeViaServer } from "@/service/auth/serverAuthService";

// Password recovery by 6-digit email code: resetPasswordForEmail sends the
// code (hosted `recovery` template), verifyOtp({ type: "recovery" }) turns it
// into a full, persisted session, and updateUser sets the new password.
//
// Google-only accounts are an app-flow rule, not a security boundary: the
// request step treats every email the same (no account enumeration), and the
// identity check runs only after the code is verified. A direct Supabase Auth
// call could still give a Google-only account a password; that is accepted,
// because whoever can read the inbox already controls the account.

// The code length, resend cooldown and email/code validation are shared with
// the web flow in @repo/utils (passwordRecovery.ts).

// A verified code creates a full, persisted session. This marker is set before
// verification and cleared only when the recovery ends, so a reset that was
// abandoned by closing the app is signed out at the next launch instead of
// being restored into a portal.
const RECOVERY_IN_PROGRESS_KEY = "apt:password-recovery-in-progress";

// Without the marker there is no safety net, so verification must not proceed.
async function setRecoveryInProgress(): Promise<void> {
  try {
    await AsyncStorage.setItem(RECOVERY_IN_PROGRESS_KEY, "1");
  } catch (error) {
    console.error("Password recovery marker could not be saved:", error);
    throw new PasswordError("unknown");
  }
}

async function clearRecoveryInProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RECOVERY_IN_PROGRESS_KEY);
  } catch (error) {
    console.error("Password recovery marker could not be cleared:", error);
  }
}

export async function isPasswordRecoveryInProgress(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(RECOVERY_IN_PROGRESS_KEY)) !== null;
  } catch (error) {
    console.error("Password recovery marker could not be read:", error);
    return false;
  }
}

// Sends (or resends) a recovery code. supabase.auth.resend() does not support
// recovery codes, so resend calls this again. Unknown and Google-only emails are
// refused before any code is sent (PasswordError "email_not_registered" / "google_account").
export async function requestPasswordRecovery(email: string, captchaToken?: string): Promise<void> {
  const normalizedEmail = normalizeRecoveryEmail(email);
  // Only emails with a confirmed email/password account get a code. A failed
  // lookup is an error, never a silent "send".
  const { data: eligibility, error: lookupError } = await supabase.rpc(
    "get_password_recovery_eligibility",
    { p_email: normalizedEmail },
  );
  if (lookupError) throw toPasswordError(lookupError, "Password recovery lookup");
  if (eligibility === "google_only") throw new PasswordError("google_account");
  if (eligibility !== "eligible") throw new PasswordError("email_not_registered");

  const { error } = await (captchaToken
    ? supabase.auth.resetPasswordForEmail(normalizedEmail, { captchaToken })
    : supabase.auth.resetPasswordForEmail(normalizedEmail));
  if (!error || error.code === "user_not_found") return;
  throw toPasswordError(error, "Password recovery request");
}

export type RecoveryCodeResult = "ready" | "google_only";

// Exchanges the emailed code for a recovery session. Google-only accounts are
// signed straight back out, so the caller never holds their session.
// A rate_limited PasswordError that also says how long the guess lock lasts, so
// the code screen can count it down.
export class RecoveryRateLimitedError extends PasswordError {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("rate_limited");
    this.name = "RecoveryRateLimitedError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function verifyPasswordRecoveryCode(
  email: string,
  code: string,
): Promise<RecoveryCodeResult> {
  const normalizedEmail = normalizeRecoveryEmail(email);
  const token = code.trim();
  if (!isRecoveryCodeFormat(token)) {
    throw new PasswordError("invalid_or_expired_code");
  }

  // Marked before verifying so the app can't be closed between the session
  // being saved and the marker being written.
  await setRecoveryInProgress();
  // Checked through the web server, which counts every wrong code in the same
  // database windows as the website: the limit cannot be reset from this phone and
  // a lock set on web shows here too. A code is a 6-digit guess that ends in a full
  // session, so the server hands the session over only for a code that verified.
  const { data, error } = await verifyCodeViaServer({
    email: normalizedEmail,
    code: token,
    flow: "recovery",
  });
  if (error) {
    await clearRecoveryInProgress();
    if (error.retryAfterSeconds) throw new RecoveryRateLimitedError(error.retryAfterSeconds);
    if (error.code === "network_error") throw new PasswordError("network");
    throw toPasswordError(error, "Password recovery verification");
  }

  if (data.status === "google_only") {
    await endPasswordRecovery();
    return "google_only";
  }
  return "ready";
}

// The reset screen is usable only with the session a verified code created.
export async function hasActiveRecoverySession(): Promise<boolean> {
  if (!(await isPasswordRecoveryInProgress())) return false;
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

// Requires the session created by verifyPasswordRecoveryCode.
export async function updateRecoveredPassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw toPasswordError(error, "Password recovery update");
}

// App start: a recovery left unfinished (e.g. the app was closed on the reset
// screen) is signed out. Returns true when one was found.
export async function abandonUnfinishedPasswordRecovery(): Promise<boolean> {
  if (!(await isPasswordRecoveryInProgress())) return false;
  await endPasswordRecovery();
  return true;
}

// Ends the recovery session. "local" (abandoning the flow) signs out only this
// device; "global" (after a successful reset) also signs the account out on
// every other device. supabase-js removes the local session even when the
// network call fails, so a failure here never leaves this device signed in.
export async function endPasswordRecovery(scope: "local" | "global" = "local"): Promise<void> {
  await clearRecoveryInProgress();
  const { error } = await supabase.auth.signOut({ scope });
  if (error && toPasswordErrorReason(error) !== "network") {
    console.error("Password recovery sign-out failed:", describeAuthError(error));
  }
}
