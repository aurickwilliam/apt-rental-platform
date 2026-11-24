import type { MaintenanceRequest } from "@/service/maintenanceService";

/** Most active requests the My Rental card lists (mobile `MAINTENANCE_PREVIEW_LIMIT`). */
export const MAINTENANCE_PREVIEW_LIMIT = 3;

type PreviewRequest = Pick<MaintenanceRequest, "id" | "status" | "created_at" | "resolved_at">;

const isActive = (request: PreviewRequest) =>
  request.status === "Pending" || request.status === "In Progress";

export interface MaintenancePreview<T extends PreviewRequest> {
  /** Requests drawn in the card. */
  visible: T[];
  /** Every active request in the loaded history, not just the visible ones. */
  activeCount: number;
}

/**
 * Same rule as mobile's Rentals Maintenance section: keep active repairs in
 * view (newest first, as the history returns them); once none remain, show
 * just the most recently resolved request. Cancelled requests never appear.
 */
export function selectMaintenancePreview<T extends PreviewRequest>(
  requests: readonly T[],
  limit = MAINTENANCE_PREVIEW_LIMIT,
): MaintenancePreview<T> {
  const active = requests.filter(isActive);
  if (active.length > 0) return { visible: active.slice(0, limit), activeCount: active.length };

  const stamp = (request: PreviewRequest) => Date.parse(request.resolved_at ?? request.created_at) || 0;
  const latestResolved = requests
    .filter((request) => request.status === "Resolved")
    .sort((left, right) => stamp(right) - stamp(left) || right.id.localeCompare(left.id))
    .slice(0, 1);
  return { visible: latestResolved, activeCount: 0 };
}
