import type { SupabaseClient } from "@supabase/supabase-js";
import type { RegistrationAcceptance } from "@/lib/registration-policies";

export interface RegistrationDetails {
  first_name: string;
  last_name: string;
  middle_name: string | null;
  suffix?: string | null;
  gender: string;
  mobile_number: string;
  birth_date: string;
  street_address: string;
  barangay: string;
  city: string;
  province: string;
  postal_code: number | null;
}

// One caller-bound transaction; never a profile write followed by a separate
// acceptance write (a failure between them would bypass web onboarding).
export async function completeWebRegistration(
  client: SupabaseClient,
  details: RegistrationDetails,
  role: "tenant" | "landlord",
  acceptance: RegistrationAcceptance,
  source: "web_registration" | "web_profile_completion",
) {
  try {
    const result = await client.rpc("complete_web_registration", {
      profile_details: details,
      requested_role: role,
      terms_accepted: acceptance.termsAccepted,
      privacy_accepted: acceptance.privacyAccepted,
      terms_version: acceptance.termsVersion,
      privacy_version: acceptance.privacyVersion,
      registration_source: source,
    });
    if (result.error && result.error.code !== "P0001" && result.error.code !== "23505") {
      console.error("Web registration failed", { code: result.error.code });
    }
    return result;
  } catch (error) {
    console.error("Web registration request failed", { name: error instanceof Error ? error.name : "UnknownError" });
    return { data: null, error: { code: "REGISTRATION_UNAVAILABLE", message: "Registration is temporarily unavailable. Please try again." } };
  }
}
