// Landlord-side access follows account verification: only a verified account
// may use the landlord tools (listings, applications, tenancies, payments,
// finance, landlord messaging). The database enforces the same rule
// (`app_private.unverified_landlord_id()` and the `guard_verified_landlord_write`
// triggers); these helpers only decide feedback and navigation.

export const LANDLORD_VERIFICATION_MESSAGE =
  "Verify your account to use landlord features.";

export type LandlordAccessState = "verified" | "pending" | "unverified";

export function canUseLandlordFeatures(
  accountStatus: string | null | undefined,
): boolean {
  return accountStatus === "verified";
}

// `rejected` and `unverified` both mean "verification still has to be done";
// only `pending` has a review already in progress.
export function getLandlordAccessState(
  accountStatus: string | null | undefined,
): LandlordAccessState {
  if (canUseLandlordFeatures(accountStatus)) return "verified";
  return accountStatus === "pending" ? "pending" : "unverified";
}

// A landlord holding another role keeps that role's access; the block applies
// to the landlord side only.
export function isLandlordAccessBlocked(
  roles: readonly string[],
  accountStatus: string | null | undefined,
): boolean {
  return roles.includes("landlord") && !canUseLandlordFeatures(accountStatus);
}
