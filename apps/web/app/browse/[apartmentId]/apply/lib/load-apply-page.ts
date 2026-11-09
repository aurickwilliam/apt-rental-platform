import { redirect } from "next/navigation";

import { applicantPersonalInfo, type ApplicantPersonalInfo } from "@/lib/application-profile";
import { getServerIdentity } from "@/lib/server-identity";
import { parseTenantPreferences, type TenantPreferences } from "@/lib/tenant-preferences";

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
  hasActiveTenancy: boolean;
  /** Personal details from the profile; read-only in the form, as on mobile. */
  personalInfo: ApplicantPersonalInfo;
  /**
   * The tenant's saved rental preferences, or null when skipped. They only
   * pre-fill the pets, smoking, parking and disability questions and their
   * details; what the form declares is what the landlord sees.
   */
  savedPreferences: TenantPreferences | null;
}

/**
 * Shared loader for both apply routes (`/browse/…/apply` and
 * `/tenant/browse/…/apply`). Signed-out visitors go to tenant account
 * creation and accounts without the tenant role to browse. Returns null when
 * the listing is gone.
 * Auth and profile come from the request-cached `getServerIdentity`, so the
 * route's shell is not delayed by a second sign-in lookup.
 * The Passport itself loads on the client (linking the verified ID is a
 * write), and readiness is recomputed there as the form changes.
 */
export async function loadApplyPage(apartmentId: string): Promise<ApplyPageData | null> {
  // The request-scoped identity the portal layout already read: reusing it
  // saves two sequential Supabase round trips before the page can start.
  const { supabase, user, profile, error: profileError } = await getServerIdentity();
  if (!user) redirect("/sign-up?role=tenant");
  if (profileError) throw new Error(`Couldn't load your profile: ${profileError.message}`);
  if (!profile?.roles?.includes("tenant")) redirect("/browse");

  const [apartment, pendingResult, tenancyResult] = await Promise.all([
    getApplyApartmentContext(supabase, apartmentId),
    supabase
      .from("rental_application")
      .select("id")
      .eq("tenant_id", profile.id)
      .eq("apartment_id", apartmentId)
      .eq("status", "pending")
      .limit(1),
    supabase.from("tenancies").select("id").eq("tenant_id", profile.id).eq("status", "active").limit(1),
  ]);
  if (!apartment) return null;
  if (pendingResult.error) throw new Error(`Couldn't check your applications: ${pendingResult.error.message}`);
  if (tenancyResult.error) throw new Error(`Couldn't check your rental: ${tenancyResult.error.message}`);

  return {
    apartment,
    viewer: { userId: profile.id, accountStatus: profile.account_status },
    hasActiveApplication: (pendingResult.data ?? []).length > 0,
    hasActiveTenancy: (tenancyResult.data ?? []).length > 0,
    personalInfo: applicantPersonalInfo(profile, user.email ?? null),
    savedPreferences: parseTenantPreferences(profile.preferences),
  };
}
