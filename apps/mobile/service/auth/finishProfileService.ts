import { supabase } from "@repo/supabase";
import { joinFullName } from "@repo/utils";

import type { ProfileDetailsRow } from "@/hooks/auth/useProfileDetailsForm";

import { isPortal, type Portal } from "./portalPreference";
import { completeMobileRegistration } from "./registrationService";
import { requireRegistrationAcceptance, type RegistrationAcceptance } from "./registrationAcceptance";

interface FinishProfileParams {
  details: ProfileDetailsRow;
  role: Portal;
  // The role from the screen's link, if any: anything but a portal is refused.
  requestedRole: string | undefined;
  acceptance: RegistrationAcceptance;
}

// Saves the profile of the signed-in account and returns its Auth user id.
// A confirmed account with no row gets one. Existing incomplete profiles,
// onboarding role selection and both acceptances commit in the same RPC.
export async function finishProfile({ details, role, requestedRole, acceptance }: FinishProfileParams): Promise<string> {
  if (requestedRole !== undefined && !isPortal(requestedRole)) {
    throw new Error("Invalid account type.");
  }
  requireRegistrationAcceptance(acceptance);

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

  await completeMobileRegistration({
    details, role, acceptance, source: "mobile_profile_completion", expectedAuthId: user.id,
  });

  return user.id;
}
