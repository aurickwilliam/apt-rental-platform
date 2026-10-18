const normalize = (value: string) =>
  value.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * The entry of `barangays` (from `getBarangaysByCity`) that a free-text name,
 * such as a map search result or an older listing, refers to, or null.
 * Case and extra spaces are ignored; "Brgy. 12" matches "Barangay 12".
 */
export function matchBarangay(
  barangays: readonly string[],
  name: string | null | undefined,
): string | null {
  const key = normalize((name ?? "").replace(/^(brgy\.?|barangay)\s+(?=\d)/i, "Barangay "));
  if (!key) return null;
  return barangays.find((barangay) => normalize(barangay) === key) ?? null;
}
