import { supabase } from "@repo/supabase";
import { requireRegistrationAcceptance, type RegistrationAcceptance } from "./registrationAcceptance";

// Creates the Auth account for a new email sign-up and sends the confirmation
// code. The profile row is written later, after the code is verified
// (otp-verification), so an unconfirmed email never has a profile.
export async function requestSignUpCode(params: {
  email: string;
  password: string;
  fullName: string;
  acceptance: RegistrationAcceptance;
}): Promise<void> {
  requireRegistrationAcceptance(params.acceptance);
  const { error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: { data: { full_name: params.fullName } },
  });
  if (error) throw error;
}
