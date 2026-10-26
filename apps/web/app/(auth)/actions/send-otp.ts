"use server";

import { createClient } from "@repo/supabase/server";
import { emailCodeRequestErrorMessage } from "@repo/utils";
import { getServerLocale } from "@/lib/i18n/locale";
import { validateBirthDate } from "@/lib/birth-date";

interface SendEmailOtpResult {
  error?: string;
  success?: boolean;
  birthDateError?: string;
  birthDate?: string;
}

export async function sendEmailOtp(email: string, password: string, firstName: string, lastName: string, birthDate: string): Promise<SendEmailOtpResult> {
  const birthDateError = validateBirthDate(birthDate);
  if (birthDateError) return { birthDateError, birthDate: birthDate ?? "" };
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

  if (error) {
    return { error: emailCodeRequestErrorMessage(await getServerLocale(), error.message) };
  }
  return { success: true };
}
