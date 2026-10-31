import { requirePortalViewer } from "@/lib/server-identity";
import { loadPresentationSeed } from "@/lib/presentation-seed-server";
import { fetchLandlordMaintenanceRequests, type LandlordMaintenanceRequest } from "@/service/landlordMaintenanceService";
import MaintenanceRequestsClient from "./MaintenanceRequestsClient";

export default async function MaintenanceRequestsPage() {
  const { supabase, user, profile } = await requirePortalViewer("landlord", true);
  const initial = await loadPresentationSeed(user.id, profile.id,
    () => fetchLandlordMaintenanceRequests(profile.id, { includePhotos: false }, supabase), [] as LandlordMaintenanceRequest[], "Failed to load maintenance requests.");
  return <MaintenanceRequestsClient key={user.id} initial={initial} />;
}
