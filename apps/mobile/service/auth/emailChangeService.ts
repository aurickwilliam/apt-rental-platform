import { supabase } from "@repo/supabase";

import {
  getEmailChangeStatus,
  isEligibleForEmailChange,
  requestEmailChangeWith,
  resendEmailChangeCodesWith,
  signOutOtherSessionsAfterEmailChange,
  toEmailChangeError,
  verifyEmailChangeCodeWith,
  EmailChangeError,
  type EmailChangeInbox,
  type EmailChangeStatus,
  type EmailChangeVerification,
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

// Returns whether the sync failed: the email has already changed in Auth, so
// a failure is reported (not thrown) for honest UI copy.
async function syncProfileEmail(): Promise<boolean> {
  const { error } = await supabase.rpc("sync_my_profile_email");
  if (error) {
    console.error("Email change profile sync failed:", {
      name: error.name,
      code: (error as { code?: string }).code,
    });
    return true;
  }
  return false;
}

export function getEmailChangeAccount(): Promise<EmailChangeStatus> {
  return guardEmailChangeAction("Email change status")
    .then(() => getEmailChangeStatus(supabase.auth));
}

export function requestEmailChange(newEmail: string, currentPassword: string) {
  return guardEmailChangeAction("Email change request")
    .then(() => requestEmailChangeWith(supabase.auth, newEmail, currentPassword));
}

// Supabase issues new codes for both inboxes on every resend.
export function resendEmailChangeCodes() {
  return guardEmailChangeAction("Email change resend")
    .then(() => resendEmailChangeCodesWith(supabase.auth));
}

export interface VerifyEmailChangeResult extends EmailChangeVerification {
  signOutFailed: boolean;
  profileSyncFailed: boolean;
}

// Verifies one inbox code. On completion the profile email is synced from the
// canonical Auth address and other sessions end; failures there are reported
// so the UI stays honest.
export async function verifyEmailChangeCode(
  inbox: EmailChangeInbox,
  code: string,
  intendedNewEmail?: string,
): Promise<VerifyEmailChangeResult> {
  await guardEmailChangeAction("Email change verification");
  const verification = await verifyEmailChangeCodeWith(
    supabase.auth,
    inbox,
    code,
    intendedNewEmail,
  );
  if (!verification.completed) {
    return { ...verification, signOutFailed: false, profileSyncFailed: false };
  }

  const profileSyncFailed = await syncProfileEmail();
  const { signOutFailed } = await signOutOtherSessionsAfterEmailChange(supabase.auth);
  return { ...verification, signOutFailed, profileSyncFailed };
}
