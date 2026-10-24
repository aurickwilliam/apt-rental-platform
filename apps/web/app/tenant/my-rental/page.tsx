import { requirePortalViewer } from "@/lib/server-identity";
import { loadPresentationSeed } from "@/lib/presentation-seed-server";
import { fetchTenantApplications, type TenantApplication } from "@/service/tenantApplicationsService";

import { fetchActiveTenancyWith, type InitialRentalContext } from "@/service/tenancy-context";
import MyRentalClient from "./MyRentalClient";

export default async function MyRentalPage() {
  const { supabase, user, profile } = await requirePortalViewer("tenant");

  const initialContext: InitialRentalContext = { authUserId: user.id, tenantId: profile.id, tenancy: null, error: null, renderedAt: new Date().toISOString() };
  const applications = loadPresentationSeed(user.id, profile.id,
    () => fetchTenantApplications(profile.id, { includeDocuments: false }, supabase), [] as TenantApplication[], "Failed to load applications.");
  try {
    initialContext.tenancy = await fetchActiveTenancyWith(supabase, profile.id);
  } catch (error) {
    console.error("Unable to load initial rental context", error);
    initialContext.error = "Unable to load your rental. Please try again.";
  }
  // Stream secondary presentation without holding the apartment/finance shell.
  initialContext.applications = applications;

  // loading.tsx owns the initial context wait. Finance remains an independent,
  // fresh browser read; the hydrated client must not fetch this context twice.
  return <MyRentalClient key={user.id} initialContext={initialContext} />;
}
