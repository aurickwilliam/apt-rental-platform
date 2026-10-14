import { supabase } from "@repo/supabase";

import { changePasswordWith, hasEmailPasswordIdentity, toPasswordError } from "@repo/utils";

// Change password while signed in (Settings → Change Password). The steps
// (current-password check, update, signing other sessions out) are shared with
// web in @repo/utils (passwordChange.ts).

export type PasswordSignInStatus = "has_password" | "no_password";

// Whether the signed-in account can change its password (Google-only accounts
// have no password). getUser() asks the server, so it reflects linked identities.
export async function getPasswordSignInStatus(): Promise<PasswordSignInStatus> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw toPasswordError(error, "Password sign-in status");
  return hasEmailPasswordIdentity(data.user) ? "has_password" : "no_password";
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return changePasswordWith(supabase.auth, currentPassword, newPassword);
}
