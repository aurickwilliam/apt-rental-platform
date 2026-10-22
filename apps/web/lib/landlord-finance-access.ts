/**
 * Landlord finance access rules (parity plan §6.2). Pure decisions with no
 * runtime imports, so the node tests exercise exactly what the server guard
 * and client hooks run.
 *
 * Finance is active-landlord: a landlord role in `users.roles` plus a
 * non-suspended account. Admin-only and tenant-only profiles have zero
 * finance access — admin membership grants nothing and never adds consumer
 * access; mixed admin/landlord profiles transact like any landlord. Roles are
 * server-managed and never inferred from account history.
 */

/** Shown when a signed-in profile without landlord access opens a finance
 *  surface; exact wording shared with the mobile gate. */
export const FINANCE_ACCESS_ERROR = "Switch to your landlord portal to manage finances.";

export interface LandlordFinanceIdentity {
  /** Auth id, null when signed out. */
  authUserId?: string | null;
  /** `users.roles` as stored on the internal profile. */
  roles: readonly string[];
  /** App-level suspension is the access source of truth. */
  isSuspended: boolean;
}

/** Finance capability for an identity whose suspension state is resolved. */
export function canManageLandlordFinances(
  identity: Pick<LandlordFinanceIdentity, "roles" | "isSuspended">,
): boolean {
  return identity.roles.includes("landlord") && !identity.isSuspended;
}

/** Where a visitor is sent instead of finance routes, or null to enter.
 *  Suspended accounts meet the /suspended notice; profiles without the
 *  landlord role return to browsing (the passport-guard precedent). */
export function landlordFinanceAccessRedirect(
  identity: LandlordFinanceIdentity,
): string | null {
  if (!identity.authUserId) return "/sign-in";
  if (identity.isSuspended) return "/suspended";
  if (!identity.roles.includes("landlord")) return "/browse";
  return null;
}
