import { PH_ADDRESSES, PROVINCES, type Province } from "./ph-addresses";

export { PROVINCES, type Province };

// Province -> every city/municipality PSGC lists in it (Metro Manila is the NCR). The names, and
// the barangays under them, are generated into ph-addresses.ts.
export const CITIES: Readonly<Record<Province, string[]>> = Object.fromEntries(
  PROVINCES.map((province) => [province, Object.keys(PH_ADDRESSES[province])]),
) as Record<Province, string[]>;

export function getCitiesByProvince(province: Province): string[] {
  return CITIES[province] ?? [];
}

const citiesOf = (province: string) => (Object.hasOwn(PH_ADDRESSES, province) ? PH_ADDRESSES[province] : undefined);

let provincesByCity: Map<string, string[]> | undefined;
function getProvincesByCity(city: string): string[] {
  provincesByCity ??= PROVINCES.reduce((index, province) => {
    for (const name of Object.keys(PH_ADDRESSES[province])) index.set(name, [...(index.get(name) ?? []), province]);
    return index;
  }, new Map<string, string[]>());
  return provincesByCity.get(city) ?? [];
}

// Without a province: Metro Manila wins (the CAMANAVA listings), then a city name only one
// province has. An ambiguous name (San Fernando) is never guessed.
function defaultProvinceOf(city: string): string | undefined {
  if (Object.hasOwn(PH_ADDRESSES["Metro Manila"], city)) return "Metro Manila";
  const owners = getProvincesByCity(city);
  return owners.length === 1 ? owners[0] : undefined;
}

/**
 * The barangays of a city. Several city names repeat across provinces (San Fernando, Santa
 * Cruz), so pass the province whenever the user picked one.
 */
export function getBarangaysByCity(city: string, province?: string): string[] {
  const owner = province ?? defaultProvinceOf(city);
  const cities = owner === undefined ? undefined : citiesOf(owner);
  return cities && Object.hasOwn(cities, city) ? cities[city] : [];
}

// Focus market: the CAMANAVA corridor (Caloocan, Malabon, Navotas, Valenzuela).
export const CAMANAVA_CITIES = [
  "Caloocan",
  "Malabon",
  "Navotas",
  "Valenzuela",
] as const;

export type CamanavaCity = (typeof CAMANAVA_CITIES)[number];

export function isCamanavaCity(city: string): city is CamanavaCity {
  return (CAMANAVA_CITIES as readonly string[]).includes(city);
}

// PHLPost issues Metro Manila ZIP codes in one contiguous block per city, and
// the first code of a block is that city's central post office. Source: the
// PHLPost ZIP code locator, checked against every NCR code it has published.
export const METRO_MANILA_ZIP_RANGES: Record<string, { min: number; max: number }> = {
  Manila: { min: 1000, max: 1018 },
  "Quezon City": { min: 1100, max: 1128 },
  Makati: { min: 1200, max: 1235 },
  Pasay: { min: 1300, max: 1309 },
  Caloocan: { min: 1400, max: 1428 },
  Valenzuela: { min: 1440, max: 1448 },
  Malabon: { min: 1470, max: 1480 },
  Navotas: { min: 1485, max: 1490 },
  "San Juan": { min: 1500, max: 1504 },
  Mandaluyong: { min: 1550, max: 1556 },
  Pasig: { min: 1600, max: 1612 },
  // Pateros is the one municipality in Metro Manila; its ZIPs run 1620-1622.
  Pateros: { min: 1620, max: 1622 },
  Taguig: { min: 1630, max: 1639 },
  Parañaque: { min: 1700, max: 1720 },
  "Las Piñas": { min: 1740, max: 1752 },
  Muntinlupa: { min: 1770, max: 1781 },
  Marikina: { min: 1800, max: 1812 },
};

// ZIP code range for each CAMANAVA city.
export const CAMANAVA_ZIP_RANGES: Record<CamanavaCity, { min: number; max: number }> = {
  Caloocan: METRO_MANILA_ZIP_RANGES.Caloocan,
  Malabon: METRO_MANILA_ZIP_RANGES.Malabon,
  Navotas: METRO_MANILA_ZIP_RANGES.Navotas,
  Valenzuela: METRO_MANILA_ZIP_RANGES.Valenzuela,
};

/** True when `zip` is a 4-digit ZIP code inside the city's PHLPost block. */
export function isCamanavaZipForCity(city: string, zip: string): boolean {
  if (!isCamanavaCity(city) || !/^\d{4}$/.test(zip)) return false;
  const value = Number(zip);
  const range = CAMANAVA_ZIP_RANGES[city];
  return value >= range.min && value <= range.max;
}

const CAMANAVA_CITY_ALIASES: Record<string, CamanavaCity> = {
  kalookan: "Caloocan",
};

/**
 * Maps a geocoder city name ("Caloocan City", "City of Valenzuela",
 * "Kalookan") to the listing city, or null outside CAMANAVA.
 */
export function toCamanavaCity(name: string | null | undefined): CamanavaCity | null {
  // Word-based (no backtracking regex): geocoder input is untrusted.
  const words = (name ?? "").toLowerCase().split(" ").filter(Boolean);
  if (words[0] === "city" && words[1] === "of") words.splice(0, 2);
  if (words.length > 1 && words[words.length - 1] === "city") words.pop();
  const key = words.join(" ");
  if (!key) return null;
  return (
    CAMANAVA_CITIES.find((city) => city.toLowerCase() === key) ??
    CAMANAVA_CITY_ALIASES[key] ??
    null
  );
}

/** Province names geocoders use for Metro Manila. */
export function isMetroManilaProvince(name: string | null | undefined): boolean {
  const key = (name ?? "").toLowerCase().trim();
  return key === "metro manila" || key === "national capital region" || key === "ncr";
}

// Browse sentinel + the CAMANAVA corridor, in display order.
export const CAMANAVA_FILTER_OPTIONS = ["CAMANAVA", ...CAMANAVA_CITIES] as const;
