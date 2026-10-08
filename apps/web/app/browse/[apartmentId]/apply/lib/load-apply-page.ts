import { redirect } from "next/navigation";

import { createClient } from "@repo/supabase/server";

import { getApplyApartmentContext, type ApplyApartmentContext } from "./get-apply-context";

export interface ApplyViewer {
  /** Internal `public.users.id`. */
  userId: string;
  accountStatus: string | null;
}

export interface ApplyPageData {
  apartment: ApplyApartmentContext;
  viewer: ApplyViewer;
  hasActiveApplication: boolean;
}

/**
 * Shared loader for both apply routes (`/browse/…/apply` and
 * `/tenant/browse/…/apply`). Signed-out visitors go to sign-in and accounts
 * without the tenant role to browse. Returns null when the listing is gone.
 * The Passport itself loads on the client (linking the verified ID is a
 * write), and readiness is recomputed there as the form changes.
 */
export async function loadApplyPage(apartmentId: string): Promise<ApplyPageData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, roles, account_status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError) throw new Error(`Couldn't load your profile: ${profileError.message}`);
  if (!profile?.roles?.includes("tenant")) redirect("/browse");

  const [apartment, pendingResult] = await Promise.all([
    getApplyApartmentContext(supabase, apartmentId),
    supabase
      .from("rental_application")
      .select("id")
      .eq("tenant_id", profile.id)
      .eq("apartment_id", apartmentId)
      .eq("status", "pending")
      .limit(1),
  ]);
  if (!apartment) return null;
  if (pendingResult.error) throw new Error(`Couldn't check your applications: ${pendingResult.error.message}`);

  return {
    apartment,
    viewer: { userId: profile.id, accountStatus: profile.account_status },
    hasActiveApplication: (pendingResult.data ?? []).length > 0,
  };
}
