import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "@repo/supabase";
import { isValidEmail } from "@repo/utils";

import { hasEmailPasswordIdentity } from "./authIdentity";
import { describeAuthError, PasswordError, toPasswordError, toPasswordErrorReason } from "./passwordErrors";

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

function normalizeEmail(email: string): string {
  const trimmed = email.trim();
  if (!isValidEmail(trimmed)) throw new PasswordError("invalid_email");
  return trimmed;
}

// Sends (or resends) a recovery code. supabase.auth.resend() does not support
// recovery codes, so resend calls this again. Resolves the same way whether or
// not the account exists, so callers can't reveal account existence.
export async function requestPasswordRecovery(email: string): Promise<void> {
  const normalizedEmail = normalizeEmail(email);
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
  if (!error || error.code === "user_not_found") return;
  throw toPasswordError(error, "Password recovery request");
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
    throw new PasswordError("invalid_or_expired_code");
  }

  // Marked before verifying so the app can't be closed between the session
  // being saved and the marker being written.
  await setRecoveryInProgress();
  const { data, error } = await supabase.auth.verifyOtp({
    email: normalizedEmail,
    token,
    type: "recovery",
  });
  if (error || !data.user || !data.session) {
    await clearRecoveryInProgress();
    throw toPasswordError(error, "Password recovery verification");
  }

  if (!hasEmailPasswordIdentity(data.user)) {
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
