import { isCamanavaCity, isCamanavaZipForCity } from "./address";
import { PH_ZIP_DATABASE } from "./ph-zip-constants";
import { getPostalCode } from "./postal-codes";


/**
 * Checks a 4-digit ZIP against a city/province pair. CAMANAVA cities use their
 * PHPost range; other cities accept the ZIPs we hold for that city. A city with
 * no ZIP data only gets the format check, since we cannot prove it wrong.
 */
export function isZipPlausibleForCity(city: string, province: string, zip: string): boolean {
  if (!/^\d{4}$/.test(zip)) return false;
  if (province === "Metro Manila" && isCamanavaCity(city)) {
    return isCamanavaZipForCity(city, zip);
  }
  const known = new Set<string>(
    PH_ZIP_DATABASE.filter(
      (entry) => entry.province === province && entry.city.split(/[,/]/).some((part) => part.replace(/\s*\(.*\)/, "").trim() === city),
    ).map((entry) => entry.zip),
  );
  const fallback = getPostalCode(city);
  if (fallback) known.add(fallback);
  return known.size === 0 || known.has(zip);
}
