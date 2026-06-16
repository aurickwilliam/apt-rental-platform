import { create } from "zustand";

export type PersonalizationStep1 = {
  selectedCities: string[];
};

export type PersonalizationStep2 = {
  budgetMin: number;
  budgetMax: number;
};

export type PersonalizationStep3 = {
  bedroomCount: string | null;
};

export type PersonalizationStep4 = {
  householdSize: string | null;
};

export type PersonalizationStep5 = {
  hasPets: boolean;
  kindOfPets: string;
  nameOfPets: string | null;
  hasParking: boolean;
  noOfParkingSpots: number;
  listOfVehicles: string[];
  hasSmoker: boolean;
  hasDisability: boolean;
};

// Combine all steps into a single state type for the store
export type PersonalizationState = PersonalizationStep1 &
  PersonalizationStep2 &
  PersonalizationStep3 &
  PersonalizationStep4 &
  PersonalizationStep5;

const DEFAULT_STATE: PersonalizationState = {
  // Step 1
  selectedCities: [],

  // Step 2
  budgetMin: 5_000,
  budgetMax: 100_000,

  // Step 3
  bedroomCount: null,

  // Step 4
  householdSize: null,

  // Step 5
  hasPets: false,
  kindOfPets: "",
  nameOfPets: null,
  hasParking: false,
  noOfParkingSpots: 1,
  listOfVehicles: [],
  hasSmoker: false,
  hasDisability: false,
};

type PersonalizationActions = {
  // Step 1
  toggleCity: (city: string) => void;

  // Step 2
  setBudgetRange: (min: number, max: number) => void;

  // Step 3
  setBedroomCount: (count: string) => void;

  // Step 4
  setHouseholdSize: (size: string) => void;

  // Step 5
  setHasPets: (value: boolean) => void;
  setKindOfPets: (value: string) => void;
  setNameOfPets: (value: string | null) => void;
  setHasParking: (value: boolean) => void;
  setNoOfParkingSpots: (value: number) => void;
  toggleVehicle: (vehicle: string) => void;
  setHasSmoker: (value: boolean) => void;
  setHasDisability: (value: boolean) => void;

  // Utility
  reset: () => void;
};

export const usePersonalizationStore = create<
  PersonalizationState & PersonalizationActions
>((set) => ({
  // All the states
  ...DEFAULT_STATE,

  // Step 1
  toggleCity: (city) =>
    set((state) => ({
      selectedCities: state.selectedCities.includes(city)
        ? state.selectedCities.filter((c) => c !== city)
        : [...state.selectedCities, city],
    })),

  // Step 2
  setBudgetRange: (min, max) =>
    set({ budgetMin: min, budgetMax: max }),

  // Step 3
  setBedroomCount: (count) =>
    set({ bedroomCount: count }),

  // Step 4
  setHouseholdSize: (size) =>
    set({ householdSize: size }),

  // Step 5
  setHasPets: (value) =>
    set((state) => ({
      hasPets: value,
      // Clear pet details when toggled off
      kindOfPets: value ? state.kindOfPets : "",
      nameOfPets: value ? state.nameOfPets : null,
    })),

  setKindOfPets: (value) =>
    set((state) => ({
      kindOfPets: value,
      // Clear custom pet name if switching away from "Other"
      nameOfPets: value === "Other" ? state.nameOfPets : null,
    })),

  setNameOfPets: (value) =>
    set({ nameOfPets: value }),

  setHasParking: (value) =>
    set((state) => ({
      hasParking: value,
      // Clear parking details when toggled off
      noOfParkingSpots: value ? state.noOfParkingSpots : 1,
      listOfVehicles: value ? state.listOfVehicles : [],
    })),

  setNoOfParkingSpots: (value) =>
    set({ noOfParkingSpots: value }),

  toggleVehicle: (vehicle) =>
    set((state) => ({
      listOfVehicles: state.listOfVehicles.includes(vehicle)
        ? state.listOfVehicles.filter((v) => v !== vehicle)
        : [...state.listOfVehicles, vehicle],
    })),

  setHasSmoker: (value) =>
    set({ hasSmoker: value }),

  setHasDisability: (value) =>
    set({ hasDisability: value }),

  // Reset to defaults
  reset: () => set(DEFAULT_STATE),
}));