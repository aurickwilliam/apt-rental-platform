"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@repo/supabase/browser";
import { useUser } from "@/hooks/use-user";
import { toast } from "@heroui/react";
import { CAMANAVA_CITIES } from "@repo/constants";

export type TenantPreferences = {
  selectedCities: string[];
  budgetMin: number;
  budgetMax: number;
  bedroomCount: string | null;
  householdSize: string | null;
  hasPets: boolean;
  kindOfPets: string;
  nameOfPets: string | null;
  hasParking: boolean;
  noOfParkingSpots: number;
  listOfVehicles: string[];
  hasSmoker: boolean;
  hasDisability: boolean;
};

const DEFAULT_BUDGET_MIN = 5_000;
const DEFAULT_BUDGET_MAX = 100_000;

function isDefaultBudget(prefs: TenantPreferences): boolean {
  return prefs.budgetMin === DEFAULT_BUDGET_MIN && prefs.budgetMax === DEFAULT_BUDGET_MAX;
}

function hasPersonalization(prefs: TenantPreferences | null | undefined): boolean {
  if (!prefs) return false;
  if (prefs.selectedCities.length > 0) return true;
  if (!isDefaultBudget(prefs)) return true;
  if (prefs.bedroomCount !== null) return true;
  if (prefs.householdSize !== null) return true;
  if (prefs.hasPets) return true;
  if (prefs.hasParking) return true;
  if (prefs.hasSmoker) return true;
  if (prefs.hasDisability) return true;
  return false;
}

function parsePreferences(raw: unknown): TenantPreferences | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.selectedCities)) return null;
  return {
    selectedCities: obj.selectedCities as string[],
    budgetMin: typeof obj.budgetMin === "number" ? obj.budgetMin : DEFAULT_BUDGET_MIN,
    budgetMax: typeof obj.budgetMax === "number" ? obj.budgetMax : DEFAULT_BUDGET_MAX,
    bedroomCount: (obj.bedroomCount as string | null) ?? null,
    householdSize: (obj.householdSize as string | null) ?? null,
    hasPets: Boolean(obj.hasPets),
    kindOfPets: (obj.kindOfPets as string) ?? "",
    nameOfPets: (obj.nameOfPets as string | null) ?? null,
    hasParking: Boolean(obj.hasParking),
    noOfParkingSpots: typeof obj.noOfParkingSpots === "number" ? obj.noOfParkingSpots : 1,
    listOfVehicles: Array.isArray(obj.listOfVehicles) ? (obj.listOfVehicles as string[]) : [],
    hasSmoker: Boolean(obj.hasSmoker),
    hasDisability: Boolean(obj.hasDisability),
  };
}

