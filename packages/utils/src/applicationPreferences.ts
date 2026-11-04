// What a tenant tells a landlord on a rental application beyond the form's own
// questions: the details behind their saved preferences (pets, parking and
// vehicles, smoking, a household member with a disability). It is a copy taken
// at submit time and stored on the application (`rental_application.
// tenant_preferences`), so the landlord sees what the tenant declared when
// applying, whatever the tenant edits later. Web and mobile build, read and
// word it here.

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
  if (!prefs) return null;

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
 * The form's yes/no answers pre-filled from saved preferences, as the "yes" /
 * "no" strings both apply forms keep; null when there are no saved preferences
 * (the questions then start unanswered).
 */
export function applicationAnswersFromPreferences(
  prefs: Pick<ApplicationPreferenceSource, "hasPets" | "hasSmoker" | "hasParking"> | null | undefined,
): { hasPets: "yes" | "no"; isSmoker: "yes" | "no"; needParking: "yes" | "no" } | null {
  if (!prefs) return null;
  const yesNo = (value: boolean) => (value ? "yes" : "no");
  return {
    hasPets: yesNo(prefs.hasPets),
    isSmoker: yesNo(prefs.hasSmoker),
    needParking: yesNo(prefs.hasParking),
  };
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

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** The wording both platforms show, one line per topic (pets, parking, smoking, disability). */
export function describeApplicationPreferences(
  snapshot: ApplicationPreferenceSnapshot,
): ApplicationPreferenceLine[] {
  const petDetails: string[] = [];
  if (snapshot.pets.kinds?.length) petDetails.push(snapshot.pets.kinds.join(", "));
  if (snapshot.pets.count) petDetails.push(plural(snapshot.pets.count, "pet", "pets"));
  if (snapshot.pets.names) petDetails.push(`named ${snapshot.pets.names}`);

  const parkingDetails: string[] = [];
  if (snapshot.parking.spots) parkingDetails.push(plural(snapshot.parking.spots, "spot", "spots"));
  if (snapshot.parking.vehicles?.length) parkingDetails.push(snapshot.parking.vehicles.join(", "));

  return [
    {
      label: "Pets",
      value: snapshot.pets.has ? (petDetails.length ? `Yes: ${petDetails.join(" · ")}` : "Yes") : "No",
    },
    {
      label: "Parking",
      value: snapshot.parking.needed
        ? parkingDetails.length
          ? `Needed: ${parkingDetails.join(" · ")}`
          : "Needed"
        : "Not needed",
    },
    { label: "Smoking", value: snapshot.smoker ? "Smoker" : "Non-smoker" },
    {
      label: "Household member with a disability",
      value: snapshot.householdDisability ? "Yes" : "No",
    },
  ];
}
