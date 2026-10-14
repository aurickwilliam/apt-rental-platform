"use server";

import { cookies } from "next/headers";

import { createClient } from "@repo/supabase/server";
import { readRecoveryMarker, RECOVERY_MARKER_COOKIE } from "@repo/supabase/password-recovery";
import { changePasswordWith, PasswordError, type PasswordErrorReason } from "@repo/utils";

// Change password while signed in (Settings → Security), mirroring mobile.
// The steps (current-password check, update, signing other sessions out) are
// shared with mobile in @repo/utils (passwordChange.ts).
//
// Verifying the current password signs in again as the same user, so the Auth
// cookies are rewritten and Next re-renders the current page in this response;
// client state (the open Settings modal) survives that.

export type ChangePasswordResult = { error: PasswordErrorReason | null };

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
  // Never trust the client: the form checks these too, for feedback only.
  if (typeof currentPassword !== "string" || currentPassword.length === 0) {
    return { error: "wrong_current_password" };
  }
  if (typeof newPassword !== "string" || newPassword.length === 0) {
    return { error: "weak_password" };
  }

  // A forgot-password recovery session has its own reset page. Server actions
  // skip the middleware, so keep the two flows apart here.
  const marker = (await cookies()).get(RECOVERY_MARKER_COOKIE)?.value;
  if (readRecoveryMarker(marker, Date.now()) !== "none") {
    return { error: "session_expired" };
  }

  try {
    const supabase = await createClient();
    await changePasswordWith(supabase.auth, currentPassword, newPassword);
    return { error: null };
  } catch (error) {
    if (error instanceof PasswordError) return { error: error.reason };
    // Log the type only: an unexpected message could echo a password.
    console.error("Password change failed:", error instanceof Error ? error.name : typeof error);
    return { error: "unknown" };
  }
}
