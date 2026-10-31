/**
 * Landlord routes an account without a verified status can still open. The
 * database refuses everything else; this list only decides which pages render
 * the verification wall instead of their content. Profile holds the verify
 * flow, and the browse/profile pages are public listing views.
 */
export const LANDLORD_VERIFY_REQUIRED_PATH = "/landlord/verify-required";

const OPEN_WHILE_UNVERIFIED = [
  LANDLORD_VERIFY_REQUIRED_PATH,
  "/landlord/profile",
  "/landlord/browse",
  "/landlord/landlords",
] as const;

/**
 * A landlord with a running tenancy keeps the screens that tenancy needs
 * (confirming cash, answering maintenance); the database refuses everything
 * that is not tied to it.
 */
export const LANDLORD_TENANCY_PATHS = [
  "/landlord/payments",
  "/landlord/maintenance-requests",
] as const;

const matchesPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export function isLandlordRouteOpenWhileUnverified(
  pathname: string,
  hasActiveTenancy = false,
): boolean {
  return (
    OPEN_WHILE_UNVERIFIED.some((prefix) => matchesPrefix(pathname, prefix)) ||
    (hasActiveTenancy && LANDLORD_TENANCY_PATHS.some((prefix) => matchesPrefix(pathname, prefix)))
  );
}