export function useRentalPreferencesForm() {
  const { profile, user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const parsedPrefs = useMemo((): TenantPreferences | null => {
    if (!profile?.preferences) return null;
    return parsePreferences(profile.preferences);
  }, [profile?.preferences]);

  const isTenant = profile?.roles.includes("tenant") ?? false;

  const initialState: TenantPreferences = {
    selectedCities: [],
    budgetMin: DEFAULT_BUDGET_MIN,
    budgetMax: DEFAULT_BUDGET_MAX,
    bedroomCount: null,
    householdSize: null,
    hasPets: false,
    kindOfPets: "",
    nameOfPets: null,
    hasParking: false,
    noOfParkingSpots: 1,
    listOfVehicles: [],
    hasSmoker: false,
    hasDisability: false,
  };

  const [formState, setFormState] = useState<TenantPreferences>(initialState);

  // Sync form state when parsed preferences change (after profile loads)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (parsedPrefs) {
      setFormState({
        selectedCities: parsedPrefs.selectedCities ?? [],
        budgetMin: parsedPrefs.budgetMin ?? DEFAULT_BUDGET_MIN,
        budgetMax: parsedPrefs.budgetMax ?? DEFAULT_BUDGET_MAX,
        bedroomCount: parsedPrefs.bedroomCount ?? null,
        householdSize: parsedPrefs.householdSize ?? null,
        hasPets: parsedPrefs.hasPets ?? false,
        kindOfPets: parsedPrefs.kindOfPets ?? "",
        nameOfPets: parsedPrefs.nameOfPets ?? null,
        hasParking: parsedPrefs.hasParking ?? false,
        noOfParkingSpots: parsedPrefs.noOfParkingSpots ?? 1,
        listOfVehicles: parsedPrefs.listOfVehicles ?? [],
        hasSmoker: parsedPrefs.hasSmoker ?? false,
        hasDisability: parsedPrefs.hasDisability ?? false,
      });
    }
    setIsLoading(false);
  }, [parsedPrefs]);

  const markDirty = useCallback(() => setIsDirty(true), []);

  const toggleCity = useCallback((city: string) => {
    setFormState((prev) => {
      const cities = ["CAMANAVA", ...CAMANAVA_CITIES];
      if (city === "CAMANAVA") {
        const allCities = cities.slice(1);
        const allSelected = allCities.every((c) => prev.selectedCities.includes(c));
        if (allSelected) {
          return { ...prev, selectedCities: [] };
        } else {
          return { ...prev, selectedCities: allCities };
        }
      }
      const selected = prev.selectedCities.includes(city)
        ? prev.selectedCities.filter((c) => c !== city)
        : [...prev.selectedCities, city];
      return { ...prev, selectedCities: selected };
    });
    markDirty();
  }, [markDirty]);

  const toggleVehicle = useCallback((vehicle: string) => {
    setFormState((prev) => {
      const vehicles = prev.listOfVehicles.includes(vehicle)
        ? prev.listOfVehicles.filter((v) => v !== vehicle)
        : [...prev.listOfVehicles, vehicle];
      return { ...prev, listOfVehicles: vehicles };
    });
    markDirty();
  }, [markDirty]);

  const setBudgetRange = useCallback((min: number, max: number) => {
    setFormState((prev) => ({ ...prev, budgetMin: min, budgetMax: max }));
    markDirty();
  }, [markDirty]);

  const setBedroomCount = useCallback((value: string) => {
    setFormState((prev) => ({ ...prev, bedroomCount: value }));
    markDirty();
  }, [markDirty]);

  const setHouseholdSize = useCallback((value: string) => {
    setFormState((prev) => ({ ...prev, householdSize: value }));
    markDirty();
  }, [markDirty]);

  const setHasPets = useCallback((value: boolean) => {
    setFormState((prev) => ({ ...prev, hasPets: value }));
    markDirty();
  }, [markDirty]);

  const setKindOfPets = useCallback((value: string) => {
    setFormState((prev) => ({ ...prev, kindOfPets: value }));
    markDirty();
  }, [markDirty]);

  const setNameOfPets = useCallback((value: string) => {
    setFormState((prev) => ({ ...prev, nameOfPets: value }));
    markDirty();
  }, [markDirty]);

  const setHasParking = useCallback((value: boolean) => {
    setFormState((prev) => ({ ...prev, hasParking: value }));
    markDirty();
  }, [markDirty]);

  const setNoOfParkingSpots = useCallback((value: number) => {
    setFormState((prev) => ({ ...prev, noOfParkingSpots: value }));
    markDirty();
  }, [markDirty]);

  const setHasSmoker = useCallback((value: boolean) => {
    setFormState((prev) => ({ ...prev, hasSmoker: value }));
    markDirty();
  }, [markDirty]);

  const setHasDisability = useCallback((value: boolean) => {
    setFormState((prev) => ({ ...prev, hasDisability: value }));
    markDirty();
  }, [markDirty]);

  const save = useCallback(async () => {
    if (!profile?.id || !user?.id) {
      toast.danger("Not signed in");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("users")
        .update({ preferences: formState })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Preferences saved");
      setIsDirty(false);
    } catch (err: unknown) {
      console.error("Failed to save preferences", err);
      const errMsg = err instanceof Error ? err.message : "Try again.";
      toast.danger("Couldn't save", { description: errMsg });
      setError(err instanceof Error ? err : new Error(errMsg));
    } finally {
      setIsSaving(false);
    }
  }, [profile?.id, user?.id, formState, toast]);

  return {
    profile,
    isTenant,
    selectedCities: formState.selectedCities,
    budgetMin: formState.budgetMin,
    budgetMax: formState.budgetMax,
    bedroomCount: formState.bedroomCount,
    householdSize: formState.householdSize,
    hasPets: formState.hasPets,
    kindOfPets: formState.kindOfPets,
    nameOfPets: formState.nameOfPets,
    hasParking: formState.hasParking,
    noOfParkingSpots: formState.noOfParkingSpots,
    listOfVehicles: formState.listOfVehicles,
    hasSmoker: formState.hasSmoker,
    hasDisability: formState.hasDisability,
    isSaving,
    isDirty,
    isLoading,
    error,
    setBudgetRange,
    setBedroomCount,
    setHouseholdSize,
    setHasPets,
    setKindOfPets,
    setNameOfPets,
    setHasParking,
    setNoOfParkingSpots,
    setHasSmoker,
    setHasDisability,
    toggleCity,
    toggleVehicle,
    save,
  };
}

export function useUserPreferences() {
  const { profile } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  const parsedPrefs = useMemo((): TenantPreferences | null => {
    if (!profile?.preferences) return null;
    return parsePreferences(profile.preferences);
  }, [profile?.preferences]);

  const isTenant = profile?.roles.includes("tenant") ?? false;
  const hasPrefs = isTenant && hasPersonalization(parsedPrefs);
  const personalizedCity = parsedPrefs?.selectedCities[0] ?? "CAMANAVA";
  const extraCitiesCount = Math.max(0, (parsedPrefs?.selectedCities.length ?? 0) - 1);
  const prefsHash = parsedPrefs ? JSON.stringify(parsedPrefs) : null;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setIsLoading(false);
  }, [profile?.preferences]);

  return {
    profile,
    preferences: parsedPrefs,
    isTenant,
    hasPrefs,
    personalizedCity,
    extraCitiesCount,
    prefsHash,
    isLoading,
    error: null,
  };
}