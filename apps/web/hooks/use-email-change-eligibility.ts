"use client";

import { useCallback } from "react";

import { createClient } from "@repo/supabase/browser";
import { isEligibleForEmailChange } from "@repo/utils";

import { useAsyncResource } from "@/hooks/use-async-resource";

// Whether the signed-in account can change its email. Only email/password
// accounts without Google may (stricter than change-password, which allows
// linked accounts). Mirrors mobile's getEmailChangeEligibility.
export type EmailChangeEligibility = "eligible" | "google";

const STATUS_ERROR = "Could not check how you sign in.";

export function useEmailChangeEligibility() {
  const load = useCallback(async (): Promise<EmailChangeEligibility | null> => {
    const supabase = createClient();
    // Signed out (e.g. Settings on a public page) is not an error.
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return null;

    // getUser() asks the server, so linked identities are current.
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user || !data.user.email) return null;
    return isEligibleForEmailChange(data.user) ? "eligible" : "google";
  }, []);
  const { data, loading, error } = useAsyncResource(load, null, STATUS_ERROR);

  return { status: data, loading, error };
}
