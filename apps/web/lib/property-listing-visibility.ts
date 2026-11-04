/** Maintenance is a temporary discovery pause, not an occupancy change. */
export function propertyStatusLabel(status: string): string {
  return status === "under_maintenance" ? "Hidden · Under maintenance" : status.replaceAll("_", " ");
}

export function canChangeListingVisibility(status: string, hasActiveTenancy: boolean): boolean {
  return !hasActiveTenancy && (status === "available" || status === "under_maintenance");
}
