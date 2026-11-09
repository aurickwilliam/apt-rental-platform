import {
  APARTMENT_TYPES,
  CAMANAVA_CITIES,
  FLOOR_LEVELS,
  FURNISHED_TYPES,
  LEASE_DURATIONS,
} from "@repo/constants";

export const MIN_BUDGET = 1000;
export const MAX_BUDGET = 50000;
export const MIN_SIZE = 10;
export const MAX_SIZE = 300;

export type FilterState = {
  /** Cities to search; all four (the default) means no location filter. */
  locations: string[];
  budget: [number, number];
  unitTypes: string[];
  sortBy: "newest" | "price_asc" | "price_desc" | "most_popular";
  bedrooms: string;
  bathrooms: string;
  sizeRange: [number, number];
  furnishing: string[];
  floorLevel: string[];
  leaseDuration: string[];
  amenities: string[];
  verifiedOnly: boolean;
};

export const DEFAULT_FILTERS: FilterState = {
  locations: [...CAMANAVA_CITIES],
  budget: [MIN_BUDGET, MAX_BUDGET],
  sizeRange: [MIN_SIZE, MAX_SIZE],
  unitTypes: APARTMENT_TYPES,
  sortBy: "newest",
  bedrooms: "Any",
  bathrooms: "Any",
  furnishing: FURNISHED_TYPES,
  floorLevel: FLOOR_LEVELS,
  leaseDuration: LEASE_DURATIONS,
  amenities: [],
  verifiedOnly: false,
};
