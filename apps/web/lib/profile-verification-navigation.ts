const MAX_APARTMENT_ROUTE_ID_LENGTH = 128;

/** Build a new local listing route from allowed segments, never echo a supplied URL. */
export function verificationApartmentPath(value: string | null): string | null {
  if (typeof value !== "string" || !value || /[%?#\\\u0000-\u0020\u007f-\u009f]/.test(value)) return null;
  const segments = value.split("/");
  if (segments[0] !== "") return null;

  // The only supported destinations are /browse/:id and /tenant/browse/:id.
  // An originating application form returns to its listing, never its draft.
  const tenant = segments[1] === "tenant";
  const idIndex = tenant ? 3 : 2;
  if ((tenant && segments[2] !== "browse") || (!tenant && segments[1] !== "browse")) return null;
  if (segments.length !== idIndex + 1 && !(segments.length === idIndex + 2 && segments[idIndex + 1] === "apply")) return null;
  const apartmentId = segments[idIndex];
  // IDs are single bounded ASCII route segments (UUIDs in production). Slug
  // fixtures remain supported, but URL syntax, encodings and dot segments do not.
  if (!apartmentId || apartmentId.length > MAX_APARTMENT_ROUTE_ID_LENGTH || /[^a-zA-Z0-9-]/.test(apartmentId) || !/^[a-zA-Z0-9]/.test(apartmentId)) return null;
  const encodedId = encodeURIComponent(apartmentId);
  return tenant ? `/tenant/browse/${encodedId}` : `/browse/${encodedId}`;
}

export function profileVerificationHref(apartmentPath: string | null): string {
  const params = new URLSearchParams({ openVerification: "true" });
  const returnTo = verificationApartmentPath(apartmentPath);
  if (returnTo) params.set("returnTo", returnTo);
  return `/tenant/profile?${params}`;
}
