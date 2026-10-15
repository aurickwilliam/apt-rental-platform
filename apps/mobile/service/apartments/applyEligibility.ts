import type { ApartmentStatus } from "@repo/constants";

export interface ApplyEligibilityInput {
  status: ApartmentStatus;
  landlordId?: string | null;
}

/**
 * Why the Apply button is disabled on the apartment page, or null when the
 * viewer may apply. Unverified listings stay applyable. The database guards
 * (`guard_rental_application_insert`) remain the final authority.
 */
export function getApplyDisabledReason(
  apartment: ApplyEligibilityInput | null,
  currentUserId: string | null,
): string | null {
  if (!apartment) return null;
  if (currentUserId && apartment.landlordId === currentUserId) {
    return "Your Listing";
  }
  if (apartment.status === "occupied" || apartment.status === "under_maintenance") {
    return "Not Available";
  }
  return null;
}
