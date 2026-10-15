// Mirrors mobile detail-page feedback; database guards remain authoritative.
export function isApartmentUnavailable(status: string | null | undefined): boolean {
  return status === "occupied" || status === "under_maintenance";
}
