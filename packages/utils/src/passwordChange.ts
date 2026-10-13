import { type AuthIdentityUser, hasEmailPasswordIdentity } from "./authIdentity";
import {
  describeAuthError,
  PasswordError,
  type PasswordErrorReason,
  toPasswordError,
} from "./passwordErrors";

// Change password while signed in, shared by mobile (passwordChangeService) and
// web (the change-password server action), each passing its own Supabase auth.
//
// The current password is an app-flow check, not a server-enforced one:
// Supabase's "require current password" setting is project-wide and would also
// block the forgot-password recovery session, so it stays off. Instead the
// current password is verified with signInWithPassword before updateUser.

interface PasswordChangeUser extends AuthIdentityUser {
  id: string;
  email?: string | null;
}

// Structural subset of Supabase's auth client: only the calls used here, so
// this package needs no Supabase dependency.
export interface PasswordChangeAuth {
  getUser(): Promise<{ data: { user: PasswordChangeUser | null }; error: unknown }>;
  signInWithPassword(credentials: {
    email: string;
    password: string;
  }): Promise<{ data: { user: { id: string } | null }; error: unknown }>;
  updateUser(attributes: { password: string }): Promise<{ error: unknown }>;
  signOut(options: { scope: "others" }): Promise<{ error: unknown }>;
}

export async function changePasswordWith(
  auth: PasswordChangeAuth,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  // Same rule the server enforces; checked first so nothing changes needlessly.
  if (newPassword === currentPassword) throw new PasswordError("same_password");

  const { data: userData, error: userError } = await auth.getUser();
  const user = userData.user;
  if (userError || !user) throw toPasswordError(userError, "Password change account lookup");
  if (!user.email || !hasEmailPasswordIdentity(user)) {
    console.error("Password change attempted on an account without a password.");
    throw new PasswordError("unknown");
  }

  // Verifying signs in again as the same user and replaces this session; the
  // previous session is ended with the others below.
  const { data: verified, error: verifyError } = await auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) throw toPasswordError(verifyError, "Password change verification");
  if (verified.user?.id !== user.id) {
    console.error("Password change verification returned a different account.");
    throw new PasswordError("unknown");
  }

  const { error: updateError } = await auth.updateUser({ password: newPassword });
  if (updateError) throw toPasswordError(updateError, "Password change update");

  // The password has already changed, so a failure here is logged, not shown.
  const { error: signOutError } = await auth.signOut({ scope: "others" });
  if (signOutError) {
    console.error("Signing out other sessions after a password change failed:", describeAuthError(signOutError));
  }
}

export type PasswordChangeErrorField = "current" | "new" | "general";

// Where a change-password form shows an error: under the current-password
// field, under the new-password field, or as a general (dialog/banner) error.
export function getPasswordChangeErrorField(reason: PasswordErrorReason): PasswordChangeErrorField {
  if (reason === "wrong_current_password") return "current";
  if (reason === "same_password" || reason === "weak_password") return "new";
  return "general";
}
