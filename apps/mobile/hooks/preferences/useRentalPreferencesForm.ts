import { useEffect, useMemo, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@repo/supabase";
import { useCurrentUser, CURRENT_USER_QUERY_KEY } from "@/hooks/auth/useCurrentUser";
import { parsePreferences, type TenantPreferences } from "@/hooks/preferences/useUserPreferences";

const DEFAULT_PREFS: TenantPreferences = {
  selectedCities: [],
  budgetMin: 5_000,
  budgetMax: 100_000,
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

function prefsEqual(a: TenantPreferences, b: TenantPreferences): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useRentalPreferencesForm() {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentUser();

  const initialPrefs = useMemo(() => parsePreferences(profile?.preferences as any) ?? DEFAULT_PREFS, [profile?.preferences]);

  const [selectedCities, setSelectedCities] = useState<string[]>(initialPrefs.selectedCities);
  const [budgetMin, setBudgetMin] = useState(initialPrefs.budgetMin);
  const [budgetMax, setBudgetMax] = useState(initialPrefs.budgetMax);
  const [bedroomCount, setBedroomCount] = useState<string | null>(initialPrefs.bedroomCount);
  const [householdSize, setHouseholdSize] = useState<string | null>(initialPrefs.householdSize);
  const [hasPets, setHasPets] = useState(initialPrefs.hasPets);
  const [kindOfPets, setKindOfPets] = useState(initialPrefs.kindOfPets);
  const [nameOfPets, setNameOfPets] = useState<string | null>(initialPrefs.nameOfPets);
  const [hasParking, setHasParking] = useState(initialPrefs.hasParking);
  const [noOfParkingSpots, setNoOfParkingSpots] = useState(initialPrefs.noOfParkingSpots);
  const [listOfVehicles, setListOfVehicles] = useState<string[]>(initialPrefs.listOfVehicles);
  const [hasSmoker, setHasSmoker] = useState(initialPrefs.hasSmoker);
  const [hasDisability, setHasDisability] = useState(initialPrefs.hasDisability);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedCities(initialPrefs.selectedCities);
    setBudgetMin(initialPrefs.budgetMin);
    setBudgetMax(initialPrefs.budgetMax);
    setBedroomCount(initialPrefs.bedroomCount);
    setHouseholdSize(initialPrefs.householdSize);
    setHasPets(initialPrefs.hasPets);
    setKindOfPets(initialPrefs.kindOfPets);
    setNameOfPets(initialPrefs.nameOfPets);
    setHasParking(initialPrefs.hasParking);
    setNoOfParkingSpots(initialPrefs.noOfParkingSpots);
    setListOfVehicles(initialPrefs.listOfVehicles);
    setHasSmoker(initialPrefs.hasSmoker);
    setHasDisability(initialPrefs.hasDisability);
  }, [initialPrefs]);

  const currentPrefs: TenantPreferences = useMemo(
    () => ({
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
    }),
    [
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
    ]
  );

  const isDirty = useMemo(() => !prefsEqual(initialPrefs, currentPrefs), [initialPrefs, currentPrefs]);

  const toggleCity = useCallback((city: string) => {
    setSelectedCities((prev) => (prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]));
  }, []);

  const toggleVehicle = useCallback((vehicle: string) => {
    setListOfVehicles((prev) => (prev.includes(vehicle) ? prev.filter((v) => v !== vehicle) : [...prev, vehicle]));
  }, []);

  const setPetsEnabled = useCallback((val: boolean) => {
    setHasPets(val);
    if (!val) {
      setKindOfPets("");
      setNameOfPets(null);
    }
  }, []);

  const setParkingEnabled = useCallback((val: boolean) => {
    setHasParking(val);
    if (!val) setListOfVehicles([]);
  }, []);

  const handleSelectPetKind = useCallback((val: string | null) => {
    const v = val ?? "";
    setKindOfPets(v);
    if (v !== "Other") setNameOfPets(null);
  }, []);

  const save = useCallback(async () => {
    if (!profile?.user_id) throw new Error("Not signed in");
    setIsSaving(true);
    try {
      const { error } = await supabase.from("users").update({ preferences: currentPrefs } as any).eq("user_id", profile.user_id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    } finally {
      setIsSaving(false);
    }
  }, [profile?.user_id, currentPrefs, queryClient]);

  const reset = useCallback(() => {
    setSelectedCities(initialPrefs.selectedCities);
    setBudgetMin(initialPrefs.budgetMin);
    setBudgetMax(initialPrefs.budgetMax);
    setBedroomCount(initialPrefs.bedroomCount);
    setHouseholdSize(initialPrefs.householdSize);
    setHasPets(initialPrefs.hasPets);
    setKindOfPets(initialPrefs.kindOfPets);
    setNameOfPets(initialPrefs.nameOfPets);
    setHasParking(initialPrefs.hasParking);
    setNoOfParkingSpots(initialPrefs.noOfParkingSpots);
    setListOfVehicles(initialPrefs.listOfVehicles);
    setHasSmoker(initialPrefs.hasSmoker);
    setHasDisability(initialPrefs.hasDisability);
  }, [initialPrefs]);

  return {
    profile,
    initialPrefs,
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
    hasPetsRaw: setHasPets,
    hasParkingRaw: setHasParking,
    toggleCity,
    toggleVehicle,
    save,
    reset,
  };
}
