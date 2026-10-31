import { METRO_MANILA_ZIP_RANGES } from "./address";
import { PH_CITY_ZIPS } from "./ph-city-zips";

const ZIP_PATTERN = /^\d{4}$/;

/**
 * Checks a 4-digit ZIP against a city/province pair. Metro Manila cities accept
 * their PHLPost block; other cities accept the ZIPs PHLPost lists for them. A
 * city with no ZIP data only gets the format check, since we cannot prove it
 * wrong.
 */
export function isZipPlausibleForCity(city: string, province: string, zip: string): boolean {
  if (!ZIP_PATTERN.test(zip)) return false;
  if (province === "Metro Manila") {
    const range = METRO_MANILA_ZIP_RANGES[city];
    if (range) return Number(zip) >= range.min && Number(zip) <= range.max;
  }
  const known = PH_CITY_ZIPS[province]?.[city];
  return !known || known.includes(zip);
}

/**
 * Soft check for forms that must not lock a user out over incomplete ZIP data:
 * returns a warning when a well-formed ZIP is not one we recognize for the
 * city, otherwise null. A malformed ZIP is a separate (blocking) error, so it
 * returns null here. Listing forms keep the strict CAMANAVA check instead.
 */
export function getZipCityWarning(city: string, province: string, zip: string): string | null {
  if (!city || !province || !ZIP_PATTERN.test(zip)) return null;
  if (isZipPlausibleForCity(city, province, zip)) return null;
  return `This ZIP isn't one we recognize for ${city}. Double-check it.`;
}

/**
 * The central post office ZIP of a city (the first of its codes), used to
 * prefill an address. Without a province, a city name shared by several
 * provinces (San Fernando, Santa Cruz) returns null rather than a guess.
 */
export function getPostalCode(city: string, province?: string): string | null {
  const primaryZips = (province ? [province] : [...Object.keys(PH_CITY_ZIPS), "Metro Manila"])
    .map((name) => primaryZip(city, name))
    .filter((zip): zip is string => zip !== null);
  return primaryZips.length === 1 ? primaryZips[0] : null;
}

function primaryZip(city: string, province: string): string | null {
  if (province === "Metro Manila" && METRO_MANILA_ZIP_RANGES[city]) return String(METRO_MANILA_ZIP_RANGES[city].min);
  return PH_CITY_ZIPS[province]?.[city]?.[0] ?? null;
}
