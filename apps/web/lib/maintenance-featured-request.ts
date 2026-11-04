import type { MaintenanceRequest } from "../service/maintenanceService";

type ActiveRequest = Pick<MaintenanceRequest, "id" | "status" | "created_at" | "updated_at">;

function timestamp(value: string | null | undefined): number {
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Progress wins over pending; legacy rows fall back to their submission date. */
export function sortActiveMaintenanceRequests<T extends ActiveRequest>(requests: readonly T[]): T[] {
  const activity = (request: T) => request.status === "In Progress"
    ? timestamp(request.updated_at) || timestamp(request.created_at)
    : timestamp(request.created_at);
  return requests.filter((request) => request.status === "In Progress" || request.status === "Pending")
    .sort((left, right) => Number(right.status === "In Progress") - Number(left.status === "In Progress")
      || activity(right) - activity(left)
      || timestamp(right.created_at) - timestamp(left.created_at)
      || right.id.localeCompare(left.id));
}
