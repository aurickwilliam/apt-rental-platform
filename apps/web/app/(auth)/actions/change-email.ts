"use server";

import { cookies } from "next/headers";

import { createClient } from "@repo/supabase/server";
import { readRecoveryMarker, RECOVERY_MARKER_COOKIE } from "@repo/supabase/password-recovery";
import {
  checkAuthThrottle,
  clearAuthThrottle,
  EmailChangeError,
  getEmailChangeStatus,
  recordAuthFailure,
  requestEmailChangeWith,
  resendEmailChangeCodesWith,
  signOutOtherSessionsAfterEmailChange,
  verifyEmailChangeCodeWith,
  type EmailChangeErrorReason,
  type EmailChangeInbox,
} from "@repo/utils";

import { getAuthThrottleClient } from "@/lib/auth-throttle-server";

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

    // Guess limit per account, written with the service role. The account is
    // already signed in and password-checked, so this is defence in depth for
    // the two 6-digit codes. Only a wrong or expired code counts.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "session_expired" };
    const throttle = getAuthThrottleClient();
    if ((await checkAuthThrottle(throttle, "email_change_otp", user.id)) > 0) {
      return { error: "rate_limited" };
    }

    let verification: Awaited<ReturnType<typeof verifyEmailChangeCodeWith>>;
    try {
      verification = await verifyEmailChangeCodeWith(
        supabase.auth,
        inbox,
        code,
        typeof intendedNewEmail === "string" ? intendedNewEmail : undefined,
      );
    } catch (error) {
      if (error instanceof EmailChangeError && error.reason === "invalid_or_expired_code") {
        const blockedFor = await recordAuthFailure(throttle, "email_change_otp", user.id);
        if (blockedFor > 0) return { error: "rate_limited" };
      }
      throw error;
    }
    if (!verification.completed) {
      return { error: null, ...verification };
    }
    await clearAuthThrottle(throttle, "email_change_otp", user.id);

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
