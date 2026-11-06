export type AdminRoleDecision = "grant" | "revoke";

export type AdminRoleOption =
  | { kind: "available"; decision: AdminRoleDecision }
  | { kind: "unavailable"; message: string };

interface AdminRoleCandidate {
  id: string;
  roles: string[];
  account_status: string;
  mobile_number: string | null;
  is_suspended: boolean;
}

export function parseAdminRoleDecision(value: unknown): AdminRoleDecision | null {
  return value === "grant" || value === "revoke" ? value : null;
}

export function isAuthenticatorCode(value: unknown): value is string {
  return typeof value === "string" && /^\d{6}$/.test(value);
}

/**
 * What the Account actions card offers. Feedback only: the
 * admin_grant_admin_role / admin_revoke_admin_role functions decide.
 */
export function getAdminRoleOption(user: AdminRoleCandidate, viewerId: string): AdminRoleOption {
  if (user.id === viewerId) {
    return { kind: "unavailable", message: "You cannot change your own admin access." };
  }
  if (user.roles.includes("admin")) {
    return user.roles.some((role) => role === "tenant" || role === "landlord")
      ? { kind: "available", decision: "revoke" }
      : {
          kind: "unavailable",
          message: "This account has no tenant or landlord role to keep. A database operator must change it.",
        };
  }
  if (user.is_suspended) {
    return { kind: "unavailable", message: "A suspended account cannot become an admin." };
  }
  if (user.account_status !== "verified" || !user.mobile_number) {
    return {
      kind: "unavailable",
      message: "Only a verified account with a complete profile can become an admin.",
    };
  }
  return { kind: "available", decision: "grant" };
}
