import { supabase } from "@repo/supabase";

import { hasEmailPasswordIdentity } from "./authIdentity";
import { describeAuthError, PasswordError, toPasswordError } from "./passwordErrors";

// Change password while signed in (Settings → Change Password).
//
// The current password is an app-flow check, not a server-enforced one:
// Supabase's "require current password" setting is project-wide and would also
// block the forgot-password recovery session, so it stays off. The app instead
// verifies the current password with signInWithPassword before updateUser.

export type PasswordSignInStatus = "has_password" | "no_password";

// Whether the signed-in account can change its password (Google-only accounts
// have no password). getUser() asks the server, so it reflects linked identities.
export async function getPasswordSignInStatus(): Promise<PasswordSignInStatus> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw toPasswordError(error, "Password sign-in status");
  return hasEmailPasswordIdentity(data.user) ? "has_password" : "no_password";
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  // Same rule the server enforces; checked first so nothing changes needlessly.
  if (newPassword === currentPassword) throw new PasswordError("same_password");

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) throw toPasswordError(userError, "Password change account lookup");
  if (!user.email || !hasEmailPasswordIdentity(user)) {
    console.error("Password change attempted on an account without a password.");
    throw new PasswordError("unknown");
  }

  // Verifying signs in again as the same user and replaces this device's
  // session; the previous session is ended with the others below.
  const { data: verified, error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) throw toPasswordError(verifyError, "Password change verification");
  if (verified.user?.id !== user.id) {
    console.error("Password change verification returned a different account.");
    throw new PasswordError("unknown");
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) throw toPasswordError(updateError, "Password change update");

  // The password has already changed, so a failure here is logged, not shown.
  const { error: signOutError } = await supabase.auth.signOut({ scope: "others" });
  if (signOutError) {
    console.error("Signing out other sessions after a password change failed:", describeAuthError(signOutError));
  }
}
