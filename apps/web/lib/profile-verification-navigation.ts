/** Only listing detail paths are accepted, never arbitrary redirect targets or form drafts. */
export function verificationApartmentPath(value: string | null): string | null {
  if (!value) return null;
  const match = /^(\/(?:tenant\/)?browse\/[a-zA-Z0-9-]+)(?:\/apply)?$/.exec(value);
  return match?.[1] ?? null;
}

export function profileVerificationHref(apartmentPath: string | null): string {
  const params = new URLSearchParams({ openVerification: "true" });
  const returnTo = verificationApartmentPath(apartmentPath);
  if (returnTo) params.set("returnTo", returnTo);
  return `/tenant/profile?${params}`;
}
