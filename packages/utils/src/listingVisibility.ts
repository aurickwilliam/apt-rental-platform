export type ListingVisibilityStatus = "available" | "under_maintenance";

/** Maintenance pauses discovery; it must never overwrite a running tenancy. */
export function canChangeListingVisibility(status: string, hasActiveTenancy: boolean): boolean {
  return !hasActiveTenancy && (status === "available" || status === "under_maintenance");
}

export function propertyStatusLabel(status: string): string {
  return status === "under_maintenance" ? "Hidden · Under maintenance" : status.replaceAll("_", " ");
}

export function nextListingVisibilityStatus(status: string): ListingVisibilityStatus {
  if (status === "available") return "under_maintenance";
  if (status === "under_maintenance") return "available";
  throw new Error("Only available properties can be hidden. Refresh the property and try again.");
}
