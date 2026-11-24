// What a tenant tells a landlord on a rental application beyond the form's own
// questions: the details behind their saved preferences (pets, parking and
// vehicles, smoking, a household member with a disability). It is a copy taken
// at submit time and stored on the application (`rental_application.
// tenant_preferences`), so the landlord sees what the tenant declared when
// applying, whatever the tenant edits later. Web and mobile build, read and
// word it here.

import { translate, type LanguageCode } from "@repo/i18n";

export const APPLICATION_PREFERENCES_VERSION = 1;

/** The saved-preference fields a snapshot is built from (structural). */
export interface ApplicationPreferenceSource {
  hasPets: boolean;
  kindOfPets: string[];
  noOfPets: number;
  nameOfPets: string | null;
  hasParking: boolean;
  noOfParkingSpots: number;
  listOfVehicles: string[];
  hasSmoker: boolean;
  hasDisability: boolean;
}

/** The form's own yes/no answers; they win over the saved preferences. */
export interface ApplicationAnswers {
  hasPets: boolean;
  isSmoker: boolean;
  needParking: boolean;
}

export interface ApplicationPreferenceSnapshot {
  version: typeof APPLICATION_PREFERENCES_VERSION;
  pets: { has: boolean; kinds?: string[]; count?: number; names?: string };
  parking: { needed: boolean; spots?: number; vehicles?: string[] };
  smoker: boolean;
  householdDisability: boolean;
}

const MAX_NAMES_LENGTH = 200;

/**
 * The snapshot for an application, or null when the tenant has no saved
 * preferences. The tenant's yes/no answers on the form decide whether pet and
 * parking details are included: details of pets the tenant says they do not
 * have are never shared.
 */
export function buildApplicationPreferenceSnapshot(
  prefs: ApplicationPreferenceSource | null | undefined,
  answers: ApplicationAnswers,
): ApplicationPreferenceSnapshot | null {
  return prefs ? snapshotFrom(prefs, answers) : null;
}

function snapshotFrom(
  prefs: ApplicationPreferenceSource,
  answers: ApplicationAnswers,
): ApplicationPreferenceSnapshot {
  const pets: ApplicationPreferenceSnapshot["pets"] = { has: answers.hasPets };
  if (answers.hasPets && prefs.hasPets) {
    if (prefs.kindOfPets.length > 0) pets.kinds = [...prefs.kindOfPets];
    if (prefs.noOfPets > 0) pets.count = prefs.noOfPets;
    const names = prefs.nameOfPets?.trim();
    if (names) pets.names = names.slice(0, MAX_NAMES_LENGTH);
  }

  const parking: ApplicationPreferenceSnapshot["parking"] = { needed: answers.needParking };
  if (answers.needParking && prefs.hasParking) {
    if (prefs.noOfParkingSpots > 0) parking.spots = prefs.noOfParkingSpots;
    if (prefs.listOfVehicles.length > 0) parking.vehicles = [...prefs.listOfVehicles];
  }

  return {
    version: APPLICATION_PREFERENCES_VERSION,
    pets,
    parking,
    smoker: answers.isSmoker,
    householdDisability: prefs.hasDisability,
  };
}

/**
 * The snapshot for an application whose form asks the details itself: the
 * declared answers decide what is shared, so a "no" never carries pet or
 * parking details. Both apply forms build their stored copy with this.
 */
export function buildDeclaredApplicationPreferenceSnapshot(
  declared: ApplicationPreferenceSource,
): ApplicationPreferenceSnapshot {
  return snapshotFrom(declared, {
    hasPets: declared.hasPets,
    isSmoker: declared.hasSmoker,
    needParking: declared.hasParking,
  });
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/** Reads a stored snapshot defensively (it is database JSON); null when unusable. */
export function parseApplicationPreferenceSnapshot(raw: unknown): ApplicationPreferenceSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const pets = value.pets as Record<string, unknown> | undefined;
  const parking = value.parking as Record<string, unknown> | undefined;
  if (!pets || typeof pets !== "object" || typeof pets.has !== "boolean") return null;
  if (!parking || typeof parking !== "object" || typeof parking.needed !== "boolean") return null;

  return {
    version: APPLICATION_PREFERENCES_VERSION,
    pets: {
      has: pets.has,
      ...(isStringArray(pets.kinds) && pets.kinds.length > 0 ? { kinds: pets.kinds } : {}),
      ...(typeof pets.count === "number" && pets.count > 0 ? { count: pets.count } : {}),
      ...(typeof pets.names === "string" && pets.names.trim() ? { names: pets.names } : {}),
    },
    parking: {
      needed: parking.needed,
      ...(typeof parking.spots === "number" && parking.spots > 0 ? { spots: parking.spots } : {}),
      ...(isStringArray(parking.vehicles) && parking.vehicles.length > 0 ? { vehicles: parking.vehicles } : {}),
    },
    smoker: value.smoker === true,
    householdDisability: value.householdDisability === true,
  };
}

export interface ApplicationPreferenceLine {
  label: string;
  value: string;
}

/** The wording both platforms show, one line per topic (pets, parking, smoking, disability). */
export function describeApplicationPreferences(
  snapshot: ApplicationPreferenceSnapshot,
  language: LanguageCode = "en",
): ApplicationPreferenceLine[] {
  const petDetails: string[] = [];
  if (snapshot.pets.kinds?.length) petDetails.push(snapshot.pets.kinds.join(", "));
  if (snapshot.pets.count) {
    petDetails.push(
      translate(language, snapshot.pets.count === 1 ? "apply.review.petOne" : "apply.review.petOther", { count: snapshot.pets.count }),
    );
  }
  if (snapshot.pets.names) petDetails.push(translate(language, "apply.review.named", { names: snapshot.pets.names }));

  const parkingDetails: string[] = [];
  if (snapshot.parking.spots) {
    parkingDetails.push(
      translate(language, snapshot.parking.spots === 1 ? "apply.review.spotOne" : "apply.review.spotOther", { count: snapshot.parking.spots }),
    );
  }
  if (snapshot.parking.vehicles?.length) parkingDetails.push(snapshot.parking.vehicles.join(", "));

  return [
    {
      label: translate(language, "apply.review.preferencePets"),
      value: snapshot.pets.has
        ? petDetails.length
          ? `${translate(language, "apply.review.yes")}: ${petDetails.join(" · ")}`
          : translate(language, "apply.review.yes")
        : translate(language, "apply.review.no"),
    },
    {
      label: translate(language, "apply.review.preferenceParking"),
      value: snapshot.parking.needed
        ? parkingDetails.length
          ? `${translate(language, "apply.review.needed")}: ${parkingDetails.join(" · ")}`
          : translate(language, "apply.review.needed")
        : translate(language, "apply.review.notNeeded"),
    },
    {
      label: translate(language, "apply.review.preferenceSmoking"),
      value: snapshot.smoker
        ? translate(language, "apply.review.smoker")
        : translate(language, "apply.review.nonSmoker"),
    },
    {
      label: translate(language, "apply.review.preferenceDisability"),
      value: snapshot.householdDisability
        ? translate(language, "apply.review.yes")
        : translate(language, "apply.review.no"),
    },
  ];
}
