import { requirePortalViewer } from "@/lib/server-identity";
import { loadPresentationSeed } from "@/lib/presentation-seed-server";
import { fetchMaintenanceTenanciesWith } from "@/service/tenancy-context";
import type { MaintenanceRentalContext } from "@/hooks/use-maintenance-tenancy";
import { fetchMaintenanceRequestHistory, type MaintenanceRequest } from "@/service/maintenanceService";
import MaintenanceClient from "./MaintenanceClient";

export default async function MaintenanceRequestPage() {
  const { supabase, user, profile } = await requirePortalViewer("tenant");
  const rental = await loadPresentationSeed(user.id, profile.id, () => fetchMaintenanceTenanciesWith(supabase, profile.id), [], "Failed to load your rental.");
  const context: MaintenanceRentalContext = { authUserId: user.id, tenantId: profile.id, tenancy: rental.data.length === 1 ? rental.data[0] : null, tenancies: rental.data, error: rental.error, renderedAt: rental.renderedAt };
  const history = await loadPresentationSeed(user.id, profile.id,
    () => fetchMaintenanceRequestHistory(null, profile.id, false, supabase),
    [] as MaintenanceRequest[], "Failed to load maintenance requests.", "all");
  return <MaintenanceClient key={user.id} initial={{ ...rental, data: { context, history } }} />;
}
