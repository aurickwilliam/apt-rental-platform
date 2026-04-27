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

  const { count, error } = await supabase
    .from("users")
    .select("id", { head: true, count: "exact" })
    .eq("email", normalizedEmail);

  if (error) {
    return {
      error: "Could not validate your email right now. Please try again.",
      exists: false,
    };
  }

  return {
    error: null,
    exists: (count ?? 0) > 0,
  };
}