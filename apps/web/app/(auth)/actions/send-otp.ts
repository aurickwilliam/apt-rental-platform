"use server";

import { createClient } from "@repo/supabase/server";
import { getEmailCodeRequestError } from "@repo/utils";
import { validateBirthDate } from "@/lib/birth-date";
import { validateRegistrationAcceptance, type AcceptanceErrors, type RegistrationAcceptance } from "@/lib/registration-policies";

interface SendEmailOtpResult {
  error?: string;
  success?: boolean;
  birthDateError?: string;
  birthDate?: string;
  acceptanceErrors?: AcceptanceErrors;
}

export async function sendEmailOtp(email: string, password: string, firstName: string, lastName: string, birthDate: string, acceptance: RegistrationAcceptance): Promise<SendEmailOtpResult> {
  const birthDateError = validateBirthDate(birthDate);
  if (birthDateError) return { birthDateError, birthDate: birthDate ?? "" };
  const acceptanceErrors = validateRegistrationAcceptance(acceptance);
  if (Object.keys(acceptanceErrors).length) return { acceptanceErrors };
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: undefined,
      data: {
        full_name: `${firstName} ${lastName}`,
      },
    },
  });

  if (error) return { error: getEmailCodeRequestError(error.message) };
  return { success: true };
}
