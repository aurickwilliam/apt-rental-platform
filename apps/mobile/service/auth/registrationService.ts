import { supabase } from "@repo/supabase";
import type { ProfileDetailsRow } from "@/hooks/auth/useProfileDetailsForm";
import type { Portal } from "./portalPreference";
import { requireRegistrationAcceptance, type RegistrationAcceptance } from "./registrationAcceptance";

interface CompleteMobileRegistrationParams {
  details: ProfileDetailsRow;
  role: Portal;
  acceptance: RegistrationAcceptance;
  source: "mobile_registration" | "mobile_profile_completion";
  expectedAuthId: string;
}

// One caller-bound transaction: never fall back to a profile-only write.
export async function completeMobileRegistration(params: CompleteMobileRegistrationParams): Promise<string> {
  requireRegistrationAcceptance(params.acceptance);
  const { data, error } = await supabase.rpc("complete_mobile_registration", {
    profile_details: { ...params.details },
    requested_role: params.role,
    terms_accepted: params.acceptance.termsAccepted,
    privacy_accepted: params.acceptance.privacyAccepted,
    terms_version: params.acceptance.termsVersion,
    privacy_version: params.acceptance.privacyVersion,
    registration_source: params.source,
    expected_auth_id: params.expectedAuthId,
  });
  if (error) {
    if (error.code !== "P0001") console.error("Mobile registration failed", { code: error.code });
    throw error;
  }
  if (!data) throw new Error("We could not complete your registration. Please try again.");
  return data;
}
