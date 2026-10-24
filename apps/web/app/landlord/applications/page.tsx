import { requirePortalViewer } from "@/lib/server-identity";
import { loadPresentationSeed } from "@/lib/presentation-seed-server";
import { fetchLandlordApplications, type LandlordApplication } from "@/service/landlordApplicationsService";
import ApplicationsClient from "./ApplicationsClient";

export default async function ApplicationsPage() {
  const { supabase, user, profile } = await requirePortalViewer("landlord");
  const initial = await loadPresentationSeed(user.id, profile.id,
    () => fetchLandlordApplications(undefined, supabase, profile.id), [] as LandlordApplication[], "Failed to load applications.");
  return <ApplicationsClient key={user.id} initial={initial} />;
}
