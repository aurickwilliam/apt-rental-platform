"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@repo/supabase/browser";
import { useUser } from "@/hooks/use-user";
import { toast } from "@heroui/react";

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

const DEFAULT_PREFS: TenantPreferences = {
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

function isDefaultBudget(prefs: TenantPreferences): boolean {
  return prefs.budgetMin === DEFAULT_BUDGET_MIN && prefs.budgetMax === DEFAULT_BUDGET_MAX;
}

export function hasPersonalization(prefs: TenantPreferences | null | undefined): boolean {
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

export function parsePreferences(raw: unknown): TenantPreferences | null {
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

function prefsEqual(a: TenantPreferences, b: TenantPreferences): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useRentalPreferencesForm() {
  const { profile, user } = useUser();
  const userId = user?.id ?? null;
  const profileId = profile?.id ?? null;

  // Initial prefs from profile.preferences — stable reference because useUser
  // recreates the profile object only when the DB row changes.
  const initialPrefs = useMemo<TenantPreferences>(() => {
    if (!profile?.preferences) return DEFAULT_PREFS;
    return parsePreferences(profile.preferences) ?? DEFAULT_PREFS;
  }, [profile?.preferences]);

  const isTenant = profile?.roles.includes("tenant") ?? false;

  // Single form state object - initialized from initialPrefs
  const [formState, setFormState] = useState<TenantPreferences>(initialPrefs);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form state when initialPrefs changes (profile loads/changes)
  const prevKeyRef = useRef<string>(JSON.stringify(initialPrefs));
  useEffect(() => {
    const currentKey = JSON.stringify(initialPrefs);
    if (prevKeyRef.current !== currentKey) {
      prevKeyRef.current = currentKey;
      setFormState(initialPrefs);
    }
  }, [initialPrefs]);

  const currentPrefs = formState;

  const isDirty = useMemo(() => !prefsEqual(initialPrefs, currentPrefs), [initialPrefs, currentPrefs]);

  const toggleCity = useCallback((city: string) => {
    setFormState((prev) => ({
      ...prev,
      selectedCities: prev.selectedCities.includes(city)
        ? prev.selectedCities.filter((c) => c !== city)
        : [...prev.selectedCities, city],
    }));
  }, []);

  const toggleVehicle = useCallback((vehicle: string) => {
    setFormState((prev) => ({
      ...prev,
      listOfVehicles: prev.listOfVehicles.includes(vehicle)
        ? prev.listOfVehicles.filter((v) => v !== vehicle)
        : [...prev.listOfVehicles, vehicle],
    }));
  }, []);

  const setPetsEnabled = useCallback((val: boolean) => {
    setFormState((prev) => ({
      ...prev,
      hasPets: val,
      kindOfPets: val ? prev.kindOfPets : "",
      nameOfPets: val ? prev.nameOfPets : null,
    }));
  }, []);

  const setParkingEnabled = useCallback((val: boolean) => {
    setFormState((prev) => ({
      ...prev,
      hasParking: val,
      listOfVehicles: val ? prev.listOfVehicles : [],
    }));
  }, []);

  const handleSelectPetKind = useCallback((val: string | null) => {
    const v = val ?? "";
    setFormState((prev) => ({
      ...prev,
      kindOfPets: v,
      nameOfPets: v === "Other" ? prev.nameOfPets : null,
    }));
  }, []);

  const save = useCallback(async () => {
    if (!profileId || !userId) {
      toast.danger("Not signed in");
      return;
    }
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("users").update({ preferences: currentPrefs }).eq("id", profileId);
      if (error) throw error;
      toast.success("Preferences saved");
      // Update baseline so isDirty clears (profile.preferences won't update until next fetch)
      setFormState(currentPrefs);
    } catch (err: unknown) {
      console.error("Failed to save preferences", err);
      const errMsg = err instanceof Error ? err.message : "Try again.";
      toast.danger("Couldn't save", { description: errMsg });
    } finally {
      setIsSaving(false);
    }
  }, [profileId, userId, currentPrefs]);

  const reset = useCallback(() => {
    setFormState(initialPrefs);
  }, [initialPrefs]);

  // Destructure for return
  const {
    selectedCities,
    budgetMin,
    budgetMax,
    bedroomCount,
    householdSize,
    hasPets,
    kindOfPets,
    nameOfPets,
    hasParking,
    noOfParkingSpots,
    listOfVehicles,
    hasSmoker,
    hasDisability,
  } = formState;

  const setBudgetMin = useCallback((val: number) => {
    setFormState((prev) => ({ ...prev, budgetMin: val }));
  }, []);

  const setBudgetMax = useCallback((val: number) => {
    setFormState((prev) => ({ ...prev, budgetMax: val }));
  }, []);

  const setBedroomCount = useCallback((val: string | null) => {
    setFormState((prev) => ({ ...prev, bedroomCount: val }));
  }, []);

  const setHouseholdSize = useCallback((val: string | null) => {
    setFormState((prev) => ({ ...prev, householdSize: val }));
  }, []);

  const setNameOfPets = useCallback((val: string | null) => {
    setFormState((prev) => ({ ...prev, nameOfPets: val }));
  }, []);

  const setNoOfParkingSpots = useCallback((val: number) => {
    setFormState((prev) => ({ ...prev, noOfParkingSpots: val }));
  }, []);

  const setListOfVehicles = useCallback((val: string[]) => {
    setFormState((prev) => ({ ...prev, listOfVehicles: val }));
  }, []);

  const setHasSmoker = useCallback((val: boolean) => {
    setFormState((prev) => ({ ...prev, hasSmoker: val }));
  }, []);

  const setHasDisability = useCallback((val: boolean) => {
    setFormState((prev) => ({ ...prev, hasDisability: val }));
  }, []);

  return {
    profile,
    isTenant,
    selectedCities,
    budgetMin,
    budgetMax,
    bedroomCount,
    householdSize,
    hasPets,
    kindOfPets,
    nameOfPets,
    hasParking,
    noOfParkingSpots,
    listOfVehicles,
    hasSmoker,
    hasDisability,
    isSaving,
    isDirty,
    currentPrefs,
    setBudgetMin,
    setBudgetMax,
    setBudgetRange: (min: number, max: number) => {
      setBudgetMin(min);
      setBudgetMax(max);
    },
    setBedroomCount,
    setHouseholdSize,
    setHasPets: setPetsEnabled,
    setKindOfPets: handleSelectPetKind,
    setNameOfPets,
    setHasParking: setParkingEnabled,
    setNoOfParkingSpots,
    setListOfVehicles,
    setHasSmoker,
    setHasDisability,
    toggleCity,
    toggleVehicle,
    save,
    reset,
  };
}

export function useUserPreferences() {
  const { profile } = useUser();

  const parsedPrefs = useMemo<TenantPreferences | null>(() => {
    if (!profile?.preferences) return null;
    return parsePreferences(profile.preferences);
  }, [profile?.preferences]);

  const isTenant = profile?.roles.includes("tenant") ?? false;
  const hasPrefs = isTenant && hasPersonalization(parsedPrefs);
  const personalizedCity = parsedPrefs?.selectedCities[0] ?? "CAMANAVA";
  const extraCitiesCount = Math.max(0, (parsedPrefs?.selectedCities.length ?? 0) - 1);

  return {
    profile,
    preferences: parsedPrefs,
    isTenant,
    hasPrefs,
    personalizedCity,
    extraCitiesCount,
  };
}