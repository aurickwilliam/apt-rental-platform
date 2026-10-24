import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";
import { isPendingOnboarding } from "@repo/supabase/pending-onboarding";

/** React request-local only. Never use unstable_cache or a module-level value here. */
export const getServerIdentity = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) return { supabase, user: null, profile: null, error: authError };
  const { data: profile, error } = await supabase.from("users")
    .select("id, first_name, middle_name, last_name, suffix, gender, avatar_url, background_url, email, roles, account_status, is_suspended, mobile_number, birth_date, street_address, barangay, city, province, postal_code, preferences")
    .eq("user_id", user.id).maybeSingle();
  return { supabase, user, profile, error };
});

/** Resolve authorization before starting any private presentation read. */
export const requirePortalViewer = cache(async (portal: "tenant" | "landlord" | "admin") => {
  const identity = await getServerIdentity();
  const { supabase, user, profile, error } = identity;
  if (!user) redirect("/sign-in");
  // Restrictive RLS can hide a suspended profile. Do not mistake it for onboarding.
  if (!profile) {
    const { data: suspension, error: suspensionError } = await supabase.rpc("get_my_suspension_status");
    if (suspensionError) throw new Error("Unable to verify account access.");
    if ((suspension as { suspended?: boolean } | null)?.suspended) redirect("/suspended");
    if (error) throw new Error("Unable to verify account access.");
    redirect("/sign-in");
  }
  if (error) throw new Error("Unable to verify account access.");
  if (profile.is_suspended) redirect("/suspended");
  if (isPendingOnboarding(profile)) redirect("/sign-up?from=google-new");
  if (!profile.roles.includes(portal)) redirect("/browse");
  return { supabase, user, profile };
});
