"use server";

import { createClient } from "@repo/supabase/server";
import { getEmailCodeRequestError } from "@repo/utils";

export async function sendEmailOtp(email: string, password: string, firstName: string, lastName: string) {
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