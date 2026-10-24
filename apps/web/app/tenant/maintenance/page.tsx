import { requirePortalViewer } from "@/lib/server-identity";
import { loadPresentationSeed } from "@/lib/presentation-seed-server";
import { fetchActiveTenancyWith, type InitialRentalContext } from "@/service/tenancy-context";
import { fetchMaintenanceRequestHistory, type MaintenanceRequest } from "@/service/maintenanceService";
import MaintenanceClient from "./MaintenanceClient";

export default async function MaintenanceRequestPage() {
  const { supabase, user, profile } = await requirePortalViewer("tenant");
  const rental = await loadPresentationSeed(user.id, profile.id, () => fetchActiveTenancyWith(supabase, profile.id), null, "Failed to load your rental.");
  const context: InitialRentalContext = { authUserId: user.id, tenantId: profile.id, tenancy: rental.data, error: rental.error, renderedAt: rental.renderedAt };
  const apartmentId = context.tenancy?.apartment.id;
  const history = await loadPresentationSeed(user.id, profile.id,
    () => apartmentId ? fetchMaintenanceRequestHistory(apartmentId, profile.id, false, supabase) : Promise.resolve([]),
    [] as MaintenanceRequest[], "Failed to load maintenance requests.", apartmentId);
  return <MaintenanceClient key={user.id} initial={{ ...rental, data: { context, history } }} />;
}
