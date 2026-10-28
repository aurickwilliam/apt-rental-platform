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

export function isLandlordRouteOpenWhileUnverified(pathname: string): boolean {
  return OPEN_WHILE_UNVERIFIED.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
