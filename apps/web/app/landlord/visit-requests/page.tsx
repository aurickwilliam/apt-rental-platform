import { requirePortalViewer } from "@/lib/server-identity";
import { loadPresentationSeed } from "@/lib/presentation-seed-server";
import { fetchLandlordVisitRequests, type LandlordVisitRequest } from "@/service/landlordVisitRequestsService";
import VisitRequestsClient from "./VisitRequestsClient";

export default async function LandlordVisitRequestsPage() {
  const { supabase, user, profile } = await requirePortalViewer("landlord");
  const initial = await loadPresentationSeed(user.id, profile.id,
    () => fetchLandlordVisitRequests(undefined, supabase, profile.id), [] as LandlordVisitRequest[], "Failed to load visit requests.");
  return <VisitRequestsClient key={user.id} initial={initial} />;
}
