import { preferredPortal } from "@repo/supabase/portal-preference";
import type { RegistrationPolicy } from "./registration-policies";

export type PolicyPortal = "tenant" | "landlord" | "admin";

/** Presentation destination only; each portal page still authorizes its viewer. */
export function policyPortal(roles: string[], selected: string | null): PolicyPortal | null {
  if (roles.includes("admin")) return "admin";
  return preferredPortal(roles, selected);
}

export function policyHref(policy: RegistrationPolicy, portal: PolicyPortal | null = null): string {
  const path = policy === "privacy" ? "/pap" : "/tos";
  return portal ? `/${portal}${path}` : path;
}
