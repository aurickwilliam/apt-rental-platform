"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@heroui/react";

import {
  DEFAULT_TENANT_PREFERENCES,
  parseTenantPreferences,
  validateTenantPreferences,
  type TenantPreferences,
} from "@/lib/tenant-preferences";
import { saveTenantPreferences } from "@/app/(onboarding)/tenant/personalize/actions";

function prefsEqual(a: TenantPreferences, b: TenantPreferences): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function baselineFromProfile(preferences: unknown): TenantPreferences {
  return parseTenantPreferences(preferences) ?? { ...DEFAULT_TENANT_PREFERENCES };
}

/**
 * Web mirror of the mobile `useRentalPreferencesForm`: per-field draft
 * state prefilled from `users.preferences`, dirty tracking against the last
 * saved baseline, and explicit save through the role-protected server
 * action. Draft lives in the caller (the Settings modal) so it survives
 * Settings tab switches; call `reset()` to discard.
 *
 * Takes the already-loaded profile preferences (e.g. from the caller's
 * `useUser()`) instead of fetching them again, so the modal subtree issues
 * no redundant profile request.
 */
export function useRentalPreferencesForm(profilePreferences: unknown) {
  const router = useRouter();

  // Server-data signature. Compared during render (not in an effect): when
  // the stored preferences change elsewhere, the draft resyncs to them.
  const serverJson = JSON.stringify(profilePreferences ?? null);
  const [prevServerJson, setPrevServerJson] = useState(serverJson);
  const [baseline, setBaseline] = useState<TenantPreferences>(() =>
    baselineFromProfile(profilePreferences),
  );

  const [selectedCities, setSelectedCities] = useState<string[]>(baseline.selectedCities);
  const [budgetMin, setBudgetMin] = useState(baseline.budgetMin);
  const [budgetMax, setBudgetMax] = useState(baseline.budgetMax);
  const [bedroomCount, setBedroomCount] = useState<string | null>(baseline.bedroomCount);
  const [householdSize, setHouseholdSize] = useState<string | null>(baseline.householdSize);
  const [hasPets, setHasPetsRaw] = useState(baseline.hasPets);
  const [kindOfPets, setKindOfPetsRaw] = useState<string[]>(baseline.kindOfPets);
  const [noOfPets, setNoOfPetsRaw] = useState(baseline.noOfPets);
  const [nameOfPets, setNameOfPets] = useState<string | null>(baseline.nameOfPets);
  const [hasParking, setHasParkingRaw] = useState(baseline.hasParking);
  const [noOfParkingSpots, setNoOfParkingSpots] = useState(baseline.noOfParkingSpots);
  const [listOfVehicles, setListOfVehicles] = useState<string[]>(baseline.listOfVehicles);
  const [hasSmoker, setHasSmoker] = useState(baseline.hasSmoker);
  const [hasDisability, setHasDisability] = useState(baseline.hasDisability);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (prevServerJson !== serverJson) {
    const next = baselineFromProfile(profilePreferences);
    setPrevServerJson(serverJson);
    setBaseline(next);
    setSelectedCities(next.selectedCities);
    setBudgetMin(next.budgetMin);
    setBudgetMax(next.budgetMax);
    setBedroomCount(next.bedroomCount);
    setHouseholdSize(next.householdSize);
    setHasPetsRaw(next.hasPets);
    setKindOfPetsRaw(next.kindOfPets);
    setNoOfPetsRaw(next.noOfPets);
    setNameOfPets(next.nameOfPets);
    setHasParkingRaw(next.hasParking);
    setNoOfParkingSpots(next.noOfParkingSpots);
    setListOfVehicles(next.listOfVehicles);
    setHasSmoker(next.hasSmoker);
    setHasDisability(next.hasDisability);
    setSaveError(null);
  }

  const currentPrefs: TenantPreferences = useMemo(
    () => ({
      selectedCities,
      budgetMin,
      budgetMax,
      bedroomCount,
      householdSize,
      hasPets,
      kindOfPets,
      noOfPets,
      nameOfPets,
      hasParking,
      noOfParkingSpots,
      listOfVehicles,
      hasSmoker,
      hasDisability,
    }),
    [
      selectedCities,
      budgetMin,
      budgetMax,
      bedroomCount,
      householdSize,
      hasPets,
      kindOfPets,
      noOfPets,
      nameOfPets,
      hasParking,
      noOfParkingSpots,
      listOfVehicles,
      hasSmoker,
      hasDisability,
    ],
  );

  const isDirty = useMemo(
    () => !prefsEqual(baseline, currentPrefs),
    [baseline, currentPrefs],
  );

  const toggleCity = useCallback((city: string) => {
    setSaveError(null);
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city],
    );
  }, []);

  const setCities = useCallback((cities: string[]) => {
    setSaveError(null);
    setSelectedCities(cities);
  }, []);

  const toggleVehicle = useCallback((vehicle: string) => {
    setSaveError(null);
    setListOfVehicles((prev) =>
      prev.includes(vehicle) ? prev.filter((v) => v !== vehicle) : [...prev, vehicle],
    );
  }, []);

  const setVehicles = useCallback((vehicles: string[]) => {
    setSaveError(null);
    setListOfVehicles(vehicles);
  }, []);

  // Conditional clearing mirrors mobile: disabling a parent option clears
  // its dependent values so stale data is never saved.
  const setHasPets = useCallback((value: boolean) => {
    setSaveError(null);
    setHasPetsRaw(value);
    if (!value) {
      setKindOfPetsRaw([]);
      setNoOfPetsRaw(1);
      setNameOfPets(null);
    }
  }, []);

  const setKindOfPets = useCallback((value: string[]) => {
    setSaveError(null);
    setKindOfPetsRaw(value);
    if (!value.includes("Other")) setNameOfPets(null);
  }, []);

  const setNoOfPets = useCallback((value: number) => {
    setSaveError(null);
    setNoOfPetsRaw(value);
  }, []);

  const setHasParking = useCallback((value: boolean) => {
    setSaveError(null);
    setHasParkingRaw(value);
    if (!value) setListOfVehicles([]);
  }, []);

  const setBudgetRange = useCallback((min: number, max: number) => {
    setSaveError(null);
    setBudgetMin(min);
    setBudgetMax(max);
  }, []);

  const reset = useCallback(() => {
    setSelectedCities(baseline.selectedCities);
    setBudgetMin(baseline.budgetMin);
    setBudgetMax(baseline.budgetMax);
    setBedroomCount(baseline.bedroomCount);
    setHouseholdSize(baseline.householdSize);
    setHasPetsRaw(baseline.hasPets);
    setKindOfPetsRaw(baseline.kindOfPets);
    setNoOfPetsRaw(baseline.noOfPets);
    setNameOfPets(baseline.nameOfPets);
    setHasParkingRaw(baseline.hasParking);
    setNoOfParkingSpots(baseline.noOfParkingSpots);
    setListOfVehicles(baseline.listOfVehicles);
    setHasSmoker(baseline.hasSmoker);
    setHasDisability(baseline.hasDisability);
    setSaveError(null);
  }, [baseline]);

  const save = useCallback(async (): Promise<boolean> => {
    const clientError = validateTenantPreferences(currentPrefs);
    if (clientError) {
      setSaveError(clientError);
      return false;
    }
    if (isSaving) return false;
    setIsSaving(true);
    setSaveError(null);
    try {
      const result = await saveTenantPreferences(currentPrefs);
      if (!result.ok) {
        // Draft preserved: baseline untouched so the tenant can retry.
        setSaveError(result.error);
        toast.danger("Couldn't save your preferences. Please try again.");
        return false;
      }
      // Saved: the draft becomes the new baseline, and server-rendered
      // consumers (Recommended for You) re-read on refresh.
      setBaseline(currentPrefs);
      toast.success("Rental preferences saved.");
      router.refresh();
      return true;
    } catch {
      setSaveError("Couldn't save your preferences. Check your connection and try again.");
      toast.danger("Couldn't save your preferences. Please try again.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [currentPrefs, isSaving, router]);

  return {
    selectedCities,
    budgetMin,
    budgetMax,
    bedroomCount,
    householdSize,
    hasPets,
    kindOfPets,
    noOfPets,
    nameOfPets,
    hasParking,
    noOfParkingSpots,
    listOfVehicles,
    hasSmoker,
    hasDisability,
    isSaving,
    isDirty,
    saveError,
    setSaveError,
    currentPrefs,
    setBudgetRange,
    setBedroomCount: (v: string | null) => {
      setSaveError(null);
      setBedroomCount(v);
    },
    setHouseholdSize: (v: string | null) => {
      setSaveError(null);
      setHouseholdSize(v);
    },
    setHasPets,
    setKindOfPets,
    setNoOfPets,
    setNameOfPets: (v: string | null) => {
      setSaveError(null);
      setNameOfPets(v);
    },
    setHasParking,
    setNoOfParkingSpots: (v: number) => {
      setSaveError(null);
      setNoOfParkingSpots(v);
    },
    setHasSmoker: (v: boolean) => {
      setSaveError(null);
      setHasSmoker(v);
    },
    setHasDisability: (v: boolean) => {
      setSaveError(null);
      setHasDisability(v);
    },
    toggleCity,
    setCities,
    toggleVehicle,
    setVehicles,
    save,
    reset,
  };
}

export type RentalPreferencesForm = ReturnType<typeof useRentalPreferencesForm>;
