import {
  buildDeclaredApplicationPreferenceSnapshot,
  type ApplicationPreferenceSnapshot,
  type ApplicationPreferenceSource,
} from "@repo/utils";

import { DEFAULT_TENANT_PREFERENCES, type TenantPreferences } from "./tenant-preferences";

/** The preference questions of the apply form: "yes" / "no" answers plus their details. */
export interface ApplicationPreferenceFields {
  hasPets: string | null;
  kindOfPets: string[];
  noOfPets: number;
  nameOfPets: string | null;
  needParking: string | null;
  noOfParkingSpots: number;
  listOfVehicles: string[];
  isSmoker: string | null;
  hasDisability: string | null;
}

const yesNo = (value: boolean): "yes" | "no" => (value ? "yes" : "no");

/**
 * The preference questions of the form, started from the tenant's saved
 * preferences. Details are copied only for a "yes", so an answer of "no" never
 * carries pet or vehicle data. Null when nothing was saved: the questions then
 * start unanswered. The tenant can change every answer for this application.
 */
export function applicationFormDefaultsFromPreferences(
  prefs: TenantPreferences | null,
): Partial<ApplicationPreferenceFields> | null {
  if (!prefs) return null;
  return {
    hasPets: yesNo(prefs.hasPets),
    kindOfPets: prefs.hasPets ? prefs.kindOfPets : DEFAULT_TENANT_PREFERENCES.kindOfPets,
    noOfPets: prefs.hasPets ? prefs.noOfPets : DEFAULT_TENANT_PREFERENCES.noOfPets,
    nameOfPets: prefs.hasPets ? prefs.nameOfPets : DEFAULT_TENANT_PREFERENCES.nameOfPets,
    needParking: yesNo(prefs.hasParking),
    noOfParkingSpots: prefs.hasParking ? prefs.noOfParkingSpots : DEFAULT_TENANT_PREFERENCES.noOfParkingSpots,
    listOfVehicles: prefs.hasParking ? prefs.listOfVehicles : DEFAULT_TENANT_PREFERENCES.listOfVehicles,
    isSmoker: yesNo(prefs.hasSmoker),
    hasDisability: yesNo(prefs.hasDisability),
  };
}

/** The form's answers and details in the shape the shared snapshot builder reads. */
export function applicationPreferenceSourceFromForm(form: ApplicationPreferenceFields): ApplicationPreferenceSource {
  return {
    hasPets: form.hasPets === "yes",
    kindOfPets: form.kindOfPets,
    noOfPets: form.noOfPets,
    nameOfPets: form.nameOfPets,
    hasParking: form.needParking === "yes",
    noOfParkingSpots: form.noOfParkingSpots,
    listOfVehicles: form.listOfVehicles,
    hasSmoker: form.isSmoker === "yes",
    hasDisability: form.hasDisability === "yes",
  };
}

/**
 * The copy stored on the application: what the tenant declared on the form.
 * Details of pets or parking they answered "no" to are never included.
 */
export function buildApplicationSnapshotFromForm(form: ApplicationPreferenceFields): ApplicationPreferenceSnapshot {
  return buildDeclaredApplicationPreferenceSnapshot(applicationPreferenceSourceFromForm(form));
}
