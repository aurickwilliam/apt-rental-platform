import { supabase } from "@repo/supabase";
import { joinFullName } from "@repo/utils";

import type { ProfileDetailsRow } from "@/hooks/auth/useProfileDetailsForm";

import { hasMobilePortalRole, isPortal, type Portal } from "./portalPreference";

interface FinishProfileParams {
  details: ProfileDetailsRow;
  role: Portal;
  // The role from the screen's link, if any: anything but a portal is refused.
  requestedRole: string | undefined;
}

// Saves the profile of the signed-in account and returns its Auth user id.
// A confirmed account with no profile row (interrupted sign-up) gets one,
// the same way sign-up writes it; otherwise the existing row is updated and
// the onboarding role is applied through the server-side RPC.
export async function finishProfile({ details, role, requestedRole }: FinishProfileParams): Promise<string> {
  if (requestedRole !== undefined && !isPortal(requestedRole)) {
    throw new Error("Invalid account type.");
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("No authenticated user found.");

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      full_name: joinFullName({
        firstName: details.first_name,
        lastName: details.last_name,
        suffix: details.suffix,
      }),
    },
  });
  if (updateError) throw updateError;

  const { data: currentProfile, error: profileError } = await supabase
    .from("users")
    .select("roles")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError) throw profileError;

  if (!currentProfile) {
    if (!user.email) throw new Error("No authenticated user found.");
    const { error: insertError } = await supabase.from("users").insert({
      user_id: user.id,
      email: user.email,
      roles: [role],
      ...details,
    });
    if (insertError) throw insertError;
    return user.id;
  }

  if (!hasMobilePortalRole(currentProfile.roles)) {
    throw new Error("Admin accounts are available on the web portal only.");
  }
  if (!currentProfile.roles.includes(role)) {
    if (currentProfile.roles.length !== 1) {
      throw new Error("Cannot change the role of this account during onboarding.");
    }
    const { error: roleError } = await supabase.rpc("set_onboarding_role", { requested_role: role });
    if (roleError) throw roleError;
  }

  const { error: profileUpdateError } = await supabase
    .from("users")
    .update(details)
    .eq("user_id", user.id);
  if (profileUpdateError) throw profileUpdateError;

  return user.id;
}
