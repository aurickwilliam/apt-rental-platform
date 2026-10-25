export const PORTAL_COOKIE = "apt_portal";

export type Portal = "tenant" | "landlord";

export function preferredPortal(roles: string[], selected: string | null): Portal | null {
  if (selected === "tenant" && roles.includes("tenant")) return "tenant";
  if (selected === "landlord" && roles.includes("landlord")) return "landlord";
  if (roles.includes("landlord")) return "landlord";
  if (roles.includes("tenant")) return "tenant";
  return null;
}

/** A destination is not authorization: portal layouts still enforce access and Admin MFA. */
export function portalDestination(roles: string[], selected: string | null): string | null {
  if (roles.includes("admin")) return "/admin/dashboard";
  const portal = preferredPortal(roles, selected);
  if (portal === "landlord") return "/landlord/dashboard";
  if (portal === "tenant") return "/tenant/my-rental";
  return null;
}
