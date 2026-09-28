export const PORTAL_COOKIE = "apt_portal";

export type Portal = "tenant" | "landlord";

export function preferredPortal(roles: string[], selected: string | null): Portal | null {
  if (selected === "tenant" && roles.includes("tenant")) return "tenant";
  if (selected === "landlord" && roles.includes("landlord")) return "landlord";
  if (roles.includes("landlord")) return "landlord";
  if (roles.includes("tenant")) return "tenant";
  return null;
}
