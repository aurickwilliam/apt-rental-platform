"use server";

import { createClient } from "@repo/supabase/server";
import { translate } from "@repo/i18n";
import { emailCodeRequestErrorMessage, isCaptchaError } from "@repo/utils";
import { getServerLocale } from "@/lib/i18n/locale";
import { validateBirthDate } from "@/lib/birth-date";
import { validateRegistrationAcceptance, type AcceptanceErrors, type RegistrationAcceptance } from "@/lib/registration-policies";

interface SendEmailOtpResult {
  error?: string;
  success?: boolean;
  birthDateError?: string;
  birthDate?: string;
  acceptanceErrors?: AcceptanceErrors;
}

export async function sendEmailOtp(email: string, password: string, firstName: string, lastName: string, birthDate: string, acceptance: RegistrationAcceptance, captchaToken?: string): Promise<SendEmailOtpResult> {
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
      captchaToken: captchaToken || undefined,
      data: {
        full_name: `${firstName} ${lastName}`,
      },
    },
  });

  const language = await getServerLocale();
  if (isCaptchaError(error)) return { error: translate(language, "auth.error.captchaFailed") };
  if (error) return { error: emailCodeRequestErrorMessage(language, error.message) };
  return { success: true };
}
