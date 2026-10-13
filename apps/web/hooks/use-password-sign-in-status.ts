"use client";

import { useCallback } from "react";

import { createClient } from "@repo/supabase/browser";
import { hasEmailPasswordIdentity } from "@repo/utils";

import { useAsyncResource } from "@/hooks/use-async-resource";

// Whether the signed-in account can change its password (Google-only accounts
// have none), mirroring mobile's getPasswordSignInStatus.
export type PasswordSignInStatus = "has_password" | "no_password";

const STATUS_ERROR = "Could not check how you sign in.";

export function usePasswordSignInStatus() {
  const load = useCallback(async (): Promise<PasswordSignInStatus | null> => {
    const supabase = createClient();
    // Signed out (e.g. Settings on a public page) is not an error.
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return null;

    // getUser() asks the server, so linked identities are current.
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) return null;
    return hasEmailPasswordIdentity(data.user) ? "has_password" : "no_password";
  }, []);
  const { data, loading, error } = useAsyncResource(load, null, STATUS_ERROR);

  return { status: data, loading, error };
}
