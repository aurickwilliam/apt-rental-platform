export const APARTMENT_FLOOR_AREA: Record<string, { min: number; max: number }> = {
  Studio: { min: 18, max: 40 },
  "Condo Unit": { min: 25, max: 120 },
  House: { min: 40, max: 400 },
  Apartment: { min: 25, max: 100 },
  Townhouse: { min: 40, max: 200 },
}