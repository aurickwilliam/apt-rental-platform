export const APARTMENT_ROOM_LIMITS: Record<
  string,
  {
    bathrooms: { min: number; max: number };
    bedrooms: { min: number; max: number };
    maxOccupants: { min: number; max: number };
  }
> = {
  Studio: {
    bathrooms: { min: 1, max: 1 },
    bedrooms: { min: 1, max: 1 },
    maxOccupants: { min: 1, max: 2 },
  },
  "Condo Unit": {
    bathrooms: { min: 1, max: 3 },
    bedrooms: { min: 0, max: 3 },
    maxOccupants: { min: 1, max: 6 },
  },
  House: {
    bathrooms: { min: 1, max: 5 },
    bedrooms: { min: 1, max: 5 },
    maxOccupants: { min: 1, max: 10 },
  },
  Apartment: {
    bathrooms: { min: 1, max: 2 },
    bedrooms: { min: 0, max: 3 },
    maxOccupants: { min: 1, max: 6 },
  },
  Townhouse: {
    bathrooms: { min: 1, max: 3 },
    bedrooms: { min: 1, max: 4 },
    maxOccupants: { min: 1, max: 8 },
  },
};
