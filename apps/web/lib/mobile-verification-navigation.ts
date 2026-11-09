import { verificationApartmentPath } from "./profile-verification-navigation";

/** Relative same-origin entry; never use the desktop's configured QR origin. */
export function mobileVerificationHref(token: string, returnTo: string | null): string {
  const params = new URLSearchParams({ token });
  const apartment = verificationApartmentPath(returnTo);
  if (apartment) params.set("returnTo", apartment);
  return `/verify/mobile?${params}`;
}
