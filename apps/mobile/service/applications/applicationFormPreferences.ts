import type { ApplicationPreferenceSource } from '@repo/utils'

import type { RentalPreferences } from '@/stores/useApplicationFormStore'
import type { TenantPreferences } from '@/hooks/preferences/useUserPreferences'

export type ApplicationPreferenceAnswers = Pick<
  RentalPreferences,
  | 'hasPets'
  | 'kindOfPets'
  | 'noOfPets'
  | 'nameOfPets'
  | 'needParking'
  | 'noOfParkingSpots'
  | 'listOfVehicles'
  | 'isSmoker'
  | 'hasDisability'
>

/**
 * The apply form's preference questions started from the tenant's saved
 * preferences. Details come along only for a yes, so a no never carries pet
 * or vehicle data. Null when nothing is saved: the questions start unanswered.
 */
export function applicationAnswersFromSavedPreferences(
  prefs: TenantPreferences | null | undefined,
): ApplicationPreferenceAnswers | null {
  if (!prefs) return null
  return {
    hasPets: prefs.hasPets,
    kindOfPets: prefs.hasPets ? prefs.kindOfPets : [],
    noOfPets: prefs.hasPets ? prefs.noOfPets : 1,
    nameOfPets: prefs.hasPets ? prefs.nameOfPets : null,
    needParking: prefs.hasParking,
    noOfParkingSpots: prefs.hasParking ? prefs.noOfParkingSpots : 1,
    listOfVehicles: prefs.hasParking ? prefs.listOfVehicles : [],
    isSmoker: prefs.hasSmoker,
    hasDisability: prefs.hasDisability,
  }
}

/** The form's answers and details in the shape the shared snapshot builder reads. */
export function toApplicationPreferenceSource(
  answers: ApplicationPreferenceAnswers,
): ApplicationPreferenceSource {
  return {
    hasPets: answers.hasPets ?? false,
    kindOfPets: answers.kindOfPets,
    noOfPets: answers.noOfPets,
    nameOfPets: answers.nameOfPets,
    hasParking: answers.needParking ?? false,
    noOfParkingSpots: answers.noOfParkingSpots,
    listOfVehicles: answers.listOfVehicles,
    hasSmoker: answers.isSmoker ?? false,
    hasDisability: answers.hasDisability ?? false,
  }
}
