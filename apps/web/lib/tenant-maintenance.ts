interface MaintenanceTenancy {
  status: string;
}

/**
 * Presentation only: the database guard is the authorization boundary.
 * "Eligible" uses the app's existing active-tenancy definition (status),
 * never an application state or an invented lease-date window.
 */
export function canRequestMaintenance(tenancy: MaintenanceTenancy | null | undefined): boolean {
  return tenancy?.status === "active";
}

export function maintenanceHref(tenancyId?: string, section: "new-request" | "requests" = "new-request"): string {
  return `/tenant/maintenance${tenancyId ? `?tenancyId=${encodeURIComponent(tenancyId)}` : ""}#${section}`;
}
