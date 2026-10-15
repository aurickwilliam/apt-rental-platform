"use server";

import { cookies } from "next/headers";

import { createClient } from "@repo/supabase/server";
import { readRecoveryMarker, RECOVERY_MARKER_COOKIE } from "@repo/supabase/password-recovery";
import {
  EmailChangeError,
  getEmailChangeStatus,
  requestEmailChangeWith,
  resendEmailChangeCodesWith,
  signOutOtherSessionsAfterEmailChange,
  verifyEmailChangeCodeWith,
  type EmailChangeErrorReason,
  type EmailChangeInbox,
} from "@repo/utils";

// Change email while signed in (Settings → Security), mirroring mobile.
// The Auth steps (password check, dual-inbox confirmation, signing other
// sessions out) are shared with mobile in @repo/utils (emailChange.ts).
//
// Like change-password, verifying signs in again as the same user, so the
// Auth cookies are rewritten and Next re-renders the current page in this
// response; client state (the open modal) survives that.

export type EmailChangeActionError = { error: EmailChangeErrorReason | null };

async function recoveryBlocked(): Promise<boolean> {
  // A forgot-password recovery session has its own reset page. Server actions
  // skip the middleware, so keep the two flows apart here.
  const marker = (await cookies()).get(RECOVERY_MARKER_COOKIE)?.value;
  return readRecoveryMarker(marker, Date.now()) !== "none";
}

async function suspended(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const { data } = await supabase.rpc("get_my_suspension_status");
  return (data as { suspended?: boolean } | null)?.suspended === true;
}

function toReason(error: unknown): EmailChangeErrorReason {
  if (error instanceof EmailChangeError) return error.reason;
  // Log the type only: an unexpected message could echo an email or code.
  console.error("Email change failed:", error instanceof Error ? error.name : typeof error);
  return "unknown";
}

export type RequestEmailChangeResult = EmailChangeActionError & {
  currentEmail?: string;
  newEmail?: string;
};

export async function requestEmailChange(
  newEmail: string,
  currentPassword: string,
): Promise<RequestEmailChangeResult> {
  if (await recoveryBlocked()) return { error: "session_expired" };
  if (typeof newEmail !== "string" || typeof currentPassword !== "string") {
    return { error: "unknown" };
  }

  try {
    const supabase = await createClient();
    if (await suspended(supabase)) {
      console.error("Email change request refused for a suspended account.");
      return { error: "suspended" };
    }
    const result = await requestEmailChangeWith(supabase.auth, newEmail, currentPassword);
    return { error: null, ...result };
  } catch (error) {
    return { error: toReason(error) };
  }
}

export type EmailChangeAccountResult = EmailChangeActionError & {
  email?: string;
  pendingNewEmail?: string | null;
};

export async function getEmailChangeAccount(): Promise<EmailChangeAccountResult> {
  if (await recoveryBlocked()) return { error: "session_expired" };

  try {
    const supabase = await createClient();
    if (await suspended(supabase)) return { error: "suspended" };
    const status = await getEmailChangeStatus(supabase.auth);
    return { error: null, email: status.email, pendingNewEmail: status.pendingNewEmail };
  } catch (error) {
    return { error: toReason(error) };
  }
}

export type VerifyEmailChangeResult = EmailChangeActionError & {
  completed?: boolean;
  email?: string;
  pendingNewEmail?: string | null;
  signOutFailed?: boolean;
  profileSyncFailed?: boolean;
};

export async function verifyEmailChangeCode(
  inbox: EmailChangeInbox,
  code: string,
  intendedNewEmail?: string,
): Promise<VerifyEmailChangeResult> {
  if (await recoveryBlocked()) return { error: "session_expired" };
  if ((inbox !== "current" && inbox !== "new") || typeof code !== "string") {
    return { error: "unknown" };
  }

  try {
    const supabase = await createClient();
    if (await suspended(supabase)) {
      console.error("Email change verification refused for a suspended account.");
      return { error: "suspended" };
    }
    const verification = await verifyEmailChangeCodeWith(
      supabase.auth,
      inbox,
      code,
      typeof intendedNewEmail === "string" ? intendedNewEmail : undefined,
    );
    if (!verification.completed) {
      return { error: null, ...verification };
    }

    const { error: syncError } = await supabase.rpc("sync_my_profile_email");
    if (syncError) {
      console.error("Email change profile sync failed:", syncError.code);
    }
    const { signOutFailed } = await signOutOtherSessionsAfterEmailChange(supabase.auth);
    return { error: null, ...verification, signOutFailed, profileSyncFailed: !!syncError };
  } catch (error) {
    return { error: toReason(error) };
  }
}

// Supabase issues new codes for both inboxes on every resend.
export async function resendEmailChangeCodes(): Promise<EmailChangeActionError> {
  if (await recoveryBlocked()) return { error: "session_expired" };

  try {
    const supabase = await createClient();
    if (await suspended(supabase)) return { error: "suspended" };
    await resendEmailChangeCodesWith(supabase.auth);
    return { error: null };
  } catch (error) {
    return { error: toReason(error) };
  }
}
