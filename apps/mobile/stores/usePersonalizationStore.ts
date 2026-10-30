import { create } from "zustand";
import { OTHER_PET, minimumPetCount } from "@repo/constants";

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
  kindOfPets: string[];
  noOfPets: number;
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
  kindOfPets: [],
  noOfPets: 1,
  nameOfPets: null,
  hasParking: false,
  noOfParkingSpots: 1,
  listOfVehicles: [],
  hasSmoker: false,
  hasDisability: false,
};

export type YesNoQuestion = 'hasPets' | 'hasParking' | 'hasSmoker' | 'hasDisability';

// The Yes/No answers above default to false, so which questions the user has
// actually answered is tracked apart: nothing is preselected, and the last
// step is optional (an unanswered question is saved as No).
type AnsweredQuestions = Record<YesNoQuestion, boolean>;

const DEFAULT_ANSWERED: AnsweredQuestions = {
  hasPets: false,
  hasParking: false,
  hasSmoker: false,
  hasDisability: false,
};

type PersonalizationActions = {
  // Step 1
  toggleCity: (city: string) => void;

  // Step 2
  setBudgetRange: (min: number, max: number) => void;

  // Step 3
  setBedroomCount: (count: string | null) => void;

  // Step 4
  setHouseholdSize: (size: string | null) => void;

  // Step 5
  setHasPets: (value: boolean) => void;
  setKindOfPets: (value: string[]) => void;
  setNoOfPets: (value: number) => void;
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
  PersonalizationState & PersonalizationActions & { answered: AnsweredQuestions }
>((set) => ({
  // All the states
  ...DEFAULT_STATE,
  answered: DEFAULT_ANSWERED,

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
      answered: { ...state.answered, hasPets: true },
      // Clear pet details when toggled off
      kindOfPets: value ? state.kindOfPets : [],
      noOfPets: value ? state.noOfPets : 1,
      nameOfPets: value ? state.nameOfPets : null,
    })),

  setKindOfPets: (value) =>
    set((state) => ({
      kindOfPets: value,
      // Never fewer pets than kinds: raise the count as kinds are added
      noOfPets: Math.max(state.noOfPets, minimumPetCount(value.length)),
      // Clear custom pet name if "Other" is no longer selected
      nameOfPets: value.includes(OTHER_PET) ? state.nameOfPets : null,
    })),

  setNoOfPets: (value) =>
    set({ noOfPets: value }),

  setNameOfPets: (value) =>
    set({ nameOfPets: value }),

  setHasParking: (value) =>
    set((state) => ({
      hasParking: value,
      answered: { ...state.answered, hasParking: true },
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
    set((state) => ({
      hasSmoker: value,
      answered: { ...state.answered, hasSmoker: true },
    })),

  setHasDisability: (value) =>
    set((state) => ({
      hasDisability: value,
      answered: { ...state.answered, hasDisability: true },
    })),

  // Reset to defaults
  reset: () => set({ ...DEFAULT_STATE, answered: DEFAULT_ANSWERED }),
}));