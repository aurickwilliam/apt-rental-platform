"use server";

import { createClient } from "@repo/supabase/server";

interface CheckEmailAvailabilityResult {
  error: string | null;
  exists: boolean;
}

export async function checkEmailAvailability(
  email: string,
): Promise<CheckEmailAvailabilityResult> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return { error: "Email is required.", exists: false };
  }

  const supabase = await createClient();

  // Auth accounts count too: an email verified but never given a profile
  // is still registered, and sign-up would silently send it no code.
  const { data: registered, error } = await supabase.rpc("is_email_registered", {
    p_email: normalizedEmail,
  });

  if (error) {
    return {
      error: "Could not validate your email right now. Please try again.",
      exists: false,
    };
  }

  return {
    error: null,
    exists: registered === true,
  };
}
