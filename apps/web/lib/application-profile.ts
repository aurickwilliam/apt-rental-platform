/** Profile columns the apply form's personal section is filled from. */
export interface ApplicantProfile {
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  email: string | null;
  mobile_number: string | null;
  birth_date: string | null;
  street_address: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
}

export interface ApplicantPersonalInfo {
  fullName: string;
  email: string;
  dateOfBirth: string;
  contactNumber: string;
  currentAddress: string;
}

function joinParts(parts: (string | null)[], separator: string): string {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(separator);
}

/**
 * The apply form's personal details, taken from the tenant's profile (as on
 * mobile, where they are read-only). `authEmail` covers profiles without an
 * email column value.
 */
export function applicantPersonalInfo(profile: ApplicantProfile, authEmail: string | null = null): ApplicantPersonalInfo {
  return {
    fullName: joinParts([profile.first_name, profile.middle_name, profile.last_name], " "),
    email: profile.email?.trim() || authEmail?.trim() || "",
    dateOfBirth: profile.birth_date ?? "",
    contactNumber: profile.mobile_number?.trim() ?? "",
    currentAddress: joinParts([profile.street_address, profile.barangay, profile.city, profile.province], ", "),
  };
}
