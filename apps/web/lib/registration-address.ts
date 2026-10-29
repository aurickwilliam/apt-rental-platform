import { PROVINCES, getCitiesByProvince, getBarangaysByCity, getZipCityWarning, type Province } from "@repo/constants";

export interface RegistrationAddress {
  province: string;
  city: string;
  barangay: string;
  streetAddress: string;
  postalCode: string;
}

export type RegistrationAddressErrors = Partial<Record<keyof RegistrationAddress, string>>;

export const EMPTY_REGISTRATION_ADDRESS: RegistrationAddress = {
  province: "", city: "", barangay: "", streetAddress: "", postalCode: "",
};

// Selector keys are the dataset's labels. Match legacy labels only when exact
// (ignoring case/outer whitespace) and unique; never guess from IDs or fuzzy text.
function matchLabel(options: readonly string[], value: string): string {
  if (options.includes(value)) return value;
  const matches = options.filter(option => option.toLowerCase() === value.trim().toLowerCase());
  return matches.length === 1 ? matches[0] : "";
}

export function resolveRegistrationAddress(value: Partial<RegistrationAddress> = {}): RegistrationAddress {
  const province = matchLabel(PROVINCES, value.province ?? "");
  const city = matchLabel(getCitiesByProvince(province as Province), value.city ?? "");
  const barangay = city ? matchLabel(getBarangaysByCity(city), value.barangay ?? "") : "";
  return { province, city, barangay, streetAddress: value.streetAddress ?? "", postalCode: value.postalCode ?? "" };
}

export function changeRegistrationAddress(
  current: RegistrationAddress,
  field: keyof RegistrationAddress,
  value: string,
): RegistrationAddress {
  if (field === "postalCode") return { ...current, postalCode: value.replace(/\D/g, "").slice(0, 4) };
  if (field === "streetAddress") return { ...current, streetAddress: value };
  const next = resolveRegistrationAddress({ ...current, [field]: value });
  // Domino effect: replacing (or clearing) a chosen province empties everything
  // after it; replacing a chosen city empties barangay through postal code.
  // Picking the same value again, or a first pick, leaves what was typed alone.
  if (field === "province" && current.province && next.province !== current.province) {
    return { ...EMPTY_REGISTRATION_ADDRESS, province: next.province };
  }
  if (field === "city" && current.city && next.city !== current.city) {
    return { ...EMPTY_REGISTRATION_ADDRESS, province: next.province, city: next.city };
  }
  return next;
}

export function validateRegistrationAddress(value: RegistrationAddress): RegistrationAddressErrors {
  const errors: RegistrationAddressErrors = {};
  if (!value.province) errors.province = "State/Province is required.";
  else if (!(PROVINCES as readonly string[]).includes(value.province)) errors.province = "Select a valid state/province.";
  if (!value.city) errors.city = "City is required.";
  else if (errors.province || !getCitiesByProvince(value.province as Province).includes(value.city)) errors.city = "Select a city belonging to your state/province.";
  if (!value.barangay) errors.barangay = "Barangay is required.";
  else if (errors.city || !getBarangaysByCity(value.city).includes(value.barangay)) errors.barangay = "Select a barangay belonging to your city.";
  if (typeof value.streetAddress !== "string" || !value.streetAddress.trim()) errors.streetAddress = "Street Address is required.";
  if (!value.postalCode) errors.postalCode = "Postal code is required.";
  else if (!/^\d{4}$/.test(value.postalCode)) errors.postalCode = "Enter a valid 4-digit postal code.";
  else if (Number(value.postalCode) < 1000) errors.postalCode = "Postal code must be between 1000 and 9999.";
  return errors;
}

// Never blocks: our ZIP tables are incomplete, so a well-formed ZIP we do not
// recognize for the city only gets a "double-check it" note.
export function getRegistrationZipWarning(value: RegistrationAddress): string | null {
  if (validateRegistrationAddress(value).postalCode) return null;
  return getZipCityWarning(value.city, value.province, value.postalCode);
}
