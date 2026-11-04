import type { MaintenanceRequest } from "../service/maintenanceService";

export const MAINTENANCE_HISTORY_PREVIEW_LIMIT = 3;

type HistoryRequest = Pick<MaintenanceRequest, "id" | "status" | "created_at">;

export function sortMaintenanceHistoryRequests<T extends HistoryRequest>(requests: readonly T[]): T[] {
  return requests.filter((request) => request.status === "Resolved" || request.status === "Cancelled")
    .sort((left, right) => (Date.parse(right.created_at) || 0) - (Date.parse(left.created_at) || 0)
      || right.id.localeCompare(left.id));
}
