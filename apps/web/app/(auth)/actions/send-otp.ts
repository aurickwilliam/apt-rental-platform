"use server";

import { createClient } from "@repo/supabase/server";

export async function sendEmailOtp(email: string, password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: undefined, 
    },
  });

  if (error) return { error: error.message };
  return { success: true };
}