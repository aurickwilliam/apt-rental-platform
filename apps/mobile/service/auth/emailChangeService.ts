import { supabase } from "@repo/supabase";

import {
  getEmailChangeStatus,
  isEligibleForEmailChange,
  requestEmailChangeWith,
  resendEmailChangeCodeWith,
  signOutOtherSessionsAfterEmailChange,
  toEmailChangeError,
  verifyEmailChangeCodeWith,
  EmailChangeError,
  type EmailChangeStatus,
} from "@repo/utils";

import { getMySuspensionStatus } from "@/service/auth/suspensionService";
import { isPasswordRecoveryInProgress } from "@/service/auth/passwordRecoveryService";

// Change email while signed in (Settings → Change Email). The Auth steps
// (password check, dual-inbox confirmation, signing other sessions out) are
// shared with web in @repo/utils (emailChange.ts).

export type EmailChangeEligibility = "eligible" | "google";

// Whether the signed-in account can change its email. Only email/password
// accounts without Google may; linked Google + password accounts show the
// Google note under this feature's stricter rule. getUser() asks the server,
// so linked identities are current. Fails closed: callers keep the row
// disabled when this throws.
export async function getEmailChangeEligibility(): Promise<EmailChangeEligibility> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw toEmailChangeError(error, "Email change eligibility");
  if (!data.user.email || !isEligibleForEmailChange(data.user)) return "google";
  return "eligible";
}

async function guardEmailChangeAction(context: string): Promise<void> {
  if (await isPasswordRecoveryInProgress()) {
    throw new EmailChangeError("session_expired");
  }
  const suspension = await getMySuspensionStatus();
  if (suspension.suspended) {
    console.error(`${context} refused for a suspended account.`);
    throw new EmailChangeError("suspended");
  }
}

async function syncProfileEmail(): Promise<void> {
  const { error } = await supabase.rpc("sync_my_profile_email");
  if (error) {
    console.error("Email change profile sync failed:", {
      name: error.name,
      code: (error as { code?: string }).code,
    });
  }
}

export function getEmailChangeAccount(): Promise<EmailChangeStatus> {
  return guardEmailChangeAction("Email change status")
    .then(() => getEmailChangeStatus(supabase.auth));
}

export function requestEmailChange(newEmail: string, currentPassword: string) {
  return guardEmailChangeAction("Email change request")
    .then(() => requestEmailChangeWith(supabase.auth, newEmail, currentPassword));
}

export function resendEmailChangeCode(inboxEmail: string) {
  return guardEmailChangeAction("Email change resend")
    .then(() => resendEmailChangeCodeWith(supabase.auth, inboxEmail));
}

export interface VerifyEmailChangeResult extends EmailChangeStatus {
  completed: boolean;
  signOutFailed: boolean;
}

// Verifies one inbox code. On completion the profile email is synced from the
// canonical Auth address and other sessions end; a sign-out failure is
// reported so the UI stays honest.
export async function verifyEmailChangeCode(
  inboxEmail: string,
  code: string,
  intendedNewEmail?: string,
): Promise<VerifyEmailChangeResult> {
  await guardEmailChangeAction("Email change verification");
  const verification = await verifyEmailChangeCodeWith(
    supabase.auth,
    inboxEmail,
    code,
    intendedNewEmail,
  );
  const status = await getEmailChangeStatus(supabase.auth);
  if (!verification.completed) {
    return { ...status, completed: false, signOutFailed: false };
  }

  await syncProfileEmail();
  const { signOutFailed } = await signOutOtherSessionsAfterEmailChange(supabase.auth);
  return { ...status, completed: true, signOutFailed };
}
